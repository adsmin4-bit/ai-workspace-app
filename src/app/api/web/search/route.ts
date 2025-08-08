import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const { query } = await req.json()

        if (!query) {
            return NextResponse.json(
                { error: 'Query is required' },
                { status: 400 }
            )
        }

        console.log('Performing web search for:', query)

        let results = []

        // Use DuckDuckGo Instant Answer API for real search results
        try {
            const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
            const response = await fetch(searchUrl)
            const data = await response.json()

            // Extract relevant information from DuckDuckGo response
            if (data.Abstract && data.AbstractURL) {
                results.push({
                    title: data.Heading || 'Search Result',
                    url: data.AbstractURL,
                    snippet: data.Abstract
                })
            }

            if (data.RelatedTopics && data.RelatedTopics.length > 0) {
                data.RelatedTopics.slice(0, 5).forEach((topic: any) => {
                    if (topic.Text && topic.FirstURL) {
                        results.push({
                            title: topic.Text.split(' - ')[0] || 'Related Topic',
                            url: topic.FirstURL,
                            snippet: topic.Text
                        })
                    }
                })
            }
        } catch (apiError) {
            console.error('DuckDuckGo API error:', apiError)
        }

        // If no results from DuckDuckGo, provide fallback
        if (results.length === 0) {
            results.push({
                title: `Search results for: ${query}`,
                url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
                snippet: `No direct results found. Click to search DuckDuckGo for "${query}".`
            })
        }

        return NextResponse.json({
            success: true,
            results: results,
            query: query,
            source: results.length > 0 && results[0].url !== '#' ? 'duckduckgo_api' : 'fallback'
        })
    } catch (error) {
        console.error('Web search error:', error)

        // Get query from request body for fallback
        let query = 'unknown'
        try {
            const body = await req.json()
            query = body.query || 'unknown'
        } catch (e) {
            // If we can't parse the body, use default
        }

        // Fallback response
        return NextResponse.json({
            success: true,
            results: [
                {
                    title: `Search results for: ${query}`,
                    url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
                    snippet: `Search for "${query}" on DuckDuckGo. API temporarily unavailable.`
                }
            ],
            query: query,
            source: 'fallback',
            error: error instanceof Error ? error.message : 'Unknown error'
        })
    }
} 