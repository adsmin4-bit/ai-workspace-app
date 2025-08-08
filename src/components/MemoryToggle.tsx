'use client'

import React from 'react'
import { Brain, X } from 'lucide-react'
import { MemoryToggleProps } from '@/types'

export default function MemoryToggle({
    itemId,
    itemType,
    isEnabled,
    onToggle,
    size = 'md'
}: MemoryToggleProps) {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-8 h-8',
        lg: 'w-10 h-10'
    }

    const iconSizes = {
        sm: 14,
        md: 16,
        lg: 18
    }

    const handleToggle = async () => {
        try {
            await onToggle(!isEnabled)
        } catch (error) {
            console.error('Failed to toggle memory inclusion:', error)
        }
    }

    const getTooltipText = () => {
        const action = isEnabled ? 'exclude from' : 'include in'
        const itemTypeText = itemType === 'url' ? 'URL' : itemType
        return `${isEnabled ? 'Exclude' : 'Include'} this ${itemTypeText} in AI memory context`
    }

    return (
        <button
            onClick={handleToggle}
            className={`
        relative p-1 rounded-lg transition-all duration-200 group
        ${isEnabled
                    ? 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-400'
                }
        ${sizeClasses[size]}
      `}
            title={getTooltipText()}
            aria-label={getTooltipText()}
        >
            {isEnabled ? (
                <Brain
                    size={iconSizes[size]}
                    className="transition-all duration-200 group-hover:scale-110"
                />
            ) : (
                <X
                    size={iconSizes[size]}
                    className="transition-all duration-200 group-hover:scale-110"
                />
            )}

            {/* Status indicator */}
            <div className={`
        absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white
        ${isEnabled ? 'bg-green-500' : 'bg-gray-400'}
        transition-all duration-200
      `} />
        </button>
    )
} 