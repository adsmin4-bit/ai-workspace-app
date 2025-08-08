import { supabase } from '@/lib/supabase'
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

export async function match_context_embeddings(
    query: string,
    user_id?: string,
    selectedFolders?: string[],
    includeAllSources: boolean = true,
    selectedChatSources?: string[]
) {
    const embedding = await getEmbedding(query)

    // If includeAllSources is false and specific folders are selected, filter by folder IDs
    if (!includeAllSources && selectedFolders && selectedFolders.length > 0) {
        const { data, error } = await supabase.rpc('match_context_chunks_with_folders', {
            query_embedding: embedding,
            match_threshold: 0.7,
            match_count: 5,
            folder_ids: selectedFolders
        })

        if (error) {
            console.error('Error matching embeddings with folders:', error)
            return []
        }

        return data || []
    } else {
        // Use the original function if includeAllSources is true or no folders are selected
        const { data, error } = await supabase.rpc('match_context_chunks', {
            query_embedding: embedding,
            match_threshold: 0.7,
            match_count: 5,
        })

        if (error) {
            console.error('Error matching embeddings:', error)
            return []
        }

        // Filter by selected chat sources if provided
        if (selectedChatSources && selectedChatSources.length > 0) {
            return (data || []).filter((chunk: any) => {
                const sourceId = chunk.metadata?.source_id
                return sourceId && selectedChatSources.includes(sourceId)
            })
        }

        return data || []
    }
}

// Enhanced function to get comprehensive context from selected folders
export async function getComprehensiveContext(
    query: string,
    user_id?: string,
    selectedFolders?: string[],
    includeAllSources: boolean = true,
    selectedChatSources?: string[]
) {
    try {
        // Get relevant context chunks using embeddings with folder filtering
        const contextChunks = await match_context_embeddings(query, user_id, selectedFolders, includeAllSources, selectedChatSources)

        if (contextChunks.length === 0) {
            console.log('No relevant context found for query:', query, 'in selected folders:', selectedFolders)
            return {
                contextText: '',
                sources: [],
                chunkCount: 0,
                selectedFolders: selectedFolders || [],
                contextChunks: []
            }
        }

        // Group chunks by source type for better organization
        const groupedChunks = contextChunks.reduce((acc: any, chunk: any) => {
            const sourceType = chunk.metadata?.source_type || 'unknown'
            const title = chunk.metadata?.title || 'Unknown Source'
            const folderId = chunk.metadata?.folder_id || 'no-folder'

            if (!acc[sourceType]) {
                acc[sourceType] = {}
            }
            if (!acc[sourceType][title]) {
                acc[sourceType][title] = []
            }
            acc[sourceType][title].push({ ...chunk, folderId })
            return acc
        }, {})

        // Build formatted context text
        let contextText = ''
        const sources: string[] = []
        let totalChunks = 0

        for (const [sourceType, sourceGroups] of Object.entries(groupedChunks)) {
            for (const [title, chunks] of Object.entries(sourceGroups as any)) {
                const sourceLabel = getSourceLabel(sourceType)
                const chunkContent = (chunks as any[]).map((chunk: any) => chunk.content).join('\n\n')

                contextText += `[${sourceLabel}: ${title}]\n${chunkContent}\n\n`
                sources.push(`${sourceType}: ${title}`)
                totalChunks += (chunks as any[]).length
            }
        }

        console.log(`Found ${totalChunks} relevant chunks from ${sources.length} sources for query: "${query}" in folders:`, selectedFolders)

        return {
            contextText: contextText.trim(),
            sources,
            chunkCount: totalChunks,
            selectedFolders: selectedFolders || [],
            contextChunks: contextChunks // Add the actual chunks for the context viewer
        }

    } catch (error) {
        console.error('Error getting comprehensive context:', error)
        return {
            contextText: '',
            sources: [],
            chunkCount: 0,
            selectedFolders: selectedFolders || [],
            contextChunks: []
        }
    }
}

// Helper function to get readable source labels
function getSourceLabel(sourceType: string): string {
    switch (sourceType) {
        case 'document':
            return 'DOCUMENT'
        case 'note':
            return 'NOTEBOOK'
        case 'url':
            return 'WEB SOURCE'
        case 'chat':
            return 'CHAT HISTORY'
        default:
            return 'SOURCE'
    }
}

// Function to get all folders for selection
export async function getFoldersForSelection() {
    try {
        const { data: folders, error } = await supabase
            .from('folders')
            .select('*')
            .order('name', { ascending: true })

        if (error) throw error

        return folders || []
    } catch (error) {
        console.error('Error fetching folders:', error)
        return []
    }
}

// Function to populate context chunks from existing data with folder support
export async function populateContextFromExistingData() {
    try {
        console.log('Starting to populate context from existing data...')

        // Get documents
        const { data: documents } = await supabase
            .from('documents')
            .select('*')
            .not('content', 'is', null)

        // Get notebook entries
        const { data: notebookEntries } = await supabase
            .from('notebook_entries')
            .select('*')

        // Get source URLs
        const { data: sourceUrls } = await supabase
            .from('source_urls')
            .select('*')

        let totalProcessed = 0

        // Process documents
        if (documents && documents.length > 0) {
            console.log(`Processing ${documents.length} documents...`)
            for (const doc of documents) {
                if (doc.content) {
                    await saveContentAsChunks(doc.content, {
                        source_type: 'document',
                        source_id: doc.id,
                        title: doc.name,
                        type: doc.type,
                        folder_id: doc.folder_id
                    })
                    totalProcessed++
                }
            }
        }

        // Process notebook entries
        if (notebookEntries && notebookEntries.length > 0) {
            console.log(`Processing ${notebookEntries.length} notebook entries...`)
            for (const entry of notebookEntries) {
                await saveContentAsChunks(entry.content, {
                    source_type: 'note',
                    source_id: entry.id,
                    title: entry.title,
                    type: entry.type,
                    folder_id: entry.folder_id
                })
                totalProcessed++
            }
        }

        // Process source URLs
        if (sourceUrls && sourceUrls.length > 0) {
            console.log(`Processing ${sourceUrls.length} source URLs...`)
            for (const url of sourceUrls) {
                const content = `Topic: ${url.topic}\nURL: ${url.url}\nTitle: ${url.title || 'No title'}\n\nThis is a saved URL reference for the topic: ${url.topic}. The URL points to: ${url.url}`
                await saveContentAsChunks(content, {
                    source_type: 'url',
                    source_id: url.id,
                    title: url.title || url.url,
                    url: url.url,
                    topic: url.topic,
                    folder_id: url.folder_id
                })
                totalProcessed++
            }
        }

        console.log(`Successfully processed ${totalProcessed} items for context chunks`)
        return { success: true, processed: totalProcessed }

    } catch (error) {
        console.error('Error populating context from existing data:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
}

// Helper function to save content as chunks
async function saveContentAsChunks(content: string, metadata: any) {
    try {
        // Split content into chunks
        const chunks = chunkText(content, 1000, 200)

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i]
            const embedding = await getEmbedding(chunk)

            if (embedding.length === 0) continue

            await supabase
                .from('context_chunks')
                .insert([{
                    content: chunk,
                    metadata: {
                        ...metadata,
                        chunk_index: i,
                        total_chunks: chunks.length
                    },
                    embedding: embedding
                }])

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100))
        }
    } catch (error) {
        console.error('Error saving content as chunks:', error)
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