# OpenAPI技術仕様書作成ガイドライン

**WebService-Next-Hono-Base** を基盤として実サービスを開発する際の、OpenAPI技術仕様書作成における設計指針・テンプレートを提供します。

---

## 🎯 本ガイドラインの使い方

### 対象読者
- **API仕様書作成者**: OpenAPI仕様書作成・メンテナンス時
- **システム設計者**: 契約駆動開発・API設計時  
- **開発チームリーダー**: API開発プロセス・品質管理時

### 活用場面
- **契約駆動開発**: OpenAPI仕様を先行して作成・合意形成時
- **技術仕様書作成**: 正確で実装可能なAPI仕様書作成時
- **型安全性確保**: フロントエンド・バックエンド間の型整合性確保時
- **API品質管理**: 仕様変更・バージョン管理・レビュープロセス時

---

## 🎯 WebService-Next-Hono-Base でのOpenAPI活用方針

### 本ベースプロジェクトでのOpenAPI統合
このベースでは以下のOpenAPI活用方法を前提としています：

| 統合要素 | 役割 | 仕様書作成時の考慮点 |
|---------|------|---------------------|
| **OpenAPI 3.0.3** | API仕様書標準 | 正確なスキーマ定義・型生成対応 |
| **Zod統合** | ランタイムバリデーション | Zodスキーマとの整合性確保 |
| **型生成** | TypeScript型自動生成 | フロントエンド・バックエンド型共有 |
| **Hono統合** | APIエンドポイント実装 | ルーティング・ミドルウェア連携 |
| **Vercel環境最適化** | Edge Runtime・VercelKV連携 | 高性能・低レイテンシAPI設計 |

### 技術仕様書で定義すべきOpenAPI要素

| 仕様要素 | 技術仕様書での定義内容 | 本ベースでの実現方法 |
|---------|----------------------|---------------------|
| **エンドポイント定義** | パス・HTTPメソッド・パラメータ仕様 | Honoルーティング + Zodバリデーション |
| **スキーマ定義** | リクエスト・レスポンスの型仕様 | TypeScript型生成 + 型安全性 |
| **認証仕様** | セキュリティスキーム・権限制御 | Better Auth統合仕様 |
| **エラー仕様** | エラーレスポンス・ステータスコード | 統一エラーハンドリング設計 |

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

## 🚦 OpenAPI仕様書でのレートリミット定義

### レートリミット情報の記載方法
**Honoミドルウェア**で実装されるレートリミットの仕様を、API利用者向けに明記：

#### OpenAPI仕様書での記載目的
```markdown
## レートリミット仕様書記載の目的
1. **API利用者への情報提供**: 制限値・期間・エラー形式の明示
2. **フロントエンド開発者向け**: 429エラー処理・リトライロジック実装指針
3. **外部連携先への説明**: API使用量制限・課金体系の透明性
4. **実装詳細の分離**: ミドルウェア実装とは独立した仕様定義

## 実装 vs 仕様書の責任分離
- **Honoミドルウェア**: 実際の制限処理・ストレージ管理・パフォーマンス最適化
- **OpenAPI仕様書**: 利用者向けの制限情報・エラー形式・期待動作

## WebService-Next-Hono-Base でのレートリミット技術仕様書

### 本ベースプロジェクトのレートリミット実装
**@upstash/ratelimit + VercelKV** を標準実装として採用：

| 技術要素 | 採用技術 | 技術仕様書での記載方針 |
|---------|----------|----------------------|
| **実装パッケージ** | `@upstash/ratelimit` | パッケージ選択理由・設定方針 |
| **ストレージ** | VercelKV (Upstash Redis) | 容量・性能・可用性要件 |
| **アルゴリズム** | Sliding Window | 制限方式・精度・リセット戦略 |
| **環境対応** | Vercel Edge + Node.js Runtime | デプロイ環境・パフォーマンス特性 |

### 技術仕様書での記載レベル

#### レベル1: 利用者向け情報（OpenAPI仕様書）
```yaml
# API利用者向け：体験・制限・エラー情報のみ
x-rate-limit:
  limit: 5
  window: "15分"
  scope: "IPアドレス"
  reset_strategy: "スライディングウィンドウ"
