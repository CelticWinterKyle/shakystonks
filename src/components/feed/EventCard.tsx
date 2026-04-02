import type { EventClassification, NewsEvent } from '@/types'
import { EVENT_TYPE_LABELS } from '@/types'

interface Props {
  event: NewsEvent & { classification: EventClassification }
}

const CONFIDENCE_STYLES = {
  high: 'border-l-emerald-500 bg-emerald-950/20',
  medium: 'border-l-yellow-500 bg-yellow-950/10',
  low: 'border-l-gray-600 bg-gray-900/30',
}

const CONFIDENCE_BADGE = {
  high: 'bg-emerald-900/60 text-emerald-300 ring-emerald-700/40',
  medium: 'bg-yellow-900/60 text-yellow-300 ring-yellow-700/40',
  low: 'bg-gray-800 text-gray-400 ring-gray-700/40',
}

const MAGNITUDE_BADGE = {
  major: 'bg-red-900/50 text-red-300',
  moderate: 'bg-orange-900/50 text-orange-300',
  minor: 'bg-gray-800 text-gray-400',
  unknown: 'bg-gray-800 text-gray-500',
}

export function EventCard({ event }: Props) {
  const { classification } = event
  const borderStyle = CONFIDENCE_STYLES[classification.confidence]

  const timeAgo = formatTimeAgo(new Date(event.publishedAt))

  return (
    <article
      className={`rounded-lg border-l-4 border border-gray-800 p-4 transition-opacity ${borderStyle}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Tickers — prefer source tickers, fall back to Claude-extracted ones */}
          <div className="mb-2 flex flex-wrap gap-1.5">
            {(event.tickers.length > 0 ? event.tickers : classification.tickersExtracted).map(
              (ticker) => (
                <span
                  key={ticker}
                  className="rounded bg-gray-800 px-2 py-0.5 font-mono text-xs font-semibold text-blue-300"
                >
                  {ticker}
                </span>
              )
            )}
          </div>

          {/* Headline */}
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm font-medium text-gray-100 hover:text-blue-300 transition-colors line-clamp-2"
          >
            {event.headline}
          </a>

          {/* Reasoning */}
          {classification.reasoning && (
            <p className="mt-1.5 text-xs text-gray-500 line-clamp-2">
              {classification.reasoning}
            </p>
          )}
        </div>

        {/* Right column: badges */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${CONFIDENCE_BADGE[classification.confidence]}`}
          >
            {classification.confidence}
          </span>
          <span
            className={`rounded px-2 py-0.5 text-xs ${MAGNITUDE_BADGE[classification.magnitude]}`}
          >
            {classification.magnitude}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center gap-3 text-xs text-gray-600">
        <span className="rounded bg-gray-800/60 px-2 py-0.5 text-gray-400">
          {EVENT_TYPE_LABELS[classification.eventType]}
        </span>
        <span>{event.source}</span>
        <span className="ml-auto">{timeAgo}</span>
      </div>
    </article>
  )
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
