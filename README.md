# Next Hono BetterAuth Base

BetterAuth統合済みのモダンなWebアプリケーション開発用テンプレートリポジトリ。Next.js、Hono、Drizzle ORM、BetterAuthを使用したフルスタック構成。

## これは何？

このリポジトリは**テンプレートリポジトリ**です。新しいプロジェクトを開始する際に、このテンプレートから新規リポジトリを作成して使用します。

### 特徴

- **モダンなフルスタック構成**: Next.js 16 (App Router) + Hono API
- **認証システム**: BetterAuth + Google OAuth 統合
- **型安全性**: TypeScript + Drizzle ORM
- **モノレポ構成**: Turborepo で複数パッケージを効率的に管理
- **開発体験**: Biome (Lint/Format)、Git Hooks、CI/CD標準装備
- **本番対応**: レート制限、API仕様書自動生成、E2Eテスト（認証含む）

## クイックスタート

### 管理者の方（新規プロジェクト作成）

このテンプレートから新しいリポジトリを作成し、開発チームを招待する手順は以下を参照してください：

👉 **[Admin Setup Guide](docs/admin_setup.md)**

### 開発者の方（既存プロジェクトに参加）

管理者から共有されたリポジトリで開発を開始する手順は以下を参照してください：

👉 **[Quickstart Guide](docs/quickstart.md)**

## 技術スタック

### フロントエンド

- **Next.js 16+** (App Router)
- **React 19**
- **Tailwind CSS v4**

### バックエンド

- **Hono** (Next.js API Routes 上で動作)
- **BetterAuth** (認証・セッション管理)
- **Drizzle ORM**
- **PostgreSQL**

### 開発ツール

- **pnpm** (パッケージマネージャー)
- **Turborepo** (モノレポ管理)
- **Biome** (Lint / Format)
- **Vitest** (単体・統合テスト)
- **Playwright** (E2Eテスト)

### インフラ

- **Docker Compose** (ローカルDB)
- **Infisical** (環境変数管理)
- **GitHub Actions** (CI/CD)

詳細な技術仕様は [技術要件・アーキテクチャ設計書](docs/technical_spec.md) を参照してください。

## プロジェクト構成

```text
.
├── apps/
│   └── web/                 # Next.js アプリケーション (Port 3000)
│       ├── app/             # App Router ページ・レイアウト
│       │   ├── api/         # API Routes (Hono統合)
│       │   └── auth/        # 認証関連ページ
│       ├── components/      # UIコンポーネント
│       ├── lib/             # ユーティリティ・クライアント
│       │   ├── auth.ts      # BetterAuth設定
│       │   └── rate-limit.ts # レート制限設定
│       ├── server/          # Hono API実装
│       │   ├── routes/      # APIルート定義
│       │   ├── middleware/  # 認証ミドルウェア
│       │   ├── domain/      # ドメインエンティティ
│       │   └── usecase/     # ビジネスロジック
│       ├── test-e2e/        # E2Eテスト (Playwright)
│       └── env.ts           # 環境変数スキーマ (Zod)
│
├── packages/
│   ├── db/                  # データベース・ORM設定
│   │   ├── src/             # DB接続・スキーマ定義
│   │   └── drizzle.config.ts
│   ├── ui/                  # 共通UIコンポーネント (shadcn/ui)
│   └── config/              # 共通設定ファイル
│       ├── docker-compose.yml
│       ├── biome.json       # Lint/Format設定
│       └── commitlint.config.js
│
├── docs/                    # ドキュメント
├── .github/workflows/       # CI/CD定義
└── .husky/                  # Git Hooks (Commitlint, Lint-staged)
```

## 主な機能

### セキュリティ・品質

- **認証・認可**: BetterAuth による堅牢な認証システム（Google OAuth対応）
- **レート制限**: Upstash Redis を使用した API レート制限 (Vercel Edge Middleware)
- **型安全性**: TypeScript + Zod による厳格な型チェック
- **コード品質**: Biome による自動Lint・Format、Conventional Commits強制

### 開発体験

- **API仕様書**: Hono + Scalar による OpenAPI 仕様書自動生成
- **Hot Reload**: Next.js Turbopack による高速開発サーバー
- **テスト環境**: 単体・統合・E2E テストのフルサポート（認証テスト含む）
- **E2E認証**: Drizzle-based seeding による高速で安定したテスト環境

### CI/CD

- **自動テスト**: PR時に Lint、型チェック、ビルド、テスト実行
- **E2Eテスト**: main ブランチへのマージ時に Playwright 実行
- **依存関係更新**: Dependabot による自動PR作成

## ドキュメント

### セットアップ

- [Quickstart Guide](docs/quickstart.md) - 開発者向けセットアップ手順
- [Admin Setup Guide](docs/admin_setup.md) - 管理者向けプロジェクト作成手順
- [環境定義と実行ガイド](docs/environments.md) - 環境変数・実行環境の説明

### 設計・仕様

- [技術要件・アーキテクチャ設計書](docs/technical_spec.md) - 全体アーキテクチャ
- [API 設計ガイドライン](docs/api_design_guidelines.md) - API設計の原則
- [API バージョニングガイド](docs/api_versioning.md) - APIバージョン管理戦略
- [Hono API 実装標準](docs/server_standards.md) - サーバーサイド実装標準

### 運用

- [CI/CD ガイドライン](docs/ci_guideline.md) - CI/CD の詳細と運用方法

## 開発ガイドライン

### コミット規約

[Conventional Commits](https://www.conventionalcommits.org/) を採用しています。コミット時に自動チェックされます。

### コードフォーマット

Biome によるLintとFormatがコミット時に自動実行されます。手動実行：

```bash
pnpm biome check --apply
```

## ライセンス

MIT