```

#### レベル2: 実装仕様（技術設計書）
```markdown
## レートリミット実装仕様

### 技術スタック
- パッケージ: @upstash/ratelimit v2.0+
- ストレージ: VercelKV (Upstash Redis互換)
- 実行環境: Vercel Edge Runtime推奨

### 実装設定
- アルゴリズム: Sliding Window (高精度)
- 分散対応: グローバル分散KVストレージ
- 分析機能: Upstash Analytics有効化
```

#### レベル3: 運用仕様（インフラ・運用書）
```markdown
## 運用・監視仕様
- KVストレージ容量計画
- レイテンシ・可用性監視
- コスト最適化設定
```
```

#### 拡張フィールドでの定義
```yaml
# API利用者向けのレートリミット情報（実装詳細は含まない）
paths:
  /auth/login:
    post:
      summary: ユーザーログイン
      description: |
        ユーザーのメールアドレスとパスワードでログインします。
        セキュリティのため、IPアドレス別に連続ログイン試行を制限しています。
      x-rate-limit:
        # API利用者向け情報
        limit: 5                           # 制限回数
        window: "15分"                     # 時間窓
        scope: "IPアドレス"               # 制限単位
        reset_strategy: "スライディングウィンドウ"
        # エラー時の対応指針
        error_code: "RATE_LIMIT_EXCEEDED"
        retry_strategy: "exponential_backoff"
        # 利用者向け説明（実装技術は記載しない）
        description: "ブルートフォース攻撃防止のため、同一IPから15分間に5回まで"
        # Vercel環境での高可用性・低レイテンシ実現（技術詳細は記載しない）
        infrastructure: "グローバル分散KVストレージによる高速応答"
      responses:
        '200':
          description: ログイン成功
        '429':
          description: レートリミット超過
          headers:
            Retry-After:
              schema:
                type: integer
              description: 再試行可能になるまでの秒数
            X-RateLimit-Limit:
              schema:
                type: integer
              description: 制限値
            X-RateLimit-Remaining:
              schema:
                type: integer
              description: 残り回数
            X-RateLimit-Reset:
              schema:
                type: integer
              description: リセット時刻（Unix timestamp）
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RateLimitError'
```

#### レートリミットエラーレスポンススキーマ
```yaml
components:
  schemas:
    RateLimitError:
      type: object
      required: [error, message, retry_after]
      properties:
        error:
          type: string
          example: "rate_limit_exceeded"
          description: "エラー種別"
        message:
          type: string
          example: "Rate limit exceeded. Try again in 60 seconds."
          description: "人間向けエラーメッセージ"
        retry_after:
          type: integer
          example: 60
          description: "再試行までの秒数"
        limit:
          type: integer
          example: 100
          description: "制限値"
        remaining:
          type: integer
          example: 0
          description: "残り回数"
        reset:
          type: integer
          example: 1640995200
          description: "リセット時刻（Unix timestamp）"
```

#### @upstash/ratelimit 技術仕様書記載指針

### 技術仕様書での記載方針

#### 1. 技術選択・設計判断の記載
```markdown
## レートリミット技術選択

### @upstash/ratelimit 採用理由
- **VercelKV統合**: Vercel プラットフォーム最適化
- **Sliding Window**: Fixed Window より高精度制限
- **Edge Runtime対応**: グローバル分散・低レイテンシ
- **Analytics機能**: 制限違反のリアルタイム監視

### 環境別ストレージ戦略
| 環境 | ストレージ | 理由 |
|------|-----------|------|
| 開発 | ローカルRedis or VercelKV Dev | 開発効率・コスト |
| ステージング | VercelKV Staging | 本番同等テスト |
| 本番 | VercelKV Production | 高可用性・スケール |
```

#### 2. 設計パターン・アーキテクチャ
```markdown
## 制限アルゴリズム・キー戦略設計

### アルゴリズム選択指針
- **Sliding Window**: 重要API（認証・決済）- 高精度制御
- **Fixed Window**: 一般API - 軽量・高速処理
- **Token Bucket**: バースト許可が必要なAPI

### キー戦略設計
- **IP制限**: 未認証・公開API (`ip:${clientIP}`)
- **ユーザー制限**: 認証済みAPI (`user:${userId}`)  
- **複合制限**: 高セキュリティAPI (`${ip}:${userId}`)
- **カスタム制限**: 特殊要件API (`custom:${identifier}`)

### パターンマッチング優先度
1. **完全一致** (最高優先度)
2. **正規表現** (パターン優先度順)
3. **デフォルト制限** (フォールバック)
```

