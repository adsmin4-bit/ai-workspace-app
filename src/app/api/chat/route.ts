import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { db } from '@/lib/supabase'
import { getComprehensiveContext } from '@/lib/context'

// Initialize AI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Function to get embedding for text
async function getEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-3-small',
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate embedding')
    }

    const result = await response.json()
    return result.data[0].embedding
  } catch (error) {
    console.error('Embedding generation error:', error)
    return []
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      message,
      sessionId,
      systemPrompt,
      model,
      temperature,
      maxTokens,
      selectedFolders = [], // Array of folder IDs for this session
      includeAllSources = true, // Whether to include all sources or only selected folders
      selectedChatSources = [], // Array of selected chat source IDs
      enableMemory = true, // Whether to enable chat memory (default: true)
    } = await req.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Ensure we have a valid model name
    const modelName = model || 'gpt-3.5-turbo'

    // Get comprehensive context from selected folders and chat sources
    const { contextText, sources, chunkCount, selectedFolders: usedFolders, contextChunks } = await getComprehensiveContext(message, undefined, selectedFolders, includeAllSources, selectedChatSources)

    // Build enhanced system prompt with context
    let enhancedSystemPrompt = systemPrompt || 'You are a helpful AI assistant.'

    if (contextText) {
      const folderInfo = !includeAllSources && selectedFolders.length > 0 ? ` (filtered to selected folders: ${selectedFolders.join(', ')})` : ''
      const scopeInfo = includeAllSources ? 'all available sources' : 'selected folders only'
      enhancedSystemPrompt = `You are an AI assistant that uses the following relevant context from the user's saved content${folderInfo} (scope: ${scopeInfo}) to answer the user question:

${contextText}

Answer as accurately as possible based on the provided context. If the context doesn't contain enough information to fully answer the question, you can supplement with your general knowledge, but prioritize the provided context when available.`
    }

    // Load conversation history if sessionId is provided
    let conversationHistory: any[] = []
    let memoryMessages: any[] = []

    if (sessionId) {
      try {
        const messages = await db.getMessages(sessionId)
        if (messages && messages.length > 0) {
          // Get the last 20 messages for context (to stay within token limits)
          const recentMessages = messages.slice(-20)
          conversationHistory = recentMessages.map((msg: any) => ({
            role: msg.role,
            content: msg.content
          }))
          console.log(`Loaded ${conversationHistory.length} messages from session ${sessionId}`)
        }

        // If memory is enabled, retrieve relevant past messages from chat memory
        if (enableMemory && sessionId) {
          try {
            const user = await db.getCurrentUser()
            const messageEmbedding = await getEmbedding(message)

            if (messageEmbedding.length > 0) {
              const relevantMemory = await db.searchChatMemory(messageEmbedding, user.id, 15, 0.7)

              if (relevantMemory && relevantMemory.length > 0) {
                // Filter out messages from the current session (already in conversationHistory)
                const filteredMemory = relevantMemory.filter((mem: any) => mem.session_id !== sessionId)

                // Take top 10 most relevant messages to avoid token limits
                memoryMessages = filteredMemory.slice(0, 10).map((mem: any) => ({
                  role: mem.role,
                  content: mem.content,
                  metadata: {
                    fromMemory: true,
                    sessionId: mem.session_id,
                    similarity: mem.similarity,
                    createdAt: mem.created_at
                  }
                }))

                console.log(`Retrieved ${memoryMessages.length} relevant memory messages`)
              }
            }
          } catch (error) {
            console.error('Error retrieving chat memory:', error)
            // Continue without memory if there's an error
          }
        }
      } catch (error) {
        console.error('Error loading conversation history:', error)
        // Continue without history if there's an error
      }
    }

    // Build the complete message array with RAG-enhanced system prompt and memory
    const messages = [
      { role: 'system', content: enhancedSystemPrompt },
      ...memoryMessages, // Add relevant memory messages first
      ...conversationHistory, // Then add current session history
      { role: 'user', content: message }
    ]

    console.log('Enhanced system prompt length:', enhancedSystemPrompt.length)
    console.log('RAG context chunks found:', chunkCount)
    console.log('Sources used:', sources)
    console.log('Selected folders:', selectedFolders)
    console.log('Memory messages included:', memoryMessages.length)

    // Create streaming response
    const response = await openai.chat.completions.create({
      model: modelName,
      messages: messages,
      temperature: temperature || 0.7,
      max_tokens: maxTokens || 2000,
      stream: true,
    })

    // Create a simple streaming response
    const stream = new ReadableStream({
      async start(controller) {
        // Send metadata about used sources and folders first
        if (sources.length > 0 || selectedFolders.length > 0 || memoryMessages.length > 0) {
          const metadata = {
            type: 'metadata',
            usedSources: sources,
            contextChunkCount: chunkCount,
            contextChunks: contextChunks, // Include the actual context chunks
            selectedFolders: selectedFolders,
            includeAllSources: includeAllSources,
            folderFiltered: !includeAllSources && selectedFolders.length > 0,
            memoryMessagesCount: memoryMessages.length,
            enableMemory: enableMemory
          }
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(metadata)}\n\n`))
        }

        let assistantResponse = ''

        for await (const chunk of response) {
          if (chunk.choices[0]?.delta?.content) {
            const text = chunk.choices[0].delta.content
            assistantResponse += text
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: text })}\n\n`))
          }
        }

        // Save messages to chat memory if enabled and sessionId is provided
        if (enableMemory && sessionId && assistantResponse.trim()) {
          try {
            // Save user message to memory
            const userEmbedding = await getEmbedding(message)
            await db.saveChatMemory(sessionId, 'user', message, userEmbedding)

            // Save assistant response to memory
            const assistantEmbedding = await getEmbedding(assistantResponse)
            await db.saveChatMemory(sessionId, 'assistant', assistantResponse, assistantEmbedding)

            console.log('Messages saved to chat memory')
          } catch (error) {
            console.error('Error saving to chat memory:', error)
            // Don't fail the response if memory saving fails
          }
        }

        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    )
  }
} 