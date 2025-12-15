# Webservice Next Hono Base

モダンなWebサービス開発のためのボイラープレート（Next.js + Hono + Drizzle ORM）

## 技術スタック

- **Frontend**: Next.js 14+ (App Router)
- **Backend**: Hono (Next.js API Routes上で動作)
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Package Manager**: pnpm
- **Monorepo**: Turborepo

詳細な技術仕様は [`docs/technical_spec.md`](docs/technical_spec.md) を参照してください。

## 開発環境のセットアップ

### 前提条件

- Node.js 20+
- pnpm
- Docker & Docker Compose

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd webservice-next-hono-base
```

### 2. 依存関係のインストール

```bash
pnpm install
```

### 3. 環境変数の設定 (Infisical)

このプロジェクトは環境変数の管理に **Infisical** を使用します。
Infisical CLI がインストールされていない場合は、以下の手順でインストールしてください。

#### Infisical CLI のインストール (macOS)

```bash
brew install infisical/get-infisical/infisical
```

(その他のOSは [公式ドキュメント](https://infisical.com/docs/cli/overview) を参照)

#### プロジェクトへのログイン

```bash
infisical login
infisical init
```

※ プロジェクトIDの設定などが必要な場合があります。

Infisical のセットアップ方法については [Infisical CLI ドキュメント](https://infisical.com/docs/cli/overview) を参照してください。

### 4. データベースの起動

PostgreSQLをDockerで起動します：

```bash
pnpm db:up
```

**その他のDBコマンド**:

```bash
# データベースの停止
pnpm db:down

# データベースの再起動
pnpm db:restart

# データベースのログを表示
pnpm db:logs
```

データを完全に削除する場合：

```bash
docker compose -f packages/config/docker-compose.yml down -v
```

### 5. アプリケーションの起動

```bash
pnpm dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) にアクセスしてください。

## プロジェクト構成

```text
.
├── .devcontainer/        # Dev Container 設定（現在は非推奨）
├── .husky/               # Git Hooks 設定
├── apps/
│   ├── web/              # Next.js (Port 3000)
│   └── api/              # Hono API
├── packages/
│   ├── config/           # 共通設定
│   ├── ui/               # 共通UI
│   └── db/               # DB設定
└── docs/                 # ドキュメント
```

## 開発ガイドライン

### コミット規約

このプロジェクトは [Conventional Commits](https://www.conventionalcommits.org/) を採用しています。

### コードフォーマット

Biome を使用しています。コミット時に自動的にフォーマットとLintが実行されます。

手動で実行する場合：

```bash
pnpm biome check --apply
```

## CI/CD

このプロジェクトはGitHub Actionsを使用してCIを実行します。

### GitHub Secretsの設定

CIでInfisical CLIを使用するため、以下のシークレットをGitHubリポジトリに設定する必要があります：

1. GitHubリポジトリの **Settings** > **Secrets and variables** > **Actions** に移動
2. **New repository secret** をクリックして以下を追加：
   - Name: `INFISICAL_SECRET`
   - Value: 上記で作成したService Token（`st.`で始まる長い文字列全体をコピー）

**Infisical Service Tokenの作成方法**:

1. [Infisicalダッシュボード](https://app.infisical.com/)にログイン
2. プロジェクト「webservice-next-hono-base」を選択
3. 上部の **Settings** タブをクリック
4. **Project Settings** を選択
5. **Access Control** タブをクリック
6. **Service Tokens** セクションで **Create service token** をクリック
7. 設定：
   - **Service Token Name**: `GitHub Actions CI`
   - **Environment**: `staging`
   - **Secrets Path**: `/` (デフォルトのまま)
   - **Expiration**: 無期限（Never expire）または十分に長い期間
   - **Permissions**: `Read` ✅
8. **Create** ボタンをクリック
9. 表示される `st.`で始まる長い文字列（Service Token）を**必ずコピーして保存**（この画面は一度しか表示されません）

### ワークフロー

- **`.github/workflows/test.yml`**: プルリクエスト時に実行
  - Lint、ビルド、単体テスト、統合テストを実行
- **`.github/workflows/full-test.yml`**: mainブランチへのpush時に実行
  - 上記に加えてE2Eテストも実行

### テストの実行

## ドキュメント

- [技術仕様書](docs/technical_spec.md): 技術選定、アーキテクチャの詳細

## ライセンス

MIT
