'use client'

import { useEffect, useState, useCallback } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { EventCard } from './EventCard'
import { ConfidenceFilter } from './ConfidenceFilter'
import { EventTypeFilter } from './EventTypeFilter'
import { CONFIDENCE_RANK } from '@/types'
import type { NewsEvent, EventClassification, Confidence } from '@/types'

type EventWithClassification = NewsEvent & { classification: EventClassification }

export function LiveFeed() {
  const [events, setEvents] = useState<EventWithClassification[]>([])
  const [threshold, setThreshold] = useState<Confidence>('low')
  const [eventTypeGroup, setEventTypeGroup] = useState('all')
  const [ticker, setTicker] = useState('')
  const [debouncedTicker, setDebouncedTicker] = useState('')
  const [loading, setLoading] = useState(true)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState<{ ok: boolean; material?: number } | null>(null)

  // Debounce ticker input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTicker(ticker), 350)
    return () => clearTimeout(timer)
  }, [ticker])

  const fetchEvents = useCallback(async (
    confidenceFilter: Confidence,
    group: string,
    tickerFilter: string,
    cursorTs?: string
  ) => {
    const params = new URLSearchParams({ confidence: confidenceFilter })
    if (cursorTs) params.set('cursor', cursorTs)
    if (group !== 'all') params.set('group', group)
    if (tickerFilter) params.set('ticker', tickerFilter)
    const res = await fetch(`/api/events?${params}`)
    if (!res.ok) return
    const { events: newEvents, nextCursor } = await res.json()
    return { newEvents, nextCursor }
  }, [])

  // Re-fetch whenever any filter changes
  useEffect(() => {
    setLoading(true)
    setEvents([])
    setCursor(null)
    setHasMore(true)
    fetchEvents(threshold, eventTypeGroup, debouncedTicker).then((result) => {
      if (!result) return
      setEvents(result.newEvents)
      setCursor(result.nextCursor)
      setHasMore(!!result.nextCursor)
      setLoading(false)
      setLastUpdated(new Date())
    })
  }, [threshold, eventTypeGroup, debouncedTicker, fetchEvents])

  // Realtime subscription
  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    const channel = supabase
      .channel('event_classifications_feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'event_classifications' }, async () => {
        const params = new URLSearchParams({ confidence: threshold })
        if (eventTypeGroup !== 'all') params.set('group', eventTypeGroup)
        if (debouncedTicker) params.set('ticker', debouncedTicker)
        const res = await fetch(`/api/events?${params}`)
        if (!res.ok) return
        const { events: fresh } = await res.json()
        if (fresh.length > 0) {
          setEvents((prev) => {
            const existingIds = new Set(prev.map((e) => e.id))
            const newOnes = fresh.filter((e: EventWithClassification) => !existingIds.has(e.id))
            return [...newOnes, ...prev]
          })
          setLastUpdated(new Date())
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [threshold, eventTypeGroup, debouncedTicker])

  const triggerPoll = async () => {
    setRunning(true)
    setRunResult(null)
    try {
      const res = await fetch('/api/admin/trigger-poll', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.ok) {
        setRunResult({ ok: true, material: data.material })
        const result = await fetchEvents(threshold, eventTypeGroup, debouncedTicker)
        if (result) {
          setEvents(result.newEvents)
          setCursor(result.nextCursor)
          setHasMore(!!result.nextCursor)
          setLastUpdated(new Date())
        }
      } else if (data.skipped) {
        setRunResult({ ok: true, material: 0 })
      } else {
        setRunResult({ ok: false })
      }
    } catch {
      setRunResult({ ok: false })
    } finally {
      setRunning(false)
      setTimeout(() => setRunResult(null), 4000)
    }
  }

  const loadMore = async () => {
    if (!cursor || !hasMore) return
    const result = await fetchEvents(threshold, eventTypeGroup, debouncedTicker, cursor)
    if (!result) return
    setEvents((prev) => [...prev, ...result.newEvents])
    setCursor(result.nextCursor)
    setHasMore(!!result.nextCursor)
  }

  const visibleEvents = events.filter(
    (e) => CONFIDENCE_RANK[e.classification.confidence] >= CONFIDENCE_RANK[threshold]
  )

  const highCount = visibleEvents.filter((e) => e.classification.confidence === 'high').length
  const medCount  = visibleEvents.filter((e) => e.classification.confidence === 'medium').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

      {/* ── Stats bar ── */}
      <div style={{ display: 'flex', marginBottom: '10px', gap: '1px' }}>
        <div className="stat-block">
          <div className="stat-num">{loading ? '—' : visibleEvents.length}</div>
          <div className="stat-label">Signals</div>
        </div>
        <div className="stat-block">
          <div className="stat-num" style={{ color: highCount > 0 ? 'var(--color-red)' : undefined }}>
            {loading ? '—' : highCount}
          </div>
          <div className="stat-label">High Conviction</div>
        </div>
        <div className="stat-block">
          <div className="stat-num" style={{ color: medCount > 0 ? 'var(--color-orange)' : undefined }}>
            {loading ? '—' : medCount}
          </div>
          <div className="stat-label">Notable</div>
        </div>
        <div className="stat-block" style={{ flex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '10px' }}>
          <ConfidenceFilter value={threshold} onChange={setThreshold} />
        </div>
      </div>

      {/* ── Filter row: event type + ticker search ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '14px',
          paddingBottom: '14px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <EventTypeFilter value={eventTypeGroup} onChange={setEventTypeGroup} />
        <div style={{ flex: 1 }} />
        {/* Ticker search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            border: `1px solid ${ticker ? 'var(--color-border-bright)' : 'var(--color-border)'}`,
            padding: '5px 10px',
            transition: 'border-color 0.15s',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-data)',
              fontSize: '0.6rem',
              fontWeight: 700,
              color: ticker ? 'var(--color-red)' : 'var(--color-text-muted)',
              letterSpacing: '0.04em',
              transition: 'color 0.15s',
            }}
          >
            $
          </span>
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
            placeholder="TICKER"
            maxLength={5}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontFamily: 'var(--font-data)',
              fontSize: '0.65rem',
              color: ticker ? 'var(--color-text)' : 'var(--color-text-muted)',
              letterSpacing: '0.08em',
              width: '52px',
            }}
          />
          {ticker && (
            <button
              onClick={() => setTicker('')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                fontSize: '0.8rem',
                padding: '0',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* ── Live indicator ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="live-indicator">
            <span className="live-dot" />
            Live
          </div>
          <button
            onClick={triggerPoll}
            disabled={running}
            style={{
              padding: '4px 10px',
              border: `1px solid ${runResult ? (runResult.ok ? 'var(--color-green)' : 'var(--color-red)') : 'var(--color-border-bright)'}`,
              background: 'transparent',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.6rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: runResult ? (runResult.ok ? 'var(--color-green)' : 'var(--color-red)') : 'var(--color-text-muted)',
              cursor: running ? 'not-allowed' : 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
              opacity: running ? 0.6 : 1,
            }}
          >
            {running ? 'Running…' : runResult ? (runResult.ok ? `+${runResult.material ?? 0} signals` : 'Error') : 'Run Now'}
          </button>
        </div>
        {lastUpdated && (
          <span
            style={{
              fontFamily: 'var(--font-data)',
              fontSize: '0.575rem',
              color: 'var(--color-text-muted)',
              letterSpacing: '0.04em',
            }}
          >
            Updated {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
      </div>

      {/* Red rule */}
      <hr className="red-rule" style={{ marginBottom: '12px' }} />

      {/* ── Loading skeleton ── */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              style={{
                height: '88px',
                background: 'var(--color-panel)',
                border: '1px solid var(--color-border)',
                borderLeft: '3px solid #1a1a1a',
                opacity: Math.max(0.2, 1 - i * 0.15),
              }}
            />
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && visibleEvents.length === 0 && (
        <div
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            border: '1px solid var(--color-border)',
            background: 'var(--color-panel)',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              letterSpacing: '0.1em',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
            }}
          >
            No Signals
          </p>
          <p
            style={{
              marginTop: '6px',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.7rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
            }}
          >
            {debouncedTicker ? `No events found for $${debouncedTicker}` : 'Market hours 09:30 – 16:00 ET · Mon–Fri'}
          </p>
        </div>
      )}

      {/* ── Event list ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {visibleEvents.map((event, i) => (
          <div key={event.id} style={{ animationDelay: `${Math.min(i * 25, 200)}ms` }}>
            <EventCard event={event} onTickerClick={setTicker} />
          </div>
        ))}
      </div>

      {/* ── Load more ── */}
      {hasMore && !loading && (
        <button
          onClick={loadMore}
          style={{
            marginTop: '12px',
            width: '100%',
            padding: '12px',
            border: '1px solid var(--color-border)',
            background: 'transparent',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            transition: 'color 0.15s, border-color 0.15s, background 0.15s',
            borderRadius: '2px',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget
            el.style.color = 'var(--color-red)'
            el.style.borderColor = 'rgba(229,0,0,0.4)'
            el.style.background = 'rgba(229,0,0,0.04)'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget
            el.style.color = 'var(--color-text-muted)'
            el.style.borderColor = 'var(--color-border)'
            el.style.background = 'transparent'
          }}
        >
          Load More
        </button>
      )}
    </div>
  )
}
