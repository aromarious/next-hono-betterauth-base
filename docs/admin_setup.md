# Admin Setup Guide

開発メンバーをチームに迎え入れる前に、管理者が実施しておくべき事前準備のチェックリストです。
これを完了させることで、メンバーは `docs/quickstart.md` の手順通りにスムーズに開発を開始できます。

## 1. テンプレートから新規リポジトリを作成

このリポジトリはテンプレートとして設計されています。新しいプロジェクトを開始する際は、以下の手順で新規リポジトリを作成してください。

### 1-1. GitHubでテンプレートを使用

1. **このリポジトリのGitHubページにアクセス**
   - テンプレートリポジトリ: `aromarious/next-hono-betterauth-base`

2. **"Use this template" ボタンをクリック**
   - ページ右上の緑色の "Use this template" ボタンをクリック
   - "Create a new repository" を選択

3. **新しいリポジトリの設定**
   - **Owner**: 組織またはユーザーアカウントを選択
   - **Repository name**: 新しいプロジェクト名を入力（例: `my-awesome-project`）
   - **Description**: プロジェクトの説明を入力（任意）
   - **Visibility**: `Private` または `Public` を選択（通常は `Private` を推奨）
   - "Include all branches" のチェックは外したまま（mainブランチのみコピー）

4. **"Create repository" をクリック**
   - 新しいリポジトリが作成されます

### 1-2. 作成したリポジトリのURLを記録

新しく作成されたリポジトリのURLをメモしてください。このURLは開発者に共有します。

```text
https://github.com/<owner>/<新しいリポジトリ名>
```

> [!IMPORTANT]
> このURLは後ほど開発者に伝える必要があります。`docs/quickstart.md` の手順で使用します。

## 2. Infisical (シークレット管理) のセットアップ

開発者が `infisical login` 後に正しい環境変数を取得できるように設定します。

### 2-1. プロジェクト作成

Infisical Cloud (または自社ホスト版) にて、新しいプロジェクトを作成します。

### 2-2. 環境変数の定義 (Development environment)

`Development` 環境に、以下の変数を登録してください。
これらは Dev Container 内のローカルDB等に接続するためのデフォルト設定です。

| Key | Value | 備考 |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/webapp` | Docker Compose (Local) への接続文字列 |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000/api` | フロントエンドからのAPI接続先 |
| `NODE_ENV` | `development` | |

> **注意**: パスワードやDB名は `packages/config/docker-compose.yml` の設定と一致させる必要があります。上記は本プロジェクトのデフォルト設定値です。

### 2-3. メンバーの招待

プロジェクトの "Members" または "Access Control" 設定から、開発者のメールアドレスを招待し、`Development` 環境へのRead権限を付与してください。

## 3. リポジトリ権限の設定

### 3-1. GitHub (またはGitLab) への招待

開発者にリポジトリへのアクセス権（Write権限以上推奨）を付与してください。

### 3-2. Branch Protection Rule (推奨)

品質を担保するため、`main` ブランチへの直接プッシュを禁止し、Pull Request を必須に設定することを推奨します。

- **Require pull request reviews before merging**: On
- **Require status checks to pass before merging**: On (CI構築後)

## 4. 完了確認

ここまで準備ができたら、開発者に以下の情報を共有してください：

1. **リポジトリURL**: 手順1で作成した新しいリポジトリのURL
2. **Infisicalプロジェクト名**: 手順2で作成したプロジェクト名
3. **セットアップ手順**: `docs/quickstart.md` を参照するよう伝える
