import { pgTable } from "drizzle-orm/pg-core"
import { ulid } from "ulid"

export const users = pgTable("users", (t) => ({
  id: t
    .text("id")
    .primaryKey()
    .$defaultFn(() => ulid()),
  name: t.text("name"),
  email: t.text("email").notNull(),
  createdAt: t.timestamp("created_at").defaultNow().notNull(),
}))

export const posts = pgTable("posts", (t) => ({
  id: t
    .text("id")
    .primaryKey()
    .$defaultFn(() => ulid()),
  title: t.text("title").notNull(),
  content: t.text("content").notNull(),
  createdAt: t.timestamp("created_at").defaultNow().notNull(),
  updatedAt: t.timestamp("updated_at").defaultNow().notNull(),
}))

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
