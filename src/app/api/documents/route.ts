import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/supabase'

export async function GET() {
    try {
        console.log('Fetching documents from database')
        const documents = await db.getDocuments()
        console.log('Documents fetched successfully:', documents.length)
        return NextResponse.json({ success: true, documents })
    } catch (error) {
        console.error('Get documents error:', error)
        return NextResponse.json(
            {
                error: 'Failed to get documents',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

// Test database connection
export async function POST(req: NextRequest) {
    try {
        const { action } = await req.json()

        if (action === 'test') {
            // Test database connection by trying to get documents
            const documents = await db.getDocuments()
            return NextResponse.json({
                success: true,
                message: 'Database connection successful',
                documentCount: documents.length
            })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    } catch (error) {
        console.error('Database test error:', error)
        return NextResponse.json(
            {
                error: 'Database connection failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
} 