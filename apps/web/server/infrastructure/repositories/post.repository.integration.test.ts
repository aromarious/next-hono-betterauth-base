import { db, PostTable, sql, UserTable } from "@packages/db"
import { afterAll, beforeEach, describe, expect, it } from "vitest"
import { Post } from "../../domain/post.entity"
import { PostRepositoryImpl } from "./post.repository.drizzle"

describe("PostRepositoryImpl (Integration)", () => {
  const repository = new PostRepositoryImpl(db)
  const testUserId = "user-123"
  const otherUserId = "user-456"

  beforeEach(async () => {
    await db.execute(sql`TRUNCATE TABLE ${PostTable} CASCADE`)
    await db.execute(sql`TRUNCATE TABLE ${UserTable} CASCADE`)

    //テストユーザーを作成
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

  afterAll(async () => {
    // Cleanup if necessary, though beforeEach handles truncating
  })

  describe("save", () => {
    it("新規投稿を保存できること", async () => {
      const newPost = Post.create(testUserId, {
        content: "Integration Content",
      })

      const saved = await repository.save(newPost)

      expect(saved.id).toBeDefined()
      expect(saved.userId).toBe(testUserId)
      expect(saved.content).toBe(newPost.content)
      expect(saved.createdAt).toBeInstanceOf(Date)
      expect(saved.updatedAt).toBeInstanceOf(Date)
      expect(saved.isPersisted()).toBe(true)

      // Verify in DB
      const inDb = await db.select().from(PostTable)
      expect(inDb).toHaveLength(1)
      expect(inDb[0]!.id).toBe(saved.id)
      expect(inDb[0]!.userId).toBe(testUserId)
    })

    it("userIdなしで保存しようとするとエラーを投げること", async () => {
      const post = Post.reconstruct({
        id: "test-id",
        userId: "",
        content: "Test",
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await expect(repository.save(post)).rejects.toThrow()
    })
  })

  describe("findById", () => {
    it("存在しない場合 null を返すこと", async () => {
      const result = await repository.findById("non-existent")
      expect(result).toBeNull()
    })

    it("存在する場合その投稿を返すこと", async () => {
      const post = Post.create(testUserId, { content: "Find Me" })
      const saved = await repository.save(post)

      const found = await repository.findById(saved.id!)
      expect(found).not.toBeNull()
      expect(found!.id).toBe(saved.id)
      expect(found!.userId).toBe(testUserId)
      expect(found!.content).toBe("Find Me")
    })
  })

  describe("findAll", () => {
    it("全ての投稿を返すこと", async () => {
      await repository.save(Post.create(testUserId, { content: "c1" }))
      await repository.save(Post.create(otherUserId, { content: "c2" }))

      const results = await repository.findAll()
      expect(results).toHaveLength(2)
    })
  })

  describe("findByUserId", () => {
    it("指定したユーザーの投稿のみを時系列降順で返すこと", async () => {
      // testUserIdの投稿を3つ作成
      const post1 = await repository.save(
        Post.create(testUserId, { content: "First" }),
      )
      await new Promise((resolve) => setTimeout(resolve, 10))
      const post2 = await repository.save(
        Post.create(testUserId, { content: "Second" }),
      )
      await new Promise((resolve) => setTimeout(resolve, 10))
      const post3 = await repository.save(
        Post.create(testUserId, { content: "Third" }),
      )

      // 他のユーザーの投稿
      await repository.save(Post.create(otherUserId, { content: "Other" }))

      const results = await repository.findByUserId(testUserId)

      expect(results).toHaveLength(3)
      // 新しい順（降順）
      expect(results[0]!.id).toBe(post3.id)
      expect(results[1]!.id).toBe(post2.id)
      expect(results[2]!.id).toBe(post1.id)
    })

    it("投稿がない場合は空配列を返すこと", async () => {
      const results = await repository.findByUserId("no-posts-user")
      expect(results).toHaveLength(0)
    })
  })

  describe("delete", () => {
    it("投稿を削除し、削除された投稿を返すこと", async () => {
      const post = Post.create(testUserId, { content: "Delete Me" })
      const saved = await repository.save(post)

      const deleted = await repository.delete(saved.id!)
      expect(deleted).not.toBeNull()
      expect(deleted!.id).toBe(saved.id)

      // Verify DB
      const inDb = await db.select().from(PostTable)
      expect(inDb).toHaveLength(0)
    })

    it("削除対象の投稿が存在しない場合 null を返すこと", async () => {
      const result = await repository.delete("non-existent")
      expect(result).toBeNull()
    })
  })
})
