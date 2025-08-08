import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
    try {
        // Test the new topic-to-urls endpoint
        const testTopic = 'artificial intelligence'

        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/sources/topic-to-urls`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ topic: testTopic }),
        })

        if (response.ok) {
            const result = await response.json()
            return NextResponse.json({
                success: true,
                message: 'Topic-to-URLs API test successful',
                testTopic,
                result: {
                    count: result.count,
                    totalFound: result.totalFound,
                    sources: result.sources,
                    message: result.message
                }
            })
        } else {
            const errorData = await response.json()
            return NextResponse.json({
                success: false,
                message: 'Topic-to-URLs API test failed',
                error: errorData.error,
                status: response.status
            })
        }
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: 'Topic-to-URLs API test error',
            error: error instanceof Error ? error.message : 'Unknown error'
        })
    }
} 