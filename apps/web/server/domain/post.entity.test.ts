import { describe, expect, it } from "vitest"
import { Post } from "./post.entity"

describe("Post Entity", () => {
  describe("create", () => {
    it("有効な入力で新しい投稿インスタンスを作成できること", () => {
      const input = {
        title: "Test Title",
        content: "Test Content",
      }
      const post = Post.create(input)

      expect(post.title).toBe(input.title)
      expect(post.content).toBe(input.content)
      // ID should not be set for new posts
      expect(post.id).toBeUndefined()
      // Dates are optional/undefined for new posts until persisted (depending on implementation,
      // but based on PostProps definition they are Partial<Pick<...>>)
      expect(post.createdAt).toBeUndefined()
      expect(post.updatedAt).toBeUndefined()
    })

    it("タイトルが空の場合エラーを投げること", () => {
      const input = {
        title: "",
        content: "Test Content",
      }
      expect(() => Post.create(input)).toThrow()
    })

    it("本文が空の場合エラーを投げること", () => {
      const input = {
        title: "Test Title",
        content: "",
      }
      expect(() => Post.create(input)).toThrow()
    })
  })

  describe("reconstruct", () => {
    it("完全なデータから投稿インスタンスを再構築できること", () => {
      const data = {
        id: "post-123",
        title: "Existing Title",
        content: "Existing Content",
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-02"),
      }
      const post = Post.reconstruct(data)

      expect(post.id).toBe(data.id)
      expect(post.title).toBe(data.title)
      expect(post.content).toBe(data.content)
      expect(post.createdAt).toEqual(data.createdAt)
      expect(post.updatedAt).toEqual(data.updatedAt)
    })
  })

  describe("update", () => {
    it("プロパティを更新し、updatedAt も更新されること", () => {
      const original = Post.reconstruct({
        id: "post-123",
        title: "Original Title",
        content: "Original Content",
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-01"),
      })

      const updateInput = {
        title: "Updated Title",
      }

      // Wait a bit to ensure time difference if needed, although mostly checking it's a new instance/date
      const updatedPost = original.update(updateInput)

      expect(updatedPost.title).toBe(updateInput.title)
      expect(updatedPost.content).toBe(original.content) // Should remain unchanged
      expect(updatedPost.id).toBe(original.id)

      // updatedAt should be updated
      expect(updatedPost.updatedAt).not.toEqual(original.updatedAt)
      expect(updatedPost.updatedAt instanceof Date).toBe(true)
    })

    it("更新結果が無効な状態（空タイトル）になる場合エラーを投げること", () => {
      const original = Post.create({
        title: "Original",
        content: "Content",
      })

      expect(() => original.update({ title: "" })).toThrow()
    })
  })

  describe("toJSON", () => {
    it("オブジェクト表現を返すこと", () => {
      const input = {
        title: "Title",
        content: "Content",
      }
      const post = Post.create(input)
      const json = post.toJSON()

      expect(json.title).toBe(input.title)
      expect(json.content).toBe(input.content)
      expect(json.id).toBeUndefined()
    })
  })

  describe("isPersisted", () => {
    it("新規投稿の場合は false を返すこと", () => {
      const post = Post.create({ title: "New", content: "Content" })
      expect(post.isPersisted()).toBe(false)
    })

    it("再構築された投稿の場合は true を返すこと", () => {
      const post = Post.reconstruct({
        id: "123",
        title: "Existing",
        content: "Content",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      expect(post.isPersisted()).toBe(true)
    })
  })
})
