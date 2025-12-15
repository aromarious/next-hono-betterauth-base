interface RateLimitRecord {
  count: number
  resetAt: number
}

export class InMemoryRateLimit {
  private records: Map<string, RateLimitRecord>
  private maxRequests: number
  private windowMs: number

  constructor(maxRequests: number, windowMs: number) {
    this.records = new Map()
    this.maxRequests = maxRequests
    this.windowMs = windowMs
    // 5分ごとに古いレコードをクリーンアップ
    setInterval(() => this.cleanup(), 5 * 60 * 1000)
  }

  async limit(identifier: string): Promise<{
    success: boolean
    limit: number
    remaining: number
    reset: number
  }> {
    const now = Date.now()
    const record = this.records.get(identifier)

    if (!record || now >= record.resetAt) {
      // 新しいウィンドウを開始
      this.records.set(identifier, {
        count: 1,
        resetAt: now + this.windowMs,
      })
      return {
        success: true,
        limit: this.maxRequests,
        remaining: this.maxRequests - 1,
        reset: now + this.windowMs,
      }
    }

    // 既存のウィンドウ内
    record.count++
    const success = record.count <= this.maxRequests
    const remaining = Math.max(0, this.maxRequests - record.count)

    return {
      success,
      limit: this.maxRequests,
      remaining,
      reset: record.resetAt,
    }
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, record] of this.records.entries()) {
      if (now >= record.resetAt) {
        this.records.delete(key)
      }
    }
  }
}

// ウィンドウ文字列をミリ秒に変換
export function parseWindow(window: string): number {
  const match = window.match(/^(\d+)\s*(ms|s|m|h|d)$/)
  if (!match) return 60_000 // デフォルト1分

  const value = match[1]
  const unit = match[2]
  if (!(value && unit)) return 60_000

  const num = Number.parseInt(value, 10)

  switch (unit) {
    case "ms":
      return num
    case "s":
      return num * 1000
    case "m":
      return num * 60 * 1000
    case "h":
      return num * 60 * 60 * 1000
    case "d":
      return num * 24 * 60 * 60 * 1000
    default:
      return 60_000
  }
}
