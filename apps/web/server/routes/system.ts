import { Hono } from "hono"

const app = new Hono()
  .get("/health", (c) => {
    return c.json({ status: "ok" })
  })
  .get("/hello", (c) => {
    return c.json({ message: "Hello from Hono!" })
  })

export default app
