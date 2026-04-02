import Anthropic from '@anthropic-ai/sdk'
import type { EventType, Confidence, Magnitude } from '@/types'
import { EVENT_TYPE_LABELS, CONFIDENCE_RANK, MAGNITUDE_RANK } from '@/types'
import { computeCost, isCircuitOpen, recordSpend } from './cost-tracker'

const client = new Anthropic()

const BATCH_SIZE = 8

const CLASSIFICATION_TOOL: Anthropic.Tool = {
  name: 'classify_news_batch',
  description: 'Classify a batch of financial news items for material corporate events.',
  input_schema: {
    type: 'object' as const,
    properties: {
      classifications: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            item_id: { type: 'string' },
            event_type: {
              type: 'string',
              // Derived from EVENT_TYPE_LABELS — single source of truth for valid event types
              enum: Object.keys(EVENT_TYPE_LABELS),
            },
            confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
            magnitude: { type: 'string', enum: ['major', 'moderate', 'minor', 'unknown'] },
            reasoning: { type: 'string' },
            tickers_mentioned: { type: 'array', items: { type: 'string' } },
          },
          required: ['item_id', 'event_type', 'confidence', 'magnitude', 'reasoning', 'tickers_mentioned'],
        },
      },
    },
    required: ['classifications'],
  },
}

const SYSTEM_PROMPT = `You are a financial news analyst specializing in event-driven trading signals.

Classify news headlines for material corporate events that could move stock prices.

Guidelines:
- Focus on the PRIMARY event. If multiple events are present, classify the most material one.
- 'high' confidence = event is explicitly and unambiguously stated.
- 'medium' confidence = event is strongly implied.
- 'low' confidence = speculative or requires inference.
- For tickers: extract only symbols you are confident about. Do not guess.
- For magnitude: major = likely >5% price move; moderate = 1-5%; minor = <1%.
- Use 'irrelevant' if no material corporate event is present.`

export interface ClassificationInput {
  id: string
  headline: string
  summary: string
  tickerHint?: string
}

export interface ClassificationResult {
  itemId: string
  eventType: EventType
  confidence: Confidence
  magnitude: Magnitude
  reasoning: string
  tickersMentioned: string[]
  compositeScore: number
  modelUsed: string
  costUsd: number
}

export async function classifyBatch(
  items: ClassificationInput[],
  model = 'claude-haiku-4-5'
): Promise<ClassificationResult[]> {
  if (isCircuitOpen()) {
    console.warn('[classifier] Circuit open — skipping classification')
    return []
  }

  const results: ClassificationResult[] = []
  const batches = chunk(items, BATCH_SIZE)

  for (const batch of batches) {
    const batchResults = await classifySingleBatch(batch, model)
    results.push(...batchResults)
  }

  return results
}

async function classifySingleBatch(
  items: ClassificationInput[],
  model: string
): Promise<ClassificationResult[]> {
  const itemsText = items
    .map(
      (item) =>
        `ITEM ${item.id}:\nHEADLINE: ${item.headline}\nSUMMARY: ${item.summary}` +
        (item.tickerHint ? `\nTICKER HINT: ${item.tickerHint}` : '')
    )
    .join('\n\n')

  const userMessage = `Classify each of the following ${items.length} financial news items. Return one classification per item maintaining the same item_id values.\n\n${itemsText}`

  let response: Anthropic.Message

  try {
    response = await client.messages.create({
      model,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      tools: [CLASSIFICATION_TOOL],
      tool_choice: { type: 'tool', name: 'classify_news_batch' },
      messages: [{ role: 'user', content: userMessage }],
    })
  } catch (err) {
    console.error('[classifier] API error:', err)
    return []
  }

  const cost = computeCost(
    response.usage.input_tokens,
    response.usage.output_tokens,
    model
  )
  recordSpend(cost)

  const toolBlock = response.content.find((b) => b.type === 'tool_use')
  if (!toolBlock || toolBlock.type !== 'tool_use') return []

  const rawClassifications = (toolBlock.input as { classifications: RawClassification[] })
    .classifications

  return rawClassifications.map((raw) => {
    const compositeScore =
      (CONFIDENCE_RANK[raw.confidence as Confidence] ?? 1) *
      (MAGNITUDE_RANK[raw.magnitude as Magnitude] ?? 1)
    return {
      itemId: raw.item_id,
      eventType: raw.event_type as EventType,
      confidence: raw.confidence as Confidence,
      magnitude: raw.magnitude as Magnitude,
      reasoning: raw.reasoning,
      tickersMentioned: raw.tickers_mentioned,
      compositeScore,
      modelUsed: model,
      costUsd: cost / items.length,
    }
  })
}

interface RawClassification {
  item_id: string
  event_type: string
  confidence: string
  magnitude: string
  reasoning: string
  tickers_mentioned: string[]
}

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}
