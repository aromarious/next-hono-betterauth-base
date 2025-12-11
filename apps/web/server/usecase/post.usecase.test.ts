import { beforeEach, describe, expect, it, vi } from "vitest"
import type { PostRepository } from "@/server/domain/ports/post.repository"
import { Post } from "@/server/domain/post.entity"
import { PostUseCase } from "./post.usecase"

describe("PostUseCase", () => {
  let postUseCase: PostUseCase
  let mockPostRepository: PostRepository

  beforeEach(() => {
    mockPostRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    }
    postUseCase = new PostUseCase(mockPostRepository)
  })

  describe("createPost", () => {
    it("新しい投稿を作成して保存できること", async () => {
      const input = { title: "Test Title", content: "Test Content" }

      // Mock save to return the passed post (imitating a successful DB save)
      vi.mocked(mockPostRepository.save).mockImplementation(
        async (post) => post,
      )

      const result = await postUseCase.createPost(input)

      expect(mockPostRepository.save).toHaveBeenCalledTimes(1)
      // biome-ignore lint/style/noNonNullAssertion: Guaranteed by toHaveBeenCalledTimes
      const savedPost = vi.mocked(mockPostRepository.save).mock.calls[0]![0]

      expect(savedPost.props.title).toBe(input.title)
      expect(savedPost.props.content).toBe(input.content)
      expect(result).toBe(savedPost)
    })

    it("投稿の作成に失敗した場合（重複など）エラーを投げること", async () => {
      const input = { title: "Duplicate Title", content: "Content" }
      const error = new Error("Duplicated entry")

      vi.mocked(mockPostRepository.save).mockRejectedValue(error)

      await expect(postUseCase.createPost(input)).rejects.toThrow(error)
    })
  })

  describe("updatePost", () => {
    it("既存の投稿を更新できること", async () => {
      const existingPost = Post.reconstruct({
        id: "post-123",
        title: "Old Title",
        content: "Old Content",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      const updateInput = { title: "New Title", content: "New Content" }

      vi.mocked(mockPostRepository.findById).mockResolvedValue(existingPost)
      vi.mocked(mockPostRepository.save).mockImplementation(
        async (post) => post,
      )

      // existingPost.id is guaranteed to be defined because we used reconstruct
      // biome-ignore lint/style/noNonNullAssertion: Guaranteed by findById and reconstruct
      const result = await postUseCase.updatePost(existingPost.id!, updateInput)

      expect(mockPostRepository.findById).toHaveBeenCalledWith(existingPost.id)
      expect(mockPostRepository.save).toHaveBeenCalledTimes(1)

      // result should be the updated post
      expect(result?.props.title).toBe(updateInput.title)
      expect(result?.props.content).toBe(updateInput.content)
    })

    it("投稿が存在しない場合 null を返すこと", async () => {
      vi.mocked(mockPostRepository.findById).mockResolvedValue(null)

      const result = await postUseCase.updatePost("non-existent-id", {
        title: "New",
      })

      expect(mockPostRepository.findById).toHaveBeenCalledWith(
        "non-existent-id",
      )
      expect(mockPostRepository.save).not.toHaveBeenCalled()
      expect(result).toBeNull()
    })
  })

  describe("deletePost", () => {
    it("既存の投稿を削除できること", async () => {
      const existingPost = Post.reconstruct({
        id: "post-to-delete",
        title: "To Delete",
        content: "...",
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      vi.mocked(mockPostRepository.delete).mockResolvedValue(existingPost)

      // existingPost.id is guaranteed to be defined because we used reconstruct
      // biome-ignore lint/style/noNonNullAssertion: Guaranteed by findById and reconstruct
      const result = await postUseCase.deletePost(existingPost.id!)

      expect(mockPostRepository.delete).toHaveBeenCalledWith(existingPost.id)
      expect(result).toBe(existingPost)
    })

    it("削除対象の投稿が存在しない場合 null を返すこと", async () => {
      vi.mocked(mockPostRepository.delete).mockResolvedValue(null)

      const result = await postUseCase.deletePost("non-existent-id")

      expect(mockPostRepository.delete).toHaveBeenCalledWith("non-existent-id")
      expect(result).toBeNull()
    })
  })
})
