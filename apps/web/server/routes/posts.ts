import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { createFactory } from "hono/factory"
import { Post } from "@/server/domain/post.entity"
import { PostCoreSchema, UpdatePostSchema } from "@/server/domain/post.schema"
import { PostRepositoryImpl } from "@/server/infrastructure/repositories/post.repository.drizzle"

// Instantiate repository (Dependency Injection is manual for now)
const postRepository = new PostRepositoryImpl()

// --- Controller ---

const factory = createFactory()

const handlers = {
  getPosts: factory.createHandlers(async (c) => {
    const allPosts = await postRepository.findAll()
    return c.json(allPosts.map((p) => p.toJSON()))
  }),

  createPost: factory.createHandlers(
    zValidator("json", PostCoreSchema),
    async (c) => {
      const args = c.req.valid("json")
      const newPost = Post.create(args)
      const savedPost = await postRepository.save(newPost)
      return c.json(savedPost.toJSON(), 201)
    },
  ),

  updatePost: factory.createHandlers(
    zValidator("json", UpdatePostSchema),
    async (c) => {
      const id = c.req.param("id")
      if (!id) return c.json({ error: "Invalid ID" }, 400)
      const args = c.req.valid("json")

      const post = await postRepository.findById(id)
      if (!post) {
        return c.json({ error: "Post not found" }, 404)
      }

      const updatedPost = post.update(args)
      await postRepository.save(updatedPost)

      return c.json(updatedPost.toJSON())
    },
  ),

  deletePost: factory.createHandlers(async (c) => {
    const id = c.req.param("id")
    if (!id) return c.json({ error: "Invalid ID" }, 400)

    const deletedPost = await postRepository.delete(id)

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
