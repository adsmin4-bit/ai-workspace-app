import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/supabase'

export async function GET() {
    try {
        // Test getting chat sources
        const chatSources = await db.getChatSources()

        // Test getting selected chat sources
        const selectedChatSources = await db.getSelectedChatSources()

        return NextResponse.json({
            success: true,
            data: {
                allChatSources: chatSources,
                selectedChatSources: selectedChatSources,
                totalCount: chatSources.length,
                selectedCount: selectedChatSources.length
            }
        })
    } catch (error) {
        console.error('Test chat sources error:', error)
        return NextResponse.json(
            { error: 'Failed to test chat sources' },
            { status: 500 }
        )
    }
}

export async function POST(req: NextRequest) {
    try {
        // Test creating a chat source
        const testChatSource = await db.createChatSource({
            type: 'document',
            source_id: 'test-source-id',
            name: 'Test Document',
            selected: true
        })

        return NextResponse.json({
            success: true,
            data: testChatSource,
            message: 'Test chat source created successfully'
        })
    } catch (error) {
        console.error('Test create chat source error:', error)
        return NextResponse.json(
            { error: 'Failed to create test chat source' },
            { status: 500 }
        )
    }
} 