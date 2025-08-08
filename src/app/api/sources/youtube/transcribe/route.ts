import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/supabase'
import { saveChunksToMemory } from '@/lib/rag-utils'

// YouTube transcript extraction using youtube-transcript package
async function getYouTubeTranscript(url: string) {
    try {
        // Extract video ID from URL
        const videoId = extractVideoId(url)
        if (!videoId) {
            throw new Error('Invalid YouTube URL')
        }

        // Use youtube-transcript package
        const { YoutubeTranscript } = await import('youtube-transcript')

        const transcript = await YoutubeTranscript.fetchTranscript(videoId)

        // Combine all transcript parts into a single text
        const fullText = transcript
            .map((part: any) => part.text)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim()

        return {
            transcript: fullText,
            duration: transcript.length > 0 ? transcript[transcript.length - 1].offset / 1000 : 0,
            parts: transcript
        }
    } catch (error) {
        console.error('YouTube transcript error:', error)
        throw new Error('Failed to extract transcript from YouTube video')
    }
}

function extractVideoId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /youtube\.com\/v\/([^&\n?#]+)/,
        /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ]

    for (const pattern of patterns) {
        const match = url.match(pattern)
        if (match) {
            return match[1]
        }
    }

    return null
}

async function getVideoMetadata(url: string) {
    try {
        // Basic metadata extraction - in a real implementation, you might use a more robust method
        const videoId = extractVideoId(url)
        if (!videoId) {
            return {
                title: 'Unknown Video',
                description: '',
                duration: 0
            }
        }

        // For now, return basic info - in production you might use YouTube Data API
        return {
            title: `YouTube Video (${videoId})`,
            description: `Transcript from YouTube video: ${url}`,
            duration: 0
        }
    } catch (error) {
        console.error('Error getting video metadata:', error)
        return {
            title: 'Unknown Video',
            description: '',
            duration: 0
        }
    }
}

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json()

        if (!url) {
            return NextResponse.json(
                { error: 'YouTube URL is required' },
                { status: 400 }
            )
        }

        // Validate YouTube URL
        if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
            return NextResponse.json(
                { error: 'Invalid YouTube URL' },
                { status: 400 }
            )
        }

        // Get video metadata
        const metadata = await getVideoMetadata(url)

        // Extract transcript
        const transcriptData = await getYouTubeTranscript(url)

        // Get current user for owner_id
        const user = await db.getCurrentUser()
        if (!user) {
            return NextResponse.json(
                { error: 'User not authenticated' },
                { status: 401 }
            )
        }

        // Save to YouTube videos table
        const video = await db.createYouTubeVideo({
            url,
            title: metadata.title,
            description: metadata.description,
            transcript: transcriptData.transcript,
            duration: Math.round(transcriptData.duration),
            metadata: {
                ...metadata,
                transcriptParts: transcriptData.parts,
                extractedAt: new Date().toISOString()
            },
            tags: [],
            include_in_memory: true,
            folder_id: null,
            context_weight: 100,
            owner_id: user.id
        })

        // Save transcript chunks to RAG memory
        if (transcriptData.transcript) {
            await saveChunksToMemory({
                sourceType: 'url',
                sourceId: video.id,
                title: metadata.title,
                fullText: transcriptData.transcript,
                metadata: {
                    url,
                    video_id: extractVideoId(url),
                    duration: transcriptData.duration,
                    extracted_at: new Date().toISOString(),
                    source_type: 'youtube'
                }
            })
        }

        // NEW: Create chat source entry for the YouTube video
        try {
            await db.createChatSourceForContent('youtube', video.id, metadata.title)
            console.log('Chat source created for YouTube video:', video.id)
        } catch (error) {
            console.error('Error creating chat source for YouTube video:', error)
            // Don't fail the transcription if chat source creation fails
        }

        return NextResponse.json({
            success: true,
            message: 'YouTube video transcribed and saved successfully',
            data: {
                video,
                transcriptLength: transcriptData.transcript.length,
                duration: transcriptData.duration
            }
        })

    } catch (error) {
        console.error('YouTube transcription error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to transcribe YouTube video' },
            { status: 500 }
        )
    }
}

export async function GET() {
    try {
        const videos = await db.getYouTubeVideos()
        return NextResponse.json({
            success: true,
            data: videos
        })
    } catch (error) {
        console.error('Get YouTube videos error:', error)
        return NextResponse.json(
            { error: 'Failed to get YouTube videos' },
            { status: 500 }
        )
    }
} 