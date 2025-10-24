# OpenAPI仕様書作成ガイドライン

WebService-Next-Hono-Base を基盤とするWebサービス開発において、OpenAPI仕様書を作成する際のガイドラインとテンプレートを提供します。

---

## 🎯 ガイドラインの目的

このガイドラインは：
- **契約駆動開発（Contract First）の実践方法を定義**
- **OpenAPI 3.0.3 スキーマの具体的な作成手順を提供**
- **型生成・バリデーション・テストの自動化を支援**
- Hono + Next.js + Better Auth 構成での最適なAPI設計を実現

---

## 📋 契約駆動開発のワークフロー

### 1. 設計フェーズ
```mermaid
graph LR
    A[要件定義] --> B[API設計]
    B --> C[OpenAPI作成]
    C --> D[レビュー・承認]
```

### 2. 実装フェーズ
```mermaid
graph LR
    A[OpenAPI仕様] --> B[型生成]
    B --> C[Mock作成]
    C --> D[並行実装]
    D --> E[統合テスト]
```

### 3. 運用フェーズ
```mermaid
graph LR
    A[仕様変更] --> B[OpenAPI更新]
    B --> C[型再生成]
    C --> D[実装更新]
    D --> E[テスト実行]
```

---

## 📝 OpenAPI仕様書の基本構造

### プロジェクトファイル構成
```
packages/shared-openapi/
  openapi.yaml           # メインのOpenAPI仕様書
  schemas/
    user.yaml           # ユーザー関連スキーマ
    auth.yaml           # 認証関連スキーマ
    common.yaml         # 共通スキーマ（エラー等）
  examples/
    requests/           # リクエスト例
    responses/          # レスポンス例
  generated/
    types.ts           # 生成された型定義
    client.ts          # 生成されたクライアントコード
```

### 基本テンプレート

```yaml
# packages/shared-openapi/openapi.yaml
openapi: 3.0.3
info:
  title: "[プロジェクト名] API"
  version: 1.0.0
  description: |
    [プロジェクトの説明]
    
    ## 認証
    このAPIは Bearer Token による認証を使用します。
    
    ## エラーハンドリング
    すべてのエラーレスポンスは統一された形式で返されます。
  
  contact:
    name: "[チーム名]"
    email: "[連絡先メール]"
  
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: http://localhost:8787/v1
    description: 開発環境
  - url: https://api-staging.[domain].com/v1
    description: ステージング環境
  - url: https://api.[domain].com/v1
    description: 本番環境

# セキュリティスキーム
components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: |
        Better Auth で生成されたJWTトークンを使用します。
        
        例: `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

# グローバルセキュリティ（認証が必要なエンドポイントで使用）
security:
  - BearerAuth: []
```

---

## 🔐 認証・ユーザー管理API設計

### 認証エンドポイントの定義

```yaml
paths:
  # ヘルスチェック（認証不要）
  /health:
    get:
      summary: システム状態確認
      tags: [Health]
      security: []  # 認証不要
      responses:
        '200':
          description: システム正常
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    example: "healthy"
                  timestamp:
                    type: string
                    format: date-time
                    example: "2025-01-01T00:00:00Z"

  # ユーザー登録（認証不要）
  /auth/register:
    post:
      summary: ユーザー登録
      tags: [Authentication]
      security: []  # 認証不要
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password, name]
              properties:
                email:
                  type: string
                  format: email
                  example: "user@example.com"
                  description: "ユーザーのメールアドレス"
                password:
                  type: string
                  minLength: 8
                  example: "SecurePass123!"
                  description: "パスワード（8文字以上）"
                name:
                  type: string
                  minLength: 1
                  maxLength: 100
                  example: "田中太郎"
                  description: "ユーザー名"
      responses:
        '201':
          description: 登録成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthResponse'
        '400':
          $ref: '#/components/responses/ValidationError'
        '409':
          $ref: '#/components/responses/ConflictError'

  # ログイン（認証不要）
  /auth/login:
    post:
      summary: ログイン
      tags: [Authentication]
      security: []  # 認証不要
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email:
                  type: string
                  format: email
                  example: "user@example.com"
                password:
                  type: string
                  example: "SecurePass123!"
      responses:
        '200':
          description: ログイン成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthResponse'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '400':
          $ref: '#/components/responses/ValidationError'

  # ログアウト（認証必要）
  /auth/logout:
    post:
      summary: ログアウト
      tags: [Authentication]
      security:
        - BearerAuth: []
      responses:
        '204':
          description: ログアウト成功
        '401':
          $ref: '#/components/responses/UnauthorizedError'

  # 現在のユーザー情報取得（認証必要）
  /me:
    get:
      summary: 現在のユーザー情報取得
      tags: [User]
      security:
        - BearerAuth: []
      responses:
        '200':
          description: ユーザー情報取得成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserResponse'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
    
    put:
      summary: 現在のユーザー情報更新
      tags: [User]
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                  minLength: 1
                  maxLength: 100
                  example: "田中次郎"
                email:
                  type: string
                  format: email
                  example: "newemail@example.com"
      responses:
        '200':
          description: 更新成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserResponse'
        '400':
          $ref: '#/components/responses/ValidationError'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '409':
          $ref: '#/components/responses/ConflictError'
