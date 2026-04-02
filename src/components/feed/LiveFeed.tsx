'use client'

import { useEffect, useState, useCallback } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { EventCard } from './EventCard'
import { ConfidenceFilter } from './ConfidenceFilter'
import { CONFIDENCE_RANK } from '@/types'
import type { NewsEvent, EventClassification, Confidence } from '@/types'

type EventWithClassification = NewsEvent & { classification: EventClassification }

export function LiveFeed() {
  const [events, setEvents] = useState<EventWithClassification[]>([])
  const [threshold, setThreshold] = useState<Confidence>('low')
  const [loading, setLoading] = useState(true)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)

  const fetchEvents = useCallback(async (confidenceFilter: Confidence, cursorTs?: string) => {
    const params = new URLSearchParams({ confidence: confidenceFilter })
    if (cursorTs) params.set('cursor', cursorTs)
    const res = await fetch(`/api/events?${params}`)
    if (!res.ok) return
    const { events: newEvents, nextCursor } = await res.json()
    return { newEvents, nextCursor }
  }, [])

  useEffect(() => {
    setLoading(true)
    setEvents([])
    setCursor(null)
    setHasMore(true)
    fetchEvents(threshold).then((result) => {
      if (!result) return
      setEvents(result.newEvents)
      setCursor(result.nextCursor)
      setHasMore(!!result.nextCursor)
      setLoading(false)
    })
  }, [threshold, fetchEvents])

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    const channel = supabase
      .channel('event_classifications_feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'event_classifications' }, async () => {
        const res = await fetch(`/api/events?confidence=${threshold}`)
        if (!res.ok) return
        const { events: fresh } = await res.json()
        if (fresh.length > 0) {
          setEvents((prev) => {
            const existingIds = new Set(prev.map((e) => e.id))
            const newOnes = fresh.filter((e: EventWithClassification) => !existingIds.has(e.id))
            return [...newOnes, ...prev]
          })
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [threshold])

  const loadMore = async () => {
    if (!cursor || !hasMore) return
    const result = await fetchEvents(threshold, cursor)
    if (!result) return
    setEvents((prev) => [...prev, ...result.newEvents])
    setCursor(result.nextCursor)
    setHasMore(!!result.nextCursor)
  }

  const visibleEvents = events.filter(
    (e) => CONFIDENCE_RANK[e.classification.confidence] >= CONFIDENCE_RANK[threshold]
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Feed header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div className="live-badge">
          <span className="live-dot" />
          Live
        </div>
        <ConfidenceFilter value={threshold} onChange={setThreshold} />
      </div>

      {/* ── Loading skeleton ── */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              style={{
                height: '92px',
                borderRadius: '8px',
                background: 'var(--color-panel)',
                border: '1px solid var(--color-wire)',
                opacity: 1 - i * 0.15,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.025) 50%, transparent 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer-text 2s linear infinite',
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && visibleEvents.length === 0 && (
        <div
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            borderRadius: '8px',
            border: '1px solid var(--color-wire)',
            background: 'var(--color-panel)',
          }}
        >
          <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1rem', color: 'var(--color-ink-dim)' }}>
            No signals match the current filter.
          </p>
          <p style={{ marginTop: '6px', fontFamily: 'var(--font-data)', fontSize: '0.625rem', color: 'var(--color-ink-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Market hours 09:30 – 16:00 ET · Mon–Fri
          </p>
        </div>
      )}

      {/* ── Event list ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {visibleEvents.map((event, i) => (
          <div key={event.id} style={{ animationDelay: `${i * 30}ms` }}>
            <EventCard event={event} />
          </div>
        ))}
      </div>

      {/* ── Load more ── */}
      {hasMore && !loading && (
        <button
          onClick={loadMore}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid var(--color-wire)',
            background: 'transparent',
            fontFamily: 'var(--font-data)',
            fontSize: '0.625rem',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--color-ink-muted)',
            cursor: 'pointer',
            transition: 'color 0.15s ease, border-color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget
            el.style.color = 'var(--color-cyan)'
            el.style.borderColor = 'rgba(0,200,240,0.3)'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget
            el.style.color = 'var(--color-ink-muted)'
            el.style.borderColor = 'var(--color-wire)'
          }}
        >
          Load more
        </button>
      )}
    </div>
  )
}
