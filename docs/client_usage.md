# API クライアント利用ガイド

本プロジェクトでは、Next.js (Frontend) から Hono (Backend) への型安全な API リクエストを行うためのクライアントライブラリを提供しています。

## 概要

`apps/web/lib/client.ts` からエクスポートされている `createClient` 関数を使用することで、API クライアントを生成できます。このクライアントは Hono の RPC 機能を利用しており、バックエンドの型定義をそのまま利用して型安全なリクエストが可能です。

## 基本的な使い方

`createClient` 関数を実行すると、用途に応じた2つのクライアントオブジェクトが返されます。

```typescript
import { createClient } from "@/lib/client"

const { publicClient, protectedClient } = createClient()
```

### publicClient

認証が不要な公開エンドポイント（`/api/v0/public/...`）へアクセスするためのクライアントです。

```typescript
// GET /api/v0/public/hello
const res = await publicClient.hello.$get()
const data = await res.json()
```

### protectedClient

認証が必要な保護されたエンドポイント（`/api/v0/protected/...`）へアクセスするためのクライアントです。このオブジェクトは以下の2つの機能を併せ持っています。

1. **API リクエスト機能**: Hono RPC クライアントとしての機能
2. **認証機能 (`.auth`)**: Better Auth クライアントとしての機能

```typescript
// API リクエスト: POST /api/v0/protected/posts
await protectedClient.posts.$post({
  json: { title: "New Post", content: "..." }
})

// セッション情報の取得
const session = protectedClient.auth.useSession()

// 認証操作: サインアウト
await protectedClient.auth.signOut()
```

## サーバーサイドでの使用 (Server Components)

Server Components や Middleware など、サーバーサイドでクライアントを使用する場合、リクエストヘッダー（Cookieなど）を引き継ぐ必要があります。`createClient` に `headers` オプションを渡すことで、認証情報を保持したクライアントを作成できます。

```typescript
import { headers } from "next/headers"
import { createClient } from "@/lib/client"

export default async function Page() {
  // サーバーのヘッダー情報をクライアントに注入
  const { protectedClient } = createClient({
    headers: await headers()
  })

  // 認証済みの状態でAPIを呼び出し可能
  const res = await protectedClient.posts.$get()
  // ...
}
```

## auth 機能について

`protectedClient.auth` プロパティは [Better Auth](https://better-auth.com/) のクライアントインスタンスそのものです。以下のようなメソッドが利用可能です。

- `signIn`: サインイン処理
- `signOut`: サインアウト処理
- `useSession`: セッション情報の取得フック (React Component内でのみ有効)
- `getSession`: セッション情報の取得 (非同期関数)

## APIバージョンについて

`createClient` はデフォルトで常に **最新バージョン (Latest Version)** の API をターゲットにします。

```typescript
// 内部的には /api/v0 (LATEST) を指すクライアントが生成される
const { publicClient } = createClient()
```

本プロジェクトでは Frontend (Next.js) と Backend (Hono) が同一リポジトリで管理され、常に同期してデプロイされる構成（モノレポ/モノリス）をとっています。そのため、フロントエンドは常に最新のバックエンド実装と整合性が取れている前提となり、明示的なバージョン指定は不要としています。

> [!CAUTION]
> **スマホアプリや外部連携システムの場合**
>
> サーバーと同期してデプロイされないクライアント（モバイルアプリや外部システム）からAPIを利用する場合は、**必ずバージョンを明示的に指定してください**。バージョンを指定しないと、サーバー側の更新によってクライアントが突然壊れるリスクがあります。
>
> ```typescript
> const { publicClient } = createClient({
>   version: "v0" // 明示的にバージョンを固定する
> })
> ```
