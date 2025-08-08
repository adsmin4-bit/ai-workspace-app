import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/supabase'

export async function GET() {
    try {
        const agents = await db.getAgents()
        return NextResponse.json({
            success: true,
            data: agents
        })
    } catch (error) {
        console.error('Get agents error:', error)
        return NextResponse.json(
            { error: 'Failed to get agents' },
            { status: 500 }
        )
    }
}

export async function POST(req: NextRequest) {
    try {
        const { name, description, system_prompt, capabilities, workflows, enabled } = await req.json()

        if (!name || !system_prompt) {
            return NextResponse.json(
                { error: 'Name and system prompt are required' },
                { status: 400 }
            )
        }

        const agent = await db.createAgent({
            name,
            description: description || '',
            system_prompt,
            capabilities: capabilities || [],
            workflows: workflows || [],
            enabled: enabled !== undefined ? enabled : true
        })

        return NextResponse.json({
            success: true,
            message: 'Agent created successfully',
            data: agent
        })
    } catch (error) {
        console.error('Create agent error:', error)
        return NextResponse.json(
            { error: 'Failed to create agent' },
            { status: 500 }
        )
    }
} 