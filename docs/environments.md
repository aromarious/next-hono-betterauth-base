# 環境定義と実行ガイド

本プロジェクトでは、開発ライフサイクルを支えるために以下の5つの環境を定義しています。

## 環境一覧

| 環境名 | 英語表記 | 概要 | DBの場所 | ツール/実行コマンド |
| :--- | :--- | :--- | :--- | :--- |
| **1. ローカル開発環境** | Local Development | 開発者が日常的にコーディングを行う環境。ホットリロードが有効。 | **ローカル** (Docker) | `pnpm dev` |
| **2. ローカル統合テスト環境** | Local Integration Test | APIやDBの連携を確認するテスト環境。 | **ローカル** (Docker) | `pnpm test:int` (Vitest) |
| **3. ローカルE2Eテスト環境** | Local E2E Test | ブラウザ操作をシミュレートし、ユーザー体験全体を検証する環境。 | **ローカル** (Docker) | `pnpm test:e2e` (Playwright) |
| **4. CI統合テスト環境** | CI Integration Test | GitHub Actions等のCI上で実行されるテスト環境。 | **ローカル** (CI Runner Service) | `pnpm test:ci` |
| **5. 本番環境** | Production | 実際にユーザーが利用する環境。 | **インターネット** (Managed Service) | (Vercel / Cloud Run 等) |

---

## 1. ローカル開発環境 (Local Development)

日常の開発作業を行う環境です。

- **構成**:
  - Frontend (Next.js): ローカルプロセス (Hot Reload)
  - Backend (Hono): ローカルプロセス (Hot Reload)
  - Database (Postgres): Docker Container
- **起動方法**:

  ```bash
  # 1. DB起動
  pnpm db:up
  
  # 2. アプリ起動
  pnpm dev
  ```

## 2. ローカル統合テスト環境 (Local Integration Test)

主にバックエンド（API）のロジックとデータベースの連携を検証します。

- **ツール**: Vitest
- **特徴**:
  - テスト実行時に専用のテスト用DBスキーマ（またはDBコンテナ）を利用することを推奨します。
  - 高速に実行され、開発中の頻繁なフィードバックに使用します。
- **実行方法**:

  ```bash
  # APIパッケージのテスト実行
  pnpm test:int
  ```

  > [!NOTE]
  > **ローカルE2E環境**と同じデータベースリソースを共有することを推奨します。これによりリソース消費を抑えられますが、テスト実行時にデータがリセットされる点に注意してください。

## 3. ローカルE2Eテスト環境 (Local E2E Test)

実際のブラウザ（Headless）を使用して、フロントエンドからバックエンドまで通しで検証します。

- **ツール**: Playwright
- **特徴**:
  - 本番に近い状態でアプリケーションをビルド・起動してからテストを実行します。
  - ログインフローや重要なユーザーストーリーの検証に使用します。
- **実行方法**:

  ```bash
  # WebアプリケーションのE2Eテスト
  pnpm test:e2e
  ```

## 4. CI統合テスト環境 (CI Integration Test)

コードがリポジトリにプッシュされた際に自動的に実行される環境です。

- **プラットフォーム**: GitHub Actions
- **構成**:
  - GitHub Actions Runner上で Node.js と Docker Service (Postgres) を立ち上げてテストを実行します。
  - 環境変数は **Infisical** を使用して注入します。（Infisicalへのアクセスに必要なトークンのみ、GitHub Secretsに設定します）
- **実行コマンド**:

  ```bash
  pnpm test:ci
  ```

## 5. 本番環境 (Production)

最終的なデプロイ先です。

- **構成**:
  - ビルドプロセス (`pnpm build`) を経て、最適化されたアーティファクトがデプロイされます。
  - 環境変数はプラットフォームのシークレットマネージャーとInfisicalによって管理されます。

---

## Infisical環境とのマッピング

Infisical上ではシンプルに3つの環境（Development / Staging / Production）を使用して、本プロジェクトの5つの環境をカバーします。

| 環境名 | Infisical環境 | 用途 |
| :--- | :--- | :--- |
| **1. ローカル開発環境** | **Development** | 開発者のローカルマシン用。 |
| **2. ローカル統合テスト環境** | **Staging** | テスト実行用。CIと共有。 |
| **3. ローカルE2Eテスト環境** | **Staging** | テスト実行用。CIと共有。 |
| **4. CI統合テスト環境** | **Staging** | テスト実行用。ローカルテストと共有。 |
| **5. 本番環境** | **Production** | 本番デプロイ用。 |
