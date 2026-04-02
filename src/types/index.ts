export type NewsSource = 'finnhub' | 'edgar' | 'yahoo_rss' | 'marketwatch_rss'

export type EventType =
  | 'earnings_beat'
  | 'earnings_miss'
  | 'fda_approval'
  | 'fda_rejection'
  | 'clinical_trial_positive'
  | 'clinical_trial_negative'
  | 'contract_win'
  | 'partnership_announcement'
  | 'share_buyback'
  | 'executive_hire'
  | 'executive_departure'
  | 'guidance_raise'
  | 'guidance_cut'
  | 'analyst_upgrade'
  | 'analyst_downgrade'
  | 'merger_acquisition_announced'
  | 'merger_acquisition_rumor'
  | 'dividend_increase'
  | 'dividend_cut'
  | 'dividend_initiation'
  | 'irrelevant'

export type Confidence = 'high' | 'medium' | 'low'
export type Magnitude = 'major' | 'moderate' | 'minor' | 'unknown'

export interface RawNewsItem {
  sourceId: string
  source: NewsSource
  headline: string
  summary: string
  url: string
  tickers: string[]
  publishedAt: Date
}

export interface NewsEvent {
  id: string
  sourceId: string
  source: NewsSource
  headline: string
  summary: string | null
  url: string
  tickers: string[]
  publishedAt: string
  fetchedAt: string
  classification?: EventClassification
}

export interface EventClassification {
  id: string
  eventId: string
  eventType: EventType
  confidence: Confidence
  magnitude: Magnitude
  reasoning: string
  tickersExtracted: string[]
  compositeScore: number
  modelUsed: string
  classifiedAt: string
}

export interface DigestEvent {
  eventId: string
  score: number
  headline: string
  tickers: string[]
  eventType: EventType
  confidence: Confidence
  magnitude: Magnitude
  url: string
  publishedAt: string
}

export interface DailyDigest {
  id: string
  digestDate: string
  rankedEvents: DigestEvent[]
  generatedAt: string
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  earnings_beat: 'Earnings Beat',
  earnings_miss: 'Earnings Miss',
  fda_approval: 'FDA Approval',
  fda_rejection: 'FDA Rejection',
  clinical_trial_positive: 'Trial: Positive',
  clinical_trial_negative: 'Trial: Negative',
  contract_win: 'Contract Win',
  partnership_announcement: 'Partnership',
  share_buyback: 'Buyback',
  executive_hire: 'Executive Hire',
  executive_departure: 'Executive Departure',
  guidance_raise: 'Guidance Raised',
  guidance_cut: 'Guidance Cut',
  analyst_upgrade: 'Analyst Upgrade',
  analyst_downgrade: 'Analyst Downgrade',
  merger_acquisition_announced: 'M&A Announced',
  merger_acquisition_rumor: 'M&A Rumor',
  dividend_increase: 'Dividend Increase',
  dividend_cut: 'Dividend Cut',
  dividend_initiation: 'Dividend Initiated',
  irrelevant: 'Other',
}

export const CONFIDENCE_RANK: Record<Confidence, number> = {
  high: 3,
  medium: 2,
  low: 1,
}

export const MAGNITUDE_RANK: Record<Magnitude, number> = {
  major: 3,
  moderate: 2,
  minor: 1,
  unknown: 1.5,
}
