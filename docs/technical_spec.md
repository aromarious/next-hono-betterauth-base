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
* **Dev Environment**: Dev Container (Docker Compose)
  * **推奨 VS Code 拡張機能**:
    * `biomejs.biome`: Biome (Lint/Format)
    * `bradlc.vscode-tailwindcss`: Tailwind CSS IntelliSense
    * `ms-azuretools.vscode-docker`: Docker
    * `mtxr.sqltools` + `mtxr.sqltools-driver-pg`: DB GUI Client (Postgres)
    * `yoavbls.pretty-ts-errors`: TypeScriptのエラーを読みやすく表示
* **Secrets Management**: Infisical
  * 環境変数のクラウド管理。Dev Container 内で CLI を使用して注入。

### コード品質・CI

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
│   ├── ui/               # 共通 UI (shadcn/ui)
│   └── db/               # 共通 DB (Drizzle, Connection)
├── package.json          # Root Package (Workspaces, Scripts)
├── biome.json            # Biome 設定
└── turbo.json            # Turborepo 設定
```

## 4. API 戦略と実行パス（統合構成）

* **Architecture**:
  * **Web Process Only**: 開発時および本番環境では、`apps/web` (Next.js) のプロセスのみを起動します (**Port 3000**)。
  * **API Mounting**: `apps/api` で定義された Hono アプリケーションを、`apps/web` の API Routes (`app/api/[...route]/route.ts`) にインポートしてマウントします。
  * これにより、ディレクトリ構成上は分離しつつ、実行時は**単一のプロセス・単一のポート**で動作します。

* **Access**:
  * **Browser/iOS**: 全て `http://localhost:3000/api/*` に対してアクセスします。
  * **Type Safety**: これまで通り、APIの型定義 (`AppType`) を利用して型安全性を確保します。
