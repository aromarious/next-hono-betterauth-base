import type { PostRepository } from "@/server/domain/ports/post.repository"
import { Post } from "@/server/domain/post.entity"
import type {
  CreatePostInput,
  UpdatePostInput,
} from "@/server/routes/dto/post.schema"

export class PostUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  async createPost(input: CreatePostInput): Promise<Post> {
    const newPost = Post.create(input)
    return await this.postRepository.save(newPost)
  }

  async updatePost(id: string, input: UpdatePostInput): Promise<Post | null> {
    const post = await this.postRepository.findById(id)
    if (!post) return null

    const updatedPost = post.update(input)
    return await this.postRepository.save(updatedPost)
  }

  async deletePost(id: string): Promise<Post | null> {
    return await this.postRepository.delete(id)
  }
}
