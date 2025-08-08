'use client'

import React from 'react'

interface SliderProps {
    value: number[]
    onValueChange: (value: number[]) => void
    max: number
    min: number
    step: number
    disabled?: boolean
    className?: string
}

export function Slider({
    value,
    onValueChange,
    max,
    min,
    step,
    disabled = false,
    className = ''
}: SliderProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseInt(e.target.value)
        onValueChange([newValue])
    }

    return (
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value[0]}
            onChange={handleChange}
            disabled={disabled}
            aria-label={`Slider value ${value[0]} of ${max}`}
            title={`Current value: ${value[0]}`}
            className={`w-full h-2 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed slider-range ${className}`}
            data-progress={Math.round((value[0] - min) / (max - min) * 100 / 10) * 10}
        />
    )
} 