import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { db } from "@packages/db"
import { PostRepositoryImpl as PostRepository } from "@/server/infrastructure/repositories/post.repository.drizzle"
import { PostUseCase } from "@/server/usecase/post.usecase"
import { toPostResponse } from "./dto/post.mapper"
import {
  createPostSchema,
  postResponseSchema,
  updatePostSchema,
} from "./dto/post.schema"

// Instantiate repository (Dependency Injection is manual for now)
const postRepository = new PostRepository(db)
const postUseCase = new PostUseCase(postRepository)
const tags = ["v0/Posts"]

// routes for /api/v0/posts
export const postsRoutes = new OpenAPIHono()
  // GET /api/v0/posts
  .openapi(
    createRoute({
      method: "get",
      path: "/posts",
      tags,
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.array(postResponseSchema),
            },
          },
          description: "List all posts",
        },
      },
    }),
    async (c) => {
      const allPosts = await postRepository.findAll()
      return c.json(allPosts.map((p) => toPostResponse(p)))
    },
  )
  // GET /api/v0/posts/:id
  .openapi(
    createRoute({
      method: "get",
      path: "/posts/:id",
      tags,
      responses: {
        400: {
          description: "Invalid ID",
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
          description: "Get a post by ID",
        },
      },
    }),
    async (c) => {
      const id = c.req.param("id")
      if (!id) return c.json({ error: "Invalid ID" }, 400)

      const post = await postRepository.findById(id)

      if (!post) {
        return c.json({ error: "Post not found" }, 404)
      }

      return c.json(toPostResponse(post))
    },
  )
  // POST /api/v0/posts
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
      const args = c.req.valid("json")
      const savedPost = await postUseCase.createPost(args)
      return c.json(toPostResponse(savedPost), 201)
    },
  )
  // PUT /api/v0/posts/:id
  .openapi(
    createRoute({
      method: "put",
      path: "/posts/:id",
      tags,
      request: {
        body: {
          content: {
            "application/json": {
              schema: updatePostSchema,
            },
          },
        },
      },
      responses: {
        400: {
          description: "Invalid ID",
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
          description: "Update a post",
        },
      },
    }),
    async (c) => {
      const id = c.req.param("id")
      if (!id) return c.json({ error: "Invalid ID" }, 400)
      const args = c.req.valid("json")

      const updatedPost = await postUseCase.updatePost(id, args)

      if (!updatedPost) {
        return c.json({ error: "Post not found" }, 404)
      }

      return c.json(toPostResponse(updatedPost))
    },
  )
  // DELETE /api/v0/posts/:id
  .openapi(
    createRoute({
      method: "delete",
      path: "/posts/:id",
      tags,
      responses: {
        400: {
          description: "Invalid ID",
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
      const id = c.req.param("id")
      if (!id) return c.json({ error: "Invalid ID" }, 400)

      const deletedPost = await postUseCase.deletePost(id)

      if (!deletedPost) {
        return c.json({ error: "Post not found" }, 404)
      }

      return c.body(null, 204)
    },
  )
