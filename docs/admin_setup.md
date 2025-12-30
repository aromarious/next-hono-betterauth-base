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
   - `develop`ブランチを作成しておく

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

### 2-1. プロジェクト作成とログイン

- Infisical Cloud (または自社ホスト版) にて、新しいプロジェクトを作成します。
- Infisical CLIをインストールします。

  ```bash
  brew install infisical/get-cli/infisical
  ```

- `infisical login` を実行します。
- `infisical init` を実行して、ローカル環境とプロジェクトを紐付けます。
- `.infisical.json` が作成されます。

### 2-2. 環境変数の定義 (Development environment)

`Development` 環境に、以下の変数を登録してください。
これらは Dev Container 内のローカルDB等に接続するためのデフォルト設定です。

| Key                        | Value                                                  | 備考                                  |
| :------------------------- | :----------------------------------------------------- | :------------------------------------ |
| `BETTER_AUTH_SECRET`       | `B3ptCRf/pAALtqs+zRmfR7btyglhdwvmjBHH+N37UzM=`         | Better Authのシークレット             |
| `BETTER_AUTH_URL`          | `http://localhost:3000`                                | Better AuthのベースURL                |
| `DATABASE_URL`             | `postgresql://postgres:postgres@localhost:5432/webapp` | Docker Compose (Local) への接続文字列 |
| `NEXT_PUBLIC_API_URL`      | `http://localhost:3000/api`                            | フロントエンドからのAPI接続先         |
| `NODE_ENV`                 | `development`                                          | 実行環境                              |
| `GOOGLE_CLIENT_ID`         | `<取得したClient ID>`                                  | Google OAuth クライアントID           |
| `GOOGLE_CLIENT_SECRET`     | `<取得したClient Secret>`                              | Google OAuth クライアントシークレット |
| `GOOGLE_TEST_USER`         | `<テスト用メールアドレス>`                             | E2Eテスト用ユーザー                   |
| `GOOGLE_TEST_PASSWORD`     | `<テスト用パスワード>`                                 | E2Eテスト用パスワード                 |
| `RATE_LIMIT_MAX_REQUESTS`  | `100`                                                  | レートリミット最大リクエスト数        |
| `RATE_LIMIT_WINDOW`        | `1 m`                                                  | レートリミット期間                    |
| `UPSTASH_REDIS_REST_URL`   | `<UpstashのURL>`                                       | Upstash Redis REST URL                |
| `UPSTASH_REDIS_REST_TOKEN` | `<UpstashのToken>`                                     | Upstash Redis REST Token              |

> **注意**: パスワードやDB名は `packages/config/docker-compose.yml` の設定と一致させる必要があります。上記は参考値です。

### 2-3. CI用サービス・トークンの発行 (GitHub Actions用)

GitHub Actions 等の CI/CD 環境から Infisical にアクセスするために、サービス・トークンを発行し、GitHub に登録します。

1. **Infisical プロジェクトの "Access Control" に移動**
   - サイドバーの "Access Control" を選択
   - "Service Tokens" タブをクリック

2. **新しいトークンの作成**
   - "Create token" をクリック
   - **Name**: `GitHub Actions` など
   - **Environment**: `Staging`, `Production`
   - **Permissions**: `Read` 権限を付与

3. **GitHub Actions にトークンを登録**
   - リポジトリのSetitngsからSecrets and variables内のActionsを選択
   - New repository secretを選択
   - Name: INFISICAL_TOKEN, Value: 作成したトークン を入力、Add Secret をクリック

### 2-4. InfisicalからVercelへの同期

Vercel のデプロイ環境へシークレットを自動同期する設定を行います。

vercelでの作業

1. vercelに当該プロジェクトをインポートする
2. vercelのaccount settingsのtokensでtokenを作成する。

infisicalでの作業

1. **Infisical プロジェクトの "Integrations" タブを選択**
2. **"Secret Syncs" を選択し、"+ Add sync" をクリック**
3. **"Vercel" を検索して選択**
4. **同期設定を入力**
   - **Environment**: `production`
   - **Secret Path**: `/`
5. Vercel Connection の Add connectionで最初に作成したtokenを設定して作成する
6. Vercel App に当該プロジェクトを指定する
7. Vercep App Environment に `Production` を指定する
8. Initial Sync Behaviorを `Import Destination Secrets - Prioritize Infisical Values` に設定する
9. Auto-Sync Enabledをオンにする
10. SecretSyncのnameを設定する
11. **"Create sync" をクリックして完了**

### 2-5. プロジェクトIDの更新

リポジトリ内の設定ファイルに記述されている Infisical のプロジェクトIDを、新しく作成したプロジェクトのものに更新します。

1. **置換スクリプトを実行**
   - `.infisical.json` に記録されている新しい Project ID を使用して、プロジェクト内の古い ID を一括置換します。
   - 以下のコマンドを実行してください:

   ```bash
   python3 scripts/replace_infisical_id.py
   ```

   > [!TIP]
   > スクリプトは `.infisical.json` から自動的に新しい Project ID を読み込み、置換対象のファイルを一覧表示します。デフォルトで全てのファイルが選択されていますが、番号を入力することで個別に除外することもできます。`ENTER` キーを押すと置換が実行されます。

### 2-6. メンバーの招待

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
