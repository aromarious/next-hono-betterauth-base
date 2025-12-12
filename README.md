# Webservice Next Hono Base

モダンなWebサービス開発のためのボイラープレート（Next.js + Hono + Drizzle ORM）

## 技術スタック

- **Frontend**: Next.js 14+ (App Router)
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
│   ├── web/              # Next.js (Port 3000)
│   └── api/              # Hono API
├── packages/
│   ├── config/           # 共通設定
│   ├── ui/               # 共通UI
│   └── db/               # DB設定
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

## ドキュメント

- [技術仕様書](docs/technical_spec.md): 技術選定、アーキテクチャの詳細

## ライセンス

MIT
