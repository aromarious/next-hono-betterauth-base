# APIバージョニングのためのディレクトリ構造ベストプラクティス

## 概要

複数バージョンのAPIを保持する際、適切なディレクトリ構造を採用することで、コードの保守性、可読性、そして各バージョンの独立性を確保できます。このドキュメントでは、Honoフレームワークを使用したプロジェクトでの推奨ディレクトリ構造を示します。

---

## 基本戦略：バージョン別トップレベルフォルダ

**最も推奨される構造**は、各APIバージョンを独立したトップレベルフォルダとして管理する方法です。

```plaintext
src/
├── api/
│   ├── v1/                     # APIバージョン1
│   ├── v2/                     # APIバージョン2
│   └── index.ts                # 全バージョンの統合
├── shared/                     # 全バージョン共通のコード
└── app.ts                      # メインアプリケーション
```

---

## 詳細なディレクトリ構造

### 完全な構造例

```plaintext
src/
├── api/
│   ├── v1/
│   │   ├── routes/
│   │   │   ├── users.ts        # ユーザー関連のルート定義
│   │   │   ├── posts.ts        # 投稿関連のルート定義
│   │   │   └── index.ts        # v1のルート集約
│   │   │
│   │   ├── controllers/
│   │   │   ├── userController.ts
│   │   │   └── postController.ts
│   │   │
│   │   ├── services/           # v1固有のビジネスロジック
│   │   │   ├── userService.ts
│   │   │   └── postService.ts
│   │   │
│   │   ├── validators/         # v1のバリデーションルール
│   │   │   ├── userValidator.ts
│   │   │   └── postValidator.ts
│   │   │
│   │   ├── dto/                # v1のリクエスト/レスポンス型
│   │   │   ├── userDto.ts
│   │   │   └── postDto.ts
│   │   │
│   │   └── index.ts            # v1のエントリーポイント
│   │
│   ├── v2/
│   │   ├── routes/
│   │   │   ├── users.ts        # v2の新しいユーザールート
│   │   │   ├── posts.ts
│   │   │   ├── comments.ts     # v2で追加された新機能
│   │   │   └── index.ts
│   │   │
│   │   ├── controllers/
│   │   │   ├── userController.ts
│   │   │   ├── postController.ts
│   │   │   └── commentController.ts
│   │   │
│   │   ├── services/           # v2固有のビジネスロジック
│   │   │   ├── userService.ts  # v1とは異なるロジック
│   │   │   ├── postService.ts
│   │   │   └── commentService.ts
│   │   │
│   │   ├── validators/
│   │   ├── dto/
│   │   └── index.ts
│   │
│   └── index.ts                # 全バージョンの統合ポイント
│
├── shared/
│   ├── database/               # データベース層（全バージョン共通）
│   │   ├── schema.ts           # Drizzleスキーマ定義
│   │   ├── connection.ts       # DB接続設定
│   │   └── migrations/         # マイグレーションファイル
│   │
│   ├── infrastructure/         # インフラ層（全バージョン共通）
│   │   ├── email/
│   │   │   ├── sender.ts       # メール送信の実装
│   │   │   └── templates/      # メールテンプレート
│   │   │
│   │   ├── storage/
│   │   │   └── s3.ts           # ファイルストレージ
│   │   │
│   │   ├── queue/
│   │   │   └── worker.ts       # キュー処理
│   │   │
│   │   └── external/
│   │       └── payment.ts      # 外部API呼び出し
│   │
│   ├── middleware/             # 汎用ミドルウェア
│   │   ├── auth.ts             # 認証
│   │   ├── rateLimit.ts        # レート制限
│   │   ├── cors.ts             # CORS設定
│   │   └── errorHandler.ts     # エラーハンドリング
│   │
│   ├── lib/                    # 再利用可能なライブラリ関数
│   │   ├── crypto.ts           # 暗号化処理
│   │   ├── date.ts             # 日付処理
│   │   └── validation.ts       # 基本的な検証関数
│   │
│   └── types/                  # 共通の型定義
│       ├── common.ts
│       └── database.ts
│
├── config/
│   └── env.ts                  # 環境変数の定義
│
└── app.ts                      # メインアプリケーション
```

---

## Honoでの実装例

### 各バージョンのエントリーポイント

```typescript
// src/api/v1/index.ts
import { Hono } from 'hono'
import users from './routes/users'
import posts from './routes/posts'

const v1 = new Hono()

v1.route('/users', users)
v1.route('/posts', posts)

export default v1
```

