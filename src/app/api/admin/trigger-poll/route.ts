import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }

  const origin = new URL(request.url).origin
  const res = await fetch(`${origin}/api/cron/poll-news`, {
    headers: { Authorization: `Bearer ${cronSecret}` },
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
