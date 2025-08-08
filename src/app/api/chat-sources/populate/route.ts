import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/supabase'

export async function POST(req: NextRequest) {
    try {
        const user = await db.getCurrentUser()
        if (!user) {
            return NextResponse.json(
                { error: 'User not authenticated' },
                { status: 401 }
            )
        }

        let createdCount = 0

        // Get existing documents and create chat sources
        try {
            const documents = await db.getDocuments()
            for (const doc of documents) {
                await db.createChatSourceForContent('document', doc.id, doc.name)
                createdCount++
            }
        } catch (error) {
            console.error('Error creating chat sources for documents:', error)
        }

        // Get existing notebook entries and create chat sources
        try {
            const notebookEntries = await db.getNotebookEntries()
            for (const entry of notebookEntries) {
                await db.createChatSourceForContent('notebook', entry.id, entry.title)
                createdCount++
            }
        } catch (error) {
            console.error('Error creating chat sources for notebook entries:', error)
        }

        // Get existing URLs and create chat sources
        try {
            const urls = await db.getSourceUrls()
            for (const url of urls) {
                await db.createChatSourceForContent('url', url.id, url.title || url.url)
                createdCount++
            }
        } catch (error) {
            console.error('Error creating chat sources for URLs:', error)
        }

        // Get existing YouTube videos and create chat sources
        try {
            const videos = await db.getYouTubeVideos()
            for (const video of videos) {
                await db.createChatSourceForContent('youtube', video.id, video.title)
                createdCount++
            }
        } catch (error) {
            console.error('Error creating chat sources for YouTube videos:', error)
        }

        return NextResponse.json({
            success: true,
            message: `Created ${createdCount} chat source entries for existing content`,
            createdCount
        })

    } catch (error) {
        console.error('Populate chat sources error:', error)
        return NextResponse.json(
            { error: 'Failed to populate chat sources' },
            { status: 500 }
        )
    }
} 