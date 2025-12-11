import type { z } from "zod"
import { PostPropsSchema } from "./post.entity"

export { PostPropsSchema }

export const CreatePostSchema = PostPropsSchema

export const UpdatePostSchema = PostPropsSchema.partial()

export type CreatePostInput = z.infer<typeof CreatePostSchema>
export type UpdatePostInput = z.infer<typeof UpdatePostSchema>
