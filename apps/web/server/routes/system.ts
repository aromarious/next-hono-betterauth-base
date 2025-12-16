import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"

// Version-less health endpoint
export const healthRoute = new OpenAPIHono().openapi(
  createRoute({
    method: "get",
    path: "/health",
    tags: ["System"],
    responses: {
      200: {
        content: {
          "application/json": {
            schema: z.object({
              status: z.string(),
            }),
          },
        },
        description: "Health check endpoint",
      },
    },
  }),
  (c) => c.json({ status: "ok" }),
)

// Configure v0 system routes (health + hello)
export const systemRoutes = new OpenAPIHono()
  // GET /api/v0/health
  .openapi(
    createRoute({
      method: "get",
      path: "/health",
      tags: ["v0/System"],
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.object({
                status: z.string(),
              }),
            },
          },
          description: "Health check endpoint",
        },
      },
    }),
    (c) => c.json({ status: "ok" }),
  )
  // GET /api/v0/hello
  .openapi(
    createRoute({
      method: "get",
      path: "/hello",
      tags: ["v0/System"],
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.object({
                message: z.string(),
              }),
            },
          },
          description: "Simple hello endpoint",
        },
      },
    }),
    (c) => c.json({ message: "Hello from Hono!" }),
  )
