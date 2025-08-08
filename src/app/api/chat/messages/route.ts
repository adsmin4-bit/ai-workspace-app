import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { sessionId, role, content, metadata } = await req.json()

    if (!sessionId || !role || !content) {
      return NextResponse.json(
        { error: 'Session ID, role, and content are required' },
        { status: 400 }
      )
    }

    // Validate that sessionId is a proper UUID
    if (!sessionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return NextResponse.json(
        { error: 'Invalid session ID format' },
        { status: 400 }
      )
    }

    // Use the sessionId directly as the chat_session_id
    const message = await db.addMessage(sessionId, role, content, metadata)

    // NEW: Automatically save chat messages to RAG memory (only assistant responses)
    if (role === 'assistant' && content && content.trim()) {
      try {
        const { saveChunksToMemory } = await import('@/lib/rag-utils')
        await saveChunksToMemory({
          sourceType: 'chat',
          sourceId: message.id,
          title: `Chat Response - Session ${sessionId}`,
          fullText: content,
          metadata: {
            session_id: sessionId,
            role: role,
            created_at: message.created_at,
            ...metadata
          }
        })
        console.log('Chat message saved to RAG memory')
      } catch (error) {
        console.error('Error saving chat message to RAG memory:', error)
        // Don't fail the message saving if RAG saving fails
      }
    }

    return NextResponse.json({ success: true, message })
  } catch (error) {
    console.error('Add message error:', error)
    return NextResponse.json(
      { error: 'Failed to add message' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const messages = await db.getMessages(sessionId)
    return NextResponse.json({ success: true, messages })
  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json(
      { error: 'Failed to get messages' },
      { status: 500 }
    )
  }
} 