import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { data, error } = await supabase
            .from('folders')
            .select('*')
            .eq('id', params.id)
            .single()

        if (error) {
            console.error('Error fetching folder:', error)
            return NextResponse.json(
                { error: 'Failed to fetch folder' },
                { status: 500 }
            )
        }

        if (!data) {
            return NextResponse.json(
                { error: 'Folder not found' },
                { status: 404 }
            )
        }

        // Convert snake_case to camelCase for frontend
        const formattedFolder = {
            id: data.id,
            name: data.name,
            type: data.type,
            description: data.description,
            color: data.color,
            includeInContext: data.include_in_context,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        }

        return NextResponse.json({
            success: true,
            data: formattedFolder
        })

    } catch (error) {
        console.error('Folder fetch error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch folder' },
            { status: 500 }
        )
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const updates = await req.json()

        // Validate required fields
        if (!updates.name || !updates.type) {
            return NextResponse.json(
                { error: 'Name and type are required' },
                { status: 400 }
            )
        }

        const { data, error } = await supabase
            .from('folders')
            .update({
                name: updates.name,
                type: updates.type,
                description: updates.description || null,
                color: updates.color || '#3B82F6',
                include_in_context: updates.includeInContext !== false,
                updated_at: new Date().toISOString()
            })
            .eq('id', params.id)
            .select()
            .single()

        if (error) {
            console.error('Error updating folder:', error)
            return NextResponse.json(
                { error: 'Failed to update folder' },
                { status: 500 }
            )
        }

        // Convert snake_case to camelCase for frontend
        const formattedFolder = {
            id: data.id,
            name: data.name,
            type: data.type,
            description: data.description,
            color: data.color,
            includeInContext: data.include_in_context,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        }

        return NextResponse.json({
            success: true,
            data: formattedFolder
        })

    } catch (error) {
        console.error('Folder update error:', error)
        return NextResponse.json(
            { error: 'Failed to update folder' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // First, move all items from this folder to "unorganized" (null folder_id)
        const tables = ['documents', 'source_urls', 'notebook_entries']

        for (const table of tables) {
            const { error: updateError } = await supabase
                .from(table)
                .update({ folder_id: null })
                .eq('folder_id', params.id)

            if (updateError) {
                console.error(`Error updating ${table}:`, updateError)
            }
        }

        // Then delete the folder
        const { error } = await supabase
            .from('folders')
            .delete()
            .eq('id', params.id)

        if (error) {
            console.error('Error deleting folder:', error)
            return NextResponse.json(
                { error: 'Failed to delete folder' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Folder deleted successfully'
        })

    } catch (error) {
        console.error('Folder delete error:', error)
        return NextResponse.json(
            { error: 'Failed to delete folder' },
            { status: 500 }
        )
    }
} 