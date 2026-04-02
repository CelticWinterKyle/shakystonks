import type { RawNewsItem } from '@/types'

const BASE_URL = 'https://finnhub.io/api/v1'
const API_KEY = process.env.FINNHUB_API_KEY

// General market news categories Finnhub supports on the free tier
const GENERAL_CATEGORIES = ['general', 'merger'] as const

export async function fetchFinnhubCompanyNews(
  symbol: string,
  fromDate: string,
  toDate: string
): Promise<RawNewsItem[]> {
  if (!API_KEY) throw new Error('FINNHUB_API_KEY not set')

  const url = new URL(`${BASE_URL}/company-news`)
  url.searchParams.set('symbol', symbol)
  url.searchParams.set('from', fromDate)
  url.searchParams.set('to', toDate)
  url.searchParams.set('token', API_KEY)

  const res = await fetch(url.toString(), { next: { revalidate: 0 } })
  if (!res.ok) throw new Error(`Finnhub company-news ${res.status}: ${await res.text()}`)

  const data: FinnhubNewsItem[] = await res.json()
  return data.map(normalizeFinnhubItem)
}

export async function fetchFinnhubGeneralNews(): Promise<RawNewsItem[]> {
  if (!API_KEY) throw new Error('FINNHUB_API_KEY not set')

  const results: RawNewsItem[] = []

  for (const category of GENERAL_CATEGORIES) {
    const url = new URL(`${BASE_URL}/news`)
    url.searchParams.set('category', category)
    url.searchParams.set('token', API_KEY)

    const res = await fetch(url.toString(), { next: { revalidate: 0 } })
    if (!res.ok) {
      console.warn(`[finnhub] General news fetch failed for category '${category}': HTTP ${res.status}`)
      continue
    }

    const data: FinnhubNewsItem[] = await res.json()
    results.push(...data.map(normalizeFinnhubItem))
  }

  return results
}

// Fetch a price quote for a ticker — replaces yfinance for our use case
export async function fetchQuote(symbol: string): Promise<FinnhubQuote | null> {
  if (!API_KEY) return null

  const url = new URL(`${BASE_URL}/quote`)
  url.searchParams.set('symbol', symbol)
  url.searchParams.set('token', API_KEY)

  const res = await fetch(url.toString(), { next: { revalidate: 0 } })
  if (!res.ok) return null

  return res.json()
}

function normalizeFinnhubItem(item: FinnhubNewsItem): RawNewsItem {
  const tickers: string[] = []
  if (item.related && item.related.trim()) {
    tickers.push(item.related.trim().toUpperCase())
  }

  return {
    sourceId: String(item.id),
    source: 'finnhub',
    headline: item.headline,
    summary: item.summary ?? '',
    url: item.url,
    tickers,
    publishedAt: new Date(item.datetime * 1000),
  }
}

interface FinnhubNewsItem {
  id: number
  datetime: number
  headline: string
  summary?: string
  related: string
  source: string
  url: string
  category: string
}

export interface FinnhubQuote {
  c: number   // current price
  d: number   // change
  dp: number  // percent change
  h: number   // high
  l: number   // low
  o: number   // open
  pc: number  // previous close
  t: number   // timestamp
}
