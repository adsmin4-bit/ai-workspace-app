import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/supabase'

export async function GET() {
    try {
        const settings = await db.getSetting('app_settings')
        return NextResponse.json({
            success: true,
            settings: settings || {}
        })
    } catch (error) {
        console.error('Get settings error:', error)
        return NextResponse.json(
            { error: 'Failed to get settings' },
            { status: 500 }
        )
    }
}

export async function POST(req: NextRequest) {
    try {
        const settings = await req.json()

        await db.setSetting('app_settings', settings)

        return NextResponse.json({
            success: true,
            message: 'Settings saved successfully'
        })
    } catch (error) {
        console.error('Save settings error:', error)
        return NextResponse.json(
            { error: 'Failed to save settings' },
            { status: 500 }
        )
    }
} 