import type { Post } from "../post.entity"

export interface PostRepository {
  findAll(): Promise<Post[]>
  findById(id: string): Promise<Post | null>
  save(post: Post): Promise<Post>
  delete(id: string): Promise<Post | null>
}
