import type { z } from "zod"
import { PostCoreSchema } from "./post.entity"

export { PostCoreSchema }

export const CreatePostSchema = PostCoreSchema

export const UpdatePostSchema = PostCoreSchema.partial()

export type CreatePostInput = z.infer<typeof CreatePostSchema>
export type UpdatePostInput = z.infer<typeof UpdatePostSchema>
