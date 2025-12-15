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
    * **対象**: API層 (`apps/web/server` 配下のエンドポイント) および Repository層。
    * **DB接続**: **行う (Real Databaseを使用)**。
        * ファイル名には `.integration.test.ts` を付与して区別する。
    * **APIテスト**:
        * Honoの `app.request()` を使用して、HTTPサーバを起動せずにリクエストをシミュレーションします。
        * 統合APIテストの配置場所: `apps/web/test/integration/`
        * 例: `apps/web/test/integration/system.integration.test.ts` で `/api/health` を検証。
3. **End-to-End (E2E)**:
    * 対象: Frontendを含む全システムのユーザーフロー。
    * DB接続: 行う。

### テスト実行環境

* **Local**: `docker compose up` でDB(Port:5432)およびTest DB(Port:5433)が起動している状態でテストを実行する。
  * 統合テストは `infisical` (Environment: **staging**) 経由で `DATABASE_URL` (Port 5433) を取得して接続します。
  * E2Eテストも `infisical` (Environment: **staging**) 経由で環境変数を取得し、ポート **3001** で専用サーバーを起動します。
  * **Test DB Connection**: `postgresql://postgres:postgres@localhost:5433/webapp_test`
* **CI**: GitHub Actions等のService Container機能でPostgreSQLを起動し、**単体テストと統合テストの両方を実行します** (`pnpm test`)。統合テストはService ContainerのDBを使用して動作検証を行います。

#### E2Eテストの環境変数管理

E2Eテストでは、統合テストと同様に **Infisical `staging` 環境** から環境変数を取得しますが、実装方式が異なります。

| 項目 | 統合テスト | E2Eテスト |
| :--- | :--- | :--- |
| **ツール** | Vitest | Playwright |
| **環境変数注入** | Ephemeral .env方式<br>（一時的に.envファイルを生成・削除） | Infisical CLI直接実行<br>（`webServer.command`で直接実行） |
| **理由** | VS Code Vitest拡張機能との互換性 | Playwright拡張機能の制約なし |
| **ポート** | サーバー起動なし（`app.request()`使用） | **3001** |

**E2EテストでEphemeral .envが不要な理由**:

* Playwright拡張機能は環境変数読み込みの制約がない
* `playwright.config.ts`の`webServer.command`で直接`infisical run`を実行できる
* シンプルな構成で十分

**開発ワークフロー**:

```bash
# パターン1: Playwrightに自動起動を任せる
$ pnpm dev        # 開発サーバー（ポート3000）
$ pnpm test:e2e   # E2Eサーバーを自動起動（ポート3001） → テスト実行

# パターン2: 事前にE2E用サーバーを起動
$ pnpm dev        # ターミナル1: 開発サーバー（ポート3000）
$ pnpm dev:e2e    # ターミナル2: E2E用サーバー（ポート3001）
$ pnpm test:e2e   # ターミナル3: 既存サーバーを再利用してテスト実行
```

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
│       │   │   └── db/       # Database Connection & Schema
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

### Vercel Integration設定

本プロジェクトでは、**Infisical Vercel Integration**を使用してVercelの環境変数を自動同期しています。

**設定内容**:

* **Infisical環境**: `prod` (本番)
* **同期先Vercel環境**: `Production` および `Preview`
* **同期方法**: Infisical上での環境変数変更が、Vercelの該当環境に自動的に反映されます

**手順**:

1. Infisicalダッシュボードで「Integrations」→「Vercel」を選択
2. Vercelアカウントを接続
3. 同期元：`prod` 環境を選択
4. 同期先：Vercelの`Production`と`Preview`環境を選択
5. 必要な環境変数（`DATABASE_URL`, `UPSTASH_REDIS_REST_URL`など）が自動的に同期されます

> [!NOTE]
> Vercelの`Development`環境はローカル開発用のため、同期対象外としています。ローカル開発、統合テスト、E2EテストではInfisical CLIを直接使用します（`dev`環境、`staging`環境）。

