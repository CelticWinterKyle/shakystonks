import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { acquireLock, releaseLock } from '@/lib/upstash'
import type { DigestEvent } from '@/types'

export const maxDuration = 300

export async function GET(request: NextRequest): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const lockAcquired = await acquireLock('daily-digest', 310)
  if (!lockAcquired) {
    return NextResponse.json({ skipped: true, reason: 'Previous run still active' })
  }

  try {
    const db = createServiceClient()

    // Fetch the last 18 hours of classified events (post-market + overnight)
    const since = new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString()
    const today = new Date().toISOString().slice(0, 10)

    const { data: events, error } = await db
      .from('event_classifications')
      .select(`
        id,
        event_type,
        confidence,
        magnitude,
        composite_score,
        news_events (
          id,
          headline,
          tickers,
          url,
          published_at
        )
      `)
      .neq('event_type', 'irrelevant')
      .gte('classified_at', since)
      .order('composite_score', { ascending: false })
      .limit(50)

    if (error) {
      console.error('[daily-digest] Query error:', error)
      return NextResponse.json({ error: 'DB query failed' }, { status: 500 })
    }

    type NewsEventRow = {
      id: string
      headline: string
      tickers: string[]
      url: string
      published_at: string
    }

    const rankedEvents: DigestEvent[] = (events ?? [])
      .filter((row) => row.news_events !== null)
      .map((row) => {
        const ne = row.news_events as unknown as NewsEventRow
        return {
          eventId: ne.id,
          score: row.composite_score as number,
          headline: ne.headline,
          tickers: ne.tickers,
          eventType: row.event_type as DigestEvent['eventType'],
          confidence: row.confidence as DigestEvent['confidence'],
          magnitude: row.magnitude as DigestEvent['magnitude'],
          url: ne.url,
          publishedAt: ne.published_at,
        }
      })

    // Upsert today's digest
    const { error: upsertError } = await db
      .from('daily_digests')
      .upsert(
        { digest_date: today, ranked_events: rankedEvents },
        { onConflict: 'digest_date' }
      )

    if (upsertError) {
      console.error('[daily-digest] Upsert error:', upsertError)
      return NextResponse.json({ error: 'Failed to persist digest' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, date: today, eventCount: rankedEvents.length })
  } finally {
    await releaseLock('daily-digest')
  }
}
