'use client'

import { useState, useEffect } from 'react'
import { Globe, Search, ExternalLink, RefreshCw, Loader2, MessageCircle } from 'lucide-react'
import { SourceUrl } from '@/types'
import toast from 'react-hot-toast'
import QAModal from './QAModal'
import MemoryToggle from './MemoryToggle'

interface SearchResult {
  title: string
  url: string
  snippet: string
}

export default function WebSourcesPanel() {
  const [topic, setTopic] = useState('')
  const [sources, setSources] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [savedUrls, setSavedUrls] = useState<Record<string, SourceUrl[]>>({})
  const [isLoadingUrls, setIsLoadingUrls] = useState(true)
  const [isFindingUrls, setIsFindingUrls] = useState(false)

  // Q&A Modal state
  const [qaModalOpen, setQaModalOpen] = useState(false)
  const [selectedUrl, setSelectedUrl] = useState<SourceUrl | null>(null)

  // Fetch saved URLs on component mount
  useEffect(() => {
    fetchSavedUrls()
  }, [])

  const fetchSavedUrls = async () => {
    setIsLoadingUrls(true)
    try {
      const response = await fetch('/api/sources/find-urls')
      if (response.ok) {
        const result = await response.json()
        setSavedUrls(result.urls || {})
      } else {
        console.error('Failed to fetch saved URLs')
        toast.error('Failed to load saved URLs')
      }
    } catch (error) {
      console.error('Error fetching saved URLs:', error)
      toast.error('Failed to load saved URLs')
    } finally {
      setIsLoadingUrls(false)
    }
  }

  const findUrlsByTopic = async () => {
    if (topic.trim() && !isFindingUrls) {
      setIsFindingUrls(true)
      try {
        const response = await fetch('/api/sources/find-urls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic: topic.trim() }),
        })

        if (response.ok) {
          const result = await response.json()
          toast.success(result.message)
          await fetchSavedUrls() // Refresh the saved URLs list
        } else {
          const errorData = await response.json()
          toast.error(errorData.error || 'Failed to find URLs')
        }
      } catch (error) {
        console.error('Error finding URLs:', error)
        toast.error('Failed to find URLs')
      } finally {
        setIsFindingUrls(false)
      }
    }
  }

  const searchSources = async () => {
    if (topic.trim()) {
      setIsLoading(true)
      try {
        const response = await fetch('/api/web/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: topic }),
        })

        if (response.ok) {
          const result = await response.json()
          setSources(result.results || [])
        } else {
          // Fallback to mock results
          setSources([
            {
              title: `Search results for: ${topic}`,
              url: `https://duckduckgo.com/?q=${encodeURIComponent(topic)}`,
              snippet: `Search for "${topic}" on DuckDuckGo. API temporarily unavailable.`
            }
          ])
        }
      } catch (error) {
        // Fallback to mock results
        setSources([
          {
            title: `Search results for: ${topic}`,
            url: `https://duckduckgo.com/?q=${encodeURIComponent(topic)}`,
            snippet: `Search for "${topic}" on DuckDuckGo. API temporarily unavailable.`
          }
        ])
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchSources()
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

  const openQAModal = (url: SourceUrl) => {
    setSelectedUrl(url)
    setQaModalOpen(true)
  }

  const closeQAModal = () => {
    setQaModalOpen(false)
    setSelectedUrl(null)
  }

  const handleMemoryToggle = async (urlId: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/memory/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: urlId,
          itemType: 'url',
          enabled: enabled
        })
      })

      if (response.ok) {
        // Update the URL in the local state
        setSavedUrls(prev => {
          const updated = { ...prev }
          Object.keys(updated).forEach(topic => {
            updated[topic] = updated[topic].map(url =>
              url.id === urlId
                ? { ...url, includeInMemory: enabled }
                : url
            )
          })
          return updated
        })
        toast.success(`URL ${enabled ? 'included in' : 'excluded from'} AI memory`)
      } else {
        throw new Error('Failed to update memory toggle')
      }
    } catch (error) {
      console.error('Error toggling memory inclusion:', error)
      toast.error('Failed to update memory toggle')
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <Globe className="w-4 h-4 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Web Sources</h2>
            <p className="text-sm text-gray-500">Find and analyze web content</p>
          </div>
        </div>
        <button
          onClick={fetchSavedUrls}
          disabled={isLoadingUrls}
          className="btn-outline text-sm flex items-center space-x-2 disabled:opacity-50"
          title="Refresh saved URLs"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingUrls ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Find URLs by Topic Section */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">🔍 Find URLs by Topic</h3>
          <p className="text-sm text-gray-600 mb-4">
            Search for URLs related to a topic and save them to your database for future reference.
          </p>

          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Enter a topic (e.g., 'artificial intelligence', 'machine learning')..."
              className="input-field flex-1"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button
              onClick={findUrlsByTopic}
              disabled={isFindingUrls || !topic.trim()}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isFindingUrls ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>{isFindingUrls ? 'Finding URLs...' : '🔍 Find URLs'}</span>
            </button>
          </div>
        </div>

        {/* Search Web Sources Section */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Search Web Sources</h3>

          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Enter a topic to search..."
              className="input-field flex-1"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button
              onClick={searchSources}
              disabled={isLoading || !topic.trim()}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="w-4 h-4" />
              <span>{isLoading ? 'Searching...' : 'Search'}</span>
            </button>
          </div>
        </div>

        {/* Saved URLs Section */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Saved URLs by Topic ({Object.keys(savedUrls).length} topics)
          </h3>

          {isLoadingUrls ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-primary-500 animate-spin mr-2" />
              <span className="text-gray-600">Loading saved URLs...</span>
            </div>
          ) : Object.keys(savedUrls).length === 0 ? (
            <div className="text-center py-8">
              <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No URLs saved yet.</p>
              <p className="text-sm text-gray-400">Use the "Find URLs by Topic" feature above to get started.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(savedUrls).map(([topic, urls]) => (
                <div key={topic} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 text-lg">📚 {topic}</h4>
                    <span className="text-sm text-gray-500">{urls.length} URLs</span>
                  </div>
                  <div className="space-y-3">
                    {urls.map((url) => (
                      <div key={url.id} className="border-l-4 border-primary-200 pl-3 py-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900 mb-1">
                              <a
                                href={url.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-primary-600 transition-colors"
                              >
                                {url.title || url.url}
                              </a>
                            </h5>
                            <p className="text-sm text-gray-500 mb-1">{url.url}</p>
                            <p className="text-xs text-gray-400">
                              Saved {url.createdAt ? formatDate(url.createdAt.toString()) : 'Unknown date'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 ml-2">
                            <MemoryToggle
                              itemId={url.id || ''}
                              itemType="url"
                              isEnabled={url.includeInMemory ?? true}
                              onToggle={(enabled) => url.id && handleMemoryToggle(url.id, enabled)}
                              size="sm"
                            />

                            <button
                              onClick={() => openQAModal(url)}
                              className="text-gray-400 hover:text-blue-500 transition-colors"
                              aria-label="Ask questions about this URL"
                              title="Ask questions about this URL"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>

                            <a
                              href={url.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-primary-600 transition-colors"
                              title="Open in new tab"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Search Results Section */}
        {sources.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Search Results ({sources.length})
            </h3>
            <div className="space-y-4">
              {sources.map((source, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-2">
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary-600 transition-colors"
                        >
                          {source.title}
                        </a>
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">{source.snippet}</p>
                      <p className="text-xs text-gray-400">{source.url}</p>
                    </div>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-gray-400 hover:text-primary-600 transition-colors"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 