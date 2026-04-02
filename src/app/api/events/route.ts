import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServiceClient } from '@/lib/supabase/server'

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
      event_type,
      confidence,
      magnitude,
      composite_score,
      reasoning,
      tickers_extracted,
      classified_at,
      news_events (
        id,
        headline,
        summary,
        url,
        tickers,
        source,
        published_at
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

  const events = data ?? []

  const nextCursor =
    events.length === PAGE_SIZE
      ? (events[events.length - 1].classified_at as string)
      : null

  return NextResponse.json({ events, nextCursor })
}
