import { z } from "zod"

// 1. Full Definition (Canonical Schema)
export const PostSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  content: z.string().min(1),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// 2. Derive Core Schema from Full Schema
export const PostCoreSchema = PostSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type PostType = z.infer<typeof PostSchema>
export type PostCoreType = z.infer<typeof PostCoreSchema>

// Internal props: Core data + Optional system fields
type PostProps = PostCoreType & {
  id?: string
  createdAt?: Date
  updatedAt?: Date
}

export class Post {
  private constructor(public readonly props: PostProps) {}

  public get id() {
    return this.props.id
  }

  public get title() {
    return this.props.title
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

  public static create(payload: z.infer<typeof PostCoreSchema>): Post {
    // Validate payload against PostCoreSchema
    const validPayload = PostCoreSchema.parse(payload)

    return new Post({
      ...validPayload,
    })
  }

  public static reconstruct(payload: PostType): Post {
    const data = PostSchema.parse(payload)
    return new Post(data)
  }

  public isPersisted(): boolean {
    return !!this.props.id
  }

  public update(payload: Partial<z.infer<typeof PostCoreSchema>>): Post {
    const updated = {
      ...this.props,
      ...payload,
      updatedAt: new Date(),
    }
    // We validate the resulting state against the partial CreateSchema check if needed,
    // or just trust the inputs? Ideally we validate.
    // Since we don't have a "UpdateSchema" derived from PostSchema exposed here yet,
    // we assume payload is valid.
    return new Post(updated)
  }

  public toJSON() {
    return { ...this.props }
  }
}
