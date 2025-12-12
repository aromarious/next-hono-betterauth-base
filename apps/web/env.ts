import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    // Upstash Redis (Rate Limiting)
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
    DISABLE_RATE_LIMIT: z
      .enum(["true", "false"])
      .default("false")
      .transform((val) => val === "true"),
    // Rate Limit Configuration
    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().optional(),
    RATE_LIMIT_WINDOW: z.string().optional(),
  },
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },
  // If you're using Next.js < 13.4.4, you'll need to specify the runtimeEnv manually
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    DISABLE_RATE_LIMIT: process.env.DISABLE_RATE_LIMIT,
    RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS,
    RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW,
  },
  // For Next.js >= 13.4.4, you only need to destructure client variables:
  // experimental__runtimeEnv: {
  //   NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
  // }
  // Skip validation during build time (Vercel, etc.)
  // Validation will run at runtime when the server code is executed
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
})
