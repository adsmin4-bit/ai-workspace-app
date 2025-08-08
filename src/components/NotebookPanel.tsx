'use client'

import { useState, useEffect, useRef } from 'react'
import { BookOpen, Plus, Save, Loader2, RefreshCw, X, Tag, MessageCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { NotebookEntry } from '@/types'
import toast from 'react-hot-toast'
import QAModal from './QAModal'
import MemoryToggle from './MemoryToggle'
import NotebookAutocomplete from './NotebookAutocomplete'

export default function NotebookPanel() {
  const [entries, setEntries] = useState<NotebookEntry[]>([])
  const [currentNote, setCurrentNote] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingEntries, setIsLoadingEntries] = useState(true)
  const [showOnlyChatEntries, setShowOnlyChatEntries] = useState(false)

  // Q&A Modal state
  const [qaModalOpen, setQaModalOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<NotebookEntry | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Fetch notebook entries from Supabase on component mount
  useEffect(() => {
    fetchEntries()
  }, []) // Empty dependency array ensures this runs only on mount

  const fetchEntries = async () => {
    setIsLoadingEntries(true)
    try {
      const response = await fetch('/api/notebook')
      if (response.ok) {
        const result = await response.json()
        console.log('Notebook API response:', result)
        console.log('Notebook entries data:', result.entries)
        setEntries(result.entries || [])
      } else {
        console.error('Failed to fetch notebook entries')
        toast.error('Failed to load notebook entries')
      }
    } catch (error) {
      console.error('Error fetching notebook entries:', error)
      toast.error('Failed to load notebook entries')
    } finally {
      setIsLoadingEntries(false)
    }
  }

  // Filter entries based on showOnlyChatEntries
  const filteredEntries = showOnlyChatEntries
    ? entries.filter(entry => entry.metadata?.auto_saved)
    : entries

  const addNote = async () => {
    if (currentNote.trim() && !isLoading) {
      setIsLoading(true)
      try {
        const response = await fetch('/api/notebook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: currentNote.substring(0, 50) + (currentNote.length > 50 ? '...' : ''),
            content: currentNote,
            type: 'note',
            tags: []
          }),
        })

        if (response.ok) {
          const result = await response.json()
          setCurrentNote('')
          await fetchEntries() // Refresh the list
          toast.success('Note saved successfully!')
        } else {
          throw new Error('Failed to save note')
        }
      } catch (error) {
        console.error('Error saving note:', error)
        toast.error('Failed to save note')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const deleteEntry = async (id: string) => {
    try {
      const response = await fetch(`/api/notebook/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchEntries() // Refresh the list
        toast.success('Entry deleted successfully!')
      } else {
        throw new Error('Failed to delete entry')
      }
    } catch (error) {
      console.error('Error deleting entry:', error)
      toast.error('Failed to delete entry')
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Invalid date'
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      console.error('Error formatting date:', error, dateString)
      return 'Invalid date'
    }
  }

  const getTypeColor = (type: string) => {
    try {
      if (!type) return 'bg-gray-100 text-gray-800'

      switch (type.toLowerCase()) {
        case 'note':
          return 'bg-blue-100 text-blue-800'
        case 'summary':
          return 'bg-green-100 text-green-800'
        case 'idea':
          return 'bg-purple-100 text-purple-800'
        case 'task':
          return 'bg-orange-100 text-orange-800'
        default:
          return 'bg-gray-100 text-gray-800'
      }
    } catch (error) {
      console.error('Error getting type color:', error, type)
      return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    try {
      if (!type) return '📄'

      switch (type.toLowerCase()) {
        case 'note':
          return '📝'
        case 'summary':
          return '📋'
        case 'idea':
          return '💡'
        case 'task':
          return '✅'
        default:
          return '📄'
      }
    } catch (error) {
      console.error('Error getting type icon:', error, type)
      return '📄'
    }
  }

  const openQAModal = (entry: NotebookEntry) => {
    setSelectedEntry(entry)
    setQaModalOpen(true)
  }

  const closeQAModal = () => {
    setQaModalOpen(false)
    setSelectedEntry(null)
  }

  const handleMemoryToggle = async (entryId: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/memory/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: entryId,
          itemType: 'notebook',
          enabled: enabled
        })
      })

      if (response.ok) {
        // Update the entry in the local state
        setEntries(prev => prev.map(entry =>
          entry.id === entryId
            ? { ...entry, includeInMemory: enabled }
            : entry
        ))
        toast.success(`Note ${enabled ? 'included in' : 'excluded from'} AI memory`)
      } else {
        throw new Error('Failed to update memory toggle')
      }
    } catch (error) {
      console.error('Error toggling memory inclusion:', error)
      toast.error('Failed to update memory toggle')
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setCurrentNote(prev => prev + ' ' + suggestion)
    // Focus back to textarea
    if (textareaRef.current) {
      textareaRef.current.focus()
      // Move cursor to end
      const length = textareaRef.current.value.length
      textareaRef.current.setSelectionRange(length, length)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Notebook</h2>
            <p className="text-sm text-gray-500">Save your thoughts and ideas</p>
          </div>
        </div>
        <button
          onClick={fetchEntries}
          disabled={isLoadingEntries}
          className="btn-outline text-sm flex items-center space-x-2 disabled:opacity-50"
          title="Refresh entries"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingEntries ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Add Note Section */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add Note</h3>
          <div className="relative">
            <textarea
              ref={textareaRef}
              rows={4}
              placeholder="Write your note here..."
              className="input-field"
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              disabled={isLoading}
            />
            <NotebookAutocomplete
              currentText={currentNote}
              onSuggestionClick={handleSuggestionClick}
              disabled={isLoading}
            />
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={addNote}
              disabled={!currentNote.trim() || isLoading}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{isLoading ? 'Saving...' : 'Add Note'}</span>
            </button>
          </div>
        </div>

        {/* Notebook Entries Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Your Notes ({filteredEntries.length})
            </h3>
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyChatEntries}
                  onChange={(e) => setShowOnlyChatEntries(e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Show only chat entries</span>
              </label>
            </div>
          </div>

          {isLoadingEntries ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-primary-500 animate-spin mr-2" />
              <span className="text-gray-600">Loading notebook entries...</span>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">
                {showOnlyChatEntries ? 'No auto-saved chat entries found.' : 'No notes saved.'}
              </p>
              {showOnlyChatEntries && entries.length > 0 && (
                <p className="text-gray-400 text-sm mt-2">
                  Try disabling the filter to see all entries.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredEntries.map((entry, index) => (
                  <motion.div
                    key={entry.id || `entry-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="card hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg">{getTypeIcon(entry.type || 'note')}</span>
                          <h4 className="font-medium text-gray-900">{entry.title || 'Untitled Note'}</h4>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(entry.type || 'note')}`}>
                            {entry.type || 'note'}
                          </span>

                          {/* Show chat indicator for auto-saved entries */}
                          {entry.metadata?.auto_saved && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <MessageCircle className="w-3 h-3 mr-1" />
                              Chat
                            </span>
                          )}
                        </div>

                        <p className="text-gray-700 whitespace-pre-wrap mb-3">
                          {entry.content ? (
                            entry.content.length > 200
                              ? entry.content.substring(0, 200) + '...'
                              : entry.content
                          ) : (
                            'No content available'
                          )}
                        </p>

                        {/* Show chat metadata for auto-saved entries */}
                        {entry.metadata?.auto_saved && entry.metadata?.user_message && (
                          <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
                            <div className="text-xs text-blue-700 font-medium mb-1">Original Question:</div>
                            <div className="text-sm text-blue-800 italic">
                              "{entry.metadata.user_message}"
                            </div>
                            {entry.metadata.session_id && (
                              <div className="text-xs text-blue-600 mt-1">
                                Session ID: {entry.metadata.session_id.substring(0, 8)}...
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Created {entry.createdAt ? formatDate(entry.createdAt.toString()) : 'Unknown date'}</span>
                            {entry.updatedAt && entry.createdAt && entry.updatedAt.toString() !== entry.createdAt.toString() && (
                              <span>Updated {formatDate(entry.updatedAt.toString())}</span>
                            )}
                          </div>

                          {entry.tags && Array.isArray(entry.tags) && entry.tags.length > 0 && (
                            <div className="flex items-center space-x-1">
                              <Tag className="w-3 h-3 text-gray-400" />
                              {entry.tags.slice(0, 3).map((tag, index) => (
                                <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                  {tag}
                                </span>
                              ))}
                              {entry.tags.length > 3 && (
                                <span className="text-xs text-gray-400">
                                  +{entry.tags.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-2">
                        <MemoryToggle
                          itemId={entry.id || ''}
                          itemType="notebook"
                          isEnabled={entry.includeInMemory ?? true}
                          onToggle={(enabled) => entry.id && handleMemoryToggle(entry.id, enabled)}
                          size="sm"
                        />

                        <button
                          onClick={() => openQAModal(entry)}
                          className="text-gray-400 hover:text-blue-500 transition-colors"
                          aria-label={`Ask questions about "${entry.title}"`}
                          title="Ask questions about this note"
                          disabled={!entry.content}
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => entry.id && deleteEntry(entry.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          aria-label={`Delete entry "${entry.title}"`}
                          title="Delete entry"
                          disabled={!entry.id}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Q&A Modal */}
      {selectedEntry && (
        <QAModal
          isOpen={qaModalOpen}
          onClose={closeQAModal}
          sourceType="notebook"
          sourceTitle={selectedEntry.title || 'Untitled Note'}
          sourceContent={selectedEntry.content || ''}
        />
      )}
    </div>
  )
} 