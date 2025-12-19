import type { PostRepository } from "@/server/domain/ports/post.repository"
import { Post } from "@/server/domain/post.entity"
import type { CreatePostInput } from "@/server/routes/dto/post.schema"

export class PostUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  async createPost(userId: string, input: CreatePostInput): Promise<Post> {
    const newPost = Post.create(userId, input)
    return await this.postRepository.save(newPost)
  }

  async deletePost(id: string): Promise<Post | null> {
    return await this.postRepository.delete(id)
  }
}
