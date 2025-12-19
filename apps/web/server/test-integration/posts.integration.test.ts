import { db, PostTable, sql, UserTable } from "@packages/db"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { createClient } from "@/lib/client"
import app from "@/server/index"

const testUserId = "test-user"
const otherUserId = "other-user"

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
    await db.execute(sql`TRUNCATE TABLE ${UserTable} CASCADE`)

    // テストユーザーを作成
    await db.insert(UserTable).values([
      {
        id: testUserId,
        name: "Test User",
        email: "test@example.com",
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: otherUserId,
        name: "Other User",
        email: "other@example.com",
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])
  })

  const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    return app.request(input.toString(), init)
  }

  const { protectedClient } = createClient({
    fetch: customFetch,
  })

  describe("Post API", () => {
    it("投稿を作成し、取得、削除できるべき", async () => {
      // 1. Create a post
      const createPayload = {
        content: "Content via API",
      }
      const createRes = await protectedClient.posts.$post({
        json: createPayload,
      })
      expect(createRes.status).toBe(201)
      const created = (await createRes.json()) as any
      expect(created.content).toBe(createPayload.content)
      expect(created.userId).toBe(testUserId)
      expect(created.id).toBeDefined()

      // 2. Retrieve all posts (should return user's own posts only)
      const listRes = await protectedClient.posts.$get()
      expect(listRes.status).toBe(200)
      const list = await listRes.json()
      expect(list).toHaveLength(1)
      expect(list[0]!.id).toBe(created.id)

      // 3. Delete a post
      const deleteRes = await protectedClient.posts[":id"].$delete({
        param: { id: created.id },
      })
      expect(deleteRes.status).toBe(204)

      // Verify list is empty
      const listAfterDeleteRes = await protectedClient.posts.$get()
      expect(listAfterDeleteRes.status).toBe(200)
      const listAfterDelete = await listAfterDeleteRes.json()
      expect(listAfterDelete).toHaveLength(0)
    })

    it("280文字を超える投稿を作成しようとすると400エラーを返すべき", async () => {
      const createPayload = {
        content: "a".repeat(281),
      }
      const createRes = await protectedClient.posts.$post({
        json: createPayload,
      })
      expect(createRes.status).toBe(400)
    })

    it("他のユーザーの投稿は表示されないべき", async () => {
      // 他のユーザーの投稿を直接DBに追加
      await db.insert(PostTable).values({
        userId: otherUserId,
        content: "Other user's post",
      })

      // 自分の投稿一覧を取得
      const listRes = await protectedClient.posts.$get()
      expect(listRes.status).toBe(200)
      const list = await listRes.json()
      expect(list).toHaveLength(0) // 他のユーザーの投稿は見えない
    })

    it("他のユーザーの投稿を削除しようとすると403エラーを返すべき", async () => {
      // 他のユーザーの投稿を直接DBに追加
      const [otherPost] = await db
        .insert(PostTable)
        .values({
          userId: otherUserId,
          content: "Other user's post",
        })
        .returning()

      // 削除を試みる
      const deleteRes = await protectedClient.posts[":id"].$delete({
        param: { id: otherPost!.id },
      })
      expect(deleteRes.status).toBe(403)

      // 投稿がまだ存在することを確認
      const inDb = await db.select().from(PostTable)
      expect(inDb).toHaveLength(1)
    })

    it("存在しない投稿を削除しようとすると404を返すべき", async () => {
      const res = await protectedClient.posts[":id"].$delete({
        param: { id: "non-existent-id" },
      })
      expect(res.status).toBe(404)
    })
  })
})
