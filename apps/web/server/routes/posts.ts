import { createRoute, type OpenAPIHono, z } from "@hono/zod-openapi"
import { db } from "@/server/infrastructure/db/client"
import { PostRepositoryImpl as PostRepository } from "@/server/infrastructure/repositories/post.repository.drizzle"
import { PostUseCase } from "@/server/usecase/post.usecase"
import { toPostResponse } from "./dto/post.mapper"
import {
  CreatePostSchema,
  PostResponseSchema,
  UpdatePostSchema,
} from "./dto/post.schema"

// Instantiate repository (Dependency Injection is manual for now)
const postRepository = new PostRepository(db)
const postUseCase = new PostUseCase(postRepository)
const tags = ["v0/Posts"]

const listPostsRoute = createRoute({
  method: "get",
  path: "/posts",
  tags,
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(PostResponseSchema),
        },
      },
      description: "List all posts",
    },
  },
})

const getPostRoute = createRoute({
  method: "get",
  path: "/posts/:id",
  tags,
  responses: {
    200: {
      content: {
        "application/json": {
          schema: PostResponseSchema,
        },
      },
      description: "Get a post by ID",
    },
    404: {
      description: "Post not found",
    },
    400: {
      description: "Invalid ID",
    },
  },
})

const createPostRoute = createRoute({
  method: "post",
  path: "/posts",
  tags,
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreatePostSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: PostResponseSchema,
        },
      },
      description: "Create a new post",
    },
  },
})

const updatePostRoute = createRoute({
  method: "put",
  path: "/posts/:id",
  tags,
  request: {
    body: {
      content: {
        "application/json": {
          schema: UpdatePostSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: PostResponseSchema,
        },
      },
      description: "Update a post",
    },
    404: {
      description: "Post not found",
    },
    400: {
      description: "Invalid ID",
    },
  },
})

const deletePostRoute = createRoute({
  method: "delete",
  path: "/posts/:id",
  tags,
  responses: {
    204: {
      description: "Delete a post",
    },
    404: {
      description: "Post not found",
    },
    400: {
      description: "Invalid ID",
    },
  },
})

import type { Env } from "hono"

export const configurePostsRoutes = <
  E extends Env,
  S extends {},
  P extends string,
>(
  app: OpenAPIHono<E, S, P>,
) => {
  return app
    .openapi(listPostsRoute, async (c) => {
      const allPosts = await postRepository.findAll()
      return c.json(allPosts.map((p) => toPostResponse(p)))
    })
    .openapi(getPostRoute, async (c) => {
      const id = c.req.param("id")
      if (!id) return c.json({ error: "Invalid ID" }, 400)

      const post = await postRepository.findById(id)

      if (!post) {
        return c.json({ error: "Post not found" }, 404)
      }

      return c.json(toPostResponse(post))
    })
    .openapi(createPostRoute, async (c) => {
      const args = c.req.valid("json")
      const savedPost = await postUseCase.createPost(args)
      return c.json(toPostResponse(savedPost), 201)
    })
    .openapi(updatePostRoute, async (c) => {
      const id = c.req.param("id")
      if (!id) return c.json({ error: "Invalid ID" }, 400)
      const args = c.req.valid("json")

      const updatedPost = await postUseCase.updatePost(id, args)

      if (!updatedPost) {
        return c.json({ error: "Post not found" }, 404)
      }

      return c.json(toPostResponse(updatedPost))
    })
    .openapi(deletePostRoute, async (c) => {
      const id = c.req.param("id")
      if (!id) return c.json({ error: "Invalid ID" }, 400)

      const deletedPost = await postUseCase.deletePost(id)

      if (!deletedPost) {
        return c.json({ error: "Post not found" }, 404)
      }

      return c.body(null, 204)
    })
}
