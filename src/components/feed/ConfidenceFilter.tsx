'use client'

import type { Confidence } from '@/types'

interface Props {
  value: Confidence
  onChange: (value: Confidence) => void
}

const OPTIONS: { value: Confidence; label: string; description: string }[] = [
  { value: 'low',    label: 'All',      description: 'Every classified event' },
  { value: 'medium', label: 'Notable',  description: 'Medium + high confidence' },
  { value: 'high',   label: 'Strong',   description: 'High confidence only' },
]

export function ConfidenceFilter({ value, onChange }: Props) {
  return (
    <div className="filter-group">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          title={option.description}
          className={`filter-btn${value === option.value ? ' active' : ''}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
