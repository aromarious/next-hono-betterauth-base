# Google OAuth認証の流れ (Next.js + Hono + Better Auth)

1. サインイン要求 (Client → Hono)

- Next.jsのフロントエンドで、ユーザーが「Googleでサインイン」ボタンを押します。
- Better Authのクライアントライブラリが、Honoで作ったAPIエンドポイント（例: /api/auth/sign-in/social）へリクエストを送ります。

2. Googleへリダイレクト (Hono → Google)

- Hono（Better Auth）は、Googleのログイン画面へのURLを構築し、ブラウザをそこへリダイレクトさせます。
- ここがポイント: この時、セキュリティのための「state（状態）」などが自動的に生成されます。

3. 認証とコールバック (Google → Hono)

- ユーザーがGoogle側で「許可」すると、GoogleはユーザーをあなたのHonoサーバー（例: /api/auth/callback/google）に戻します。
- この時、Googleから一時的な「認証コード」が渡されます。

4. 検証とセッション作成 (Hono ↔ Google & DB)

- ここが一番忙しい場所です。 Hono（Better Auth）は受け取ったコードを使って、Googleサーバーに「このユーザーは本物？」と問い合わせ、プロフィール情報を取得します。
- 問題なければ、Drizzleを使ってデータベースの user テーブルにユーザーを登録（または検索）し、session テーブルにセッション情報を書き込みます。
- 最後に、ブラウザに「セッションCookie」をセットして完了です。
