# 技術要件・現状差異分析レポート

## 1. 概要

`docs/technical_spec.md` の記述と、現在のプロジェクトの状態（ファイル構成、設定、実装状況）を比較・分析しました。
全体として、プロジェクトは技術仕様書に準拠して進行しており、一部の項目（テスト環境構築など）においては仕様書の記述よりも進捗しています。

## 2. 構造と構成の整合性

### ディレクトリ構成

- **整合**: `apps/web` にフロントエンドとバックエンド（Hono）が集約されています。
- **整合**: `apps/api` は存在せず、仕様通り `apps/web/server` にロジックが統合されています。
- **整合**: 以下のパッケージが `packages` ディレクトリに適切に配置されています。
  - `packages/config`: 共通設定 (Biome, Commitlint, TSConfig, Docker Compose)
  - `packages/ui`: UI コンポーネント
  - `packages/db`: データベース関連

### 詳細ディレクトリ分析: `apps/web`

`apps/web` 内の主要ディレクトリは、仕様書およびアーキテクチャ設計と一致した役割分担がなされています。

- **`apps/web/app`**: Next.js App Router のルート。
  - `api/`: Hono アプリケーションをマウントするための API Route が配置されています（`[[...route]]`）。
  - `page.tsx`: フロントエンドのエントリーポイント。
- **`apps/web/server`**: バックエンドロジック (Hono) が集約されています。
  - `index.ts`: Hono アプリケーションの定義とルート定義。
- **`apps/web/lib`**: アプリケーション内で共有されるユーティリティ。
  - `client.ts`: Frontend から Backend (Hono) を型安全に呼び出すための RPC Client (`hc`) の設定。
- **`apps/web/e2e`**: E2E テスト (Playwright) 関連ファイル。
  - `example.spec.ts`: サンプルテストコード。

### 環境設定・ツール

- **整合**: **Clean Root Rule** が概ね守られています（`package.json`, `turbo.json` 等の必須ファイルのみ）。
- **整合**: **Biome** の設定ファイルは `packages/config/biome.json` にあり、ルートから参照されています。
- **整合**: **Commitlint** は `packages/config` にあり、Husky と連携しています。
- **整合**: **Infisical** がインストールされており (`v0.43.39`)、スクリプト内で `infisical run` として使用されています。
- **整合**: **Dev Container** ディレクトリ (`.devcontainer`) は存在しますが、仕様書通り「現在は非推奨」の状態（Docker Composeでの開発が推奨）と整合しています。

## 3. 実装状況の差異 (Gap Analysis)

仕様書の「実装状況 (2025/12/09現在)」セクションとの比較結果です。

| 項目 | Doc記述 | 現状 (2025/12/10) | 評価 |
| :--- | :--- | :--- | :--- |
| **Development** | 導入完了 | **完了** (Infisical, Docker Compose, Biome利用可) | ✅ 一致 |
| **CI / Testing** | 未導入 | **進行中 / 一部完了** <br> - `package.json` に `test:int`, `test:e2e` スクリプトが存在。<br> - Infisical CLI をテスト実行時に使用する設定済み。<br> - Playwright がインストール済み。 | 📈 **進捗あり** (ドキュメント未更新) |
| **Production** | 未導入 | 未導入 (確認範囲内) | ✅ 一致 |

## 4. 検出された軽微な差異・確認事項

1. **テストスクリプトの充実**:
   - 仕様書では「CI / Testing: 未導入」となっていましたが、実際には `turbo` を用いたテスト実行構成や、Infisical との連携スクリプトが実装されています。
   - **推奨アクション**: `docs/technical_spec.md` の実装状況セクションを更新し、テスト環境の構築が進んでいることを反映させることを推奨します。

2. **Apps 内の API ディレクトリ**:
   - `apps/web/app/api/[[...route]]` が存在し、Hono アプリケーションのマウント用として機能していることが確認できました。これは仕様書の「Architecture」セクションと完全に一致しています。

## 5. 結論

プロジェクトは技術仕様書（`docs/technical_spec.md`）の設計思想に忠実に実装されています。
特に「Clean Root」や「Packages/Config への設定集約」、「Apps/Web へのバックエンド統合」といった主要なアーキテクチャルールは遵守されています。

唯一の「差異」は、開発進捗による仕様書の陳腐化（テスト環境の実装が進んでいる点）のみであり、これはポジティブな要素です。
