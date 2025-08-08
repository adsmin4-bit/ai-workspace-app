import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json()

        if (!url) {
            return NextResponse.json(
                { error: 'YouTube URL is required' },
                { status: 400 }
            )
        }

        // Extract video ID from YouTube URL
        const videoIdMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)

        if (!videoIdMatch) {
            return NextResponse.json(
                { error: 'Invalid YouTube URL' },
                { status: 400 }
            )
        }

        const videoId = videoIdMatch[1]
        const apiKey = process.env.YOUTUBE_API_KEY

        if (!apiKey) {
            // Fallback: Return video information without transcript
            return NextResponse.json({
                success: true,
                videoId: videoId,
                url: url,
                title: `YouTube Video (ID: ${videoId})`,
                description: 'Video information available. Add YouTube API key for full transcript.',
                transcript: `This is a placeholder transcript for the YouTube video at ${url}. To get real transcripts, add your YouTube API key to the environment variables.`,
                duration: 0,
                source: 'placeholder'
            })
        }

        // Get video information from YouTube Data API
        const videoInfoUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet,contentDetails,statistics`

        const response = await fetch(videoInfoUrl)
        const data = await response.json()

        if (!data.items || data.items.length === 0) {
            return NextResponse.json(
                { error: 'Video not found or not accessible' },
                { status: 404 }
            )
        }

        const video = data.items[0]
        const snippet = video.snippet
        const contentDetails = video.contentDetails

        // Convert duration from ISO 8601 format to seconds
        const durationMatch = contentDetails.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
        let duration = 0
        if (durationMatch) {
            const hours = parseInt(durationMatch[1] || '0')
            const minutes = parseInt(durationMatch[2] || '0')
            const seconds = parseInt(durationMatch[3] || '0')
            duration = hours * 3600 + minutes * 60 + seconds
        }

        // For now, we'll return video information with a note about transcripts
        // Real transcript extraction would require additional API calls or services
        const transcript = `Video Title: ${snippet.title}\n\nDescription: ${snippet.description}\n\nDuration: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}\n\nNote: Full transcript extraction requires additional API integration. This shows video metadata.`

        return NextResponse.json({
            success: true,
            videoId: videoId,
            url: url,
            title: snippet.title,
            description: snippet.description,
            transcript: transcript,
            duration: duration,
            thumbnail: snippet.thumbnails?.high?.url,
            channelTitle: snippet.channelTitle,
            publishedAt: snippet.publishedAt,
            viewCount: video.statistics?.viewCount,
            source: 'YouTube Data API'
        })
    } catch (error) {
        console.error('YouTube transcription error:', error)
        return NextResponse.json(
            { error: 'Failed to process YouTube video' },
            { status: 500 }
        )
    }
} 