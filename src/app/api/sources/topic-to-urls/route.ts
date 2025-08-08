import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/supabase'

interface SearchResult {
    url: string
    title: string
    snippet: string
}

// DuckDuckGo HTML scraping function
async function scrapeDuckDuckGo(query: string): Promise<SearchResult[]> {
    const results: SearchResult[] = []

    try {
        // Use DuckDuckGo HTML search
        const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`

        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        })

        if (response.ok) {
            const html = await response.text()

            // Extract URLs from DuckDuckGo HTML results
            const urlMatches = html.match(/href="([^"]*uddg=([^"]*))"/g)
            const titleMatches = html.match(/class="result__title"[^>]*>([^<]*)</g)
            const snippetMatches = html.match(/class="result__snippet"[^>]*>([^<]*)</g)

            if (urlMatches) {
                for (let i = 0; i < Math.min(urlMatches.length, 10); i++) {
                    const urlMatch = urlMatches[i].match(/uddg=([^"]*)/)
                    const titleMatch = titleMatches?.[i]?.match(/>([^<]*)</)
                    const snippetMatch = snippetMatches?.[i]?.match(/>([^<]*)</)

                    if (urlMatch) {
                        const url = decodeURIComponent(urlMatch[1])
                        const title = titleMatch ? titleMatch[1].trim() : `Result for ${query}`
                        const snippet = snippetMatch ? snippetMatch[1].trim() : `Search result for ${query}`

                        results.push({ url, title, snippet })
                    }
                }
            }
        }
    } catch (error) {
        console.error('DuckDuckGo scraping error:', error)
    }

    return results
}

// Wikipedia search function
async function searchWikipedia(query: string): Promise<SearchResult[]> {
    const results: SearchResult[] = []

    try {
        // Search Wikipedia API
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`

        const response = await fetch(searchUrl)

        if (response.ok) {
            const data = await response.json()

            if (data.query?.search) {
                for (const item of data.query.search.slice(0, 5)) {
                    const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`
                    const title = item.title
                    const snippet = item.snippet.replace(/<\/?[^>]+(>|$)/g, '') // Remove HTML tags

                    results.push({ url, title, snippet })
                }
            }
        }
    } catch (error) {
        console.error('Wikipedia search error:', error)
    }

    return results
}

// Additional search sources
async function getAdditionalSources(query: string): Promise<SearchResult[]> {
    const results: SearchResult[] = []

    // Add reliable fallback sources
    const fallbackSources = [
        {
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
            title: `${query} - Wikipedia`,
            snippet: `Wikipedia article about ${query}`
        },
        {
            url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
            title: `Search results for ${query} - Google`,
            snippet: `Google search results for ${query}`
        },
        {
            url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
            title: `Search results for ${query} - DuckDuckGo`,
            snippet: `DuckDuckGo search results for ${query}`
        },
        {
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
            title: `${query} videos - YouTube`,
            snippet: `YouTube videos related to ${query}`
        },
        {
            url: `https://github.com/topics/${encodeURIComponent(query)}`,
            title: `${query} repositories - GitHub`,
            snippet: `GitHub repositories tagged with ${query}`
        },
        {
            url: `https://stackoverflow.com/search?q=${encodeURIComponent(query)}`,
            title: `${query} questions - Stack Overflow`,
            snippet: `Stack Overflow questions about ${query}`
        },
        {
            url: `https://www.reddit.com/search/?q=${encodeURIComponent(query)}`,
            title: `${query} discussions - Reddit`,
            snippet: `Reddit discussions about ${query}`
        }
    ]

    results.push(...fallbackSources)

    return results
}

// Deduplicate URLs
function deduplicateUrls(urls: SearchResult[]): SearchResult[] {
    const seen = new Set<string>()
    const unique: SearchResult[] = []

    for (const url of urls) {
        const normalizedUrl = url.url.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')
        if (!seen.has(normalizedUrl)) {
            seen.add(normalizedUrl)
            unique.push(url)
        }
    }

    return unique
}

export async function POST(req: NextRequest) {
    try {
        const { topic } = await req.json()

        if (!topic || !topic.trim()) {
            return NextResponse.json(
                { error: 'Topic is required' },
                { status: 400 }
            )
        }

        console.log('Finding URLs for topic:', topic)

        // Get current user for owner_id
        const user = await db.getCurrentUser()
        if (!user) {
            return NextResponse.json(
                { error: 'User not authenticated' },
                { status: 401 }
            )
        }

        // Gather URLs from multiple sources
        const allResults: SearchResult[] = []

        // 1. DuckDuckGo scraping
        console.log('Scraping DuckDuckGo...')
        const duckDuckGoResults = await scrapeDuckDuckGo(topic.trim())
        allResults.push(...duckDuckGoResults)
        console.log(`Found ${duckDuckGoResults.length} URLs from DuckDuckGo`)

        // 2. Wikipedia search
        console.log('Searching Wikipedia...')
        const wikipediaResults = await searchWikipedia(topic.trim())
        allResults.push(...wikipediaResults)
        console.log(`Found ${wikipediaResults.length} URLs from Wikipedia`)

        // 3. Additional sources
        console.log('Adding additional sources...')
        const additionalResults = await getAdditionalSources(topic.trim())
        allResults.push(...additionalResults)
        console.log(`Found ${additionalResults.length} URLs from additional sources`)

        // Deduplicate and limit results
        const uniqueResults = deduplicateUrls(allResults).slice(0, 20)
        console.log(`Total unique URLs found: ${uniqueResults.length}`)

        // Save URLs to database
        const savedUrls = []
        for (const result of uniqueResults) {
            try {
                // Check if URL already exists for this user and topic
                const existingUrls = await db.getSourceUrls()
                const alreadyExists = existingUrls.some(url =>
                    url.url === result.url && url.topic === topic.trim() && url.owner_id === user.id
                )

                if (!alreadyExists) {
                    const savedUrl = await db.createSourceUrl({
                        topic: topic.trim(),
                        url: result.url,
                        title: result.title,
                        include_in_memory: true,
                        folder_id: null,
                        context_weight: 100,
                        tags: [],
                        owner_id: user.id
                    })

                    savedUrls.push(savedUrl)

                    // Save to RAG memory with web scraping
                    try {
                        let urlContent = `Topic: ${topic.trim()}\nURL: ${result.url}\nTitle: ${result.title}\nSnippet: ${result.snippet}\n\nThis is a saved URL reference for the topic: ${topic.trim()}.`

                        // Try to scrape actual content from the URL
                        try {
                            const response = await fetch(result.url, {
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
                                    .substring(0, 3000) // Limit content length

                                if (textContent.length > 100) {
                                    urlContent = `Topic: ${topic.trim()}\nURL: ${result.url}\nTitle: ${result.title}\nSnippet: ${result.snippet}\n\nContent:\n${textContent}`
                                }
                            }
                        } catch (scrapeError) {
                            console.log('Web scraping failed for URL:', result.url, scrapeError)
                            // Continue with basic content if scraping fails
                        }

                        const { saveChunksToMemory } = await import('@/lib/rag-utils')
                        await saveChunksToMemory({
                            sourceType: 'url',
                            sourceId: savedUrl.id,
                            title: result.title || result.url,
                            fullText: urlContent,
                            metadata: {
                                url: result.url,
                                topic: topic.trim(),
                                snippet: result.snippet,
                                created_at: savedUrl.created_at
                            }
                        })
                        console.log('URL saved to RAG memory')
                    } catch (ragError) {
                        console.error('Error saving URL to RAG memory:', ragError)
                        // Don't fail the URL saving if RAG saving fails
                    }

                    // Create chat source entry for the URL
                    try {
                        await db.createChatSourceForContent('url', savedUrl.id, result.title || result.url)
                        console.log('Chat source created for URL:', savedUrl.id)
                    } catch (error) {
                        console.error('Error creating chat source for URL:', error)
                        // Don't fail the URL saving if chat source creation fails
                    }
                } else {
                    console.log('URL already exists:', result.url)
                }
            } catch (error) {
                console.error('Error saving URL:', result.url, error)
                // Continue with other URLs even if one fails
            }
        }

        console.log('Saved URLs to database:', savedUrls.length)

        return NextResponse.json({
            success: true,
            urls: savedUrls,
            count: savedUrls.length,
            topic: topic.trim(),
            totalFound: uniqueResults.length,
            message: `Found ${uniqueResults.length} URLs and saved ${savedUrls.length} new URLs for topic: ${topic}`,
            sources: {
                duckDuckGo: duckDuckGoResults.length,
                wikipedia: wikipediaResults.length,
                additional: additionalResults.length
            }
        })

    } catch (error) {
        console.error('Topic to URLs error:', error)
        return NextResponse.json(
            { error: 'Failed to find URLs for topic' },
            { status: 500 }
        )
    }
}

export async function GET() {
    try {
        const urls = await db.getSourceUrls()
        return NextResponse.json({
            success: true,
            urls,
            count: urls.length
        })
    } catch (error) {
        console.error('Get URLs error:', error)
        return NextResponse.json(
            { error: 'Failed to get URLs' },
            { status: 500 }
        )
    }
} 