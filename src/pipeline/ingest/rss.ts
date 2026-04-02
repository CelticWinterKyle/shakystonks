import Parser from 'rss-parser'
import type { RawNewsItem } from '@/types'

const parser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'ShakyStocks/1.0 contact@shakystonks.com' },
})

const RSS_FEEDS = [
  {
    url: 'https://feeds.marketwatch.com/marketwatch/topstories/',
    source: 'marketwatch_rss' as const,
  },
  {
    url: 'https://feeds.marketwatch.com/marketwatch/marketpulse/',
    source: 'marketwatch_rss' as const,
  },
]

export async function fetchRssFeeds(): Promise<RawNewsItem[]> {
  const settled = await Promise.allSettled(
    RSS_FEEDS.map(({ url, source }) => fetchFeed(url, source))
  )

  return settled.flatMap((result) =>
    result.status === 'fulfilled' ? result.value : []
  )
}

async function fetchFeed(
  feedUrl: string,
  source: RawNewsItem['source']
): Promise<RawNewsItem[]> {
  const feed = await parser.parseURL(feedUrl)

  return feed.items
    .filter((item) => item.link && item.title)
    .map((item) => {
      const text = `${item.title ?? ''} ${item.contentSnippet ?? item.content ?? ''}`
      const tickers = extractTickersFromText(text)
      const pubDate = item.pubDate ? new Date(item.pubDate) : new Date()
      const sourceId = item.guid ?? item.link ?? `${source}-${pubDate.getTime()}`

      return {
        sourceId,
        source,
        headline: item.title!,
        summary: item.contentSnippet ?? item.content ?? '',
        url: item.link!,
        tickers,
        publishedAt: pubDate,
      }
    })
}

// Regex-based ticker extraction for sources that don't provide tickers natively.
const NON_TICKER_WORDS = new Set([
  // Roles / acronyms
  'CEO', 'CFO', 'CTO', 'COO', 'IPO', 'FDA', 'SEC', 'ETF', 'EPS',
  'GDP', 'CPI', 'FED', 'USA', 'USD', 'EUR', 'GBP', 'JPY', 'AM',
  'PM', 'Q1', 'Q2', 'Q3', 'Q4', 'AI', 'ML', 'IT', 'US', 'EU', 'UK',
  'AP', 'TV', 'PR', 'DC', 'NY', 'LA', 'SF', 'PE', 'VC', 'LTM', 'TTM',
  // Country codes and non-US exchange identifiers
  'NL', 'FR', 'DE', 'JP', 'CN', 'GB', 'AU', 'CA', 'CH', 'IN', 'BR',
  'MX', 'KR', 'IT', 'ES', 'RU', 'SE', 'NO', 'DK', 'FI', 'NZ', 'HK',
  'SG', 'TW', 'TH', 'ID', 'PH', 'MY', 'ZA', 'IL', 'TR', 'PL', 'CZ',
  'HU', 'RO', 'GR', 'PT', 'BE', 'AT', 'IE', 'SA', 'AE', 'QA', 'NG',
])

export function extractTickersFromText(text: string): string[] {
  const found = new Set<string>()

  // (AAPL) format
  for (const m of text.matchAll(/\(([A-Z]{1,5})\)/g)) {
    const candidate = m[1].toUpperCase()
    if (!NON_TICKER_WORDS.has(candidate)) found.add(candidate)
  }

  // NYSE: AAPL or Nasdaq: AAPL format
  for (const m of text.matchAll(/(?:NYSE|Nasdaq|NASDAQ):\s*([A-Z]{1,5})\b/g)) {
    const candidate = m[1].toUpperCase()
    if (!NON_TICKER_WORDS.has(candidate)) found.add(candidate)
  }

  // $AAPL format
  for (const m of text.matchAll(/\$([A-Z]{1,5})\b/g)) {
    const candidate = m[1].toUpperCase()
    if (!NON_TICKER_WORDS.has(candidate)) found.add(candidate)
  }

  return Array.from(found)
}
