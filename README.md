# Next Hono NoAuth Base

認証機能なしのモダンなWebアプリケーション開発用テンプレートリポジトリ。Next.js、Hono、Drizzle ORMを使用したフルスタック構成。

## これは何？

このリポジトリは**テンプレートリポジトリ**です。新しいプロジェクトを開始する際に、このテンプレートから新規リポジトリを作成して使用します。

### 特徴

- **モダンなフルスタック構成**: Next.js 16 (App Router) + Hono API
- **型安全性**: TypeScript + Drizzle ORM
- **モノレポ構成**: Turborepo で複数パッケージを効率的に管理
- **開発体験**: Biome (Lint/Format)、Git Hooks、CI/CD標準装備
- **本番対応**: レート制限、API仕様書自動生成、E2Eテスト

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
│       ├── src/
│       │   ├── app/         # App Router ページ
│       │   ├── server/      # Hono API ルーティング
│       │   └── env.ts       # 環境変数スキーマ (Zod)
│       └── tests/           # テスト (unit/integration/e2e)
│
├── packages/
│   ├── db/                  # データベース・ORM設定
│   │   ├── drizzle/         # Drizzle ORM スキーマ・マイグレーション
│   │   └── src/             # DB接続・エンティティ
│   ├── ui/                  # 共通UIコンポーネント
│   └── config/              # 共通設定ファイル
│       ├── docker-compose.yml
│       ├── tailwind/
│       └── typescript/
│
├── docs/                    # ドキュメント
├── .github/workflows/       # CI/CD定義
└── .husky/                  # Git Hooks (Commitlint, Lint-staged)
```

## 主な機能

### セキュリティ・品質

- **レート制限**: Upstash Redis を使用した API レート制限 (Vercel Edge Middleware)
- **型安全性**: TypeScript + Zod による厳格な型チェック
- **コード品質**: Biome による自動Lint・Format、Conventional Commits強制

### 開発体験

- **API仕様書**: Hono + Scalar による OpenAPI 仕様書自動生成
- **Hot Reload**: Next.js Turbopack による高速開発サーバー
- **テスト環境**: 単体・統合・E2E テストのフルサポート

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
