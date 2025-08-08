'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useChatStore } from '@/store/chatStore'
import { Message, ContextChunk, Document, SourceUrl, NotebookEntry } from '@/types'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Send, Plus, Trash2, Edit2, Check, X, Brain, FolderOpen, FileText, Globe, BookOpen, BarChart3, FolderPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import FolderPicker from './FolderPicker'
import MemoryToggle from './MemoryToggle'
import ContextViewer from './ContextViewer'
import ContextWeightSlider from './ContextWeightSlider'
import FolderManager from './FolderManager'
import ContextView from './ContextView'
import ChatSourcesToggle from './ChatSourcesToggle'

interface ChatInterfaceProps { }

export default function ChatInterface({ }: ChatInterfaceProps) {
  const {
    sessions,
    currentSession,
    messages,
    useMemoryContext,
    memorySourceTypes,
    selectedSources,
    selectedFolders,
    createNewSession,
    loadSession,
    deleteSession,
    updateSessionTitle,
    addMessage,
    setCurrentSession,
    setUseMemoryContext,
    setMemorySourceTypes,
    setSelectedSources,
    toggleMemorySourceType,
    setSelectedFolders,
    toggleFolder,
    clearSelectedFolders
  } = useChatStore()

  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [autoSave, setAutoSave] = useState(false)
  const [showMemoryControls, setShowMemoryControls] = useState(false)
  const [usedSources, setUsedSources] = useState<string[]>([])
  const [showUsedSources, setShowUsedSources] = useState(false)
  const [memoryStats, setMemoryStats] = useState({
    availableSources: { documents: 0, notebook: 0, urls: 0 },
    existingChunks: 0,
    totalAvailable: 0
  })
  const [isPopulatingMemory, setIsPopulatingMemory] = useState(false)
  const [showFolderPicker, setShowFolderPicker] = useState(false)
  const [folders, setFolders] = useState<any[]>([])
  const [includeAllSources, setIncludeAllSources] = useState(true)
  const [showContextViewer, setShowContextViewer] = useState(false)
  const [contextChunks, setContextChunks] = useState<ContextChunk[]>([])
  const [contextSources, setContextSources] = useState({
    documents: [] as Document[],
    urls: [] as SourceUrl[],
    notebook: [] as NotebookEntry[]
  })
  const [selectedChatSources, setSelectedChatSources] = useState<string[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Fetch source counts for display
  const [sourceCounts, setSourceCounts] = useState({
    documents: 0,
    urls: 0,
    notebook: 0
  })

  const fetchSourceCounts = async () => {
    try {
      const [docResponse, urlResponse, notebookResponse] = await Promise.all([
        fetch('/api/documents'),
        fetch('/api/sources/find-urls'),
        fetch('/api/notebook')
      ])

      if (docResponse.ok) {
        const { documents } = await docResponse.json()
        setSourceCounts(prev => ({ ...prev, documents: documents?.length || 0 }))
      }

      if (urlResponse.ok) {
        const { urls } = await urlResponse.json()
        const totalUrls = Object.values(urls || {}).reduce((acc: number, urls: any) => acc + urls.length, 0)
        setSourceCounts(prev => ({ ...prev, urls: totalUrls }))
      }

      if (notebookResponse.ok) {
        const { entries } = await notebookResponse.json()
        setSourceCounts(prev => ({ ...prev, notebook: entries?.length || 0 }))
      }
    } catch (error) {
      console.error('Error fetching source counts:', error)
    }
  }

  const fetchMemoryStats = async () => {
    try {
      const response = await fetch('/api/context/populate')
      if (response.ok) {
        const { data } = await response.json()
        setMemoryStats(data)
      }
    } catch (error) {
      console.error('Error fetching memory stats:', error)
    }
  }

  const fetchFolders = async () => {
    try {
      const response = await fetch('/api/folders/selection')
      if (response.ok) {
        const { folders } = await response.json()
        setFolders(folders || [])
      }
    } catch (error) {
      console.error('Error fetching folders:', error)
    }
  }

  const populateMemory = async () => {
    setIsPopulatingMemory(true)
    try {
      const response = await fetch('/api/context/populate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceTypes: ['documents', 'notebook', 'urls']
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Memory populated! Processed ${result.summary.totalProcessed} items`)
        await fetchMemoryStats() // Refresh stats
      } else {
        toast.error('Failed to populate memory')
      }
    } catch (error) {
      console.error('Error populating memory:', error)
      toast.error('Failed to populate memory')
    } finally {
      setIsPopulatingMemory(false)
    }
  }

  useEffect(() => {
    fetchSourceCounts()
    fetchMemoryStats()
    fetchFolders()
  }, [])

  const saveToNotebook = async (content: string, userMessage: string) => {
    try {
      const response = await fetch('/api/notebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Chat Response - ${new Date().toLocaleString()}`,
          content: content,
          type: 'summary',
          tags: ['chat', 'ai-response'],
          metadata: {
            source: 'chat',
            session_id: currentSession?.id,
            user_message: userMessage,
            timestamp: new Date().toISOString(),
            auto_saved: true
          }
        })
      })

      if (response.ok) {
        toast.success('Response saved to notebook!')
        fetchSourceCounts() // Refresh counts
      } else {
        toast.error('Failed to save to notebook')
      }
    } catch (error) {
      console.error('Error saving to notebook:', error)
      toast.error('Failed to save to notebook')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)
    setUsedSources([])
    setShowUsedSources(false)

    // Add user message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }
    addMessage(userMsg)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          sessionId: currentSession?.id,
          selectedSources,
          useMemoryContext,
          memorySourceTypes,
          selectedFolders: selectedFolders,
          includeAllSources: includeAllSources,
          selectedChatSources: selectedChatSources
        })
      })

      if (!response.ok) throw new Error('Failed to get response')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      let assistantMessage = ''
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }
      addMessage(assistantMsg)

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break

            try {
              const parsed = JSON.parse(data)

              // Handle metadata (used sources)
              if (parsed.type === 'metadata') {
                setUsedSources(parsed.usedSources || [])
                setShowUsedSources(true)

                // Store context chunks for viewer
                if (parsed.contextChunks) {
                  setContextChunks(parsed.contextChunks)
                }
                continue
              }

              // Handle content
              if (parsed.content) {
                assistantMessage += parsed.content
                // Update the message in the store
                const updatedMessages = messages.map(msg =>
                  msg.id === assistantMsg.id
                    ? { ...msg, content: assistantMessage }
                    : msg
                )
                useChatStore.setState({ messages: updatedMessages })
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }

      // Auto-save to notebook if enabled
      if (autoSave && assistantMessage) {
        await saveToNotebook(assistantMessage, userMessage)
      }

    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to get response')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const toggleSource = (source: keyof typeof selectedSources) => {
    setSelectedSources({
      ...selectedSources,
      [source]: !selectedSources[source]
    })
  }

  const startEditingSessionTitle = () => {
    if (currentSession) {
      setEditingSessionId(currentSession.id)
      setEditingTitle(currentSession.title)
    }
  }

  const saveSessionTitle = () => {
    if (editingSessionId && editingTitle.trim()) {
      updateSessionTitle(editingSessionId, editingTitle.trim())
      setEditingSessionId(null)
      setEditingTitle('')
    }
  }

  const cancelEditingSessionTitle = () => {
    setEditingSessionId(null)
    setEditingTitle('')
  }

  const renderMessage = (message: Message) => (
    <div
      key={message.id}
      className={`chat-message ${message.role === 'user' ? 'chat-message-user' : 'chat-message-ai'
        }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
          {message.role === 'user' ? 'U' : 'AI'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '')
                  return match ? (
                    <SyntaxHighlighter
                      style={tomorrow as any}
                      language={match[1]}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  )
                }
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-900">AI Chat</h1>
          {currentSession && (
            <div className="flex items-center gap-2">
              {editingSessionId === currentSession.id ? (
                <>
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    className="px-2 py-1 text-sm border border-gray-300 rounded"
                    onKeyDown={(e) => e.key === 'Enter' && saveSessionTitle()}
                    placeholder="Enter session title"
                    aria-label="Session title"
                  />
                  <button
                    onClick={saveSessionTitle}
                    className="p-1 text-green-600 hover:text-green-700"
                    title="Save session title"
                    aria-label="Save session title"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={cancelEditingSessionTitle}
                    className="p-1 text-red-600 hover:text-red-700"
                    title="Cancel editing"
                    aria-label="Cancel editing session title"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <span className="text-sm text-gray-600">{currentSession.title}</span>
                  <button
                    onClick={startEditingSessionTitle}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Edit session title"
                    aria-label="Edit session title"
                  >
                    <Edit2 size={14} />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMemoryControls(!showMemoryControls)}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${showMemoryControls
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            title="Toggle memory controls"
            aria-label="Toggle memory controls"
          >
            <Brain size={16} />
            Memory
          </button>
        </div>
      </div>

      {/* Memory Controls */}
      {showMemoryControls && (
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <div className="space-y-4">
            {/* Memory Statistics */}
            <div className="bg-white p-3 rounded-lg border">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Memory Statistics</h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-500">Available Sources:</span>
                  <div className="mt-1 space-y-1">
                    <div>📄 Documents: {memoryStats.availableSources.documents}</div>
                    <div>📖 Notes: {memoryStats.availableSources.notebook}</div>
                    <div>🌐 URLs: {memoryStats.availableSources.urls}</div>
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Memory Chunks:</span>
                  <div className="mt-1">
                    <div>🧠 Stored: {memoryStats.existingChunks}</div>
                    <div>📊 Total Available: {memoryStats.totalAvailable}</div>
                  </div>
                </div>
              </div>

              {/* Populate Memory Button */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <button
                  onClick={populateMemory}
                  disabled={isPopulatingMemory || memoryStats.totalAvailable === 0}
                  className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPopulatingMemory ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Populating Memory...
                    </>
                  ) : (
                    <>
                      <Brain size={14} />
                      Populate Memory from Sources
                    </>
                  )}
                </button>
                {memoryStats.totalAvailable === 0 && (
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    No sources available to populate memory
                  </p>
                )}
              </div>
            </div>

            {/* Memory Context Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain size={16} className="text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Include Memory Context</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useMemoryContext}
                  onChange={(e) => setUseMemoryContext(e.target.checked)}
                  className="sr-only peer"
                  aria-label="Include memory context"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Folder Selection */}
            {useMemoryContext && (
              <div className="bg-white p-3 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">Memory Scope:</h4>
                  <button
                    onClick={() => setShowFolderPicker(true)}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    <FolderOpen size={12} />
                    {includeAllSources ? 'All Sources' : `${selectedFolders.length} Folders`}
                  </button>
                </div>
                <div className="text-xs text-gray-600">
                  {includeAllSources ? (
                    <span>AI can access all your documents, notes, and URLs</span>
                  ) : selectedFolders.length > 0 ? (
                    <span>AI limited to {selectedFolders.length} selected folder(s)</span>
                  ) : (
                    <span>No folders selected - AI will use all sources</span>
                  )}
                </div>
              </div>
            )}

            {/* Source Type Selection */}
            {useMemoryContext && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Sources to Include:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'document', label: 'Documents', icon: FileText, count: sourceCounts.documents },
                    { key: 'url', label: 'URLs', icon: Globe, count: sourceCounts.urls },
                    { key: 'notebook', label: 'Notes', icon: BookOpen, count: sourceCounts.notebook },
                    { key: 'chat', label: 'Chat History', icon: Brain, count: messages.length }
                  ].map(({ key, label, icon: Icon, count }) => (
                    <label key={key} className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={memorySourceTypes.includes(key)}
                        onChange={() => toggleMemorySourceType(key)}
                        className="rounded"
                        aria-label={`Include ${label} in memory context`}
                      />
                      <Icon size={14} className="text-gray-600" />
                      <span className="text-sm text-gray-700">{label}</span>
                      <span className="text-xs text-gray-500">({count})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Knowledge Sources Panel */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setShowMemoryControls(!showMemoryControls)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            title="Toggle knowledge sources"
            aria-label="Toggle knowledge sources"
          >
            Knowledge Sources ({Object.values(selectedSources).filter(Boolean).length} selected)
            <FolderOpen size={16} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={selectedSources.documents}
              onChange={() => toggleSource('documents')}
              className="rounded"
              aria-label="Include documents in knowledge sources"
            />
            <FileText size={14} className="text-blue-600" />
            <span className="text-sm">Documents ({sourceCounts.documents})</span>
          </label>
          <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={selectedSources.urls}
              onChange={() => toggleSource('urls')}
              className="rounded"
              aria-label="Include saved URLs in knowledge sources"
            />
            <Globe size={14} className="text-green-600" />
            <span className="text-sm">Saved URLs ({sourceCounts.urls})</span>
          </label>
          <label className="flex items-center gap-2 p-2 bg-white rounded border cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={selectedSources.notebook}
              onChange={() => toggleSource('notebook')}
              className="rounded"
              aria-label="Include notebook entries in knowledge sources"
            />
            <BookOpen size={14} className="text-purple-600" />
            <span className="text-sm">Notebook Entries ({sourceCounts.notebook})</span>
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          The AI will use information from selected sources to provide more relevant and accurate responses.
        </p>
      </div>

      {/* Used Sources Display */}
      {showUsedSources && usedSources.length > 0 && (
        <div className="p-3 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Brain size={14} />
              <span className="font-medium">🧠 Used Memory from:</span>
              <span>{usedSources.join(', ')}</span>
            </div>
            {contextChunks.length > 0 && (
              <button
                onClick={() => setShowContextViewer(true)}
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 transition-colors"
                title="View context sources"
              >
                <FileText size={14} />
                View Context
              </button>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Brain size={48} className="mx-auto mb-4 text-gray-300" />
            <p>Start a conversation with the AI</p>
            <p className="text-sm">The AI can use your documents, URLs, and notes as context</p>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        {isLoading && (
          <div className="chat-message chat-message-ai">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                AI
              </div>
              <div className="flex-1">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Auto-save Toggle */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={autoSave}
            onChange={(e) => setAutoSave(e.target.checked)}
            className="rounded"
            aria-label="Auto-save AI responses to notebook"
          />
          <span>Auto-save AI responses to notebook</span>
        </label>
      </div>

      {/* Chat Sources Toggle */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <ChatSourcesToggle
          selectedSources={selectedChatSources}
          onSourcesChange={setSelectedChatSources}
        />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            disabled={isLoading}
            aria-label="Chat message input"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title="Send message"
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </form>
      </div>

      {/* Folder Picker Modal */}
      <FolderPicker
        isOpen={showFolderPicker}
        onClose={() => setShowFolderPicker(false)}
        onConfirm={(selectedFolders, includeAllSources) => {
          setSelectedFolders(selectedFolders)
          setIncludeAllSources(includeAllSources)
          setShowFolderPicker(false)
          toast.success(`Memory scope set to ${includeAllSources ? 'all sources' : `${selectedFolders.length} selected folders`}`)
        }}
        currentSelection={{
          selectedFolders: selectedFolders,
          includeAllSources: includeAllSources
        }}
      />

      {/* Context Viewer Modal */}
      <ContextViewer
        isOpen={showContextViewer}
        onClose={() => setShowContextViewer(false)}
        contextChunks={contextChunks}
        sources={contextSources}
      />
    </div>
  )
} 