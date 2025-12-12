import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { InMemoryRateLimit, parseWindow } from "@/lib/in-memory-ratelimit"

// 環境変数の取得(ビルド時にチェックされるため、ここでは直接参照)
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const DISABLE_RATE_LIMIT = process.env.DISABLE_RATE_LIMIT === "true"

// レート制限の設定(環境変数またはデフォルト値)
const RATE_LIMIT_MAX_REQUESTS = Number.parseInt(
  process.env.RATE_LIMIT_MAX_REQUESTS || "10",
  10,
)
const RATE_LIMIT_WINDOW = (process.env.RATE_LIMIT_WINDOW ||
  "1 m") as `${number} ${"ms" | "s" | "m" | "h" | "d"}`

// レートリミットの初期化
let ratelimit: Ratelimit | null = null
let fallbackRateLimit: InMemoryRateLimit | null = null

// レートリミットを無効化フラグまたは認証情報がない場合は無効化
if (!DISABLE_RATE_LIMIT && UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
  try {
    const redis = new Redis({
      url: UPSTASH_REDIS_REST_URL,
      token: UPSTASH_REDIS_REST_TOKEN,
    })

    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        RATE_LIMIT_MAX_REQUESTS,
        RATE_LIMIT_WINDOW,
      ),
      analytics: true,
      prefix: "@upstash/ratelimit",
    })
  } catch (error) {
    console.error("[Middleware] Failed to initialize rate limiter:", error)
    console.warn("[Middleware] Falling back to in-memory rate limiting")
    // Redis初期化に失敗した場合、インメモリにフォールバック
    fallbackRateLimit = new InMemoryRateLimit(
      RATE_LIMIT_MAX_REQUESTS,
      parseWindow(RATE_LIMIT_WINDOW),
    )
  }
} else {
  if (DISABLE_RATE_LIMIT) {
    console.log(
      "[Middleware] Rate limiting is disabled (DISABLE_RATE_LIMIT=true)",
    )
  } else {
    console.warn(
      "[Middleware] Rate limiting is disabled (missing Upstash credentials)",
    )
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // /api/health はレート制限から除外
  if (pathname === "/api/health") {
    return NextResponse.next()
  }

  // レートリミットが無効化されている場合はスキップ
  if (!ratelimit && !fallbackRateLimit) {
    return NextResponse.next()
  }

  // IPアドレスを取得(X-Forwarded-Forヘッダーまたはリクエストのipを使用)
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anonymous"

  try {
    // レート制限チェック（Redisまたはフォールバック）
    let result: {
      success: boolean
      limit: number
      remaining: number
      reset: number
    }

    if (ratelimit) {
      result = await ratelimit.limit(ip)
    } else if (fallbackRateLimit) {
      result = await fallbackRateLimit.limit(ip)
    } else {
      // Both are null, should not happen due to early return
      return NextResponse.next()
    }

    const { success, limit, remaining, reset } = result

    // レスポンスヘッダーに制限情報を追加
    const response = success
      ? NextResponse.next()
      : NextResponse.json(
          {
            error: "Too Many Requests",
            message:
              "レート制限を超過しました。しばらく時間をおいて再度お試しください。",
          },
          { status: 429 },
        )

    response.headers.set("X-RateLimit-Limit", limit.toString())
    response.headers.set("X-RateLimit-Remaining", remaining.toString())
    response.headers.set("X-RateLimit-Reset", reset.toString())

    return response
  } catch (error) {
    // レートリミットチェック中にエラーが発生した場合、フォールバックを試みる
    console.error("[Middleware] Rate limit check failed:", error)

    if (fallbackRateLimit) {
      console.warn(
        "[Middleware] Using fallback rate limiting due to Redis error",
      )
      try {
        const { success, limit, remaining, reset } =
          await fallbackRateLimit.limit(ip)

        const response = success
          ? NextResponse.next()
          : NextResponse.json(
              {
                error: "Too Many Requests",
                message:
                  "レート制限を超過しました。しばらく時間をおいて再度お試しください。",
              },
              { status: 429 },
            )

        response.headers.set("X-RateLimit-Limit", limit.toString())
        response.headers.set("X-RateLimit-Remaining", remaining.toString())
        response.headers.set("X-RateLimit-Reset", reset.toString())

        return response
      } catch (fallbackError) {
        console.error(
          "[Middleware] Fallback rate limit also failed:",
          fallbackError,
        )
        // フォールバックも失敗した場合はリクエストを通す
        return NextResponse.next()
      }
    }

    // フォールバックがない場合はリクエストを通す
    return NextResponse.next()
  }
}

// Middlewareを適用するパスを設定
export const config = {
  matcher: [
    /*
     * 以下のパスを除くすべてのパスにマッチ:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
