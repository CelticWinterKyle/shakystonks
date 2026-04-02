import type { EventClassification, NewsEvent } from '@/types'
import { EVENT_TYPE_LABELS } from '@/types'

interface Props {
  event: NewsEvent & { classification: EventClassification }
}

function getCardClass(confidence: string) {
  if (confidence === 'high')   return 'card-signal'
  if (confidence === 'medium') return 'card-amber'
  return 'card-default'
}

function getConfidenceBadge(confidence: string) {
  if (confidence === 'high')   return 'badge-signal'
  if (confidence === 'medium') return 'badge-amber'
  return 'badge-muted'
}

function getMagnitudeClass(magnitude: string) {
  return `mag-${magnitude}`
}

export function EventCard({ event }: Props) {
  const { classification } = event
  const timeAgo = formatTimeAgo(new Date(event.publishedAt))
  const tickers = event.tickers.length > 0 ? event.tickers : classification.tickersExtracted

  return (
    <article
      className={`card-animate ${getCardClass(classification.confidence)}`}
      style={{ padding: '14px 16px', transition: 'border-color 0.2s ease, background 0.2s ease' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>

        {/* ── Main content ── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Tickers */}
          {tickers.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '8px' }}>
              {tickers.map((ticker) => (
                <span key={ticker} className="ticker-chip">{ticker}</span>
              ))}
            </div>
          )}

          {/* Headline — Instrument Serif, the hero element */}
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.9375rem',
              fontStyle: 'italic',
              fontWeight: 400,
              lineHeight: 1.45,
              color: 'var(--color-ink)',
              textDecoration: 'none',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--color-cyan)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--color-ink)' }}
          >
            {event.headline}
          </a>

          {/* Reasoning */}
          {classification.reasoning && (
            <p
              style={{
                marginTop: '6px',
                fontFamily: 'var(--font-ui)',
                fontSize: '0.75rem',
                color: 'var(--color-ink-dim)',
                lineHeight: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {classification.reasoning}
            </p>
          )}
        </div>

        {/* ── Right badges ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
          <span className={getConfidenceBadge(classification.confidence)}>
            {classification.confidence}
          </span>
          <span className={getMagnitudeClass(classification.magnitude)}>
            {classification.magnitude}
          </span>
        </div>
      </div>

      {/* ── Footer ── */}
      <div
        style={{
          marginTop: '10px',
          paddingTop: '9px',
          borderTop: '1px solid var(--color-wire)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span className="tag-chip">{EVENT_TYPE_LABELS[classification.eventType]}</span>
        <span
          style={{
            fontFamily: 'var(--font-data)',
            fontSize: '0.625rem',
            color: 'var(--color-ink-muted)',
            letterSpacing: '0.03em',
          }}
        >
          {event.source}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontFamily: 'var(--font-data)',
            fontSize: '0.625rem',
            color: 'var(--color-ink-muted)',
            letterSpacing: '0.03em',
          }}
        >
          {timeAgo}
        </span>
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
