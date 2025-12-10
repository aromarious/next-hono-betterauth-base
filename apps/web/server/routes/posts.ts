import { zValidator } from "@hono/zod-validator"
import { eq } from "drizzle-orm"
import { Hono } from "hono"
import { z } from "zod"
import { db } from "@/server/infrastructure/db/client"
import { posts } from "@/server/infrastructure/db/schema"

const app = new Hono()
  // GET /api/posts
  .get("/", async (c) => {
    const allPosts = await db.select().from(posts)
    return c.json(allPosts)
  })
  // POST /api/posts
  .post(
    "/",
    zValidator(
      "json",
      z.object({
        title: z.string().min(1),
        content: z.string().min(1),
      }),
    ),
    async (c) => {
      const { title, content } = c.req.valid("json")
      const newPost = await db
        .insert(posts)
        .values({ title, content })
        .returning()
      return c.json(newPost[0], 201)
    },
  )
  // PUT /api/posts/:id
  .put(
    "/:id",
    zValidator(
      "json",
      z.object({
        title: z.string().min(1).optional(),
        content: z.string().min(1).optional(),
      }),
    ),
    async (c) => {
      const id = Number(c.req.param("id"))
      const { title, content } = c.req.valid("json")

      if (Number.isNaN(id)) {
        return c.json({ error: "Invalid ID" }, 400)
      }

      const updatedPost = await db
        .update(posts)
        .set({
          ...(title ? { title } : {}),
          ...(content ? { content } : {}),
          updatedAt: new Date(),
        })
        .where(eq(posts.id, id))
        .returning()

      if (updatedPost.length === 0) {
        return c.json({ error: "Post not found" }, 404)
      }

      return c.json(updatedPost[0])
    },
  )
  // DELETE /api/posts/:id
  .delete("/:id", async (c) => {
    const id = Number(c.req.param("id"))

    if (Number.isNaN(id)) {
      return c.json({ error: "Invalid ID" }, 400)
    }

    const deletedPost = await db
      .delete(posts)
      .where(eq(posts.id, id))
      .returning()

    if (deletedPost.length === 0) {
      return c.json({ error: "Post not found" }, 404)
    }

    return c.json(deletedPost[0])
  })

export default app
