---
trigger: glob
globs: apps/web/e2e/**/*.spec.ts
---

# E2Eテストファイル作成ルール

`apps/web/e2e/`配下でテストファイルを作成・編集する際は、以下のガイドラインに従ってください。

## ディレクトリ構造

```text
apps/web/e2e/
├── smoke.spec.ts           # スモークテスト（重要な基本機能）
├── api/                    # API E2Eテスト
│   ├── health.spec.ts
│   └── posts.spec.ts
└── pages/                  # ページUI E2Eテスト（将来実装）
    └── posts.spec.ts
```

## テストカテゴリ

- **smoke**: 最重要な基本機能（homepage, health check）
- **api**: APIエンドポイントのE2Eテスト（`request`フィクスチャ使用）
- **pages**: ページUIのE2Eテスト（`page`フィクスチャ使用）

## APIテストとページテストの併用

- `api/posts.spec.ts`: Posts APIのE2Eテスト（HTTP request/response検証）
- `pages/posts.spec.ts`（将来）: PostsページのUI E2Eテスト（ブラウザ操作）

両方を共存させ、APIとUIの両面からテストします。APIテストを削除しないでください。

## ページテストのパターン

### 基本表示テスト

```typescript
test("displays posts list", async ({ page }) => {
  await page.goto("/posts")
  await expect(page.locator("h1")).toContainText("Posts")
})
```

### ユーザー操作テスト

```typescript
test("creates a new post", async ({ page }) => {
  await page.goto("/posts/new")
  await page.fill('[name="title"]', "Test")
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/posts\//)
})
```

### データ検証テスト（API併用）

```typescript
test("displays post detail", async ({ page, request }) => {
  // テストデータ作成（API経由）
  const res = await request.post("/api/v0/posts", {
    data: { title: "Test", content: "Content" }
  })
  const post = await res.json()
  
  // ページで表示確認
  await page.goto(`/posts/${post.id}`)
  await expect(page.locator("h1")).toContainText("Test")
})
```

## セレクタの優先順位

1. **data-testid属性**（最も安定）: `page.locator('[data-testid="post-item"]')`
2. **role属性**: `page.getByRole('button', { name: 'Submit' })`
3. **テキスト**: `page.getByText('Posts')`
4. **CSSクラス**（非推奨、変更されやすい）

## data-testid属性の推奨

テスト対象コンポーネントに`data-testid`を追加してください：

```tsx
<article data-testid="post-item">
  <h2 data-testid="post-title">{post.title}</h2>
</article>
```

## テストの実行

```bash
# 開発サーバー（ポート3000）起動中でもOK
pnpm test:e2e

# 特定のテストのみ
pnpm test:e2e pages/posts.spec.ts
```

## 注意事項

- テストは独立して実行できるようにする（他のテストに依存しない）
- テストデータはテスト内で作成・削除する
- `page.waitForTimeout()`を避け、`expect().toBeVisible()`などで自動待機
- レートリミットは基本的に無効化（`DISABLE_RATE_LIMIT=true`）
