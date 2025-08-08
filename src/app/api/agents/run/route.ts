import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/supabase'

export async function POST(req: NextRequest) {
    try {
        const { agent_id, input, session_id } = await req.json()

        if (!agent_id || !input) {
            return NextResponse.json(
                { error: 'Agent ID and input are required' },
                { status: 400 }
            )
        }

        // Get the agent configuration
        const agent = await db.getAgent(agent_id)
        if (!agent) {
            return NextResponse.json(
                { error: 'Agent not found' },
                { status: 404 }
            )
        }

        // Create or use existing chat session
        let chatSessionId = session_id
        if (!chatSessionId) {
            const session = await db.createChatSession(
                `Agent: ${agent.name}`,
                agent.system_prompt,
                undefined,
                true
            )
            chatSessionId = session.id
        }

        // Add the user message to the session
        await db.addMessage(chatSessionId, 'user', input, {
            agent_id: agent_id,
            agent_name: agent.name,
            capabilities: agent.capabilities
        })

        // Return the session ID for the frontend to use with the existing chat system
        return NextResponse.json({
            success: true,
            data: {
                session_id: chatSessionId,
                agent: {
                    id: agent.id,
                    name: agent.name,
                    system_prompt: agent.system_prompt,
                    capabilities: agent.capabilities
                }
            }
        })
    } catch (error) {
        console.error('Run agent error:', error)
        return NextResponse.json(
            { error: 'Failed to run agent' },
            { status: 500 }
        )
    }
} 