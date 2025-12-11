import type { Post } from "@/server/domain/post.entity"

export interface PostRepository {
  findAll(): Promise<Post[]>
  create(post: { title: string; content: string }): Promise<Post>
  update(
    id: number,
    post: { title?: string; content?: string },
  ): Promise<Post | null>
  delete(id: number): Promise<Post | null>
}
