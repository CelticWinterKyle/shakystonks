import type { RawNewsItem } from '@/types'

const EDGAR_FEED_URL =
  'https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=8-K&dateb=&owner=include&count=40&search_text=&output=atom'

const TICKERS_JSON_URL = 'https://www.sec.gov/files/company_tickers.json'

// EDGAR requires a User-Agent identifying your app and contact email
const USER_AGENT = `ShakyStocks/1.0 contact@shakystonks.com`

// In-memory cache for the CIK to ticker map (refreshed each cron run)
let cikToTickerCache: Map<string, string> | null = null
let cacheLoadedAt: number | null = null
const CACHE_TTL_MS = 6 * 60 * 60 * 1000

export async function fetchEdgar8KFilings(): Promise<RawNewsItem[]> {
  await ensureCikMap()

  const res = await fetch(EDGAR_FEED_URL, {
    headers: { 'User-Agent': USER_AGENT },
    next: { revalidate: 0 },
  })

  if (!res.ok) throw new Error(`EDGAR feed ${res.status}`)

  const xml = await res.text()
  const entries = parseAtomEntries(xml)

  return entries
    .map((entry) => {
      const ticker = cikToTickerCache?.get(entry.cik) ?? null
      const tickers = ticker ? [ticker] : []

      return {
        sourceId: entry.accessionNumber,
        source: 'edgar' as const,
        headline: `8-K Filing: ${entry.companyName}`,
        summary: `SEC 8-K filed ${entry.filedAt}. Accession: ${entry.accessionNumber}`,
        url: entry.url,
        tickers,
        publishedAt: new Date(entry.filedAt),
      }
    })
    .filter((item) => item.tickers.length > 0)
}

async function ensureCikMap(): Promise<void> {
  const now = Date.now()
  if (cikToTickerCache && cacheLoadedAt && now - cacheLoadedAt < CACHE_TTL_MS) return

  const res = await fetch(TICKERS_JSON_URL, {
    headers: { 'User-Agent': USER_AGENT },
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    console.warn(`[edgar] Failed to load CIK ticker map: HTTP ${res.status}`)
    return
  }

  const data: Record<string, { cik_str: number; ticker: string; title: string }> =
    await res.json()

  cikToTickerCache = new Map()
  for (const entry of Object.values(data)) {
    cikToTickerCache.set(String(entry.cik_str), entry.ticker.toUpperCase())
  }
  cacheLoadedAt = now
}

interface AtomEntry {
  companyName: string
  cik: string
  accessionNumber: string
  filedAt: string
  url: string
}

function parseAtomEntries(xml: string): AtomEntry[] {
  const entries: AtomEntry[] = []
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g
  let match: RegExpExecArray | null

  while ((match = entryRegex.exec(xml)) !== null) {
    const block = match[1]
    const title = extractTag(block, 'title') ?? ''
    const updated = extractTag(block, 'updated') ?? ''
    const id = extractTag(block, 'id') ?? ''

    // Title format: "8-K - COMPANY NAME (0000123456) (Filer)"
    const titleMatch = title.match(/8-K\s+-\s+(.+?)\s+\((\d+)\)/)
    if (!titleMatch) continue

    const companyName = titleMatch[1].trim()
    const cik = String(parseInt(titleMatch[2], 10))

    const accessionMatch = id.match(/([\d]+-[\d]+-[\d]+)$/)
    if (!accessionMatch) continue
    const accessionNumber = accessionMatch[1]

    const paddedCik = cik.padStart(10, '0')
    const accessionNoDashes = accessionNumber.replace(/-/g, '')
    const url = `https://www.sec.gov/Archives/edgar/data/${paddedCik}/${accessionNoDashes}/${accessionNumber}-index.htm`

    entries.push({ companyName, cik, accessionNumber, filedAt: updated, url })
  }

  return entries
}

function extractTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
  return match ? match[1].trim() : null
}
