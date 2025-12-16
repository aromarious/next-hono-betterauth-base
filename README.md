# Webservice Next Hono Base

モダンなWebサービス開発のためのボイラープレート（Next.js + Hono + Drizzle ORM）

## 技術スタック

- **Frontend**: Next.js 16+ (App Router)
- **Backend**: Hono (Next.js API Routes上で動作)
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Package Manager**: pnpm
- **Monorepo**: Turborepo

詳細な技術仕様は [`docs/technical_spec.md`](docs/technical_spec.md) を参照してください。

## 開発環境のセットアップ

### 前提条件

- Node.js 20+
- pnpm
- Docker & Docker Compose

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd webservice-next-hono-base
```

### 2. 依存関係のインストール

```bash
pnpm install
```

### 3. 環境変数の設定 (Infisical)

このプロジェクトは環境変数の管理に **Infisical** を使用します。
Infisical CLI がインストールされていない場合は、以下の手順でインストールしてください。

#### Infisical CLI のインストール (macOS)

```bash
brew install infisical/get-infisical/infisical
```

(その他のOSは [公式ドキュメント](https://infisical.com/docs/cli/overview) を参照)

#### プロジェクトへのログイン

```bash
infisical login
infisical init
```

※ プロジェクトIDの設定などが必要な場合があります。

Infisical のセットアップ方法については [Infisical CLI ドキュメント](https://infisical.com/docs/cli/overview) を参照してください。

### 4. データベースの起動

PostgreSQLをDockerで起動します：

```bash
pnpm db:up
```

**その他のDBコマンド**:

```bash
# データベースの停止
pnpm db:down

# データベースの再起動
pnpm db:restart

# データベースのログを表示
pnpm db:logs
```

データを完全に削除する場合：

```bash
docker compose -f packages/config/docker-compose.yml down -v
```

### 5. アプリケーションの起動

```bash
pnpm dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) にアクセスしてください。

## プロジェクト構成

```text
.
├── .devcontainer/        # Dev Container 設定（現在は非推奨）
├── .husky/               # Git Hooks 設定
├── apps/
│   └── web/              # Next.js (Port 3000)
├── packages/
│   ├── config/           # 共通設定
│   ├── ui/               # 共通UI
│   └── db/               # DB設定 (Drizzle ORM)
└── docs/                 # ドキュメント
```

## 開発ガイドライン

### コミット規約

このプロジェクトは [Conventional Commits](https://www.conventionalcommits.org/) を採用しています。

### コードフォーマット

Biome を使用しています。コミット時に自動的にフォーマットとLintが実行されます。

手動で実行する場合：

```bash
pnpm biome check --apply
```

## CI/CD

このプロジェクトはGitHub Actionsを使用してCIを実行します。詳細は [CI/CDガイドライン](docs/ci_guideline.md) を参照してください。

### 実行される自動チェック

- **Lint & Format**: Biomeによるコード品質チェック
- **TypeScript Check**: 型安全性の検証
- **Build**: Next.jsアプリケーションのビルド
- **Unit & Integration Tests**: テスト実行（カバレッジレポート付き）
- **E2E Tests**: E2Eテスト（mainブランチのみ）

### GitHub Secretsの設定

CIでInfisical CLIを使用するため、以下のシークレットをGitHubリポジトリに設定する必要があります：

1. GitHubリポジトリの **Settings** > **Secrets and variables** > **Actions** に移動
2. **New repository secret** をクリックして以下を追加：
   - Name: `INFISICAL_SECRET`
   - Value: 上記で作成したService Token（`st.`で始まる長い文字列全体をコピー）

**Infisical Service Tokenの作成方法**:

1. [Infisicalダッシュボード](https://app.infisical.com/)にログイン
2. プロジェクト「webservice-next-hono-base」を選択
3. 上部の **Settings** タブをクリック
4. **Project Settings** を選択
5. **Access Control** タブをクリック
6. **Service Tokens** セクションで **Create service token** をクリック
7. 設定：
   - **Service Token Name**: `GitHub Actions CI`
   - **Environment**: `staging`
   - **Secrets Path**: `/` (デフォルトのまま)
   - **Expiration**: 無期限（Never expire）または十分に長い期間
   - **Permissions**: `Read` ✅
8. **Create** ボタンをクリック
9. 表示される `st.`で始まる長い文字列（Service Token）を**必ずコピーして保存**（この画面は一度しか表示されません）

### ワークフロー

- **`.github/workflows/test.yml`**: プルリクエスト時に実行
  - Lint、型チェック、ビルド、単体テスト、統合テストを実行
- **`.github/workflows/full-test.yml`**: mainブランチへのpush時に実行
  - 上記に加えてE2Eテストも実行

### 依存関係の自動更新

Dependabotが依存関係を自動的にチェックし、更新PRを作成します：

- npm パッケージ: 週次
- GitHub Actions: 月次
- Docker イメージ: 月次

### ローカルでのCI検証

ローカルで全てのCIチェックを実行する方法は [CI/CDガイドライン](docs/ci_guideline.md#ローカルでのci検証) を参照してください。

## ドキュメント

プロジェクトの詳細なドキュメントは `docs/` ディレクトリにあります。

- **概要 & 要件**
  - [技術要件・アーキテクチャ設計書](docs/technical_spec.md)
  - [やりたいこと (TODOリスト)](docs/want-todo.md)

- **ガイドライン & 標準**
  - [API 設計ガイドライン (案)](docs/api_design_guidelines.md)
  - [API バージョニングガイド](docs/api_versioning.md)
  - [Hono API 実装標準](docs/server_standards.md)
  - [CI/CD ガイドライン](docs/ci_guideline.md)

- **セットアップ & 運用**
  - [Quickstart Guide](docs/quickstart.md)
  - [環境定義と実行ガイド](docs/environments.md)
  - [Admin Setup Guide](docs/admin_setup.md)

## ライセンス

MIT
