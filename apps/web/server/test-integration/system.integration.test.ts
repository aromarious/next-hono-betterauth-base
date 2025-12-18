import { describe, expect, it } from "vitest"
import { createClient } from "@/lib/client"
import app from "@/server/index"

describe("System API Integration Test", () => {
  const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    return app.request(input.toString(), init)
  }

  const { publicClient } = createClient({
    fetch: customFetch,
  })

  describe("GET /api/health", () => {
    it("200 OK を返すべき (v0)", async () => {
      const res = await publicClient.health.$get()
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toEqual({ status: "ok" })
    })

    it("200 OK を返すべき (global)", async () => {
      const res = await app.request("/api/health")
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toEqual({ status: "ok" })
    })
  })
})
