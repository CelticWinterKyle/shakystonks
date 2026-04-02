import { createServiceClient } from '@/lib/supabase/server'
import { DigestView } from '@/components/digest/DigestView'
import type { DailyDigest } from '@/types'

export const metadata = { title: 'Daily Digest — shakystonks' }

// Never prerender — requires live Supabase credentials and real-time data
export const dynamic = 'force-dynamic'

async function getLatestDigest(): Promise<DailyDigest | null> {
  const db = createServiceClient()

  const { data, error } = await db
    .from('daily_digests')
    .select('*')
    .order('digest_date', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null

  return {
    id: data.id as string,
    digestDate: data.digest_date as string,
    rankedEvents: data.ranked_events as DailyDigest['rankedEvents'],
    generatedAt: data.generated_at as string,
  }
}

export default async function DailyDigestPage() {
  const digest = await getLatestDigest()

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: '1.5rem',
            fontWeight: 400,
            color: 'var(--color-ink)',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
            marginBottom: '6px',
          }}
        >
          Daily Digest
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-data)',
            fontSize: '0.625rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-ink-muted)',
          }}
        >
          Overnight filings · Pre-market · Ranked by signal strength
        </p>
      </div>
      <DigestView digest={digest} />
    </div>
  )
}