#### 3. 運用・監視設計
```markdown
## 運用・監視要件

### パフォーマンス目標
- レスポンス時間: 95percentile < 50ms
- 可用性: 99.9% (VercelKV SLA準拠)
- 制限精度: ±5% (Sliding Window基準)

### 監視項目・閾値
- VercelKV レイテンシ: >100ms で警告
- 制限違反率: >10% で調査トリガー  
- ストレージ使用量: 80% で容量拡張

### エラーハンドリング方針
- VercelKV接続失敗: 制限無効化（可用性優先）
- 段階的復旧: 制限接近時の事前警告
- Analytics失敗: 制限継続・監視のみ無効化
```

**記載のポイント**:
- **実装コード詳細は記載しない**（10-0 API設計ガイドラインを参照）
- **設計判断・選択理由**を中心に記載
- **運用・監視要件**の明確化
- **環境別戦略**の整理

#### エンドポイント別レートリミット情報例
```yaml
# 認証系エンドポイント（厳格な制限）
/auth/login:
  post:
    x-rate-limit: 
      limit: 5
      window: "15分"
      scope: "IPアドレス"
      purpose: "ブルートフォース攻撃防止"

/auth/register:
  post:
    x-rate-limit:
      limit: 3
      window: "1時間"
      scope: "IPアドレス"
      purpose: "スパム登録防止"

# 一般API（通常利用）
/api/users:
  get:
    x-rate-limit:
      limit: 100
      window: "1分"
      scope: "認証ユーザー"
      purpose: "適正利用促進"
  post:
    x-rate-limit:
      limit: 10
      window: "1分"
      scope: "認証ユーザー"
      purpose: "データ作成制限"

# 管理者API（慎重な操作）
/api/admin/users:
  delete:
    x-rate-limit:
      limit: 5
      window: "1分"
      scope: "管理者ユーザー"
      purpose: "誤操作防止"

# 公開API（リソース保護）
/api/public/info:
  get:
    x-rate-limit:
      limit: 60
      window: "1分"
      scope: "IPアドレス"
      purpose: "サーバーリソース保護"
```

---

## �📝 OpenAPI仕様書の基本構造

### プロジェクトファイル構成
```
packages/shared-openapi/
  openapi.yaml           # メインのOpenAPI仕様書
  schemas/
    user.yaml           # ユーザー関連スキーマ
    auth.yaml           # 認証関連スキーマ
    common.yaml         # 共通スキーマ（エラー等）
    rate-limit.yaml     # レートリミット関連スキーマ
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

## 📋 @upstash/ratelimit 技術仕様書統合ガイドライン

### 実装決定時の記載指針

```markdown
## @upstash/ratelimit 技術仕様書記載項目

### 1. 採用理由・技術選択根拠
- **VercelKV統合**: Vercel プラットフォームでの最適化されたパフォーマンス
- **Edge Runtime対応**: グローバル分散でのレイテンシ最小化
- **Sliding Window**: Fixed Windowアルゴリズムよりも高精度な制限制御
- **分析機能**: 内蔵Analytics によるリアルタイム監視

### 2. 基本実装設計仕様
```typescript
// @upstash/ratelimit 基本実装例
import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(100, "1m"),
  analytics: process.env.NODE_ENV === "production",
  prefix: "api_ratelimit"
});

// Hono middleware 統合
const rateLimitMiddleware = async (c: Context, next: Next) => {
  const identifier = getClientIdentifier(c);
  const { success, limit, remaining, reset } = await ratelimit.limit(identifier);
  
  c.header("X-RateLimit-Limit", limit.toString());
  c.header("X-RateLimit-Remaining", remaining.toString());
  c.header("X-RateLimit-Reset", reset.toString());
  
  if (!success) {
    return c.json({ error: "rate_limit_exceeded" }, 429);
  }
  
  await next();
};
```

