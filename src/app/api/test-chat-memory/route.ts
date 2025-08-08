import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/supabase'

export async function GET() {
    try {
        const user = await db.getCurrentUser()

        // Test chat memory operations
        const testResults = {
            user: user.id,
            timestamp: new Date().toISOString(),
            status: 'Chat Memory Test Endpoint Ready'
        }

        return NextResponse.json({
            success: true,
            data: testResults
        })
    } catch (error) {
        console.error('Test chat memory error:', error)
        return NextResponse.json(
            { error: 'Failed to test chat memory' },
            { status: 500 }
        )
    }
}

export async function POST(req: NextRequest) {
    try {
        const { action, sessionId, content, role } = await req.json()

        switch (action) {
            case 'save':
                // Test saving to chat memory
                const savedMemory = await db.saveChatMemory(sessionId, role, content)
                return NextResponse.json({
                    success: true,
                    data: savedMemory,
                    message: 'Chat memory saved successfully'
                })

            case 'search':
                // Test searching chat memory
                const user = await db.getCurrentUser()
                const searchResults = await db.searchChatMemory([0.1, 0.2, 0.3], user.id, 5, 0.5)
                return NextResponse.json({
                    success: true,
                    data: searchResults,
                    message: 'Chat memory search completed'
                })

            case 'clear':
                // Test clearing chat memory
                await db.clearChatMemory(sessionId)
                return NextResponse.json({
                    success: true,
                    message: 'Chat memory cleared successfully'
                })

            default:
                return NextResponse.json(
                    { error: 'Invalid action. Use: save, search, or clear' },
                    { status: 400 }
                )
        }
    } catch (error) {
        console.error('Test chat memory error:', error)
        return NextResponse.json(
            { error: 'Failed to test chat memory' },
            { status: 500 }
        )
    }
} 