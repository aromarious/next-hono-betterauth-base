import { type Duration, Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { env } from "@/env"
import { InMemoryRateLimit, parseWindow } from "@/lib/in-memory-ratelimit"

// Settings
const CONFIG = {
  upstashUrl: env.UPSTASH_REDIS_REST_URL,
  upstashToken: env.UPSTASH_REDIS_REST_TOKEN,
  disabled: env.DISABLE_RATE_LIMIT,
  maxRequests: env.RATE_LIMIT_MAX_REQUESTS || 10,
  window: (env.RATE_LIMIT_WINDOW as Duration) || "1 m",
} as const

// Singleton instances
let ratelimit: Ratelimit | null = null
let fallback: InMemoryRateLimit | null = null

// Initialize once on module load
function init() {
  if (CONFIG.disabled) {
    console.log("[RateLimit] Disabled by config")
    return
  }

  if (CONFIG.upstashUrl && CONFIG.upstashToken) {
    try {
      const redis = new Redis({
        url: CONFIG.upstashUrl,
        token: CONFIG.upstashToken,
      })
      ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(CONFIG.maxRequests, CONFIG.window),
        analytics: true,
        prefix: "@upstash/ratelimit",
      })
    } catch (e) {
      console.error("[RateLimit] Redis initialization failed:", e)
      // Fallback if Redis init fails immediately
      fallback = new InMemoryRateLimit(
        CONFIG.maxRequests,
        parseWindow(CONFIG.window),
      )
    }
  } else {
    // If no credentials, we can warn.
    // Ideally we might want to default to in-memory if no credentials?
    // Current logic was: missing creds -> warn & disable (fail open)
    console.warn("[RateLimit] Missing credentials, rate limiting disabled")
  }
}

init()

export type RateLimitResult = {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * Check rate limit for an IP.
 * Tries Redis -> Fallback (In-Memory) -> Fail Open (Allow)
 */
export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  const successResult: RateLimitResult = {
    success: true,
    limit: 0,
    remaining: 0,
    reset: 0,
  }

  // If both are null (disabled or not init), allow.
  if (!ratelimit && !fallback) return successResult

  try {
    if (ratelimit) {
      return await ratelimit.limit(ip)
    }
    if (fallback) {
      return await fallback.limit(ip)
    }
  } catch (e) {
    console.error(`[RateLimit] Check failed for IP ${ip}:`, e)

    // If Redis failed during check, try fallback if available, or create one on the fly?
    // For now, if we had a Redis instance but it failed, we could try to use a fallback.
    // The previous implementation utilized a `fallbackRateLimit` variable.
    // Let's ensure we can use it.

    if (ratelimit && !fallback) {
      // Lazy init fallback if Redis fails at runtime?
      // Or just assume if init passed, we only have one.
      // To be safe and mimic previous logic:
      try {
        if (!fallback) {
          fallback = new InMemoryRateLimit(
            CONFIG.maxRequests,
            parseWindow(CONFIG.window),
          )
        }
        return await fallback.limit(ip)
      } catch (fallbackError) {
        console.error("[RateLimit] Fallback also failed:", fallbackError)
      }
    } else if (fallback) {
      // If fallback itself failed
      console.error("[RateLimit] Fallback failed:", e)
    }
  }

  // Fail Open
  return successResult
}
