'use client'

import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, FileText, BookOpen, Globe, Youtube, CheckSquare, Square } from 'lucide-react'

interface ChatSource {
    id: string
    type: 'document' | 'notebook' | 'url' | 'youtube'
    source_id: string
    name: string
    selected: boolean
    created_at: string
}

interface ChatSourcesToggleProps {
    selectedSources: string[]
    onSourcesChange: (selectedSources: string[]) => void
}

export default function ChatSourcesToggle({ selectedSources, onSourcesChange }: ChatSourcesToggleProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [chatSources, setChatSources] = useState<ChatSource[]>([])
    const [loading, setLoading] = useState(false)
    const [updating, setUpdating] = useState<string | null>(null)

    // Group sources by type
    const groupedSources = chatSources.reduce((acc, source) => {
        if (!acc[source.type]) {
            acc[source.type] = []
        }
        acc[source.type].push(source)
        return acc
    }, {} as Record<string, ChatSource[]>)

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'document':
                return <FileText className="w-4 h-4" />
            case 'notebook':
                return <BookOpen className="w-4 h-4" />
            case 'url':
                return <Globe className="w-4 h-4" />
            case 'youtube':
                return <Youtube className="w-4 h-4" />
            default:
                return <FileText className="w-4 h-4" />
        }
    }

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'document':
                return 'Documents'
            case 'notebook':
                return 'Notebook'
            case 'url':
                return 'Web Sources'
            case 'youtube':
                return 'YouTube'
            default:
                return type
        }
    }

    const fetchChatSources = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/chat-sources')
            if (response.ok) {
                const data = await response.json()
                if (data.success) {
                    setChatSources(data.data)
                }
            }
        } catch (error) {
            console.error('Error fetching chat sources:', error)
        } finally {
            setLoading(false)
        }
    }

    const toggleSource = async (sourceId: string, selected: boolean) => {
        setUpdating(sourceId)
        try {
            const response = await fetch('/api/chat-sources', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: sourceId,
                    selected: selected
                })
            })

            if (response.ok) {
                // Update local state
                setChatSources(prev => prev.map(source =>
                    source.id === sourceId ? { ...source, selected } : source
                ))

                // Update parent component with source_id instead of chat source id
                const source = chatSources.find(s => s.id === sourceId)
                if (source) {
                    const updatedSelectedSources = selected
                        ? [...selectedSources, source.source_id]
                        : selectedSources.filter(id => id !== source.source_id)

                    onSourcesChange(updatedSelectedSources)
                }
            }
        } catch (error) {
            console.error('Error updating chat source:', error)
        } finally {
            setUpdating(null)
        }
    }

    useEffect(() => {
        fetchChatSources()
    }, [])

    // Sync selected sources with chat sources
    useEffect(() => {
        const selectedSourceIds = chatSources
            .filter(source => source.selected)
            .map(source => source.source_id)

        // Only update if the arrays are different
        if (JSON.stringify(selectedSourceIds.sort()) !== JSON.stringify(selectedSources.sort())) {
            onSourcesChange(selectedSourceIds)
        }
    }, [chatSources, selectedSources, onSourcesChange])

    const selectedCount = chatSources.filter(source => source.selected).length
    const totalCount = chatSources.length

    return (
        <div className="bg-white border border-gray-200 rounded-lg mb-4">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">Sources Included</span>
                    <span className="text-sm text-gray-500">
                        ({selectedCount} of {totalCount})
                    </span>
                </div>
                {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
            </button>

            {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-200">
                    {loading ? (
                        <div className="py-4 text-center text-gray-500">
                            Loading sources...
                        </div>
                    ) : chatSources.length === 0 ? (
                        <div className="py-4 text-center text-gray-500">
                            No sources available. Upload documents, add notebook entries, or save URLs to see them here.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {Object.entries(groupedSources).map(([type, sources]) => (
                                <div key={type} className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        {getTypeIcon(type)}
                                        {getTypeLabel(type)}
                                        <span className="text-gray-500">
                                            ({sources.filter(s => s.selected).length} of {sources.length})
                                        </span>
                                    </div>
                                    <div className="ml-6 space-y-1">
                                        {sources.map((source) => (
                                            <label
                                                key={source.id}
                                                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer"
                                                onClick={() => toggleSource(source.id, !source.selected)}
                                            >
                                                <div className="relative">
                                                    {updating === source.id ? (
                                                        <div className="w-4 h-4 border-2 border-gray-300 rounded animate-pulse" />
                                                    ) : source.selected ? (
                                                        <CheckSquare className="w-4 h-4 text-blue-600" />
                                                    ) : (
                                                        <Square className="w-4 h-4 text-gray-400" />
                                                    )}
                                                </div>
                                                <span className="truncate flex-1" title={source.name}>
                                                    {source.name}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
} 