import { NextRequest, NextResponse } from 'next/server'
import { db, supabase } from '@/lib/supabase'
import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

// Function to get embeddings for text using OpenAI
async function getEmbedding(text: string): Promise<number[]> {
    try {
        const embeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-ada-002',
            input: text.trim(),
        })
        return embeddingResponse.data[0].embedding
    } catch (error) {
        console.error('Embedding generation error:', error)
        return []
    }
}

// Function to chunk text into smaller pieces
function chunkText(text: string, maxChunkSize: number = 1000, overlap: number = 200): string[] {
    if (text.length <= maxChunkSize) {
        return [text]
    }

    const chunks: string[] = []
    let start = 0

    while (start < text.length) {
        let end = start + maxChunkSize

        // If this isn't the last chunk, try to break at a sentence boundary
        if (end < text.length) {
            const searchStart = Math.max(start + maxChunkSize - 100, start)
            const searchEnd = Math.min(end + 100, text.length)
            const searchText = text.slice(searchStart, searchEnd)

            const sentenceEndings = searchText.match(/[.!?]\s+/g)
            if (sentenceEndings && sentenceEndings.length > 0) {
                const lastEnding = sentenceEndings[sentenceEndings.length - 1]
                const endingIndex = searchText.lastIndexOf(lastEnding)
                if (endingIndex !== -1) {
                    end = searchStart + endingIndex + lastEnding.length
                }
            }
        }

        const chunk = text.slice(start, end).trim()
        if (chunk.length > 0) {
            chunks.push(chunk)
        }

        start = end - overlap
        if (start >= text.length) break
    }

    return chunks
}

export async function POST(req: NextRequest) {
    try {
        const { sourceType, sourceId, title, content } = await req.json()

        if (!content || !title) {
            return NextResponse.json({ error: 'Content and title are required' }, { status: 400 })
        }

        // Chunk the content
        const chunks = chunkText(content, 1000, 200)
        console.log(`Created ${chunks.length} chunks for: ${title}`)

        // Save each chunk with embeddings
        const savedChunks = []
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i]

            // Generate embedding for the chunk
            const embedding = await getEmbedding(chunk)

            if (embedding.length === 0) {
                console.warn(`Failed to generate embedding for chunk ${i}`)
                continue
            }

            // Save chunk to database
            const savedChunk = await db.saveContextChunk(chunk, {
                source_type: sourceType || 'document',
                source_id: sourceId,
                title: title,
                chunk_index: i,
                total_chunks: chunks.length
            }, embedding)

            savedChunks.push(savedChunk)

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100))
        }

        return NextResponse.json({
            success: true,
            message: `Successfully saved ${savedChunks.length} chunks for: ${title}`,
            chunks: savedChunks
        })

    } catch (error) {
        console.error('Error populating context:', error)
        return NextResponse.json(
            { error: 'Failed to populate context' },
            { status: 500 }
        )
    }
}

export async function GET() {
    try {
        // Get all context chunks to show current state
        const { data: chunks, error } = await supabase
            .from('context_chunks')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10)

        if (error) throw error

        return NextResponse.json({
            success: true,
            chunks: chunks,
            count: chunks.length
        })

    } catch (error) {
        console.error('Error fetching context chunks:', error)
        return NextResponse.json(
            { error: 'Failed to fetch context chunks' },
            { status: 500 }
        )
    }
} 