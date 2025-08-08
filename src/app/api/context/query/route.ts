import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { db } from '@/lib/supabase'
import { ContextSearchRequest, ContextSearchResponse, ContextSearchResult } from '@/types'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
    try {
        const body: ContextSearchRequest = await req.json()
        const { prompt, limit = 5, threshold = 0.7, sourceTypes } = body

        if (!prompt || prompt.trim().length === 0) {
            return NextResponse.json<ContextSearchResponse>({
                success: false,
                error: 'Prompt is required'
            }, { status: 400 })
        }

        // Generate embedding for the query using OpenAI
        const embeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-ada-002',
            input: prompt.trim(),
        })

        const embedding = embeddingResponse.data[0].embedding

        // Query context chunks using vector similarity search
        const results = await db.queryContextChunks(embedding, limit, threshold)

        // Filter by source types if specified
        let filteredResults = results
        if (sourceTypes && sourceTypes.length > 0) {
            filteredResults = results.filter((result: any) => {
                const sourceType = result.metadata?.source_type
                return sourceType && sourceTypes.includes(sourceType)
            })
        }

        // Transform results to match the expected format
        const transformedResults: ContextSearchResult[] = filteredResults.map((result: any) => ({
            id: result.id,
            content: result.content,
            metadata: result.metadata,
            similarity: result.similarity
        }))

        return NextResponse.json<ContextSearchResponse>({
            success: true,
            data: transformedResults
        })

    } catch (error) {
        console.error('Context query error:', error)
        return NextResponse.json<ContextSearchResponse>({
            success: false,
            error: 'Failed to query context'
        }, { status: 500 })
    }
} 