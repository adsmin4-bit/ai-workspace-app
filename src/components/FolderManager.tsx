'use client'

import React, { useState, useEffect } from 'react'
import { Folder, Plus, Edit, Trash2, FolderOpen, FolderClosed, Eye, EyeOff } from 'lucide-react'
import { Folder as FolderType, SourceItem } from '@/types'

interface FolderManagerProps {
    isOpen: boolean
    onClose: () => void
    onFolderCreated?: (folder: FolderType) => void
    onFolderUpdated?: (folder: FolderType) => void
    onFolderDeleted?: (folderId: string) => void
}

export default function FolderManager({
    isOpen,
    onClose,
    onFolderCreated,
    onFolderUpdated,
    onFolderDeleted
}: FolderManagerProps) {
    const [folders, setFolders] = useState<FolderType[]>([])
    const [sources, setSources] = useState<SourceItem[]>([])
    const [isCreating, setIsCreating] = useState(false)
    const [editingFolder, setEditingFolder] = useState<FolderType | null>(null)
    const [newFolder, setNewFolder] = useState({
        name: '',
        type: 'mixed' as const,
        description: '',
        color: '#3B82F6',
        includeInContext: true
    })

    useEffect(() => {
        if (isOpen) {
            fetchFolders()
            fetchSources()
        }
    }, [isOpen])

    const fetchFolders = async () => {
        try {
            const response = await fetch('/api/folders')
            if (response.ok) {
                const data = await response.json()
                setFolders(data.data || [])
            }
        } catch (error) {
            console.error('Error fetching folders:', error)
        }
    }

    const fetchSources = async () => {
        try {
            const [documentsRes, urlsRes, notesRes] = await Promise.all([
                fetch('/api/documents'),
                fetch('/api/sources/find-urls'),
                fetch('/api/notebook')
            ])

            const documents = documentsRes.ok ? await documentsRes.json() : { data: [] }
            const urls = urlsRes.ok ? await urlsRes.json() : { data: [] }
            const notes = notesRes.ok ? await notesRes.json() : { data: [] }

            const allSources: SourceItem[] = [
                ...(documents.data || []).map((doc: any) => ({
                    id: doc.id,
                    type: 'document' as const,
                    title: doc.name,
                    content: doc.content,
                    includeInMemory: doc.include_in_memory,
                    contextWeight: doc.context_weight || 100,
                    folderId: doc.folder_id,
                    tags: doc.tags || [],
                    createdAt: doc.created_at
                })),
                ...(urls.data || []).map((url: any) => ({
                    id: url.id,
                    type: 'url' as const,
                    title: url.title || url.url,
                    content: url.url,
                    includeInMemory: url.include_in_memory,
                    contextWeight: url.context_weight || 100,
                    folderId: url.folder_id,
                    tags: url.tags || [],
                    createdAt: url.created_at
                })),
                ...(notes.data || []).map((note: any) => ({
                    id: note.id,
                    type: 'notebook' as const,
                    title: note.title,
                    content: note.content,
                    includeInMemory: note.include_in_memory,
                    contextWeight: note.context_weight || 100,
                    folderId: note.folder_id,
                    tags: note.tags || [],
                    createdAt: note.created_at
                }))
            ]

            setSources(allSources)
        } catch (error) {
            console.error('Error fetching sources:', error)
        }
    }

    const createFolder = async () => {
        try {
            const response = await fetch('/api/folders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newFolder)
            })

            if (response.ok) {
                const data = await response.json()
                setFolders([...folders, data.data])
                setNewFolder({
                    name: '',
                    type: 'mixed',
                    description: '',
                    color: '#3B82F6',
                    includeInContext: true
                })
                setIsCreating(false)
                onFolderCreated?.(data.data)
            }
        } catch (error) {
            console.error('Error creating folder:', error)
        }
    }

    const updateFolder = async (folder: FolderType) => {
        try {
            const response = await fetch(`/api/folders/${folder.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(folder)
            })

            if (response.ok) {
                const data = await response.json()
                setFolders(folders.map(f => f.id === folder.id ? data.data : f))
                setEditingFolder(null)
                onFolderUpdated?.(data.data)
            }
        } catch (error) {
            console.error('Error updating folder:', error)
        }
    }

    const deleteFolder = async (folderId: string) => {
        if (!confirm('Are you sure you want to delete this folder? Items will be moved to "Unorganized".')) {
            return
        }

        try {
            const response = await fetch(`/api/folders/${folderId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                setFolders(folders.filter(f => f.id !== folderId))
                onFolderDeleted?.(folderId)
            }
        } catch (error) {
            console.error('Error deleting folder:', error)
        }
    }

    const toggleFolderContext = async (folder: FolderType) => {
        const updatedFolder = { ...folder, includeInContext: !folder.includeInContext }
        await updateFolder(updatedFolder)
    }

    const getFolderItemCount = (folderId: string) => {
        return sources.filter(source => source.folderId === folderId).length
    }

    const getFolderIcon = (type: string) => {
        switch (type) {
            case 'documents':
                return <Folder className="w-4 h-4" />
            case 'urls':
                return <Folder className="w-4 h-4" />
            case 'notes':
                return <Folder className="w-4 h-4" />
            default:
                return <Folder className="w-4 h-4" />
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-3/4 flex flex-col">
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold">Folder Manager</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-1 flex">
                    {/* Folders List */}
                    <div className="w-1/2 border-r p-6 overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium">Folders</h3>
                            <button
                                onClick={() => setIsCreating(true)}
                                className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                <Plus className="w-4 h-4" />
                                New Folder
                            </button>
                        </div>

                        {/* Create New Folder Form */}
                        {isCreating && (
                            <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                                <h4 className="font-medium mb-3">Create New Folder</h4>
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Folder name"
                                        value={newFolder.name}
                                        onChange={(e) => setNewFolder({ ...newFolder, name: e.target.value })}
                                        className="w-full px-3 py-2 border rounded"
                                    />
                                    <select
                                        value={newFolder.type}
                                        onChange={(e) => setNewFolder({ ...newFolder, type: e.target.value as any })}
                                        className="w-full px-3 py-2 border rounded"
                                        aria-label="Folder type"
                                        title="Select folder type"
                                    >
                                        <option value="mixed">Mixed Content</option>
                                        <option value="documents">Documents Only</option>
                                        <option value="urls">URLs Only</option>
                                        <option value="notes">Notes Only</option>
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="Description (optional)"
                                        value={newFolder.description}
                                        onChange={(e) => setNewFolder({ ...newFolder, description: e.target.value })}
                                        className="w-full px-3 py-2 border rounded"
                                    />
                                    <div className="flex items-center gap-2">
                                        <label className="flex items-center gap-2">
                                            <span className="text-sm text-gray-600">Color:</span>
                                            <input
                                                type="color"
                                                value={newFolder.color}
                                                onChange={(e) => setNewFolder({ ...newFolder, color: e.target.value })}
                                                className="w-8 h-8 border rounded"
                                                aria-label="Folder color"
                                                title="Choose folder color"
                                            />
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={newFolder.includeInContext}
                                                onChange={(e) => setNewFolder({ ...newFolder, includeInContext: e.target.checked })}
                                            />
                                            Include in AI context
                                        </label>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={createFolder}
                                            disabled={!newFolder.name}
                                            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                                        >
                                            Create
                                        </button>
                                        <button
                                            onClick={() => setIsCreating(false)}
                                            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Folders List */}
                        <div className="space-y-2">
                            {folders.map((folder) => (
                                <div
                                    key={folder.id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="folder-icon"
                                            data-color={folder.color.replace('#', '').substring(0, 6)}
                                        >
                                            {folder.includeInContext ? (
                                                <FolderOpen className="w-5 h-5" />
                                            ) : (
                                                <FolderClosed className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium">{folder.name}</div>
                                            <div className="text-sm text-gray-500">
                                                {getFolderItemCount(folder.id)} items • {folder.type}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleFolderContext(folder)}
                                            className="p-1 hover:bg-gray-200 rounded"
                                            title={folder.includeInContext ? 'Exclude from context' : 'Include in context'}
                                        >
                                            {folder.includeInContext ? (
                                                <Eye className="w-4 h-4 text-green-600" />
                                            ) : (
                                                <EyeOff className="w-4 h-4 text-gray-400" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setEditingFolder(folder)}
                                            className="p-1 hover:bg-gray-200 rounded"
                                            title="Edit folder"
                                            aria-label="Edit folder"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteFolder(folder.id)}
                                            className="p-1 hover:bg-gray-200 rounded text-red-500"
                                            title="Delete folder"
                                            aria-label="Delete folder"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sources List */}
                    <div className="w-1/2 p-6 overflow-y-auto">
                        <h3 className="text-lg font-medium mb-4">All Sources</h3>
                        <div className="space-y-2">
                            {sources.map((source) => (
                                <div
                                    key={source.id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="text-gray-500">
                                            {source.type === 'document' && <Folder className="w-4 h-4" />}
                                            {source.type === 'url' && <Folder className="w-4 h-4" />}
                                            {source.type === 'notebook' && <Folder className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <div className="font-medium">{source.title}</div>
                                            <div className="text-sm text-gray-500">
                                                {source.type} • Weight: {source.contextWeight}%
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {folders.find(f => f.id === source.folderId)?.name || 'Unorganized'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
} 