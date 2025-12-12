import type { Config } from "drizzle-kit"
import { env } from "@/env"

export default {
  schema: "./server/infrastructure/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
} satisfies Config
