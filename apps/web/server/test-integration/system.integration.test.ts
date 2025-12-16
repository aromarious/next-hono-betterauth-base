import { describe, expect, it } from "vitest"
import app from "@/server/index"

describe("System API Integration Test", () => {
  describe("GET /api/health", () => {
    it("200 OK を返すべき (v0)", async () => {
      const res = await app.request("/api/v0/health")
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
