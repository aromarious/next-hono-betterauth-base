import { Hono } from "hono"
import { cors } from "hono/cors"
import { env } from "@/env"
import posts from "./routes/posts"
import system from "./routes/system"

// Honoアプリケーションの新しいインスタンスを作成し、厳格なルーティングを無効化し、APIのベースパス /api を設定
const app = new Hono({ strict: false }).basePath("/api")

// v0 アプリケーション (すべての既存ルートはここに移動)
const v0 = new Hono().route("/posts", posts).route("/system", system) // system routes (hello, health) also available under /v0

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

// ルート直下のヘルスチェック (/api/health)
app.get("/health", (c) => c.json({ status: "ok" }))

import { API_VERSIONS } from "../lib/api-versions"

// v0 アプリをマウント (/api/v0)
const routes = app.route(`/${API_VERSIONS.v0}`, v0)

export type AppType = typeof routes
export type ApiV0Type = typeof v0
export default app
