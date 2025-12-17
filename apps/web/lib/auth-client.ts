import { createAuthClient } from "better-auth/react"
import { baseUrl } from "@/lib/baseUrl"

export const authClient = createAuthClient({
  baseURL: baseUrl,
})
