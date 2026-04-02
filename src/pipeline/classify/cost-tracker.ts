// Tracks Anthropic API spend and enforces a daily hard cap.
// Uses module-level state (persists across cron invocations within the same
// Node process on Vercel; resets on cold starts — acceptable for a soft guard).
// The api_cost_log table in Supabase is the authoritative audit trail.

const HAIKU_INPUT_PER_MTOK = 0.80
const HAIKU_OUTPUT_PER_MTOK = 4.00
const SONNET_INPUT_PER_MTOK = 3.00
const SONNET_OUTPUT_PER_MTOK = 15.00

let dailySpend = 0
let dayKey = todayKey()
let circuitOpen = false

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function resetIfNewDay(): void {
  const today = todayKey()
  if (today !== dayKey) {
    dailySpend = 0
    dayKey = today
    circuitOpen = false
  }
}

export function computeCost(
  inputTokens: number,
  outputTokens: number,
  model: string
): number {
  const isSonnet = model.includes('sonnet')
  const inputRate = isSonnet ? SONNET_INPUT_PER_MTOK : HAIKU_INPUT_PER_MTOK
  const outputRate = isSonnet ? SONNET_OUTPUT_PER_MTOK : HAIKU_OUTPUT_PER_MTOK
  return (inputTokens / 1_000_000) * inputRate + (outputTokens / 1_000_000) * outputRate
}

export function recordSpend(costUsd: number): void {
  resetIfNewDay()
  dailySpend += costUsd

  const cap = parseFloat(process.env.ANTHROPIC_DAILY_COST_CAP_USD ?? '20')
  if (dailySpend >= cap) {
    circuitOpen = true
    console.warn(`[cost-tracker] Daily cap $${cap} reached. Circuit open.`)
  }
}

export function isCircuitOpen(): boolean {
  resetIfNewDay()
  return circuitOpen
}

export function getDailySpend(): number {
  resetIfNewDay()
  return dailySpend
}
