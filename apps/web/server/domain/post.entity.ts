import { z } from "zod"

// 1. Full Definition (Canonical Schema)
export const postSchema = z.object({
  id: z.string(),
  userId: z.string(),
  content: z.string().min(1).max(280, "投稿は280文字以内にしてください"),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// 2. Derive Core Schema from Full Schema
export const postCoreSchema = postSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
})

export type PostType = z.infer<typeof postSchema>
export type PostCoreType = z.infer<typeof postCoreSchema>

// Internal props: Core data + Optional system fields
type PostProps = PostCoreType &
  Partial<Pick<PostType, "id" | "createdAt" | "updatedAt">> &
  Pick<PostType, "userId">

export class Post {
  private constructor(public readonly props: PostProps) {}

  public get id() {
    return this.props.id
  }

  public get userId() {
    return this.props.userId
  }

  public get content() {
    return this.props.content
  }

  public get createdAt() {
    return this.props.createdAt
  }

  public get updatedAt() {
    return this.props.updatedAt
  }

  public static create(
    userId: string,
    payload: z.infer<typeof postCoreSchema>,
  ): Post {
    // Validate payload against PostCoreSchema
    const validPayload = postCoreSchema.parse(payload)

    return new Post({
      ...validPayload,
      userId,
    })
  }

  public static reconstruct(payload: PostType): Post {
    const data = postSchema.parse(payload)
    return new Post(data)
  }

  public isPersisted(): boolean {
    return !!this.props.id
  }

  public update(payload: Partial<z.infer<typeof postCoreSchema>>): Post {
    const updated = {
      ...this.props,
      ...payload,
      updatedAt: new Date(),
    }
    // Validate the resulting state against the core schema
    postCoreSchema.parse(updated)

    return new Post(updated)
  }

  public toJSON() {
    return { ...this.props }
  }
}
