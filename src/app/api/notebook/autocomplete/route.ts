import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/supabase'

export async function POST(req: NextRequest) {
    try {
        const { currentText, limit = 3 } = await req.json()

        if (!currentText || currentText.trim().length < 3) {
            return NextResponse.json({
                success: true,
                data: { suggestions: [] }
            })
        }

        // Get recent notebook entries for context
        const recentEntries = await db.getNotebookEntries()
        const recentContent = recentEntries
            .slice(0, 5) // Get last 5 entries
            .map(entry => entry.content)
            .join('\n\n')

        // Get recent documents for context
        const recentDocuments = await db.getDocuments()
        const documentContent = recentDocuments
            .slice(0, 3) // Get last 3 documents
            .map(doc => doc.content)
            .filter(Boolean)
            .join('\n\n')

        // Generate suggestions using OpenAI
        const suggestions = await generateAutocompleteSuggestions(
            currentText,
            recentContent,
            documentContent,
            limit
        )

        return NextResponse.json({
            success: true,
            data: { suggestions }
        })

    } catch (error) {
        console.error('Error generating autocomplete suggestions:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to generate suggestions' },
            { status: 500 }
        )
    }
}

async function generateAutocompleteSuggestions(
    currentText: string,
    recentEntries: string,
    documentContent: string,
    limit: number
): Promise<string[]> {
    const prompt = `Based on the current text being typed and the context from recent notebook entries and documents, suggest ${limit} natural continuations or completions.

Current text being typed: "${currentText}"

Recent notebook entries context:
${recentEntries.substring(0, 1000)}

Recent documents context:
${documentContent.substring(0, 1000)}

Please provide ${limit} suggestions that would naturally continue or complete the current text. Each suggestion should be:
1. Relevant to the current topic
2. Natural and contextual
3. 10-50 words long
4. Different from each other

Format as a simple list, one suggestion per line.`

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
                    content: 'You are a helpful assistant that generates natural text continuations for notebook entries. Provide relevant, contextual suggestions.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 300,
            temperature: 0.7
        })
    })

    if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const suggestionsText = data.choices[0]?.message?.content || ''

    // Parse suggestions from the response
    const suggestions = suggestionsText
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0 && !line.startsWith('-') && !line.startsWith('•'))
        .slice(0, limit)

    return suggestions
} 