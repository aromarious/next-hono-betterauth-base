# Admin Setup Guide

開発メンバーをチームに迎え入れる前に、管理者が実施しておくべき事前準備のチェックリストです。
これを完了させることで、メンバーは `docs/quickstart.md` の手順通りにスムーズに開発を開始できます。

## 1. Infisical (シークレット管理) のセットアップ

開発者が `infisical login` 後に正しい環境変数を取得できるように設定します。

### 1-1. プロジェクト作成

Infisical Cloud (または自社ホスト版) にて、新しいプロジェクトを作成します。

### 1-2. 環境変数の定義 (Development environment)

`Development` 環境に、以下の変数を登録してください。
これらは Dev Container 内のローカルDB等に接続するためのデフォルト設定です。

| Key | Value | 備考 |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/webapp` | Docker Compose (Local) への接続文字列 |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000/api` | フロントエンドからのAPI接続先 |
| `NODE_ENV` | `development` | |

> **注意**: パスワードやDB名は `packages/config/docker-compose.yml` の設定と一致させる必要があります。上記は本プロジェクトのデフォルト設定値です。

### 1-3. メンバーの招待

プロジェクトの "Members" または "Access Control" 設定から、開発者のメールアドレスを招待し、`Development` 環境へのRead権限を付与してください。

## 2. リポジトリ権限の設定

### 2-1. GitHub (またはGitLab) への招待

開発者にリポジトリへのアクセス権（Write権限以上推奨）を付与してください。

### 2-2. Branch Protection Rule (推奨)

品質を担保するため、`main` ブランチへの直接プッシュを禁止し、Pull Request を必須に設定することを推奨します。

* **Require pull request reviews before merging**: On
* **Require status checks to pass before merging**: On (CI構築後)

## 3. 完了確認

ここまで準備ができたら、開発者に `docs/quickstart.md` を共有し、環境構築を依頼してください。
