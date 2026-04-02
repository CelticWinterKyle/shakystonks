import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { NewsEvent, EventClassification } from '@/types'

const PAGE_SIZE = 50

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const confidence = searchParams.get('confidence')
  const ticker = searchParams.get('ticker')
  const cursor = searchParams.get('cursor')

  // Validate cursor is a parseable ISO timestamp before passing to DB
  if (cursor) {
    const ts = Date.parse(cursor)
    if (isNaN(ts)) {
      return NextResponse.json({ error: 'Invalid cursor' }, { status: 400 })
    }
  }

  const db = createServiceClient()

  let query = db
    .from('event_classifications')
    .select(`
      id,
      event_id,
      event_type,
      confidence,
      magnitude,
      composite_score,
      reasoning,
      tickers_extracted,
      classified_at,
      model_used,
      news_events (
        id,
        source_id,
        source,
        headline,
        summary,
        url,
        tickers,
        published_at,
        fetched_at
      )
    `)
    .neq('event_type', 'irrelevant')
    .order('classified_at', { ascending: false })
    .limit(PAGE_SIZE)

  // Confidence threshold filter
  if (confidence === 'high') {
    query = query.eq('confidence', 'high')
  } else if (confidence === 'medium') {
    query = query.in('confidence', ['medium', 'high'])
  }

  // Cursor-based pagination
  if (cursor) {
    query = query.lt('classified_at', new Date(Date.parse(cursor)).toISOString())
  }

  // Ticker filter — applied server-side via the array contains operator
  // so that LIMIT and cursor are applied after filtering (correct pagination)
  if (ticker) {
    query = query.contains('tickers_extracted', [ticker.toUpperCase()])
  }

  const { data, error } = await query

  if (error) {
    console.error('[events] Query error:', error)
    return NextResponse.json({ error: 'Query failed' }, { status: 500 })
  }

  const rows = data ?? []

  const events: (NewsEvent & { classification: EventClassification })[] = rows.map((row) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ne = row.news_events as any
    return {
      id: ne.id,
      sourceId: ne.source_id ?? '',
      source: ne.source,
      headline: ne.headline,
      summary: ne.summary ?? null,
      url: ne.url,
      tickers: ne.tickers ?? [],
      publishedAt: ne.published_at,
      fetchedAt: ne.fetched_at ?? '',
      classification: {
        id: row.id,
        eventId: row.event_id,
        eventType: row.event_type,
        confidence: row.confidence,
        magnitude: row.magnitude,
        reasoning: row.reasoning ?? '',
        tickersExtracted: row.tickers_extracted ?? [],
        compositeScore: row.composite_score ?? 0,
        modelUsed: row.model_used ?? '',
        classifiedAt: row.classified_at,
      },
    }
  })

  const nextCursor =
    rows.length === PAGE_SIZE
      ? (rows[rows.length - 1].classified_at as string)
      : null

  return NextResponse.json({ events, nextCursor })
}
