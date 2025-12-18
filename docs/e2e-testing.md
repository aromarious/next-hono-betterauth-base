# E2E認証セットアップ

## 必要な環境変数

E2Eテストを実行するには、以下の環境変数をInfisical staging環境に設定する必要があります：

```bash
# Google OAuthテスト用の認証情報
GOOGLE_TEST_USER=your-test-email@gmail.com
GOOGLE_TEST_PASSWORD=your-test-password

# Google OAuth設定
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Better Auth設定
BETTER_AUTH_SECRET=your-secret
BETTER_AUTH_URL=http://localhost:3001
```

## セットアップ

1. テスト専用のGoogleアカウントを作成（または既存のテストアカウントを使用）
2. このアカウントの2FAを無効化（または必要に応じてTOTP自動化を使用）
3. [Google Cloud Console](https://console.cloud.google.com/apis/credentials)でリダイレクトURIを追加
   - `http://localhost:3001/api/auth/callback/google`

## E2Eテストの実行方法

### 基本的な実行

```bash
# プロジェクトルートから（推奨）
pnpm -F web test:e2e

# または apps/web ディレクトリから
cd apps/web
pnpm test:e2e
```

### 特定のテストを実行

```bash
# Posts APIテストのみ実行
pnpm -F web test:e2e test-e2e/api/posts.spec.ts

# ブラウザを表示して実行（headedモード）
pnpm -F web test:e2e --headed

# デバッグモード
pnpm -F web test:e2e --debug

# 複数のオプションを組み合わせ
pnpm -F web test:e2e --headed test-e2e/api/posts.spec.ts
```

**Tip:** `pnpm test:e2e`の後に渡したすべての引数は、自動的に`playwright test`に渡されます。

### レートリミットテスト

レートリミットテストは専用のスクリプトで実行します（通常のE2Eではレートリミットは無効化されています）：

```bash
cd apps/web
pnpm test:e2e:ratelimit
```

## 実行時間

**初回実行:**

- 約20秒（Google OAuth認証セットアップ + テスト実行）
- 認証セッションが`.auth/user.json`に保存されます

**2回目以降:**

- 約10秒（保存された認証状態を再利用）

## 仕組み

### 認証フロー

`auth.setup.ts`ファイルが以下を自動実行します：

1. ホームページに移動
2. 「Googleでサインイン」ボタンをクリック
3. Google OAuthフォームにテスト用認証情報を入力
4. 同意画面で「許可」をクリック（初回のみ）
5. アプリへのリダイレクトが成功するまで待機
6. 認証済みセッションを`.auth/user.json`に保存

すべての後続テストは、この保存された認証状態を自動的に使用します。

### レートリミット設定

- **通常のE2Eテスト**: `DISABLE_RATE_LIMIT=true`でレートリミット無効
- **レートリミットテスト**: `DISABLE_RATE_LIMIT=false`で有効化

## トラブルシューティング

### 認証が失敗した場合

- `.auth/auth-failure.png`を確認して、どこで失敗したかのスクリーンショットを確認
- `GOOGLE_TEST_USER`と`GOOGLE_TEST_PASSWORD`が正しいか確認
- テスト用Googleアカウントで2FAが無効になっているか確認
- Googleが自動ログインをブロックしていないか確認（専用のテストアカウントを使用してください）

### 環境変数が見つからないエラー

```
Error: GOOGLE_TEST_USER and GOOGLE_TEST_PASSWORD environment variables are required
```

この場合、Infisical staging環境に環境変数が設定されているか確認してください：

```bash
infisical export --env=staging
```

### HTMLレポートの表示

テスト失敗時の詳細を確認：

```bash
pnpm exec playwright show-report
```
