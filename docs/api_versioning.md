# API バージョニングガイド

このドキュメントでは、新しい API バージョン（v1、v2 など）を追加する方法を説明します。

## 概要

現在のプロジェクトでは、API バージョニングを以下の構造で管理しています：

- `/api/health` - バージョンレスのヘルスチェック
- `/api/v0/*` - 初期バージョンの API
- `/api/v1/*` - 新しいバージョンの API（将来的に追加）

## v1 API の追加手順

### 1. ルートファイルの作成

#### `apps/web/server/routes/v1/system.ts`

```typescript
import { createRoute, type OpenAPIHono, z } from "@hono/zod-openapi"
import type { Env } from "hono"

// v1 health endpoint
const v1HealthRoute = createRoute({
  method: "get",
  path: "/health",
  tags: ["v1/System"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            status: z.string(),
            version: z.string(),
          }),
        },
      },
      description: "Health check endpoint",
    },
  },
})

const helloRoute = createRoute({
  method: "get",
  path: "/hello",
  tags: ["v1/System"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
            version: z.string(),
          }),
        },
      },
      description: "Simple hello endpoint",
    },
  },
})

export const configureV1SystemRoutes = <
  E extends Env,
  S extends {},
  P extends string,
>(
  app: OpenAPIHono<E, S, P>,
) => {
  return app
    .openapi(v1HealthRoute, (c) => {
      return c.json({ status: "ok", version: "v1" })
    })
    .openapi(helloRoute, (c) => {
      return c.json({ message: "Hello from Hono v1!", version: "v1" })
    })
}
```

#### `apps/web/server/routes/v1/posts.ts`

```typescript
import { createRoute, type OpenAPIHono, z } from "@hono/zod-openapi"
import {
  CreatePostSchema,
  PostSchema,
  UpdatePostSchema,
} from "@/server/domain/post.schema"
import { db } from "@/server/infrastructure/db/client"
import { PostRepositoryImpl as PostRepository } from "@/server/infrastructure/repositories/post.repository.drizzle"
import { PostUseCase } from "@/server/usecase/post.usecase"
import type { Env } from "hono"

// v1 用のリポジトリとユースケースのインスタンス化
const postRepository = new PostRepository(db)
const postUseCase = new PostUseCase(postRepository)
const tags = ["v1/Posts"]

// v1 では、ページネーションやフィルタリングなどの新機能を追加できます
const listPostsRoute = createRoute({
  method: "get",
  path: "/posts",
  tags,
  request: {
    query: z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(PostSchema),
            pagination: z.object({
              page: z.number(),
              limit: z.number(),
              total: z.number(),
            }),
          }),
        },
      },
      description: "List all posts with pagination",
    },
  },
})

const getPostRoute = createRoute({
  method: "get",
  path: "/posts/:id",
  tags,
  responses: {
    200: {
      content: {
        "application/json": {
          schema: PostSchema,
        },
      },
      description: "Get a post by ID",
    },
    404: {
      description: "Post not found",
    },
    400: {
      description: "Invalid ID",
    },
  },
})

const createPostRoute = createRoute({
  method: "post",
  path: "/posts",
  tags,
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreatePostSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: PostSchema,
        },
      },
      description: "Create a new post",
    },
  },
})

const updatePostRoute = createRoute({
  method: "put",
  path: "/posts/:id",
  tags,
  request: {
    body: {
      content: {
        "application/json": {
          schema: UpdatePostSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: PostSchema,
        },
      },
      description: "Update a post",
    },
    404: {
      description: "Post not found",
    },
    400: {
      description: "Invalid ID",
    },
  },
})

const deletePostRoute = createRoute({
  method: "delete",
  path: "/posts/:id",
  tags,
  responses: {
    204: {
      description: "Delete a post",
    },
    404: {
      description: "Post not found",
    },
    400: {
      description: "Invalid ID",
    },
  },
})

export const configureV1PostsRoutes = <
  E extends Env,
  S extends {},
  P extends string,
>(
  app: OpenAPIHono<E, S, P>,
) => {
  return app
    .openapi(listPostsRoute, async (c) => {
      // v1 ではページネーション対応
      const page = Number(c.req.query("page") || "1")
      const limit = Number(c.req.query("limit") || "10")
      
      const allPosts = await postRepository.findAll()
      const total = allPosts.length
      const start = (page - 1) * limit
      const end = start + limit
      const paginatedPosts = allPosts.slice(start, end)
      
      return c.json({
        data: paginatedPosts.map((p) => p.toJSON()) as any,
        pagination: {
          page,
          limit,
          total,
        },
      })
    })
    .openapi(getPostRoute, async (c) => {
      const id = c.req.param("id")
      if (!id) return c.json({ error: "Invalid ID" } as any, 400)

      const post = await postRepository.findById(id)

      if (!post) {
        return c.json({ error: "Post not found" } as any, 404)
      }

      return c.json(post.toJSON() as any)
    })
    .openapi(createPostRoute, async (c) => {
      const args = c.req.valid("json")
      const savedPost = await postUseCase.createPost(args)
      return c.json(savedPost.toJSON() as any, 201)
    })
    .openapi(updatePostRoute, async (c) => {
      const id = c.req.param("id")
      if (!id) return c.json({ error: "Invalid ID" } as any, 400)
      const args = c.req.valid("json")

      const updatedPost = await postUseCase.updatePost(id, args)

      if (!updatedPost) {
        return c.json({ error: "Post not found" } as any, 404)
      }

      return c.json(updatedPost.toJSON() as any)
    })
    .openapi(deletePostRoute, async (c) => {
      const id = c.req.param("id")
      if (!id) return c.json({ error: "Invalid ID" } as any, 400)

      const deletedPost = await postUseCase.deletePost(id)

      if (!deletedPost) {
        return c.json({ error: "Post not found" } as any, 404)
      }

      return c.body(null, 204)
    })
}
```

