import { NextRequest, NextResponse } from 'next/server'
import { db, supabase } from '@/lib/supabase'

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const videoId = params.id

        if (!videoId) {
            return NextResponse.json(
                { error: 'Video ID is required' },
                { status: 400 }
            )
        }

        // Get current user for authentication
        const user = await db.getCurrentUser()
        if (!user) {
            return NextResponse.json(
                { error: 'User not authenticated' },
                { status: 401 }
            )
        }

        // Delete the video from the database
        const { error } = await supabase
            .from('youtube_videos')
            .delete()
            .eq('id', videoId)
            .eq('owner_id', user.id) // Ensure user can only delete their own videos

        if (error) {
            console.error('Error deleting YouTube video:', error)
            return NextResponse.json(
                { error: 'Failed to delete video' },
                { status: 500 }
            )
        }

        // Also delete associated context chunks
        try {
            await supabase
                .from('context_chunks')
                .delete()
                .eq('metadata->>source_type', 'youtube')
                .eq('metadata->>source_id', videoId)
                .eq('owner_id', user.id)
        } catch (chunkError) {
            console.error('Error deleting context chunks:', chunkError)
            // Don't fail the main operation if chunk deletion fails
        }

        return NextResponse.json({
            success: true,
            message: 'YouTube video deleted successfully'
        })

    } catch (error) {
        console.error('Delete YouTube video error:', error)
        return NextResponse.json(
            { error: 'Failed to delete YouTube video' },
            { status: 500 }
        )
    }
} 