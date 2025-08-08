import { NextRequest, NextResponse } from 'next/server'
import { populateContextFromExistingData } from '@/lib/context'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
    try {
        console.log('Starting to populate context from existing data...')

        const result = await populateContextFromExistingData()

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: `Successfully processed ${result.processed} items for context chunks`,
                processed: result.processed
            })
        } else {
            return NextResponse.json({
                success: false,
                error: result.error
            }, { status: 500 })
        }

    } catch (error) {
        console.error('Error populating context from existing data:', error)
        return NextResponse.json(
            { error: 'Failed to populate context from existing data' },
            { status: 500 }
        )
    }
}

export async function GET() {
    try {
        // Get counts of existing data
        const { data: documents } = await supabase
            .from('documents')
            .select('*', { count: 'exact', head: true })

        const { data: notebookEntries } = await supabase
            .from('notebook_entries')
            .select('*', { count: 'exact', head: true })

        const { data: sourceUrls } = await supabase
            .from('source_urls')
            .select('*', { count: 'exact', head: true })

        const { count: contextChunksCount } = await supabase
            .from('context_chunks')
            .select('*', { count: 'exact', head: true })

        return NextResponse.json({
            success: true,
            data: {
                availableSources: {
                    documents: documents?.length || 0,
                    notebook: notebookEntries?.length || 0,
                    urls: sourceUrls?.length || 0
                },
                existingChunks: contextChunksCount || 0,
                totalAvailable: (documents?.length || 0) + (notebookEntries?.length || 0) + (sourceUrls?.length || 0)
            }
        })

    } catch (error) {
        console.error('Error getting context statistics:', error)
        return NextResponse.json(
            { error: 'Failed to get context statistics' },
            { status: 500 }
        )
    }
} 