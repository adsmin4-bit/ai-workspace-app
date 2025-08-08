'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, Bot, User, FileText, Globe, BookOpen, Youtube } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'
import toast from 'react-hot-toast'

interface QAMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

interface QAModalProps {
    isOpen: boolean
    onClose: () => void
    sourceType: 'document' | 'notebook' | 'url' | 'youtube'
    sourceTitle: string
    sourceContent: string
    sourceUrl?: string
}

export default function QAModal({
    isOpen,
    onClose,
    sourceType,
    sourceTitle,
    sourceContent,
    sourceUrl
}: QAModalProps) {
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [messages, setMessages] = useState<QAMessage[]>([])
    const [streamingMessage, setStreamingMessage] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, streamingMessage])

    // Auto-resize textarea
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto'
            inputRef.current.style.height = `${inputRef.current.scrollHeight}px`
        }
    }, [input])

    const getSourceIcon = () => {
        switch (sourceType) {
            case 'document':
                return <FileText className="w-4 h-4 text-blue-600" />
            case 'url':
                return <Globe className="w-4 h-4 text-green-600" />
            case 'notebook':
                return <BookOpen className="w-4 h-4 text-purple-600" />
            case 'youtube':
                return <Youtube className="w-4 h-4 text-red-600" />
            default:
                return <FileText className="w-4 h-4 text-gray-600" />
        }
    }

    const getSourceTypeLabel = () => {
        switch (sourceType) {
            case 'document':
                return 'Document'
            case 'url':
                return 'URL'
            case 'notebook':
                return 'Notebook Entry'
            case 'youtube':
                return 'YouTube Video'
            default:
                return 'Source'
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return

        const userMessage = input.trim()
        setInput('')
        setIsLoading(true)
        setStreamingMessage('')

        // Add user message to chat
        const newUserMessage: QAMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: userMessage,
            timestamp: new Date(),
        }
        setMessages(prev => [...prev, newUserMessage])

        try {
            // Create context-aware prompt
            const contextPrompt = `You are analyzing the following ${sourceType}:

TITLE: ${sourceTitle}
${sourceUrl ? `URL: ${sourceUrl}\n` : ''}
CONTENT:
${sourceContent}

Please answer the user's question about this ${sourceType}. Be specific and reference the content directly. If the question cannot be answered from the provided content, say so clearly.`

            // Send to chat API
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage,
                    systemPrompt: contextPrompt,
                    model: 'gpt-3.5-turbo',
                    temperature: 0.7,
                    maxTokens: 2000,
                    selectedSources: { documents: false, urls: false, notebook: false }, // Disable other sources for focused Q&A
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to get response')
            }

            const reader = response.body?.getReader()
            if (!reader) throw new Error('No response body')

            let aiResponse = ''
            const decoder = new TextDecoder()

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value)
                const lines = chunk.split('\n')

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6)
                        if (data === '[DONE]') {
                            // Add final AI message
                            const newAIMessage: QAMessage = {
                                id: (Date.now() + 1).toString(),
                                role: 'assistant',
                                content: aiResponse,
                                timestamp: new Date(),
                            }
                            setMessages(prev => [...prev, newAIMessage])
                            setStreamingMessage('')
                            setIsLoading(false)
                            return
                        }

                        try {
                            const parsed = JSON.parse(data)
                            if (parsed.content) {
                                aiResponse += parsed.content
                                setStreamingMessage(aiResponse)
                            }
                        } catch (e) {
                            // Ignore parsing errors for incomplete chunks
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Q&A error:', error)
            toast.error('Failed to get answer. Please try again.')
            setIsLoading(false)
            setStreamingMessage('')
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
        }
    }

    const renderMessage = (message: QAMessage) => (
        <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start space-x-3 mb-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
            {message.role === 'assistant' && (
                <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3 h-3 text-primary-600" />
                </div>
            )}

            <div
                className={`max-w-[80%] rounded-lg p-3 text-sm ${message.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                    }`}
            >
                {message.role === 'assistant' ? (
                    <ReactMarkdown
                        components={{
                            code({ className, children, ...props }: any) {
                                const match = /language-(\w+)/.exec(className || '')
                                const isInline = !match
                                return !isInline ? (
                                    <SyntaxHighlighter
                                        style={tomorrow}
                                        language={match[1]}
                                        PreTag="div"
                                        {...props}
                                    >
                                        {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                ) : (
                                    <code className={className} {...props}>
                                        {children}
                                    </code>
                                )
                            },
                        }}
                    >
                        {message.content}
                    </ReactMarkdown>
                ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                )}
            </div>

            {message.role === 'user' && (
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-3 h-3 text-gray-600" />
                </div>
            )}
        </motion.div>
    )

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <div className="flex items-center space-x-3">
                                {getSourceIcon()}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Q&A: {sourceTitle}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Ask questions about this {getSourceTypeLabel()}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                aria-label="Close modal"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {messages.length === 0 && (
                                <div className="text-center text-gray-500 py-8">
                                    <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p>Ask a question about this {sourceType} to get started</p>
                                </div>
                            )}

                            <AnimatePresence>
                                {messages.map(renderMessage)}

                                {/* Streaming message */}
                                {streamingMessage && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-start space-x-3 mb-4"
                                    >
                                        <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <Bot className="w-3 h-3 text-primary-600" />
                                        </div>
                                        <div className="max-w-[80%] rounded-lg p-3 bg-gray-100 text-gray-900 text-sm">
                                            <ReactMarkdown
                                                components={{
                                                    code({ className, children, ...props }: any) {
                                                        const match = /language-(\w+)/.exec(className || '')
                                                        const isInline = !match
                                                        return !isInline ? (
                                                            <SyntaxHighlighter
                                                                style={tomorrow}
                                                                language={match[1]}
                                                                PreTag="div"
                                                                {...props}
                                                            >
                                                                {String(children).replace(/\n$/, '')}
                                                            </SyntaxHighlighter>
                                                        ) : (
                                                            <code className={className} {...props}>
                                                                {children}
                                                            </code>
                                                        )
                                                    },
                                                }}
                                            >
                                                {streamingMessage}
                                            </ReactMarkdown>
                                            <div className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1" />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="border-t border-gray-200 bg-white p-4">
                            <form onSubmit={handleSubmit} className="flex space-x-3">
                                <div className="flex-1 relative">
                                    <textarea
                                        ref={inputRef}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={`Ask a question about this ${sourceType}...`}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none max-h-24 text-sm"
                                        rows={1}
                                        disabled={isLoading}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 px-4 py-2 text-sm"
                                >
                                    <Send className="w-4 h-4" />
                                    <span>Ask</span>
                                </button>
                            </form>

                            <div className="mt-2 text-xs text-gray-500">
                                Press Enter to send, Shift+Enter for new line
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
} 