import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const { content, title } = await req.json()

        if (!content) {
            return NextResponse.json(
                { success: false, error: 'Missing content' },
                { status: 400 }
            )
        }

        // Generate tags using OpenAI
        const tags = await generateTagsWithOpenAI(content, title)

        return NextResponse.json({
            success: true,
            data: { tags }
        })

    } catch (error) {
        console.error('Error generating tags:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to generate tags' },
            { status: 500 }
        )
    }
}

async function generateTagsWithOpenAI(content: string, title?: string): Promise<string[]> {
    const prompt = `Analyze the following content and generate 3-5 relevant topic tags. 
  
${title ? `Title: ${title}\n\n` : ''}Content:
${content.substring(0, 4000)} // Limit content to avoid token limits

Please provide only the tags as a comma-separated list. Each tag should be 1-3 words maximum. Focus on the main topics, technologies, concepts, or themes discussed in the content.

Example format: AI, Machine Learning, Neural Networks, Deep Learning, Computer Vision`

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
                    content: 'You are a helpful assistant that generates relevant topic tags for content. Provide only the tags as a comma-separated list.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 200,
            temperature: 0.3
        })
    })

    if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const tagsText = data.choices[0]?.message?.content || ''

    // Parse the comma-separated tags and clean them up
    const tags = tagsText
        .split(',')
        .map((tag: string) => tag.trim())
        .filter((tag: string) => tag.length > 0)
        .slice(0, 5) // Limit to 5 tags maximum

    return tags
} 