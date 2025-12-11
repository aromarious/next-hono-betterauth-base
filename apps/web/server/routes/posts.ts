import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { createFactory } from "hono/factory"

import { CreatePostSchema, UpdatePostSchema } from "@/server/domain/post.schema"
import { db } from "@/server/infrastructure/db/client"
import { PostRepositoryImpl as PostRepository } from "@/server/infrastructure/repositories/post.repository.drizzle"
import { PostUseCase } from "@/server/usecase/post.usecase"

// Instantiate repository (Dependency Injection is manual for now)
const postRepository = new PostRepository(db)
const postUseCase = new PostUseCase(postRepository)

// --- Controller ---

const factory = createFactory()

const handlers = {
  getPosts: factory.createHandlers(async (c) => {
    const allPosts = await postRepository.findAll()
    return c.json(allPosts.map((p) => p.toJSON()))
  }),

  createPost: factory.createHandlers(
    zValidator("json", CreatePostSchema),
    async (c) => {
      const args = c.req.valid("json")
      const savedPost = await postUseCase.createPost(args)
      return c.json(savedPost.toJSON(), 201)
    },
  ),

  updatePost: factory.createHandlers(
    zValidator("json", UpdatePostSchema),
    async (c) => {
      const id = c.req.param("id")
      if (!id) return c.json({ error: "Invalid ID" }, 400)
      const args = c.req.valid("json")

      const updatedPost = await postUseCase.updatePost(id, args)

      if (!updatedPost) {
        return c.json({ error: "Post not found" }, 404)
      }

      return c.json(updatedPost.toJSON())
    },
  ),

  deletePost: factory.createHandlers(async (c) => {
    const id = c.req.param("id")
    if (!id) return c.json({ error: "Invalid ID" }, 400)

    const deletedPost = await postUseCase.deletePost(id)

    if (!deletedPost) {
      return c.json({ error: "Post not found" }, 404)
    }

    return c.json(deletedPost.toJSON())
  }),
}

const app = new Hono()

app.get("/", ...handlers.getPosts)
app.post("/", ...handlers.createPost)
app.put("/:id", ...handlers.updatePost)
app.delete("/:id", ...handlers.deletePost)

export default app
