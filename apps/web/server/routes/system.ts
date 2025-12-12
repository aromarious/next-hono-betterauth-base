import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"

const app = new OpenAPIHono()

export const healthRoute = createRoute({
  method: "get",
  path: "/health",
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
})

export const healthHandler = (c: any) => {
  return c.json({ status: "ok" })
}

app.openapi(healthRoute, healthHandler)

const helloRoute = createRoute({
  method: "get",
  path: "/hello",
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
})

app.openapi(helloRoute, (c) => {
  return c.json({ message: "Hello from Hono!" })
})

export default app
