import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/supabase'

export async function GET() {
    try {
        const entries = await db.getNotebookEntries()
        return NextResponse.json({ success: true, entries })
    } catch (error) {
        console.error('Get notebook entries error:', error)
        return NextResponse.json(
            { error: 'Failed to get notebook entries' },
            { status: 500 }
        )
    }
}

export async function POST(req: NextRequest) {
    try {
        const entry = await req.json()

        if (!entry.title || !entry.content || !entry.type) {
            return NextResponse.json(
                { error: 'Title, content, and type are required' },
                { status: 400 }
            )
        }

        // Get current user for owner_id
        const user = await db.getCurrentUser()
        if (!user) {
            return NextResponse.json(
                { error: 'User not authenticated' },
                { status: 401 }
            )
        }

        const newEntry = await db.createNotebookEntry({
            ...entry,
            owner_id: user.id
        })

        // NEW: Automatically save notebook entry to RAG memory
        try {
            if (entry.content && entry.content.trim()) {
                const { saveChunksToMemory } = await import('@/lib/rag-utils')
                await saveChunksToMemory({
                    sourceType: 'note',
                    sourceId: newEntry.id,
                    title: entry.title,
                    fullText: entry.content,
                    metadata: {
                        type: entry.type,
                        tags: entry.tags,
                        related_chat_id: entry.related_chat_id,
                        related_document_id: entry.related_document_id,
                        created_at: newEntry.created_at
                    }
                })
                console.log('Notebook entry saved to RAG memory')
            }
        } catch (error) {
            console.error('Error saving notebook entry to RAG memory:', error)
            // Don't fail the notebook creation if RAG saving fails
        }

        // NEW: Create chat source entry for the notebook entry
        try {
            await db.createChatSourceForContent('notebook', newEntry.id, entry.title)
            console.log('Chat source created for notebook entry:', newEntry.id)
        } catch (error) {
            console.error('Error creating chat source for notebook entry:', error)
            // Don't fail the notebook creation if chat source creation fails
        }

        return NextResponse.json({
            success: true,
            entry: newEntry,
            message: 'Notebook entry created successfully'
        })
    } catch (error) {
        console.error('Create notebook entry error:', error)
        return NextResponse.json(
            { error: 'Failed to create notebook entry' },
            { status: 500 }
        )
    }
} 