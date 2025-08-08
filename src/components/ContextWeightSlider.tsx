'use client'

import React, { useState } from 'react'
import { Slider } from '@/components/ui/Slider'
import { Tooltip } from '@/components/ui/Tooltip'
import { Weight, Info } from 'lucide-react'

interface ContextWeightSliderProps {
    itemId: string
    itemType: 'document' | 'notebook' | 'url'
    weight: number
    onWeightChange: (weight: number) => void
    size?: 'sm' | 'md' | 'lg'
}

export default function ContextWeightSlider({
    itemId,
    itemType,
    weight,
    onWeightChange,
    size = 'md'
}: ContextWeightSliderProps) {
    const [isUpdating, setIsUpdating] = useState(false)

    const handleWeightChange = async (newWeight: number) => {
        setIsUpdating(true)
        try {
            // Update the weight in the database
            const response = await fetch('/api/context/weight', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    itemId,
                    itemType,
                    weight: newWeight
                })
            })

            if (response.ok) {
                onWeightChange(newWeight)
            } else {
                console.error('Failed to update context weight')
            }
        } catch (error) {
            console.error('Error updating context weight:', error)
        } finally {
            setIsUpdating(false)
        }
    }

    const getWeightDescription = (weight: number) => {
        if (weight === 0) return 'Excluded from context'
        if (weight <= 25) return 'Very low priority'
        if (weight <= 50) return 'Low priority'
        if (weight <= 75) return 'Normal priority'
        if (weight <= 100) return 'High priority'
        return 'Maximum priority'
    }

    const getWeightColor = (weight: number) => {
        if (weight === 0) return 'text-gray-400'
        if (weight <= 25) return 'text-red-500'
        if (weight <= 50) return 'text-orange-500'
        if (weight <= 75) return 'text-yellow-500'
        if (weight <= 100) return 'text-green-500'
        return 'text-blue-500'
    }

    const getSizeClasses = () => {
        switch (size) {
            case 'sm':
                return 'text-xs'
            case 'lg':
                return 'text-base'
            default:
                return 'text-sm'
        }
    }

    return (
        <div className={`flex items-center gap-2 ${getSizeClasses()}`}>
            <div className="flex items-center gap-1">
                <Weight className="w-3 h-3 text-gray-500" />
                <span className="text-gray-600">Weight:</span>
            </div>

            <div className="flex-1 min-w-0">
                <Slider
                    value={[weight]}
                    onValueChange={([value]) => handleWeightChange(value)}
                    max={100}
                    min={0}
                    step={5}
                    disabled={isUpdating}
                    className="w-full"
                />
            </div>

            <div className="flex items-center gap-1 min-w-0">
                <span className={`font-medium ${getWeightColor(weight)}`}>
                    {weight}%
                </span>

                <Tooltip content={getWeightDescription(weight)}>
                    <Info className="w-3 h-3 text-gray-400 cursor-help" />
                </Tooltip>
            </div>

            {isUpdating && (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500" />
            )}
        </div>
    )
} 