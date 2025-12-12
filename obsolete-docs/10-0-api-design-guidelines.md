# API設計仕様書作成ガイドライン

**WebService-Next-Hono-Base** を基盤として実サービスを開発する際の、API設計における技術仕様書作成・設計指針を提供します。

---

## 🎯 本ガイドラインの使い方

### 対象読者
- **API設計者**: システム設計・API仕様検討時
- **技術仕様書作成者**: API仕様書・設計書作成時  
- **開発リーダー**: API技術方針・実装指針策定時

### 活用場面
- **API設計フェーズ**: RESTful API設計・仕様検討時
- **仕様書作成**: OpenAPI仕様書・API設計書作成時
- **技術選定**: Hono + Zod バリデーションを活用したAPI設計時
- **開発計画**: フロントエンド・バックエンド間のAPI契約策定時

---

## 🎯 WebService-Next-Hono-Base でのAPI設計原則

### 本ベースプロジェクトのAPI構成
このベースでは以下のAPI技術スタックを前提としています：

| コンポーネント | 役割 | 仕様書での考慮点 |
|---------------|------|------------------|
| **Hono** | 高速APIフレームワーク | ルーティング・ミドルウェア設計 |
| **Zod** | スキーマバリデーション | リクエスト・レスポンス型定義 |
| **OpenAPI** | API仕様書標準 | 契約駆動開発・型安全性 |
| **Better Auth** | 認証・認可 | セキュリティ・権限設計 |

### 設計時に決定すべきAPI設計要素

| 設計要素 | 仕様書で定義すべき内容 | 本ベースでの実現方法 |
|---------|----------------------|---------------------|
| **リソース設計** | URL構造・HTTPメソッド・パラメータ | RESTful原則 + Honoルーティング |
| **認証・認可** | エンドポイント毎のアクセス制御 | Better Auth統合設計 |
| **データ形式** | リクエスト・レスポンスのスキーマ | Zodスキーマ定義 |
| **エラーハンドリング** | エラーレスポンス・ステータスコード | 統一エラー形式設計 |

---

## 📍 URLパス設計ルール

### 基本構造
```
/{version}/{resource}/{id?}/{sub-resource?}/{id?}
```

### バージョニング
```
/v1/users          # v1 API
/v2/users          # v2 API（破壊的変更時）
```

### リソース命名
- **複数形を使用**: `/users`, `/posts`, `/orders`
- **小文字 + ハイフン**: `/user-profiles`, `/order-items`
- **階層は3レベルまで**: `/users/{id}/posts/{id}/comments`

---

## 🔗 エンドポイント設計パターン

### 認証関連
```
POST   /v1/auth/register      # ユーザー登録
POST   /v1/auth/login         # ログイン
POST   /v1/auth/logout        # ログアウト
POST   /v1/auth/refresh       # トークンリフレッシュ
POST   /v1/auth/forgot-password   # パスワードリセット要求
POST   /v1/auth/reset-password    # パスワードリセット実行
```

### ユーザー管理
```
GET    /v1/users              # ユーザー一覧
POST   /v1/users              # ユーザー作成
GET    /v1/users/{id}         # ユーザー詳細
PUT    /v1/users/{id}         # ユーザー更新（全体）
PATCH  /v1/users/{id}         # ユーザー更新（部分）
DELETE /v1/users/{id}         # ユーザー削除
GET    /v1/me                 # 現在のユーザー情報
PUT    /v1/me                 # 現在のユーザー更新
```

### リソース関係
```
GET    /v1/users/{id}/posts        # ユーザーの投稿一覧
POST   /v1/users/{id}/posts        # ユーザーの投稿作成
GET    /v1/posts                   # 投稿一覧
GET    /v1/posts/{id}              # 投稿詳細
GET    /v1/posts/{id}/comments     # 投稿のコメント一覧
```

---

## 🔒 認証・認可パターン

### 認証レベル
1. **Public**: 認証不要
2. **Authenticated**: ログイン必須
3. **Authorized**: 特定権限必須

