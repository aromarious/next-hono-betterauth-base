# ベース構築タスク

WebService-Next-Hono-Base プロジェクトのベース構築を段階的に進めるためのタスク定義書です。

---

## 🎯 ベース提供レベルの定義

### **Level 1: スケルトンベース** ⚡
**最小限の構造のみ**

#### 含むもの ✅
- [ ] ディレクトリ構造（完全）
- [ ] package.json, pnpm-workspace.yaml
- [ ] dev/ フォルダの設定ファイル群
- [ ] docker-compose.yml
- [ ] 基本的なtsconfig, eslint設定
- [ ] README・ドキュメント類

#### 含まないもの ❌
- 実装コード
- 動作するアプリケーション

---

### **Level 2: 動作ベース** 🚀
**Hello World が動く状態**

#### Level 1 + 以下を追加 ✅
- [ ] 基本的なHonoサーバー（Hello World API）
- [ ] 基本的なNext.jsアプリ（Welcome ページ）
- [ ] Drizzle DB接続コード
- [ ] OpenAPI スキーマの最小構成
- [ ] 基本的なコード生成スクリプト

#### 動作確認目標
```bash
pnpm dev:api  # http://localhost:8787/hello → "Hello World"
pnpm dev:web  # http://localhost:3000 → Welcome ページ表示
```

---

### **Level 3: 認証ベース** 🔐 **← 推奨実装レベル**
**ログイン機能まで完全実装**

#### Level 2 + 以下を追加 ✅
- [ ] Better Auth 完全統合
- [ ] ユーザー登録・ログイン・ログアウト
- [ ] セッション管理・認証ミドルウェア  
- [ ] ユーザープロファイル表示（/me API）
- [ ] 認証が必要なページの実装
- [ ] Basic UIコンポーネント（ログインフォーム等）

#### 実用性
すぐに認証付きアプリ開発が始められる状態

---

### **Level 4: フル機能ベース** 🏢
**本番運用レベル（将来的な拡張）**

#### Level 3 + 以下を追加 ✅
- [ ] RBAC（ロール・権限管理）
- [ ] 高度なエラーハンドリング
- [ ] ログ・モニタリング（Sentry, OpenTelemetry）
- [ ] 完全なテストコード
- [ ] CI/CDパイプライン
- [ ] パフォーマンス最適化

---

## 🚧 Level 1: スケルトンベース 構築タスク

### 1. プロジェクト構造の作成

#### ディレクトリ構造
```bash
mkdir -p webservice-next-hono-base/{apps/{web,api},packages/{domain,application,infrastructure,shared-openapi},ops/db,dev/{eslint,tsconfig,tailwind,vite,bundler,codegen}}
```

#### 基本ファイル
- [ ] `package.json` - ルートパッケージ設定
- [ ] `pnpm-workspace.yaml` - モノレポ設定
- [ ] `turbo.json` - Turbo設定
- [ ] `.gitignore` - Git除外設定
- [ ] `docker-compose.yml` - PostgreSQL設定

### 2. 開発環境設定 (dev/)

- [ ] `dev/eslint/` - ESLint設定
- [ ] `dev/tsconfig/` - TypeScript設定
- [ ] `dev/tailwind/` - Tailwind設定
- [ ] `dev/vite/` - Vite設定
- [ ] `dev/bundler/` - tsup/esbuild設定
- [ ] `dev/codegen/` - コード生成スクリプト

### 3. 各パッケージの基本構造

- [ ] `apps/web/package.json` - Next.js設定
- [ ] `apps/api/package.json` - Hono設定
- [ ] `packages/*/package.json` - 各パッケージ設定

### 4. ドキュメント

- [ ] `README.md` - プロジェクト説明
- [ ] `webservice-next-hono-base-spec.md` - 仕様書
- [ ] `development-workflow.md` - 開発ワークフロー

---

## 🚧 Level 2: 動作ベース 構築タスク

### 1. Hono API サーバー (apps/api/)

- [ ] `src/index.ts` - メインサーバーファイル
- [ ] `src/routes/hello.ts` - Hello World エンドポイント
- [ ] 基本的なCORS設定
- [ ] 基本的なエラーハンドリング

```typescript
// GET /hello → { message: "Hello World" }
```

### 2. Next.js Web アプリ (apps/web/)

- [ ] `src/app/page.tsx` - Welcome ページ
- [ ] `src/app/layout.tsx` - 基本レイアウト
- [ ] 基本的なTailwind設定
- [ ] API接続の基本設定

### 3. データベース接続 (ops/db/)

- [ ] `schema.ts` - 基本スキーマ定義
- [ ] Drizzle設定ファイル
- [ ] 基本的な接続コード

### 4. OpenAPI スキーマ (packages/shared-openapi/)

