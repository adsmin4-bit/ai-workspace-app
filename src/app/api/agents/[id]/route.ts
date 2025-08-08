import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/supabase'

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const agent = await db.getAgent(params.id)
        return NextResponse.json({
            success: true,
            data: agent
        })
    } catch (error) {
        console.error('Get agent error:', error)
        return NextResponse.json(
            { error: 'Failed to get agent' },
            { status: 500 }
        )
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { name, description, system_prompt, capabilities, workflows, enabled } = await req.json()

        if (!name || !system_prompt) {
            return NextResponse.json(
                { error: 'Name and system prompt are required' },
                { status: 400 }
            )
        }

        const agent = await db.updateAgent(params.id, {
            name,
            description: description || '',
            system_prompt,
            capabilities: capabilities || [],
            workflows: workflows || [],
            enabled: enabled !== undefined ? enabled : true
        })

        return NextResponse.json({
            success: true,
            message: 'Agent updated successfully',
            data: agent
        })
    } catch (error) {
        console.error('Update agent error:', error)
        return NextResponse.json(
            { error: 'Failed to update agent' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await db.deleteAgent(params.id)
        return NextResponse.json({
            success: true,
            message: 'Agent deleted successfully'
        })
    } catch (error) {
        console.error('Delete agent error:', error)
        return NextResponse.json(
            { error: 'Failed to delete agent' },
            { status: 500 }
        )
    }
} 