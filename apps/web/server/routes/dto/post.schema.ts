import { z } from "zod"
import { PostCoreSchema, PostSchema } from "../../domain/post.entity"

// OpenAPI Response Schema (with dates as strings)
export const PostResponseSchema = PostSchema.omit({
  createdAt: true,
  updatedAt: true,
}).extend({
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const CreatePostSchema = PostCoreSchema

export const UpdatePostSchema = PostCoreSchema.partial()

export type CreatePostInput = z.infer<typeof CreatePostSchema>
export type UpdatePostInput = z.infer<typeof UpdatePostSchema>
