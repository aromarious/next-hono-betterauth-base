# Hono API 実装標準

`apps/web/server` 配下の Hono アプリケーションにおける実装ルールです。

## 概要

- **Registry (`server/index.ts`)**: アプリケーションのエントリポイント。「目次」としての役割に徹し、具体的なルート定義は行いません。
- **Feature Modules (`server/routes/*.ts`)**: 機能ごとのルート定義ファイル。

## 1. Registry (`server/index.ts`)

`apps/web/server/index.ts` は、グローバルミドルウェアの適用と、各機能モジュールのマウントのみを行います。

```typescript
// ✅ Good: 目次として機能している
import system from "./routes/system"
import posts from "./routes/posts"

const app = new Hono().basePath("/api")

// Middleware
app.use("/*", cors(...))

// Routes Mounting
const routes = app
  .route("/", system)
  .route("/posts", posts)

export type AppType = typeof routes
export default app
```

### 禁止事項

- `index.ts` 内で `.get()` や `.post()` を直接使用してルートを定義すること。
- `/health` などのシステム系ルートも `routes/system.ts` に移動し、マウントしてください。

## 2. Feature Modules (`server/routes/*.ts`)

各機能モジュールは、独立した `Hono` インスタンスとして定義し、メソッドチェーン形式で記述します。

### インスタンス化とチェーン

```typescript
import { Hono } from "hono"

// ✅ Good: 新規インスタンスを作成し、チェーンで繋ぐ
const app = new Hono()
  .get("/", (c) => c.json({}))
  .post("/", (c) => c.json({}))

export default app
```

### ハンドラの分離（推奨）

ルート定義が見えにくくなる場合、ハンドラ関数を分離することを推奨します。

```typescript
// ✅ Good: 定義と実装の分離
const app = new Hono()
  .get("/", getPosts)
  .post("/", createPostValidator, createPost)
```

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
// server/routes/posts.ts での組み立て例

// 1. DB Client
import { db } from "@/server/infrastructure/db/client"

// 2. Repository (DBを受け取る)
const postRepository = new PostRepository(db)

// 3. UseCase (Repositoryを受け取る)
const postUseCase = new PostUseCase(postRepository)

// 4. Routeは UseCase (またはRepo) を使う
app.post("/", ..., async (c) => {
    await postUseCase.createPost(...)
})
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
| **Domain Schema** | `domain/*.entity.ts` | **ドメインの完全な型定義** | `PostSchema` (Full), `PostCoreSchema`。Entityの実装と密結合。 |
| **Validation Schema** | `domain/*.schema.ts` | **API入力バリデーション用** | `create/update` 等のユースケースごとのスキーマ定義。EntityのSchemaをimport/exportして使用する。 |

### 実装例: `domain/*.schema.ts`

Controller (Routes) からEntity定義を直接参照するのを防ぐため、バリデーション用スキーマはこのファイル経由で公開します。

```typescript
import { z } from "zod"
import { PostCoreSchema } from "./post.entity"

// Entity定義を再エクスポート
export { PostCoreSchema }

// ユースケース固有の派生 (CreateはCoreと等価、UpdateはPartial)
export const UpdatePostSchema = PostCoreSchema.partial()
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
