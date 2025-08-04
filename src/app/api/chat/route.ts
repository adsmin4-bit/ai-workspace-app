import { NextRequest, NextResponse } from 'next/server'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { db } from '@/lib/supabase'

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId, systemPrompt, model, temperature, maxTokens } = await req.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get provider from model
    const provider = model?.startsWith('gpt') ? 'openai' : 
                   model?.startsWith('claude') ? 'anthropic' : 'openai'
    
    // Ensure we have a valid model name
    const modelName = model || 'gpt-3.5-turbo'

    // Create streaming response based on provider
    if (provider === 'openai') {
      const response = await openai.chat.completions.create({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt || 'You are a helpful AI assistant.' },
          { role: 'user', content: message }
        ],
        temperature: temperature || 0.7,
        max_tokens: maxTokens || 2000,
        stream: true,
      })

      const stream = OpenAIStream(response)
      return new StreamingTextResponse(stream)
    }

    if (provider === 'anthropic') {
      const response = await anthropic.messages.create({
        model: modelName,
        max_tokens: maxTokens || 2000,
        temperature: temperature || 0.7,
        system: systemPrompt || 'You are a helpful AI assistant.',
        messages: [{ role: 'user', content: message }],
        stream: true,
      })

      // Convert Anthropic stream to OpenAI format
      const stream = new ReadableStream({
        async start(controller) {
          for await (const chunk of response) {
            if (chunk.type === 'content_block_delta') {
              const text = chunk.delta.text
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content: text })}\n\n`))
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
    }

    // Fallback to OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt || 'You are a helpful AI assistant.' },
        { role: 'user', content: message }
      ],
      temperature: temperature || 0.7,
      max_tokens: maxTokens || 2000,
      stream: true,
    })

    const stream = OpenAIStream(response)
    return new StreamingTextResponse(stream)

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    )
  }
} 