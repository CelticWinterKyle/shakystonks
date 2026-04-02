import { NextRequest, NextResponse } from 'next/server'
import { acquireLock, releaseLock } from '@/lib/upstash'
import { fetchFinnhubGeneralNews } from '@/pipeline/ingest/finnhub'
import { fetchEdgar8KFilings } from '@/pipeline/ingest/edgar'
import { fetchRssFeeds } from '@/pipeline/ingest/rss'
import { preFilter } from '@/pipeline/filter/patterns'
import { classifyBatch } from '@/pipeline/classify/classifier'
import { upsertNewsEvents, insertClassifications } from '@/pipeline/store/upsert'
import type { RawNewsItem } from '@/types'

export const maxDuration = 300

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Verify this is a legitimate Vercel cron request
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // TTL matches maxDuration (300s) + 10s buffer so a hard Vercel timeout
  // doesn't leave the lock held beyond one cron interval.
  const lockAcquired = await acquireLock('poll-news', 310)
  if (!lockAcquired) {
    return NextResponse.json({ skipped: true, reason: 'Previous run still active' })
  }

  const startedAt = Date.now()

  try {
    // 1. Fetch from all sources in parallel
    const [finnhubItems, edgarItems, rssItems] = await Promise.allSettled([
      fetchFinnhubGeneralNews(),
      fetchEdgar8KFilings(),
      fetchRssFeeds(),
    ])

    const allItems: RawNewsItem[] = [
      ...(finnhubItems.status === 'fulfilled' ? finnhubItems.value : []),
      ...(edgarItems.status === 'fulfilled' ? edgarItems.value : []),
      ...(rssItems.status === 'fulfilled' ? rssItems.value : []),
    ]

    // 2. Upsert all raw events (idempotent — duplicates are ignored)
    const storedEvents = await upsertNewsEvents(allItems)

    // Build a map of sourceId → event UUID for linking classifications
    const eventIdMap = new Map<string, string>()
    for (const event of storedEvents) {
      eventIdMap.set(event.sourceId, event.id)
    }

    // 3. Pre-filter: only send items with signal to Claude
    const itemsForClassification = allItems.filter((item) => {
      const matches = preFilter(item.headline, item.summary)
      return matches.length > 0
    })

    // 4. Classify in batches
    const classificationInputs = itemsForClassification.map((item) => ({
      id: item.sourceId,
      headline: item.headline,
      summary: item.summary,
      tickerHint: item.tickers[0],
    }))

    const results = await classifyBatch(classificationInputs)

    // 5. Store classifications
    await insertClassifications(eventIdMap, results)

    const duration = Date.now() - startedAt
    const materialEvents = results.filter((r) => r.eventType !== 'irrelevant').length

    return NextResponse.json({
      ok: true,
      fetched: allItems.length,
      stored: storedEvents.length,
      classified: results.length,
      material: materialEvents,
      durationMs: duration,
    })
  } finally {
    await releaseLock('poll-news')
  }
}
