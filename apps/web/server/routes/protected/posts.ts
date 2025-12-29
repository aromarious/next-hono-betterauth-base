import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { db } from "@packages/db"
import { PostRepositoryImpl as PostRepository } from "@/server/infrastructure/repositories/post.repository.drizzle"
import { PostUseCase } from "@/server/usecase/post.usecase"
import { toPostResponse } from "../dto/post.mapper"
import { createPostSchema, postResponseSchema } from "../dto/post.schema"

// Instantiate repository
const postRepository = new PostRepository(db)
const postUseCase = new PostUseCase(postRepository)
const tags = ["v0/Posts (Protected)"]

// routes for /api/v0/protected/posts
// Note: These routes are already protected by middleware at the router level
export const protectedPostsRoutes = new OpenAPIHono()
  // GET /api/v0/protected/posts - 自分の投稿一覧を取得
  .openapi(
    createRoute({
      method: "get",
      path: "/posts",
      tags,
      responses: {
        401: {
          description: "Unauthorized",
        },
        200: {
          content: {
            "application/json": {
              schema: z.array(postResponseSchema),
            },
          },
          description: "List user's own posts",
        },
      },
    }),
    async (c) => {
      const user = c.var.user
      if (!user) {
        return c.json({ error: "Unauthorized" }, 401)
      }
      const userPosts = await postRepository.findByUserId(user.id)
      return c.json(userPosts.map((p) => toPostResponse(p)))
    },
  )
  // POST /api/v0/protected/posts - 新規投稿作成
  .openapi(
    createRoute({
      method: "post",
      path: "/posts",
      tags,
      request: {
        body: {
          content: {
            "application/json": {
              schema: createPostSchema,
            },
          },
        },
      },
      responses: {
        401: {
          description: "Unauthorized",
        },
        201: {
          content: {
            "application/json": {
              schema: postResponseSchema,
            },
          },
          description: "Create a new post",
        },
      },
    }),
    async (c) => {
      const user = c.var.user
      if (!user) {
        return c.json({ error: "Unauthorized" }, 401)
      }
      const args = c.req.valid("json")
      const savedPost = await postUseCase.createPost(user.id, args)
      return c.json(toPostResponse(savedPost), 201)
    },
  )
  // GET /api/v0/protected/posts/:id - 特定の投稿を取得（所有者チェック付き）
  .openapi(
    createRoute({
      method: "get",
      path: "/posts/:id",
      tags,
      responses: {
        400: {
          description: "Invalid ID",
        },
        401: {
          description: "Unauthorized",
        },
        404: {
          description: "Post not found",
        },
        200: {
          content: {
            "application/json": {
              schema: postResponseSchema,
            },
          },
          description: "Get a specific post",
        },
      },
    }),
    async (c) => {
      const user = c.var.user
      if (!user) {
        return c.json({ error: "Unauthorized" }, 401)
      }
      const id = c.req.param("id")
      if (!id) return c.json({ error: "Invalid ID" }, 400)

      const post = await postRepository.findById(id)
      if (!post || post.userId !== user.id) {
        return c.json({ error: "Post not found" }, 404)
      }

      return c.json(toPostResponse(post))
    },
  )
  // DELETE /api/v0/protected/posts/:id - 投稿削除（所有者チェック付き）
  .openapi(
    createRoute({
      method: "delete",
      path: "/posts/:id",
      tags,
      responses: {
        400: {
          description: "Invalid ID",
        },
        401: {
          description: "Unauthorized",
        },
        403: {
          description: "Forbidden - not the owner",
        },
        404: {
          description: "Post not found",
        },
        204: {
          description: "Delete a post",
        },
      },
    }),
    async (c) => {
      const user = c.var.user
      if (!user) {
        return c.json({ error: "Unauthorized" }, 401)
      }
      const id = c.req.param("id")
      if (!id) return c.json({ error: "Invalid ID" }, 400)

      // 投稿を取得して所有者チェック
      const post = await postRepository.findById(id)
      if (!post) {
        return c.json({ error: "Post not found" }, 404)
      }

      if (post.userId !== user.id) {
        return c.json({ error: "Forbidden" }, 403)
      }

      await postUseCase.deletePost(id)
      return c.body(null, 204)
    },
  )
