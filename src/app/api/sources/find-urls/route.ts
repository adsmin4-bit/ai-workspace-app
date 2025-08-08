import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/supabase'

export async function POST(req: NextRequest) {
    let topic = ''

    try {
        const body = await req.json()
        topic = body.topic

        if (!topic || !topic.trim()) {
            return NextResponse.json(
                { error: 'Topic is required' },
                { status: 400 }
            )
        }

        console.log('Finding URLs for topic:', topic)

        // Use DuckDuckGo Instant Answer API for real search results
        const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(topic.trim())}&format=json&no_html=1&skip_disambig=1`

        let realUrls = []

        try {
            const response = await fetch(searchUrl)
            const data = await response.json()

            // Extract relevant information from DuckDuckGo response
            if (data.Abstract && data.AbstractURL) {
                realUrls.push({
                    topic: topic.trim(),
                    url: data.AbstractURL,
                    title: data.Heading || `${topic} - Search Result`
                })
            }

            if (data.RelatedTopics && data.RelatedTopics.length > 0) {
                data.RelatedTopics.slice(0, 3).forEach((topicItem: any) => {
                    if (topicItem.Text && topicItem.FirstURL) {
                        realUrls.push({
                            topic: topic.trim(),
                            url: topicItem.FirstURL,
                            title: topicItem.Text.split(' - ')[0] || `${topic} - Related Topic`
                        })
                    }
                })
            }
        } catch (apiError) {
            console.error('DuckDuckGo API error:', apiError)
        }

        // Add reliable fallback sources
        const fallbackUrls = [
            {
                topic: topic.trim(),
                url: `https://en.wikipedia.org/wiki/${encodeURIComponent(topic.trim())}`,
                title: `${topic} - Wikipedia`
            },
            {
                topic: topic.trim(),
                url: `https://www.google.com/search?q=${encodeURIComponent(topic.trim())}`,
                title: `Search results for ${topic} - Google`
            },
            {
                topic: topic.trim(),
                url: `https://duckduckgo.com/?q=${encodeURIComponent(topic.trim())}`,
                title: `Search results for ${topic} - DuckDuckGo`
            },
            {
                topic: topic.trim(),
                url: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic.trim())}`,
                title: `${topic} videos - YouTube`
            },
            {
                topic: topic.trim(),
                url: `https://github.com/topics/${encodeURIComponent(topic.trim())}`,
                title: `${topic} repositories - GitHub`
            }
        ]

        // Combine real results with fallback URLs, avoiding duplicates
        const allUrls = [...realUrls]
        fallbackUrls.forEach(fallbackUrl => {
            if (!allUrls.some(url => url.url === fallbackUrl.url)) {
                allUrls.push(fallbackUrl)
            }
        })

        console.log('URLs to save:', allUrls.length)

        // Get current user for owner_id
        const user = await db.getCurrentUser()
        if (!user) {
            return NextResponse.json(
                { error: 'User not authenticated' },
                { status: 401 }
            )
        }

        // Save URLs to database
        const savedUrls = []
        for (const urlData of allUrls) {
            try {
                const savedUrl = await db.createSourceUrl({
                    ...urlData,
                    owner_id: user.id
                })
                savedUrls.push(savedUrl)

                // NEW: Automatically save URL to RAG memory with web scraping
                try {
                    let urlContent = `Topic: ${urlData.topic}\nURL: ${urlData.url}\nTitle: ${urlData.title || 'No title'}\n\nThis is a saved URL reference for the topic: ${urlData.topic}. The URL points to: ${urlData.url}`

                    // Try to scrape actual content from the URL
                    try {
                        const response = await fetch(urlData.url, {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                            }
                        })

                        if (response.ok) {
                            const html = await response.text()

                            // Simple text extraction (remove HTML tags)
                            const textContent = html
                                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                                .replace(/<[^>]+>/g, ' ')
                                .replace(/\s+/g, ' ')
                                .trim()
                                .substring(0, 5000) // Limit content length

                            if (textContent.length > 100) {
                                urlContent = `Topic: ${urlData.topic}\nURL: ${urlData.url}\nTitle: ${urlData.title || 'No title'}\n\nContent:\n${textContent}`
                            }
                        }
                    } catch (scrapeError) {
                        console.log('Web scraping failed for URL:', urlData.url, scrapeError)
                        // Continue with basic content if scraping fails
                    }

                    const { saveChunksToMemory } = await import('@/lib/rag-utils')
                    await saveChunksToMemory({
                        sourceType: 'url',
                        sourceId: savedUrl.id,
                        title: urlData.title || urlData.url,
                        fullText: urlContent,
                        metadata: {
                            url: urlData.url,
                            topic: urlData.topic,
                            created_at: savedUrl.created_at
                        }
                    })
                    console.log('URL saved to RAG memory')
                } catch (ragError) {
                    console.error('Error saving URL to RAG memory:', ragError)
                    // Don't fail the URL saving if RAG saving fails
                }

                // NEW: Create chat source entry for the URL
                try {
                    await db.createChatSourceForContent('url', savedUrl.id, urlData.title || urlData.url)
                    console.log('Chat source created for URL:', savedUrl.id)
                } catch (error) {
                    console.error('Error creating chat source for URL:', error)
                    // Don't fail the URL saving if chat source creation fails
                }
            } catch (error) {
                console.error('Error saving URL:', urlData.url, error)
                // Continue with other URLs even if one fails
            }
        }

        console.log('Saved URLs to database:', savedUrls.length)

        return NextResponse.json({
            success: true,
            urls: savedUrls,
            count: savedUrls.length,
            topic: topic.trim(),
            message: `Found and saved ${savedUrls.length} URLs for topic: ${topic}`,
            source: realUrls.length > 0 ? 'duckduckgo_api' : 'fallback_sources'
        })

    } catch (error) {
        console.error('Find URLs error:', error)

        // Fallback: return some example URLs if everything fails
        const fallbackUrls = [
            {
                topic: topic || 'example',
                url: `https://duckduckgo.com/?q=${encodeURIComponent(topic || 'example')}`,
                title: `Search results for: ${topic || 'example'}`
            },
            {
                topic: topic || 'example',
                url: `https://en.wikipedia.org/wiki/${encodeURIComponent(topic || 'example')}`,
                title: `${topic || 'example'} - Wikipedia`
            }
        ]

        return NextResponse.json({
            success: true,
            urls: fallbackUrls,
            count: fallbackUrls.length,
            topic: topic || 'example',
            message: 'Search temporarily unavailable. Please try again later.',
            fallback: true,
            error: error instanceof Error ? error.message : 'Unknown error'
        })
    }
}

export async function GET() {
    try {
        // Get all saved URLs grouped by topic
        const allUrls = await db.getSourceUrls()

        // Group URLs by topic
        const groupedUrls = allUrls.reduce((acc: any, url: any) => {
            const topic = url.topic
            if (!acc[topic]) {
                acc[topic] = []
            }
            acc[topic].push(url)
            return acc
        }, {})

        return NextResponse.json({
            success: true,
            urls: groupedUrls,
            totalUrls: allUrls.length,
            totalTopics: Object.keys(groupedUrls).length
        })
    } catch (error) {
        console.error('Get URLs error:', error)
        return NextResponse.json(
            { error: 'Failed to get URLs' },
            { status: 500 }
        )
    }
} 