import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/supabase'

export async function GET() {
    try {
        const chatSources = await db.getChatSources()
        return NextResponse.json({
            success: true,
            data: chatSources
        })
    } catch (error) {
        console.error('Get chat sources error:', error)
        return NextResponse.json(
            { error: 'Failed to get chat sources' },
            { status: 500 }
        )
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { id, selected } = await req.json()

        if (!id || selected === undefined) {
            return NextResponse.json(
                { error: 'ID and selected status are required' },
                { status: 400 }
            )
        }

        const updatedChatSource = await db.updateChatSource(id, { selected })

        return NextResponse.json({
            success: true,
            data: updatedChatSource,
            message: 'Chat source updated successfully'
        })
    } catch (error) {
        console.error('Update chat source error:', error)
        return NextResponse.json(
            { error: 'Failed to update chat source' },
            { status: 500 }
        )
    }
} 