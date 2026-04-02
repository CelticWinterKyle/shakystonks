export interface EventPattern {
  category: string
  required: string[]
  boost: string[]
  exclude: string[]
}

export const EVENT_PATTERNS: EventPattern[] = [
  {
    category: 'earnings_beat',
    required: [
      'earnings beat', 'beat estimates', 'beat expectations', 'beat consensus',
      'topped estimates', 'topped expectations', 'surpassed estimates',
      'earnings surprise', 'positive surprise', 'blew past', 'crushed estimates',
      'exceeded estimates', 'exceeded expectations', 'above estimates',
      'above consensus', 'above expectations', 'eps beat', 'revenue beat',
      'record earnings', 'record profit', 'record revenue',
    ],
    boost: [
      'raised guidance', 'raised outlook', 'record quarter',
      'strong quarter', 'quarterly results',
    ],
    exclude: [
      'earnings miss', 'missed estimates', 'missed expectations',
      'below estimates', 'below expectations', 'fell short', 'disappointing',
      'earnings warning', 'profit warning', 'lowered guidance',
    ],
  },
  {
    category: 'fda_approval_clinical',
    required: [
      'fda approved', 'fda approval', 'fda grants', 'fda clears', 'fda clearance',
      'fda accepts', 'nda approved', 'bla approved', 'pdufa', 'breakthrough therapy',
      'fast track designation', 'priority review', 'accelerated approval',
      'positive phase', 'phase 3 results', 'phase 2 results', 'phase iii',
      'phase ii', 'clinical trial results', 'met primary endpoint',
      'showed efficacy', 'positive topline', 'positive readout',
    ],
    boost: ['patients', 'trial', 'drug', 'therapy', 'treatment', 'indication'],
    exclude: [
      'fda rejects', 'fda rejected', 'complete response letter', ' crl ',
      'failed to meet', 'missed primary endpoint', 'negative results',
      'trial halted', 'trial suspended', 'clinical hold',
    ],
  },
  {
    category: 'contract_partnership',
    required: [
      'wins contract', 'awarded contract', 'contract award', 'contract win',
      'secures contract', 'signed contract', 'multi-year contract',
      'new agreement', 'strategic agreement', 'partnership agreement',
      'signed partnership', 'strategic partnership', 'joint venture',
      'new deal', 'deal signed', 'collaboration agreement',
      'licensing agreement', 'supply agreement', 'distribution agreement',
      'preferred supplier', 'selected by', 'chosen by',
    ],
    boost: ['million', 'billion', 'multi-year', 'exclusive', 'government', 'defense'],
    exclude: [
      'terminates contract', 'cancels contract', 'loses contract',
      'contract dispute', 'breach of contract', 'contract terminated',
      'partnership dissolved',
    ],
  },
  {
    category: 'share_buyback',
    required: [
      'share repurchase', 'stock repurchase', 'buyback program',
      'repurchase program', 'repurchase plan', 'repurchase authorization',
      'authorized repurchase', 'buyback authorization',
      'return capital to shareholders',
    ],
    boost: ['million shares', 'billion', 'board approved', 'new program'],
    exclude: [],
  },
  {
    category: 'executive_change',
    required: [
      'names ceo', 'names cfo', 'names coo', 'names cto', 'names president',
      'appoints ceo', 'appoints cfo', 'appoints coo', 'appoints cto',
      'ceo resigns', 'cfo resigns', 'ceo steps down', 'cfo steps down',
      'ceo departure', 'cfo departure', 'new ceo', 'new cfo', 'new coo',
      'executive appointment', 'leadership change', 'management change',
      'interim ceo', 'interim cfo',
    ],
    boost: ['effective immediately', 'board of directors', 'retirement'],
    exclude: [],
  },
  {
    category: 'guidance_upgrade',
    required: [
      'raises guidance', 'raised guidance', 'raises outlook', 'raised outlook',
      'raises forecast', 'raised forecast', 'raises full-year',
      'increases guidance', 'increased guidance', 'upside guidance',
      'upgraded', 'upgrades to buy', 'upgrades to overweight',
      'price target raised', 'pt raised', 'raises price target',
      'initiates with buy', 'initiates at buy', 'outperform initiation',
    ],
    boost: ['full year', 'fiscal year', 'annual', 'analyst', 'consensus'],
    exclude: [
      'lowers guidance', 'lowered guidance', 'cuts guidance', 'cut guidance',
      'below guidance', 'guidance cut', 'unchanged', 'reaffirms guidance',
      'maintains guidance', 'downgraded', 'price target cut', 'price target lowered',
    ],
  },
  {
    category: 'merger_acquisition',
    required: [
      'acquisition', 'acquires', 'acquired by', 'to be acquired',
      'merger', 'to merge', 'agreed to merge', 'merger agreement',
      'takeover', 'takeover bid', 'buyout', 'tender offer', 'going private',
      'exploring strategic alternatives', 'strategic review',
      'sale process', 'received approach',
    ],
    boost: ['billion', 'million', 'cash deal', 'all-stock', 'premium', 'per share'],
    exclude: [
      'no plans', 'rules out', 'not looking at acquisitions',
    ],
  },
  {
    category: 'dividend',
    required: [
      'dividend increase', 'dividend raise', 'raises dividend', 'raised dividend',
      'increases dividend', 'special dividend', 'declares dividend',
      'dividend declaration', 'dividend cut', 'dividend reduction',
      'reduces dividend', 'suspends dividend', 'eliminates dividend',
      'initiates dividend', 'first dividend',
    ],
    boost: ['per share', 'yield', 'payout', 'board approved', 'shareholders'],
    exclude: [],
  },
]

export interface PreFilterResult {
  category: string
  score: number
}

// Returns all matching categories with their scores.
// Empty array means the item is noise — skip classification.
export function preFilter(headline: string, summary: string): PreFilterResult[] {
  const text = `${headline} ${summary}`.toLowerCase()
  const matches: PreFilterResult[] = []

  for (const pattern of EVENT_PATTERNS) {
    const hasExclusion = pattern.exclude.some((term) => text.includes(term))
    if (hasExclusion) continue

    const requiredMatches = pattern.required.filter((term) => text.includes(term))
    if (requiredMatches.length === 0) continue

    let score = requiredMatches.length
    const boostMatches = pattern.boost.filter((term) => text.includes(term))
    score += boostMatches.length * 0.5

    matches.push({ category: pattern.category, score })
  }

  return matches
}
