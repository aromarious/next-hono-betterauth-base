# Hono API 実装標準

`apps/web/server` 配下の Hono アプリケーションにおける実装ルールです。

## 概要

- **Registry (`server/index.ts`)**: アプリケーションのエントリポイント。「目次」としての役割に徹し、具体的なルート定義は行いません。
- **Feature Modules (`server/routes/*.ts`)**: 機能ごとのルート定義ファイル。インスタンス化された `OpenAPIHono` オブジェクトをエクスポートします。

## 1. Registry (`server/index.ts`)

`apps/web/server/index.ts` は、グローバルミドルウェアの適用と、各機能モジュールのマウントのみを行います。

```typescript
import { OpenAPIHono } from "@hono/zod-openapi"
import { API_VERSIONS } from "../lib/api-versions"
// ✅ Good: ルートインスタンスをインポート
import { systemRoutes } from "./routes/system"
import { postsRoutes } from "./routes/posts"

// ベースアプリの作成
const app = new OpenAPIHono({ strict: false }).basePath("/api")

// v0 アプリの作成とルートの適用 (チェーンしていく)
const v0 = new OpenAPIHono()
  .route("/", systemRoutes)
  .route("/", postsRoutes)

// マウント
const routes = app
  .route(`/${API_VERSIONS.v0}`, v0)

export type AppType = typeof routes
export default app
```

### 禁止事項

- `index.ts` 内で `.get()` や `.post()` を直接使用してルートを定義すること。
- `/health` などのシステム系ルートも `routes/system.ts` に移動し、マウントしてください。

## 2. Feature Modules (`server/routes/*.ts`)

各機能モジュールは、独立した `OpenAPIHono` インスタンスを作成し、それをエクスポートするパターンを採用しています。

### 構成パターン

1. **ルート定義 (`createRoute`)**: OpenAPI定義を記述します。
2. **実装とエクスポート**: `new OpenAPIHono()` を作成し、`.openapi()` でルートとハンドラを登録します。

```typescript
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { db } from "@packages/db"
import { PostRepositoryImpl as PostRepository } from "@/server/infrastructure/repositories/post.repository.drizzle"
import { PostUseCase } from "@/server/usecase/post.usecase"

// 0. 依存関係のセットアップ (手動DI)
const repository = new PostRepository(db)
const useCase = new PostUseCase(repository)
const tags = ["v0/Posts"]

// 1. アプリケーションインスタンスの作成
export const postsRoutes = new OpenAPIHono()

// 2. ルート定義と実装の登録
  .openapi(
    createRoute({
      method: "get",
      path: "/posts",
      tags,
      responses: {
        200: {
          content: {
            "application/json": {
              schema: z.array(PostResponseSchema),
            },
          },
          description: "List all posts",
        },
      },
    }),
    async (c) => {
      const posts = await useCase.listPosts()
      return c.json(posts.map(toPostResponse))
    }
  )
  // メソッドチェーンで呼び出し可能
  .openapi(
    createRoute({
      method: "post",
      path: "/posts",
      tags,
      // ...
    }),
    async (c) => {
      // ...
    }
  )
```

### このパターンの利点

- **モジュール性**: 各ファイルが自己完結したアプリケーションとして振る舞います。
- **型安全性**: エクスポートされた `postsRoutes` を結合することで、最終的な `AppType` が正確に生成され、クライアント (`hc`) での型安全性が保証されます。

## 3. ディレクトリ構成とアーキテクチャ

`apps/web/server` 配下は、簡易的な **ドメイン駆動設計 (DDD)** ライクな階層構造を採用しています。

```text
packages/
└── db/               # 共有DB設定 (Drizzle Schema, Client)

apps/web/server/
├── domain/           # ドメイン層: ビジネスロジック、型定義、インターフェース
│   ├── ports/        # Port: リポジトリのインターフェース定義
│   └── *.entity.ts   # Entity: ドメインモデルの振る舞いと定義
├── usecase/          # ユースケース層 (Application Service): ドメインロジックの利用
│   └── *.usecase.ts  # UseCase: リポジトリの呼び出しとトランザクション管理
├── infrastructure/   # インフラ層: 外部システムへのアダプター
│   └── repositories/ # Repository Impl: データの永続化実装 (packages/dbを利用)
└── routes/           # プレゼンテーション層: HTTPハンドラ (Controller)
```

## 4. アーキテクチャの責務とパターン

### レイヤーの役割分担

1. **Routes (Controller/Handler)**
    - **役割**: HTTPリクエストの翻訳係。
    - **責務**: バリデーション (`createRoute`のschema)、パラメータ取得 (`.req.param`)、エラーのHTTPステータス変換。
    - **禁止**: 複雑なビジネスロジックの直接記述。
2. **UseCases (Application Service)**
    - **役割**: アプリケーション機能の提供係。
    - **責務**: Entityの操作、リポジトリへの保存(`save`)、削除(`delete`)等のオーケストレーション。
    - **特徴**: HTTPやフレームワーク(Hono)に依存しない純粋なクラス。
3. **Repositories**
    - **役割**: データの保管庫。
    - **責務**: DBクエリの発行(`packages/db`の操作)、永続化、再構築(Reconstruct)。

