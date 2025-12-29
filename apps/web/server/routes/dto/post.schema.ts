import { z } from "zod"
import { postCoreSchema, postSchema } from "../../domain/post.entity"

// OpenAPI Response Schema (with dates as strings)
export const postResponseSchema = postSchema
  .omit({
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })

export const createPostSchema = postCoreSchema

export type CreatePostInput = z.infer<typeof createPostSchema>
