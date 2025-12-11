import { sql } from "drizzle-orm"
import { beforeEach, describe, expect, it } from "vitest"
import app from "@/server/index"
import { db } from "@/server/infrastructure/db/client"
import { PostTable } from "@/server/infrastructure/db/schema"

describe("Posts API Integration Test", () => {
  beforeEach(async () => {
    // データがあれば全削除してクリーンな状態にする
    await db.execute(sql`TRUNCATE TABLE ${PostTable} CASCADE`)
  })

  describe("Post API", () => {
    it("投稿を作成し、それを取得できるべき", async () => {
      // 1. Create a post
      const createPayload = {
        title: "Integration Title",
        content: "Content via API",
      }
      const createRes = await app.request("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createPayload),
      })
      expect(createRes.status).toBe(201)
      const created = await createRes.json()
      expect(created.title).toBe(createPayload.title)
      expect(created.id).toBeDefined()

      // 2. Retrieve all posts
      const listRes = await app.request("/api/posts")
      expect(listRes.status).toBe(200)
      const list = await listRes.json()
      expect(list).toHaveLength(1)
      // biome-ignore lint/style/noNonNullAssertion: Guaranteed by length check
      expect(list[0]!.id).toBe(created.id)

      // 3. Retrieve single post
      const getRes = await app.request(`/api/posts/${created.id}`)
      expect(getRes.status).toBe(200)
      const single = await getRes.json()
      expect(single.id).toBe(created.id)
    })

    it("存在しない投稿に対して 404 を返すべき", async () => {
      const res = await app.request("/api/posts/non-existent-id")
      expect(res.status).toBe(404)
    })
  })
})
