'use client'

import React from 'react'
import { FileText, Link, BookOpen, MessageSquare, X, BarChart3 } from 'lucide-react'
import { ContextChunk, Document, SourceUrl, NotebookEntry } from '@/types'

interface ContextViewProps {
    isOpen: boolean
    onClose: () => void
    contextChunks: ContextChunk[]
    sources: {
        documents: Document[]
        urls: SourceUrl[]
        notebook: NotebookEntry[]
    }
    similarityScores?: { [sourceId: string]: number }
}

export default function ContextView({
    isOpen,
    onClose,
    contextChunks,
    sources,
    similarityScores = {}
}: ContextViewProps) {
    if (!isOpen) return null

    const getSourceIcon = (sourceType: string) => {
        switch (sourceType) {
            case 'document':
                return <FileText className="w-4 h-4 text-blue-500" />
            case 'url':
                return <Link className="w-4 h-4 text-green-500" />
            case 'notebook':
                return <BookOpen className="w-4 h-4 text-purple-500" />
            case 'chat':
                return <MessageSquare className="w-4 h-4 text-orange-500" />
            default:
                return <FileText className="w-4 h-4 text-gray-500" />
        }
    }

    const getSourceTypeLabel = (sourceType: string) => {
        switch (sourceType) {
            case 'document':
                return 'Document'
            case 'url':
                return 'Web Source'
            case 'notebook':
                return 'Note'
            case 'chat':
                return 'Chat History'
            default:
                return 'Source'
        }
    }

    const getSourceTitle = (chunk: ContextChunk) => {
        const sourceId = chunk.metadata?.document_id || chunk.metadata?.url_id || chunk.metadata?.notebook_id

        if (chunk.metadata?.document_id) {
            const doc = sources.documents.find(d => d.id === chunk.metadata!.document_id)
            return doc?.name || chunk.metadata?.title || 'Unknown Document'
        }

        if (chunk.metadata?.url_id) {
            const url = sources.urls.find(u => u.id === chunk.metadata!.url_id)
            return url?.title || url?.url || chunk.metadata?.title || 'Unknown URL'
        }

        if (chunk.metadata?.notebook_id) {
            const note = sources.notebook.find(n => n.id === chunk.metadata!.notebook_id)
            return note?.title || chunk.metadata?.title || 'Unknown Note'
        }

        return chunk.metadata?.title || 'Unknown Source'
    }

    const getSimilarityScore = (chunk: ContextChunk) => {
        const sourceId = chunk.metadata?.document_id || chunk.metadata?.url_id || chunk.metadata?.notebook_id
        return similarityScores[sourceId || ''] || chunk.similarity || 0
    }

    const getSimilarityColor = (score: number) => {
        if (score >= 0.8) return 'text-green-600'
        if (score >= 0.6) return 'text-yellow-600'
        if (score >= 0.4) return 'text-orange-600'
        return 'text-red-600'
    }

    const getSimilarityLabel = (score: number) => {
        if (score >= 0.8) return 'Very High'
        if (score >= 0.6) return 'High'
        if (score >= 0.4) return 'Medium'
        if (score >= 0.2) return 'Low'
        return 'Very Low'
    }

    const groupedChunks = contextChunks.reduce((acc, chunk) => {
        const sourceType = chunk.metadata?.source_type || 'unknown'
        const sourceId = chunk.metadata?.document_id || chunk.metadata?.url_id || chunk.metadata?.notebook_id || 'unknown'

        if (!acc[sourceType]) {
            acc[sourceType] = {}
        }
        if (!acc[sourceType][sourceId]) {
            acc[sourceType][sourceId] = []
        }
        acc[sourceType][sourceId].push(chunk)
        return acc
    }, {} as Record<string, Record<string, ContextChunk[]>>)

    return (
        <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-gray-200 shadow-xl z-40 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                    <h2 className="text-lg font-semibold">Context View</h2>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Close context view"
                    aria-label="Close context view"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {contextChunks.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No context sources used in this response</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {Object.entries(groupedChunks).map(([sourceType, sourceGroups]) => (
                            <div key={sourceType} className="space-y-3">
                                <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                                    {getSourceTypeLabel(sourceType)}s ({Object.keys(sourceGroups).length})
                                </h3>

                                {Object.entries(sourceGroups).map(([sourceId, chunks]) => {
                                    const firstChunk = chunks[0]
                                    const title = getSourceTitle(firstChunk)
                                    const avgSimilarity = chunks.reduce((sum, chunk) => sum + getSimilarityScore(chunk), 0) / chunks.length

                                    return (
                                        <div key={sourceId} className="border rounded-lg p-3 bg-gray-50">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    {getSourceIcon(sourceType)}
                                                    <div>
                                                        <div className="font-medium text-sm">{title}</div>
                                                        <div className="text-xs text-gray-500">
                                                            {chunks.length} chunk{chunks.length !== 1 ? 's' : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-sm font-medium ${getSimilarityColor(avgSimilarity)}`}>
                                                        {(avgSimilarity * 100).toFixed(1)}%
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {getSimilarityLabel(avgSimilarity)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                {chunks.slice(0, 2).map((chunk, index) => (
                                                    <div key={index} className="text-xs text-gray-600 bg-white p-2 rounded border">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="font-medium">Chunk {index + 1}</span>
                                                            <span className={`text-xs ${getSimilarityColor(getSimilarityScore(chunk))}`}>
                                                                {(getSimilarityScore(chunk) * 100).toFixed(1)}%
                                                            </span>
                                                        </div>
                                                        <div className="line-clamp-3">
                                                            {chunk.content.length > 150
                                                                ? `${chunk.content.substring(0, 150)}...`
                                                                : chunk.content
                                                            }
                                                        </div>
                                                    </div>
                                                ))}

                                                {chunks.length > 2 && (
                                                    <div className="text-xs text-gray-500 text-center">
                                                        +{chunks.length - 2} more chunk{chunks.length - 2 !== 1 ? 's' : ''}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="text-xs text-gray-500">
                    <div className="flex items-center justify-between mb-1">
                        <span>Total sources used:</span>
                        <span className="font-medium">{Object.keys(groupedChunks).length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Total chunks:</span>
                        <span className="font-medium">{contextChunks.length}</span>
                    </div>
                </div>
            </div>
        </div>
    )
} 