### 3. 制限戦略・キー設計
```markdown
### 制限識別子戦略
- **IPベース制限**: `ip:${clientIP}` - 不正アクセス防止
- **ユーザーベース制限**: `user:${userId}` - 認証後の個別制限
- **APIキーベース制限**: `key:${apiKey}` - パートナーAPI制限
- **エンドポイント別**: `${method}:${path}:${identifier}` - 差別化制限

### アルゴリズム別特性
| アルゴリズム | 精度 | メモリ使用量 | 用途 |
|-------------|------|-------------|------|
| Fixed Window | 低 | 少 | 基本制限 |
| Sliding Window | 高 | 多 | 重要API |
| Token Bucket | 中 | 中 | バースト許可 |
```

### 4. 環境別設定管理・開発環境対応

#### 開発環境での実装選択肢

```markdown
## 開発環境レートリミット実装戦略

### 選択肢1: VercelKV Development Database
**推奨度**: ⭐⭐⭐⭐⭐ (最推奨)
```typescript
// .env.local での設定
KV_REST_API_URL=https://dev-xxxx.upstash.io
KV_REST_API_TOKEN=AYxxxx

// 開発環境設定
const devRateLimit = new Ratelimit({
  redis: kv, // VercelKV Dev環境
  limiter: Ratelimit.slidingWindow(1000, "1m"), // 緩い制限
  analytics: false, // コスト削減
  prefix: "dev_rl"
});
```

**メリット**: 本番同等の動作・Vercel統合・簡単セットアップ
**デメリット**: VercelKVアカウント必要・軽微なコスト

### 選択肢2: ローカルRedis + @upstash/ratelimit
**推奨度**: ⭐⭐⭐⭐☆
```typescript
import Redis from "ioredis";

// ローカルRedis接続
const redis = new Redis({
  host: "localhost",
  port: 6379,
  maxRetriesPerRequest: 3
});

const devRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(1000, "1m"),
  analytics: false,
  prefix: "local_rl"
});
```

**セットアップ**: 
```bash
# Docker Compose でローカルRedis起動
docker run -d -p 6379:6379 redis:alpine

# または Homebrew
brew install redis
brew services start redis
```

**メリット**: 完全オフライン開発・高速・無料
**デメリット**: Redis管理必要・環境差異発生可能性

### 選択肢3: In-Memory Mock (開発専用)
**推奨度**: ⭐⭐⭐☆☆
```typescript
// 開発環境専用メモリ実装
class DevMemoryRateLimit {
  private cache = new Map<string, { count: number; resetTime: number }>();
  
  async limit(identifier: string) {
    const now = Date.now();
    const key = identifier;
    const current = this.cache.get(key);
    
    // 1分ウィンドウでリセット
    if (!current || now > current.resetTime) {
      this.cache.set(key, { count: 1, resetTime: now + 60000 });
      return { success: true, limit: 1000, remaining: 999, reset: new Date(now + 60000) };
    }
    
    current.count++;
    const remaining = Math.max(0, 1000 - current.count);
    
    return {
      success: current.count <= 1000,
      limit: 1000,
      remaining,
      reset: new Date(current.resetTime)
    };
  }
}

// 環境別実装切り替え
const createRateLimit = () => {
  if (process.env.NODE_ENV === "development" && !process.env.KV_REST_API_URL) {
    return new DevMemoryRateLimit();
  }
  
  return new Ratelimit({
    redis: kv,
    limiter: Ratelimit.slidingWindow(100, "1m"),
    analytics: process.env.NODE_ENV === "production"
  });
};
```

**メリット**: 依存関係なし・高速・シンプル
**デメリット**: 本番との動作差異・プロセス再起動でリセット

### 選択肢4: レートリミット無効化 (テスト特化)
**推奨度**: ⭐⭐☆☆☆
```typescript
const createRateLimit = () => {
  if (process.env.NODE_ENV === "development" && process.env.DISABLE_RATE_LIMIT) {
    // 開発時はパススルー
    return {
      limit: async () => ({
        success: true,
        limit: Infinity,
        remaining: Infinity,
        reset: new Date()
      })
    };
  }
  
  return new Ratelimit({ /* 通常設定 */ });
};
```

**メリット**: 完全バイパス・テスト高速化
**デメリット**: レートリミット機能テスト不可・本番との大幅差異

#### 環境別設定統合実装

```typescript
// 環境別設定統合版
import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";
import Redis from "ioredis";

