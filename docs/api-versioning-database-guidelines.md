# APIバージョニングにおけるデータベース変更ガイドライン

## 概要

複数バージョンのAPIを同時にサポートする場合、データベーススキーマは**全バージョンで共有される**ため、後方互換性を保ちながら進化させる必要があります。このドキュメントでは、安全にデータベースを変更するための制約とベストプラクティスを定義します。

## 基本原則

> [!IMPORTANT]
> データベーススキーマの変更は、**既存のAPIバージョン（v1, v2など）を破壊してはいけません**。新しいバージョン（v3など）のために変更を加える際も、旧バージョンが正常に動作し続けることを保証する必要があります。

### 共有される理由

- **物理的な制約**: 単一のデータベースインスタンスを全APIバージョンで共有
- **データ整合性**: 全バージョンが同じデータにアクセスし、一貫性を保つ必要がある
- **運用の簡素化**: バージョンごとに別々のデータベースを管理する複雑さを避ける

---

## 許可される変更

### ✅ カラムの追加（Nullable または Default値付き）

新しいカラムを追加する場合は、必ず以下のいずれかを満たす必要があります：

#### パターン1: Nullable カラム

```typescript
// ✅ 良い例：v2で新機能のためにavatarUrlを追加
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email').notNull(),
  name: varchar('name').notNull(),
  // v2で追加：v1はこのカラムを使わない（nullのまま）
  avatarUrl: varchar('avatar_url'),  // nullable
})
```

**理由**: 既存レコードはnullが入るため、v1の動作に影響しません。

#### パターン2: Default値付きカラム

```typescript
// ✅ 良い例：v2で新しいフラグを追加
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email').notNull(),
  name: varchar('name').notNull(),
  // v2で追加：デフォルトfalseなのでv1は影響を受けない
  emailVerified: boolean('email_verified').default(false),
})
```

**理由**: 既存レコードにはデフォルト値が設定されるため、v1のクエリが壊れません。

### ✅ インデックスの追加

```sql
-- ✅ 良い例：パフォーマンス改善のためインデックス追加
CREATE INDEX idx_users_email ON users(email);
```

**理由**: インデックスはクエリのパフォーマンスを改善するだけで、データ構造や動作には影響しません。

### ✅ 新しいテーブルの追加

```typescript
// ✅ 良い例：v2で新機能のために新テーブルを追加
export const userProfiles = pgTable('user_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  bio: text('bio'),
  website: varchar('website'),
})
```

**理由**: 新しいテーブルは既存のAPIバージョンに影響を与えません。v1は新テーブルを使わないだけです。

### ✅ Enumへの値の追加（末尾のみ）

```typescript
// ✅ 良い例：enumに新しい値を追加
export const userRoleEnum = pgEnum('user_role', [
  'user',
  'admin',
  'moderator',  // v2で追加
])
```

**理由**: 既存の値はそのまま残り、v1は新しい値を使わないため影響ありません。

> [!CAUTION]
> Enumの値を削除したり、順序を変更することは避けてください。

---

## 禁止される変更

### ❌ カラムの削除

```typescript
// ❌ 悪い例：v1で使っているnameカラムを削除
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email').notNull(),
  // name: varchar('name').notNull(),  // ← 削除するとv1が壊れる！
})
```

**理由**: v1がこのカラムを参照している場合、エラーが発生します。

**代替案**:

1. カラムを非推奨（deprecated）としてマーク
2. 新しいカラムを追加し、両方を一時的にサポート
3. 全バージョンが新カラムに移行した後、旧カラムを削除

### ❌ カラム名の変更

```typescript
// ❌ 悪い例：nameをfull_nameに変更
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email').notNull(),
  fullName: varchar('full_name').notNull(),  // nameから変更
})
```

**理由**: v1は依然として `name` カラムを参照するため、エラーになります。

**代替案**:

1. 新しいカラム `full_name` を追加
2. 既存の `name` カラムは残す
3. アプリケーション層で両方を同期
4. 全バージョンが `full_name` に移行した後、`name` を削除

### ❌ NOT NULL制約の追加

```typescript
// ❌ 悪い例：既存のnullableカラムにNOT NULL制約を追加
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email').notNull(),
  avatarUrl: varchar('avatar_url').notNull(),  // 以前はnullableだった
})
```

**理由**: 既存レコードにnullが存在する場合、マイグレーションが失敗します。

**代替案**:

1. デフォルト値を設定して既存レコードを更新
2. アプリケーション層で検証を強化
3. 全レコードが値を持つことを確認してから制約を追加

