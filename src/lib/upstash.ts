import { Redis } from '@upstash/redis'

let redis: Redis | null = null

export function getRedis(): Redis {
  if (redis) return redis

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    throw new Error('Missing Upstash Redis credentials')
  }

  redis = new Redis({ url, token })
  return redis
}

// Acquire a distributed lock. Returns true if acquired, false if already locked.
export async function acquireLock(key: string, ttlSeconds: number): Promise<boolean> {
  const r = getRedis()
  // SET NX EX: only set if not exists, with expiry
  const result = await r.set(`lock:${key}`, '1', { nx: true, ex: ttlSeconds })
  return result === 'OK'
}

export async function releaseLock(key: string): Promise<void> {
  const r = getRedis()
  await r.del(`lock:${key}`)
}