### 2. メインサーバーファイルの更新

#### `apps/web/server/index.ts`

```typescript
import { OpenAPIHono } from "@hono/zod-openapi"
import { Scalar } from "@scalar/hono-api-reference"
import { cors } from "hono/cors"
import { env } from "@/env"
import { configurePostsRoutes } from "./routes/posts"
import { configureHealthRoute, configureSystemRoutes } from "./routes/system"
import { configureV1SystemRoutes } from "./routes/v1/system"
import { configureV1PostsRoutes } from "./routes/v1/posts"

// Honoアプリケーションの新しいインスタンスを作成し、厳格なルーティングを無効化し、APIのベースパス /api を設定
const app = new OpenAPIHono({ strict: false }).basePath("/api")

configureHealthRoute(app)

// v0 アプリケーション (すべての既存ルートはここに移動)
const v0 = new OpenAPIHono()
const v0_with_system = configureSystemRoutes(v0)
const v0_final = configurePostsRoutes(v0_with_system)

// v1 アプリケーション (新しいバージョン)
const v1 = new OpenAPIHono()
const v1_with_system = configureV1SystemRoutes(v1)
const v1_final = configureV1PostsRoutes(v1_with_system)

app
  // CORS ミドルウェアをすべてのルート (`/*`) に適用し、異なるオリジンからのリクエストを許可します。
  .use(
    "/*",
    cors({
      origin: env.NODE_ENV === "development" ? ["http://localhost:3000"] : [],
      credentials: true,
    }),
  )
  // すべてのルート (`*`) に適用されるグローバルなミドルウェアを設定する
  .use("*", async (c, next) => {
    console.log("[Hono] Request:", c.req.method, c.req.url)
    console.log("[Hono] Path:", c.req.path)
    await next()
  })

// OpenAPI Spec definitions
app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "Webservice Next Hono Base API",
  },
  tags: [
    { name: "System", description: "General system endpoints" },
    { name: "v0/System", description: "v0 System endpoints" },
    { name: "v0/Posts", description: "v0 Post management endpoints" },
    { name: "v1/System", description: "v1 System endpoints" },
    { name: "v1/Posts", description: "v1 Post management endpoints" },
  ],
  "x-tagGroups": [
    {
      name: "General",
      tags: ["System"],
    },
    {
      name: "v0",
      tags: ["v0/System", "v0/Posts"],
    },
    {
      name: "v1",
      tags: ["v1/System", "v1/Posts"],
    },
  ],
})

// Scalar API Reference
app.get(
  "/reference",
  Scalar({
    url: "/api/doc",
  }),
)

import { API_VERSIONS } from "../lib/api-versions"

// v0 アプリをマウント (/api/v0)
const routes = app
  .route(`/${API_VERSIONS.v0}`, v0_final)
  // v1 アプリをマウント (/api/v1)
  .route(`/${API_VERSIONS.v1}`, v1_final)

export type AppType = typeof routes
export type ApiV0Type = typeof v0_final
export type ApiV1Type = typeof v1_final
export default app
```

### 3. API バージョン定義の更新

#### `apps/web/lib/api-versions.ts`

```typescript
export const API_VERSIONS = {
  v0: "v0",
  v1: "v1",
} as const

export type ApiVersion = (typeof API_VERSIONS)[keyof typeof API_VERSIONS]
```

### 4. クライアント型定義の更新（オプション）

#### `apps/web/lib/client.ts`

v1 用のクライアントを追加:

```typescript
import type { ApiV0Type, ApiV1Type } from "@/server"
import { hc } from "hono/client"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

export const apiClientV0 = hc<ApiV0Type>(`${API_BASE_URL}/api/v0`)
export const apiClientV1 = hc<ApiV1Type>(`${API_BASE_URL}/api/v1`)

// 後方互換性のため
export const apiClient = apiClientV0
```

## ベストプラクティス

### 1. 後方互換性の維持

- **v0 のコードはそのまま維持**：既存のクライアントが引き続き動作するように、v0 の API は変更しません
- **Breaking Changes は新バージョンで**：破壊的変更は必ず新しいバージョンで行います

### 2. 新機能の追加例

v1 では以下のような改善を追加できます：

- **ページネーション**：大量のデータを効率的に取得
- **フィルタリング**：クエリパラメータで結果を絞り込み
- **レスポンス形式の改善**：より一貫性のある構造
- **エラーハンドリングの強化**：詳細なエラー情報

### 3. ディレクトリ構造

```text
apps/web/server/
├── routes/
│   ├── system.ts        # v0 のシステムルート
│   ├── posts.ts         # v0 の投稿ルート
│   └── v1/
│       ├── system.ts    # v1 のシステムルート
│       └── posts.ts     # v1 の投稿ルート
├── domain/              # バージョン間で共有
├── infrastructure/      # バージョン間で共有
├── usecase/            # バージョン間で共有
└── index.ts            # メインエントリーポイント
```

### 4. OpenAPI ドキュメント

- **タグでバージョン管理**：`v0/Posts`、`v1/Posts` のようにタグでバージョンを識別
- **x-tagGroups で整理**：Scalar の API リファレンスでバージョンごとにグループ化
- **両方のバージョンを表示**：開発者が簡単に比較できるように

### 5. 型安全性

- **各バージョンの型をエクスポート**：`ApiV0Type`、`ApiV1Type`
- **Hono の RPC 機能を活用**：フロントエンドで型安全な API 呼び出し
- **共通のスキーマは再利用**：`PostSchema` などは domain 層で共有

## マイグレーション戦略

### 段階的な移行

1. **v1 をベータとしてリリース**：既存のクライアントは v0 を使用し続ける
2. **新機能は v1 のみ**：新しい機能は v1 でのみ提供
3. **v0 の非推奨化**：十分な移行期間の後、v0 を非推奨に
4. **v0 の削除**：すべてのクライアントが移行した後、v0 を削除

### サポート期間

- **現行バージョン**：完全サポート
- **1つ前のバージョン**：メンテナンスモード（重大なバグ修正のみ）
- **2つ前のバージョン**：非推奨（削除予定）

## 重要な考慮事項

### レイヤーの共有と後方互換性

> [!WARNING]
> 現在の設計では、v0 と v1 が **Domain、UseCase、Repository を共有**しています。
>
> **これは重要な制約を意味します**：
>
> - v0 の動作を完全に保証するには、**v0 が使用しているすべてのレイヤー（Routes、UseCase、Repository、Domain）のコードを変更せずに保持**する必要があります
> - 共有レイヤーに破壊的変更を加えると、v0 の動作も変わってしまいます
> - v1 で新しい機能を追加する場合は、既存コードを変更せず、新しいメソッドやクラスを追加する形で対応する必要があります

### 解決策：3つのアプローチ

業界のベストプラクティスに基づき、以下の3つのアプローチがあります。

#### アプローチ 1: 薄い変換層（Thin Translation Layer）🏆 推奨

**概要**: ビジネスロジック（UseCase、Repository、Domain）は共有し、API層（Routes）で変換を行う

**仕組み**:

```typescript
// ===== 共有されるビジネスロジック =====
// apps/web/server/usecase/post.usecase.ts
class PostUseCase {
  async createPost(data: InternalPostData) {
    // ビジネスロジック（v0、v1 で共有）
  }
}

// ===== v0 の API 層（変換レイヤー）=====
// apps/web/server/routes/posts.ts
app.post('/posts', async (c) => {
  const request = c.req.valid('json')
  
  // v0リクエスト → 内部形式に変換
  const internalData = toInternalFormat(request)
  
  // 共有ビジネスロジック実行
  const result = await postUseCase.createPost(internalData)
  
  // 内部形式 → v0レスポンスに変換
  return c.json(toV0Response(result))
})

// ===== v1 の API 層（変換レイヤー）=====
// apps/web/server/routes/v1/posts.ts
app.post('/posts', async (c) => {
  const request = c.req.valid('json')
  
  // v1リクエスト → 内部形式に変換
  const internalData = toInternalFormat(request)
  
  // 同じビジネスロジック実行
  const result = await postUseCase.createPost(internalData)
  
  // 内部形式 → v1レスポンス（新フィールド含む）に変換
  return c.json(toV1Response(result))
})
```

**メリット**:

- コードの重複が最小限
- ビジネスロジックの保守性が高い
- テストコストが低い

**デメリット**:

- 変換ロジックの保守が必要
- 大きな破壊的変更には不向き

**適用場面**: レスポンス形式の違いやフィールドの追加程度の変更

---

#### アプローチ 2: バージョン固有の DTO

**概要**: DTO（Data Transfer Object）をバージョンごとに分離し、内部 Domain モデルとマッピング

**ディレクトリ構造**:

```text
apps/web/server/
├── routes/
│   ├── dtos/
│   │   └── v0/
│   │       └── post.dto.ts      # v0 用 DTO
│   ├── posts.ts                  # v0 routes
│   └── v1/
│       ├── dtos/
│       │   └── post.dto.ts      # v1 用 DTO
│       └── posts.ts              # v1 routes
├── domain/
│   └── post.schema.ts            # 内部 Domain（共有）
├── usecase/
│   └── post.usecase.ts           # UseCase（共有）
└── infrastructure/
    └── repositories/
        └── post.repository.ts    # Repository（共有）
```

**実装例**:

```typescript
// ===== 内部 Domain（共有）=====
// apps/web/server/domain/post.schema.ts
export const PostInternalSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  author: z.string().nullable(),
  tags: z.array(z.string()).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// ===== v0 用 DTO =====
// apps/web/server/routes/dtos/v0/post.dto.ts
export const PostV0ResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const toV0Response = (internal: PostInternal): PostV0Response => ({
  id: internal.id,
  title: internal.title,
  content: internal.content,
  createdAt: internal.createdAt.toISOString(),
  updatedAt: internal.updatedAt.toISOString(),
})

// ===== v1 用 DTO =====
// apps/web/server/routes/v1/dtos/post.dto.ts
export const PostV1ResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const toV1Response = (internal: PostInternal): PostV1Response => ({
  id: internal.id,
  title: internal.title,
  content: internal.content,
  author: internal.author ?? undefined,
  tags: internal.tags ?? [],
  createdAt: internal.createdAt.toISOString(),
  updatedAt: internal.updatedAt.toISOString(),
})
```

**メリット**:

- 各バージョンの型定義が明確
- 変換ロジックが整理される
- テストが書きやすい

**デメリット**:

- DTO とマッピングコードが増える
- やや冗長になる

**適用場面**: バージョン間でレスポンス構造が大きく異なる場合

---

#### アプローチ 3: 完全分離

**概要**: バージョンごとに UseCase やビジネスロジックも完全に分離

**ディレクトリ構造（オプション A: 同一リポジトリ内）**:

```text
apps/web/server/
├── v0/
│   ├── routes/
│   ├── domain/
│   ├── usecase/
│   └── infrastructure/
└── v1/
    ├── routes/
    ├── domain/
    ├── usecase/
    └── infrastructure/
```

**ディレクトリ構造（オプション B: マイクロサービス化）**:

```text
services/
├── api-v0/              # v0 専用サービス
│   ├── src/
│   │   ├── routes/
│   │   ├── domain/
│   │   ├── usecase/
│   │   └── infrastructure/
│   └── package.json
└── api-v1/              # v1 専用サービス
    ├── src/
    │   ├── routes/
    │   ├── domain/
    │   ├── usecase/
    │   └── infrastructure/
    └── package.json
```

**メリット**:

- 完全に独立、影響範囲がゼロ
- 大規模な破壊的変更に対応可能
- 独立したデプロイが可能

**デメリット**:

- コード重複が大量に発生
- 保守コストが非常に高い
- セキュリティパッチなどの横断的な修正が困難

**適用場面**: ビジネスロジック自体が根本的に変わる場合、または完全に別サービスとして運用する場合

---

### 重要な設計原則

業界のベストプラクティスから得られた原則：

1. **Repository 層はバージョニングしない**
   - データベースは内部実装の詳細として扱う
   - Repository は共有し、API 層でマッピング

2. **ビジネスロジックの検証ルールは基本的に同じ**
   - バリデーションロジックは UseCase で共有
   - API 層で入力を変換してから UseCase に渡す

3. **拡張的変更を優先**
   - 既存コードを変更せず、新しいメソッド/クラスを追加
   - 例：`PostRepository` に `findWithAuthor()` を追加（既存の `findAll()` は変更しない）

4. **3層マッピング**
   - DB オブジェクト → Domain オブジェクト → API DTO
   - 各層を明確に分離することで影響範囲を限定

---

### 推奨される段階的アプローチ

#### フェーズ 1: テストベースの共有（小規模プロジェクト）

- ビジネスロジックは完全に共有
- 統合テストで v0 の動作を保証
- 拡張的変更のみ許可（既存コードは変更しない）

#### フェーズ 2: 薄い変換層（小〜中規模プロジェクト）

- ビジネスロジック（UseCase、Repository、Domain）は共有
- API 層でアダプター/DTO 変換を導入
- バージョンごとの DTO を定義

#### フェーズ 3: UseCase 分離（中〜大規模プロジェクト）

- Repository と Domain は共有
- UseCase をバージョンごとに分離

```typescript
class PostV0UseCase { /* v0専用ロジック */ }
class PostV1UseCase { /* v1専用ロジック */ }
```

#### フェーズ 4: 完全分離（大規模プロジェクト）

- バージョンごとに完全に独立したコードベース
- または別サービスとしてデプロイ（マイクロサービス）

---

> [!TIP]
> **まずはフェーズ 1 から始めることを推奨します。**
> 実際に v1 を導入する際に、必要に応じてフェーズ 2 以降に段階的に移行してください。
> 過度な抽象化や早すぎる分離は、かえって保守性を下げる可能性があります。

## 参考資料

- [Hono Documentation](https://hono.dev/)
- [OpenAPI Specification](https://swagger.io/specification/)
- [API Versioning Best Practices](https://restfulapi.net/versioning/)
