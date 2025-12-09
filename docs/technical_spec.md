# 技術要件・アーキテクチャ設計書

本ドキュメントは、プロジェクト「Webservice Next Hono Base」の技術選定、開発環境、およびアーキテクチャに関する決定事項をまとめたものです。

## 1. プロジェクト概要

Webサービスの新規開発、および将来的なサービスの基盤となる「モダンで生産性の高いボイラープレート」の構築を目的とします。

* **ゴール**: 堅牢な開発基盤の確立、チーム開発における環境差異の排除、高い型安全性の確保。

## 2. 技術スタック (Tech Stack)

### コア・フレームワーク

* **Runtime**: Node.js (v20+ 推奨)
* **Frontend**: Next.js 14+ (App Router)
* **Backend**: Hono
  * Next.js API Routes 上で動作させる構成 (`app/api/[[...route]]/route.ts`)。
  * **RPC**: Hono RPC を使用し、Frontend/Backend 間で完全な型定義を共有 (End-to-End Type Safety)。
* **Database**: PostgreSQL
* **ORM**: Drizzle ORM (`postgres-js` driver)

### 開発環境・ツール

* **Package Manager**: pnpm (Workspaces 対応)
* **Monorepo Tool**: Turborepo (ビルド・タスク管理)
* **開発環境**: **ローカル環境での開発を推奨**
  * **Database**: Docker Compose で PostgreSQL のみを起動
  * **Application**: ローカルの Node.js で実行 (pnpm dev)
* **Dev Container**: Docker Compose - **現在は非推奨** (詳細は後述)
  * **推奨 VS Code 拡張機能**:
    * `biomejs.biome`: Biome (Lint/Format)
    * `bradlc.vscode-tailwindcss`: Tailwind CSS IntelliSense
    * `ms-azuretools.vscode-docker`: Docker
    * `mtxr.sqltools` + `mtxr.sqltools-driver-pg`: DB GUI Client (Postgres)
    * `yoavbls.pretty-ts-errors`: TypeScriptのエラーを読みやすく表示

#### ローカル開発環境のセットアップ

**推奨構成**: データベースのみDockerで起動し、アプリケーションはローカルで実行します。

**設定ファイルの場所**: `packages/config/docker-compose.yml`

```bash
# 1. データベースの起動
pnpm db:up

# 2. 依存関係のインストール (初回のみ)
pnpm install

# 3. アプリケーションの起動
pnpm dev
```

**環境変数管理**: このプロジェクトは **Infisical** を使用して環境変数を管理します。

**その他のDBコマンド**:

* `pnpm db:down` - データベースの停止
* `pnpm db:restart` - データベースの再起動
* `pnpm db:logs` - データベースのログを表示

詳細なセットアップ手順は [`README.md`](../README.md) を参照してください。

> [!NOTE]
> Dev Container に関する情報は [`technical_spec_devcontainer.md`](technical_spec_devcontainer.md) を参照してください。

### 依存関係 (package.json / pnpm)

* **Core**: `hono`, `next`, `react`, `react-dom`
* **DB**: `drizzle-orm`, `postgres`
* **Dev Tools**:
  * **Biome**: `@biomejs/biome` (Dev) - *Locally installed, versioned in package.json*
  * **Husky**: `husky` (Dev) - *Locally installed*
  * **Turborepo**: `turbo` (Dev or Global)
  * **Types**: `@types/node`, `@types/react`, etc.

* **Linter / Formatter**: Biome
  * 高速な Lint/Format ツールとして Prettier/ESLint に代わり採用。
* **Git Hooks**: Husky
  * コミット時に以下を自動実行:
        1. `biome check --apply` (自動修正)
        2. `commitlint` (コミットメッセージ規約チェック - Conventional Commits)
* **Linter / Formatter**: Biome
  * 高速な Lint/Format ツールとして Prettier/ESLint に代わり採用。
* **Git Hooks**: Husky
  * コミット時に以下を自動実行:
        1. `biome check --apply` (自動修正)
        2. `commitlint` (コミットメッセージ規約チェック - Conventional Commits)

### UI ライブラリ

* **CSS Framework**: Tailwind CSS
* **Components**: shadcn/ui

## 3. アーキテクチャとディレクトリ構成

```text
.
├── .devcontainer/        # Dev Container 設定
├── .husky/               # Git Hooks 設定
├── apps/
│   ├── web/              # Next.js (Port 3000) - Main App
│   │   ├── app/          # Next.js App Router
│   │   └── package.json
│   └── api/              # Hono (App Library) - Mounted to Web
│       ├── routes/       # API Routes
│       └── package.json
├── packages/
│   ├── config/           # 共通設定 (Biome, TSConfig)
│   │   └── biome/        # Biome Config (biome.json here)
│   ├── ui/               # 共通 UI (shadcn/ui)
│   └── db/               # 共通 DB (Drizzle, Connection)
├── package.json          # Root Package (Workspaces, Scripts)
└── turbo.json            # Turborepo 設定
```

### Clean Root Rule (ルートディレクトリ美化ルール)

* **原則**: ルートディレクトリには、ツールが強制的に要求するファイル (`package.json`, `turbo.json`, `.gitignore` 等) 以外は配置しない。
* **設定ファイル**: 基本的に `packages/config` などの適切なサブディレクトリに配置し、ルートからは参照する形をとるか、各パッケージで継承して使用する。

## 4. API 戦略と実行パス（統合構成）

* **Architecture**:
  * **Web Process Only**: 開発時および本番環境では、`apps/web` (Next.js) のプロセスのみを起動します (**Port 3000**)。
  * **API Mounting**: `apps/api` で定義された Hono アプリケーションを、`apps/web` の API Routes (`app/api/[...route]/route.ts`) にインポートしてマウントします。
  * これにより、ディレクトリ構成上は分離しつつ、実行時は**単一のプロセス・単一のポート**で動作します。

* **Access**:
  * **Browser/iOS**: 全て `http://localhost:3000/api/*` に対してアクセスします。
  * **Type Safety**: これまで通り、APIの型定義 (`AppType`) を利用して型安全性を確保します。
