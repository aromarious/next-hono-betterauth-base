import { relations } from "drizzle-orm/relations"
import { account, posts, session, user } from "./schema"

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}))

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  posts: many(posts),
  accounts: many(account),
}))

export const postsRelations = relations(posts, ({ one }) => ({
  user: one(user, {
    fields: [posts.userId],
    references: [user.id],
  }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))
