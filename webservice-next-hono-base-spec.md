# WebService-Next-Hono-Base (Webサービス構成仕様書)

## 🧩 全体構成概要

本仕様書は、Next.js + Hono + OpenAPI + Better Auth + Drizzle + PostgreSQL を用いた
Webサービス（ログイン機能付き）開発ベース構成を定義するものです。

---

## 1. 設計意図

- **契約駆動開発（Contract First）**: OpenAPIを単一の契約とし、クライアント／サーバ間の整合性を自動生成で担保。
- **薄いAPI層（Hono）**: Zod検証＋セッション判定に特化。ビジネスロジックは`application`層へ分離。
- **認証はBetter Auth + Drizzle Adapter**: 最短で安全なログイン実装。
- **秘密情報はリポ外管理**: `.env`をコミットせず、Vault/Infisical/1Password CLI等から注入。
- **観測性確保**: OpenTelemetry + Sentry によりトレース・ログを統一管理。

---

## 2. ディレクトリ構成

```
repo/
  apps/
    web/                  # Next.js (App Router)
    api/                  # Hono (Node/Edge対応)
  packages/
    domain/               # ドメイン層
    application/          # ユースケース層
    infrastructure/       # DB, 外部I/F
    shared-openapi/       # openapi.yaml + 生成物
  ops/
    db/                   # Drizzle schema & migrations
  dev/                    # ✅ 開発環境用設定・ツール
    eslint/
    tsconfig/
    tailwind/
    vite/
    bundler/
    codegen/
  turbo.json
  pnpm-workspace.yaml
```

---

## 3. 開発環境設定（dev/）

開発者体験（DX）を統一するため、開発時に必要な設定・ツールを `dev/` 配下に集約。

| フォルダ | 内容 |
|-----------|------|
| `eslint/` | ESLint / Prettier 設定 |
| `tsconfig/` | TypeScript共通設定 |
| `tailwind/` | Tailwindテーマ設定 |
| `vite/` | Vite共通設定 |
| `bundler/` | tsup / esbuild 設定 |
| `codegen/` | openapi・drizzle生成スクリプト |
| `ci/` *(任意)* | Lint / Test CIワークフロー設定 |

> 各apps/packagesはこの`dev/`内の設定を参照する。  
> 例：`"extends": "../../dev/tsconfig/base.json"`

---

## 4. OpenAPI定義（最小）

```yaml
openapi: 3.0.3
info:
  title: WebService-Next-Hono API
  version: 0.1.0
servers:
  - url: http://localhost:8787

paths:
  /auth/login:
    post:
      summary: Login with email+password
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email: { type: string, format: email }
                password: { type: string, minLength: 8 }
      responses:
        "200": { description: OK }
        "401": { description: Unauthorized }
  /auth/logout:
    post:
      summary: Logout
      responses:
        "204": { description: No Content }
  /me:
    get:
      summary: Get current user profile
      responses:
        "200": { description: OK }
        "401": { description: Unauthorized }
```

---

## 5. 技術構成表

| 要素 | 採用技術 | 理由 |
|------|------------|------|
| フロントエンド | Next.js (App Router) | 最新構造とServer Components対応 |
| API | Hono | 軽量・OpenAPIとの相性が良い |
| バリデーション | Zod + openapi-zod-client | 契約整合性を自動化 |
| DB | PostgreSQL + Drizzle ORM | 型安全かつ移行管理が容易 |
| 認証 | Better Auth | Next.jsと親和性が高い |
| スキーマ生成 | openapi-typescript / drizzle-kit | 自動化・整合性維持 |
| パッケージ管理 | pnpm | モノレポに最適 |
| CI/CD | GitHub Actions + Turbo | キャッシュ構築高速化 |
| 開発設定 | dev/ フォルダ共通化 | 一貫性あるDX |

---

## 6. 推奨ワークフロー

1. `pnpm openapi:gen` — OpenAPIから型生成  
2. `pnpm db:push` — Drizzleマイグレーション反映  
3. `pnpm dev:api` — API起動  
4. `pnpm dev:web` — Web起動  
5. ブラウザで `http://localhost:3000/login` 確認

---

## 7. 命名・運用規約

- `apps`, `packages`, `ops`, `dev` の4階層を標準構成とする。  
- `dev` はリポジトリ横断的な設定専用。実行コードを含めない。  
- OpenAPIの破壊的変更は `/v2` で行う。  
- Secretsは必ずリポ外で管理する。  
- `ADR`（Architectural Decision Record）は `/docs/adr/` に記録。

---

## 8. 今後の拡張

- 他のベース構成（モバイルアプリ等）との契約共有（OpenAPIベース）
- Observability（OTel, Sentry）導入
- Temporal / Cloud Tasks で非同期ジョブ追加
- RBACの共通化（role, permissionをアプリケーション層に）

---

© 2025 ChatGPT (GPT-5) | WebService-Next-Hono-Base Specification
