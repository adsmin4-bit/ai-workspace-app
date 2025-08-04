import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
  try {
    const { sessionId, role, content, metadata } = await req.json()

    if (!sessionId || !role || !content) {
      return NextResponse.json(
        { error: 'Session ID, role, and content are required' },
        { status: 400 }
      )
    }

    // Use the sessionId directly as the chat_session_id
    const message = await db.addMessage(sessionId, role, content, metadata)
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