import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/supabase'

export async function POST(req: NextRequest) {
    try {
        const { sessionId } = await req.json()

        if (!sessionId) {
            return NextResponse.json(
                { error: 'Session ID is required' },
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

        // Clear chat memory for the session
        await db.clearChatMemory(sessionId)

        return NextResponse.json({
            success: true,
            message: 'Chat memory cleared successfully'
        })
    } catch (error) {
        console.error('Clear chat memory error:', error)
        return NextResponse.json(
            { error: 'Failed to clear chat memory' },
            { status: 500 }
        )
    }
}

export async function DELETE(req: NextRequest) {
    try {
        // Clear all chat memory for the current user
        await db.clearAllChatMemory()

        return NextResponse.json({
            success: true,
            message: 'All chat memory cleared successfully'
        })
    } catch (error) {
        console.error('Clear all chat memory error:', error)
        return NextResponse.json(
            { error: 'Failed to clear all chat memory' },
            { status: 500 }
        )
    }
} 