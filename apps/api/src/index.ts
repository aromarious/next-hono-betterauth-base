import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono({ strict: false })
  .use(
    "/*",
    cors({
      origin:
        process.env.NODE_ENV === "development" ? ["http://localhost:3000"] : [],
      credentials: true,
    }),
  )
  // デバッグ用 (本番環境では削除可能)
  .use("*", async (c, next) => {
    console.log("[Hono] Request:", c.req.method, c.req.url);
    console.log("[Hono] Path:", c.req.path);
    await next();
  })
  // Next.jsの /api/[[...route]] から呼ばれるため、/api でルートを定義
  .get("/api", (c) => {
    return c.json({ message: "Hello Hono!" });
  })
  // その他のAPIルートもここに追加可能
  .get("/api/test", (c) => {
    return c.json({ message: "Test endpoint" });
  });

export type AppType = typeof app;
export default app;
