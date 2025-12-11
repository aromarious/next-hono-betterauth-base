import type { z } from "zod"
import { PostCoreSchema, PostSchema } from "./post.entity"
export { PostCoreSchema, PostSchema }

export const CreatePostSchema = PostCoreSchema

export const UpdatePostSchema = PostCoreSchema.partial()

export type CreatePostInput = z.infer<typeof CreatePostSchema>
export type UpdatePostInput = z.infer<typeof UpdatePostSchema>