const createEnvironmentRateLimit = () => {
  const env = process.env.NODE_ENV;
  
  switch (env) {
    case "development":
      // 開発環境: VercelKV Dev または ローカルRedis
      if (process.env.KV_REST_API_URL) {
        // VercelKV Dev環境使用
        return new Ratelimit({
          redis: kv,
          limiter: Ratelimit.slidingWindow(1000, "1m"), // 緩い制限
          analytics: false,
          prefix: "dev_rl"
        });
      } else if (process.env.REDIS_URL || process.env.LOCAL_REDIS) {
        // ローカルRedis使用
        const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
        return new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(1000, "1m"),
          analytics: false,
          prefix: "local_rl"
        });
      } else {
        // フォールバック: In-Memory実装
        console.warn("No Redis configured for development, using in-memory rate limiting");
        return createInMemoryRateLimit();
      }
      
    case "staging":
      return new Ratelimit({
        redis: kv,
        limiter: Ratelimit.slidingWindow(100, "1m"), // 本番同等制限
        analytics: true,
        prefix: "stg_rl"
      });
      
    case "production":
      return new Ratelimit({
        redis: kv,
        limiter: Ratelimit.slidingWindow(100, "1m"), // 厳密制限
        analytics: true,
        prefix: "prod_rl"
      });
      
    default:
      throw new Error(`Unsupported environment: ${env}`);
  }
};

// 使用例
const ratelimit = createEnvironmentRateLimit();
```

#### 開発環境セットアップガイド

```bash
# 選択肢1: VercelKV Development Database（推奨）
# 1. Vercel CLIインストール・ログイン
npm install -g vercel
vercel login

# 2. プロジェクトにVercelKV追加
vercel kv create dev-rate-limit

# 3. 環境変数を .env.local に設定
# KV_REST_API_URL と KV_REST_API_TOKEN が自動設定

# 選択肢2: ローカルRedis
# Docker使用
docker run -d --name dev-redis -p 6379:6379 redis:alpine

# Homebrew使用 (macOS)
brew install redis
brew services start redis

# 環境変数設定（Infisical使用時）
# 1. Infisical CLI インストール
npm install -g @infisical/cli

# 2. Infisical に開発環境用設定を追加
infisical secrets set --env=development REDIS_URL redis://localhost:6379
infisical secrets set --env=development LOCAL_REDIS true
infisical secrets set --env=development RATE_LIMIT_STORAGE local

# 3. アプリケーション起動時にInfisical経由で環境変数読み込み
infisical run --env=development -- next dev

# 選択肢3: 完全開発モード
echo "NODE_ENV=development" >> .env.local
echo "DISABLE_RATE_LIMIT=true" >> .env.local  # テスト時のみ
```

#### 開発環境推奨アプローチ

```markdown
## 開発環境実装の推奨順位

### 🥇 第1推奨: VercelKV Development Database
- **理由**: 本番環境との完全互換性
- **セットアップ**: `vercel kv create` で1コマンド
- **コスト**: 開発使用量では実質無料
- **メリット**: 本番デプロイ時の設定変更不要

### 🥈 第2推奨: ローカルRedis + Docker
- **理由**: オフライン開発可能・高速
- **セットアップ**: Docker1行で完了
- **コスト**: 完全無料
- **メリット**: ネットワーク依存なし

### 🥉 第3推奨: In-Memory Mock実装
- **理由**: 依存関係最小・テスト高速化
- **セットアップ**: コード実装のみ
- **注意**: 本番との動作差異あり
- **用途**: 単体テスト・プロトタイピング向け

