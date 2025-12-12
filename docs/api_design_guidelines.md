# API 設計ガイドライン (案)

本ドキュメントは、APIのエンドポイント設計、パスの命名規則、および仕様記述に関するガイドラインの草案です。

## 1. URI / パス設計 (Path Naming)

### 基本原則

* **ReSTfulライクなリソース指向** を基本とします。
* **ケバブケース (kebab-case)**: URLのパスセグメントは小文字のハイフン区切りを使用します。
  * OK: `/api/v0/user-profiles`
  * NG: `/api/v0/user_profiles`, `/api/v0/userProfiles`
* **複数形の名詞**: リソースを表す名前は原則として複数形を使用します。
  * OK: `/api/v0/posts`, `/api/v0/users/:id/comments`
  * NG: `/api/v0/post`, `/api/v0/user/:id/comment`

### バージョニング

* **URIバージョニング**: 破壊的な変更に対応するため、パスにメジャーバージョンを含めることを推奨します。
  * Format: `/api/v{N}/{resource}`
  * OK: `/api/v1/posts`, `/api/v2/users`
  * 理由: モバイルアプリや外部連携など、クライアント側の更新タイミングを制御できない場合に、旧バージョンのAPIを維持するため。

### 階層構造

* **ネスト**: 親リソースに従属するリソースは階層で表現しますが、**深さは2〜3階層まで**を推奨します。深すぎる場合はルートからのフラットなパスを検討してください。
  * OK: `/api/v0/users/:id/posts`
  * Avoid: `/api/v0/organizations/:id/teams/:teamId/projects/:projectId/tasks` (深すぎる)
  * Better: `/api/v0/projects/:projectId/tasks`

### アクションの表現

* 原則としてHTTPメソッド（GET, POST, DELETE等）で動作を表現し、URIに動詞を含めません。
  * NG: `/api/v0/create-user`, `/api/v0/delete-post`
* **例外 (RPCスタイル)**: 認証やステート変更など、リソースのCRUDで表現しにくい場合は動詞の使用を許可します。
  * 例: `/api/v0/auth/login`, `/api/v0/posts/:id/publish`

## 2. HTTPメソッドの使い分け

| メソッド | 役割 | 冪等性 | 例 |
| :--- | :--- | :--- | :--- |
| **GET** | リソースの取得 | Yes | `GET /posts` (一覧), `GET /posts/1` (詳細) |
| **POST** | リソースの新規作成 | No | `POST /posts` |
| **PUT** | リソースの**完全**置換 | Yes | `PUT /posts/1` (ID:1の内容を送信内容ですべて上書き) |
| **PATCH** | リソースの**部分**更新 | Yes | `PATCH /posts/1` (送信されたフィールドのみ更新) |
| **DELETE** | リソースの削除 | Yes | `DELETE /posts/1` |

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

### アプローチ案

API仕様書をどこに、どのように記述するかの提案です。

#### 案A: OpenAPI (Swagger) 自動生成 (推奨)

Honoでは `@hono/zod-openapi` を使用することで、実装コード (Zod Schema) からAPI仕様書 (Swagger UI) を自動生成できます。

* **メリット**: 実装とドキュメントの乖離が起きない。別途ドキュメントを書く手間が省ける。
* **記述場所**: 各ルート定義ファイル (`routes/*.ts`) 内。

#### 案B: Markdown ドキュメント

`docs/api/` ディレクトリ等にMarkdownで仕様を記述します。

* **メリット**: 特別なツールが不要で柔軟。設計段階で書きやすい。
* **デメリット**: 実装後にメンテナンスされなくなり、乖離しやすい。

### 記述すべき項目 (案Bの場合)

Markdown等で仕様を残す場合、以下の項目をテンプレートとします。

1. **概要 (Summary)**: 何をするAPIか
2. **エンドポイント (Endpoint)**: `METHOD /path`
3. **パラメータ (Parameters)**:
    * Path Parameters (例: `:id`)
    * Query Parameters (例: `?limit=10`)
4. **リクエストボディ (Request Body)**: 必須フィールド、型、制約
5. **レスポンス (Response)**:
    * 成功時 (Example JSON)
    * エラー時 (Error Codes)
6. **認証・権限**: 必要な権限スコープ

---

## 提案事項

現状の構成 (`server_standards.md` 等) を踏まえ、以下のステップで進めることを提案します。

1. **パス命名規則の統一**: 本ガイドラインの「1. URI / パス設計」を採用し、既存API (`/api/hello` 等) が適合しているか確認。
2. **OpenAPIの導入検討**: 将来的には `@hono/zod-openapi` を導入し、仕様記述をコード化する。
3. **ドキュメントの整備**: 設計段階ではMarkdownで簡易的に仕様を詰め、実装後はコード定義を正とする。
