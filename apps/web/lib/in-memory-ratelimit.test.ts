import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { InMemoryRateLimit, parseWindow } from "./in-memory-ratelimit"

describe("InMemoryRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("基本機能", () => {
    it("初回リクエストは成功する", async () => {
      const limiter = new InMemoryRateLimit(3, 60000) // 3 requests per minute
      const result = await limiter.limit("test-ip")

      expect(result.success).toBe(true)
      expect(result.limit).toBe(3)
      expect(result.remaining).toBe(2)
    })

    it("制限内では連続リクエストが成功する", async () => {
      const limiter = new InMemoryRateLimit(3, 60000)

      await limiter.limit("test-ip") // 1st
      await limiter.limit("test-ip") // 2nd
      const result = await limiter.limit("test-ip") // 3rd

      expect(result.success).toBe(true)
      expect(result.remaining).toBe(0)
    })

    it("制限を超えたリクエストは失敗する", async () => {
      const limiter = new InMemoryRateLimit(2, 60000)

      await limiter.limit("test-ip") // 1st
      await limiter.limit("test-ip") // 2nd
      const result = await limiter.limit("test-ip") // 3rd (over limit)

      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it("制限超過後も残りカウントは0のまま", async () => {
      const limiter = new InMemoryRateLimit(2, 60000)

      await limiter.limit("test-ip") // 1st
      await limiter.limit("test-ip") // 2nd
      const result1 = await limiter.limit("test-ip") // 3rd
      const result2 = await limiter.limit("test-ip") // 4th

      expect(result1.success).toBe(false)
      expect(result1.remaining).toBe(0)
      expect(result2.success).toBe(false)
      expect(result2.remaining).toBe(0)
    })
  })

  describe("ウィンドウリセット", () => {
    it("ウィンドウ期間後はカウントがリセットされる", async () => {
      const limiter = new InMemoryRateLimit(2, 1000) // 2 requests per second

      await limiter.limit("test-ip") // 1st
      await limiter.limit("test-ip") // 2nd

      // 1秒経過
      vi.advanceTimersByTime(1000)

      const result = await limiter.limit("test-ip") // 新しいウィンドウ
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(1)
    })

    it("ウィンドウ期間経過前はカウントが継続される", async () => {
      const limiter = new InMemoryRateLimit(2, 1000)

      await limiter.limit("test-ip") // 1st

      // 500ms経過（ウィンドウ内）
      vi.advanceTimersByTime(500)

      await limiter.limit("test-ip") // 2nd
      const result = await limiter.limit("test-ip") // 3rd (over limit)

      expect(result.success).toBe(false)
    })

    it("resetAtは正しいタイムスタンプを返す", async () => {
      const limiter = new InMemoryRateLimit(3, 60000)
      const now = Date.now()

      const result = await limiter.limit("test-ip")

      expect(result.reset).toBe(now + 60000)
    })
  })

  describe("IP独立性", () => {
    it("異なるIPは独立してカウントされる", async () => {
      const limiter = new InMemoryRateLimit(1, 60000)

      await limiter.limit("ip-1")
      const result1 = await limiter.limit("ip-1") // over limit for ip-1
      const result2 = await limiter.limit("ip-2") // different IP

      expect(result1.success).toBe(false)
      expect(result2.success).toBe(true)
    })

    it("複数のIPを同時に追跡できる", async () => {
      const limiter = new InMemoryRateLimit(2, 60000)

      await limiter.limit("ip-1") // ip-1: 1st
      await limiter.limit("ip-2") // ip-2: 1st
      await limiter.limit("ip-1") // ip-1: 2nd
      const result1 = await limiter.limit("ip-1") // ip-1: 3rd (over)
      const result2 = await limiter.limit("ip-2") // ip-2: 2nd

      expect(result1.success).toBe(false)
      expect(result2.success).toBe(true)
    })
  })

  describe("エッジケース", () => {
    it("maxRequests=1の場合、2回目のリクエストは失敗する", async () => {
      const limiter = new InMemoryRateLimit(1, 60000)

      const result1 = await limiter.limit("test-ip")
      const result2 = await limiter.limit("test-ip")

      expect(result1.success).toBe(true)
      expect(result1.remaining).toBe(0)
      expect(result2.success).toBe(false)
    })

    it("空文字列のidentifierでも動作する", async () => {
      const limiter = new InMemoryRateLimit(2, 60000)

      const result1 = await limiter.limit("")
      const result2 = await limiter.limit("")

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
    })
  })
})

describe("parseWindow", () => {
  it("ミリ秒を正しくパースする", () => {
    expect(parseWindow("500 ms")).toBe(500)
    expect(parseWindow("1000 ms")).toBe(1000)
  })

  it("秒を正しくパースする", () => {
    expect(parseWindow("1 s")).toBe(1000)
    expect(parseWindow("30 s")).toBe(30000)
    expect(parseWindow("60 s")).toBe(60000)
  })

  it("分を正しくパースする", () => {
    expect(parseWindow("1 m")).toBe(60000)
    expect(parseWindow("5 m")).toBe(300000)
    expect(parseWindow("60 m")).toBe(3600000)
  })

  it("時間を正しくパースする", () => {
    expect(parseWindow("1 h")).toBe(3600000)
    expect(parseWindow("24 h")).toBe(86400000)
  })

  it("日を正しくパースする", () => {
    expect(parseWindow("1 d")).toBe(86400000)
    expect(parseWindow("7 d")).toBe(604800000)
  })

  it("不正な形式はデフォルト値（60000ms）を返す", () => {
    expect(parseWindow("invalid")).toBe(60000)
    expect(parseWindow("")).toBe(60000)
    expect(parseWindow("abc def")).toBe(60000)
  })

  it("数値のみの入力はデフォルト値を返す", () => {
    expect(parseWindow("100")).toBe(60000)
  })

  it("単位のみの入力はデフォルト値を返す", () => {
    expect(parseWindow("ms")).toBe(60000)
    expect(parseWindow("s")).toBe(60000)
  })

  it("スペースなしの形式も正しくパースする", () => {
    expect(parseWindow("1m")).toBe(60000)
    expect(parseWindow("30s")).toBe(30000)
  })

  it("複数スペースがあっても正しくパースする", () => {
    expect(parseWindow("1  m")).toBe(60000)
    expect(parseWindow("30   s")).toBe(30000)
  })
})
