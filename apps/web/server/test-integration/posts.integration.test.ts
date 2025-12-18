import { db, PostTable, sql } from "@packages/db"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createClient } from "@/lib/client"
import app from "@/server/index"

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue({
        user: { id: "test-user" },
        session: { id: "test-session" },
      }),
    },
    $Infer: {
      Session: {
        user: {},
        session: {},
      },
    },
  },
}))

describe("Posts API Integration Test", () => {
  beforeEach(async () => {
    // データがあれば全削除してクリーンな状態にする
    await db.execute(sql`TRUNCATE TABLE ${PostTable} CASCADE`)
  })

  const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    return app.request(input.toString(), init)
  }

  const { protectedClient } = createClient({
    fetch: customFetch,
  })

  describe("Post API", () => {
    it("投稿を作成し、取得、更新、削除できるべき", async () => {
      // 1. Create a post
      const createPayload = {
        title: "Integration Title",
        content: "Content via API",
      }
      const createRes = await protectedClient.posts.$post({
        json: createPayload,
      })
      expect(createRes.status).toBe(201)
      const created = (await createRes.json()) as any
      expect(created.title).toBe(createPayload.title)
      expect(created.id).toBeDefined()

      // 2. Retrieve all posts
      const listRes = await protectedClient.posts.$get()
      expect(listRes.status).toBe(200)
      const list = await listRes.json()
      expect(list).toHaveLength(1)
      expect(list[0]!.id).toBe(created.id)

      // 3. Retrieve single post
      const getRes = await protectedClient.posts[":id"].$get({
        param: { id: created.id },
      })
      expect(getRes.status).toBe(200)
      const single = (await getRes.json()) as any
      expect(single.id).toBe(created.id)
      expect(single.title).toBe(createPayload.title)
      expect(single.content).toBe(createPayload.content)

      // 4. Update a post
      const updatePayload = {
        title: "Updated Title",
        content: "Updated Content via API",
      }
      const updateRes = await protectedClient.posts[":id"].$put({
        param: { id: created.id },
        json: updatePayload,
      })
      expect(updateRes.status).toBe(200)
      const updated = (await updateRes.json()) as any
      expect(updated.id).toBe(created.id)
      expect(updated.title).toBe(updatePayload.title)
      expect(updated.content).toBe(updatePayload.content)

      // Verify the update by retrieving again
      const getUpdatedRes = await protectedClient.posts[":id"].$get({
        param: { id: created.id },
      })
      expect(getUpdatedRes.status).toBe(200)
      const verifiedUpdated = (await getUpdatedRes.json()) as any
      expect(verifiedUpdated.title).toBe(updatePayload.title)
      expect(verifiedUpdated.content).toBe(updatePayload.content)

      // 5. Delete a post
      const deleteRes = await protectedClient.posts[":id"].$delete({
        param: { id: created.id },
      })
      expect(deleteRes.status).toBe(204)

      // Verify deletion by attempting to retrieve
      const getDeletedRes = await protectedClient.posts[":id"].$get({
        param: { id: created.id },
      })
      expect(getDeletedRes.status).toBe(404)

      // Verify list is empty
      const listAfterDeleteRes = await protectedClient.posts.$get()
      expect(listAfterDeleteRes.status).toBe(200)
      const listAfterDelete = await listAfterDeleteRes.json()
      expect(listAfterDelete).toHaveLength(0)
    })

    it("存在しない投稿に対して 404 を返すべき", async () => {
      const res = await protectedClient.posts[":id"].$get({
        param: { id: "non-existent-id" },
      })
      expect(res.status).toBe(404)
    })
  })
})
