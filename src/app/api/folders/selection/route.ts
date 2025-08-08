import { NextRequest, NextResponse } from 'next/server'
import { getFoldersForSelection } from '@/lib/context'

export async function GET() {
    try {
        const folders = await getFoldersForSelection()

        return NextResponse.json({
            success: true,
            folders: folders
        })

    } catch (error) {
        console.error('Error fetching folders for selection:', error)
        return NextResponse.json(
            { error: 'Failed to fetch folders' },
            { status: 500 }
        )
    }
} 