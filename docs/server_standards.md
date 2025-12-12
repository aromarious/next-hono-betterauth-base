# Hono API 実装標準

`apps/web/server` 配下の Hono アプリケーションにおける実装ルールです。

## 概要

- **Registry (`server/index.ts`)**: アプリケーションのエントリポイント。「目次」としての役割に徹し、具体的なルート定義は行いません。
- **Feature Modules (`server/routes/*.ts`)**: 機能ごとのルート定義ファイル。

## 1. Registry (`server/index.ts`)

`apps/web/server/index.ts` は、グローバルミドルウェアの適用と、各機能モジュールのマウントのみを行います。

```typescript
// ✅ Good: 設定関数をインポート
import { configureSystemRoutes } from "./routes/system"
import { configurePostsRoutes } from "./routes/posts"

// ベースアプリの作成
const app = new OpenAPIHono().basePath("/api")

// v0 アプリの作成とルートの適用 (チェーンしていく)
const v0 = new OpenAPIHono()
const v0_with_system = configureSystemRoutes(v0)
const v0_final = configurePostsRoutes(v0_with_system)

// マウント
const routes = app.route("/v0", v0_final)

export type AppType = typeof routes
export default app
```

### 禁止事項

- `index.ts` 内で `.get()` や `.post()` を直接使用してルートを定義すること。
- `/health` などのシステム系ルートも `routes/system.ts` に移動し、マウントしてください。

## 2. Feature Modules (`server/routes/*.ts`)

各機能モジュールは、**設定関数 (Configuration Function)** をエクスポートするパターンを採用しています。これは、Hono RPC (`hc`) の型推論を正しく機能させるために重要です。

### 構成パターン

1. **ルート定義 (`createRoute`)**: OpenAPI定義を記述します。
2. **設定関数 (`configure...Routes`)**: アプリケーションインスタンスを受け取り、ルートを登録します。

```typescript
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import type { Env } from "hono"

// 1. ルート定義 (OpenAPI)
const listPostsRoute = createRoute({
  method: "get",
  path: "/",
  responses: { ... }
})

// 2. 設定関数 (ジェネリクスを使用して型情報を維持する)
// <E extends Env, S extends {}, P extends string> は必須です
export const configurePostsRoutes = <E extends Env, S extends {}, P extends string>(
  app: OpenAPIHono<E, S, P>
) => {
  // 必要であればここで Repository / UseCase をインスタンス化 (DI)
  const repository = new PostRepository(db)
  const useCase = new PostUseCase(repository)

  return app
    .openapi(listPostsRoute, async (c) => {
      const posts = await useCase.listPosts()
      return c.json(posts)
    })
    // 複数のルートをメソッドチェーンで繋ぐ
    .openapi(createPostRoute, async (c) => { ... })
}
```

### なぜこのパターンなのか？

従来の `const app = new OpenAPIHono(); export default app;` パターンでは、`.route()` でマウントした際に型情報の一部（特にSchema定義）が失われ、クライアント側 (`hc`) で `any` 型になってしまう問題があります。
この「設定関数パターン」では、ジェネリクスを通じて親アプリケーションの型定義を維持したままルートを追加できるため、完全な型安全性を確保できます。

## 3. ディレクトリ構成とアーキテクチャ

`apps/web/server` 配下は、簡易的な **ドメイン駆動設計 (DDD)** ライクな階層構造を採用しています。

```text
server/
├── domain/           # ドメイン層: ビジネスロジック、型定義、インターフェース
│   ├── ports/        # Port: リポジトリのインターフェース定義
│   └── *.entity.ts   # Entity: ドメインモデルの振る舞いと定義
├── usecase/          # ユースケース層 (Application Service): ドメインロジックの利用
│   └── *.usecase.ts  # UseCase: リポジトリの呼び出しとトランザクション管理
├── infrastructure/   # インフラ層: DB接続、外部APIクライアント
│   ├── db/           # Drizzle Schema, DB Client
│   └── repositories/ # Repository Impl: データの永続化実装
└── routes/           # プレゼンテーション層: HTTPハンドラ (Controller)
```

## 4. アーキテクチャの責務とパターン

### レイヤーの役割分担

