'use client'

const GROUPS = [
  { value: 'all',       label: 'All Types' },
  { value: 'ma',        label: 'M&A' },
  { value: 'earnings',  label: 'Earnings' },
  { value: 'fda',       label: 'FDA' },
  { value: 'analyst',   label: 'Analyst' },
  { value: 'executive', label: 'Executive' },
  { value: 'other',     label: 'Other' },
]

interface Props {
  value: string
  onChange: (value: string) => void
}

export function EventTypeFilter({ value, onChange }: Props) {
  return (
    <div className="filter-bar">
      {GROUPS.map((g) => (
        <button
          key={g.value}
          onClick={() => onChange(g.value)}
          className={`filter-tab${value === g.value ? ' active' : ''}`}
        >
          {g.label}
        </button>
      ))}
    </div>
  )
}
