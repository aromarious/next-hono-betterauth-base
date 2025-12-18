# API 設計ガイドライン

本ドキュメントは、APIのエンドポイント設計、パスの命名規則、および仕様記述に関するガイドラインです。

## 1. URI / パス設計 (Path Naming)

URIは基本的に次のフォーマットを採用します。

* **URIフォーマット**: `/api/v{version}/{scope}/{resource}`
  * `version`: バージョン番号 (e.g. `v0`, `v1`)
  * `scope`: 公開範囲 (`public` or `protected`)
  * `resource`: リソース名 (e.g. `posts`, `users`)

* 例:
  * `/api/v0/public/posts`
  * `/api/v0/protected/users/:id`

### 基本原則

* **ReSTfulライクなリソース指向** を基本とします。
* **ケバブケース (kebab-case)**: URLのパスセグメントは小文字のハイフン区切りを使用します。
  * OK: `/api/v0/public/user-profiles`
* **複数形の名詞**: リソースを表す名前は原則として複数形を使用します。
  * OK: `/api/v0/public/posts`, `/api/v0/protected/users/:id/comments`

### バージョニング

* **URIバージョニング**: 破壊的な変更に対応するため、パスにメジャーバージョンを含めることを推奨します。
  * Format: `/api/v{N}/{scope}/{resource}`
  * OK: `/api/v1/public/posts`, `/api/v2/protected/users`
  * 理由: モバイルアプリや外部連携など、クライアント側の更新タイミングを制御できない場合に、旧バージョンのAPIを維持するため。

### スコープ (Scope)

* **認証スコープ**: バージョン番号の直後に、認証の有無を示すスコープ(`public` / `protected`)を含めることを標準とします。
  * Format: `/api/v{N}/{public|protected}/{resource}`
  * OK: `/api/v0/public/posts` (誰でも見れる)
  * OK: `/api/v0/protected/comments` (ログイン必須)

### 階層構造

* **ネスト**: 親リソースに従属するリソースは階層で表現しますが、**深さは2〜3階層まで**を推奨します。深すぎる場合はルートからのフラットなパスを検討してください。
  * OK: `/api/v0/public/users/:id/posts`
  * Avoid: `/api/v0/protected/organizations/:id/teams/:teamId/projects/:projectId/tasks` (深すぎる)
  * Better: `/api/v0/protected/projects/:projectId/tasks`

### アクションの表現

* 原則としてHTTPメソッド（GET, POST, DELETE等）で動作を表現し、URIに動詞を含めません。
  * NG: `/api/v0/create-user`, `/api/v0/delete-post`
* **例外 (RPCスタイル)**: 認証やステート変更など、リソースのCRUDで表現しにくい場合は動詞の使用を許可します。
  * 例: `/api/v0/public/auth/login`, `/api/v0/protected/posts/:id/publish`

## 2. HTTPメソッドの使い分け

| メソッド | 役割 | 冪等性 | 例 |
| :--- | :--- | :--- | :--- |
| **GET** | リソースの取得 | Yes | `GET /v0/public/posts` (一覧), `GET /v0/public/posts/1` (詳細) |
| **POST** | リソースの新規作成 | No | `POST /v0/protected/posts` |
| **PUT** | リソースの**完全**置換 | Yes | `PUT /v0/protected/posts/1` (ID:1の内容を送信内容ですべて上書き) |
| **PATCH** | リソースの**部分**更新 | Yes | `PATCH /v0/protected/posts/1` (送信されたフィールドのみ更新) |
| **DELETE** | リソースの削除 | Yes | `DELETE /v0/protected/posts/1` |

> **Note**: 更新処理において、送信されていないフィールドを `null` やデフォルト値に戻す場合は `PUT`、変更しない場合は `PATCH` を選定してください。通常は `PATCH` が使いやすく推奨されます。

## 3. リクエスト・レスポンス形式

### データフォーマット

* `Content-Type: application/json` を標準とします。
* プロパティ名は **キャメルケース (camelCase)** を使用します (JS/TSの標準に合わせる)。

