import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

export async function middleware(request: NextRequest) {
  // 1. API Authentication Check
  if (request.nextUrl.pathname.startsWith("/api")) {
    if (request.nextUrl.pathname.match(/^\/api\/v\d+\/protected/)) {
      const sessionCookie = request.cookies.get("better-auth.session_token")
      if (!sessionCookie) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }
  } else {
    // 2. Page Authentication Check (Default Protected)
    const path = request.nextUrl.pathname
    // Public paths: root and anything under /auth/
    const isPublic = path === "/" || path.startsWith("/auth/")

    if (!isPublic) {
      const sessionCookie = request.cookies.get("better-auth.session_token")
      if (!sessionCookie) {
        const url = request.nextUrl.clone()
        url.pathname = "/auth/sign-in"
        url.searchParams.set("callbackUrl", path)
        return NextResponse.redirect(url)
      }
    }
  }

  const ip = getClientIp(request)
  const result = await checkRateLimit(ip)

  if (!result.success) {
    return NextResponse.json(
      {
        error: "Too Many Requests",
        message: "Rate limit exceeded. Please try again later.",
      },
      { status: 429 },
    )
  }

  const response = NextResponse.next()
  response.headers.set("X-RateLimit-Limit", result.limit.toString())
  response.headers.set("X-RateLimit-Remaining", result.remaining.toString())
  response.headers.set("X-RateLimit-Reset", result.reset.toString())

  return response
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anonymous"
  )
}
