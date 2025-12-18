import crypto from "node:crypto"
import fs from "node:fs"
import { test as setup } from "@playwright/test"
import { db } from "../../../packages/db/src/client"
import { SessionTable, UserTable } from "../../../packages/db/src/schema"

const authFile = ".auth/user.json"

setup("seed test user and session", async ({ context }) => {
  if (fs.existsSync(authFile)) {
    // Reuse existing state if needed, or force re-seed
  }

  // Use crypto for unique IDs where needed
  const userId = crypto.randomUUID()
  const sessionId = crypto.randomUUID()
  const sessionToken = crypto.randomBytes(32).toString("hex")

  // 有効期限を1日後に設定
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24)
  const now = new Date()

  try {
    // 1. ユーザーの作成（または更新してID取得）
    // Drizzleのreturning()を使ってIDを取得
    const insertedUsers = await db
      .insert(UserTable)
      .values({
        id: userId,
        name: "Test User",
        email: "test-user@example.com",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: UserTable.email,
        set: {
          name: "Test User",
          emailVerified: true,
          updatedAt: now,
        },
      })
      .returning({ id: UserTable.id })

    const actualUserId = insertedUsers[0]!.id
    console.log("✓ Test user seeded (ID:", actualUserId, ")")

    // 2. セッションの作成
    await db
      .insert(SessionTable)
      .values({
        id: sessionId,
        token: sessionToken,
        userId: actualUserId,
        expiresAt: expiresAt,
        createdAt: now,
        updatedAt: now,
        ipAddress: null,
        userAgent: null,
      })
      .onConflictDoUpdate({
        target: SessionTable.token,
        set: {
          expiresAt: expiresAt,
          updatedAt: now,
        },
      })

    console.log("✓ Test session seeded")

    // 3. ブラウザコンテキストにクッキーを設定
    await context.addCookies([
      {
        name: "better-auth.session_token",
        value: sessionToken,
        domain: "localhost",
        path: "/",
        httpOnly: false,
        secure: false,
        sameSite: "Lax",
        expires: expiresAt.getTime() / 1000,
      },
    ])
    console.log("✓ Session cookie set")

    // 4. 認証状態を保存
    await context.storageState({ path: authFile })
    console.log("✓ Auth state saved to", authFile)
  } catch (error) {
    console.error("DB Seeding failed:", error)
    throw error
  }
})
