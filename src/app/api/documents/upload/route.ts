import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import pdf from 'pdf-parse'
import mammoth from 'mammoth'
import { db } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 })
    }

    // Generate unique filename
    const fileId = uuidv4()
    const fileExtension = file.name.split('.').pop()
    const fileName = `${fileId}.${fileExtension}`

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Extract text content based on file type
    let content = ''
    let fileType = 'txt'

    if (file.type === 'application/pdf') {
      fileType = 'pdf'
      const pdfData = await pdf(buffer)
      content = pdfData.text
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      fileType = 'docx'
      const result = await mammoth.extractRawText({ buffer })
      content = result.value
    } else if (file.type === 'text/plain') {
      fileType = 'txt'
      content = buffer.toString('utf-8')
    }

    // Create document record in database
    const document = await db.createDocument({
      name: file.name,
      type: fileType as 'pdf' | 'docx' | 'txt',
      size: file.size,
      content,
      processed: true,
      metadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      document,
      message: 'Document uploaded and processed successfully',
    })

  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    )
  }
} 