import { describe, expect, it } from "vitest"
import { Post } from "./post.entity"

describe("Post Entity", () => {
  const testUserId = "user-123"

  describe("create", () => {
    it("有効な入力で新しい投稿インスタンスを作成できること", () => {
      const input = {
        content: "Test Content",
      }
      const post = Post.create(testUserId, input)

      expect(post.userId).toBe(testUserId)
      expect(post.content).toBe(input.content)
      // ID should not be set for new posts
      expect(post.id).toBeUndefined()
      expect(post.createdAt).toBeUndefined()
      expect(post.updatedAt).toBeUndefined()
    })

    it("本文が空の場合エラーを投げること", () => {
      const input = {
        content: "",
      }
      expect(() => Post.create(testUserId, input)).toThrow()
    })

    it("280文字以内の投稿は作成できること", () => {
      const input = {
        content: "a".repeat(280),
      }
      const post = Post.create(testUserId, input)
      expect(post.content).toBe(input.content)
    })

    it("281文字以上の投稿はエラーを投げること", () => {
      const input = {
        content: "a".repeat(281),
      }
      expect(() => Post.create(testUserId, input)).toThrow(
        "投稿は280文字以内にしてください",
      )
    })
  })

  describe("reconstruct", () => {
    it("完全なデータから投稿インスタンスを再構築できること", () => {
      const data = {
        id: "post-123",
        userId: testUserId,
        content: "Existing Content",
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-02"),
      }
      const post = Post.reconstruct(data)

      expect(post.id).toBe(data.id)
      expect(post.userId).toBe(data.userId)
      expect(post.content).toBe(data.content)
      expect(post.createdAt).toEqual(data.createdAt)
      expect(post.updatedAt).toEqual(data.updatedAt)
    })
  })

  describe("toJSON", () => {
    it("オブジェクト表現を返すこと", () => {
      const input = {
        content: "Content",
      }
      const post = Post.create(testUserId, input)
      const json = post.toJSON()

      expect(json.userId).toBe(testUserId)
      expect(json.content).toBe(input.content)
      expect(json.id).toBeUndefined()
    })
  })

  describe("isPersisted", () => {
    it("新規投稿の場合は false を返すこと", () => {
      const post = Post.create(testUserId, { content: "Content" })
      expect(post.isPersisted()).toBe(false)
    })

    it("再構築された投稿の場合は true を返すこと", () => {
      const post = Post.reconstruct({
        id: "123",
        userId: testUserId,
        content: "Content",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      expect(post.isPersisted()).toBe(true)
    })
  })
})
