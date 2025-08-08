'use client'

import { useState, useEffect } from 'react'
import { Brain, RefreshCw, FileText, ExternalLink } from 'lucide-react'
import { SummaryGeneratorProps, Summary } from '@/types'
import toast from 'react-hot-toast'

export default function SummaryGenerator({
    sourceId,
    sourceType,
    sourceTitle,
    sourceContent,
    onSummaryGenerated,
    size = 'md'
}: SummaryGeneratorProps) {
    const [summary, setSummary] = useState<Summary | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    // Load existing summary on mount
    useEffect(() => {
        loadExistingSummary()
    }, [])

    const loadExistingSummary = async () => {
        try {
            setIsLoading(true)
            const response = await fetch(`/api/summaries/${sourceId}?type=${sourceType}`)
            if (response.ok) {
                const data = await response.json()
                if (data.success && data.data) {
                    setSummary(data.data)
                }
            }
        } catch (error) {
            console.error('Error loading summary:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const generateSummary = async () => {
        try {
            setIsGenerating(true)

            const response = await fetch('/api/summaries/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sourceId,
                    sourceType,
                    sourceTitle,
                    sourceContent
                })
            })

            if (!response.ok) {
                throw new Error('Failed to generate summary')
            }

            const data = await response.json()
            if (data.success) {
                setSummary(data.data)
                onSummaryGenerated?.(data.data)
                toast.success('Summary generated successfully!')
            } else {
                throw new Error(data.error || 'Failed to generate summary')
            }
        } catch (error) {
            console.error('Error generating summary:', error)
            toast.error('Failed to generate summary')
        } finally {
            setIsGenerating(false)
        }
    }

    const getSourceIcon = () => {
        switch (sourceType) {
            case 'document':
                return <FileText className="w-4 h-4" />
            case 'url':
                return <ExternalLink className="w-4 h-4" />
            case 'youtube':
                return <FileText className="w-4 h-4" />
            case 'notebook':
                return <FileText className="w-4 h-4" />
            default:
                return <FileText className="w-4 h-4" />
        }
    }

    const getButtonSize = () => {
        switch (size) {
            case 'sm':
                return 'px-2 py-1 text-xs'
            case 'md':
                return 'px-3 py-2 text-sm'
            case 'lg':
                return 'px-4 py-2 text-base'
            default:
                return 'px-3 py-2 text-sm'
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center space-x-2 text-gray-500">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading...</span>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {/* Generate/Regenerate Button */}
            <button
                onClick={generateSummary}
                disabled={isGenerating}
                className={`btn-outline flex items-center space-x-2 ${getButtonSize()} disabled:opacity-50`}
            >
                {isGenerating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                    <Brain className="w-4 h-4" />
                )}
                <span>
                    {summary ? '📝 Regenerate Summary' : '🧠 Generate Summary'}
                </span>
            </button>

            {/* Summary Display */}
            {summary && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                            {getSourceIcon()}
                            <h4 className="font-medium text-blue-900">AI Summary</h4>
                        </div>
                        <div className="text-xs text-blue-600">
                            {summary.wordCount && `${summary.wordCount} words`}
                        </div>
                    </div>

                    <div className="prose prose-sm max-w-none">
                        <p className="text-blue-800 leading-relaxed">
                            {summary.summary}
                        </p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-blue-200">
                        <div className="flex items-center justify-between text-xs text-blue-600">
                            <span>Generated with {summary.modelUsed || 'GPT-4'}</span>
                            <span>
                                {summary.generatedAt &&
                                    new Date(summary.generatedAt).toLocaleDateString()
                                }
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
} 