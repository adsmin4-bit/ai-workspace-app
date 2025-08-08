'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, X, FileText, Play, Globe, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'
import toast from 'react-hot-toast'

interface SingleSourceChatProps {
    isOpen: boolean
    onClose: () => void
    sourceId: string
    sourceType: 'document' | 'youtube' | 'url'
    sourceTitle: string
}

interface ChatMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

export default function SingleSourceChat({
    isOpen,
    onClose,
    sourceId,
    sourceType,
    sourceTitle
}: SingleSourceChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        if (isOpen) {
            // Focus input when modal opens
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus()
                }
            }, 100)
        }
    }, [isOpen])

    useEffect(() => {
        // Scroll to bottom when messages change
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const getSourceIcon = () => {
        switch (sourceType) {
            case 'document':
                return <FileText className="w-5 h-5 text-blue-500" />
            case 'youtube':
                return <Play className="w-5 h-5 text-red-500" />
            case 'url':
                return <Globe className="w-5 h-5 text-green-500" />
            default:
                return <FileText className="w-5 h-5 text-gray-500" />
        }
    }

    const getSourceTypeLabel = () => {
        switch (sourceType) {
            case 'document':
                return 'Document'
            case 'youtube':
                return 'Video'
            case 'url':
                return 'Web Page'
            default:
                return 'Source'
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!input.trim() || isLoading) return

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsLoading(true)

        try {
            const response = await fetch('/api/chat/single-source', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage.content,
                    sourceId,
                    sourceType,
                    systemPrompt: `You are now answering based ONLY on this ${sourceType}: "${sourceTitle}". Please provide accurate answers based solely on the content provided. If the information is not available in the source, please say so rather than making assumptions.`
                })
            })

            if (!response.ok) {
                throw new Error('Failed to get response')
            }

            const reader = response.body?.getReader()
            if (!reader) {
                throw new Error('No response body')
            }

            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: '',
                timestamp: new Date()
            }

            setMessages(prev => [...prev, assistantMessage])

            const decoder = new TextDecoder()
            let done = false

            while (!done) {
                const { value, done: doneReading } = await reader.read()
                done = doneReading

                if (value) {
                    const chunk = decoder.decode(value)
                    const lines = chunk.split('\n')

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6)
                            if (data === '[DONE]') {
                                done = true
                                break
                            }

                            try {
                                const parsed = JSON.parse(data)
                                if (parsed.choices?.[0]?.delta?.content) {
                                    setMessages(prev =>
                                        prev.map(msg =>
                                            msg.id === assistantMessage.id
                                                ? { ...msg, content: msg.content + parsed.choices[0].delta.content }
                                                : msg
                                        )
                                    )
                                }
                            } catch (e) {
                                // Ignore parsing errors for incomplete chunks
                            }
                        }
                    }
                }
            }

        } catch (error) {
            console.error('Error in single-source chat:', error)
            toast.error('Failed to get response')

            // Add error message
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: 'Sorry, I encountered an error while processing your request. Please try again.',
                timestamp: new Date()
            }])
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

    const renderMessage = (message: ChatMessage) => (
        <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
        >
            <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                    }`}
            >
                <ReactMarkdown
                    components={{
                        code({ className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '')
                            return match ? (
                                <SyntaxHighlighter
                                    style={tomorrow as any}
                                    language={match[1]}
                                    PreTag="div"
                                >
                                    {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                            ) : (
                                <code className={className}>
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
    )

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        {getSourceIcon()}
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Ask This {getSourceTypeLabel()}
                            </h2>
                            <p className="text-sm text-gray-500">{sourceTitle}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Close chat"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                {getSourceIcon()}
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Ask about this {sourceType}
                            </h3>
                            <p className="text-gray-500">
                                I'll answer your questions based only on the content of "{sourceTitle}"
                            </p>
                        </div>
                    ) : (
                        messages.map(renderMessage)
                    )}

                    {isLoading && (
                        <div className="flex justify-start mb-4">
                            <div className="bg-gray-100 rounded-lg px-4 py-2">
                                <div className="flex items-center space-x-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                                    <span className="text-gray-500">Thinking...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-200">
                    <form onSubmit={handleSubmit} className="flex space-x-2">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={`Ask a question about this ${sourceType}...`}
                            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={1}
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            aria-label="Send message"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    )
} 