### ❌ 非推奨: レートリミット完全無効化
- **問題**: 本番バグ見逃しリスク
- **用途**: 統合テスト時の一時的利用のみ
```

#### package.json 依存関係設定

```json
{
  "dependencies": {
    "@upstash/ratelimit": "^2.0.0",
    "@vercel/kv": "^1.0.0",
    "hono": "^4.0.0"
  },
  "devDependencies": {
    "ioredis": "^5.3.0"  // ローカルRedis使用時のみ
  },
  "scripts": {
    "dev": "next dev",
    "dev:redis": "docker run -d --name dev-redis -p 6379:6379 redis:alpine && REDIS_URL=redis://localhost:6379 LOCAL_REDIS=true next dev",
    "dev:redis-only": "docker run -d --name dev-redis -p 6379:6379 redis:alpine",
    "dev:with-local-redis": "REDIS_URL=redis://localhost:6379 LOCAL_REDIS=true next dev",
    "dev:clean": "docker stop dev-redis && docker rm dev-redis"
  }
}
```

### 5. パフォーマンス・監視要件
```markdown
### パフォーマンス目標
- **レスポンス時間**: 95percentile < 50ms
- **可用性**: 99.9% (VercelKV SLA準拠)
- **制限精度**: Sliding Window で ±5% 以内

### 監視・アラート設定
- **VercelKV レイテンシ**: >100ms で警告
- **制限違反率**: >10% で調査トリガー
- **エラー率**: >1% で緊急アラート
- **ストレージ使用量**: 80% で容量拡張検討

### コスト最適化
- **Analytics機能**: 本番環境のみ有効化
- **TTL設定**: 不要なキーの自動削除
- **プレフィックス管理**: 環境別キー分離
```

### 6. エラーハンドリング・復旧設計
```typescript
// エラーハンドリング実装例
const rateLimitWithFallback = async (identifier: string) => {
  try {
    const result = await ratelimit.limit(identifier);
    return result;
  } catch (error) {
    // VercelKV接続失敗時はフォールバック
    console.error("Rate limit check failed:", error);
    return {
      success: true, // 可用性優先でパススルー
      limit: 0,
      remaining: 0,
      reset: new Date()
    };
  }
};

// 段階的復旧実装
const gradualRecovery = (remaining: number, limit: number) => {
  const utilizationRate = (limit - remaining) / limit;
  
  if (utilizationRate > 0.8) {
    // 80%使用時は警告ヘッダー追加
    return { warning: "approaching_rate_limit" };
  }
  
  return {};
};
```
```

### レートリミットパラメータの記載場所指針

#### 1. OpenAPI仕様書（Level 1: API利用者向け）
```yaml
# API利用者が知るべき制限情報のみ記載
paths:
  /api/users:
    get:
      summary: ユーザー一覧取得
      description: |
        ## レートリミット
        - 制限: **100 requests/minute per IP**
        - 制限超過時: 429 Too Many Requests
        - リトライ: Retry-After ヘッダーを参照
      responses:
        429:
          description: レートリミット超過
          headers:
            X-RateLimit-Limit:
              description: 時間窓内の最大リクエスト数
              schema: { type: integer, example: 100 }
            X-RateLimit-Remaining:
              description: 残りリクエスト数
              schema: { type: integer, example: 45 }
            X-RateLimit-Reset:
              description: 制限リセット時刻（Unix timestamp）
              schema: { type: integer, example: 1640995200 }
            Retry-After:
              description: 次回リクエスト可能まで（秒）
              schema: { type: integer, example: 45 }
```

**記載内容**:
- エンドポイント別制限値（100 requests/minute）
- 制限単位（per IP, per User）
- エラーレスポンス形式
- リトライ推奨方法

**記載しない内容**:
- 実装パッケージ名（@upstash/ratelimit）
- アルゴリズム詳細（Sliding Window）
- ストレージ設定（VercelKV）

#### 2. 技術設計書（Level 2: 実装パラメータ）
```markdown
## レートリミット技術設計書での記載項目

### エンドポイント別制限設計
技術設計書では、OpenAPI仕様書には記載しない実装詳細を含めた設計を記載：

| 設計項目 | 記載内容 | 例 |
|---------|----------|----| 
| **アルゴリズム** | 制限算出方式 | Sliding Window, Fixed Window |
| **ストレージ** | 状態保存場所 | VercelKV, Redis, Memory |
| **キー戦略** | 制限単位識別 | IP, UserID, APIKey |
| **優先度制御** | パターンマッチング順序 | 認証API > 一般API > デフォルト |
| **フォールバック** | 設定未定義時の動作 | デフォルト制限値の適用 |

### パスパターン設計指針
```markdown
## 正規表現パターン設計

