interface Entry {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()

// Simple in-memory rate limiter. Works per serverless instance — sufficient for a single-admin app.
export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= max) return false

  entry.count++
  return true
}
