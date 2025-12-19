import { beforeEach, describe, expect, it, vi } from "vitest"
import type { PostRepository } from "@/server/domain/ports/post.repository"
import { Post } from "@/server/domain/post.entity"
import { PostUseCase } from "./post.usecase"

describe("PostUseCase", () => {
  let postUseCase: PostUseCase
  let mockPostRepository: PostRepository
  const testUserId = "user-123"

  beforeEach(() => {
    mockPostRepository = {
      findAll: vi.fn(),
      findByUserId: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    }
    postUseCase = new PostUseCase(mockPostRepository)
  })

  describe("createPost", () => {
    it("新しい投稿を作成して保存できること", async () => {
      const input = { content: "Test Content" }

      // Mock save to return the passed post (imitating a successful DB save)
      vi.mocked(mockPostRepository.save).mockImplementation(
        async (post) => post,
      )

      const result = await postUseCase.createPost(testUserId, input)

      expect(mockPostRepository.save).toHaveBeenCalledTimes(1)
      const savedPost = vi.mocked(mockPostRepository.save).mock.calls[0]![0]

      expect(savedPost.props.userId).toBe(testUserId)
      expect(savedPost.props.content).toBe(input.content)
      expect(result).toBe(savedPost)
    })

    it("投稿の作成に失敗した場合（重複など）エラーを投げること", async () => {
      const input = { content: "Content" }
      const error = new Error("Duplicated entry")

      vi.mocked(mockPostRepository.save).mockRejectedValue(error)

      await expect(postUseCase.createPost(testUserId, input)).rejects.toThrow(
        error,
      )
    })

    it("280文字を超える投稿の場合エラーを投げること", async () => {
      const input = { content: "a".repeat(281) }

      await expect(postUseCase.createPost(testUserId, input)).rejects.toThrow()
    })
  })

  describe("deletePost", () => {
    it("既存の投稿を削除できること", async () => {
      const existingPost = Post.reconstruct({
        id: "post-to-delete",
        userId: testUserId,
        content: "...",
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      vi.mocked(mockPostRepository.delete).mockResolvedValue(existingPost)

      // existingPost.id is guaranteed to be defined because we used reconstruct
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
