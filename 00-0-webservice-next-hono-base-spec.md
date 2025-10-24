# WebService-Next-Hono-Base

## 🎯 プロジェクトの目的

**WebService-Next-Hono-Base** は、モダンなWebサービス開発のための**再利用可能な基盤プロジェクト**です。

### 🚀 何を解決するのか
- **開発速度の向上**: 新しいWebサービスを始める際の初期セットアップ時間を大幅短縮
- **品質の標準化**: ベストプラクティスに基づいた一貫性のある開発環境の提供
- **技術負債の削減**: 契約駆動開発により、フロントエンド・バックエンド間の整合性を自動保証
- **セキュリティの確保**: 認証・認可・環境変数管理が最初から適切に実装済み

### 🎯 対象となる開発チーム
- **スタートアップ**: MVPから本格運用まで対応可能な基盤が欲しいチーム
- **企業の新規プロジェクト**: 社内標準に準拠したWebサービス基盤が必要なチーム
- **個人開発者**: 高品質なWebサービスを効率的に開発したい開発者

### 💡 コアコンセプト
1. **契約駆動開発（Contract First）**: OpenAPIを単一の契約とし、型安全性を自動保証
2. **即座に本格開発開始**: 認証・DB・API基盤が最初から完備、初日からビジネスロジックに集中可能
3. **再利用性**: プロジェクト固有の要素は最小限に、最大限の汎用性を実現
4. **開発者体験（DX）**: 統一された設定とワークフローで一貫性のある開発環境

---

## 📚 ドキュメント索引

このプロジェクトには以下の技術仕様書・ガイドラインが含まれています：

### 📖 メイン仕様書・ワークフロー（読む順番）
| ファイル | 内容 | 対象者 |
|----------|------|--------|
| **[00-0-webservice-next-hono-base-spec.md](./00-0-webservice-next-hono-base-spec.md)** | **本ファイル** - プロジェクト全体概要 | 全員 |
| **[00-1-development-workflow.md](./00-1-development-workflow.md)** | 日々の開発ワークフロー・環境構築手順 | 開発者・運用者 |
| **[00-2-required-technical-specifications.md](./00-2-required-technical-specifications.md)** | 必要な技術仕様書一覧・作成ロードマップ | プロジェクトマネージャー |

### 🔧 技術ガイドライン（実装時に参照）
| ファイル | 内容 | 作成状況 | 対象者 |
|----------|------|----------|--------|
| **[10-0-api-design-guidelines.md](./10-0-api-design-guidelines.md)** | RESTful API設計標準・URL設計パターン | ✅ 完成 | API開発者 |
| **[10-1-openapi-specifications-guidelines.md](./10-1-openapi-specifications-guidelines.md)** | OpenAPI仕様書作成・契約駆動開発手順 | ✅ 完成 | API設計者 |
| **[10-2-security-specifications-guidelines.md](./10-2-security-specifications-guidelines.md)** | セキュリティ仕様・認証設計ガイドライン | ✅ 完成 | セキュリティ担当者 |
| **[10-3-database-design-guidelines.md](./10-3-database-design-guidelines.md)** | データベース設計・Drizzle ORM活用ガイド | ✅ 完成 | DB設計者 |
| **[10-4-testing-strategy-guidelines.md](./10-4-testing-strategy-guidelines.md)** | テスト戦略・Unit/Integration/E2E実装ガイド | ✅ 完成 | QA・テスト担当者 |
| **[10-5-ci-cd-pipeline-guidelines.md](./10-5-ci-cd-pipeline-guidelines.md)** | CI/CDパイプライン・GitHub Actions + Turbo最適化 | ✅ 完成 | DevOps・インフラ担当者 |



### 🚧 今後作成予定のガイドライン
| 分野 | 優先度 | 予定内容 |
|------|--------|----------|
| データベース設計 | **高** | Drizzle ORM + PostgreSQL設計標準 |
| テスト戦略 | **高** | Unit/Integration/E2E テスト戦略 |
| CI/CDパイプライン | **中** | GitHub Actions + Turbo設定標準 |
| 監視・ログ戦略 | **中** | Observability実装ガイド |
| パフォーマンス最適化 | **低** | 最適化手法・測定方法 |

---

## 🧩 全体構成概要

本プロジェクトは、Next.js + Hono + OpenAPI + Better Auth + Drizzle + PostgreSQL を用いた
**認証機能付きWebサービス開発基盤**を提供します。

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

## 4. API設計原則

