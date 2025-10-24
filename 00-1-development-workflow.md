# 開発ワークフロー ガイド

WebService-Next-Hono-Base プロジェクトの開発手順とベストプラクティスを定義します。

---

## ✅ 開発開始前の事前準備チェックリスト

ベースプロジェクトをcloneした後、開発を開始する前に以下の準備を完了しておく必要があります。

### 🛠️ 開発環境の準備

#### 必須ツール
- [ ] **Node.js** (v18以上推奨)
- [ ] **pnpm** (パッケージマネージャー)
- [ ] **Docker & Docker Compose** (PostgreSQL用)
- [ ] **Git** (バージョン管理)

```bash
# バージョン確認
node --version
pnpm --version  
docker --version
docker-compose --version
```

#### 推奨ツール
- [ ] **VS Code** + 推奨エクステンション
  - TypeScript
  - ESLint
  - Prettier
  - Thunder Client (API テスト用)
- [ ] **Postman** または **Insomnia** (API テスト用)

### 🔐 Infisical の準備

- [ ] **Infisical アカウント作成** ([infisical.com](https://infisical.com))
- [ ] **新しいプロジェクト作成** (例: `webservice-next-hono-base`)
- [ ] **環境の作成** (`dev`, `staging`, `prod`)
- [ ] **チームメンバーの招待** (必要に応じて)

### 📊 データベースの準備

- [ ] **PostgreSQL の準備**
  - Docker Compose での起動 (推奨)
  - またはローカルインストール
- [ ] **データベース作成** (例: `webservice_dev`)
- [ ] **接続情報の確認**

### 🔑 必須環境変数の設定

Infisical プロジェクトに以下の環境変数を設定：

#### 開発環境 (dev)
```
# データベース
DATABASE_URL=postgresql://user:password@localhost:5432/webservice_dev

# 認証 (Better Auth)
BETTER_AUTH_SECRET=your-super-secret-key-here
BETTER_AUTH_URL=http://localhost:3000

# API設定
API_PORT=8787
API_CORS_ORIGIN=http://localhost:3000

# Next.js
NEXTAUTH_URL=http://localhost:3000
```

#### 本番環境 (prod)
```
# データベース
DATABASE_URL=postgresql://user:password@prod-db:5432/webservice_prod

# 認証
BETTER_AUTH_SECRET=production-secret-key
BETTER_AUTH_URL=https://yourdomain.com

# API設定
API_PORT=8787
API_CORS_ORIGIN=https://yourdomain.com

# Next.js
NEXTAUTH_URL=https://yourdomain.com
```

### 🎯 オプション設定

以下は必要に応じて設定：

```
# エラートラッキング (Sentry)
SENTRY_DSN=https://your-sentry-dsn

# 外部API (例)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Redis (セッション管理等)
REDIS_URL=redis://localhost:6379

# OpenTelemetry
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
```

### 📋 設定完了確認

すべての準備が完了したら、以下で動作確認：

```bash
# 1. リポジトリクローン
git clone <repository-url>
cd webservice-next-hono-base

# 2. 依存関係インストール
pnpm install

# 3. Infisical 認証
infisical login

# 4. プロジェクト初期化（チームメンバーから招待されている場合）
infisical init

# 5. データベース起動
docker-compose up -d postgres

# 6. データベース初期化
infisical run --env=dev -- pnpm db:push

# 7. 開発サーバー起動テスト
infisical run --env=dev -- pnpm dev:api    # http://localhost:8787
infisical run --env=dev -- pnpm dev:web    # http://localhost:3000
```

### 🚨 よくある問題と対処法

#### Infisical 関連
```bash
# プロジェクトが見つからない場合
infisical projects list

# 権限がない場合
# → チームリーダーにInfisicalプロジェクトへの招待を依頼

# 環境変数が取得できない場合
infisical secrets --env=dev
```

#### データベース関連
```bash
# PostgreSQL コンテナが起動しない場合
docker-compose logs postgres

# ポートが使用中の場合
lsof -i :5432
# → 別のPostgreSQLを停止するか、docker-compose.ymlでポート変更
```

### 👥 チーム開発での注意点

- **Infisical プロジェクト**: チームリーダーが作成し、メンバーを招待
- **環境変数の管理**: 個人でローカル用の `.env` は作成しない
- **データベース**: 各開発者が独自のローカルDBを使用
- **API キー**: 開発用と本番用で異なるキーを使用
- **ブランチ戦略**: 環境変数の変更は慎重に行い、レビューを必須に

---

## 🚀 初期セットアップ

### 1. プロジェクトのクローンと依存関係のインストール

```bash
git clone <repository-url>
cd webservice-next-hono-base
pnpm install
```

### 2. 環境変数の設定（Infisical）

```bash
# Infisical CLI をインストール
npm install -g @infisical/cli

# Infisical にログイン
infisical login

# プロジェクトを初期化（初回のみ）
infisical init

# 環境変数を確認（任意）
infisical secrets --env=dev
```

> **重要**: 環境変数は `.env` ファイルに保存せず、`infisical run` コマンドで  
> 実行時に直接注入します。これによりセキュリティが向上します。

### 3. データベースの初期化

```bash
# PostgreSQL コンテナを起動
docker-compose up -d postgres

# Infisical 環境変数を注入してDrizzle マイグレーションを実行
infisical run --env=dev -- pnpm db:push
```

---

## 🔄 日常的な開発サイクル

### Phase 1: API仕様の定義（Contract First）

1. **OpenAPI スキーマの更新**
   ```bash
   # packages/shared-openapi/openapi.yaml を編集
   vim packages/shared-openapi/openapi.yaml
   ```

2. **型定義の自動生成**
   ```bash
   # OpenAPIから TypeScript 型を生成
   pnpm openapi:gen
   ```

3. **スキーマの検証**
   ```bash
   # OpenAPI スキーマの妥当性をチェック
   pnpm openapi:validate
   ```

### Phase 2: データベーススキーマの更新

1. **Drizzle スキーマの編集**
   ```bash
   # ops/db/schema.ts を更新
   vim ops/db/schema.ts
   ```

2. **マイグレーションの生成と適用**
   ```bash
   # マイグレーションファイルを生成
   infisical run --env=dev -- pnpm db:generate

   # データベースに反映
   infisical run --env=dev -- pnpm db:push
   ```

### Phase 3: バックエンド実装

1. **ドメイン層の実装**
   ```bash
   # ビジネスロジックを実装
   # packages/domain/
   ```

2. **ユースケース層の実装**
   ```bash
   # アプリケーションロジックを実装
   # packages/application/
   ```

3. **API ハンドラーの実装**
   ```bash
   # Hono ハンドラーを実装
   # apps/api/src/routes/
   ```

4. **API サーバーの起動とテスト**
   ```bash
   # Infisical 環境変数を注入してAPI サーバーを起動
   infisical run --env=dev -- pnpm dev:api

   # 別ターミナルでテスト実行
   infisical run --env=dev -- pnpm test:api
   ```

### Phase 4: フロントエンド実装

1. **Next.js アプリケーションの実装**
   ```bash
   # フロントエンドコンポーネントを実装
   # apps/web/src/
   ```

2. **Web アプリケーションの起動**
   ```bash
   # Infisical 環境変数を注入してWeb サーバーを起動
   infisical run --env=dev -- pnpm dev:web
   ```

3. **統合テスト**
   ```bash
   # フロントエンド + API の結合テスト
   infisical run --env=dev -- pnpm test:e2e
   ```

---

## 🧪 テスト戦略

### 単体テスト
```bash
# ドメイン層のテスト
pnpm test:domain

# アプリケーション層のテスト
pnpm test:application

# API ハンドラーのテスト
pnpm test:api
```

### 統合テスト
```bash
# データベース込みの統合テスト
infisical run --env=dev -- pnpm test:integration

# E2E テスト
infisical run --env=dev -- pnpm test:e2e
```

### 型チェック
```bash
# TypeScript 型チェック
pnpm type-check

# OpenAPI スキーマ整合性チェック
pnpm openapi:check
```

---

## 🔍 コード品質管理

### リント・フォーマット
```bash
# ESLint チェック
pnpm lint

# Prettier フォーマット
pnpm format

# 自動修正
pnpm lint:fix
```

### コミット前チェック
```bash
# プリコミットフック（husky + lint-staged）
# 自動実行：lint + format + type-check
```

---

## 🚢 デプロイメントフロー

### 開発環境
```bash
# 開発環境用ビルド（環境変数を注入）
infisical run --env=dev -- pnpm build:dev

# 開発環境デプロイ（環境変数を注入）
infisical run --env=dev -- pnpm deploy:dev
```

### 本番環境
```bash
# 本番用ビルド（環境変数を注入）
infisical run --env=prod -- pnpm build:prod

# 本番環境デプロイ（環境変数を注入）
infisical run --env=prod -- pnpm deploy:prod
```

---

## 📋 チェックリスト

### 新機能開発時
- [ ] OpenAPI スキーマを先に定義
- [ ] 型生成が正常に動作することを確認
- [ ] データベーススキーマの更新（必要な場合）
- [ ] ドメイン層のテストを作成
- [ ] API ハンドラーの実装とテスト
- [ ] フロントエンドの実装
- [ ] E2E テストの作成
- [ ] セキュリティチェック（認証・認可）

### コードレビュー時
- [ ] OpenAPI スキーマとの整合性
- [ ] 型安全性の確保
- [ ] エラーハンドリング
- [ ] テストカバレッジ
- [ ] パフォーマンス影響
- [ ] セキュリティ観点

---

## 🛠️ トラブルシューティング

### よくある問題と解決策

#### 型生成エラー
```bash
# OpenAPI スキーマの構文エラーをチェック
pnpm openapi:validate

# キャッシュをクリア
pnpm clean && pnpm install
```

#### 環境変数の問題
```bash
# Infisical の認証状態を確認
infisical whoami

# 環境変数の一覧を確認
infisical secrets --env=dev

# 特定の環境変数を確認
infisical secrets get DATABASE_URL --env=dev

# デバッグ用：環境変数を注入した状態でコマンドを実行
infisical run --env=dev -- env | grep DATABASE_URL
```

#### データベース接続エラー
```bash
# Docker コンテナの状態確認
docker-compose ps

# データベースの再起動
docker-compose restart postgres

# Infisical から DB接続情報を再確認
infisical secrets get DATABASE_URL --env=dev
```

#### ビルドエラー
```bash
# 依存関係の再インストール
pnpm clean && pnpm install

# TypeScript 型チェック
pnpm type-check
```

---

## � Infisical 活用Tips

### 開発時の便利なコマンド
```bash
# ウォッチモードで開発サーバーを起動（ファイル変更を監視）
infisical run --env=dev --watch -- pnpm dev

# 複数のコマンドを同時実行
infisical run --env=dev -- pnpm dev:api &
infisical run --env=dev -- pnpm dev:web

# 環境変数をデバッグ表示
infisical run --env=dev -- printenv | grep -E "(DATABASE|API|AUTH)"
```

### package.json スクリプトとの統合
```json
{
  "scripts": {
    "dev": "infisical run --env=dev -- pnpm dev:all",
    "test": "infisical run --env=dev -- pnpm test:all",
    "build": "infisical run --env=prod -- pnpm build:all"
  }
}
```

---

##  関連ドキュメント

- [webservice-next-hono-base-spec.md](./webservice-next-hono-base-spec.md) - プロジェクト全体仕様
- [base-construction-tasks.md](./base-construction-tasks.md) - ベース構築タスク
- [api-design-guidelines.md](./api-design-guidelines.md) - API設計ガイドライン
- [packages/shared-openapi/README.md](./packages/shared-openapi/README.md) - OpenAPI 仕様詳細
- [ops/db/README.md](./ops/db/README.md) - データベーススキーマ管理
- [dev/README.md](./dev/README.md) - 開発環境設定
- [Infisical Documentation](https://infisical.com/docs) - Infisical 公式ドキュメント

---

© 2025 WebService-Next-Hono-Base Development Team
