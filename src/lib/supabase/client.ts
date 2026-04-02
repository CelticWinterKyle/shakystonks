'use client'

import { createClient } from '@supabase/supabase-js'

// Browser client — uses the anon key. Safe to expose.
// Used for Realtime subscriptions in the Live Feed.
let client: ReturnType<typeof createClient> | null = null

export function getSupabaseBrowserClient() {
  if (client) return client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase public credentials')
  }

  client = createClient(url, key)
  return client
}
