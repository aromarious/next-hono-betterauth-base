# APIバージョニングのためのディレクトリ構造（予定）

## 概要

このドキュメントは、このプロジェクト（Next.js + Hono）で将来的に複数バージョンのAPIを保持する必要が生じた場合のディレクトリ構造ガイドラインです。

> [!NOTE]
> 現在のプロジェクトはWebアプリケーション単体であり、APIバージョニングは不要です。スマホアプリなどを追加する際に参照してください。

---

## リソースの分類

バックエンドに関連するリソースは、以下の3つのカテゴリに分類できます：

### 1. バージョンごとに異なるリソース（分離が必要）

以下のリソースは**各バージョンのディレクトリ内に配置**します：

| リソース | 配置場所 | 理由 |
|---------|---------|------|
| **エンドポイントルート** | `api/v0/routes/` | APIエンドポイントの定義がバージョンで異なる |
| **ビジネスロジック** | `api/v0/usecase/` | ビジネスルールがバージョンで変化する |
| **ドメインエンティティ** | `api/v0/domain/` | ドメインモデルがバージョンで異なる可能性 |
| **リポジトリ実装** | `api/v0/infrastructure/repositories/` | データアクセスパターンがバージョンで変わる可能性 |
| **統合テスト** | `api/v0/integration/` | 各バージョンのAPIをテストする |

### 2. バージョンに関わらず共有できるリソース

以下のリソースは**共有領域に配置**します：

| リソース | 配置場所 | 理由 |
|---------|---------|------|
| **データベース関連** | `packages/db/` | 全バージョンで同じDBスキーマ、接続、マイグレーションを使用 |
| **外部通信インフラ** | `packages/external-services/` | メール送信、通知など、バージョン間で共有される外部サービス連携 |
| **フレームワーク用リソースなど** |  | アプリケーション全体で一つしか存在しない設定やユーティリティなど |

> [!IMPORTANT]
> **共有すべきものは非常に限定的です。** 現状では設定やデータベース関連（`packages/db`）のみが共有対象です。外部との通信インフラ（メール送信など）も、将来的には共有候補ですが、現在のプロジェクトには存在しません。

### 3. 特例：E2Eテスト

| リソース | 配置場所 | 理由 |
|---------|---------|------|
| **E2Eテスト** | `e2e/` | Webアプリの場合、バージョン分けは不要 |

> [!NOTE]
> Webアプリケーション（Next.js）の場合、フロントエンドとバックエンドは常に一緒にデプロイされるため、E2Eテストをバージョンごとに分ける必要はありません。

---

## 現在の構造（バージョニング前）

現在の `apps/web/` ディレクトリ構造：

```plaintext
apps/web/
├── server/
│   ├── domain/              # ドメインエンティティ
│   │   ├── ports/
│   │   │   └── post.repository.ts
│   │   ├── post.entity.ts
│   │   └── post.entity.test.ts
│   │
│   ├── infrastructure/      # リポジトリ実装（永続化層）
│   │   └── repositories/
│   │       ├── post.repository.drizzle.ts
│   │       └── post.repository.integration.test.ts
│   │
│   ├── routes/             # ルート定義
│   │   ├── dto/
│   │   │   ├── post.mapper.ts
│   │   │   └── post.schema.ts
│   │   ├── posts.ts
│   │   └── system.ts
│   │
│   ├── usecase/            # ビジネスロジック
│   │   ├── post.usecase.ts
│   │   └── post.usecase.test.ts
│   │
│   ├── test/               # 統合テスト
│   │   ├── integration/
│   │   │   ├── posts.integration.test.ts      # v0 API のテスト
│   │   │   ├── system.integration.test.ts     # v0 API のテスト
│   │   │   └── ratelimit.integration.test.ts  # v0 API のテスト
│   │   ├── integration-global-setup.ts        # テスト用グローバルセットアップ
│   │   └── load-env.ts                         # 環境変数ロード
│   │
│   ├── lib/
│   └── index.ts            # エントリーポイント
│
└── e2e/                    # E2Eテスト（server と並列）
    ├── api/
    │   ├── posts.spec.ts           # v0 API のE2Eテスト
    │   ├── health.spec.ts          # v0 API のE2Eテスト
    │   └── ratelimit.spec.ts       # v0 API のE2Eテスト
    └── smoke.spec.ts               # スモークテスト
```