### ステータスコード

適切なHTTPステータスコードを返却します。

* **200 OK**: 成功 (GET, PUT, PATCH)
* **201 Created**: 作成成功 (POST)
* **204 No Content**: 成功したが返すそのものがない (DELETE)
* **400 Bad Request**: バリデーションエラー、不正なリクエスト
* **401 Unauthorized**: 未認証 (ログインが必要)
* **403 Forbidden**: 権限不足 (ログインしているが操作不可)
* **404 Not Found**: リソースが存在しない
* **409 Conflict**: リソース競合 (一意制約違反など)
* **500 Internal Server Error**: サーバー内部エラー

### エラーレスポンス形式 (RFC 7807 like)

エラー時は一貫したJSON構造を返却することを推奨します。

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力内容に誤りがあります",
    "details": [
      { "field": "email", "message": "正しくありません" }
    ]
  }
}
```

## 4. 仕様の記述・管理方法

### OpenAPI (Swagger) 自動生成

本プロジェクトでは、`@hono/zod-openapi` と `@scalar/hono-api-reference` を使用して、実装コードからAPI仕様書を自動生成・公開する方式を採用しています。

* **メリット**: 実装とドキュメントの乖離が起きない。
* **記述場所**: 各ルート定義ファイル (`routes/*.ts`) 内で、Zod Schemaを用いて定義します。
* **閲覧方法**: `/api/reference` にアクセスすることで、インタラクティブなAPIドキュメント (Scalar) を閲覧できます。

## 5. 認証と認可 (Authentication & Authorization)

本プロジェクトでは、認証の有無を **URLパスのプレフィックス** で明確に分離する設計を採用しています。

### パスによる分離戦略

APIのエンドポイントは、認証の必要性に応じて以下の2つのグループに分けられます。

#### 1. Public Routes (`/api/v{N}/public/*`)

* **認証**: **不要** (誰でもアクセス可能)
* **用途**: ログイン不要なリソースの閲覧など
* **例**:
  * `GET /api/v0/public/posts` (記事一覧)
  * `GET /api/v0/public/health` (ヘルスチェック)

#### 2. Protected Routes (`/api/v{N}/protected/*`)

* **認証**: **必須** (Valid Session Header / Cookie required)
* **挙動**: 未認証のリクエストに対しては、**ミドルウェア層で一律に `401 Unauthorized` を返却** します。
* **用途**: ユーザーに紐づく操作、作成、編集、削除など
* **例**:
  * `POST /api/v0/protected/posts` (記事作成)
  * `GET /api/v0/protected/me` (自分のプロフィール)

### 実装上の注意点

* 各ハンドラー内で個別に認証チェックを行うのではなく、 **ルート定義の段階でグループを分ける** ことを推奨します。

## 6. 呼び出しイメージ

APIを設計する際は、最終的にフロントエンドからどのように呼び出されるかを常に意識してください。
本プロジェクトのクライアント (`apps/web/lib/client.ts`) は、以下のようなコードで利用されることを前提としています。この呼び出し方が直感的で使いやすいものになるよう、パスやメソッドを設計してください。

```typescript
import { createClient } from "@/lib/client"

// クライアントの生成 (public / protected が返されます)
const { publicClient, protectedClient } = createClient()

// --- Public API の呼び出しイメージ ---
// 設計指針: 認証不要なリソースは publicClient からアクセスできるようにする
const res = await publicClient.hello.$get() 
const data = await res.json()

// --- Protected API の呼び出しイメージ ---
// 設計指針: ユーザー操作は protectedClient からアクセス。
// ネストが深すぎると protectedClient.users[':id'].posts... のように長くなるため注意。
const postRes = await protectedClient.posts.$post({
  json: { title: "My Post", content: "..." }
})

// --- 認証機能の利用イメージ ---
// 認証操作も protectedClient.auth に集約されています。
await protectedClient.auth.signIn.social({
  provider: "google"
})
```

> [!TIP]
> 実装詳細については [クライアント使用ガイド](./client_usage.md) を参照してください。
