import { eq } from "drizzle-orm"
import type { PostRepository } from "@/server/domain/ports/post.repository"
import type { Post } from "@/server/domain/post.entity"
import { db } from "@/server/infrastructure/db/client"
import { posts } from "@/server/infrastructure/db/schema"

export class PostRepositoryImpl implements PostRepository {
  async findAll(): Promise<Post[]> {
    return await db.select().from(posts)
  }

  async create(post: { title: string; content: string }): Promise<Post> {
    const newPost = await db.insert(posts).values(post).returning()
    if (!newPost[0]) {
      throw new Error("Failed to create post")
    }
    return newPost[0]
  }

  async update(
    id: number,
    post: { title?: string; content?: string },
  ): Promise<Post | null> {
    const updatedPost = await db
      .update(posts)
      .set({
        ...post,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, id))
      .returning()

    if (!updatedPost[0]) {
      return null
    }

    return updatedPost[0]
  }

  async delete(id: number): Promise<Post | null> {
    const deletedPost = await db
      .delete(posts)
      .where(eq(posts.id, id))
      .returning()

    if (!deletedPost[0]) {
      return null
    }

    return deletedPost[0]
  }
}
