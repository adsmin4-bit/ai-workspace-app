import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

export async function GET() {
    try {
        // Define real workflows with actual functionality
        const workflows = [
            {
                id: '1',
                name: 'Summarize Text',
                description: 'Summarize any text content using AI',
                steps: [
                    {
                        id: '1',
                        type: 'prompt',
                        name: 'Summarize',
                        config: {
                            prompt: 'Please summarize the following text in a concise manner, highlighting the key points: {{input}}'
                        },
                        order: 1
                    }
                ],
                enabled: true
            },
            {
                id: '2',
                name: 'Create Tweet',
                description: 'Convert content into an engaging tweet format',
                steps: [
                    {
                        id: '1',
                        type: 'prompt',
                        name: 'Tweet Creation',
                        config: {
                            prompt: 'Convert the following content into an engaging tweet (max 280 characters). Make it viral-worthy and include relevant hashtags: {{input}}'
                        },
                        order: 1
                    }
                ],
                enabled: true
            },
            {
                id: '3',
                name: 'Extract Key Points',
                description: 'Extract main points and insights from text',
                steps: [
                    {
                        id: '1',
                        type: 'prompt',
                        name: 'Key Points Extraction',
                        config: {
                            prompt: 'Extract the key points, insights, and main takeaways from the following text. Format as a bulleted list: {{input}}'
                        },
                        order: 1
                    }
                ],
                enabled: true
            },
            {
                id: '4',
                name: 'Improve Writing',
                description: 'Enhance and improve written content',
                steps: [
                    {
                        id: '1',
                        type: 'prompt',
                        name: 'Writing Enhancement',
                        config: {
                            prompt: 'Improve the following text by enhancing clarity, grammar, and flow while maintaining the original meaning: {{input}}'
                        },
                        order: 1
                    }
                ],
                enabled: true
            }
        ]

        return NextResponse.json({ success: true, workflows })
    } catch (error) {
        console.error('Get workflows error:', error)
        return NextResponse.json(
            { error: 'Failed to get workflows' },
            { status: 500 }
        )
    }
}

export async function POST(req: NextRequest) {
    try {
        const { workflowId, input } = await req.json()

        if (!workflowId || !input) {
            return NextResponse.json(
                { error: 'Workflow ID and input are required' },
                { status: 400 }
            )
        }

        // Define workflow configurations
        const workflowConfigs = {
            '1': {
                prompt: 'Please summarize the following text in a concise manner, highlighting the key points:',
                model: 'gpt-3.5-turbo',
                maxTokens: 500
            },
            '2': {
                prompt: 'Convert the following content into an engaging tweet (max 280 characters). Make it viral-worthy and include relevant hashtags:',
                model: 'gpt-3.5-turbo',
                maxTokens: 300
            },
            '3': {
                prompt: 'Extract the key points, insights, and main takeaways from the following text. Format as a bulleted list:',
                model: 'gpt-3.5-turbo',
                maxTokens: 600
            },
            '4': {
                prompt: 'Improve the following text by enhancing clarity, grammar, and flow while maintaining the original meaning:',
                model: 'gpt-3.5-turbo',
                maxTokens: 800
            }
        }

        const config = workflowConfigs[workflowId as keyof typeof workflowConfigs]

        if (!config) {
            return NextResponse.json(
                { error: 'Workflow not found' },
                { status: 404 }
            )
        }

        // Execute the workflow using OpenAI
        const completion = await openai.chat.completions.create({
            model: config.model,
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful AI assistant that processes text according to specific instructions.'
                },
                {
                    role: 'user',
                    content: `${config.prompt}\n\n${input}`
                }
            ],
            max_tokens: config.maxTokens,
            temperature: 0.7,
        })

        const result = completion.choices[0]?.message?.content || 'No response generated'

        return NextResponse.json({
            success: true,
            result: result,
            workflowId: workflowId,
            input: input,
            model: config.model,
            message: 'Workflow executed successfully'
        })
    } catch (error) {
        console.error('Execute workflow error:', error)
        return NextResponse.json(
            { error: 'Failed to execute workflow' },
            { status: 500 }
        )
    }
} 