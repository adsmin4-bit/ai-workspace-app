import { NextRequest, NextResponse } from 'next/server'
import { db, supabase } from '@/lib/supabase'
import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

// Function to get embeddings for text using OpenAI
async function getEmbedding(text: string): Promise<number[]> {
    try {
        const embeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-ada-002',
            input: text.trim(),
        })
        return embeddingResponse.data[0].embedding
    } catch (error) {
        console.error('Embedding generation error:', error)
        return []
    }
}

export async function POST(req: NextRequest) {
    try {
        // Sample content for testing RAG
        const sampleContent = [
            {
                title: "AI and Machine Learning Basics",
                content: "Artificial Intelligence (AI) is a branch of computer science that aims to create intelligent machines that work and react like humans. Machine Learning is a subset of AI that enables computers to learn and improve from experience without being explicitly programmed. Deep Learning is a subset of machine learning that uses neural networks with multiple layers to model and understand complex patterns. These technologies are revolutionizing industries from healthcare to finance, enabling automation, predictive analytics, and intelligent decision-making systems."
            },
            {
                title: "Web Development Best Practices",
                content: "Modern web development involves using frameworks like React, Vue, or Angular for frontend development. Backend development typically uses Node.js, Python (Django/Flask), or Ruby on Rails. Database design should follow normalization principles and consider scalability. API design should be RESTful with proper error handling and documentation. Security practices include input validation, authentication, authorization, and protection against common vulnerabilities like SQL injection and XSS attacks."
            },
            {
                title: "Data Science Fundamentals",
                content: "Data Science combines statistics, programming, and domain expertise to extract insights from data. The data science process includes data collection, cleaning, exploration, modeling, and interpretation. Popular tools include Python (pandas, numpy, scikit-learn), R, and SQL. Machine learning algorithms can be supervised (classification, regression) or unsupervised (clustering, dimensionality reduction). Data visualization is crucial for communicating findings effectively."
            }
        ]

        const results = []

        for (const item of sampleContent) {
            // Generate embedding for the content
            const embedding = await getEmbedding(item.content)

            if (embedding.length === 0) {
                console.warn(`Failed to generate embedding for: ${item.title}`)
                continue
            }

            // Save to context_chunks table
            const savedChunk = await db.saveContextChunk(item.content, {
                source_type: 'document',
                title: item.title,
                test_data: true
            }, embedding)

            results.push({
                title: item.title,
                id: savedChunk.id,
                content_length: item.content.length
            })

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200))
        }

        return NextResponse.json({
            success: true,
            message: `Successfully created ${results.length} test context chunks`,
            results: results
        })

    } catch (error) {
        console.error('Error creating test data:', error)
        return NextResponse.json(
            { error: 'Failed to create test data' },
            { status: 500 }
        )
    }
}

export async function GET() {
    try {
        // Get count of context chunks
        const { count } = await supabase
            .from('context_chunks')
            .select('*', { count: 'exact', head: true })

        return NextResponse.json({
            success: true,
            context_chunks_count: count || 0,
            message: 'RAG system is ready for testing'
        })

    } catch (error) {
        console.error('Error checking RAG status:', error)
        return NextResponse.json(
            { error: 'Failed to check RAG status' },
            { status: 500 }
        )
    }
} 