```

---

## 📊 スキーマ定義のベストプラクティス

### 共通スキーマの定義

```yaml
components:
  schemas:
    # 成功レスポンスの基本形
    SuccessResponse:
      type: object
      required: [success, data]
      properties:
        success:
          type: boolean
          example: true
        message:
          type: string
          example: "操作が正常に完了しました"
        data:
          type: object
          description: "レスポンスデータ"

    # エラーレスポンスの基本形
    ErrorResponse:
      type: object
      required: [success, error]
      properties:
        success:
          type: boolean
          example: false
        error:
          type: object
          required: [code, message]
          properties:
            code:
              type: string
              example: "VALIDATION_ERROR"
              description: "エラーコード"
            message:
              type: string
              example: "入力データに問題があります"
              description: "エラーメッセージ"
            details:
              type: array
              items:
                type: object
                properties:
                  field:
                    type: string
                    example: "email"
                  message:
                    type: string
                    example: "有効なメールアドレスを入力してください"

    # ユーザー情報
    User:
      type: object
      required: [id, email, name, createdAt]
      properties:
        id:
          type: string
          format: uuid
          example: "123e4567-e89b-12d3-a456-426614174000"
          description: "ユーザーID"
        email:
          type: string
          format: email
          example: "user@example.com"
          description: "メールアドレス"
        name:
          type: string
          example: "田中太郎"
          description: "ユーザー名"
        createdAt:
          type: string
          format: date-time
          example: "2025-01-01T00:00:00Z"
          description: "作成日時"
        updatedAt:
          type: string
          format: date-time
          example: "2025-01-01T00:00:00Z"
          description: "更新日時"

    # 認証レスポンス
    AuthResponse:
      allOf:
        - $ref: '#/components/schemas/SuccessResponse'
        - type: object
          properties:
            data:
              type: object
              required: [user, token]
              properties:
                user:
                  $ref: '#/components/schemas/User'
                token:
                  type: string
                  example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  description: "JWTアクセストークン"
                expiresAt:
                  type: string
                  format: date-time
                  example: "2025-01-08T00:00:00Z"
                  description: "トークン有効期限"

    # ユーザー情報レスポンス
    UserResponse:
      allOf:
        - $ref: '#/components/schemas/SuccessResponse'
        - type: object
          properties:
            data:
              $ref: '#/components/schemas/User'

    # ページネーション
    Pagination:
      type: object
      required: [page, limit, total, pages]
      properties:
        page:
          type: integer
          minimum: 1
          example: 1
          description: "現在のページ"
        limit:
          type: integer
          minimum: 1
          maximum: 100
          example: 20
          description: "1ページあたりの件数"
        total:
          type: integer
          minimum: 0
          example: 150
          description: "総データ件数"
        pages:
          type: integer
          minimum: 0
          example: 8
          description: "総ページ数"
        hasNext:
          type: boolean
          example: true
          description: "次のページが存在するか"
        hasPrev:
          type: boolean
          example: false
          description: "前のページが存在するか"

  responses:
    # 共通エラーレスポンス
    ValidationError:
      description: バリデーションエラー
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            success: false
            error:
              code: "VALIDATION_ERROR"
              message: "入力データに問題があります"
              details:
                - field: "email"
                  message: "有効なメールアドレスを入力してください"
                - field: "password"
                  message: "パスワードは8文字以上である必要があります"

    UnauthorizedError:
      description: 認証エラー
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            success: false
            error:
              code: "UNAUTHORIZED"
              message: "認証が必要です"

    ForbiddenError:
      description: 認可エラー
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            success: false
            error:
              code: "FORBIDDEN"
              message: "この操作を実行する権限がありません"

    NotFoundError:
      description: リソースが見つからない
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            success: false
            error:
              code: "NOT_FOUND"
              message: "指定されたリソースが見つかりません"

    ConflictError:
      description: リソースの競合
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            success: false
            error:
              code: "CONFLICT"
              message: "このメールアドレスは既に使用されています"

    InternalServerError:
      description: サーバー内部エラー
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            success: false
            error:
              code: "INTERNAL_SERVER_ERROR"
              message: "サーバー内部でエラーが発生しました"
