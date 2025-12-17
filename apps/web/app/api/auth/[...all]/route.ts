import { OpenAPIHono } from "@hono/zod-openapi"
import { handle } from "hono/vercel"
import { auth } from "@/lib/auth" // import your better-auth instance

const app = new OpenAPIHono({ strict: false }).basePath("/api/auth")
app.all("*", (c) => {
  return auth.handler(c.req.raw)
})
export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const DELETE = handle(app)
export const PATCH = handle(app)
