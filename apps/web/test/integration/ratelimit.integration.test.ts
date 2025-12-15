import { beforeEach, describe, expect, it } from "vitest"
import { InMemoryRateLimit } from "@/lib/in-memory-ratelimit"

/**
 * レートリミット統合テスト
 *
 * このテストでは、InMemoryRateLimitを使用してレートリミット機能の統合動作を確認します。
 * 実際のミドルウェアは環境変数の初期化タイミングの問題でテストが困難なため、
 * レートリミットのコアロジックを直接テストします。
 */
describe("Rate Limit Integration Test", () => {
  let limiter: InMemoryRateLimit

  beforeEach(() => {
    // テスト用のレートリミッターを作成（3リクエスト/分）
    limiter = new InMemoryRateLimit(3, 60000)
  })

  describe("レートリミット基本動作", () => {
    it("複数のIPからの同時リクエストを正しく処理できる", async () => {
      const ip1 = "192.168.1.1"
      const ip2 = "192.168.1.2"

      // IP1から2回
      const result1 = await limiter.limit(ip1)
      const result2 = await limiter.limit(ip1)

      // IP2から2回
      const result3 = await limiter.limit(ip2)
      const result4 = await limiter.limit(ip2)

      // それぞれのIPで独立してカウント
      expect(result1.success).toBe(true)
      expect(result1.remaining).toBe(2)
      expect(result2.success).toBe(true)
      expect(result2.remaining).toBe(1)

      expect(result3.success).toBe(true)
      expect(result3.remaining).toBe(2)
      expect(result4.success).toBe(true)
      expect(result4.remaining).toBe(1)
    })

    it("1つのIPが制限を超えても他のIPには影響しない", async () => {
      const ip1 = "192.168.1.10"
      const ip2 = "192.168.1.11"

      // IP1で制限を超過
      await limiter.limit(ip1) // 1st
      await limiter.limit(ip1) // 2nd
      await limiter.limit(ip1) // 3rd
      const result1 = await limiter.limit(ip1) // 4th (over)

      // IP2は制限されていない
      const result2 = await limiter.limit(ip2)

      expect(result1.success).toBe(false)
      expect(result2.success).toBe(true)
      expect(result2.remaining).toBe(2)
    })

    it("連続した大量のリクエストを正しく処理できる", async () => {
      const ip = "192.168.1.20"
      const results = []

      for (let i = 0; i < 10; i++) {
        results.push(await limiter.limit(ip))
      }

      // 最初の3回は成功
      expect(results[0]?.success).toBe(true)
      expect(results[1]?.success).toBe(true)
      expect(results[2]?.success).toBe(true)

      // 4回目以降は失敗
      expect(results[3]?.success).toBe(false)
      expect(results[4]?.success).toBe(false)
      expect(results[9]?.success).toBe(false)

      // 失敗時も残り回数は0
      expect(results[3]?.remaining).toBe(0)
      expect(results[9]?.remaining).toBe(0)
    })
  })

  describe("レスポンス情報の検証", () => {
    it("limit値は常に設定値と一致する", async () => {
      const results = []
      for (let i = 0; i < 5; i++) {
        results.push(await limiter.limit("test-ip"))
      }

      // 成功・失敗に関わらずlimitは3
      for (const result of results) {
        expect(result.limit).toBe(3)
      }
    })

    it("remaining値は正しくデクリメントされる", async () => {
      const ip = "192.168.1.30"

      const r1 = await limiter.limit(ip)
      expect(r1.remaining).toBe(2) // 3 - 1 = 2

      const r2 = await limiter.limit(ip)
      expect(r2.remaining).toBe(1) // 3 - 2 = 1

      const r3 = await limiter.limit(ip)
      expect(r3.remaining).toBe(0) // 3 - 3 = 0

      const r4 = await limiter.limit(ip)
      expect(r4.remaining).toBe(0) // 制限超過後も0
    })

    it("reset値は最初のリクエストから一定期間後を示す", async () => {
      const ip = "192.168.1.40"
      const now = Date.now()

      const r1 = await limiter.limit(ip)
      const r2 = await limiter.limit(ip)
      const r3 = await limiter.limit(ip)

      // 全て同じresetタイムスタンプ（同一ウィンドウ内）
      expect(r1.reset).toBe(r2.reset)
      expect(r2.reset).toBe(r3.reset)

      // resetは現在時刻 + 60秒
      expect(r1.reset).toBeGreaterThanOrEqual(now + 60000)
      expect(r1.reset).toBeLessThanOrEqual(now + 61000) // 1秒のマージン
    })
  })

  describe("実践的なシナリオ", () => {
    it("正常なユーザーの典型的なアクセスパターン", async () => {
      // ユーザーが1分間に2回APIをコール（制限内）
      const user = "user-a"

      const r1 = await limiter.limit(user)
      expect(r1.success).toBe(true)
      expect(r1.remaining).toBe(2)

      // 少し待ってから2回目
      const r2 = await limiter.limit(user)
      expect(r2.success).toBe(true)
      expect(r2.remaining).toBe(1)

      // まだ制限内
      expect(r2.success).toBe(true)
    })

    it("攻撃的なアクセスパターン（DDoS的な連続リクエスト）", async () => {
      const attacker = "attacker-ip"
      const results = []

      // 短時間に20回リクエスト
      for (let i = 0; i < 20; i++) {
        results.push(await limiter.limit(attacker))
      }

      // 最初の3回のみ成功
      const successCount = results.filter((r) => r.success).length
      const failCount = results.filter((r) => !r.success).length

      expect(successCount).toBe(3)
      expect(failCount).toBe(17)
    })

    it("バースト的なトラフィック（複数IPからの同時リクエスト）", async () => {
      const ips = [
        "192.168.1.100",
        "192.168.1.101",
        "192.168.1.102",
        "192.168.1.103",
        "192.168.1.104",
      ]

      // 各IPから2回ずつリクエスト
      const results = await Promise.all(
        ips.flatMap((ip) => [limiter.limit(ip), limiter.limit(ip)]),
      )

      // 全て成功するはず（各IPで2回は制限内）
      expect(results.every((r) => r.success)).toBe(true)
    })
  })

  describe("エッジケースとエラーハンドリング", () => {
    it("空文字列のIPでも動作する", async () => {
      const result = await limiter.limit("")
      expect(result.success).toBe(true)
      expect(result.limit).toBe(3)
    })

    it("特殊文字を含むIPでも動作する", async () => {
      const result = await limiter.limit("::1") // IPv6ローカルホスト
      expect(result.success).toBe(true)
      expect(result.limit).toBe(3)
    })

    it("非常に長いidentifierでも動作する", async () => {
      const longId = "a".repeat(1000)
      const result = await limiter.limit(longId)
      expect(result.success).toBe(true)
      expect(result.limit).toBe(3)
    })

    it("Unicode文字を含むidentifierでも動作する", async () => {
      const result = await limiter.limit("ユーザー-123")
      expect(result.success).toBe(true)
      expect(result.limit).toBe(3)
    })
  })
})