### パス例
```
# Public（認証不要）
GET    /v1/health
POST   /v1/auth/login
POST   /v1/auth/register

# Authenticated（ログイン必須）
GET    /v1/me
PUT    /v1/me
GET    /v1/users/{id}
POST   /v1/posts

# Authorized（権限チェック）
DELETE /v1/users/{id}        # Admin権限
PUT    /v1/users/{id}/role   # Admin権限
GET    /v1/admin/stats       # Admin権限
```

---

## 🚦 レートリミット設計

### レートリミットパッケージ選択指針
**WebService-Next-Hono-Base**では以下のパッケージ選択を推奨：

| サービス規模 | 推奨パッケージ | 理由・特徴 | 設定例 |
|-------------|--------------|-----------|-------|
| **小〜中規模** | `@hono/rate-limiter` | 公式・軽量・メモリベース | 開発・ステージング環境 |
| **中〜大規模** | `hono-rate-limiter` | Redis連携・分散対応・永続化 | 本番環境・複数インスタンス |
| **大規模・特殊要件** | カスタム実装 | 独自ロジック・複雑な制限 | 企業向け・高度な制御 |

### API仕様書でのレートリミット定義
エンドポイント毎に以下の制限仕様を明記してください：

#### エンドポイント別レートリミット設計表
```markdown
| エンドポイント | 認証レベル | 制限 | 期間 | ストレージ | キー | 目的 |
|---------------|-----------|------|------|-----------|------|------|
| POST /v1/auth/login | Public | 5回 | 15分 | VercelKV | IP | ブルートフォース防止 |
| POST /v1/auth/register | Public | 3回 | 1時間 | VercelKV | IP | スパム登録防止 |
| GET /v1/users | Authenticated | 100回 | 1分 | VercelKV | UserID | 通常利用制限 |
| POST /v1/posts | Authenticated | 10回 | 1分 | VercelKV | UserID | コンテンツスパム防止 |
| DELETE /v1/users/{id} | Admin | 5回 | 1分 | VercelKV | UserID | 誤操作防止 |
| GET /v1/public/* | Public | 60回 | 1分 | VercelKV | IP | リソース保護 |
```

### @upstash/ratelimit による実装方法

#### 1. 基本設定ファイル作成
```typescript
// apps/api/src/lib/ratelimit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";

// エンドポイント別制限設定
export const rateLimitConfigs = {
  // 認証系API - 最厳格
  'POST:/v1/auth/login': {
    limiter: Ratelimit.slidingWindow(5, "15m"),
    keyGenerator: 'ip',
    description: 'ブルートフォース防止'
  },
  'POST:/v1/auth/register': {
    limiter: Ratelimit.slidingWindow(3, "1h"), 
    keyGenerator: 'ip',
    description: 'スパム登録防止'
  },
  
  // 認証済みAPI - 中程度制限
  'GET:/v1/users': {
    limiter: Ratelimit.slidingWindow(100, "1m"),
    keyGenerator: 'user',
    description: '通常利用制限'
  },
  'POST:/v1/posts': {
    limiter: Ratelimit.slidingWindow(10, "1m"),
    keyGenerator: 'user', 
    description: 'コンテンツスパム防止'
  },
  
  // 管理者API - 慎重制限
  'DELETE:/v1/users/{id}': {
    limiter: Ratelimit.slidingWindow(5, "1m"),
    keyGenerator: 'user',
    description: '誤操作防止'
  },
  
  // 公開API - リソース保護
  'GET:/v1/public/*': {
    limiter: Ratelimit.slidingWindow(60, "1m"),
    keyGenerator: 'ip',
    description: 'リソース保護'
  }
};

// レートリミッター作成
export const createRateLimit = (config: typeof rateLimitConfigs[keyof typeof rateLimitConfigs]) => {
  return new Ratelimit({
    redis: kv,
    limiter: config.limiter,
    analytics: process.env.NODE_ENV === "production",
    prefix: "rl"
  });
};
```

