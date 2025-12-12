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
    it("投稿を作成し、取得、更新、削除できるべき", async () => {
      // 1. Create a post
      const createPayload = {
        title: "Integration Title",
        content: "Content via API",
      }
      const createRes = await app.request("/api/v0/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createPayload),
      })
      expect(createRes.status).toBe(201)
      const created = await createRes.json()
      expect(created.title).toBe(createPayload.title)
      expect(created.id).toBeDefined()

      // 2. Retrieve all posts
      const listRes = await app.request("/api/v0/posts")
      expect(listRes.status).toBe(200)
      const list = await listRes.json()
      expect(list).toHaveLength(1)
      // biome-ignore lint/style/noNonNullAssertion: Guaranteed by length check
      expect(list[0]!.id).toBe(created.id)

      // 3. Retrieve single post
      const getRes = await app.request(`/api/v0/posts/${created.id}`)
      expect(getRes.status).toBe(200)
      const single = await getRes.json()
      expect(single.id).toBe(created.id)
      expect(single.title).toBe(createPayload.title)
      expect(single.content).toBe(createPayload.content)

      // 4. Update a post
      const updatePayload = {
        title: "Updated Title",
        content: "Updated Content via API",
      }
      const updateRes = await app.request(`/api/v0/posts/${created.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      })
      expect(updateRes.status).toBe(200)
      const updated = await updateRes.json()
      expect(updated.id).toBe(created.id)
      expect(updated.title).toBe(updatePayload.title)
      expect(updated.content).toBe(updatePayload.content)

      // Verify the update by retrieving again
      const getUpdatedRes = await app.request(`/api/v0/posts/${created.id}`)
      expect(getUpdatedRes.status).toBe(200)
      const verifiedUpdated = await getUpdatedRes.json()
      expect(verifiedUpdated.title).toBe(updatePayload.title)
      expect(verifiedUpdated.content).toBe(updatePayload.content)

      // 5. Delete a post
      const deleteRes = await app.request(`/api/v0/posts/${created.id}`, {
        method: "DELETE",
      })
      expect(deleteRes.status).toBe(204)

      // Verify deletion by attempting to retrieve
      const getDeletedRes = await app.request(`/api/v0/posts/${created.id}`)
      expect(getDeletedRes.status).toBe(404)

      // Verify list is empty
      const listAfterDeleteRes = await app.request("/api/v0/posts")
      expect(listAfterDeleteRes.status).toBe(200)
      const listAfterDelete = await listAfterDeleteRes.json()
      expect(listAfterDelete).toHaveLength(0)
    })

    it("存在しない投稿に対して 404 を返すべき", async () => {
      const res = await app.request("/api/v0/posts/non-existent-id")
      expect(res.status).toBe(404)
    })
  })
})