1. **Routes (Controller/Handler)**
    - **役割**: HTTPリクエストの翻訳係。
    - **責務**: バリデーション (`.req.valid`)、パラメータ取得 (`.req.param`)、エラーのHTTPステータス変換。
    - **禁止**: 複雑なビジネスロジックの直接記述。
2. **UseCases (Application Service)**
    - **役割**: アプリケーション機能の提供係。
    - **責務**: Entityの操作、リポジトリへの保存(`save`)、削除(`delete`)等のオーケストレーション。
    - **特徴**: HTTPやフレームワーク(Hono)に依存しない純粋なクラス。
3. **Repositories**
    - **役割**: データの保管庫。
    - **責務**: DBクエリの発行、永続化、再構築(Reconstruct)。

### 参照系と更新系の分離 (CQRS-lite)

シンプルさと堅牢さのバランスを取るため、以下のハイブリッドな呼び出しパタンを採用しています。

- **更新系 (Write / Command)**: `Route -> UseCase -> Repository`
  - 副作用のある操作（作成、更新、削除）は、必ずUseCaseを経由して厳格に処理します。
- **参照系 (Read / Query)**: `Route -> Repository`
  - 単純なデータ取得（一覧、詳細）は、UseCaseを作らずRouteからRepositoryを直接呼び出して構いません（ボイラープレートの削減）。

### 依存性の注入 (Dependency Injection)

テスト容易性を高めるため、構成要素はコンストラクタ経由で依存先を受け取ります。現状はルート定義ファイル内で手動でDIを組み立てます。

```typescript
// server/routes/posts.ts 内の configure 関数での組み立て例

export const configurePostsRoutes = <E extends Env, S extends {}, P extends string>(
  app: OpenAPIHono<E, S, P>
) => {
  // 1. DB Client
  const repository = new PostRepository(db)
  
  // 2. UseCase (Repositoryを受け取る)
  const useCase = new PostUseCase(repository)

  // 3. Routeは UseCase を使う
  return app.openapi(createRoute, async (c) => {
      await useCase.createPost(...)
  })
}
```

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

### Zod Schema 戦略

スキーマ定義は「最大（Full）」から「最小（Core）」を抽出する戦略をとります。

1. **Full Schema (`PostSchema`)**: DBに保存される完全なデータ構造（ID, Timestamps含む）。
2. **Core Schema (`PostCoreSchema`)**: Fullからシステム管理項目 (`omit({ id, ... })`) を除いた、純粋なデータ構造。
3. **Props Type**: `PostCoreType` と `Partial<Pick<...>>` (システム項目) の交差型で定義し、DRYを維持します。

```typescript
// 1. Full
export const PostSchema = z.object({ id: z.string(), ... });
// 2. Core (Derived)
export const PostCoreSchema = PostSchema.omit({ id: true, ... });
// 3. Props Type (Hybrid)
type PostProps = PostCoreType & Partial<Pick<PostType, "id" | ...>>;
```

## 6. スキーマ定義の分離と役割

「スキーマ」と呼ばれる定義が複数存在するため、以下のように役割を明確に分離します。

| 種別 | ファイル | 役割 | 備考 |
| :--- | :--- | :--- | :--- |
| **Drizzle Schema** | `infrastructure/db/schema.ts` | **DBのテーブル定義** (Source of Truth) | マイグレーションの元となる。アプリケーションロジックからは原則参照しない。 |
| **Domain Schema** | `domain/*.entity.ts` | **ドメインの完全な型定義** | `PostSchema` (Full), `PostCoreSchema`。Entityの実装と密結合。内部では `Date` 型を使用。 |
| **DTO Schema** | `routes/dto/*.schema.ts` | **API境界での型定義** | `CreatePostSchema`, `UpdatePostSchema`, `PostResponseSchema`。HTTP境界での型変換ルールを定義。 |

### DTO Schema の配置理由

`CreatePostSchema`, `UpdatePostSchema`, `PostResponseSchema` などは、全て**プレゼンテーション層の責務**です。理由:

1. **HTTP境界での型変換を担う**: ドメイン層では `Date` 型で扱うフィールドも、JSON では文字列として表現する必要があります。
2. **外界からの INPUT/OUTPUT 契約**: API仕様として、クライアントとの契約を定義します。
3. **ドメインとは異なる関心事**: 将来、日時フィールドがユーザー入力に含まれる場合、`CreatePostSchema` も `z.string().datetime()` による変換が必要になります。

