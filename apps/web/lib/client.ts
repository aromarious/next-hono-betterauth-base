import { hc } from "hono/client"
import type { ApiV0Type, AppType } from "@/server"
import { type ApiVersion, LATEST_API_VERSION } from "./api-versions"

// Assuming API is mounted at /api within the same domain (Next.js config)
const baseUrl =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000"

export const client = hc<AppType>(baseUrl)

export const createClient = (version: ApiVersion = LATEST_API_VERSION) => {
  return hc<ApiV0Type>(`${baseUrl}/api/${version}`)
}
