# API設計ガイドライン

WebService-Next-Hono-Base プロジェクトにおけるAPI設計の統一ルールとベストプラクティスを定義します。

---

## 🎯 設計原則

### 1. RESTful設計
- リソース指向のURL設計
- HTTPメソッドの適切な使用
- ステータスコードの統一

### 2. 契約駆動開発 (Contract First)
- OpenAPIスキーマが単一の契約
- 型安全性を最優先
- フロントエンド・バックエンド間の整合性保証

### 3. 一貫性の確保
- 命名規則の統一
- レスポンス形式の統一
- エラーハンドリングの統一

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

## 📊 クエリパラメータ設計

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
