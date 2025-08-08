import { NextRequest, NextResponse } from 'next/server'
import { supabase, db } from '@/lib/supabase'

// Test endpoint to verify the route is working
export async function GET() {
  console.log('GET request to /api/documents/upload')
  return NextResponse.json({
    message: 'Document upload endpoint is working',
    supportedTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
    maxSize: '10MB'
  })
}

export async function POST(request: NextRequest) {
  console.log('POST request to /api/documents/upload')

  try {
    console.log('Document upload request received')

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      console.error('No file provided in request')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log('File received:', {
      name: file.name,
      type: file.type,
      size: file.size
    })

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    if (!allowedTypes.includes(file.type)) {
      console.error('Invalid file type:', file.type)
      return NextResponse.json({
        error: 'Invalid file type. Supported types: PDF, DOCX, TXT',
        receivedType: file.type,
        allowedTypes
      }, { status: 400 })
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      console.error('File too large:', file.size)
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    // Generate unique filename using crypto.randomUUID()
    const fileId = crypto.randomUUID()
    const fileExtension = file.name.split('.').pop()
    const fileName = `${fileId}.${fileExtension}`

    console.log('Processing file:', fileName)

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Extract text content based on file type
    let content = ''
    let fileType = 'txt'
    let pageCount = null

    try {
      if (file.type === 'application/pdf') {
        fileType = 'pdf'
        console.log('Processing PDF file')

        // Dynamic import to avoid issues
        const pdf = await import('pdf-parse')
        const pdfData = await pdf.default(buffer)
        content = pdfData.text
        pageCount = pdfData.numpages
        console.log('PDF processed, pages:', pageCount, 'content length:', content.length)

      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        fileType = 'docx'
        console.log('Processing DOCX file')

        // Dynamic import to avoid issues
        const mammoth = await import('mammoth')
        const result = await mammoth.default.extractRawText({ buffer })
        content = result.value
        console.log('DOCX processed, content length:', content.length)

      } else if (file.type === 'text/plain') {
        fileType = 'txt'
        console.log('Processing TXT file')
        content = buffer.toString('utf-8')
        console.log('TXT processed, content length:', content.length)
      }
    } catch (parseError) {
      console.error('Error parsing file content:', parseError)

      // Fallback content for parsing errors
      if (file.type === 'application/pdf') {
        content = `PDF file: ${file.name}\nSize: ${file.size} bytes\nError: Could not parse PDF content. Please ensure the file is not corrupted.`
        pageCount = 1
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        content = `DOCX file: ${file.name}\nSize: ${file.size} bytes\nError: Could not parse DOCX content. Please ensure the file is not corrupted.`
      } else {
        content = `Text file: ${file.name}\nSize: ${file.size} bytes\nError: Could not read text content.`
      }

      console.log('Using fallback content due to parsing error')
    }

    if (!content.trim()) {
      console.warn('No content extracted from file')
      content = '[No text content found in file]'
    }

    console.log('Saving document to database with ID:', fileId)

    // Get current user for owner_id
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Save to Supabase database
    const documentData = {
      id: fileId,
      name: file.name,
      type: fileType,
      size: file.size,
      content: content,
      processed: true,
      owner_id: user.id,
      metadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        pages: pageCount,
        fileExtension: fileExtension,
        mimeType: file.type,
      },
    }

    console.log('Document data to insert:', {
      id: documentData.id,
      name: documentData.name,
      type: documentData.type,
      size: documentData.size,
      contentLength: documentData.content.length,
      processed: documentData.processed
    })

    const { data: document, error } = await supabase
      .from('documents')
      .insert(documentData)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        {
          error: 'Failed to save document to database',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      )
    }

    console.log('Document saved successfully:', document.id)

    // NEW: Auto-generate tags for the document
    let generatedTags: string[] = []
    try {
      if (content && content.trim()) {
        const tagResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tags/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: content.substring(0, 4000), // Limit content for tag generation
            title: file.name
          })
        })

        if (tagResponse.ok) {
          const tagData = await tagResponse.json()
          if (tagData.success && tagData.data.tags.length > 0) {
            generatedTags = tagData.data.tags

            // Update document with generated tags
            const { error: updateError } = await supabase
              .from('documents')
              .update({ tags: generatedTags })
              .eq('id', document.id)

            if (updateError) {
              console.error('Error updating document with tags:', updateError)
            } else {
              console.log('Document updated with generated tags:', generatedTags)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error generating tags:', error)
      // Don't fail the upload if tag generation fails
    }

    // NEW: Automatically save document content to RAG memory
    try {
      if (content && content.trim()) {
        const { saveChunksToMemory } = await import('@/lib/rag-utils')
        await saveChunksToMemory({
          sourceType: 'document',
          sourceId: document.id,
          title: document.name,
          fullText: content,
          metadata: {
            type: document.type,
            size: document.size,
            pages: pageCount,
            fileExtension: fileExtension,
            mimeType: file.type,
            uploadedAt: document.created_at,
            tags: generatedTags // Include generated tags in metadata
          }
        })
        console.log('Document content saved to RAG memory')
      }
    } catch (error) {
      console.error('Error saving document to RAG memory:', error)
      // Don't fail the upload if RAG saving fails
    }

    // NEW: Create chat source entry for the document
    try {
      await db.createChatSourceForContent('document', document.id, document.name)
      console.log('Chat source created for document:', document.id)
    } catch (error) {
      console.error('Error creating chat source for document:', error)
      // Don't fail the upload if chat source creation fails
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        name: document.name,
        type: document.type,
        size: document.size,
        content: document.content?.substring(0, 1000) + (document.content && document.content.length > 1000 ? '...' : ''),
        processed: document.processed,
        uploadedAt: document.created_at,
        metadata: document.metadata,
        tags: generatedTags, // Include generated tags in response
      },
      message: 'Document uploaded and processed successfully',
    })

  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 