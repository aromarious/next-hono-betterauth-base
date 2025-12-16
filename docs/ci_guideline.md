# CI/CD ガイドライン

本ドキュメントは、プロジェクトのCI/CD環境について説明します。

## CI/CD パイプライン構成

### ワークフロー

#### 1. PR時の自動テスト (`.github/workflows/test.yml`)

プルリクエスト作成時に自動実行されます。

| ジョブ | 実行内容 | 並列実行 |
| :--- | :--- | :---: |
| **Lint & Format** | Biomeによるコードフォーマットとリントチェック | ✅ |
| **TypeScript Check** | TypeScriptの型チェック | ✅ |
| **Build** | Next.jsアプリケーションのビルド | ✅ |
| **DB Migration** | `packages/db` でのマイグレーション実行 | - |
| **Unit & Integration Tests** | 単体テストと統合テスト（カバレッジ付き） | - |

#### 2. Main Push時の完全テスト (`.github/workflows/full-test.yml`)

`main`ブランチへのプッシュ時に自動実行されます。PR時のテストに加えて、E2Eテストも実行されます。

| ジョブ | 実行内容 | 並列実行 |
| :--- | :--- | :---: |
| **Lint & Format** | Biomeによるコードフォーマットとリントチェック | ✅ |
| **TypeScript Check** | TypeScriptの型チェック | ✅ |
| **Build** | Next.jsアプリケーションのビルド | ✅ |
| **DB Migration** | `packages/db` でのマイグレーション実行 | - |
| **Unit & Integration Tests** | 単体テストと統合テスト（カバレッジ付き） | - |
| **E2E Tests** | Playwrightによるエンドツーエンドテスト | - |

### カバレッジレポート

テスト実行時にコードカバレッジが自動的に収集され、GitHub Artifactsにアップロードされます。

- **Unit Test Coverage**: 単体テストのカバレッジ
- **Integration Test Coverage**: 統合テストのカバレッジ

カバレッジレポートは各CIジョブの **Artifacts** セクションからダウンロードできます。

## ローカルでのCI検証

CIで実行されるすべてのチェックは、ローカルでも実行可能です。

### 1. Lint & Format

```bash
# フォーマットとリントのチェック
pnpm biome check .

# 自動修正を適用
pnpm biome check --apply .
```

### 2. TypeScript型チェック

```bash
# プロジェクト全体の型チェック
pnpm typecheck
```

### 3. ビルド

```bash
# アプリケーションのビルド
pnpm build
```

### 4. テスト

```bash
# 単体テスト
pnpm test:unit

# 単体テスト（カバレッジ付き）
pnpm test:unit --coverage

# 統合テスト（Infisical stagingからenv取得）
pnpm test:int

# 統合テスト（カバレッジ付き）
# NOTE: ルートからの直接実行スクリプトはないため、apps/webに移動するか、自分でコマンドを組み立てる必要があります
cd apps/web
pnpm test:int:coverage
cd ../..

# E2Eテスト
pnpm test:e2e
```

### 5. すべてのCIチェックを実行

CIと同じ順序でローカル検証を行う場合：

```bash
# 1. Lint & Format
pnpm biome check .

# 2. TypeScript Check
pnpm typecheck

# 3. Build
pnpm build

# 4. Unit Tests
pnpm test:unit

# 5. Integration Tests
# ルートのスクリプトで自動的にInfisical経由で実行されます
pnpm test:int

# 6. E2E Tests (mainブランチのみ)
pnpm test:e2e
```

## 環境変数管理

### CI環境の環境変数

CI環境では、以下の環境変数が使用されます：

| 変数名 | 取得方法 | 用途 |
| :--- | :--- | :--- |
| `DATABASE_URL` | Infisical (`staging`環境) | PostgreSQL接続文字列 |
| `UPSTASH_REDIS_REST_URL` | Infisical (`staging`環境) | Upstash Redis REST API URL |
| `UPSTASH_REDIS_REST_TOKEN` | Infisical (`staging`環境) | Upstash Redis REST APIトークン |
| `INFISICAL_TOKEN` | GitHub Secrets | Infisical Service Token |

### GitHub Secretsの設定

CIで必要なシークレットは以下の1つのみです：

1. **INFISICAL_SECRET**: Infisical Service Token
   - 作成方法は [`README.md`](../README.md) の「GitHub Secretsの設定」を参照

すべての環境変数は**Infisicalから動的に取得**されるため、GitHub Secretsに個別に登録する必要はありません。

## 依存関係の管理

### Dependabot

Dependabotが以下の依存関係を自動的にチェックし、更新PRを作成します：

- **npm パッケージ**: 週次（開発依存と本番依存を分けてグループ化）
- **GitHub Actions**: 月次
- **Docker イメージ**: 月次

設定ファイル: [`.github/dependabot.yml`](../.github/dependabot.yml)

## トラブルシューティング

### CI上でテストが失敗する

#### 1. Lint/Formatエラー

**原因**: ローカルで `biome check` を実行していなかった

**解決方法**:

```bash
pnpm biome check --apply .
git add .
git commit --amend --no-edit
git push -f
```

**予防策**: Huskyが設定されているため、コミット時に自動的に修正されます

#### 2. TypeScriptエラー

**原因**: 型エラーが存在する

**解決方法**:

```bash
# エラーを確認
pnpm typecheck

# 問題を修正後
git add .
git commit -m "fix: resolve type errors"
git push
```

#### 3. テスト失敗

**原因**: テストコードまたはアプリケーションコードに問題がある

**解決方法**:

```bash
# ローカルでテストを実行して問題を特定
pnpm test:unit
pnpm test:int
pnpm test:e2e

# 問題を修正後、再度テストを実行して確認
```

#### 4. ビルド失敗

**原因**: ビルドプロセスでエラーが発生

**解決方法**:

```bash
# ローカルでビルドを実行
pnpm build

# エラーメッセージを確認して修正
```

### Infisical関連のエラー

#### `INFISICAL_TOKEN` が無効

**原因**: GitHub Secretsに設定された `INFISICAL_SECRET` が期限切れまたは無効

**解決方法**:

1. Infisicalダッシュボードで新しいService Tokenを作成
2. GitHub Settings → Secrets and variables → Actions → `INFISICAL_SECRET` を更新

#### 環境変数が取得できない

**原因**: Infisicalの`staging`環境に必要な環境変数が設定されていない

**解決方法**:

1. Infisicalダッシュボードで`staging`環境を確認
2. 不足している環境変数を追加

必要な環境変数：

- `DATABASE_URL`
- `UPSTASH_REDIS_REST_URL` (レートリミットテスト時のみ)
- `UPSTASH_REDIS_REST_TOKEN` (レートリミットテスト時のみ)

## パフォーマンス最適化

### キャッシュ戦略

GitHub Actionsでは以下のキャッシュが使用されています：

- **pnpm dependencies**: `actions/setup-node` の `cache: 'pnpm'` オプションで自動キャッシュ
- **Playwright browsers**: 必要時に自動インストール

### 並列実行

以下のジョブは並列実行されます：

- Lint & Format
- TypeScript Check
- Build

これにより、CI実行時間を短縮しています。

## カバレッジ閾値（将来的な検討事項）

現在、カバレッジ閾値は設定していませんが、将来的に以下のような閾値を設定することを検討できます：

```json
{
  "coverage": {
    "branches": 80,
    "functions": 80,
    "lines": 80,
    "statements": 80
  }
}
```

カバレッジが閾値を下回った場合、CIを失敗させることができます。