#### 2. ミドルウェア実装
```typescript
// apps/api/src/middleware/rateLimit.ts
import { Context, Next } from "hono";
import { rateLimitConfigs, createRateLimit } from "../lib/ratelimit";

// キー生成関数
const keyGenerators = {
  ip: (c: Context) => {
    return c.req.header('x-forwarded-for') || 
           c.req.header('cf-connecting-ip') || 
           'unknown';
  },
  user: (c: Context) => {
    const user = c.get('user'); // Better Auth からユーザー情報取得
    return user?.id || 'anonymous';
  }
};

export const rateLimitMiddleware = async (c: Context, next: Next) => {
  const method = c.req.method;
  const path = c.req.path;
  const routeKey = `${method}:${path}`;
  
  // 設定を取得（パターンマッチング対応）
  let config = rateLimitConfigs[routeKey];
  
  // パターンマッチング（例: /v1/public/* や /v1/users/{id}）
  if (!config) {
    for (const [pattern, conf] of Object.entries(rateLimitConfigs)) {
      const regex = pattern
        .replace(/\*/g, '.*')
        .replace(/\{[^}]+\}/g, '[^/]+');
      
      if (new RegExp(`^${regex}$`).test(routeKey)) {
        config = conf;
        break;
      }
    }
  }
  
  // デフォルト制限（設定がない場合）
  if (!config) {
    config = {
      limiter: Ratelimit.slidingWindow(100, "1m"),
      keyGenerator: 'ip',
      description: 'デフォルト制限'
    };
  }
  
  // レートリミッター作成・実行
  const ratelimit = createRateLimit(config);
  const keyGen = keyGenerators[config.keyGenerator];
  const identifier = keyGen(c);
  
  const { success, limit, remaining, reset } = await ratelimit.limit(
    `${config.keyGenerator}:${identifier}`
  );
  
  // レスポンスヘッダー設定
  c.header('X-RateLimit-Limit', limit.toString());
  c.header('X-RateLimit-Remaining', remaining.toString());
  c.header('X-RateLimit-Reset', reset.toString());
  c.header('X-RateLimit-Policy', config.description);
  
  // 制限超過時のエラーレスポンス
  if (!success) {
    return c.json({
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: `Rate limit exceeded for ${config.description}`,
        retry_after: Math.ceil((reset.getTime() - Date.now()) / 1000),
        limit,
        remaining: 0,
        reset: reset.getTime()
      }
    }, 429);
  }
  
  await next();
};
```

#### 3. ルーター別適用
```typescript
// apps/api/src/routes/auth.ts
import { Hono } from 'hono'
import { rateLimitMiddleware } from '../middleware/rateLimit'

const auth = new Hono()

// 認証系エンドポイント（自動的に厳しい制限が適用される）
auth.use('*', rateLimitMiddleware)

auth.post('/login', async (c) => {
  // ログイン処理
  // 自動的に 5回/15分 の制限が適用される
})

auth.post('/register', async (c) => {
  // 登録処理  
  // 自動的に 3回/1時間 の制限が適用される
})

export { auth as authRoutes }
```

```typescript
// apps/api/src/routes/users.ts
import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import { rateLimitMiddleware } from '../middleware/rateLimit'

const users = new Hono()

// 認証 + レートリミット適用
users.use('*', authMiddleware)
users.use('*', rateLimitMiddleware)

users.get('/', async (c) => {
  // ユーザー一覧取得
  // 自動的に 100回/1分 の制限が適用される
})

users.delete('/:id', async (c) => {
  // ユーザー削除
  // 自動的に 5回/1分 の制限が適用される（管理者権限チェックも必要）
})

export { users as userRoutes }
```

#### 4. メインアプリへの統合
```typescript
// apps/api/src/index.ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authRoutes } from './routes/auth'
import { userRoutes } from './routes/users'

const app = new Hono()

// グローバルミドルウェア
app.use('*', cors())

// ルーティング（各ルートでレートリミット自動適用）
app.route('/v1/auth', authRoutes)
app.route('/v1/users', userRoutes)

export default app
```

