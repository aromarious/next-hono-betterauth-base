import { expect, test as setup } from "@playwright/test"
import fs from "fs"

const authFile = ".auth/user.json"

setup("authenticate with Google OAuth", async ({ page, context }) => {
  // 既に認証情報がある場合はスキップ
  if (fs.existsSync(authFile)) {
    console.log("✅ Existing storageState found, skipping login flow")
    return
  }
  // 環境変数チェック
  const testEmail = process.env.GOOGLE_TEST_USER
  const testPassword = process.env.GOOGLE_TEST_PASSWORD

  if (!testEmail || !testPassword) {
    throw new Error(
      "GOOGLE_TEST_USER and GOOGLE_TEST_PASSWORD environment variables are required for E2E tests",
    )
  }

  try {
    // 1. ホームページに移動
    await page.goto("/")

    // 2. 「Googleでサインイン」ボタンをクリック
    await page.click('button:has-text("Googleでサインイン")')

    // 3. Google のログインページが開くまで待機
    await page.waitForURL(/accounts\.google\.com/, { timeout: 10000 })

    // 4. Googleのメールアドレス入力
    await page.fill('input[type="email"]', testEmail)
    await page.click("#identifierNext, button:has-text('Next')")

    // 5. パスワード入力（ページ遷移を待つ）
    await page.waitForSelector('input[type="password"]', { timeout: 10000 })
    await page.fill('input[type="password"]', testPassword)
    await page.click("#passwordNext, button:has-text('Next')")

    // 6. Google OAuthの承認画面が表示された場合は「許可」をクリック
    try {
      // 承認画面の「許可」ボタンを待機（タイムアウトは短めに）
      const consentButton = page.locator(
        'button:has-text("許可"), button:has-text("Allow")',
      )
      await consentButton.waitFor({ state: "visible", timeout: 5000 })
      await consentButton.click()
      console.log("✓ Clicked Google consent button")
    } catch (e) {
      // 承認画面が表示されない場合はスキップ（既に承認済みの場合）
      console.log("ℹ No consent screen (already authorized)")
    }

    // 6.5. 「再ログインしようとしています」画面が表示された場合は「次へ」をクリック
    try {
      const continueButton = page.locator(
        'button:has-text("次へ"), button:has-text("Next")',
      )
      await continueButton.waitFor({ state: "visible", timeout: 5000 })
      await continueButton.click()
      console.log("✓ Clicked re-login confirmation button")
    } catch (e) {
      // 再ログイン確認画面が表示されない場合はスキップ
      console.log("ℹ No re-login confirmation screen")
    }

    // 7. アプリにリダイレクトされるまで待機
    // Google OAuthの承認画面がある場合はそれも処理
    await page.waitForURL((url) => url.origin === "http://localhost:3001", {
      timeout: 30000,
    })

    // 7. 認証が成功したか確認（セッションクッキーが設定されているか）
    const cookies = await context.cookies()
    const sessionCookie = cookies.find((c) => c.name.includes("session_token"))

    if (!sessionCookie) {
      throw new Error("Session cookie not found after authentication")
    }

    console.log("✓ Session cookie found:", sessionCookie.name)

    // 8. 認証状態を保存
    await context.storageState({ path: authFile })

    console.log("✓ Google OAuth authentication setup complete")
  } catch (error) {
    console.error("Authentication setup failed:", error)
    // デバッグ用にスクリーンショットを保存
    await page.screenshot({ path: ".auth/auth-failure.png", fullPage: true })
    throw error
  }
})
