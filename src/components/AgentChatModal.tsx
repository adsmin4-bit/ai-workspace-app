'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, Send, Bot, Loader2 } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface Agent {
    id: string
    name: string
    system_prompt: string
    capabilities: string[]
}

interface Message {
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: Date
}

interface AgentChatModalProps {
    isOpen: boolean
    onClose: () => void
    agent: Agent
}

export default function AgentChatModal({
    isOpen,
    onClose,
    agent
}: AgentChatModalProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [sessionId, setSessionId] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (isOpen && agent) {
            initializeSession()
        }
    }, [isOpen, agent])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const initializeSession = async () => {
        try {
            const response = await fetch('/api/agents/run', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    agent_id: agent.id,
                    input: 'Initialize session'
                })
            })

            if (response.ok) {
                const data = await response.json()
                setSessionId(data.data.session_id)

                // Add system message
                setMessages([{
                    id: 'system-1',
                    role: 'system',
                    content: `You are ${agent.name}. ${agent.system_prompt}`,
                    timestamp: new Date()
                }])
            }
        } catch (error) {
            console.error('Error initializing session:', error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading || !sessionId) return

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsLoading(true)

        try {
            // Add user message to session
            await fetch('/api/chat/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId,
                    role: 'user',
                    content: input,
                    metadata: {
                        agent_id: agent.id,
                        agent_name: agent.name
                    }
                })
            })

            // Get AI response using streaming
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: input,
                    sessionId,
                    selectedSources: {
                        documents: true,
                        urls: true,
                        notebook: true,
                        youtube: true
                    },
                    includeAllSources: true,
                    systemPrompt: agent.system_prompt,
                    agentCapabilities: agent.capabilities
                })
            })

            if (response.ok) {
                const reader = response.body?.getReader()
                if (!reader) return

                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: '',
                    timestamp: new Date()
                }

                setMessages(prev => [...prev, assistantMessage])

                try {
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
                                    if (parsed.content) {
                                        setMessages(prev =>
                                            prev.map(msg =>
                                                msg.id === assistantMessage.id
                                                    ? { ...msg, content: msg.content + parsed.content }
                                                    : msg
                                            )
                                        )
                                    }
                                } catch (e) {
                                    // Ignore parsing errors
                                }
                            }
                        }
                    }
                } finally {
                    reader.releaseLock()
                }

                // Add assistant message to session
                await fetch('/api/chat/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        sessionId,
                        role: 'assistant',
                        content: messages[messages.length - 1]?.content || '',
                        metadata: {
                            agent_id: agent.id,
                            agent_name: agent.name
                        }
                    })
                })
            }
        } catch (error) {
            console.error('Error sending message:', error)
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
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

    const renderMessage = (message: Message) => (
        <div
            key={message.id}
            className={`flex gap-3 p-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
        >
            {message.role === 'assistant' && (
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                </div>
            )}

            <div
                className={`max-w-[80%] rounded-lg p-3 ${message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.role === 'system'
                        ? 'bg-gray-100 text-gray-700 text-sm'
                        : 'bg-gray-100 text-gray-900'
                    }`}
            >
                {message.role === 'system' ? (
                    <div className="text-xs italic">{message.content}</div>
                ) : (
                    <div className="prose prose-sm max-w-none">
                        {message.content.split('```').map((part, index) => {
                            if (index % 2 === 1) {
                                // Code block
                                const [language, ...codeLines] = part.split('\n')
                                const code = codeLines.join('\n')
                                return (
                                    <SyntaxHighlighter
                                        key={index}
                                        language={language || 'text'}
                                        style={tomorrow}
                                        className="rounded text-sm"
                                    >
                                        {code}
                                    </SyntaxHighlighter>
                                )
                            }
                            return <div key={index}>{part}</div>
                        })}
                    </div>
                )}
            </div>

            {message.role === 'user' && (
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-medium">
                        {message.role === 'user' ? 'U' : 'A'}
                    </span>
                </div>
            )}
        </div>
    )

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <Bot className="w-6 h-6 text-blue-600" />
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                {agent.name}
                            </h2>
                            <p className="text-sm text-gray-600">
                                {agent.capabilities.length} capabilities enabled
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Close chat"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map(renderMessage)}
                    {isLoading && (
                        <div className="flex gap-3 p-4 justify-start">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className="bg-gray-100 rounded-lg p-3">
                                <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-200">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your message..."
                            className="flex-1 input-field"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Send className="w-4 h-4" />
                            Send
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
} 