### 契約駆動開発（Contract First）
- OpenAPIスキーマを先に定義し、フロントエンド・バックエンド間の型安全性を担保
- RESTful設計に基づく一貫したURL設計パターン
- 統一されたレスポンス形式とエラーハンドリング

### 基本API構造
```
/{version}/{resource}/{id?}/{sub-resource?}
```

### 認証レベル
- **Public**: 認証不要 (`/v1/health`, `/v1/auth/login`)
- **Authenticated**: ログイン必須 (`/v1/me`, `/v1/posts`)
- **Authorized**: 特定権限必須 (`/v1/admin/*`)

## 5. OpenAPI定義（基本実装）

```yaml
openapi: 3.0.3
info:
  title: WebService-Next-Hono API
  version: 1.0.0
  description: ログイン機能付きWebサービス開発ベース

servers:
  - url: http://localhost:8787/v1
    description: 開発環境
  - url: https://api.yourdomain.com/v1
    description: 本番環境

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

paths:
  # ヘルスチェック
  /health:
    get:
      summary: システム状態確認
      responses:
        "200": { description: "システム正常" }

  # 認証関連
  /auth/register:
    post:
      summary: ユーザー登録
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password, name]
              properties:
                email: { type: string, format: email }
                password: { type: string, minLength: 8 }
                name: { type: string, minLength: 1 }
      responses:
        "201": { description: "登録成功" }
        "400": { description: "バリデーションエラー" }

  /auth/login:
    post:
      summary: ログイン
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
        "200": { description: "ログイン成功" }
        "401": { description: "認証失敗" }

  /auth/logout:
    post:
      summary: ログアウト
      security:
        - BearerAuth: []
      responses:
        "204": { description: "ログアウト成功" }
        "401": { description: "未認証" }

  # ユーザー情報
  /me:
    get:
      summary: 現在のユーザー情報取得
      security:
        - BearerAuth: []
      responses:
        "200": { description: "ユーザー情報取得成功" }
        "401": { description: "未認証" }
    
    put:
      summary: 現在のユーザー情報更新
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name: { type: string, minLength: 1 }
                email: { type: string, format: email }
      responses:
        "200": { description: "更新成功" }
        "400": { description: "バリデーションエラー" }
        "401": { description: "未認証" }
```

---

## 6. 技術構成表

| 要素 | 採用技術 | 理由 |
|------|------------|------|
| フロントエンド | Next.js (App Router) | 最新構造とServer Components対応 |
| API | Hono | 軽量・OpenAPIとの相性が良い |
| バリデーション | Zod + openapi-zod-client | 契約整合性を自動化 |
| DB | PostgreSQL + Drizzle ORM | 型安全かつ移行管理が容易 |
| 認証 | Better Auth | Next.jsと親和性が高い |
| レートリミット | @upstash/ratelimit + VercelKV | Vercel環境最適化・Sliding Window高精度制限 |
| スキーマ生成 | openapi-typescript / drizzle-kit | 自動化・整合性維持 |
| パッケージ管理 | pnpm | モノレポに最適 |
| CI/CD | GitHub Actions + Turbo | キャッシュ構築高速化 |
| 環境変数管理 | Infisical | セキュアな秘密情報管理 |
| 開発設定 | dev/ フォルダ共通化 | 一貫性あるDX |

---

## 7. 開発ワークフロー

### 事前準備（初回のみ）
1. 開発環境のセットアップ（Node.js, pnpm, Docker, Infisical CLI）
2. Infisical プロジェクトの作成と環境変数設定
3. PostgreSQL データベースの準備

### 日常的な開発サイクル
1. **契約駆動開発**: `packages/shared-openapi/openapi.yaml` を先に定義
2. **型生成**: `pnpm openapi:gen` — OpenAPIから型生成  
3. **DB設計**: `ops/db/schema.ts` の更新
4. **マイグレーション**: `infisical run --env=dev -- pnpm db:push`
5. **実装**: ドメイン層 → アプリケーション層 → API層 → フロントエンド
6. **開発サーバー起動**: 
   - `infisical run --env=dev -- pnpm dev:api` — API起動
   - `infisical run --env=dev -- pnpm dev:web` — Web起動
7. **動作確認**: ブラウザで `http://localhost:3000` 確認

### 品質管理
- `pnpm lint` — コード品質チェック
- `pnpm test` — テスト実行
- `pnpm type-check` — 型チェック

---

## 8. ベース構築レベル

