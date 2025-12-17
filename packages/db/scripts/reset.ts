import postgres from "postgres"
import { env } from "../src/env"

const reset = async () => {
  const sql = postgres(env.DATABASE_URL)

  console.log("🗑️  Dropping public schema...")
  // Drop and recreate public schema to clear all tables/enums/types
  await sql`DROP SCHEMA IF EXISTS drizzle CASCADE`
  await sql`DROP SCHEMA IF EXISTS public CASCADE`
  await sql`CREATE SCHEMA public`

  // Restore default permissions
  await sql`GRANT ALL ON SCHEMA public TO public`
  await sql`COMMENT ON SCHEMA public IS 'standard public schema'`

  console.log("✅ Public schema reset complete.")
  await sql.end()
}

reset().catch((err) => {
  console.error(err)
  process.exit(1)
})
