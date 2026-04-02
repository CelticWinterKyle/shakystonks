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
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-100">Daily Digest</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overnight filings and pre-market events ranked by signal strength
        </p>
      </div>
      <DigestView digest={digest} />
    </div>
  )
}
