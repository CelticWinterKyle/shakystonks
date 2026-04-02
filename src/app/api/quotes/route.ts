import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { fetchQuote } from '@/pipeline/ingest/finnhub'

export interface QuoteData {
  price: number
  change: number
  changePercent: number
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const raw = request.nextUrl.searchParams.get('tickers') ?? ''
  const tickers = raw.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean).slice(0, 20)

  if (tickers.length === 0) return NextResponse.json({})

  const results = await Promise.allSettled(
    tickers.map(async (t) => ({ ticker: t, quote: await fetchQuote(t) }))
  )

  const quotes: Record<string, QuoteData> = {}
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.quote && result.value.quote.c > 0) {
      const { ticker, quote } = result.value
      quotes[ticker] = {
        price: quote.c,
        change: quote.d,
        changePercent: quote.dp,
      }
    }
  }

  return NextResponse.json(quotes)
}
