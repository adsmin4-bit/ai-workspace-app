import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/supabase'

export async function POST(req: NextRequest) {
    try {
        const { message, sourceId, sourceType, systemPrompt } = await req.json()

        if (!message || !sourceId || !sourceType) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Get the source content based on type
        let sourceContent = ''
        let sourceTitle = ''

        switch (sourceType) {
            case 'document':
                const document = await db.getDocument(sourceId)
                if (!document) {
                    return NextResponse.json(
                        { success: false, error: 'Document not found' },
                        { status: 404 }
                    )
                }
                sourceContent = document.content || ''
                sourceTitle = document.name
                break

            case 'youtube':
                const video = await db.getYouTubeVideo(sourceId)
                if (!video) {
                    return NextResponse.json(
                        { success: false, error: 'Video not found' },
                        { status: 404 }
                    )
                }
                sourceContent = video.transcript || video.description || ''
                sourceTitle = video.title
                break

            case 'url':
                const url = await db.getWebSource(sourceId)
                if (!url) {
                    return NextResponse.json(
                        { success: false, error: 'URL not found' },
                        { status: 404 }
                    )
                }
                sourceContent = url.content || ''
                sourceTitle = url.title
                break

            default:
                return NextResponse.json(
                    { success: false, error: 'Invalid source type' },
                    { status: 400 }
                )
        }

        if (!sourceContent) {
            return NextResponse.json(
                { success: false, error: 'No content available for this source' },
                { status: 400 }
            )
        }

        // Create a custom system prompt for single-source chat
        const customSystemPrompt = systemPrompt || `You are now answering based ONLY on this ${sourceType}: "${sourceTitle}". 
    
Please provide accurate answers based solely on the content provided. If the information is not available in the source, please say so rather than making assumptions.

Source content:
${sourceContent.substring(0, 8000)} // Limit content to avoid token limits`

        // Call OpenAI with the single source context
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: customSystemPrompt
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                max_tokens: 2000,
                temperature: 0.7,
                stream: true
            })
        })

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`)
        }

        // Return the streaming response
        return new Response(response.body, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        })

    } catch (error) {
        console.error('Error in single-source chat:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to process chat request' },
            { status: 500 }
        )
    }
} 