### ❌ データ型の変更（非互換）

```typescript
// ❌ 悪い例：VARCHARをINTEGERに変更
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  zipCode: integer('zip_code'),  // 以前はvarchar
})
```

**理由**: 既存データの型変換が失敗する可能性があり、v1のクエリが壊れます。

**代替案**:

1. 新しいカラムを追加
2. 既存データを変換して新カラムに移行
3. 旧カラムを非推奨に

### ❌ Enumからの値の削除

```typescript
// ❌ 悪い例：enumから値を削除
export const userRoleEnum = pgEnum('user_role', [
  'user',
  // 'admin',  // ← 削除するとadminユーザーのレコードが壊れる
])
```

**理由**: 既存レコードがその値を使っている場合、データ整合性エラーが発生します。

---

## 制約付きで許可される変更

### ⚠️ カラムのデータ型拡張（互換性のある場合のみ）

```typescript
// ⚠️ 注意が必要：VARCHAR(50) → VARCHAR(100)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),  // 以前は50
})
```

**条件**:

- データが失われない拡張のみ（短縮は禁止）
- v1のバリデーションが新しい長さに対応している

### ⚠️ 外部キー制約の追加

```typescript
// ⚠️ 注意が必要：既存カラムに外部キー制約を追加
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),  // 新しく追加
})
```

**条件**:

- 既存データが制約を満たしている（孤立したレコードがない）
- マイグレーション前にデータクリーンアップを実施

---

## 安全な移行パターン

### パターン1: Expand-Contract（拡張-収縮）

複数のフェーズに分けて安全に移行します。

#### フェーズ1: 拡張（Expand）

```typescript
// 新しいカラムを追加（旧カラムは残す）
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),      // 旧カラム
  fullName: varchar('full_name'),       // 新カラム（nullable）
})
```

#### フェーズ2: 移行（Migrate）

```typescript
// アプリケーション層で両方のカラムを同期
// v1: nameを使用
// v2: fullNameを使用、nameにも書き込み
```

#### フェーズ3: 収縮（Contract）

```typescript
// 全バージョンがfullNameに移行した後、nameを削除
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  fullName: varchar('full_name').notNull(),
})
```

### パターン2: Feature Flag による段階的ロールアウト

```typescript
// 環境変数でカラムの使用を制御
const useNewColumn = process.env.USE_FULL_NAME === 'true'

const columnName = useNewColumn ? 'full_name' : 'name'
```

---

## マイグレーションのチェックリスト

新しいマイグレーションを作成する際は、以下を確認してください：

- [ ] カラム追加はnullableまたはdefault値付きか？
- [ ] カラム削除はしていないか？
- [ ] カラム名変更はしていないか？
- [ ] NOT NULL制約を既存カラムに追加していないか？
- [ ] データ型変更は互換性のある拡張のみか？
- [ ] 既存のAPIバージョン（v1, v2など）でテストしたか？
- [ ] ロールバックプランを用意したか？

---

## テスト戦略

### 全バージョンでの統合テスト

```bash
# v1のテストを実行
pnpm test:api:v1

# v2のテストを実行
pnpm test:api:v2

# 全バージョンのテストを実行
pnpm test:api:all
```

### マイグレーション前後の検証

```sql
-- マイグレーション前のスナップショット
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM posts;

-- マイグレーション実行

-- マイグレーション後の検証
SELECT COUNT(*) FROM users;  -- 件数が一致するか確認
SELECT COUNT(*) FROM posts;
```

---

## まとめ

| 変更内容 | 可否 | 条件 |
|---------|------|------|
| カラム追加（nullable/default付き） | ✅ 可 | - |
| カラム削除 | ❌ 不可 | 全バージョンで未使用になった後のみ |
| カラム名変更 | ❌ 不可 | Expand-Contractパターンで移行 |
| NOT NULL制約追加 | ❌ 不可 | 既存データが全て値を持つ場合のみ |
| データ型拡張 | ⚠️ 条件付き | 互換性のある拡張のみ |
| データ型変更 | ❌ 不可 | 新カラム追加で移行 |
| インデックス追加 | ✅ 可 | - |
| 新テーブル追加 | ✅ 可 | - |
| Enum値追加 | ✅ 可 | 末尾に追加 |
| Enum値削除 | ❌ 不可 | - |

> [!WARNING]
> データベース変更を本番環境に適用する前に、必ず**ステージング環境で全APIバージョンのテスト**を実施してください。