---

## 準備段階：構造の整理

バージョニング対応を行う前に、まず現在の統合テストの配置を整理します。これにより、後のバージョニング対応がスムーズになります。

### 変更内容

**統合テストの配置を変更:**

- `server/test/integration/` → `server/test-integration/` に移動
- テスト用ヘルパーは `server/test-setup/` に集約

### 整理後の構造

```plaintext
apps/web/
├── server/
│   ├── domain/              # ドメインエンティティ
│   │   ├── ports/
│   │   │   └── post.repository.ts
│   │   ├── post.entity.ts
│   │   └── post.entity.test.ts
│   │
│   ├── infrastructure/      # リポジトリ実装（永続化層）
│   │   └── repositories/
│   │       ├── post.repository.drizzle.ts
│   │       └── post.repository.integration.test.ts
│   │
│   ├── routes/             # ルート定義
│   │   ├── dto/
│   │   │   ├── post.mapper.ts
│   │   │   └── post.schema.ts
│   │   ├── posts.ts
│   │   └── system.ts
│   │
│   ├── usecase/            # ビジネスロジック
│   │   ├── post.usecase.ts
│   │   └── post.usecase.test.ts
│   │
│   ├── test-integration/   # 統合テスト（testから移動）
│   │   ├── posts.integration.test.ts
│   │   ├── system.integration.test.ts
│   │   └── ratelimit.integration.test.ts
│   │
│   ├── test-setup/         # テスト用ヘルパー（統合）
│   │   ├── integration-global-setup.ts
│   │   └── load-env.ts
│   │
│   ├── lib/
│   └── index.ts            # エントリーポイント
│
└── e2e/                    # E2Eテスト（server と並列）
    ├── api/
    │   ├── posts.spec.ts
    │   ├── health.spec.ts
    │   └── ratelimit.spec.ts
    └── smoke.spec.ts
```

> [!NOTE]
> この段階では、まだバージョニングは行いません。統合テストの配置を整理することで、次のバージョニング対応時に `server/` 直下のコードを `server/api/v0/` にまとめて移動しやすくなります。

---

## バージョニング対応後の構造

APIバージョニングに対応させると、以下のように変化します：

```plaintext
apps/web/
├── server/
│   ├── api/
│   │   └── v0/                      # 現在のAPIをv0として移行
│   │       ├── domain/              # v0固有のドメインエンティティ
│   │       │   ├── ports/
│   │       │   │   └── post.repository.ts
│   │       │   ├── post.entity.ts
│   │       │   └── post.entity.test.ts
│   │       │
│   │       ├── infrastructure/      # v0のリポジトリ実装
│   │       │   └── repositories/
│   │       │       ├── post.repository.drizzle.ts
│   │       │       └── post.repository.integration.test.ts
│   │       │
│   │       ├── routes/              # v0のルート定義
│   │       │   ├── dto/
│   │       │   │   ├── post.mapper.ts
│   │       │   │   └── post.schema.ts
│   │       │   ├── posts.ts
│   │       │   └── system.ts
│   │       │
│   │       ├── usecase/             # v0のビジネスロジック
│   │       │   ├── post.usecase.ts
│   │       │   └── post.usecase.test.ts
│   │       │
│   │       ├── test-integration/    # v0の統合テスト（testから移動）
│   │       │   ├── posts.integration.test.ts
│   │       │   ├── system.integration.test.ts
│   │       │   └── ratelimit.integration.test.ts
│   │       │
│   │       └── index.ts             # v0のエントリーポイント
│   │
│   ├── test-setup/                  # 統合テスト用セットアップ（共有）
│   │   ├── integration-global-setup.ts
│   │   └── load-env.ts
│   │
│   └── index.ts                     # 全バージョンの統合
│
└── e2e/                             # E2Eテスト（serverと並列、変更なし）
    ├── api/
    │   ├── posts.spec.ts
    │   ├── health.spec.ts
    │   └── ratelimit.spec.ts
    └── smoke.spec.ts
```

> [!IMPORTANT]
> **主な変更点:**
>
> - `server/` 直下のコードを `server/api/v0/` に移動
> - `infrastructure/repositories/` も各バージョンに配置
> - `test-integration/` を `server/api/v0/test-integration/` に移動
> - `test-setup/` はそのまま残す（全バージョン共通）
> - **`e2e/` は変更なし**（Webアプリの場合）

