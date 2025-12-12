import { OpenAPIHono } from "@hono/zod-openapi"
import { Scalar } from "@scalar/hono-api-reference"
import { cors } from "hono/cors"
import { env } from "@/env"
import { configurePostsRoutes } from "./routes/posts"
import { configureHealthRoute, configureSystemRoutes } from "./routes/system"

// Honoアプリケーションの新しいインスタンスを作成し、厳格なルーティングを無効化し、APIのベースパス /api を設定
const app = new OpenAPIHono({ strict: false }).basePath("/api")

configureHealthRoute(app)

// v0 アプリケーション (すべての既存ルートはここに移動)
const v0 = new OpenAPIHono()
const v0_with_system = configureSystemRoutes(v0)
const v0_final = configurePostsRoutes(v0_with_system)

app
  // CORS ミドルウェアをすべてのルート (`/*`) に適用し、異なるオリジンからのリクエストを許可します。
  .use(
    "/*",
    cors({
      origin: env.NODE_ENV === "development" ? ["http://localhost:3000"] : [],
      credentials: true,
    }),
  )
  // すべてのルート (`*`) に適用されるグローバルなミドルウェアを設定する
  .use("*", async (c, next) => {
    console.log("[Hono] Request:", c.req.method, c.req.url)
    console.log("[Hono] Path:", c.req.path)
    await next()
  })

// OpenAPI Spec definitions
app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    version: "0.1.0",
    title: "Webservice Next Hono Base API",
  },
  tags: [
    { name: "System", description: "General system endpoints" },
    { name: "v0/System", description: "v0 System endpoints" },
    { name: "v0/Posts", description: "v0 Post management endpoints" },
  ],
  "x-tagGroups": [
    {
      name: "General",
      tags: ["System"],
    },
    {
      name: "v0",
      tags: ["v0/System", "v0/Posts"],
    },
  ],
})

// Scalar API Reference
app.get(
  "/reference",
  Scalar({
    url: "/api/doc",
  }),
)

import { API_VERSIONS } from "../lib/api-versions"

// v0 アプリをマウント (/api/v0)
const routes = app.route(`/${API_VERSIONS.v0}`, v0_final)

export type AppType = typeof routes
export type ApiV0Type = typeof v0_final
export default app
