import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
    try {
        const { itemId, itemType, weight } = await req.json()

        if (!itemId || !itemType || weight === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields: itemId, itemType, weight' },
                { status: 400 }
            )
        }

        if (weight < 0 || weight > 100) {
            return NextResponse.json(
                { error: 'Weight must be between 0 and 100' },
                { status: 400 }
            )
        }

        let tableName: string
        let updateData: any

        switch (itemType) {
            case 'document':
                tableName = 'documents'
                updateData = { context_weight: weight }
                break
            case 'url':
                tableName = 'source_urls'
                updateData = { context_weight: weight }
                break
            case 'notebook':
                tableName = 'notebook_entries'
                updateData = { context_weight: weight }
                break
            default:
                return NextResponse.json(
                    { error: 'Invalid itemType. Must be document, url, or notebook' },
                    { status: 400 }
                )
        }

        // Update the item's context weight
        const { data, error } = await supabase
            .from(tableName)
            .update(updateData)
            .eq('id', itemId)
            .select()

        if (error) {
            console.error('Error updating context weight:', error)
            return NextResponse.json(
                { error: 'Failed to update context weight' },
                { status: 500 }
            )
        }

        // Update the corresponding context chunks
        const { error: chunkError } = await supabase
            .from('context_chunks')
            .update({ context_weight: weight })
            .eq('metadata->>source_id', itemId)
            .eq('metadata->>source_type', itemType)

        if (chunkError) {
            console.error('Error updating context chunks:', chunkError)
            // Don't fail the request if context chunk update fails
        }

        return NextResponse.json({
            success: true,
            data: data[0],
            message: 'Context weight updated successfully'
        })

    } catch (error) {
        console.error('Context weight update error:', error)
        return NextResponse.json(
            { error: 'Failed to update context weight' },
            { status: 500 }
        )
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const itemId = searchParams.get('itemId')
        const itemType = searchParams.get('itemType')

        if (!itemId || !itemType) {
            return NextResponse.json(
                { error: 'Missing required parameters: itemId, itemType' },
                { status: 400 }
            )
        }

        let tableName: string

        switch (itemType) {
            case 'document':
                tableName = 'documents'
                break
            case 'url':
                tableName = 'source_urls'
                break
            case 'notebook':
                tableName = 'notebook_entries'
                break
            default:
                return NextResponse.json(
                    { error: 'Invalid itemType. Must be document, url, or notebook' },
                    { status: 400 }
                )
        }

        const { data, error } = await supabase
            .from(tableName)
            .select('context_weight')
            .eq('id', itemId)
            .single()

        if (error) {
            console.error('Error fetching context weight:', error)
            return NextResponse.json(
                { error: 'Failed to fetch context weight' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            data: { contextWeight: data.context_weight || 100 }
        })

    } catch (error) {
        console.error('Context weight fetch error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch context weight' },
            { status: 500 }
        )
    }
} 