#### 5. 環境変数設定（Infisical）
```bash
# Vercel本番環境
infisical secrets set --env=production KV_REST_API_URL https://prod-xxx.upstash.io
infisical secrets set --env=production KV_REST_API_TOKEN AYxxx...

# 開発環境（ローカルRedis使用の場合）
infisical secrets set --env=development REDIS_URL redis://localhost:6379
infisical secrets set --env=development RATE_LIMIT_STORAGE local
```
```

#### パッケージ別設定仕様例
```typescript
// hono-rate-limiter使用時の設定仕様
const rateLimitConfig = {
  // Redis連携設定
  store: {
    type: 'redis',
    url: process.env.REDIS_URL,
    keyPrefix: 'rate_limit:',
    connectTimeout: 5000
  },
  
  // エンドポイント別制限
  limits: {
    '/auth/login': {
      windowMs: 15 * 60 * 1000, // 15分
      max: 5,
      keyGenerator: (c) => c.req.header('x-forwarded-for') || 'unknown',
      onLimitReached: (req, info) => {
        // 違反時の追加処理（ログ・通知等）
      }
    }
  },
  
  // 分散環境対応
  distributed: true,
  skipSuccessfulRequests: false,
  skipFailedRequests: false
}
```

#### OpenAPI仕様での記載例
```yaml
paths:
  /v1/auth/login:
    post:
      summary: ユーザーログイン
      description: レートリミット：5回/15分（IPベース）
      x-rate-limit:
        requests: 5
        period: "15m"
        scope: "ip"
        block_duration: "15m"
      responses:
        '429':
          description: Rate limit exceeded
          headers:
            Retry-After:
              schema:
                type: integer
              description: 再試行までの秒数
```

#### レートリミット違反時のレスポンス設計
```json
{
  "error": "rate_limit_exceeded",  
  "message": "Rate limit exceeded. Try again in 60 seconds.",
  "retry_after": 60,
  "limit": 100,
  "remaining": 0,
  "reset": 1640995200
}
```

---

## �📊 クエリパラメータ設計

### ページネーション
```
GET /v1/users?page=1&limit=20&offset=0
GET /v1/users?cursor=abc123&limit=20
```

### フィルタリング
```
GET /v1/users?status=active
GET /v1/users?role=admin&status=active
GET /v1/posts?author_id=123&published=true
```

### ソート
```
GET /v1/users?sort=created_at&order=desc
GET /v1/posts?sort=title,created_at&order=asc,desc
```

### 検索
```
GET /v1/users?search=john
GET /v1/posts?q=react&category=tech
```

### フィールド選択
```
GET /v1/users?fields=id,name,email
GET /v1/posts?include=author,comments
```

---

## 📤 レスポンス設計

### 成功レスポンス

#### 単一リソース
```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

#### リソース一覧
```json
{
  "success": true,
  "data": [
    {
      "id": "123",
      "name": "John Doe"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5,
    "has_next": true,
    "has_prev": false
  }
}
```

#### 作成・更新・削除
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "123",
    "name": "John Doe"
  }
}
```

### エラーレスポンス

#### 基本エラー形式
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力データに問題があります",
    "details": [
      {
        "field": "email",
        "message": "有効なメールアドレスを入力してください"
      }
    ]
  }
}
```

#### 認証エラー
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "認証が必要です"
  }
}
```

#### 認可エラー
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "この操作を実行する権限がありません"
  }
}
```

---

## 🔢 HTTPステータスコード使用ガイド

### 成功レスポンス
- `200 OK` - GET, PUT, PATCH
- `201 Created` - POST（リソース作成）
- `204 No Content` - DELETE, PUT（レスポンスボディなし）

### クライアントエラー
- `400 Bad Request` - バリデーションエラー
- `401 Unauthorized` - 認証エラー
- `403 Forbidden` - 認可エラー
- `404 Not Found` - リソースが存在しない
- `409 Conflict` - リソースの競合
- `422 Unprocessable Entity` - ビジネスロジックエラー

### サーバーエラー
- `500 Internal Server Error` - サーバー内部エラー
- `502 Bad Gateway` - 外部サービスエラー
- `503 Service Unavailable` - サービス一時停止

---

## 📝 OpenAPI スキーマ設計

