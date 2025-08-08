'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronRight, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface NotebookAutocompleteProps {
    currentText: string
    onSuggestionClick: (suggestion: string) => void
    disabled?: boolean
}

export default function NotebookAutocomplete({
    currentText,
    onSuggestionClick,
    disabled = false
}: NotebookAutocompleteProps) {
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(false)
    const timeoutRef = useRef<NodeJS.Timeout>()

    useEffect(() => {
        // Clear previous timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        // Don't show suggestions if disabled or text is too short
        if (disabled || !currentText || currentText.trim().length < 3) {
            setShowSuggestions(false)
            setSuggestions([])
            return
        }

        // Debounce the API call
        timeoutRef.current = setTimeout(async () => {
            setIsLoading(true)
            try {
                const response = await fetch('/api/notebook/autocomplete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        currentText: currentText.trim(),
                        limit: 3
                    })
                })

                if (response.ok) {
                    const result = await response.json()
                    if (result.success && result.data.suggestions) {
                        setSuggestions(result.data.suggestions)
                        setShowSuggestions(result.data.suggestions.length > 0)
                    } else {
                        setShowSuggestions(false)
                    }
                } else {
                    setShowSuggestions(false)
                }
            } catch (error) {
                console.error('Error fetching autocomplete suggestions:', error)
                setShowSuggestions(false)
            } finally {
                setIsLoading(false)
            }
        }, 500) // 500ms debounce

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [currentText, disabled])

    const handleSuggestionClick = (suggestion: string) => {
        onSuggestionClick(suggestion)
        setShowSuggestions(false)
    }

    if (!showSuggestions && !isLoading) {
        return null
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-200 rounded-lg shadow-lg mt-1"
            >
                <div className="p-2">
                    <div className="flex items-center space-x-2 mb-2 px-2">
                        <Sparkles className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-700">Suggestions</span>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span className="text-sm text-gray-500 ml-2">Generating suggestions...</span>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {suggestions.map((suggestion, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className="w-full text-left p-2 rounded-md hover:bg-blue-50 transition-colors group"
                                >
                                    <div className="flex items-center space-x-2">
                                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                        <span className="text-sm text-gray-700 group-hover:text-blue-700 transition-colors">
                                            {suggestion}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    )
} 