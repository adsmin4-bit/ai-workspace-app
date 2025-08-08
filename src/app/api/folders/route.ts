import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/supabase'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const type = searchParams.get('type') as 'urls' | 'documents' | 'notes' | null

        const folders = await db.getFolders(type || undefined)

        // Convert snake_case to camelCase for frontend
        const formattedFolders = folders.map(folder => ({
            id: folder.id,
            name: folder.name,
            type: folder.type,
            description: folder.description,
            color: folder.color,
            includeInContext: folder.include_in_context,
            createdAt: folder.created_at,
            updatedAt: folder.updated_at
        }))

        return NextResponse.json({ success: true, data: formattedFolders })
    } catch (error) {
        console.error('Get folders error:', error)
        return NextResponse.json(
            { error: 'Failed to get folders' },
            { status: 500 }
        )
    }
}

export async function POST(req: NextRequest) {
    try {
        const folder = await req.json()

        if (!folder.name || !folder.type) {
            return NextResponse.json(
                { error: 'Name and type are required' },
                { status: 400 }
            )
        }

        // Get current user for owner_id
        const user = await db.getCurrentUser()
        if (!user) {
            return NextResponse.json(
                { error: 'User not authenticated' },
                { status: 401 }
            )
        }

        // Convert camelCase to snake_case for database
        const newFolder = await db.createFolder({
            name: folder.name,
            type: folder.type,
            description: folder.description || null,
            color: folder.color || '#3B82F6',
            include_in_context: folder.includeInContext !== false, // Default to true
            owner_id: user.id
        })

        // Convert back to camelCase for frontend
        const formattedFolder = {
            id: newFolder.id,
            name: newFolder.name,
            type: newFolder.type,
            description: newFolder.description,
            color: newFolder.color,
            includeInContext: newFolder.include_in_context,
            createdAt: newFolder.created_at,
            updatedAt: newFolder.updated_at
        }

        return NextResponse.json({
            success: true,
            data: formattedFolder,
            message: 'Folder created successfully'
        })
    } catch (error) {
        console.error('Create folder error:', error)
        return NextResponse.json(
            { error: 'Failed to create folder' },
            { status: 500 }
        )
    }
} 