```

---

## 🔧 型生成・バリデーション設定

### package.json スクリプト設定

```json
{
  "scripts": {
    "openapi:validate": "swagger-codegen validate -i packages/shared-openapi/openapi.yaml",
    "openapi:generate": "run-s openapi:generate:*",
    "openapi:generate:types": "openapi-typescript packages/shared-openapi/openapi.yaml -o packages/shared-openapi/generated/types.ts",
    "openapi:generate:client": "openapi-zod-client packages/shared-openapi/openapi.yaml -o packages/shared-openapi/generated/client.ts",
    "openapi:watch": "nodemon --watch packages/shared-openapi/openapi.yaml --exec 'pnpm openapi:generate'"
  },
  "devDependencies": {
    "openapi-typescript": "^6.7.1",
    "openapi-zod-client": "^1.10.2",
    "swagger-codegen-cli": "^3.0.46",
    "nodemon": "^3.0.2",
    "npm-run-all": "^4.1.5"
  }
}
```

### 型生成設定ファイル

```typescript
// dev/codegen/openapi.config.ts
export const openApiConfig = {
  input: "packages/shared-openapi/openapi.yaml",
  output: {
    types: "packages/shared-openapi/generated/types.ts",
    client: "packages/shared-openapi/generated/client.ts",
  },
  options: {
    // 型生成オプション
    types: {
      arrayFormat: "generic", // Array<T> 形式を使用
      enumFormat: "union",    // Union Types を使用
    },
    // クライアント生成オプション
    client: {
      baseUrl: process.env.API_BASE_URL || "http://localhost:8787/v1",
      withCredentials: true,
      zodValidation: true,
    }
  }
}
```

---

## 🧪 OpenAPI仕様のテスト・検証

### 仕様書の検証

```bash
# OpenAPI仕様書の構文チェック
pnpm openapi:validate

# 生成された型の整合性チェック
pnpm type-check

# API仕様とMockサーバーの整合性チェック
pnpm test:api-contract
```

### Contract Testing の実装

```typescript
// apps/api/src/tests/contract.test.ts
import { describe, it, expect } from 'vitest'
import { testApiSpec } from '@openapi/testing-tools'
import openApiSpec from '../../../packages/shared-openapi/openapi.yaml'

describe('API Contract Tests', () => {
  it('should match OpenAPI specification', async () => {
    const result = await testApiSpec({
      spec: openApiSpec,
      baseUrl: 'http://localhost:8787/v1',
      paths: [
        'GET /health',
        'POST /auth/register',
        'POST /auth/login',
        'GET /me'
      ]
    })
    
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })
})
```

---

## 📱 フロントエンド統合

### 生成された型の使用例

```typescript
// apps/web/src/lib/api-client.ts
import { createApiClient } from '@shared/openapi/generated/client'
import type { paths } from '@shared/openapi/generated/types'

// 型安全なAPIクライアントの作成
export const apiClient = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

// 型安全なAPI呼び出し例
export async function loginUser(credentials: {
  email: string
  password: string
}) {
  const response = await apiClient.POST('/auth/login', {
    body: credentials
  })
  
  if (response.error) {
    throw new Error(response.error.message)
  }
  
  return response.data // 型安全なレスポンス
}

// React hooks での使用例
export function useCurrentUser() {
  const [user, setUser] = useState<paths['/me']['get']['responses']['200']['content']['application/json']['data'] | null>(null)
  
  const fetchUser = async () => {
    const response = await apiClient.GET('/me')
    if (response.data) {
      setUser(response.data.data)
    }
  }
  
  return { user, fetchUser }
}
```

---

## 🔄 バージョニング戦略

### APIバージョニングの方針

```yaml
# プロジェクト固有で決定すべき事項
## バージョニング戦略

### 採用方式
- [ ] URL Path バージョニング（推奨）: `/v1/users`, `/v2/users`
- [ ] Header バージョニング: `API-Version: v1`
- [ ] Query パラメーター: `/users?version=v1`