- [ ] `openapi.yaml` - 基本スキーマ
- [ ] Hello World エンドポイントの定義
- [ ] 型生成スクリプトの設定
- [ ] API設計ガイドラインに準拠した設計

### 5. コード生成 (dev/codegen/)

- [ ] OpenAPI型生成スクリプト
- [ ] Drizzle型生成スクリプト
- [ ] package.json scripts設定

### 6. 基本的なCI/CD設定

- [ ] `.github/workflows/ci.yml` - 基本CI設定
- [ ] `.github/workflows/cd.yml` - 基本CD設定
- [ ] GitHub Actions secrets設定
- [ ] Turbo でのキャッシュ最適化

---

## 🚧 Level 3: 認証ベース 構築タスク **← 推奨実装**

### 1. Better Auth 統合

- [ ] Better Auth設定
- [ ] Drizzle Adapter設定
- [ ] 認証関連の環境変数定義

### 2. ユーザー管理 DB スキーマ

- [ ] users テーブル
- [ ] sessions テーブル
- [ ] マイグレーションファイル

```sql
-- users テーブル
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  name VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- sessions テーブル  
CREATE TABLE sessions (
  id VARCHAR PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  expires_at TIMESTAMP NOT NULL
);
```

### 3. 認証 API エンドポイント (apps/api/)

- [ ] `POST /auth/register` - ユーザー登録
- [ ] `POST /auth/login` - ログイン
- [ ] `POST /auth/logout` - ログアウト
- [ ] `GET /me` - ユーザー情報取得
- [ ] 認証ミドルウェアの実装

### 4. フロントエンド認証 (apps/web/)

- [ ] `/login` - ログインページ
- [ ] `/register` - 登録ページ
- [ ] `/dashboard` - 認証後ダッシュボード
- [ ] ログイン状態管理（Context/State）
- [ ] 認証ガード（ProtectedRoute）

### 5. UI コンポーネント

- [ ] ログインフォーム
- [ ] 登録フォーム
- [ ] ナビゲーション（ログイン状態対応）
- [ ] 基本的なレスポンシブデザイン

### 6. OpenAPI スキーマ更新

- [ ] 認証エンドポイントの定義
- [ ] ユーザー情報のスキーマ定義
- [ ] エラーレスポンスの定義
- [ ] API設計ガイドラインに準拠した統一設計

### 7. ドメイン・アプリケーション層

- [ ] `packages/domain/` - ユーザードメインロジック
- [ ] `packages/application/` - 認証ユースケース
- [ ] `packages/infrastructure/` - DB操作・外部I/F

---

## 🔄 CI/CD パイプライン構築

### Level 2: 基本的なCI/CD

#### 継続的インテグレーション (CI)
- [ ] **コード品質チェック**
  ```yaml
  # .github/workflows/ci.yml
  - Lint (ESLint + Prettier)
  - 型チェック (TypeScript)
  - テスト実行 (Jest/Vitest)
  - OpenAPI スキーマ検証
  ```

- [ ] **ビルド検証**
  ```yaml
  - Next.js ビルド
  - Hono ビルド
  - Docker イメージビルド
  ```

- [ ] **セキュリティチェック**
  ```yaml
  - 依存関係脆弱性スキャン
  - Secretsリーク検出
  ```

#### 継続的デプロイメント (CD)
- [ ] **環境別デプロイ**
  ```yaml
  # .github/workflows/cd.yml
  - Development 環境 (main ブランチ)
  - Staging 環境 (release ブランチ)
  - Production 環境 (タグベース)
  ```

- [ ] **Infisical 統合**
  ```yaml
  - 環境変数の自動注入
  - シークレット管理
  ```

### Level 3: 高度なCI/CD機能

#### テスト戦略
- [ ] **多段階テスト**
  ```yaml
  - 単体テスト (packages/*)
  - 統合テスト (API + DB)
  - E2E テスト (Playwright)
  - 認証フローテスト
  ```

- [ ] **データベーステスト**
  ```yaml
  - PostgreSQL Test Container
  - マイグレーションテスト
  - シードデータテスト
  ```

#### デプロイ戦略
- [ ] **Blue-Green デプロイ**
- [ ] **カナリアリリース**
- [ ] **ロールバック機能**

### Level 4: 本番運用レベルCI/CD

#### 監視・アラート
- [ ] **パフォーマンス監視**
  ```yaml
  - Lighthouse CI
  - Bundle サイズ監視
  - API レスポンス時間
  ```

- [ ] **品質ゲート**
  ```yaml
  - テストカバレッジ閾値
  - セキュリティスコア
  - パフォーマンス指標
  ```

#### インフラ管理
- [ ] **Infrastructure as Code**
  ```yaml
  - Terraform / Pulumi
  - Docker Compose 本番設定
  - Kubernetes マニフェスト
  ```

---

## 📁 CI/CD ファイル構成

