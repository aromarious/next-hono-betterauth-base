import type { Post } from "@/server/domain/post.entity"

/**
 * Convert Post entity to API response format
 * Transforms Date objects to ISO string format
 */
export function toPostResponse(post: Post) {
  if (!(post.id && post.createdAt && post.updatedAt)) {
    throw new Error("Cannot convert unpersisted Post to response format")
  }

  return {
    id: post.id,
    userId: post.userId,
    content: post.content,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  }
}
