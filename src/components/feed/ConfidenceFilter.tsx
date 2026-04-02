'use client'

import type { Confidence } from '@/types'

interface Props {
  value: Confidence
  onChange: (value: Confidence) => void
}

const OPTIONS: { value: Confidence; label: string; description: string }[] = [
  { value: 'low', label: 'All', description: 'Every classified event' },
  { value: 'medium', label: 'Notable', description: 'Medium + high confidence' },
  { value: 'high', label: 'High Conviction', description: 'High confidence only' },
]

export function ConfidenceFilter({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-gray-800 bg-gray-900 p-1">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          title={option.description}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            value === option.value
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
