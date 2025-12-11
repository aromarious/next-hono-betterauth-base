import { eq } from "drizzle-orm"
import type { PostRepository } from "@/server/domain/ports/post.repository"
import { Post } from "@/server/domain/post.entity"
import { db } from "@/server/infrastructure/db/client"
import { PostTable } from "@/server/infrastructure/db/schema"

export class PostRepositoryImpl implements PostRepository {
  async findAll(): Promise<Post[]> {
    const results = await db.select().from(PostTable)
    return results.map((p) => Post.reconstruct({ ...p }))
  }

  async findById(id: string): Promise<Post | null> {
    const results = await db
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
      // Drizzle handles missing default columns (id, createdAt) if they are undefined
      const result = await db
        .insert(PostTable)
        .values({
          title: data.title,
          content: data.content,
        })
        .returning()
      const newPostData = result[0]
      if (!newPostData) throw new Error("Failed to create post")

      return Post.reconstruct({ ...newPostData })
    }

    // Update (Upsert)
    // For update, we expect id and probably timestamps involved.
    // However, onConflictDoUpdate needs specific handling.

    // Ensure we have values to insert for upsert attempt.
    // If createdAt is missing (should only happen on new post, but this block is isPersisted),
    // we should fallback or throw. But isPersisted checks id, so id exists.
    // createdAt might be missing if reconstructing via create() manually with ID? No, create() has no ID.
    // Reconstruct requires full props.

    // So if isPersisted is true, it came from reconstruct/save, so fields should exist.
    // But typings say optional. Let's handle safely.

    if (!data.createdAt) {
      throw new Error("Cannot save persisted entity without createdAt")
    }

    const result = await db
      .insert(PostTable)
      .values({
        id: data.id!,
        title: data.title ?? "",
        content: data.content ?? "",
        createdAt: data.createdAt,
        updatedAt: data.updatedAt ?? new Date(),
      })
      .onConflictDoUpdate({
        target: PostTable.id,
        set: {
          title: data.title,
          content: data.content,
          updatedAt: data.updatedAt,
        },
      })
      .returning()

    const updatedPostData = result[0]
    if (!updatedPostData) throw new Error("Failed to update post")

    return Post.reconstruct({ ...updatedPostData })
  }

  async delete(id: string): Promise<Post | null> {
    const deleted = await db
      .delete(PostTable)
      .where(eq(PostTable.id, id))
      .returning()
    const p = deleted[0]
    if (!p) return null

    return Post.reconstruct({ ...p })
  }
}
