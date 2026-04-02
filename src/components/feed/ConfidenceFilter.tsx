'use client'

import type { Confidence } from '@/types'

interface Props {
  value: Confidence
  onChange: (value: Confidence) => void
}

const OPTIONS: { value: Confidence; label: string; description: string }[] = [
  { value: 'low',    label: 'All Signals',    description: 'Every classified event' },
  { value: 'medium', label: 'Notable',        description: 'Medium + high confidence' },
  { value: 'high',   label: 'High Conviction', description: 'High confidence only' },
]

export function ConfidenceFilter({ value, onChange }: Props) {
  return (
    <div className="filter-bar">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          title={opt.description}
          className={`filter-tab${value === opt.value ? ' active' : ''}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
