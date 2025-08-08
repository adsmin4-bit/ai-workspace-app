'use client'

import { useState } from 'react'
import { X, FileText, ExternalLink, MessageSquare, ChevronDown, ChevronRight } from 'lucide-react'
import { ContextViewerProps, ContextChunk, Document, SourceUrl, NotebookEntry } from '@/types'

export default function ContextViewer({
    isOpen,
    onClose,
    contextChunks,
    sources
}: ContextViewerProps) {
    const [expandedChunks, setExpandedChunks] = useState<Set<string>>(new Set())

    if (!isOpen) return null

    const toggleChunkExpansion = (chunkId: string) => {
        const newExpanded = new Set(expandedChunks)
        if (newExpanded.has(chunkId)) {
            newExpanded.delete(chunkId)
        } else {
            newExpanded.add(chunkId)
        }
        setExpandedChunks(newExpanded)
    }

    const getSourceInfo = (chunk: ContextChunk) => {
        const metadata = chunk.metadata || {}
        const sourceType = metadata.source_type
        const sourceId = metadata.document_id || metadata.url_id || metadata.notebook_id

        switch (sourceType) {
            case 'document':
                const doc = sources.documents.find(d => d.id === sourceId)
                return {
                    type: 'document',
                    title: doc?.name || metadata.title || 'Unknown Document',
                    icon: <FileText className="w-4 h-4 text-blue-500" />,
                    url: null
                }
            case 'url':
                const url = sources.urls.find(u => u.id === sourceId)
                return {
                    type: 'url',
                    title: url?.title || metadata.title || 'Unknown URL',
                    icon: <ExternalLink className="w-4 h-4 text-green-500" />,
                    url: url?.url || metadata.url
                }
            case 'notebook':
                const note = sources.notebook.find(n => n.id === sourceId)
                return {
                    type: 'notebook',
                    title: note?.title || metadata.title || 'Unknown Note',
                    icon: <MessageSquare className="w-4 h-4 text-purple-500" />,
                    url: null
                }
            default:
                return {
                    type: 'unknown',
                    title: metadata.title || 'Unknown Source',
                    icon: <FileText className="w-4 h-4 text-gray-500" />,
                    url: null
                }
        }
    }

    const openSource = (chunk: ContextChunk) => {
        const sourceInfo = getSourceInfo(chunk)
        if (sourceInfo.url) {
            window.open(sourceInfo.url, '_blank')
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            AI Context Sources
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {contextChunks.length} context chunks used in this response
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Close context viewer"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[70vh]">
                    {contextChunks.length === 0 ? (
                        <div className="text-center py-8">
                            <FileText size={48} className="text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600">No context sources used</p>
                            <p className="text-sm text-gray-500 mt-1">
                                This response was generated without additional context
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {contextChunks.map((chunk, index) => {
                                const sourceInfo = getSourceInfo(chunk)
                                const isExpanded = expandedChunks.has(chunk.id)
                                const similarity = chunk.metadata?.similarity || 0

                                return (
                                    <div
                                        key={chunk.id}
                                        className="border border-gray-200 rounded-lg overflow-hidden"
                                    >
                                        {/* Chunk Header */}
                                        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                {sourceInfo.icon}
                                                <div>
                                                    <h3 className="font-medium text-gray-900">
                                                        {sourceInfo.title}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        {sourceInfo.type} • {Math.round(similarity * 100)}% relevant
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                {sourceInfo.url && (
                                                    <button
                                                        onClick={() => openSource(chunk)}
                                                        className="text-blue-600 hover:text-blue-800 transition-colors"
                                                        title="Open source"
                                                    >
                                                        <ExternalLink size={16} />
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => toggleChunkExpansion(chunk.id)}
                                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                                    title={isExpanded ? 'Collapse' : 'Expand'}
                                                >
                                                    {isExpanded ? (
                                                        <ChevronDown size={16} />
                                                    ) : (
                                                        <ChevronRight size={16} />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Chunk Content */}
                                        {isExpanded && (
                                            <div className="px-4 py-3 bg-white">
                                                <div className="prose prose-sm max-w-none">
                                                    <p className="text-gray-700 leading-relaxed">
                                                        {chunk.content}
                                                    </p>
                                                </div>

                                                {chunk.metadata?.tags && chunk.metadata.tags.length > 0 && (
                                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                                        <div className="flex flex-wrap gap-1">
                                                            {chunk.metadata.tags.map((tag: string, tagIndex: number) => (
                                                                <span
                                                                    key={tagIndex}
                                                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                                                >
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
} 