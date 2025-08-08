import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
    try {
        const { itemId, itemType, enabled } = await req.json()

        if (!itemId || !itemType || typeof enabled !== 'boolean') {
            return NextResponse.json(
                { error: 'itemId, itemType, and enabled are required' },
                { status: 400 }
            )
        }

        let tableName: string
        let updateData: any

        switch (itemType) {
            case 'document':
                tableName = 'documents'
                updateData = { include_in_memory: enabled }
                break
            case 'notebook':
                tableName = 'notebook_entries'
                updateData = { include_in_memory: enabled }
                break
            case 'url':
                tableName = 'source_urls'
                updateData = { include_in_memory: enabled }
                break
            default:
                return NextResponse.json(
                    { error: 'Invalid itemType. Must be document, notebook, or url' },
                    { status: 400 }
                )
        }

        const { data, error } = await supabase
            .from(tableName)
            .update(updateData)
            .eq('id', itemId)
            .select()
            .single()

        if (error) {
            console.error(`Error updating ${itemType} memory toggle:`, error)
            return NextResponse.json(
                { error: `Failed to update ${itemType} memory toggle` },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            data: {
                id: data.id,
                includeInMemory: data.include_in_memory
            }
        })

    } catch (error) {
        console.error('Memory toggle error:', error)
        return NextResponse.json(
            { error: 'Failed to toggle memory inclusion' },
            { status: 500 }
        )
    }
} 