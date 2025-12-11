import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { createFactory } from "hono/factory"
import { z } from "zod"
import { PostRepositoryImpl } from "@/server/infrastructure/repositories/post.repository.drizzle"

// Instantiate repository (Dependency Injection is manual for now)
const postRepository = new PostRepositoryImpl()

const createPostSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
})

const updatePostSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
})

// --- Controller ---

const factory = createFactory()

const handlers = {
  getPosts: factory.createHandlers(async (c) => {
    const allPosts = await postRepository.findAll()
    return c.json(allPosts)
  }),

  createPost: factory.createHandlers(
    zValidator("json", createPostSchema),
    async (c) => {
      const args = c.req.valid("json")
      const newPost = await postRepository.create(args)
      return c.json(newPost, 201)
    },
  ),

  updatePost: factory.createHandlers(
    zValidator("json", updatePostSchema),
    async (c) => {
      const id = Number(c.req.param("id"))
      const args = c.req.valid("json")

      if (Number.isNaN(id)) {
        return c.json({ error: "Invalid ID" }, 400)
      }

      const updatedPost = await postRepository.update(id, args)

      if (!updatedPost) {
        return c.json({ error: "Post not found" }, 404)
      }

      return c.json(updatedPost)
    },
  ),

  deletePost: factory.createHandlers(async (c) => {
    const id = Number(c.req.param("id"))

    if (Number.isNaN(id)) {
      return c.json({ error: "Invalid ID" }, 400)
    }

    const deletedPost = await postRepository.delete(id)

    if (!deletedPost) {
      return c.json({ error: "Post not found" }, 404)
    }

    return c.json(deletedPost)
  }),
}

const app = new Hono()
  .get("/", ...handlers.getPosts)
  .post("/", ...handlers.createPost)
  .put("/:id", ...handlers.updatePost)
  .delete("/:id", ...handlers.deletePost)

export default app
