'use client'

import type { DailyDigest, DigestEvent } from '@/types'
import { EVENT_TYPE_LABELS } from '@/types'

interface Props {
  digest: DailyDigest | null
}

function scoreBarColor(score: number): string {
  if (score >= 6) return 'var(--color-red)'
  if (score >= 3) return 'var(--color-orange)'
  return '#333'
}

function confidenceBadge(c: DigestEvent['confidence']) {
  if (c === 'high')   return 'badge-high'
  if (c === 'medium') return 'badge-medium'
  return 'badge-low'
}

export function DigestView({ digest }: Props) {
  if (!digest) {
    return (
      <div
        style={{
          padding: '5rem 2rem',
          textAlign: 'center',
          border: '1px solid var(--color-border)',
          background: 'var(--color-panel)',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
          }}
        >
          No Digest Yet
        </p>
        <p
          style={{
            marginTop: '8px',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.65rem',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
          }}
        >
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

  const maxScore = Math.max(...digest.rankedEvents.map((e) => e.score), 1)

  return (
    <div>
      {/* ── Digest header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '16px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div>
          <p
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              marginBottom: '4px',
            }}
          >
            Pre-Market Summary
          </p>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--color-text)',
              lineHeight: 1,
            }}
          >
            {date}
          </p>
        </div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2rem',
            letterSpacing: '0.04em',
            color: 'var(--color-red)',
            lineHeight: 1,
          }}
        >
          {digest.rankedEvents.length}
          <span
            style={{
              display: 'block',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.6rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              marginTop: '2px',
            }}
          >
            Events
          </span>
        </div>
      </div>

      {/* Red rule */}
      <hr className="red-rule" style={{ marginBottom: '12px' }} />

      {digest.rankedEvents.length === 0 && (
        <div
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            border: '1px solid var(--color-border)',
            background: 'var(--color-panel)',
          }}
        >
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '0.1em', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            No Material Events
          </p>
        </div>
      )}

      {/* ── Ranked events ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {digest.rankedEvents.map((event, index) => (
          <DigestEventRow
            key={event.eventId}
            event={event}
            rank={index + 1}
            maxScore={maxScore}
          />
        ))}
      </div>
    </div>
  )
}

function DigestEventRow({
  event,
  rank,
  maxScore,
}: {
  event: DigestEvent
  rank: number
  maxScore: number
}) {
  const barWidth = `${Math.round((event.score / maxScore) * 100)}%`
  const isTop3 = rank <= 3

  return (
    <a
      href={event.url}
      target="_blank"
      rel="noopener noreferrer"
      className="card-in"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0',
        textDecoration: 'none',
        background: 'var(--color-panel)',
        border: '1px solid var(--color-border)',
        borderLeft: isTop3 ? '3px solid var(--color-red)' : '3px solid var(--color-border)',
        transition: 'background 0.15s, border-color 0.15s',
        animationDelay: `${rank * 30}ms`,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.background = 'var(--color-panel-hover)'
        el.style.borderColor = isTop3 ? 'rgba(229,0,0,0.5)' : 'var(--color-border-bright)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.background = 'var(--color-panel)'
        el.style.borderColor = isTop3 ? 'var(--color-red)' : 'var(--color-border)'
      }}
    >
      {/* Rank */}
      <div
        style={{
          padding: '14px 12px',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '52px',
        }}
      >
        <span className={`rank-num${isTop3 ? ' top' : ''}`}>
          {rank < 10 ? `0${rank}` : rank}
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '12px 14px', minWidth: 0 }}>
        {/* Tickers + badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {event.tickers.map((t) => (
              <span key={t} className="ticker-chip">{t}</span>
            ))}
          </div>
          <span className={confidenceBadge(event.confidence)}>{event.confidence}</span>
        </div>

        {/* Headline */}
        <p
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.975rem',
            fontWeight: 700,
            lineHeight: 1.35,
            letterSpacing: '0.01em',
            color: 'var(--color-text)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            marginBottom: '8px',
          } as React.CSSProperties}
        >
          {event.headline}
        </p>

        {/* Score bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div className="score-bar-track">
            <div
              className="score-bar-fill"
              style={{
                '--bar-width': barWidth,
                background: scoreBarColor(event.score),
                width: barWidth,
              } as React.CSSProperties}
            />
          </div>
          <span
            style={{
              fontFamily: 'var(--font-data)',
              fontSize: '0.625rem',
              fontWeight: 700,
              color: scoreBarColor(event.score),
              letterSpacing: '0.04em',
              flexShrink: 0,
            }}
          >
            {event.score.toFixed(1)}
          </span>
        </div>

        {/* Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span className="label-chip">{EVENT_TYPE_LABELS[event.eventType]}</span>
          <span className={`mag-${event.magnitude}`}>{event.magnitude}</span>
          <span
            style={{
              fontFamily: 'var(--font-data)',
              fontSize: '0.575rem',
              color: 'var(--color-text-muted)',
              letterSpacing: '0.04em',
            }}
          >
            {new Date(event.publishedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </a>
  )
}
