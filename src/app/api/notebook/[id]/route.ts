import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params

        if (!id) {
            return NextResponse.json(
                { error: 'Entry ID is required' },
                { status: 400 }
            )
        }

        // Delete the notebook entry from Supabase
        const { error } = await supabase
            .from('notebook_entries')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Delete notebook entry error:', error)
            return NextResponse.json(
                { error: 'Failed to delete notebook entry' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Notebook entry deleted successfully'
        })
    } catch (error) {
        console.error('Delete notebook entry error:', error)
        return NextResponse.json(
            { error: 'Failed to delete notebook entry' },
            { status: 500 }
        )
    }
}

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params

        if (!id) {
            return NextResponse.json(
                { error: 'Entry ID is required' },
                { status: 400 }
            )
        }

        // Get the specific notebook entry from Supabase
        const { data, error } = await supabase
            .from('notebook_entries')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            console.error('Get notebook entry error:', error)
            return NextResponse.json(
                { error: 'Failed to get notebook entry' },
                { status: 500 }
            )
        }

        if (!data) {
            return NextResponse.json(
                { error: 'Notebook entry not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            entry: data
        })
    } catch (error) {
        console.error('Get notebook entry error:', error)
        return NextResponse.json(
            { error: 'Failed to get notebook entry' },
            { status: 500 }
        )
    }
} 