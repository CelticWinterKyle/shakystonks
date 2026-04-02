'use client'

import type { DailyDigest, DigestEvent } from '@/types'
import { EVENT_TYPE_LABELS } from '@/types'

interface Props {
  digest: DailyDigest | null
}

const MAGNITUDE_COLOR: Record<DigestEvent['magnitude'], string> = {
  major: 'text-red-400',
  moderate: 'text-orange-400',
  minor: 'text-gray-400',
  unknown: 'text-gray-500',
}

const CONFIDENCE_DOT: Record<DigestEvent['confidence'], string> = {
  high: 'bg-emerald-500',
  medium: 'bg-yellow-500',
  low: 'bg-gray-600',
}

export function DigestView({ digest }: Props) {
  if (!digest) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900/50 py-16 text-center">
        <p className="text-gray-500">No digest available yet.</p>
        <p className="mt-1 text-sm text-gray-600">
          The daily digest is generated at 8:00am ET on weekdays.
        </p>
      </div>
    )
  }

  const date = new Date(digest.digestDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-100">Pre-Market Summary</h2>
          <p className="text-sm text-gray-500">{date}</p>
        </div>
        <span className="rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-400">
          {digest.rankedEvents.length} events
        </span>
      </div>

      {digest.rankedEvents.length === 0 && (
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 py-12 text-center">
          <p className="text-gray-500">No material events overnight.</p>
        </div>
      )}

      <div className="space-y-2">
        {digest.rankedEvents.map((event, index) => (
          <DigestEventRow key={event.eventId} event={event} rank={index + 1} />
        ))}
      </div>
    </div>
  )
}

function DigestEventRow({ event, rank }: { event: DigestEvent; rank: number }) {
  return (
    <a
      href={event.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 rounded-lg border border-gray-800 bg-gray-900/40 p-3 hover:bg-gray-800/60 transition-colors group"
    >
      {/* Rank */}
      <span className="shrink-0 w-6 text-center text-sm font-mono text-gray-600 pt-0.5">
        {rank}
      </span>

      {/* Confidence dot */}
      <span className={`shrink-0 mt-2 h-2 w-2 rounded-full ${CONFIDENCE_DOT[event.confidence]}`} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap gap-1.5 mb-1">
          {event.tickers.map((ticker) => (
            <span
              key={ticker}
              className="font-mono text-xs font-semibold text-blue-300 bg-gray-800 rounded px-1.5 py-0.5"
            >
              {ticker}
            </span>
          ))}
        </div>
        <p className="text-sm text-gray-200 line-clamp-2 group-hover:text-white transition-colors">
          {event.headline}
        </p>
        <div className="mt-1 flex items-center gap-2 text-xs">
          <span className="rounded bg-gray-800/60 px-1.5 py-0.5 text-gray-400">
            {EVENT_TYPE_LABELS[event.eventType]}
          </span>
          <span className={MAGNITUDE_COLOR[event.magnitude]}>{event.magnitude}</span>
          <span className="text-gray-600">
            {new Date(event.publishedAt).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>

      {/* Score */}
      <span className="shrink-0 text-xs font-mono text-gray-600 pt-1">
        {event.score.toFixed(1)}
      </span>
    </a>
  )
}