### バージョンアップの基準
- **Minor Version**: 後方互換性のある変更（フィールド追加等）
- **Major Version**: 破壊的変更（フィールド削除・型変更等）

### 廃止ポリシー
- 旧バージョンの保持期間: _____ ヶ月
- 廃止予告期間: _____ ヶ月
- マイグレーションガイドの提供: 必須/任意
```

### 複数バージョン対応の実装

```yaml
# packages/shared-openapi/v1/openapi.yaml（現行版）
openapi: 3.0.3
info:
  title: "Project API v1"
  version: "1.0.0"
servers:
  - url: http://localhost:8787/v1

# packages/shared-openapi/v2/openapi.yaml（次期版）
openapi: 3.0.3
info:
  title: "Project API v2"
  version: "2.0.0"
servers:
  - url: http://localhost:8787/v2
```

---

## ✅ OpenAPI仕様書作成チェックリスト

### 基本設定
- [ ] プロジェクト情報（title, version, description）が適切に設定されている
- [ ] サーバー情報（開発・ステージング・本番）が定義されている
- [ ] セキュリティスキーム（Bearer認証）が設定されている
- [ ] タグ（Authentication, User等）が適切に分類されている

### エンドポイント設計
- [ ] 認証不要エンドポイント（/health, /auth/*）が適切に設定されている
- [ ] 認証必要エンドポイント（/me等）にセキュリティが適用されている
- [ ] HTTPメソッドが適切に選択されている（GET, POST, PUT, DELETE）
- [ ] パスパラメーター・クエリパラメーターが適切に定義されている

### スキーマ設計
- [ ] 共通スキーマ（SuccessResponse, ErrorResponse）が定義されている
- [ ] ドメイン固有スキーマ（User等）が適切に設計されている
- [ ] バリデーション（required, format, minLength等）が設定されている
- [ ] 例（example）が適切に提供されている

### レスポンス設計
- [ ] 成功レスポンス（200, 201, 204）が適切に定義されている
- [ ] エラーレスポンス（400, 401, 403, 404, 409, 500）が統一されている
- [ ] ページネーションが必要なエンドポイントで定義されている

### 開発・運用
- [ ] 型生成スクリプトが正常に動作する
- [ ] バリデーション・テストが実装されている
- [ ] ドキュメント生成が適切に動作する
- [ ] バージョニング戦略が明確に定義されている

---

## 🛠️ 便利なツール・拡張機能

### VS Code 拡張機能
- **OpenAPI (Swagger) Editor**: YAML編集・プレビュー
- **YAML**: YAML構文ハイライト・バリデーション
- **REST Client**: APIテスト・デバッグ

### CLI ツール
```bash
# OpenAPI ジェネレーター
npm install -g @openapitools/openapi-generator-cli

# Swagger Codegen
npm install -g swagger-codegen-cli

# Prism（Mockサーバー）
npm install -g @stoplight/prism-cli

# Redoc CLI（ドキュメント生成）
npm install -g redoc-cli
```

### 開発・デバッグ用コマンド

```bash
# Mock API サーバー起動
prism mock packages/shared-openapi/openapi.yaml --port 8788

# ドキュメント生成・プレビュー
redoc-cli serve packages/shared-openapi/openapi.yaml --port 8080

# API仕様の差分チェック
openapi-diff packages/shared-openapi/v1/openapi.yaml packages/shared-openapi/v2/openapi.yaml
```

---

## 🎯 次のステップ

1. **プロジェクト要件の整理**: 具体的なWebサービスの要件・エンドポイントを定義
2. **OpenAPI仕様書の作成**: このガイドラインに基づいて詳細な仕様書を作成
3. **型生成・統合**: フロントエンド・バックエンドでの型生成を設定
4. **Contract Testing**: API仕様とImplementationの整合性テストを実装
5. **継続的改善**: 開発進行に応じて仕様書を継続的に更新・改善

---

## 📚 参考資料

### OpenAPI 公式ドキュメント
- [OpenAPI Specification 3.0.3](https://spec.openapis.org/oas/v3.0.3)
- [OpenAPI Guide](https://swagger.io/docs/specification/about/)

### ツール・ライブラリ
- [openapi-typescript](https://github.com/drwpow/openapi-typescript)
- [openapi-zod-client](https://github.com/astahmer/openapi-zod-client)
- [Prism Mock Server](https://stoplight.io/open-source/prism)

---

© 2025 WebService-Next-Hono-Base Development Team
