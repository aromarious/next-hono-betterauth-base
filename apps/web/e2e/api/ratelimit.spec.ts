import { expect, test } from "@playwright/test"

test.describe("Rate Limiting E2E", () => {
  test("returns 429 after exceeding rate limit", async ({ request }) => {
    // 共有Redis環境でのテスト干渉を避けるため、ランダムなIPアドレスを使用
    const randomIp = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
    // Note: このテストはレートリミットが有効な環境でのみ実行されます
    if (process.env.DISABLE_RATE_LIMIT === "true") {
      test.skip(true, "Rate limit is disabled in this environment")
    }

    const responses = []
    const maxRequests = 11 // レートリミット（10リクエスト/分）+ 1

    // 連続でリクエストを送信
    for (let i = 0; i < maxRequests; i++) {
      const response = await request.get("/api/v0/posts", {
        headers: {
          "X-Forwarded-For": randomIp,
        },
      })
      responses.push({
        status: response.status(),
        headers: {
          limit: response.headers()["x-ratelimit-limit"],
          remaining: response.headers()["x-ratelimit-remaining"],
          reset: response.headers()["x-ratelimit-reset"],
        },
      })
    }

    // 最初の10リクエストは成功
    for (let i = 0; i < 10; i++) {
      expect(responses[i]?.status).toBe(200)
      expect(responses[i]?.headers.limit).toBeDefined()
      expect(responses[i]?.headers.remaining).toBeDefined()
    }

    // 11回目はレートリミット超過で429
    expect(responses[10]?.status).toBe(429)
    expect(responses[10]?.headers.limit).toBeDefined()
    expect(responses[10]?.headers.remaining).toBe("0")
  })

  test("health endpoint is excluded from rate limiting", async ({
    request,
  }) => {
    // ヘルスチェックエンドポイント(/api/health)はレートリミット対象外
    // レートリミットが有効でも、何度でもアクセス可能

    const responses = []
    for (let i = 0; i < 15; i++) {
      const response = await request.get("/api/health")
      responses.push(response.status())
    }

    // 全て200が返る（レートリミットされない）
    for (const status of responses) {
      expect(status).toBe(200)
    }
  })
})