```typescript
// src/api/v2/index.ts
import { Hono } from 'hono'
import users from './routes/users'
import posts from './routes/posts'
import comments from './routes/comments'  // v2の新機能

const v2 = new Hono()

v2.route('/users', users)
v2.route('/posts', posts)
v2.route('/comments', comments)  // v2で追加

export default v2
```

### 全バージョンの統合

```typescript
// src/api/index.ts
import { Hono } from 'hono'
import v1 from './v1'
import v2 from './v2'

const api = new Hono()

api.route('/v1', v1)
api.route('/v2', v2)

export default api
```

```typescript
// src/app.ts
import { Hono } from 'hono'
import api from './api'

const app = new Hono()

app.route('/api', api)

export default app
```

これにより、以下のようなURLパターンが実現されます：

- `/api/v1/users`
- `/api/v1/posts`
- `/api/v2/users`
- `/api/v2/posts`
- `/api/v2/comments`

---

## レイヤー別の配置ガイドライン

### 各バージョンに配置すべきもの

以下のコンポーネントは、バージョンごとに異なる実装やルールを持つため、各バージョンフォルダ内に配置します：

| コンポーネント | 配置場所 | 理由 |
|--------------|---------|------|
| **Routes** | `api/v{N}/routes/` | APIエンドポイントの定義がバージョンで異なる |
| **Controllers** | `api/v{N}/controllers/` | リクエスト/レスポンス処理がバージョンで異なる |
| **Services** | `api/v{N}/services/` | **ビジネスロジックがバージョンで変化する** |
| **Validators** | `api/v{N}/validators/` | バリデーションルールがバージョンで異なる |
| **DTOs** | `api/v{N}/dto/` | リクエスト/レスポンスの形式がバージョンで異なる |
| **Types** | `api/v{N}/types/` | バージョン固有の型定義 |

### 共有フォルダに配置すべきもの

> [!IMPORTANT]
> 共有すべきものは**非常に限定的**です。以下の基準に該当するもののみ共有します：
>
> 1. **フレームワークで唯一のもの**（アプリケーション全体で1つしか存在しないもの）
> 2. **永続化に関連するもの**（データベーススキーマ、マイグレーション）
> 3. **システム外部との通信インフラ**（メール送信の送信部分、Slack投稿など）※現在のプロジェクトには該当なし

| コンポーネント | 配置場所 | 理由 |
|--------------|---------|------|
| **Database Schema** | `shared/database/schema.ts` | 永続化：全バージョンで同じDBを使用 |
| **Database Connection** | `shared/database/connection.ts` | フレームワークで唯一：接続は1つ |
| **Migrations** | `shared/database/migrations/` | 永続化：スキーマ変更履歴 |

**注意**: ミドルウェア、ユーティリティ、インフラ層なども**バージョンによって要件が変わる可能性がある**ため、基本的には各バージョンに配置することを推奨します。

---

## ビジネスロジックの扱い

> [!IMPORTANT]
> **ビジネスロジック（Services）は各バージョンに分離します**。バージョン間でロジックが変わることは一般的であり、独立性を保つことが重要です。

### 例：ユーザー作成のビジネスロジックがバージョンで異なる

```typescript
// src/api/v1/services/userService.ts
import { emailSender } from '../../../shared/infrastructure/email/sender'

export class UserServiceV1 {
  async createUser(data: CreateUserDtoV1) {
    // v1のシンプルなビジネスロジック
    const user = await db.insert(users).values({
      email: data.email,
      name: data.name,
    })
    
    // シンプルなウェルカムメール
    await emailSender.send(
      user.email,
      'Welcome!',
      'Thanks for signing up'
    )
    
    return user
  }
}
```

```typescript
// src/api/v2/services/userService.ts
import { emailSender } from '../../../shared/infrastructure/email/sender'
import { imageProcessor } from '../../../shared/infrastructure/storage/imageProcessor'

export class UserServiceV2 {
  async createUser(data: CreateUserDtoV2) {
    // v2の複雑なビジネスロジック
    
    // 1. メールドメイン検証（v2の新ルール）
    if (!this.isAllowedDomain(data.email)) {
      throw new Error('Invalid email domain')
    }
    
    // 2. プロフィール画像の処理（v2の新機能）
    const avatarUrl = data.avatar 
      ? await imageProcessor.upload(data.avatar)
      : null
    
    const user = await db.insert(users).values({
      email: data.email,
      name: data.name,
      avatarUrl,
      emailVerified: false,
    })
    
    // 3. メール検証フロー（v2の新しい要件）
    await emailSender.send(
      user.email,
      'Please verify your email',
      `Click here: ${this.getVerificationLink(user.id)}`
    )
    
    return user
  }
  
  private isAllowedDomain(email: string): boolean {
    // v2固有のビジネスルール
  }
}
```

