import { OpenAPIHono } from "@hono/zod-openapi"
import { Scalar } from "@scalar/hono-api-reference"
import { cors } from "hono/cors"
import { env } from "@/env"
import { API_VERSIONS } from "../lib/api-versions"
import { authMiddleware } from "./middleware/auth"
import { protectedPostsRoutes } from "./routes/protected/posts"
import { healthRoute, systemRoutes } from "./routes/system"

// Honoアプリケーションの新しいインスタンスを作成し、厳格なルーティングを無効化し、APIのベースパス /api を設定
const app = new OpenAPIHono({ strict: false }).basePath("/api")

app
  // CORS middleware
  .use(
    "/*",
    cors({
      origin: env.NODE_ENV === "development" ? ["http://localhost:3000"] : [],
      credentials: true,
    }),
  )
  // Request logger middleware
  .use("*", async (c, next) => {
    console.log("[Hono] Request:", c.req.method, c.req.url)
    console.log("[Hono] Path:", c.req.path)
    await next()
  })

// v0 API Definition - Chaining is important for type inference!
// v0 API Definition - Chaining is important for type inference!
const v0 = new OpenAPIHono()
  .route("/public", systemRoutes) // v0/public/health etc
  .use("/protected/*", authMiddleware)
  .route("/protected", protectedPostsRoutes) // v0/protected/posts

const routes = app.route("/", healthRoute).route(`/${API_VERSIONS.v0}`, v0) // mount v0 API

app
  // OpenAPI document
  .doc("/doc", {
    openapi: "3.0.0",
    info: {
      version: "0.1.0",
      title: "Webservice Next Hono Base API",
    },
    tags: [
      { name: "System", description: "General system endpoints" },
      { name: "v0/System", description: "v0 System endpoints" },
      { name: "v0/Posts (Public)", description: "v0 Public Post endpoints" },
      {
        name: "v0/Posts (Protected)",
        description: "v0 Protected Post endpoints",
      },
    ],
    "x-tagGroups": [
      {
        name: "General",
        tags: ["System"],
      },
      {
        name: "v0 Public",
        tags: ["v0/System", "v0/Posts (Public)"],
      },
      {
        name: "v0 Protected",
        tags: ["v0/Posts (Protected)"],
      },
    ],
  })
  // API Reference
  .get(
    "/reference",
    Scalar({
      url: "/api/doc",
    }),
  )

export type AppType = typeof routes
export type ApiType = typeof v0
export default app
