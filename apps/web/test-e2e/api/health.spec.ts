import { expect, test } from "@playwright/test"

test.describe("Health API E2E", () => {
  test("GET /api/v0/health returns correct response", async ({ request }) => {
    const response = await request.get("/api/v0/public/health")

    expect(response.status()).toBe(200)
    expect(response.headers()["content-type"]).toContain("application/json")

    const data = await response.json()
    expect(data).toHaveProperty("status", "ok")
  })
})
