/**
 * In-Memory Sliding-Window Rate Limiter
 * 
 * Provides fair-use rate limiting tailored for a public BYOK architecture.
 * Protects server compute (Python OpenCV image processing) and DB pools
 * while keeping human creative exploration smooth and uninterrupted.
 */

export interface RateLimitConfig {
  /** Time window in milliseconds (e.g., 60_000 for 1 minute) */
  windowMs: number
  /** Maximum number of allowed requests within the time window */
  max: number
  /** Namespace prefix for isolated bucket tracking */
  prefix?: string
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number // Unix timestamp in seconds
  retryAfter: number // Seconds until client may retry
}

interface WindowBucket {
  timestamps: number[]
  lastAccess: number
}

class InMemoryRateLimiter {
  private buckets = new Map<string, WindowBucket>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Periodically evict expired buckets to keep memory footprint close to zero
    this.cleanupInterval = setInterval(() => {
      this.evictExpired()
    }, 60_000)

    // Ensure the interval timer does not keep Node process alive during exit/tests
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref()
    }
  }

  private evictExpired() {
    const now = Date.now()
    const maxWindow = 15 * 60 * 1000 // 15 min max lifespan for inactive buckets
    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.lastAccess > maxWindow) {
        this.buckets.delete(key)
      }
    }
  }

  public check(identifier: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now()
    const windowStart = now - config.windowMs
    const bucketKey = `${config.prefix || "global"}:${identifier}`

    let bucket = this.buckets.get(bucketKey)
    if (!bucket) {
      bucket = { timestamps: [], lastAccess: now }
      this.buckets.set(bucketKey, bucket)
    }

    bucket.lastAccess = now

    // Filter out timestamps outside the active sliding window
    bucket.timestamps = bucket.timestamps.filter((ts) => ts > windowStart)

    const count = bucket.timestamps.length

    if (count >= config.max) {
      // Exceeded limit: determine when the oldest entry drops out
      const oldest = bucket.timestamps[0] || now
      const resetMs = oldest + config.windowMs
      const retryAfter = Math.max(1, Math.ceil((resetMs - now) / 1000))
      const reset = Math.ceil(resetMs / 1000)

      return {
        success: false,
        limit: config.max,
        remaining: 0,
        reset,
        retryAfter,
      }
    }

    // Record this request
    bucket.timestamps.push(now)
    const remaining = Math.max(0, config.max - bucket.timestamps.length)
    const reset = Math.ceil((now + config.windowMs) / 1000)

    return {
      success: true,
      limit: config.max,
      remaining,
      reset,
      retryAfter: 0,
    }
  }

  /** Reset all buckets (primarily used for unit testing) */
  public resetAll() {
    this.buckets.clear()
  }
}

export const rateLimiterInstance = new InMemoryRateLimiter()

/**
 * Extract client IP from request headers supporting Cloudflare, AWS ALB, Vercel, and local proxies.
 */
export function getClientIp(headers: Headers | { get(name: string): string | null | undefined }): string {
  const cfIp = headers.get("cf-connecting-ip")
  if (cfIp) return cfIp.trim()

  const forwardedFor = headers.get("x-forwarded-for")
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0].trim()
    if (firstIp) return firstIp
  }

  const realIp = headers.get("x-real-ip")
  if (realIp) return realIp.trim()

  return "127.0.0.1"
}

/**
 * Converts a rate limit result to standard RFC / HTTP headers
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.reset.toString(),
  }

  if (!result.success) {
    headers["Retry-After"] = result.retryAfter.toString()
  }

  return headers
}

/**
 * Rate Limiting Presets
 * 
 * Generous for active human exploration while blocking automated scrapers,
 * denial-of-service attempts, and database spam.
 */

// 1. Logo Generation (15 per min: OpenCV Python alpha cleanup + DB row insert)
export const LOGO_GEN_LIMIT: RateLimitConfig = {
  windowMs: 60_000,
  max: 15,
  prefix: "rl:logo_gen",
}

// 2. Mascot Generation (10 per min: 2x AI synthesis + Python multi-slice build + DB row)
export const MASCOT_GEN_LIMIT: RateLimitConfig = {
  windowMs: 60_000,
  max: 10,
  prefix: "rl:mascot_gen",
}

// 3. Model Discovery (30 per min: Outbound provider calls)
export const MODEL_DISCOVERY_LIMIT: RateLimitConfig = {
  windowMs: 60_000,
  max: 30,
  prefix: "rl:models",
}

// 4. DB Upvotes / Likes (25 per min: Direct UPDATE on likes_count)
export const DB_LIKE_LIMIT: RateLimitConfig = {
  windowMs: 60_000,
  max: 25,
  prefix: "rl:db_like",
}

// 5. General DB Queries / Feeds (60 per min)
export const DB_QUERY_LIMIT: RateLimitConfig = {
  windowMs: 60_000,
  max: 60,
  prefix: "rl:db_query",
}
