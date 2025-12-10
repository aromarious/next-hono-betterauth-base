import { Hono } from "hono"
import { cors } from "hono/cors"
import { env } from "@/env"
import posts from "./routes/posts"
import system from "./routes/system"

// Honoアプリケーションの新しいインスタンスを作成し、厳格なルーティングを無効化し、APIのベースパス /api を設定
const app = new Hono({ strict: false }).basePath("/api")
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

const routes = app //
  .route("/", system)
  .route("/posts", posts)

export type AppType = typeof routes
export default app
