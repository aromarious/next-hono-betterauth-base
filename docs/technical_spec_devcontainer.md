# Dev Container 仕様

> [!WARNING]
> **現在、Dev Container 環境での開発は推奨されていません。** ローカル環境での開発を推奨します。

## 非推奨の理由

Google Antigravity (AI コーディングアシスタント) のブラウザ検証機能（Chromium を使用した自動テスト・検証）が Dev Container 環境では動作しないため。

## Dev Container の構成

将来的な対応のために `.devcontainer/` ディレクトリの設定を保持しています。

### 設定ファイル

* **設定ファイル**: `.devcontainer/devcontainer.json`
* **Docker Compose**: `.devcontainer/docker-compose.yml`
* **Dockerfile**: `.devcontainer/Dockerfile`

### 主な設定内容

* **ベースイメージ**: Node.js 20 (Debian Bullseye/Bookworm)
* **ポート転送**:
  * `3000`: Next.js 開発サーバー
  * `5432`: PostgreSQL
* **マウント**: ホストの `~/.gemini` を `/home/node/.gemini` にバインド（Antigravity 用）
* **postCreateCommand**: `pnpm install` を自動実行
* **自動インストールされる VS Code 拡張機能**: Biome, Tailwind CSS IntelliSense, Docker, SQLTools など

### システムツール (Dockerfile)

* **OS Level**: `git`, `curl`, `wget`, `procps`, `ca-certificates`
* **Runtime**: Node.js v20 (Bullseye/Bookworm)
* **Package Manager**: **pnpm** (via Corepack enabled in Dockerfile)
* **Secrets**: **Infisical CLI** (apt install)
* **DB Client**: `postgresql-client` (apt install)

## 制約・既知の問題

1. **Antigravity のブラウザ検証が使用不可**: Dev Container 内では Chromium ブラウザのインスタンスを起動できないため、`browser_subagent` ツールなどのブラウザ操作機能が利用できません。
2. **対処方法**: ローカル環境（macOS など）で直接開発することで、Antigravity のすべての機能を利用可能です。

## 将来的な対応

Antigravity が Dev Container 環境でのブラウザ検証に対応した場合、または代替手段が提供された場合は、Dev Container での開発を再検討します。それまでは `.devcontainer/` ディレクトリを保持し、設定を維持します。
