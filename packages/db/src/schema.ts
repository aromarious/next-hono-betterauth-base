import { pgTable } from "drizzle-orm/pg-core"
import { ulid } from "ulid"

export const PostTable = pgTable("posts", (t) => ({
  id: t
    .text("id")
    .primaryKey()
    .$defaultFn(() => ulid()),
  title: t.text("title").notNull(),
  content: t.text("content").notNull(),
  createdAt: t.timestamp("created_at").defaultNow().notNull(),
  updatedAt: t.timestamp("updated_at").defaultNow().notNull(),
}))

export type Post = typeof PostTable.$inferSelect
export type NewPost = typeof PostTable.$inferInsert