---

## 移行ガイド

### 1. バージョンごとに移動するもの

- `server/domain/` → `server/api/v0/domain/`
- `server/infrastructure/` → `server/api/v0/infrastructure/`
- `server/routes/` → `server/api/v0/routes/`
- `server/usecase/` → `server/api/v0/usecase/`
- `server/test-integration/` → `server/api/v0/test-integration/`

### 2. 共有領域に残すもの

- `packages/db/` - データベーススキーマ、接続、マイグレーション
- `server/test-setup/integration-global-setup.ts` - 統合テスト用グローバルセットアップ
- `server/test-setup/load-env.ts` - 環境変数ロード

### 3. 変更しないもの

- `e2e/` - E2Eテストはそのまま（Webアプリの場合、バージョン分けは不要）

### 4. エントリーポイントの変更

```typescript
// apps/web/server/index.ts（移行後）
import { OpenAPIHono } from "@hono/zod-openapi"
import { cors } from "hono/cors"
import { env } from "@/env"
import { API_VERSIONS } from "../lib/api-versions"
import { healthRoute } from "./api/v0/routes/system"  // v0に移動
import v0 from "./api/v0"  // v0をインポート

const app = new OpenAPIHono({ strict: false }).basePath("/api")

app
  .use("/*", cors({ /* ... */ }))
  .use("*", async (c, next) => { /* logger */ })

const routes = app
  .route("/", healthRoute)
  .route(`/${API_VERSIONS.v0}`, v0)  // v0をマウント

export type AppType = typeof routes
export type ApiType = typeof v0
export default app
```

```typescript
// apps/web/server/api/v0/index.ts（新規作成）
import { OpenAPIHono } from "@hono/zod-openapi"
import { systemRoutes } from "./routes/system"
import { postsRoutes } from "./routes/posts"

const v0 = new OpenAPIHono()
  .route("/", systemRoutes)
  .route("/", postsRoutes)

export default v0
```

---

## 新バージョン（v1）追加時

将来的に v1 を追加する場合：

```plaintext
apps/web/server/
├── api/
│   ├── v0/              # 既存のv0（変更なし）
│   │   ├── domain/
│   │   ├── infrastructure/
│   │   ├── routes/
│   │   ├── usecase/
│   │   ├── test-integration/
│   │   └── index.ts
│   │
│   └── v1/              # 新しいv1
│       ├── domain/      # v1の新しいドメインモデル
│       ├── infrastructure/  # v1のリポジトリ実装
│       ├── routes/      # v1の新しいAPI仕様
│       ├── usecase/     # v1の新しいビジネスロジック
│       ├── test-integration/ # v1のテスト
│       └── index.ts
│
├── test-setup/          # 統合テスト用セットアップ（全バージョン共通）
└── index.ts
```

```typescript
// apps/web/server/index.ts
import v0 from "./api/v0"
import v1 from "./api/v1"  // v1を追加

const routes = app
  .route("/", healthRoute)
  .route(`/${API_VERSIONS.v0}`, v0)
  .route(`/${API_VERSIONS.v1}`, v1)  // v1をマウント
```

これにより、v0 を壊すことなく v1 を追加でき、両方のバージョンを同時にサポートできます。

---

## テストの配置原則

### ユニットテスト

#### 被テストコードと同じフォルダに配置

例：`post.entity.test.ts` は `post.entity.ts` のそばに配置

### 統合テスト

#### 各バージョンのディレクトリ内に配置

- v0のAPI統合テスト → `server/api/v0/test-integration/`
- テスト用ヘルパー → `server/test-setup/` に残す（全バージョン共通）
- リポジトリ層のテスト → `server/api/v0/infrastructure/repositories/` に配置

### E2Eテスト

#### serverと並列に配置（バージョン分けなし）

- `e2e/` にそのまま配置
- Webアプリの場合、最新の組み合わせのみテストすればよい

---

## 参考：データベーススキーマ変更のガイドライン

複数バージョンのAPIをサポートする際のデータベーススキーマ変更については、別ドキュメント [`api-versioning-database-guidelines.md`](./api-versioning-database-guidelines.md) を参照してください。

**要点:**

- データベーススキーマは全バージョンで共有
- スキーマ変更は後方互換性を保つ必要がある
- 新しいカラムはnullableまたはdefault値付きで追加