### 必要なツール

* **Infisical CLI**: ローカル開発および CI で必要です。

### 統合テストの環境変数戦略 (Ephemeral .env)

統合テスト実行時のみ一時的に環境変数ファイルを生成し、テスト終了後に削除する **Ephemeral (短命な) 戦略** を採用しています。
これにより、IDE拡張機能との互換性を保ちつつ、ローカルに機密情報を永続させないセキュアな運用を実現しています。

* **仕組み**: `apps/web/server/infrastructure/repositories/post.repository.integration.test.ts` などの統合テスト実行時に以下が自動実行されます。
    1. **Setup**: `vitest.integration.config.ts` の `globalSetup` (`apps/web/test/integration-global-setup.ts`) が起動。
    2. **Generate**: `infisical export` を実行し、一時的な `.env` ファイルを生成 (CI環境ではスキップ)。
    3. **Load**: `apps/web/test/load-env.ts` が `.env` を読み込み。
    4. **Teardown**: テスト終了後、`.env` ファイルを即座に削除。
* **メリット**:
  * **IDE互換性**: VS Code の Vitest 拡張機能からも問題なく動作します。
  * **安全性**: `.env` ファイルがリポジトリに残存するリスクを排除します。

### 安全な環境変数管理 (Environment Safety)

Fail-fastな開発とキャッシュ事故防止のため、以下のルールを採用します。