### パターン種類と優先度
1. **認証系**: `^/api/auth/.*` (Priority: 100)
2. **管理者系**: `^/api/admin/.*` (Priority: 90)  
3. **アップロード系**: `^/api/.*/upload$` (Priority: 85)
4. **ユーザー個別**: `^/api/users/[0-9]+$` (Priority: 80)
5. **公開API**: `^/api/public/.*` (Priority: 70)
6. **デフォルト**: `^/api/.*` (Priority: 1)

### マッチング処理順序
1. **完全一致** → 2. **正規表現マッチ** → 3. **デフォルト**
```

### 実装技術選択の記載
```markdown
## @upstash/ratelimit 選択理由

### 技術選択根拠
- **VercelKV統合**: Vercel環境での最適パフォーマンス
- **Sliding Window**: Fixed Windowより高精度制限
- **Edge Runtime対応**: グローバル分散・低レイテンシ
- **Analytics**: リアルタイム制限違反監視

### 代替技術との比較
| パッケージ | 用途 | メリット | デメリット |
|-----------|------|----------|-----------|
| @upstash/ratelimit | 本推奨 | VercelKV統合・高精度 | Upstash依存 |
| hono-rate-limiter | Redis使用時 | Redis汎用対応 | 設定複雑 |
| @hono/rate-limiter | 軽量用途 | シンプル・軽量 | メモリベース限定 |
```
```

**記載内容**:
- 技術選択理由・根拠
- アルゴリズム・ストレージ選択詳細
- パスパターン設計指針
- 実装時の考慮事項
- **具体的実装コードは 10-0-api-design-guidelines.md を参照**

#### 3. 環境設定（Infisical: 環境変数パラメータ）
```bash
# 環境別制限値設定
# 開発環境: 緩い制限
infisical secrets set --env=development RATE_LIMIT_DEFAULT_LIMIT 1000
infisical secrets set --env=development RATE_LIMIT_DEFAULT_WINDOW 1m
infisical secrets set --env=development RATE_LIMIT_AUTH_LIMIT 50

# 本番環境: 厳密制限
infisical secrets set --env=production RATE_LIMIT_DEFAULT_LIMIT 100  
infisical secrets set --env=production RATE_LIMIT_DEFAULT_WINDOW 1m
infisical secrets set --env=production RATE_LIMIT_AUTH_LIMIT 5

# エンドポイント別カスタム制限
infisical secrets set --env=production RATE_LIMIT_USERS_GET 100
infisical secrets set --env=production RATE_LIMIT_AUTH_POST 5
infisical secrets set --env=production RATE_LIMIT_UPLOAD_POST 3
```

**記載内容**:
- 環境別制限値差異
- エンドポイント別制限値
- 機能ON/OFF設定

#### 4. 運用監視書（Level 3: 監視パラメータ）
```markdown
## レートリミット監視・アラート設定

### 制限違反監視
- **軽微アラート**: 制限の80%到達時
- **重要アラート**: 制限超過率 >5%
- **緊急アラート**: 制限超過率 >20%

### パフォーマンス監視
- **レスポンス時間**: 95percentile < 50ms
- **可用性**: 99.9% (月間8.76時間以内の停止)
- **エラー率**: <0.1%

### 動的制限調整
- **自動調整**: DDoS検知時は制限を1/10に
- **手動調整**: 緊急時の制限値変更手順
- **復旧**: 攻撃終了後の段階的制限緩和
```

### API種別レートリミット設計指針

#### 🔐 認証用API - セキュリティ最優先
```markdown
| エンドポイント | 制限 | 期間 | キー | 目的 |
|---------------|------|------|------|------|
| POST /api/auth/login | **5回** | **15分** | IP | ブルートフォース防止 |
| POST /api/auth/register | **3回** | **1時間** | IP | スパム登録防止 |
| POST /api/auth/reset | **3回** | **1時間** | IP | パスワードリセット悪用防止 |
| POST /api/auth/verify | **10回** | **5分** | IP | 認証コード総当たり防止 |
```

**設計原則**:
- **最厳格制限**: セキュリティ攻撃防止が最優先
- **IPベース制限**: 未認証のため個別識別不可
- **長期間制限**: 攻撃を効果的に阻止

