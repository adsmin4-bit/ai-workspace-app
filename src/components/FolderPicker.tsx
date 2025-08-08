'use client'

import React, { useState, useEffect } from 'react'
import { X, Folder as FolderIcon, Check, Globe } from 'lucide-react'
import { FolderPickerProps, Folder } from '@/types'

export default function FolderPicker({
    isOpen,
    onClose,
    onConfirm,
    currentSelection
}: FolderPickerProps) {
    const [folders, setFolders] = useState<Folder[]>([])
    const [selectedFolders, setSelectedFolders] = useState<string[]>([])
    const [includeAllSources, setIncludeAllSources] = useState(true)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isOpen) {
            fetchFolders()
            if (currentSelection) {
                setSelectedFolders(currentSelection.selectedFolders)
                setIncludeAllSources(currentSelection.includeAllSources)
            }
        }
    }, [isOpen, currentSelection])

    const fetchFolders = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/folders')
            const data = await response.json()
            if (data.success) {
                setFolders(data.data)
            }
        } catch (error) {
            console.error('Failed to fetch folders:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleFolderToggle = (folderId: string) => {
        setSelectedFolders(prev =>
            prev.includes(folderId)
                ? prev.filter(id => id !== folderId)
                : [...prev, folderId]
        )
    }

    const handleConfirm = () => {
        onConfirm(selectedFolders, includeAllSources)
        onClose()
    }

    const handleCancel = () => {
        if (currentSelection) {
            setSelectedFolders(currentSelection.selectedFolders)
            setIncludeAllSources(currentSelection.includeAllSources)
        }
        onClose()
    }

    const getFolderIcon = (type: string) => {
        switch (type) {
            case 'documents':
                return '📄'
            case 'urls':
                return '🌐'
            case 'notes':
                return '📝'
            case 'mixed':
                return '📁'
            default:
                return '📁'
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Select AI Memory Sources
                    </h2>
                    <button
                        onClick={handleCancel}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Close folder picker"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {/* All Sources Option */}
                    <div className="mb-6">
                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={includeAllSources}
                                onChange={(e) => setIncludeAllSources(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <div className="flex items-center space-x-2">
                                <Globe size={16} className="text-blue-600" />
                                <span className="font-medium text-gray-900">Include All Sources</span>
                            </div>
                        </label>
                        <p className="text-sm text-gray-600 ml-7 mt-1">
                            When enabled, AI can access all your documents, notes, and URLs regardless of folder organization.
                        </p>
                    </div>

                    {/* Folder Selection */}
                    {!includeAllSources && (
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                Or Select Specific Folders
                            </h3>

                            {loading ? (
                                <div className="text-center py-4">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="text-sm text-gray-600 mt-2">Loading folders...</p>
                                </div>
                            ) : folders.length === 0 ? (
                                <div className="text-center py-8">
                                    <FolderIcon size={48} className="text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-600">No folders found</p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Create folders to organize your content
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {folders.map((folder) => (
                                        <label
                                            key={folder.id}
                                            className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedFolders.includes(folder.id)}
                                                onChange={() => handleFolderToggle(folder.id)}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                            <div className="flex items-center space-x-2 flex-1">
                                                <span className="text-lg">{getFolderIcon(folder.type)}</span>
                                                <div className="flex-1">
                                                    <span className="font-medium text-gray-900">{folder.name}</span>
                                                    <p className="text-sm text-gray-600">{folder.type} • {folder.itemCount || 0} items</p>
                                                </div>
                                                {selectedFolders.includes(folder.id) && (
                                                    <Check size={16} className="text-blue-600" />
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Info Text */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <strong>Note:</strong> Only content with "Include in AI Memory" enabled will be used,
                            even if the folder is selected.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Confirm Selection
                    </button>
                </div>
            </div>
        </div>
    )
} 