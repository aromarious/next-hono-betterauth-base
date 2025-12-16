# Quickstart Guide

プロジェクトへの参加ありがとうございます！
このプロジェクトでは **pnpm** と **Infisical** を使用したローカル開発フローを採用しています。

## 1. 前提条件 (Prerequisites)

以下のツールがインストールされている必要があります。

* **Node.js**: v20以上推奨 (Corepack enabled)
* **pnpm**: パッケージマネージャー
* **Docker Desktop** (または OrbStack 等): PostgreSQL 実行用
* **Infisical CLI**: 環境変数管理

### ツールのインストール (macOS)

```bash
# Docker Desktop
brew install --cask docker

# Infisical CLI
brew install infisical/get-cli/infisical

# pnpm (Node.js に同梱されている Corepack を有効化する場合)
corepack enable pnpm
```

> [!IMPORTANT]
> **Docker Desktop の初期設定**:
> インストール後、必ず **Docker Desktop アプリを一度起動** してください。起動時に管理者権限が求められ、CLIツール（`docker`, `docker-compose` コマンド等）のセットアップが行われます。これをスキップすると `docker` コマンドが見つからないエラーになります。

## 2. 環境構築手順 (Setup)

### Step 1: Clone & Install

管理者から共有されたリポジトリURLを使用してクローンし、依存パッケージをインストールします。

> [!NOTE]
> リポジトリURLは管理者から共有されます。`docs/admin_setup.md` の手順に従って作成されたプロジェクト固有のリポジトリです。

```bash
# 管理者から共有されたURLを使用
git clone <管理者から共有されたリポジトリURL>
cd <リポジトリ名>
pnpm install
```

### Step 2: Infisical Login (Secrets)

環境変数を取得するために、Infisical にログインします。

```bash
infisical login
```

ブラウザが立ち上がるので、認証を完了させてください。
その後、ターミナルでプロジェクトを選択するプロンプトが表示された場合、**管理者から共有されたプロジェクト名**を選択してください。

> [!TIP]
> Infisicalのプロジェクト名は管理者から共有されます。不明な場合は管理者に確認してください。

### Step 3: Database Setup

プロジェクトには Docker Compose 設定が含まれており、以下のコマンドで PostgreSQL コンテナを起動できます。

1. **DBの起動**:

```bash
# packages/config/docker-compose.yml を使用してDBをバックグラウンド起動
pnpm db:up
```

2. **接続情報の確認**: Infisical 上の `develop` 環境（または `local`）の `DATABASE_URL` が、起動したDB (`localhost:5432`) を指しているか確認してください。

3. **スキーマの適用**:

```bash
# Infisical経由で環境変数を読み込み、DBにプッシュ
pnpm db:push
```

> **Note**: DBを停止する場合は `pnpm db:down`、ログを確認する場合は `pnpm db:logs` が使用できます。

## 3. 開発サーバー起動 (Development)

以下のコマンドで、Frontend (Next.js) と Backend (Hono) が一括で起動します。
このコマンドは内部で `infisical run` を実行し、必要な環境変数を注入します。

```bash
pnpm dev
```

* **Frontend**: http://localhost:3000
* **API Endpoint**: http://localhost:3000/api/* (Frontend経由でアクセス)
* **API Scalar Reference**: http://localhost:3000/api/reference (API仕様書)

これで開発を始める準備は完了です！🚀

## 4. トラブルシューティング

### 環境変数が読み込まれない場合

`infisical login` が完了しているか、正しいプロジェクト・環境 (`dev` or `local`) が選択されているか確認してください。
`pnpm dev` 実行時に `Infisical` のロゴが表示され、変数が注入されているログが出るはずです。

### DBエラー (Connection Refused)

`DATABASE_URL` で指定されているホスト (`localhost` 等) に PostgreSQL が起動しているか確認してください。
Docker コンテナの場合、ポートフォワーディング (`-p 5432:5432`) が正しく設定されているか確認してください。
