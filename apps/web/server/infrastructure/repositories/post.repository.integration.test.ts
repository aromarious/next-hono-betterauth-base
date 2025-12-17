import { db, PostTable, sql } from "@packages/db"
import { afterAll, beforeEach, describe, expect, it } from "vitest"
import { Post } from "../../domain/post.entity"
import { PostRepositoryImpl } from "./post.repository.drizzle"

describe("PostRepositoryImpl (Integration)", () => {
  const repository = new PostRepositoryImpl(db)

  beforeEach(async () => {
    await db.execute(sql`TRUNCATE TABLE ${PostTable} CASCADE`)
  })

  afterAll(async () => {
    // Cleanup if necessary, though beforeEach handles truncating
  })

  describe("save", () => {
    it("新規投稿を保存できること", async () => {
      const newPost = Post.create({
        title: "Integration Test Title",
        content: "Integration Content",
      })

      const saved = await repository.save(newPost)

      expect(saved.id).toBeDefined()
      expect(saved.title).toBe(newPost.title)
      expect(saved.content).toBe(newPost.content)
      expect(saved.createdAt).toBeInstanceOf(Date)
      expect(saved.updatedAt).toBeInstanceOf(Date)
      expect(saved.isPersisted()).toBe(true)

      // Verify in DB
      const inDb = await db.select().from(PostTable)
      expect(inDb).toHaveLength(1)
      expect(inDb[0]!.id).toBe(saved.id)
    })

    it("既存の投稿を更新できること", async () => {
      // 1. Create
      const post = Post.create({
        title: "Original",
        content: "Original Content",
      })
      const saved = await repository.save(post)
      const originalUpdatedAt = saved.updatedAt

      // 2. Update logic via entity (simulate delay to ensure timestamp diff)
      await new Promise((resolve) => setTimeout(resolve, 100))

      const toUpdate = saved.update({
        title: "Updated",
      })

      const updated = await repository.save(toUpdate)

      expect(updated.id).toBe(saved.id)
      expect(updated.title).toBe("Updated")
      expect(updated.updatedAt!.getTime()).toBeGreaterThan(
        originalUpdatedAt!.getTime(),
      )

      // Verify in DB
      const inDb = await db.select().from(PostTable)
      expect(inDb).toHaveLength(1)
      expect(inDb[0]!.title).toBe("Updated")
    })
  })

  describe("findById", () => {
    it("存在しない場合 null を返すこと", async () => {
      const result = await repository.findById("non-existent")
      expect(result).toBeNull()
    })

    it("存在する場合その投稿を返すこと", async () => {
      const post = Post.create({ title: "Find Me", content: "..." })
      const saved = await repository.save(post)

      const found = await repository.findById(saved.id!)
      expect(found).not.toBeNull()
      expect(found!.id).toBe(saved.id)
      expect(found!.title).toBe("Find Me")
    })
  })

  describe("findAll", () => {
    it("全ての投稿を返すこと", async () => {
      await repository.save(Post.create({ title: "1", content: "c" }))
      await repository.save(Post.create({ title: "2", content: "c" }))

      const results = await repository.findAll()
      expect(results).toHaveLength(2)
    })
  })

  describe("delete", () => {
    it("投稿を削除し、削除された投稿を返すこと", async () => {
      const post = Post.create({ title: "Delete Me", content: "..." })
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
