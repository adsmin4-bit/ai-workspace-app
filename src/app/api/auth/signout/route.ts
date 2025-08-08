import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
    try {
        const { error } = await supabase.auth.signOut()

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Signed out successfully'
        })
    } catch (error) {
        console.error('Signout error:', error)
        return NextResponse.json(
            { error: 'Failed to sign out' },
            { status: 500 }
        )
    }
} 