### GitHub Actions ワークフロー

```
.github/
  workflows/
    ci.yml           # 基本的なCI（Lint, Test, Build）
    cd-dev.yml       # 開発環境デプロイ
    cd-staging.yml   # ステージング環境デプロイ
    cd-prod.yml      # 本番環境デプロイ
    security.yml     # セキュリティスキャン
    performance.yml  # パフォーマンステスト
  dependabot.yml     # 依存関係自動更新
```

### 設定ファイル

```
dev/
  ci/
    jest.config.js     # テスト設定
    playwright.config.js  # E2Eテスト設定
    lighthouse.config.js  # パフォーマンステスト
    security.config.js    # セキュリティスキャン設定
```

---

## 🔧 CI/CD 実装タスク詳細

### 1. 基本CI設定 (.github/workflows/ci.yml)

```yaml
name: CI
on: [push, pull_request]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
      
      # 依存関係インストール
      - run: pnpm install --frozen-lockfile
      
      # Lint & Format
      - run: pnpm lint
      - run: pnpm format:check
      
      # 型チェック
      - run: pnpm type-check
      
      # OpenAPI検証
      - run: pnpm openapi:validate
      
      # テスト実行
      - run: pnpm test
      
      # ビルド
      - run: pnpm build
```

### 2. 環境別デプロイ設定

- [ ] **開発環境デプロイ**
  ```yaml
  # main ブランチにpush時
  - Infisical dev環境の環境変数使用
  - 開発用データベース接続
  - 自動デプロイ
  ```

- [ ] **ステージング環境デプロイ**
  ```yaml
  # release/* ブランチ作成時
  - Infisical staging環境の環境変数使用
  - 本番相当のデータベース
  - マニュアル承認後デプロイ
  ```

- [ ] **本番環境デプロイ**
  ```yaml
  # v*.*.* タグ作成時
  - Infisical prod環境の環境変数使用
  - 本番データベース
  - マニュアル承認 + ロールバック対応
  ```

### 3. Infisical統合

```yaml
# GitHub Actions with Infisical
- name: Deploy with Infisical
  run: |
    # Infisical CLI インストール
    npm install -g @infisical/cli
    
    # 認証（GitHub Secrets使用）
    infisical login --method=universal-auth \
      --client-id=${{ secrets.INFISICAL_CLIENT_ID }} \
      --client-secret=${{ secrets.INFISICAL_CLIENT_SECRET }}
    
    # 環境変数を注入してデプロイ
    infisical run --env=prod -- pnpm deploy
```

### 4. テスト環境設定

- [ ] **PostgreSQL Test Container**
- [ ] **Redis Test Container**
- [ ] **E2E テスト用のテストデータ**
- [ ] **認証フローの自動テスト**

---

## 🎯 実装優先順位

### フェーズ 1: 基盤構築
1. Level 1 (スケルトンベース) の完全実装
2. 開発環境の整備・テスト

### フェーズ 2: 動作確認
1. Level 2 (動作ベース) の実装
2. Hello World の動作確認
3. 基本的なCI/CD設定

### フェーズ 3: 認証機能
1. Level 3 (認証ベース) の実装
2. 完全なログイン機能の実装
3. セキュリティテストの実施

### フェーズ 4: 高度化（将来）
1. Level 4 (フル機能ベース) の検討
2. 本番運用機能の追加

---

## ✅ 完了チェックリスト

### Level 3 完了時の動作確認

#### 基本動作
- [ ] `pnpm install` が正常に完了
- [ ] `pnpm dev:api` でAPIサーバーが起動
- [ ] `pnpm dev:web` でWebアプリが起動
- [ ] PostgreSQL接続が正常

#### 認証フロー
- [ ] ユーザー登録が正常に動作
- [ ] ログインが正常に動作
- [ ] ログアウトが正常に動作
- [ ] 認証が必要なページへのアクセス制御
- [ ] セッション管理が正常

#### 型安全性
- [ ] OpenAPI型生成が正常に動作
- [ ] フロントエンド・バックエンド間の型の整合性
- [ ] TypeScriptコンパイルが正常

#### CI/CD パイプライン
- [ ] GitHub Actions ワークフローが正常動作
- [ ] Lint・テスト・ビルドが自動実行
- [ ] Infisical統合が正常動作
- [ ] 環境別デプロイが機能
- [ ] セキュリティチェックが実行
- [ ] テストカバレッジが適切

#### ドキュメント
- [ ] README.mdが完全
- [ ] 開発ワークフローが動作
- [ ] Infisical設定が正常

---

## 🚀 次のステップ

Level 3 完了後は、プロジェクト固有の機能開発に集中できます：

- ビジネスロジックの実装
- 独自のUI/UXの構築
- 外部APIとの連携
- 本番環境への展開

---

© 2025 WebService-Next-Hono-Base Development Team
