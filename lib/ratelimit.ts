import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

interface Entry {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()

function checkRateLimitMemoria(key: string, max: number, windowMs: number): boolean {
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

// Redis distribuido (Upstash) si está configurado — necesario para que el límite se comparta entre
// instancias serverless. Si no hay credenciales, cae a memoria por instancia (alcanza para tráfico bajo,
// pero no frena un ataque repartido entre varias instancias a la vez).
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  : null

async function checkRateLimitRedis(key: string, max: number, windowMs: number): Promise<boolean> {
  const count = await redis!.incr(key)
  if (count === 1) await redis!.pexpire(key, windowMs)
  return count <= max
}

export async function checkRateLimit(key: string, max: number, windowMs: number): Promise<boolean> {
  if (!redis) return checkRateLimitMemoria(key, max, windowMs)
  try {
    return await checkRateLimitRedis(key, max, windowMs)
  } catch {
    // Si Redis falla, no bloqueamos tráfico legítimo por un problema de infraestructura del limiter.
    return checkRateLimitMemoria(key, max, windowMs)
  }
}

export function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

// Helper para endpoints públicos: valida el rate limit por IP y devuelve una respuesta 429 lista para retornar, o null si está OK.
export async function rateLimitOrNull(request: NextRequest, bucket: string, max: number, windowMs: number): Promise<NextResponse | null> {
  const ip = getClientIp(request)
  const ok = await checkRateLimit(`${bucket}:${ip}`, max, windowMs)
  if (ok) return null
  return NextResponse.json({ error: 'Demasiadas solicitudes, probá de nuevo más tarde' }, { status: 429 })
}