### 基本構造
```yaml
openapi: 3.0.3
info:
  title: WebService API
  version: 1.0.0
  description: WebService-Next-Hono-Base API

servers:
  - url: http://localhost:8787/v1
    description: Development server
  - url: https://api.yourdomain.com/v1
    description: Production server

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

### リソーススキーマ例
```yaml
components:
  schemas:
    User:
      type: object
      required: [id, email, name]
      properties:
        id:
          type: string
          format: uuid
          example: "123e4567-e89b-12d3-a456-426614174000"
        email:
          type: string
          format: email
          example: "user@example.com"
        name:
          type: string
          minLength: 1
          maxLength: 100
          example: "John Doe"
        created_at:
          type: string
          format: date-time
          example: "2025-01-01T00:00:00Z"
```

### エンドポイント定義例
```yaml
paths:
  /v1/users:
    get:
      summary: ユーザー一覧取得
      tags: [Users]
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            minimum: 1
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
      responses:
        '200':
          description: 成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserListResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'
```

---

## 🛡️ セキュリティ設計

### レート制限
```
GET    /v1/users     # 1000req/hour/user
POST   /v1/auth/*    # 10req/minute/IP
POST   /v1/users     # 100req/hour/user
```

### CORS設定
```typescript
// 開発環境
corsOrigin: 'http://localhost:3000'

// 本番環境
corsOrigin: 'https://yourdomain.com'
```

### セキュリティヘッダー
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

---

## 🔧 実装パターン (Hono)

### ルーター構成
```typescript
// apps/api/src/routes/index.ts
import { Hono } from 'hono'
import { authRoutes } from './auth'
import { userRoutes } from './users'
import { postRoutes } from './posts'

const api = new Hono()

api.route('/auth', authRoutes)
api.route('/users', userRoutes)
api.route('/posts', postRoutes)

export { api }
```

### ミドルウェア適用
```typescript
// apps/api/src/routes/users.ts
import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth'
import { validateSchema } from '../middleware/validation'

const users = new Hono()

// 認証必須
users.use('*', authMiddleware)

// バリデーション付きエンドポイント
users.post('/', validateSchema(userCreateSchema), createUser)
users.get('/', getUsers)
users.get('/:id', getUserById)

export { users as userRoutes }
```

### レスポンスヘルパー
```typescript
// apps/api/src/utils/response.ts
export const successResponse = (data: any, message?: string) => ({
  success: true,
  message,
  data
})

export const errorResponse = (code: string, message: string, details?: any) => ({
  success: false,
  error: { code, message, details }
})
```

---

## 📋 ベースプロジェクトに含める API

### Level 2 (動作ベース)
```
GET    /v1/health           # ヘルスチェック
GET    /v1/hello           # Hello World
```

### Level 3 (認証ベース)
```
# 認証
POST   /v1/auth/register   # ユーザー登録
POST   /v1/auth/login      # ログイン
POST   /v1/auth/logout     # ログアウト

# ユーザー
GET    /v1/me              # 現在のユーザー情報
PUT    /v1/me              # 現在のユーザー更新
```

### 拡張例（プロジェクト固有で追加）
```
# ユーザー管理（管理者用）
GET    /v1/users           # ユーザー一覧
GET    /v1/users/{id}      # ユーザー詳細
PUT    /v1/users/{id}      # ユーザー更新

# ビジネス機能
GET    /v1/posts           # 投稿一覧
POST   /v1/posts           # 投稿作成
```

---

## 🧪 テスト設計

### APIテストパターン
```typescript
// 認証テスト
describe('POST /v1/auth/login', () => {
  it('正常なログイン', async () => {
    const response = await request(app)
      .post('/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      })
    
    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data).toHaveProperty('token')
  })

  it('無効な認証情報', async () => {
    const response = await request(app)
      .post('/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword'
      })
    
    expect(response.status).toBe(401)
    expect(response.body.success).toBe(false)
    expect(response.body.error.code).toBe('UNAUTHORIZED')
  })
})
```

---

## 📚 関連ドキュメント

- [webservice-next-hono-base-spec.md](./webservice-next-hono-base-spec.md) - プロジェクト全体仕様
- [development-workflow.md](./development-workflow.md) - 開発ワークフロー
- [base-construction-tasks.md](./base-construction-tasks.md) - ベース構築タスク
- [OpenAPI仕様書](./packages/shared-openapi/openapi.yaml) - API詳細仕様

---

© 2025 WebService-Next-Hono-Base Development Team
