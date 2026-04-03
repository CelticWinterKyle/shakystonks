import { createServiceClient } from '@/lib/supabase/server'
import type { RawNewsItem } from '@/types'
import type { ClassificationResult } from '../classify/classifier'
import { computeCost } from '../classify/cost-tracker'

export interface StoredEvent {
  id: string
  sourceId: string
  source: string
}

// Upsert news events — idempotent on (source, source_id)
export async function upsertNewsEvents(items: RawNewsItem[]): Promise<StoredEvent[]> {
  if (items.length === 0) return []

  const db = createServiceClient()

  const rows = items.map((item) => ({
    source: item.source,
    source_id: item.sourceId,
    headline: item.headline,
    summary: item.summary,
    url: item.url,
    tickers: item.tickers,
    published_at: item.publishedAt.toISOString(),
  }))

  const { data, error } = await db
    .from('news_events')
    .upsert(rows, { onConflict: 'source,source_id', ignoreDuplicates: false })
    .select('id, source_id, source')

  if (error) {
    console.error('[store] upsertNewsEvents error:', error)
    return []
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    sourceId: row.source_id as string,
    source: row.source as string,
  }))
}

// Insert classifications — one per event, no upsert needed (events are new)
export async function insertClassifications(
  eventIdMap: Map<string, string>, // sourceId → event UUID
  results: ClassificationResult[]
): Promise<void> {
  if (results.length === 0) return

  const db = createServiceClient()

  const rows = results
    .filter((r) => r.eventType !== 'irrelevant' && r.tickersMentioned.length > 0)
    .map((r) => {
      const eventId = eventIdMap.get(r.itemId)
      if (!eventId) return null

      return {
        event_id: eventId,
        event_type: r.eventType,
        confidence: r.confidence,
        magnitude: r.magnitude,
        reasoning: r.reasoning,
        tickers_extracted: r.tickersMentioned,
        composite_score: r.compositeScore,
        model_used: r.modelUsed,
      }
    })
    .filter(Boolean)

  if (rows.length === 0) return

  const { error } = await db.from('event_classifications').insert(rows)
  if (error) console.error('[store] insertClassifications error:', error)
}

// Log API costs to the audit table
export async function logApiCost(params: {
  provider: string
  model: string
  inputTokens: number
  outputTokens: number
  itemCount: number
}): Promise<void> {
  const db = createServiceClient()
  const costUsd = computeCost(params.inputTokens, params.outputTokens, params.model)

  await db.from('api_cost_log').insert({
    provider: params.provider,
    model: params.model,
    input_tokens: params.inputTokens,
    output_tokens: params.outputTokens,
    cost_usd: costUsd,
    item_count: params.itemCount,
  })
}