### Level 1: スケルトンベース ⚡
- ディレクトリ構造とpackage.json設定
- 開発環境設定（dev/フォルダ）
- 基本的なドキュメント

### Level 2: 動作ベース 🚀
- Hello World API + Welcome ページ
- データベース接続の基本
- OpenAPIスキーマの最小構成

### Level 3: 認証ベース 🔐 **← 推奨提供レベル**
- 完全なログイン機能（Better Auth）
- ユーザー登録・ログイン・ログアウト
- 認証が必要なページとAPI
- 基本的なCI/CD設定

### Level 4: フル機能ベース 🏢 （将来拡張）
- RBAC（ロール・権限管理）
- 本格的な監視・ログ機能
- 高度なテスト・CI/CD

## 9. 命名・運用規約

### ディレクトリ構造
- `apps`, `packages`, `ops`, `dev` の4階層を標準構成とする
- `dev` はリポジトリ横断的な設定専用。実行コードを含めない

### API設計
- RESTful設計に準拠した統一的なURL設計パターン
- バージョニング: `/v1`, `/v2` でAPIバージョンを管理
- 一貫したレスポンス形式とエラーハンドリング

### セキュリティ
- 環境変数は Infisical で一元管理、`.env` ファイルはコミット禁止
- 認証レベル（Public / Authenticated / Authorized）に応じたアクセス制御
- レートリミット: @upstash/ratelimit + VercelKV による高精度制限制御
- CORS設定の適切な管理

### ドキュメント管理
- `ADR`（Architectural Decision Record）は `/docs/adr/` に記録
- API仕様は OpenAPIスキーマとして packages/shared-openapi/ で管理

---

## 10. 今後の拡張

### 短期的な拡張（Level 4 フル機能ベース）
- RBAC（ロール・権限管理）の実装
- Observability（OpenTelemetry, Sentry）の本格導入
- 完全なテストカバレッジ（単体・統合・E2E）
- 高度なCI/CD（Blue-Green、カナリアリリース）

### 中長期的な拡張
- 他のベース構成（モバイルアプリ等）との契約共有（OpenAPIベース）
- Temporal / Cloud Tasks で非同期ジョブ処理
- マイクロサービス分割対応
- Infrastructure as Code（Terraform, Kubernetes）

---

## � クイックスタート

### 新しいWebサービスを始める場合
1. **[00-1-development-workflow.md](./00-1-development-workflow.md)** で環境構築
2. このベースプロジェクトをforkまたはdownloadして使用開始
3. **[10-1-openapi-specifications-guidelines.md](./10-1-openapi-specifications-guidelines.md)** でAPI設計開始

### 既存プロジェクトに適用する場合
1. **[10-0-api-design-guidelines.md](./10-0-api-design-guidelines.md)** でAPI設計方針確認
2. **[10-2-security-specifications-guidelines.md](./10-2-security-specifications-guidelines.md)** でセキュリティ要件確認
3. 段階的に基盤コンポーネントを導入

---

## 📞 サポート・質問

- **Issue**: このリポジトリのIssueで質問・バグ報告
- **改善提案**: Pull Requestで改良案をお送りください
- **利用報告**: どのようなプロジェクトで活用されているかお知らせいただけると嬉しいです

---

## 📈 プロジェクト進捗

### Phase 1: 基盤ドキュメント作成 ✅ **完了**
- [x] プロジェクト仕様書・ドキュメント索引（00-0）
- [x] 開発ワークフロー・Infisical統合（00-1）
- [x] 技術仕様書一覧・ロードマップ（00-2）
- [x] API設計ガイドライン（10-0）
- [x] OpenAPI仕様書作成ガイドライン（10-1）
- [x] セキュリティ仕様ガイドライン（10-2）
- [x] データベース設計ガイドライン（10-3）

### Phase 2: 技術ガイドライン拡充 🚧 **進行中**
- [x] テスト戦略ガイドライン（10-4）
- [x] CI/CDパイプライン設計ガイドライン（10-5）
- [ ] 監視・ログ戦略ガイドライン（10-6）
- [ ] パフォーマンス最適化ガイドライン（10-7）

### Phase 3: 実装ベース提供 📋 **計画中**
- [ ] Level 1: スケルトンベース実装
- [ ] Level 2: 動作ベース実装
- [ ] Level 3: 認証ベース実装（推奨提供レベル）

---

© 2025 WebService-Next-Hono-Base Development Team

**🎯 Vision**: すべてのWebサービス開発チームが、高品質で安全な基盤の上で、本来のビジネス価値創造に集中できる世界を作る。
