import { createMiddleware } from "hono/factory"
import { auth } from "@/lib/auth"

type AuthVariables = {
  user: typeof auth.$Infer.Session.user
  session: typeof auth.$Infer.Session.session
}

declare module "hono" {
  interface ContextVariableMap extends AuthVariables {}
}

export const authMiddleware = createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })

  if (!session) {
    // Fallback: Manual DB Lookup for E2E/Debug
    // STRICTLY RESTRICTED TO E2E ENVIRONMENT
    if (process.env.NEXT_E2E === "true") {
      const cookieHeader = c.req.raw.headers.get("cookie")
      if (cookieHeader) {
        const tokenMatch = cookieHeader.match(
          /better-auth\.session_token=([^;]+)/,
        )
        if (tokenMatch) {
          const token = tokenMatch[1]!

          // Import everything from @packages/db which exports drizzle-orm stuff
          const { db, eq, SessionTable, UserTable } = await import(
            "@packages/db"
          )

          // 1. Find Session
          const dbSession = await db
            .select()
            .from(SessionTable)
            .where(eq(SessionTable.token, token))

          if (dbSession.length > 0) {
            const s = dbSession[0]
            // Check expiry
            if (s && s.expiresAt > new Date()) {
              // 2. Find User
              const dbUser = await db
                .select()
                .from(UserTable)
                .where(eq(UserTable.id, s.userId))
              const u = dbUser[0]

              if (u) {
                // Set context manually
                c.set("user", u)
                c.set("session", s)
                return next()
              }
            }
          }
        }
      }
    }

    return c.json(
      {
        error: "Unauthorized",
      },
      401,
    )
  }

  c.set("user", session.user)
  c.set("session", session.session)

  return next()
})
