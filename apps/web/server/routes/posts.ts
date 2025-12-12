import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import {
  CreatePostSchema,
  PostSchema,
  UpdatePostSchema,
} from "@/server/domain/post.schema"
import { db } from "@/server/infrastructure/db/client"
import { PostRepositoryImpl as PostRepository } from "@/server/infrastructure/repositories/post.repository.drizzle"
import { PostUseCase } from "@/server/usecase/post.usecase"

// Instantiate repository (Dependency Injection is manual for now)
const postRepository = new PostRepository(db)
const postUseCase = new PostUseCase(postRepository)

const app = new OpenAPIHono()

const tags = ["Posts"]

const listPostsRoute = createRoute({
  method: "get",
  path: "/",
  tags,
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(PostSchema),
        },
      },
      description: "List all posts",
    },
  },
})

app.openapi(listPostsRoute, async (c) => {
  const allPosts = await postRepository.findAll()
  return c.json(allPosts.map((p) => p.toJSON()) as any)
})

const getPostRoute = createRoute({
  method: "get",
  path: "/:id",
  tags,
  responses: {
    200: {
      content: {
        "application/json": {
          schema: PostSchema,
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

app.openapi(getPostRoute, async (c) => {
  const id = c.req.param("id")
  if (!id) return c.json({ error: "Invalid ID" } as any, 400)

  const post = await postRepository.findById(id)

  if (!post) {
    return c.json({ error: "Post not found" } as any, 404)
  }

  return c.json(post.toJSON() as any)
})

const createPostRoute = createRoute({
  method: "post",
  path: "/",
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
          schema: PostSchema,
        },
      },
      description: "Create a new post",
    },
  },
})

app.openapi(createPostRoute, async (c) => {
  const args = c.req.valid("json")
  const savedPost = await postUseCase.createPost(args)
  return c.json(savedPost.toJSON() as any, 201)
})

const updatePostRoute = createRoute({
  method: "put",
  path: "/:id",
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
          schema: PostSchema,
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

app.openapi(updatePostRoute, async (c) => {
  const id = c.req.param("id")
  if (!id) return c.json({ error: "Invalid ID" } as any, 400)
  const args = c.req.valid("json")

  const updatedPost = await postUseCase.updatePost(id, args)

  if (!updatedPost) {
    return c.json({ error: "Post not found" } as any, 404)
  }

  return c.json(updatedPost.toJSON() as any)
})

const deletePostRoute = createRoute({
  method: "delete",
  path: "/:id",
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

app.openapi(deletePostRoute, async (c) => {
  const id = c.req.param("id")
  if (!id) return c.json({ error: "Invalid ID" } as any, 400)

  const deletedPost = await postUseCase.deletePost(id)

  if (!deletedPost) {
    return c.json({ error: "Post not found" } as any, 404)
  }

  return c.body(null, 204)
})

export default app
