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
    * **Locale**: `ja_JP.utf8` (日本語ロケール) - ソート順やエラーメッセージの日本語化のため、カスタムDockerfile (`packages/config/database/Dockerfile`) を使用してビルドします。
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

**設定ファイルの場所**: `packages/config/docker-compose.yml`, `packages/config/database/Dockerfile`

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

* **Testing**:
  * **Unit / Integration**: Vitest
  * **E2E**: Playwright

## 3. テスト戦略

品質と開発速度のバランスを考慮し、以下のテストピラミッドを採用します。

### テストの種類とツール

| 種別 | ツール | 役割・ファイル名 | 実行コマンド |
| :--- | :--- | :--- | :--- |
| **Unit Test** | **Vitest** | ドメインロジック等の単体テスト。<br>`*.test.ts` (統合テスト以外) | `pnpm test:unit` |
| **Integration Test** | **Vitest** | APIエンドポイント等の統合テスト（DB接続あり）。<br>`*.integration.test.ts` | `pnpm test:integration` |
| **End-to-End** | **Playwright** | ブラウザを用いたE2Eテスト。<br>`e2e/**/*` | `pnpm test:e2e` |

> **Note**: `pnpm test` コマンドは Unit と Integration の両方を実行します。

### テストの方針

1. **Unit Test (単体テスト)**:
    * **対象**: Domain層、Usecase層の複雑なロジック、Utility関数。
    * **DB接続**: **行わない (Mockを使用)**。
2. **Integration Test (統合テスト)**:
    * **対象**: API層 (`apps/web/server` 配下のエンドポイント)。
    * **DB接続**: **行う (Real Databaseを使用)**。
        * ファイル名には `.integration.test.ts` を付与して区別する。
3. **End-to-End (E2E)**:
    * 対象: Frontendを含む全システムのユーザーフロー。
    * DB接続: 行う。

### テスト実行環境

* **Local**: `docker compose up` でDB(Port:5432)およびTest DB(Port:5433)が起動している状態でテストを実行する。
  * 統合テストは `infisical` (Environment: **staging**) 経由で `DATABASE_URL` (Port 5433) を取得して接続します。
  * **Test DB Connection**: `postgresql://postgres:postgres@localhost:5433/webapp_test`
* **CI**: GitHub Actions等のService Container機能でPostgreSQLを起動し、**単体テストと統合テストの両方を実行します** (`pnpm test`)。統合テストはService ContainerのDBを使用して動作検証を行います。

## 4. アーキテクチャとディレクトリ構成

```text
.
├── .devcontainer/        # （Dev Container 設定、使用しない）
├── .husky/               # Git Hooks 設定
├── apps/
│   └── web/              # Next.js (Port 3000) - Main App & API
│       ├── app/          # Next.js App Router
│       ├── server/       # Hono App (Backend Logic) - Clean Architecture
│       │   ├── domain/       # Entities / Rules
│       │   ├── usecase/      # Application Business Rules
│       │   ├── adapter/      # Interface Adapters (Controllers)
│       │   ├── infrastructure/ # Frameworks & Drivers
│       │   │   └── db/       # Database Connection & Schema (Moved from packages/db)
│       │   └── index.ts      # DI & Routing
│       └── package.json
├── packages/
│   ├── config/           # 共通設定 (Biome, TSConfig)
│   └── ui/               # 共通 UI (shadcn/ui)
│   <!-- packages/db removed and integrated into apps/web/server/infrastructure -->
├── package.json          # Root Package (Workspaces, Scripts)
└── turbo.json            # Turborepo 設定

```

### バックエンドアーキテクチャ (Clean Architecture)

`apps/web/server` 配下は、**Clean Architecture** に基づいて責務を以下のディレクトリに分割します。
初期開発のオーバーヘッドを避けるため、パッケージ分割（`packages/*`）ではなく、ディレクトリによるモジュール分割を採用します。

1. * **domain**: 純粋なビジネスロジックとエンティティ (Entity)。
     * アプリケーションの中核となるデータ構造とルールを定義します。
     * 外部依存（DBやFramework）を一切持ちません。
     * **命名規則**:
       * エンティティ: `*.entity.ts`
       * 値オブジェクト: `*.vo.ts`
2. **usecase**: アプリケーション固有のビジネスロジック。
3. **adapter**: インターフェースアダプター（Hono Controllersなど）。
4. **infrastructure**: フレームワークやDBの詳細（Drizzle, API Clientsなど）。

この構成により、テスト容易性と将来的な拡張性を担保します。
DBロジック（スキーマやクライアント）も `infrastructure/db` に配置します。

### Clean Root Rule (ルートディレクトリ美化ルール)