#### 🌐 公開API - リソース保護重視  
```markdown
| エンドポイント | 制限 | 期間 | キー | 目的 |
|---------------|------|------|------|------|
| GET /api/public/posts | **60回** | **1分** | IP | リソース保護 |
| GET /api/public/search | **30回** | **1分** | IP | 検索負荷制御 |
| GET /api/public/health | **300回** | **1分** | IP | ヘルスチェック |
| GET /api/public/docs | **制限なし** | - | - | ドキュメント提供 |
```

**設計原則**:
- **中程度制限**: 利便性とリソース保護のバランス
- **IPベース制限**: 未認証ユーザー向け
- **高頻度許可**: 正常利用を阻害しない

#### 👤 認証済みAPI - 個別制御・利便性重視
```markdown
| エンドポイント | 制限 | 期間 | キー | 目的 |
|---------------|------|------|------|------|
| GET /api/users | **100回** | **1分** | UserID | 通常利用制限 |
| POST /api/posts | **10回** | **1分** | UserID | コンテンツスパム防止 |
| PUT /api/users/profile | **20回** | **1分** | UserID | プロフィール更新制限 |
| DELETE /api/posts/{id} | **5回** | **1分** | UserID | 誤削除防止 |
| POST /api/upload | **3回** | **5分** | UserID | アップロード負荷制御 |
```

**設計原則**:
- **ユーザー別制限**: 個別アカウントでの制御
- **機能別差別化**: 重要度に応じた制限値調整
- **利便性重視**: 正常利用を優先

#### 🛡️ 管理者API - 権限・操作制御
```markdown
| エンドポイント | 制限 | 期間 | キー | 目的 |
|---------------|------|------|------|------|
| DELETE /api/admin/users/{id} | **5回** | **1分** | UserID | 誤操作防止 |
| POST /api/admin/system/reset | **1回** | **1時間** | UserID | システム操作制限 |
| GET /api/admin/logs | **200回** | **1分** | UserID | ログ閲覧制限 |
| PUT /api/admin/settings | **10回** | **5分** | UserID | 設定変更制限 |
```

**設計原則**:
- **慎重制限**: 重要操作の誤実行防止
- **ユーザー別追跡**: 管理者アカウント識別
- **操作記録**: 制限違反の監査ログ

### パラメータ記載の優先順位

#### 🥇 環境変数（Infisical）: 運用制御パラメータ
- 制限値（数値）
- 時間窓（duration）
- 機能ON/OFF

#### 🥈 技術設計書: 実装設計パラメータ  
- アルゴリズム選択
- キー戦略詳細
- エラーハンドリング

#### 🥉 OpenAPI仕様書: 利用者向けパラメータ
- 公開制限値
- エラー形式
- リトライ方法

### レベル別記載責任の明確化

#### Level 1: OpenAPI仕様書（API利用者向け）
- **記載しない項目**: @upstash/ratelimit パッケージ名・実装詳細
- **記載する項目**: 制限値・エラー形式・リトライ推奨方法
- **対象読者**: フロントエンド開発者・API利用者

#### Level 2: 技術設計書（実装者向け）  
- **記載する項目**: 技術選択理由・アルゴリズム選択・キー戦略
- **記載する詳細**: パフォーマンス要件・エラーハンドリング方針
- **対象読者**: バックエンド開発者・システムアーキテクト
- **実装コード**: **10-0-api-design-guidelines.md を参照**

#### Level 3: 運用監視書（インフラ向け）
- **記載する項目**: VercelKV管理・監視設定・コスト最適化
- **記載する詳細**: アラート閾値・スケーリング戦略・障害対応手順
- **対象読者**: DevOpsエンジニア・運用チーム

### 関連ドキュメント参照

#### 実装詳細・具体的コード
👉 **[10-0-api-design-guidelines.md](./10-0-api-design-guidelines.md)**
- @upstash/ratelimit 実装コード
- ミドルウェア実装
- ルーター統合方法
- 環境変数設定詳細

#### 本書（10-1）の役割
- OpenAPI仕様書記載方法
- 技術仕様書作成指針  
- レベル別記載責任分離
- ドキュメント化方針

---

© 2025 WebService-Next-Hono-Base Development Team
