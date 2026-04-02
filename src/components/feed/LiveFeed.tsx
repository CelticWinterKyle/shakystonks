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

  // Initial load
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

  // Supabase Realtime: push new events to the top of the feed
  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    const channel = supabase
      .channel('event_classifications_feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'event_classifications' },
        async () => {
          // Fetch the latest page to pick up newly classified events
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
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [threshold])

  const loadMore = async () => {
    if (!cursor || !hasMore) return
    const result = await fetchEvents(threshold, cursor)
    if (!result) return
    setEvents((prev) => [...prev, ...result.newEvents])
    setCursor(result.nextCursor)
    setHasMore(!!result.nextCursor)
  }

  // The server already filters by threshold; this guards against the race where
  // threshold changes between a fetch starting and the result being applied.
  const visibleEvents = events.filter(
    (e) => CONFIDENCE_RANK[e.classification.confidence] >= CONFIDENCE_RANK[threshold]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm text-gray-400">Live · updates automatically</span>
        </div>
        <ConfidenceFilter value={threshold} onChange={setThreshold} />
      </div>

      {loading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-800" />
          ))}
        </div>
      )}

      {!loading && visibleEvents.length === 0 && (
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 py-16 text-center">
          <p className="text-gray-500">No events match the current filter.</p>
          <p className="mt-1 text-sm text-gray-600">
            Market hours are 9:30am – 4:00pm ET on weekdays.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {visibleEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      {hasMore && !loading && (
        <button
          onClick={loadMore}
          className="w-full rounded-lg border border-gray-800 py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          Load more
        </button>
      )}
    </div>
  )
}
