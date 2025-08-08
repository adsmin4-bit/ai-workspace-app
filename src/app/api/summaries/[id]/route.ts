import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/supabase'

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { searchParams } = new URL(req.url)
        const type = searchParams.get('type') as 'document' | 'url' | 'youtube' | 'notebook'

        if (!type) {
            return NextResponse.json(
                { success: false, error: 'Missing type parameter' },
                { status: 400 }
            )
        }

        const summary = await db.getSummary(params.id, type)

        if (!summary) {
            return NextResponse.json(
                { success: false, error: 'Summary not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: summary
        })

    } catch (error) {
        console.error('Error fetching summary:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch summary' },
            { status: 500 }
        )
    }
} 