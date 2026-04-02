'use client'

import type { DailyDigest, DigestEvent } from '@/types'
import { EVENT_TYPE_LABELS } from '@/types'

interface Props {
  digest: DailyDigest | null
}

function scoreClass(score: number): string {
  if (score >= 6) return 'score-display high'
  if (score >= 3) return 'score-display mid'
  return 'score-display'
}

function confidenceDotColor(confidence: DigestEvent['confidence']): string {
  if (confidence === 'high')   return 'var(--color-signal)'
  if (confidence === 'medium') return 'var(--color-amber)'
  return 'var(--color-ink-muted)'
}

function magnitudeColor(magnitude: DigestEvent['magnitude']): string {
  if (magnitude === 'major')    return 'var(--color-danger)'
  if (magnitude === 'moderate') return 'var(--color-amber)'
  return 'var(--color-ink-muted)'
}

export function DigestView({ digest }: Props) {
  if (!digest) {
    return (
      <div
        style={{
          padding: '5rem 2rem',
          textAlign: 'center',
          borderRadius: '8px',
          border: '1px solid var(--color-wire)',
          background: 'var(--color-panel)',
        }}
      >
        <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1rem', color: 'var(--color-ink-dim)' }}>
          No digest available yet.
        </p>
        <p style={{ marginTop: '8px', fontFamily: 'var(--font-data)', fontSize: '0.6rem', color: 'var(--color-ink-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Generated at 08:00 ET on weekdays
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Digest header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-data)', fontSize: '0.575rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-ink-muted)', marginBottom: '4px' }}>
            Pre-Market Summary
          </p>
          <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1rem', color: 'var(--color-ink-dim)' }}>
            {date}
          </p>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-data)',
            fontSize: '0.575rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-ink-muted)',
            background: 'var(--color-panel)',
            border: '1px solid var(--color-wire)',
            borderRadius: '4px',
            padding: '4px 9px',
          }}
        >
          {digest.rankedEvents.length} events
        </span>
      </div>

      {digest.rankedEvents.length === 0 && (
        <div
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            borderRadius: '8px',
            border: '1px solid var(--color-wire)',
            background: 'var(--color-panel)',
          }}
        >
          <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--color-ink-dim)' }}>
            No material events overnight.
          </p>
        </div>
      )}

      {/* ── Event rows ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
      className="card-animate"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '12px 14px',
        borderRadius: '8px',
        background: 'var(--color-panel)',
        border: '1px solid var(--color-wire)',
        textDecoration: 'none',
        transition: 'border-color 0.15s ease, background 0.15s ease',
        animationDelay: `${rank * 25}ms`,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.background = 'var(--color-panel-hover)'
        el.style.borderColor = 'var(--color-wire-bright)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.background = 'var(--color-panel)'
        el.style.borderColor = 'var(--color-wire)'
      }}
    >
      {/* Rank */}
      <span className="rank-num">{rank < 10 ? `0${rank}` : rank}</span>

      {/* Confidence dot */}
      <span style={{
        flexShrink: 0,
        width: '5px',
        height: '5px',
        borderRadius: '50%',
        background: confidenceDotColor(event.confidence),
        marginTop: '4px',
        boxShadow: event.confidence === 'high' ? '0 0 6px var(--color-signal)' : 'none',
      }} />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {event.tickers.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
            {event.tickers.map((ticker) => (
              <span key={ticker} className="ticker-chip">{ticker}</span>
            ))}
          </div>
        )}
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: '0.875rem',
            lineHeight: 1.45,
            color: 'var(--color-ink)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {event.headline}
        </p>
        <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span className="tag-chip">{EVENT_TYPE_LABELS[event.eventType]}</span>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.575rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: magnitudeColor(event.magnitude) }}>
            {event.magnitude}
          </span>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: '0.575rem', color: 'var(--color-ink-muted)', letterSpacing: '0.03em' }}>
            {new Date(event.publishedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Score */}
      <span className={scoreClass(event.score)}>
        {event.score.toFixed(1)}
      </span>
    </a>
  )
}
