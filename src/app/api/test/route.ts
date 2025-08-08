import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
    return NextResponse.json({ message: 'API is working!' })
}

export async function POST(req: NextRequest) {
    const body = await req.json()
    return NextResponse.json({ message: 'POST is working!', data: body })
} 