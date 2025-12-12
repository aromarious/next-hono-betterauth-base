import { createRoute, type OpenAPIHono, z } from "@hono/zod-openapi"

// Version-less health endpoint
const healthRoute = createRoute({
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
})

// v0 health endpoint
const v0HealthRoute = createRoute({
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
})

const helloRoute = createRoute({
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
})

import type { Env } from "hono"

export const configureHealthRoute = <
  E extends Env,
  S extends {},
  P extends string,
>(
  app: OpenAPIHono<E, S, P>,
) => {
  return app.openapi(healthRoute, (c) => {
    return c.json({ status: "ok" })
  })
}

export const configureHelloRoute = <
  E extends Env,
  S extends {},
  P extends string,
>(
  app: OpenAPIHono<E, S, P>,
) => {
  return app.openapi(helloRoute, (c) => {
    return c.json({ message: "Hello from Hono!" })
  })
}

// Configure v0 system routes (health + hello)
export const configureSystemRoutes = <
  E extends Env,
  S extends {},
  P extends string,
>(
  app: OpenAPIHono<E, S, P>,
) => {
  return app
    .openapi(v0HealthRoute, (c) => {
      return c.json({ status: "ok" })
    })
    .openapi(helloRoute, (c) => {
      return c.json({ message: "Hello from Hono!" })
    })
}