```typescript
// domain/post.entity.ts (ドメイン層)
export const PostSchema = z.object({
  id: z.string(),
  title: z.string(),
  publishAt: z.date(),  // ドメイン内では Date オブジェクト
})

// routes/dto/post.schema.ts (プレゼンテーション層)
export const CreatePostSchema = z.object({
  title: z.string(),
  publishAt: z.string().datetime(),  // JSON では文字列
})
```

### 実装例: `routes/dto/*.schema.ts`

```typescript
import { z } from "zod"
import { PostCoreSchema, PostSchema } from "@/server/domain/post.entity"

// ドメインスキーマを再エクスポート（必要に応じて）
export { PostCoreSchema, PostSchema }

// API レスポンス用スキーマ (Date → string への変換)
export const PostResponseSchema = PostSchema.omit({
  createdAt: true,
  updatedAt: true,
}).extend({
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

// API リクエスト用スキーマ
export const CreatePostSchema = PostCoreSchema
export const UpdatePostSchema = PostCoreSchema.partial()

// 型エクスポート
export type CreatePostInput = z.infer<typeof CreatePostSchema>
export type UpdatePostInput = z.infer<typeof UpdatePostSchema>
```

## 7. リポジトリ実装標準

- **インターフェース分離**: `domain/ports` にインターフェースを定義し、`infrastructure/repositories` で実装します。
- **Saveメソッド**: `create` と `update` を分けることもありますが、基本は `save(entity)` で統一し、内部で `isPersisted()` 等を用いて `insert/upsert` を振り分けます。
- **戻り値**: 保存後の状態を反映した新しい `Entity` を返します（生成されたID等を呼び出し元に伝えるため）。

- **戻り値**: 保存後の状態を反映した新しい `Entity` を返します（生成されたID等を呼び出し元に伝えるため）。

## 8. Drizzle Schema 定義標準

`apps/web/server/infrastructure/db/schema.ts` の記述ルールです。

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

## 9. バリデーション

`@hono/zod-validator` を使用し、ルート定義内でバリデーションを行います。

```typescript
.post(
  "/",
  zValidator("json", z.object({ ... })),
  async (c) => {
    // c.req.valid("json") で型安全に取得
  }
)
```

## 10. DTO マッパーパターン

ドメインエンティティ (`Post` など) をAPIレスポンス形式に変換する処理は、**プレゼンテーション層の責務**です。エンティティのメソッド (`toResponse()` など) として実装するのではなく、専用のマッパー関数として `routes/dto/` に配置します。

### 配置場所

```text
routes/dto/
├── post.schema.ts   # DTOスキーマ定義
└── post.mapper.ts   # DTO変換関数
```

### 実装例: `routes/dto/*.mapper.ts`

```typescript
import type { Post } from "@/server/domain/post.entity"

/**
 * Convert Post entity to API response format
 * Transforms Date objects to ISO string format
 */
export function toPostResponse(post: Post) {
  if (!post.id || !post.createdAt || !post.updatedAt) {
    throw new Error("Cannot convert unpersisted Post to response format")
  }
  
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  }
}
```

### 使用例: `routes/*.ts`

```typescript
import { toPostResponse } from "./dto/post.mapper"

export const configurePostsRoutes = <E extends Env, S extends {}, P extends string>(
  app: OpenAPIHono<E, S, P>
) => {
  return app
    .openapi(getPostRoute, async (c) => {
      const post = await postRepository.findById(id)
      if (!post) {
        return c.json({ error: "Post not found" }, 404)
      }
      return c.json(toPostResponse(post))
    })
    .openapi(listPostsRoute, async (c) => {
      const allPosts = await postRepository.findAll()
      return c.json(allPosts.map((p) => toPostResponse(p)))
    })
}
```

### なぜエンティティメソッドではないのか？

- **関心の分離**: ドメインエンティティは HTTP や JSON 形式を知る必要がありません。
- **単一責任の原則**: エンティティの責務はビジネスロジックの表現であり、API レスポンス形式への変換ではありません。
- **テスト容易性**: マッパー関数は純粋関数として独立してテストできます。
