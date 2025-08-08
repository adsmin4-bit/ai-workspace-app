import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
    try {
        console.log('Testing database connection and tables...')

        // Test 1: Check if we can connect to Supabase
        const { data: connectionTest, error: connectionError } = await supabase
            .from('documents')
            .select('count')
            .limit(1)

        if (connectionError) {
            console.error('Database connection error:', connectionError)
            return NextResponse.json({
                success: false,
                error: 'Database connection failed',
                details: connectionError.message,
                code: connectionError.code,
                hint: 'Make sure your Supabase URL and keys are correct, and the database tables exist'
            }, { status: 500 })
        }

        // Test 2: Check if documents table exists and has correct structure
        const { data: documents, error: documentsError } = await supabase
            .from('documents')
            .select('*')
            .limit(1)

        if (documentsError) {
            console.error('Documents table error:', documentsError)
            return NextResponse.json({
                success: false,
                error: 'Documents table not found or incorrect structure',
                details: documentsError.message,
                code: documentsError.code,
                hint: 'Run the database migration SQL to create the required tables'
            }, { status: 500 })
        }

        // Test 3: Check table structure by trying to insert a test record
        const testId = crypto.randomUUID()
        const { data: testInsert, error: insertError } = await supabase
            .from('documents')
            .insert({
                id: testId,
                name: 'test-document.txt',
                type: 'txt',
                size: 0,
                content: 'Test content',
                processed: true,
                metadata: { test: true }
            })
            .select()
            .single()

        if (insertError) {
            console.error('Test insert error:', insertError)
            return NextResponse.json({
                success: false,
                error: 'Cannot insert into documents table',
                details: insertError.message,
                code: insertError.code,
                hint: 'Check table permissions and structure'
            }, { status: 500 })
        }

        // Clean up test record
        await supabase
            .from('documents')
            .delete()
            .eq('id', testId)

        // Test 4: Get document count
        const { count, error: countError } = await supabase
            .from('documents')
            .select('*', { count: 'exact', head: true })

        if (countError) {
            console.error('Count error:', countError)
        }

        console.log('Database tests completed successfully')

        return NextResponse.json({
            success: true,
            message: 'Database connection and tables are working correctly',
            documentCount: count || 0,
            tests: {
                connection: 'PASS',
                tableExists: 'PASS',
                insertTest: 'PASS',
                countTest: countError ? 'FAIL' : 'PASS'
            }
        })

    } catch (error) {
        console.error('Database test error:', error)
        return NextResponse.json({
            success: false,
            error: 'Database test failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
} 