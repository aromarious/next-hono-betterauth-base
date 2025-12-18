import { expect, test } from "@playwright/test"

test.describe("Smoke Tests", () => {
  test("homepage loads successfully", async ({ page }) => {
    await page.goto("/")

    // ページが正常に読み込まれることを確認
    await expect(page).toHaveTitle(/Webservice/)
  })

  test("health check endpoint returns 200", async ({ request }) => {
    const response = await request.get("/api/v0/public/health")

    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data).toHaveProperty("status", "ok")
  })
})