**ポイント**:

- 両バージョンとも `emailSender`（インフラ層）を**共有**
- ビジネスロジック（いつ、何を送るか）は**各バージョンで独立**
- v2は新しい機能（画像処理、メール検証）を追加

---

## テストディレクトリの構造

テストもバージョンごとに分離します：

```plaintext
tests/
├── api/
│   ├── v1/
│   │   ├── routes/
│   │   │   ├── users.test.ts
│   │   │   └── posts.test.ts
│   │   │
│   │   ├── services/
│   │   │   └── userService.test.ts
│   │   │
│   │   └── integration/
│   │       └── userFlow.test.ts
│   │
│   ├── v2/
│   │   ├── routes/
│   │   ├── services/
│   │   └── integration/
│   │
│   └── shared/
│       ├── database.test.ts
│       └── middleware.test.ts
│
└── e2e/
    ├── v1/
    │   └── userJourney.test.ts
    └── v2/
        └── userJourney.test.ts
```

---

## 代替パターン：機能別フォルダ（小規模プロジェクト向け）

バージョン間の差異が少ない小規模プロジェクトでは、以下の構造も検討できます：

```plaintext
src/
├── features/
│   ├── users/
│   │   ├── v1/
│   │   │   ├── routes.ts
│   │   │   ├── controller.ts
│   │   │   └── service.ts
│   │   │
│   │   └── v2/
│   │       ├── routes.ts
│   │       ├── controller.ts
│   │       └── service.ts
│   │
│   └── posts/
│       ├── v1/
│       └── v2/
│
└── shared/
```

> [!WARNING]
> この構造は小規模プロジェクトには適していますが、バージョンが増えると複雑になるため、中〜大規模プロジェクトでは**バージョン別トップレベルフォルダ**を推奨します。

---

## ベストプラクティス

### ✅ 推奨事項

1. **明確な分離**: バージョンごとに独立したフォルダを作成
2. **共通コードの抽出**: インフラ層（DB、メール送信など）は `shared/` に配置
3. **一貫性**: 各バージョンで同じフォルダ構造を維持
4. **ドキュメント**: 各バージョンの README.md で変更点を記載
5. **テストの分離**: バージョンごとに独立したテストスイートを作成

### ❌ 避けるべき事項

1. **条件分岐でのバージョン管理**: `if (version === 'v1')` のような分岐は避ける
2. **過度な共通化**: ビジネスロジックまで共有すると、変更時に全バージョンに影響
3. **曖昧な命名**: `oldUsers.ts` や `newUsers.ts` のような命名は避ける

---

## まとめ

### 配置場所の判断フロー

```mermaid
graph TD
    A[コンポーネントを配置する] --> B{技術的な操作か？}
    B -->|Yes| C[shared/ に配置]
    B -->|No| D{ビジネスルールを含むか？}
    D -->|Yes| E[api/v{N}/ に配置]
    D -->|No| F{全バージョンで同じか？}
    F -->|Yes| C
    F -->|No| E
    
    C --> G[例: DB接続、メール送信]
    E --> H[例: サービス、バリデーション]
```

### 配置ルール早見表

| コンポーネント | 配置先 | 共有理由 / 分離理由 |
|--------------|--------|-------------------|
| DBスキーマ | `shared/database/` | 全バージョンで同じDBを使用 |
| メール送信 | `shared/infrastructure/` | 送信操作は技術的な処理 |
| 認証ミドルウェア | `shared/middleware/` | 横断的関心事 |
| ビジネスロジック | `api/v{N}/services/` | バージョンごとにルールが異なる |
| バリデーション | `api/v{N}/validators/` | バージョンごとに要件が異なる |
| ルート定義 | `api/v{N}/routes/` | エンドポイントがバージョンで異なる |

この構造により、**各バージョンの独立性を保ちつつ、インフラの重複を避けることができます**。

---

## 現在のプロジェクト構造からの移行例

### 現在の構造（バージョニング前）

現在の `apps/web/server/` ディレクトリ構造：

