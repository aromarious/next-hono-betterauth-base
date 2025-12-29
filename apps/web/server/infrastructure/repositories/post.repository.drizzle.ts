import type { DrizzleClient } from "@packages/db"
import { desc, eq, PostTable } from "@packages/db"
import type { PostRepository } from "@/server/domain/ports/post.repository"
import { Post } from "@/server/domain/post.entity"

export class PostRepositoryImpl implements PostRepository {
  constructor(private readonly db: DrizzleClient) {}

  async findAll(): Promise<Post[]> {
    const results = await this.db.select().from(PostTable)
    return results.map((p) => Post.reconstruct({ ...p }))
  }

  async findByUserId(userId: string): Promise<Post[]> {
    const results = await this.db
      .select()
      .from(PostTable)
      .where(eq(PostTable.userId, userId))
      .orderBy(desc(PostTable.createdAt))
    return results.map((p) => Post.reconstruct({ ...p }))
  }

  async findById(id: string): Promise<Post | null> {
    const results = await this.db
      .select()
      .from(PostTable)
      .where(eq(PostTable.id, id))
    const p = results[0]
    if (!p) return null

    return Post.reconstruct({ ...p })
  }

  async save(post: Post): Promise<Post> {
    const data = post.toJSON()

    if (!post.isPersisted()) {
      // Create (Insert)
      if (!data.userId) {
        throw new Error("Cannot create post without userId")
      }

      const result = await this.db
        .insert(PostTable)
        .values({
          userId: data.userId,
          content: data.content,
        })
        .returning()
      const newPostData = result[0]
      if (!newPostData) throw new Error("Failed to create post")

      return Post.reconstruct({ ...newPostData })
    }

    // 一人Twitterでは更新機能は不要なので、ここでエラーを投げる
    throw new Error("Update operation is not supported")
  }

  async delete(id: string): Promise<Post | null> {
    const deleted = await this.db
      .delete(PostTable)
      .where(eq(PostTable.id, id))
      .returning()
    const p = deleted[0]
    if (!p) return null

    return Post.reconstruct({ ...p })
  }
}
