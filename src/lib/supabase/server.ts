import { createClient } from '@supabase/supabase-js'

// Service role client — used in cron handlers and API routes that write to the DB.
// Never expose this to the browser.
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase service role credentials')
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  })
}
