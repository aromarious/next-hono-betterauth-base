import { hc } from "hono/client"
import type { AppType } from "@/server"

// Assuming API is mounted at /api within the same domain (Next.js config)
const baseUrl =
  typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:3000"

export const client = hc<AppType>(baseUrl)
