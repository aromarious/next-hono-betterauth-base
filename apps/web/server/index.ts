import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "@/env";

const app = new Hono({ strict: false })
  .basePath("/api")
  .use(
    "/*",
    cors({
      origin: env.NODE_ENV === "development" ? ["http://localhost:3000"] : [],
      credentials: true,
    }),
  )
  .use("*", async (c, next) => {
    console.log("[Hono] Request:", c.req.method, c.req.url);
    console.log("[Hono] Path:", c.req.path);
    await next();
  })
  .get("/health", (c) => {
    return c.json({ status: "ok" });
  })
  .get("/hello", (c) => {
    return c.json({ message: "Hello from Hono!" });
  });

export type AppType = typeof app;
export default app;