1. **バリデーション**: [T3 Env](https://env.t3.gg/) (`@t3-oss/env-nextjs`) を採用し、環境変数の型バリデーションを行います。
    * サーバー起動時・ビルド時に環境変数の不足を検知し、エラーを返します。
    * `process.env` を直接参照せず、ライブラリ経由でアクセスすることで型安全性を確保します。
2. **キャッシュ設定 (Turbo)**:
    * 環境変数の値が変わった際にキャッシュが無効化されるよう、`turbo.json` の `globalEnv`/`env` を適切に設定します。

## 7. レートリミット (Rate Limiting)s

API全体にレートリミット機能を導入し、DoS攻撃の防止、コスト削減、公平なリソース配分を実現します。

### アーキテクチャ

* **実装方式**: **Next.js Edge Middleware + Upstash Ratelimit**
  * Next.js 16では`middleware.ts`が非推奨となり`proxy.ts`への移行が推奨されていますが、Edge Runtimeが必須のため、現時点では`middleware.ts`を使用します。
  * 将来的にNext.jsがEdge Runtime対応の新しいソリューションを提供した際に移行を検討します。

* **動作環境**: **Vercel Edge Runtime**
  * リクエストがServerless Functionに到達する前にEdge(CDN)で処理されるため、超低レイテンシで動作します。
  * 不正なリクエストを早期に遮断し、Serverless Functionの実行コストを削減します。

* **レートリミットアルゴリズム**: **スライディングウィンドウ (Sliding Window)**
  * `@upstash/ratelimit`が提供するアルゴリズムを使用し、正確なレート制限を実現します。

### レート制限ルール

| 設定項目 | 値 |
| :--- | :--- |
| **制限単位** | IPアドレス |
| **制限数** | 10リクエスト/分 |
| **除外パス** | `/api/health` (ヘルスチェックは制限対象外) |
| **エラーレスポンス** | HTTP 429 Too Many Requests |

### ストレージ (Upstash Redis)

* **サービス**: [Upstash Redis](https://upstash.com/)
  * Edge Runtime対応のHTTPベースRedisクライアントを提供します。
  * 無料プラン: 10,000コマンド/日、100MBストレージ

* **環境別データベース構成**:
  * **開発用**: `webservice-ratelimit-dev` (オプション、レートリミットテスト時のみ使用)
  * **本番用**: `webservice-ratelimit-prod`
  * 統合テストやCI環境ではレートリミットを無効化するため、専用データベースは不要です。

### 環境別の動作

| 環境 | 動作 | 詳細 |
| :--- | :--- | :--- |
| **開発環境** | デフォルト無効化 | `DISABLE_RATE_LIMIT=true`または環境変数未設定。<br>レートリミット機能をテストしたい場合のみ、Upstash認証情報を設定して有効化。 |
| **統合テスト** | 無効化 | `DISABLE_RATE_LIMIT=true`。ビジネスロジックのテストに集中。 |
| **E2Eテスト** | 一部有効化 | レートリミット機能自体のテストを含む。テスト用または開発用Redisを使用。 |
| **CI環境** | デフォルト無効化 | 必要なテストのみ有効化。 |
| **本番環境** | 有効化 | Upstash本番用データベースを使用。 |

### レスポンスヘッダー

レート制限情報をレスポンスヘッダーに追加し、クライアント側で制限状況を確認できるようにします:

| ヘッダー名 | 説明 |
| :--- | :--- |
| `X-RateLimit-Limit` | 制限数(例: 10) |
| `X-RateLimit-Remaining` | 残りリクエスト数 |
| `X-RateLimit-Reset` | リセット時刻(Unix timestamp) |

### 実装ファイル

* **Middleware**: `apps/web/middleware.ts`
  * Edge Runtimeでリクエストをインターセプトし、レート制限をチェックします。
  * Upstash Redisクライアントを初期化し、`@upstash/ratelimit`でレート制限を実装します。
  * 環境変数`DISABLE_RATE_LIMIT`による無効化フラグをサポートします。

### 環境変数一覧

| 変数名 | 必須 | 概要 | 使用箇所 |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | **Yes** | PostgreSQL 接続文字列 | `apps/web/server/infrastructure/db/client.ts`<br>`apps/web/drizzle.config.ts` |
| `NODE_ENV` | **Yes** | Node.js ランタイム環境 (`development`, `production`, `test`) | `apps/web/server`<br>`project-wide` |
| `UPSTASH_REDIS_REST_URL` | **Yes** (本番) | Upstash RedisのREST API URL | `apps/web/middleware.ts` |
| `UPSTASH_REDIS_REST_TOKEN` | **Yes** (本番) | Upstash RedisのREST APIトークン | `apps/web/middleware.ts` |
| `DISABLE_RATE_LIMIT` | No | レートリミット無効化フラグ (開発・テスト環境用、デフォルト: `false`) | `apps/web/middleware.ts` |
| `RATE_LIMIT_MAX_REQUESTS` | No | レート制限のリクエスト数 (デフォルト: `10`) | `apps/web/middleware.ts` |
| `RATE_LIMIT_WINDOW` | No | レート制限のウィンドウ時間 (デフォルト: `1 m`) | `apps/web/middleware.ts` |
| `CI` | No | CI環境フラグ (CI環境のみ) | `apps/web/playwright.config.ts` |

### Infisical環境別設定

| 環境変数 | `dev` (開発) | `staging` (テスト) | `prod` (本番) |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | ローカル5432 | ローカル5433 | Neon (クラウド) |
| `UPSTASH_REDIS_REST_URL` | Upstash本番DB | Upstash本番DB | Upstash本番DB |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash本番DB | Upstash本番DB | Upstash本番DB |
| `RATE_LIMIT_MAX_REQUESTS` | 100 | 10 | 10 |
| `RATE_LIMIT_WINDOW` | `1 m` | `1 m` | `1 m` |

> [!NOTE]
> **Upstash Redisは全環境で同じインスタンスを共有**しています。開発環境では`RATE_LIMIT_MAX_REQUESTS=100`と緩い制限を設定し、テスト・本番環境では`10`に設定しています。

> [!NOTE]
> **実装状況 (2025/12/09現在)**
>
> * **Development**: 導入完了 (v0.0.0で対応)
> * **CI / Testing**: 未導入 (CI環境構築時に設定予定)
> * **Production**: 未導入 (デプロイ環境構築時に設定予定)