```plaintext
apps/web/server/
├── domain/              # ドメインエンティティ
│   ├── ports/
│   │   └── post.repository.ts
│   ├── post.entity.ts
│   └── post.entity.test.ts
│
├── infrastructure/      # リポジトリ実装（永続化層）
│   └── repositories/
│       ├── post.repository.drizzle.ts
│       └── post.repository.integration.test.ts
│
├── routes/             # ルート定義
│   ├── dto/
│   │   ├── post.mapper.ts
│   │   └── post.schema.ts
│   ├── posts.ts
│   └── system.ts
│
├── usecase/            # ビジネスロジック
│   ├── post.usecase.ts
│   └── post.usecase.test.ts
│
├── lib/
└── index.ts            # エントリーポイント

apps/web/test/          # 統合テスト（server と並列）
├── integration/
│   ├── posts.integration.test.ts      # v0 API のテスト
│   ├── system.integration.test.ts     # v0 API のテスト
│   └── ratelimit.integration.test.ts  # v0 API のテスト
├── integration-global-setup.ts        # テスト用グローバルセットアップ
└── load-env.ts                         # 環境変数ロード
```

### バージョニング対応後の構造

APIバージョニングに対応させると、以下のように変化します：

```plaintext
apps/web/server/
├── api/
│   └── v0/                    # 現在のAPIをv0として移行
│       ├── domain/            # v0固有のドメインエンティティ
│       │   ├── ports/
│       │   │   └── post.repository.ts
│       │   ├── post.entity.ts
│       │   └── post.entity.test.ts
│       │
│       ├── routes/            # v0のルート定義
│       │   ├── dto/
│       │   │   ├── post.mapper.ts
│       │   │   └── post.schema.ts
│       │   ├── posts.ts
│       │   └── system.ts
│       │
│       ├── usecase/           # v0のビジネスロジック
│       │   ├── post.usecase.ts
│       │   └── post.usecase.test.ts
│       │
│       ├── integration/       # v0の統合テスト（testから移動）
│       │   ├── posts.integration.test.ts
│       │   ├── system.integration.test.ts
│       │   └── ratelimit.integration.test.ts
│       │
│       └── index.ts           # v0のエントリーポイント
│
├── shared/
│   └── infrastructure/        # 永続化層は共有
│       └── repositories/
│           ├── post.repository.drizzle.ts
│           └── post.repository.integration.test.ts
│
├── test/                      # テスト用ヘルパー（共有）
│   ├── integration-global-setup.ts
│   └── load-env.ts
│
└── index.ts                   # 全バージョンの統合
```

### 移行のポイント

#### 1. **各バージョンに移動するもの**

- `domain/` - ドメインエンティティとポート定義
- `routes/` - ルート定義とDTO
- `usecase/` - ビジネスロジック
- **`test/integration/` - そのバージョンのAPI統合テスト** ← 追加

#### 2. **共有（shared）に移動するもの**

- `infrastructure/repositories/` - データベースリポジトリ実装（永続化層）

> [!NOTE]
> `infrastructure/repositories/` は「永続化に関連する」ため共有します。データベースアクセスの実装は全バージョンで共通ですが、ビジネスロジック（usecase）は各バージョンで異なる可能性があるため分離します。

#### 3. **テスト用ヘルパーは共有に残す**

- `test/integration-global-setup.ts` - グローバルセットアップ
- `test/load-env.ts` - 環境変数ロード

> [!IMPORTANT]
> **統合テストの配置ルール:**
>
> - v0のAPIエンドポイント（`/api/v0/*`）をテストする統合テストは `api/v0/integration/` に移動
> - テスト用のヘルパーやグローバルセットアップは `test/` に残す（全バージョン共通）
> - リポジトリ層の統合テストは `shared/infrastructure/repositories/` に残す（永続化層）

#### 4. **エントリーポイントの変更**

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

### 新バージョン（v1）追加時

将来的に v1 を追加する場合：

```plaintext
apps/web/server/
├── api/
│   ├── v0/              # 既存のv0（変更なし）
│   │   ├── domain/
│   │   ├── routes/
│   │   ├── usecase/
│   │   └── index.ts
│   │
│   └── v1/              # 新しいv1
│       ├── domain/      # v1の新しいドメインモデル
│       ├── routes/      # v1の新しいAPI仕様
│       ├── usecase/     # v1の新しいビジネスロジック
│       └── index.ts
│
├── shared/
│   └── infrastructure/  # 引き続き共有
│
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
