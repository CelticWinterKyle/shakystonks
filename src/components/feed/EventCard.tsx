import type { EventClassification, NewsEvent } from '@/types'
import { EVENT_TYPE_LABELS } from '@/types'

interface Props {
  event: NewsEvent & { classification: EventClassification }
  onTickerClick?: (ticker: string) => void
}

function cardClass(c: string) {
  if (c === 'high')   return 'card-high card-in'
  if (c === 'medium') return 'card-medium card-in'
  return 'card-low card-in'
}

function badgeClass(c: string) {
  if (c === 'high')   return 'badge-high'
  if (c === 'medium') return 'badge-medium'
  return 'badge-low'
}

export function EventCard({ event, onTickerClick }: Props) {
  const { classification } = event
  const tickers = event.tickers.length > 0 ? event.tickers : classification.tickersExtracted
  const timeAgo = formatTimeAgo(new Date(event.publishedAt))

  return (
    <article className={cardClass(classification.confidence)} style={{ padding: '14px 16px 12px' }}>

      {/* Top row: tickers + badges */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', flex: 1, minWidth: 0 }}>
          {tickers.map((t) => (
            <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              {/* Chip: click sets the ticker filter */}
              <button
                onClick={() => onTickerClick?.(t)}
                className="ticker-chip"
                style={{ cursor: onTickerClick ? 'pointer' : 'default', border: 'none', background: 'none', padding: 0 }}
                title={`Filter by ${t}`}
              >
                {t}
              </button>
              {/* External link to Yahoo Finance */}
              <a
                href={`https://finance.yahoo.com/quote/${t}`}
                target="_blank"
                rel="noopener noreferrer"
                title={`${t} on Yahoo Finance`}
                style={{
                  fontFamily: 'var(--font-data)',
                  fontSize: '0.5rem',
                  color: 'var(--color-text-muted)',
                  textDecoration: 'none',
                  lineHeight: 1,
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--color-red)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--color-text-muted)' }}
              >
                ↗
              </a>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '5px', flexShrink: 0, alignItems: 'center' }}>
          <span className={badgeClass(classification.confidence)}>{classification.confidence}</span>
          <span className={`mag-${classification.magnitude}`}>{classification.magnitude}</span>
        </div>
      </div>

      {/* Headline */}
      <a
        href={event.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '1.0625rem',
          fontWeight: 700,
          lineHeight: 1.3,
          letterSpacing: '0.01em',
          color: 'var(--color-text)',
          textDecoration: 'none',
          transition: 'color 0.15s',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        } as React.CSSProperties}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--color-red)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--color-text)' }}
      >
        {event.headline}
      </a>

      {/* Reasoning */}
      {classification.reasoning && (
        <p
          style={{
            marginTop: '5px',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.8rem',
            fontWeight: 400,
            color: 'var(--color-text-dim)',
            lineHeight: 1.45,
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          } as React.CSSProperties}
        >
          {classification.reasoning}
        </p>
      )}

      {/* Footer */}
      <div
        style={{
          marginTop: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderTop: '1px solid var(--color-border)',
          paddingTop: '8px',
        }}
      >
        <span className="label-chip">{EVENT_TYPE_LABELS[classification.eventType]}</span>
        <span
          style={{
            fontFamily: 'var(--font-data)',
            fontSize: '0.6rem',
            color: 'var(--color-text-muted)',
            letterSpacing: '0.04em',
          }}
        >
          {event.source}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontFamily: 'var(--font-data)',
            fontSize: '0.6rem',
            color: 'var(--color-text-muted)',
            letterSpacing: '0.04em',
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
