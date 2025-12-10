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

## 3. バリデーション

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
