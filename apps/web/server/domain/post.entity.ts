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

export class Post {
  private constructor(
    private readonly core: PostCoreType,
    private readonly system?: {
      id: string
      createdAt: Date
      updatedAt: Date
    },
  ) {}

  public get id() {
    return this.system?.id
  }

  public get title() {
    return this.core.title
  }

  public get content() {
    return this.core.content
  }

  public get createdAt() {
    return this.system?.createdAt
  }

  public get updatedAt() {
    return this.system?.updatedAt
  }

  public static create(payload: z.infer<typeof PostCoreSchema>): Post {
    // Validate payload against PostCoreSchema
    const validPayload = PostCoreSchema.parse(payload)

    return new Post(validPayload)
  }

  public static reconstruct(payload: PostType): Post {
    const data = PostSchema.parse(payload)
    const { id, createdAt, updatedAt, ...core } = data

    return new Post(core, { id, createdAt, updatedAt })
  }

  public isPersisted(): boolean {
    return !!this.system?.id
  }

  public update(payload: Partial<z.infer<typeof PostCoreSchema>>): Post {
    const updatedCore = {
      ...this.core,
      ...payload,
    }

    // For update, we preserve system fields but update updatedAt if it exists.
    // However, since this returns a new Post instance that is "dirty" (to be saved),
    // we keep the ID but maybe we should update updatedAt here?
    // Or let Repository handle it?
    // Previous logic updated updatedAt on the instance. Let's keep that behavior.

    const newSystem = this.system
      ? { ...this.system, updatedAt: new Date() }
      : undefined

    return new Post(updatedCore, newSystem)
  }

  public toJSON() {
    return {
      ...this.core,
      id: this.system?.id,
      createdAt: this.system?.createdAt,
      updatedAt: this.system?.updatedAt,
    }
  }
}
