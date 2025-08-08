import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/supabase'

export async function POST(req: NextRequest) {
    try {
        const { sourceId, sourceType, sourceTitle, sourceContent } = await req.json()

        if (!sourceId || !sourceType || !sourceContent) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Check if summary already exists
        const existingSummary = await db.getSummary(sourceId, sourceType)
        if (existingSummary) {
            return NextResponse.json(
                { success: false, error: 'Summary already exists for this source' },
                { status: 409 }
            )
        }

        // Generate summary using OpenAI
        const summary = await generateSummaryWithOpenAI(sourceContent, sourceTitle)

        // Get current user for owner_id
        const user = await db.getCurrentUser()
        if (!user) {
            return NextResponse.json(
                { error: 'User not authenticated' },
                { status: 401 }
            )
        }

        // Save to database
        const savedSummary = await db.createSummary({
            source_id: sourceId,
            source_type: sourceType,
            summary: summary.summary,
            word_count: summary.wordCount,
            model_used: 'gpt-4',
            owner_id: user.id,
            metadata: {
                source_title: sourceTitle,
                generation_time: summary.generationTime
            }
        })

        return NextResponse.json({
            success: true,
            data: savedSummary
        })

    } catch (error) {
        console.error('Error generating summary:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to generate summary' },
            { status: 500 }
        )
    }
}

async function generateSummaryWithOpenAI(content: string, title?: string): Promise<{
    summary: string
    wordCount: number
    generationTime: number
}> {
    const startTime = Date.now()

    const prompt = `Please provide a comprehensive summary of the following content. 
  
${title ? `Title: ${title}\n\n` : ''}Content:
${content.substring(0, 8000)} // Limit content to avoid token limits

Please provide a clear, well-structured summary that captures the main points, key insights, and important details. The summary should be informative and useful for someone who wants to understand the content without reading the full text.`

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
                    content: 'You are a helpful assistant that creates clear, comprehensive summaries of content. Focus on the main points and key insights.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 1000,
            temperature: 0.3
        })
    })

    if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const summary = data.choices[0]?.message?.content || 'Failed to generate summary'
    const wordCount = summary.split(/\s+/).length
    const generationTime = Date.now() - startTime

    return { summary, wordCount, generationTime }
} 