### 参照系と更新系の分離 (CQRS-lite)

シンプルさと堅牢さのバランスを取るため、以下のハイブリッドな呼び出しパタンを採用しています。

- **更新系 (Write / Command)**: `Route -> UseCase -> Repository`
  - 副作用のある操作（作成、更新、削除）は、必ずUseCaseを経由して厳格に処理します。
- **参照系 (Read / Query)**: `Route -> Repository`
  - 単純なデータ取得（一覧、詳細）は、UseCaseを作らずRouteからRepositoryを直接呼び出して構いません（ボイラープレートの削減）。

## 5. ドメインモデル実装標準

### Entity (`*.entity.ts`)

- **クラスベース**: データと振る舞いをカプセル化するために `class` を使用します。
- **コンストラクタの隠蔽**: `private constructor` とし、静的ファクトリメソッド (`create`, `reconstruct`) を経由してインスタンス化します。
- **不変性 (Immutability)**: 原則として不変とし、状態変更メソッド (`update` 等) は新しいインスタンスを返します。

```typescript
export class Post {
  // コンストラクタ引数は (CoreData, SystemMetadata?)
  private constructor(
    private readonly core: PostCoreType,
    private readonly system?: { id: string, ... }
  ) {}

  // 新規作成: CoreDataのみ受け取る
  public static create(payload: PostCoreType): Post { ... }
  
  // 再構築: DBからのデータを受け取る
  public static reconstruct(payload: PostType): Post { ... }
}
```

## 6. スキーマ定義の分離と役割

「スキーマ」と呼ばれる定義が複数存在するため、以下のように役割を明確に分離します。

| 種別 | ファイル | 役割 | 備考 |
| :--- | :--- | :--- | :--- |
| **Drizzle Schema** | `packages/db/src/schema.ts` | **DBのテーブル定義** (Source of Truth) | マイグレーションの元となる。アプリケーションロジックからは原則参照しない。 |
| **Domain Schema** | `domain/*.entity.ts` | **ドメインの完全な型定義** | `PostSchema` (Full), `PostCoreSchema`。Entityの実装と密結合。内部では `Date` 型を使用。 |
| **DTO Schema** | `routes/dto/*.schema.ts` | **API境界での型定義** | `CreatePostSchema`, `UpdatePostSchema`, `PostResponseSchema`。HTTP境界での型変換ルールを定義。 |

### DTO Schema の配置理由

`CreatePostSchema`, `UpdatePostSchema`, `PostResponseSchema` などは、全て**プレゼンテーション層の責務**です。理由:

1. **HTTP境界での型変換を担う**: ドメイン層では `Date` 型で扱うフィールドも、JSON では文字列として表現する必要があります。
2. **外界からの INPUT/OUTPUT 契約**: API仕様として、クライアントとの契約を定義します。

## 7. リポジトリ実装標準

- **インターフェース分離**: `domain/ports` にインターフェースを定義し、`infrastructure/repositories` で実装します。
- **Saveメソッド**: `create` と `update` を分けることもありますが、基本は `save(entity)` で統一し、内部で `isPersisted()` 等を用いて `insert/upsert` を振り分けます。
- **戻り値**: 保存後の状態を反映した新しい `Entity` を返します（生成されたID等を呼び出し元に伝えるため）。

## 8. Drizzle Schema 定義標準

`packages/db/src/schema.ts` の記述ルールです。

```typescript
// パスカルケース + Table サフィックスを使用してください
export const PostTable = pgTable("posts", (t) => ({
  // カラム名はキャメルケース (DB上はスネークケース等の変換を想定するか、そのまま)
  id: t.text("id").primaryKey().$defaultFn(() => ulid()),
  
  // 必須項目は .notNull() を付与
  title: t.text("title").notNull(),
  
  // タイムスタンプは defaultNow().notNull() を標準とします
  createdAt: t.timestamp("created_at").defaultNow().notNull(),
  updatedAt: t.timestamp("updated_at").defaultNow().notNull(),
}))

// 型定義の自動生成（Entityとは別物）
export type Post = typeof PostTable.$inferSelect
export type NewPost = typeof PostTable.$inferInsert
```

## 9. バリデーション (OpenAPI)

`@hono/zod-openapi` の `createRoute` を使用して、OpenAPI 定義の一部としてバリデーションルールを記述します。

```typescript
const createPostRoute = createRoute({
  method: "post",
  path: "/posts",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreatePostSchema, // Zod Schema
        },
      },
    },
  },
  responses: { ... }
})

// 実装側では c.req.valid("json") で型推論されたペイロードを取得できます
.openapi(createPostRoute, async (c) => {
  const args = c.req.valid("json") // Type: z.infer<typeof CreatePostSchema>
  // ...
})
```

## 10. DTO マッパーパターン

ドメインエンティティ (`Post` など) をAPIレスポンス形式に変換する処理は、**プレゼンテーション層の責務**です。専用のマッパー関数として `routes/dto/` に配置します。

```typescript
// routes/dto/post.mapper.ts
export function toPostResponse(post: Post) {
  return {
    id: post.id,
    title: post.title,
    createdAt: post.createdAt.toISOString(),
    // ...
  }
}
```
