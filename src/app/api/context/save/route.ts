import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { db } from '@/lib/supabase'
import { ContextChunk } from '@/types'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
    try {
        const body: {
            content: string;
            metadata?: any;
            embedding?: number[];
            generateEmbedding?: boolean;
        } = await req.json()
        const { content, metadata, embedding: providedEmbedding, generateEmbedding } = body

        if (!content || content.trim().length === 0) {
            return NextResponse.json({
                success: false,
                error: 'Content is required'
            }, { status: 400 })
        }

        let embedding: number[] = providedEmbedding || []

        // Generate embedding if not provided or if explicitly requested
        if (embedding.length === 0 || generateEmbedding) {
            try {
                const embeddingResponse = await openai.embeddings.create({
                    model: 'text-embedding-ada-002',
                    input: content.trim(),
                })
                embedding = embeddingResponse.data[0].embedding
            } catch (embeddingError) {
                console.error('Embedding generation error:', embeddingError)
                return NextResponse.json({
                    success: false,
                    error: 'Failed to generate embedding'
                }, { status: 500 })
            }
        }

        // If this is just for embedding generation (temp flag), return the embedding
        if (metadata?.temp && generateEmbedding) {
            return NextResponse.json({
                success: true,
                embedding: embedding
            })
        }

        // Save context chunk with embedding
        const savedChunk = await db.saveContextChunk(content.trim(), metadata, embedding)

        return NextResponse.json({
            success: true,
            data: savedChunk,
            embedding: generateEmbedding ? embedding : undefined
        })

    } catch (error) {
        console.error('Context save error:', error)
        return NextResponse.json({
            success: false,
            error: 'Failed to save context chunk'
        }, { status: 500 })
    }
} 