詳細な API 実装標準については [Hono API 実装標準](server_standards.md) を参照してください。

* **原則**: ルートディレクトリには、ツールが強制的に要求するファイル (`package.json`, `turbo.json`, `.gitignore` 等) 以外は配置しない。
* **設定ファイル**: 基本的に `packages/config` などの適切なサブディレクトリに配置し、ルートからは参照する形をとるか、各パッケージで継承して使用する。

> [!NOTE]
> **暫定対処 (Known Issue - 2025/12/10): `biome.json` のルート配置**
>
> 現在、VS Code の Biome 拡張機能が `packages/config/biome.json` を正しく自動検出・継承できない問題（フォーマット差異の発生）を確認しています。
> このため、**暫定的にルートディレクトリに `biome.json` を配置**しています。これも `packages/config/biome.json` を `extends` するだけの薄いファイルです。
> 将来的にツールの挙動が改善され次第、このファイルは削除し、`packages/config` への集約に戻す予定です。

## 5. API 戦略と実行パス（統合構成）

* **Architecture**:
  * **Web Process Only**: 開発時および本番環境では、`apps/web` (Next.js) のプロセスのみを起動します (**Port 3000**)。
  * **API Mounting**: `apps/web/server` で定義された Hono アプリケーションを、同プロジェクト内の API Routes (`app/api/[...route]/route.ts`) にインポートしてマウントします。
  * これにより、完全に単一のアプリケーションとして動作し、デプロイや管理が簡素化されます。

* **Access**:
  * **Browser/iOS**: 全て `http://localhost:3000/api/*` に対してアクセスします。
  * **Type Safety**: Backend/Frontend が同一パッケージ内に同居するため、型定義の共有 (`AppType`) がより容易になります。

## 6. 環境変数・シークレット管理

プロジェクトの環境変数（シークレット含む）は **Infisical** を使用して一元管理します。

* **役割**: Single Source of Truth として、すべての環境のシークレットを Infisical 上で管理します。
* **コードベース**: `.env` ファイルは使いません。リポジトリにコミットしません（`.gitignore` 対象）。

### 運用戦略 (Hybrid Strategy)

本番環境の可用性を確保するため、Infisical へのランタイム依存は行わず、各環境に適した注入方法を採用します。

| 環境 | 注入方法 | 詳細 |
| :--- | :--- | :--- |
| **Development** (Local) | **Infisical CLI** | `infisical run -- <command>` を使用して、開発者のローカルプロセスに直接シークレットを注入します。開発者は手元に機密ファイルを保持する必要がありません。 |
| **CI / Testing** | **Infisical CLI** | GitHub Actions などの CI/CD パイプライン内で CLI を使用し、テスト実行に必要なシークレットを動的に取得します。 |
| **Production** | **Integration (Sync)** | **Infisical Integrations** 機能を使用し、Infisical からデプロイ先プラットフォーム（Vercel, AWS Parameter Store, Render 等）の環境変数ストアへ自動同期します。アプリケーションは標準の `process.env` を通じて値を参照するため、Infisical API の稼働状況に影響されません。 |

### 必要なツール

* **Infisical CLI**: ローカル開発および CI で必要です。

### 安全な環境変数管理 (Environment Safety)

Fail-fastな開発とキャッシュ事故防止のため、以下のルールを採用します。

1. **バリデーション**: [T3 Env](https://env.t3.gg/) (`@t3-oss/env-nextjs`) を採用し、環境変数の型バリデーションを行います。
    * サーバー起動時・ビルド時に環境変数の不足を検知し、エラーを返します。
    * `process.env` を直接参照せず、ライブラリ経由でアクセスすることで型安全性を確保します。
2. **キャッシュ設定 (Turbo)**:
    * 環境変数の値が変わった際にキャッシュが無効化されるよう、`turbo.json` の `globalEnv`/`env` を適切に設定します。

### 環境変数一覧

| 変数名 | 必須 | 概要 | 使用箇所 |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | **Yes** | PostgreSQL 接続文字列 | `apps/web/server/infrastructure/db/client.ts`<br>`apps/web/drizzle.config.ts` |
| `NODE_ENV` | **Yes** | Node.js ランタイム環境 (`development`, `production`, `test`) | `apps/web/server`<br>`project-wide` |
| `CI` | No | CI環境フラグ (CI環境のみ) | `apps/web/playwright.config.ts` |

> [!NOTE]
> **実装状況 (2025/12/09現在)**
>
> * **Development**: 導入完了 (v0.0.0で対応)
> * **CI / Testing**: 未導入 (CI環境構築時に設定予定)
> * **Production**: 未導入 (デプロイ環境構築時に設定予定)
