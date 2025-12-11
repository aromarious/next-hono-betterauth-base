import { zValidator } from "@hono/zod-validator"
import { type Context, Hono } from "hono"
import { z } from "zod"
import { PostRepositoryImpl } from "@/server/infrastructure/repositories/post.repository"

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

const controller = {
  getPosts: async (c: Context) => {
    const allPosts = await postRepository.findAll()
    return c.json(allPosts)
  },

  createPost: async (c: Context) => {
    // Note: Cast to any to bypass Hono's strict Context typing in decoupled handlers
    const args = (c.req as any).valid("json") as z.infer<
      typeof createPostSchema
    >
    const newPost = await postRepository.create(args)
    return c.json(newPost, 201)
  },

  updatePost: async (c: Context) => {
    const id = Number(c.req.param("id"))
    const args = (c.req as any).valid("json") as z.infer<
      typeof updatePostSchema
    >

    if (Number.isNaN(id)) {
      return c.json({ error: "Invalid ID" }, 400)
    }

    const updatedPost = await postRepository.update(id, args)

    if (!updatedPost) {
      return c.json({ error: "Post not found" }, 404)
    }

    return c.json(updatedPost)
  },

  deletePost: async (c: Context) => {
    const id = Number(c.req.param("id"))

    if (Number.isNaN(id)) {
      return c.json({ error: "Invalid ID" }, 400)
    }

    const deletedPost = await postRepository.delete(id)

    if (!deletedPost) {
      return c.json({ error: "Post not found" }, 404)
    }

    return c.json(deletedPost)
  },
}

const app = new Hono()
  .get("/", controller.getPosts)
  .post("/", zValidator("json", createPostSchema), controller.createPost)
  .put("/:id", zValidator("json", updatePostSchema), controller.updatePost)
  .delete("/:id", controller.deletePost)

export default app
