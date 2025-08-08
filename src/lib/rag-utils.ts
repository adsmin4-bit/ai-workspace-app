import { ContextChunk } from '@/types'

/**
 * Chunks text into smaller pieces for better RAG performance
 * @param text - The text to chunk
 * @param maxChunkSize - Maximum size of each chunk (default: 1000 characters)
 * @param overlap - Overlap between chunks (default: 200 characters)
 * @returns Array of text chunks
 */
export function chunkText(text: string, maxChunkSize: number = 1000, overlap: number = 200): string[] {
    if (text.length <= maxChunkSize) {
        return [text]
    }

    const chunks: string[] = []
    let start = 0

    while (start < text.length) {
        let end = start + maxChunkSize

        // If this isn't the last chunk, try to break at a sentence boundary
        if (end < text.length) {
            // Look for sentence endings within the last 100 characters of the chunk
            const searchStart = Math.max(start + maxChunkSize - 100, start)
            const searchEnd = Math.min(end + 100, text.length)
            const searchText = text.slice(searchStart, searchEnd)

            // Find the last sentence ending
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

        // Move start position for next chunk, accounting for overlap
        start = end - overlap
        if (start >= text.length) break
    }

    return chunks
}

/**
 * Generates embeddings for text using OpenAI
 * @param text - The text to embed
 * @returns Promise that resolves to embedding vector
 */
async function getEmbedding(text: string): Promise<number[]> {
    try {
        // Use absolute URL for server-side requests
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const response = await fetch(`${baseUrl}/api/context/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: text,
                metadata: { temp: true }, // Temporary flag
                generateEmbedding: true,
            }),
        })

        if (!response.ok) {
            throw new Error('Failed to generate embedding')
        }

        const result = await response.json()
        return result.embedding || []
    } catch (error) {
        console.error('Embedding generation error:', error)
        return []
    }
}

/**
 * Auto-ingestion utility for saving content chunks to RAG memory
 * @param params - Parameters for content ingestion
 * @returns Promise that resolves when all chunks are saved
 */
export async function saveChunksToMemory({
    sourceType,
    sourceId,
    title,
    fullText,
    metadata = {}
}: {
    sourceType: 'document' | 'note' | 'url' | 'chat'
    sourceId: string
    title: string
    fullText: string
    metadata?: any
}): Promise<void> {
    try {
        // Split text into 300-word chunks (approximately 1200 characters)
        const chunks = chunkText(fullText, 1200, 200)

        console.log(`Saving ${chunks.length} chunks for ${sourceType}: ${title}`)

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i]

            // Generate embedding for the chunk
            const embedding = await getEmbedding(chunk)

            if (embedding.length === 0) {
                console.warn(`Failed to generate embedding for chunk ${i} of ${title}`)
                continue
            }

            // Save chunk to context_chunks table
            await fetch('/api/context/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: chunk,
                    embedding: embedding,
                    metadata: {
                        source_type: sourceType,
                        source_id: sourceId,
                        title: title,
                        chunk_index: i,
                        total_chunks: chunks.length,
                        ...metadata
                    }
                }),
            })

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100))
        }

        console.log(`Successfully saved ${chunks.length} chunks for ${sourceType}: ${title}`)
    } catch (error) {
        console.error(`Failed to save chunks for ${sourceType}: ${title}`, error)
        throw error
    }
}

/**
 * Queries context chunks for relevant information
 * @param prompt - The query prompt
 * @param limit - Maximum number of results (default: 5)
 * @param threshold - Similarity threshold (default: 0.7)
 * @param sourceTypes - Filter by source types
 * @returns Promise that resolves to context search results
 */
export async function queryContext(
    prompt: string,
    limit: number = 5,
    threshold: number = 0.7,
    sourceTypes?: string[]
): Promise<ContextChunk[]> {
    try {
        const response = await fetch('/api/context/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt,
                limit,
                threshold,
                sourceTypes,
            }),
        })

        if (!response.ok) {
            throw new Error('Failed to query context')
        }

        const result = await response.json()
        return result.data || []
    } catch (error) {
        console.error('Context query error:', error)
        return []
    }
}

/**
 * Builds context string from search results
 * @param results - Context search results
 * @returns Formatted context string
 */
export function buildContextString(results: ContextChunk[]): string {
    if (results.length === 0) {
        return ''
    }

    const contextParts = results.map((result, index) => {
        const sourceType = result.metadata?.source_type || 'unknown'
        const title = result.metadata?.title || `Source ${index + 1}`
        const url = result.metadata?.url ? ` (${result.metadata.url})` : ''

        return `[${sourceType.toUpperCase()}: ${title}${url}]\n${result.content}\n`
    })

    return contextParts.join('\n---\n\n')
}

/**
 * Formats context for AI prompt
 * @param results - Context search results
 * @param userPrompt - The user's original prompt
 * @returns Formatted prompt with context
 */
export function formatPromptWithContext(results: ContextChunk[], userPrompt: string): string {
    if (results.length === 0) {
        return userPrompt
    }

    const contextString = buildContextString(results)

    return `You have access to the following relevant information that may help answer the user's question:

${contextString}

User's question: ${userPrompt}

Please use the provided context to give a comprehensive and accurate answer. If the context doesn't contain enough information to fully answer the question, you can supplement with your general knowledge, but prioritize the provided context when available.`
} 