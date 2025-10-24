# CI/CDパイプライン設計ガイドライン

WebService-Next-Hono-Base を基盤とするWebサービス開発において、GitHub Actions + Turbo を活用した高効率なCI/CDパイプラインの設計・運用ガイドラインを提供します。

---

## 🎯 ガイドラインの目的

このガイドラインは：
- **高速・信頼性の高いCI/CDパイプラインの構築方法を定義**
- **Turbo + pnpm を活用したモノレポ最適化戦略の提供**
- **Infisical統合によるセキュアな環境変数管理の実現**
- GitHub Actions + Next.js + Hono + PostgreSQL 構成での最適なデプロイメント設計

---

## 📋 CI/CDパイプラインの全体像

### パイプライン戦略
```mermaid
graph LR
    A[Code Push] --> B[CI Pipeline]
    B --> C{Branch?}
    C -->|feature/*| D[Feature Tests]
    C -->|develop| E[Integration Tests]
    C -->|main| F[Full Pipeline]
    
    D --> G[Code Review]
    E --> H[Staging Deploy]
    F --> I[Production Deploy]
    
    style D fill:#e1f5fe
    style E fill:#fff3e0
    style F fill:#e8f5e8
```

### 環境・ブランチ戦略

| 環境名 | ブランチ/タグ | デプロイタイミング | 目的 | URL例 |
|-------|-------------|-------------------|------|-------|
| **Development** | `feature/*` | プルリクエスト時 | 開発・単体テスト | `https://pr-123.dev.yourdomain.com` |
| **Staging** | `develop` | マージ時自動 | 統合テスト・受入テスト | `https://staging.yourdomain.com` |
| **Production** | `main` + `v*.*.*`タグ | タグ作成時・手動承認 | 本番リリース | `https://yourdomain.com` |

#### ブランチ戦略詳細

**GitFlow Modified戦略**を採用：

1. **Feature開発**
   ```bash
   # 機能開発
   git checkout -b feature/user-authentication develop
   # PR作成 → Development環境（プレビュー）にデプロイ
   ```

2. **Staging統合**
   ```bash
   # developブランチへマージ
   git checkout develop
   git merge feature/user-authentication
   # 自動的にStaging環境へデプロイ
   ```

3. **Production リリース**
   ```bash
   # mainブランチへマージ
   git checkout main
   git merge develop
   # セマンティックバージョニングタグ作成
   git tag v1.2.3
   git push origin v1.2.3
   # 手動承認後Production環境へデプロイ
   ```

#### 環境変数・Infisical設定

各環境に対応する Infisical プロジェクトを作成：

```bash
# Infisical での環境設定
infisical init
infisical environments create development
infisical environments create staging  
infisical environments create production

# 環境変数設定例
infisical secrets set DATABASE_URL "postgresql://..." --env=development
infisical secrets set BETTER_AUTH_URL "https://staging.yourdomain.com" --env=staging
infisical secrets set API_CORS_ORIGIN "https://yourdomain.com" --env=production
```

---

## 📁 プロジェクトファイル構成

### CI/CD関連ディレクトリ構造
```
repo/
  .github/
    workflows/
      ci.yml                 # 継続的インテグレーション
      cd-staging.yml         # ステージング自動デプロイ
      cd-production.yml      # 本番デプロイ（承認付き）
      reusable-test.yml      # 再利用可能テストワークフロー
      reusable-build.yml     # 再利用可能ビルドワークフロー
    actions/
      setup-pnpm/           # カスタムアクション：pnpmセットアップ
      setup-infisical/      # カスタムアクション：Infisical CLI
      cache-dependencies/   # カスタムアクション：依存関係キャッシュ
  ops/
    docker/
      Dockerfile.api        # API用Dockerファイル
      Dockerfile.web        # Web用Dockerファイル
      docker-compose.yml    # 開発環境用
      docker-compose.prod.yml # 本番環境用
  dev/
    ci/
      turbo.json            # Turbo設定（CI最適化）
      scripts/
        build-check.sh      # ビルド検証スクリプト
        test-e2e.sh         # E2Eテスト実行スクリプト
        deploy-check.sh     # デプロイ前チェック
```

---

## ⚡ Turbo最適化戦略

### Turbo設定（CI特化）

```json
// turbo.json（CI最適化版）
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [
        "dist/**",
        ".next/**",
        "!.next/cache/**"
      ],
      "env": [
        "NODE_ENV",
        "NEXT_PUBLIC_API_URL",
        "NEXT_PUBLIC_APP_URL"
      ],
      "persistent": false
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": [
        "coverage/**"
      ],
      "env": [
        "NODE_ENV",
        "DATABASE_URL",
        "TEST_DATABASE_URL"
      ],
      "persistent": false,
      "cache": false
    },
    "test:unit": {
      "outputs": [
        "coverage/**"
      ],
      "env": ["NODE_ENV"],
      "persistent": false
    },
    "test:integration": {
      "dependsOn": ["^build"],
      "outputs": [
        "coverage/**"
      ],
      "env": [
        "NODE_ENV",
        "TEST_DATABASE_URL"
      ],
      "persistent": false,
      "cache": false
    },
    "test:e2e": {
      "dependsOn": ["build"],
      "outputs": [
        "playwright-report/**",
        "test-results/**"
      ],
      "env": [
        "NODE_ENV",
        "E2E_BASE_URL",
        "DATABASE_URL"
      ],
      "persistent": false,
      "cache": false
    },
    "lint": {
      "outputs": [],
      "persistent": false
    },
    "type-check": {
      "dependsOn": ["^build"],
      "outputs": [],
      "persistent": false
    },
    "dev": {
      "persistent": true,
      "cache": false
    }
  },
  "remoteCache": {
    "enabled": true
  },
  "ui": "tui"
}
```

### キャッシュ戦略

```yaml
# .github/workflows/ci.yml（抜粋）
- name: Setup Turbo Cache
  uses: actions/cache@v4
  with:
    path: |
      .turbo
      node_modules/.cache
      ~/.cache/ms-playwright
    key: ${{ runner.os }}-turbo-${{ hashFiles('**/pnpm-lock.yaml') }}-${{ hashFiles('**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx') }}
    restore-keys: |
      ${{ runner.os }}-turbo-${{ hashFiles('**/pnpm-lock.yaml') }}-
      ${{ runner.os }}-turbo-

- name: Build with Turbo
  run: |
    # Turbo Remote Cache設定（GitHub Actions）
    export TURBO_TOKEN=${{ secrets.TURBO_TOKEN }}
    export TURBO_TEAM=${{ secrets.TURBO_TEAM }}
    pnpm turbo build --cache-dir=.turbo
```

---

## 🔄 継続的インテグレーション（CI）

### メインCIワークフロー

```yaml
# .github/workflows/ci.yml
name: Continuous Integration

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # 変更ファイル検出
  changes:
    runs-on: ubuntu-latest
    outputs:
      packages: ${{ steps.changes.outputs.packages }}
      apps: ${{ steps.changes.outputs.apps }}
      docs: ${{ steps.changes.outputs.docs }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v2
        id: changes
        with:
          filters: |
            packages:
              - 'packages/**'
            apps:
              - 'apps/**'
            docs:
              - '**/*.md'
              - 'docs/**'

  # 基本チェック（常に実行）
  basic-checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Environment
        uses: ./.github/actions/setup-pnpm
        
      - name: Install Dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Lint
        run: pnpm turbo lint
        
      - name: Type Check
        run: pnpm turbo type-check

  # 単体テスト
  unit-tests:
    needs: [changes, basic-checks]
    if: needs.changes.outputs.packages == 'true' || needs.changes.outputs.apps == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-pnpm
      
      - name: Install Dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Run Unit Tests
        run: pnpm turbo test:unit --cache-dir=.turbo
        
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          directory: ./coverage
          flags: unit-tests

  # 統合テスト
  integration-tests:
    needs: [changes, basic-checks]
    if: needs.changes.outputs.packages == 'true' || needs.changes.outputs.apps == 'true'
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: webservice_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-pnpm
      - uses: ./.github/actions/setup-infisical
      
      - name: Install Dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Database Migration
        run: infisical run --env=test -- pnpm db:migrate
        
      - name: Run Integration Tests
        run: infisical run --env=test -- pnpm turbo test:integration

  # ビルドテスト
  build-test:
    needs: [changes, basic-checks]
    if: needs.changes.outputs.packages == 'true' || needs.changes.outputs.apps == 'true'
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app: [web, api]
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-pnpm
      - uses: ./.github/actions/setup-infisical
      
      - name: Install Dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Build Application
        run: infisical run --env=test -- pnpm turbo build --filter=@app/${{ matrix.app }}
        
      - name: Build Docker Image
        run: |
          docker build -f ops/docker/Dockerfile.${{ matrix.app }} \
            -t webservice-${{ matrix.app }}:${{ github.sha }} .

  # E2Eテスト（PRのみ）
  e2e-tests:
    needs: [changes, basic-checks]
    if: github.event_name == 'pull_request' && (needs.changes.outputs.packages == 'true' || needs.changes.outputs.apps == 'true')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-pnpm
      - uses: ./.github/actions/setup-infisical
      
      - name: Install Dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Install Playwright
        run: pnpm playwright install --with-deps
        
      - name: Run E2E Tests
        run: infisical run --env=test -- pnpm turbo test:e2e
        
      - name: Upload Playwright Report
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report-${{ github.run_id }}
          path: apps/web/playwright-report/
          retention-days: 7

  # 結果統合
  ci-success:
    needs: [basic-checks, unit-tests, integration-tests, build-test]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - name: Check CI Results
        run: |
          if [[ "${{ needs.basic-checks.result }}" != "success" ]]; then
            echo "❌ Basic checks failed"
            exit 1
          fi
          if [[ "${{ needs.unit-tests.result }}" == "failure" ]]; then
            echo "❌ Unit tests failed"
            exit 1
          fi
          if [[ "${{ needs.integration-tests.result }}" == "failure" ]]; then
            echo "❌ Integration tests failed"
            exit 1
          fi
          if [[ "${{ needs.build-test.result }}" == "failure" ]]; then
            echo "❌ Build tests failed"
            exit 1
          fi
          echo "✅ All CI checks passed"
```

---

## 🚀 継続的デプロイメント（CD）

### ステージングデプロイ

```yaml
# .github/workflows/cd-staging.yml
name: Deploy to Staging

on:
  push:
    branches: [develop]
  workflow_dispatch:

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-pnpm
      - uses: ./.github/actions/setup-infisical
      
      - name: Install Dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Build Applications
        run: infisical run --env=staging -- pnpm turbo build
        
      - name: Database Migration
        run: infisical run --env=staging -- pnpm db:migrate
        
      - name: Deploy to Staging
        run: |
          # Vercel/Netlify/Cloudflare等へのデプロイ
          infisical run --env=staging -- pnpm deploy:staging
        
      - name: Run Smoke Tests
        run: |
          sleep 30  # デプロイ完了待ち
          infisical run --env=staging -- pnpm test:smoke
        
      - name: Notify Deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        if: always()
```

### 本番デプロイ（承認フロー付き）

```yaml
# .github/workflows/cd-production.yml
name: Deploy to Production

on:
  push:
    tags:
      - 'v*.*.*'
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to deploy'
        required: true
        type: string

jobs:
  # デプロイ前検証
  pre-deploy-checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-pnpm
      - uses: ./.github/actions/setup-infisical
      
      - name: Install Dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Run Full Test Suite
        run: infisical run --env=test -- pnpm turbo test:ci
        
      - name: Security Audit
        run: |
          pnpm audit --audit-level moderate
          pnpm turbo security:scan
        
      - name: Build Applications
        run: infisical run --env=production -- pnpm turbo build
        
      - name: Pre-deploy Checklist
        run: |
          echo "✅ All tests passed"
          echo "✅ Security audit completed"
          echo "✅ Applications built successfully"
          echo "🚀 Ready for production deployment"

  # 本番デプロイ（手動承認必須）
  deploy-production:
    needs: pre-deploy-checks
    runs-on: ubuntu-latest
    environment: 
      name: production
      url: https://api.yourdomain.com
    
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-pnpm
      - uses: ./.github/actions/setup-infisical
      
      - name: Install Dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Build Applications
        run: infisical run --env=production -- pnpm turbo build
        
      - name: Database Migration (Production)
        run: |
          echo "🔍 Checking migration safety..."
          infisical run --env=production -- pnpm db:migrate:check
          echo "📊 Running production migration..."
          infisical run --env=production -- pnpm db:migrate
        
      - name: Deploy to Production
        run: |
          infisical run --env=production -- pnpm deploy:production
        
      - name: Health Check
        run: |
          sleep 60  # デプロイ完了・ヘルスチェック待ち
          curl -f https://api.yourdomain.com/v1/health || exit 1
          curl -f https://yourdomain.com || exit 1
        
      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          tag_name: ${{ github.ref_name }}
          name: Release ${{ github.ref_name }}
          body: |
            ## Changes in this Release
            - Deployed to production: ${{ github.sha }}
            - Deploy time: ${{ steps.deploy.outputs.deploy_time }}
            
            ## Deployment Details
            - API Health: ✅ https://api.yourdomain.com/v1/health
            - Web Health: ✅ https://yourdomain.com
          draft: false
          prerelease: false
        
      - name: Notify Success
        uses: 8398a7/action-slack@v3
        with:
          status: success
          channel: '#production'
          text: |
            🚀 Production deployment successful!
            Version: ${{ github.ref_name }}
            Commit: ${{ github.sha }}
            Deploy time: ${{ steps.deploy.outputs.deploy_time }}
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}

  # デプロイ後監視
  post-deploy-monitoring:
    needs: deploy-production
    runs-on: ubuntu-latest
    steps:
      - name: Post-deploy Monitoring
        run: |
          echo "📊 Starting 10-minute post-deploy monitoring..."
          sleep 600
          
          # API ヘルスチェック
          for i in {1..5}; do
            curl -f https://api.yourdomain.com/v1/health && echo "✅ API healthy ($i/5)"
            sleep 60
          done
          
          echo "✅ Post-deploy monitoring completed successfully"
```

---

## 🔐 セキュアな環境変数管理

### Infisical統合設定

```yaml
# .github/actions/setup-infisical/action.yml
name: 'Setup Infisical CLI'
description: 'Install and configure Infisical CLI for secure environment variable management'

inputs:
  version:
    description: 'Infisical CLI version'
    default: 'latest'

runs:
  using: 'composite'
  steps:
    - name: Install Infisical CLI
      shell: bash
      run: |
        curl -1sLf 'https://dl.cloudsmith.io/public/infisical/infisical-cli/setup.deb.sh' | sudo -E bash
        sudo apt-get update && sudo apt-get install -y infisical
    
    - name: Authenticate Infisical
      shell: bash
      run: |
        infisical login --method=universal-auth \
          --client-id=${{ inputs.client-id }} \
          --client-secret=${{ inputs.client-secret }}
      env:
        INFISICAL_CLIENT_ID: ${{ inputs.client-id }}
        INFISICAL_CLIENT_SECRET: ${{ inputs.client-secret }}
```

### 環境別設定管理

```bash
# dev/ci/scripts/env-setup.sh
#!/bin/bash

ENV=$1
if [ -z "$ENV" ]; then
  echo "Usage: $0 <environment>"
  exit 1
fi

echo "🔧 Setting up environment: $ENV"

case $ENV in
  "test")
    export INFISICAL_PROJECT_ID="your-test-project-id"
    export DATABASE_URL="postgresql://test:test@localhost:5432/webservice_test"
    export NODE_ENV="test"
    ;;
  "staging")
    export INFISICAL_PROJECT_ID="your-staging-project-id"
    export NODE_ENV="staging"
    ;;
  "production")
    export INFISICAL_PROJECT_ID="your-production-project-id"
    export NODE_ENV="production"
    ;;
  *)
    echo "❌ Unknown environment: $ENV"
    exit 1
    ;;
esac

echo "✅ Environment $ENV configured"
```

---

## 📊 デプロイメント戦略・ロールバック

### Blue-Green デプロイメント

```yaml
# .github/workflows/blue-green-deploy.yml
name: Blue-Green Deployment

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options:
          - staging
          - production

jobs:
  blue-green-deploy:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-pnpm
      - uses: ./.github/actions/setup-infisical
      
      - name: Determine Current/Next Slots
        id: slots
        run: |
          # 現在アクティブなスロット確認
          CURRENT=$(curl -s https://api.${{ inputs.environment }}.yourdomain.com/v1/health | jq -r '.slot // "blue"')
          NEXT=$([ "$CURRENT" = "blue" ] && echo "green" || echo "blue")
          
          echo "current=$CURRENT" >> $GITHUB_OUTPUT
          echo "next=$NEXT" >> $GITHUB_OUTPUT
          echo "🔄 Current: $CURRENT, Next: $NEXT"
      
      - name: Deploy to Next Slot
        run: |
          echo "🚀 Deploying to ${{ steps.slots.outputs.next }} slot..."
          infisical run --env=${{ inputs.environment }} -- \
            pnpm deploy:${{ inputs.environment }} --slot=${{ steps.slots.outputs.next }}
      
      - name: Health Check Next Slot
        run: |
          echo "🏥 Health checking ${{ steps.slots.outputs.next }} slot..."
          for i in {1..10}; do
            if curl -f https://api-${{ steps.slots.outputs.next }}.${{ inputs.environment }}.yourdomain.com/v1/health; then
              echo "✅ Health check passed ($i/10)"
              break
            fi
            if [ $i -eq 10 ]; then
              echo "❌ Health check failed after 10 attempts"
              exit 1
            fi
            sleep 30
          done
      
      - name: Switch Traffic
        run: |
          echo "🔀 Switching traffic to ${{ steps.slots.outputs.next }} slot..."
          # ロードバランサー設定変更（AWS ALB/CloudFlare等）
          infisical run --env=${{ inputs.environment }} -- \
            ./dev/ci/scripts/switch-traffic.sh ${{ steps.slots.outputs.next }}
      
      - name: Verify Switch
        run: |
          sleep 60
          ACTIVE=$(curl -s https://api.${{ inputs.environment }}.yourdomain.com/v1/health | jq -r '.slot')
          if [ "$ACTIVE" != "${{ steps.slots.outputs.next }}" ]; then
            echo "❌ Traffic switch failed"
            exit 1
          fi
          echo "✅ Traffic successfully switched to ${{ steps.slots.outputs.next }}"
```

### 緊急ロールバック

```yaml
# .github/workflows/emergency-rollback.yml
name: Emergency Rollback

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options:
          - staging
          - production
      reason:
        description: 'Rollback reason'
        required: true
        type: string

jobs:
  emergency-rollback:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-infisical
      
      - name: Identify Previous Version
        id: previous
        run: |
          # 前のバージョン/スロット確認
          CURRENT=$(curl -s https://api.${{ inputs.environment }}.yourdomain.com/v1/health | jq -r '.slot // "blue"')
          PREVIOUS=$([ "$CURRENT" = "blue" ] && echo "green" || echo "blue")
          
          echo "current=$CURRENT" >> $GITHUB_OUTPUT
          echo "previous=$PREVIOUS" >> $GITHUB_OUTPUT
          echo "🔄 Rolling back from $CURRENT to $PREVIOUS"
      
      - name: Execute Rollback
        run: |
          echo "🚨 EMERGENCY ROLLBACK INITIATED"
          echo "Reason: ${{ inputs.reason }}"
          echo "Environment: ${{ inputs.environment }}"
          echo "Rolling back to: ${{ steps.previous.outputs.previous }}"
          
          # トラフィック即座に切り替え
          infisical run --env=${{ inputs.environment }} -- \
            ./dev/ci/scripts/switch-traffic.sh ${{ steps.previous.outputs.previous }}
      
      - name: Verify Rollback
        run: |
          sleep 30
          ACTIVE=$(curl -s https://api.${{ inputs.environment }}.yourdomain.com/v1/health | jq -r '.slot')
          if [ "$ACTIVE" != "${{ steps.previous.outputs.previous }}" ]; then
            echo "❌ Rollback verification failed"
            exit 1
          fi
          echo "✅ Rollback completed successfully"
      
      - name: Notify Rollback
        uses: 8398a7/action-slack@v3
        with:
          status: custom
          custom_payload: |
            {
              "text": "🚨 EMERGENCY ROLLBACK COMPLETED",
              "attachments": [
                {
                  "color": "warning",
                  "fields": [
                    {
                      "title": "Environment",
                      "value": "${{ inputs.environment }}",
                      "short": true
                    },
                    {
                      "title": "Reason",
                      "value": "${{ inputs.reason }}",
                      "short": true
                    },
                    {
                      "title": "Rolled back to",
                      "value": "${{ steps.previous.outputs.previous }} slot",
                      "short": true
                    },
                    {
                      "title": "Initiated by",
                      "value": "${{ github.actor }}",
                      "short": true
                    }
                  ]
                }
              ]
            }
          webhook_url: ${{ secrets.SLACK_WEBHOOK_URGENT }}
```

---

## 🐳 Docker最適化・コンテナ戦略

### API用Dockerfile（最適化版）

```dockerfile
# ops/docker/Dockerfile.api
# マルチステージビルド
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 依存関係インストール（キャッシュ最適化）
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY packages/*/package.json ./packages/*/
RUN corepack enable pnpm && pnpm install --frozen-lockfile --prod=false

# ビルド
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Turboを使用して高速ビルド
RUN corepack enable pnpm
RUN pnpm turbo build --filter=@app/api

# 本番実行
FROM node:20-alpine AS runner
RUN apk add --no-cache dumb-init curl
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8787

# セキュリティ：非rootユーザー作成
RUN addgroup --system --gid 1001 hono
RUN adduser --system --uid 1001 hono

# 必要ファイルのみコピー
COPY --from=builder --chown=hono:hono /app/apps/api/dist ./
COPY --from=builder --chown=hono:hono /app/node_modules ./node_modules

USER hono

EXPOSE 8787

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8787/v1/health || exit 1

# Graceful shutdown対応
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "index.js"]
```

### Web用Dockerfile（Next.js最適化）

```dockerfile
# ops/docker/Dockerfile.web
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY packages/*/package.json ./packages/*/
RUN corepack enable pnpm && pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js テレメトリー無効化
ENV NEXT_TELEMETRY_DISABLED 1

RUN corepack enable pnpm
RUN pnpm turbo build --filter=@app/web

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT=3000

RUN addgroup --system --gid 1001 nextjs
RUN adduser --system --uid 1001 nextjs

# Next.js最適化：standalone出力
COPY --from=builder /app/apps/web/next.config.js ./
COPY --from=builder --chown=nextjs:nextjs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/apps/web/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nextjs /app/apps/web/public ./public

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
```

---

## 📊 パフォーマンス監視・メトリクス

### CI/CDパフォーマンス測定

```yaml
# .github/workflows/performance-monitoring.yml
name: CI/CD Performance Monitoring

on:
  push:
    branches: [main, develop]
  schedule:
    - cron: '0 6 * * 1'  # 毎週月曜日朝6時

jobs:
  performance-metrics:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-pnpm
      
      - name: Measure Build Performance
        run: |
          echo "📊 Measuring build performance..."
          
          # ビルド時間測定
          start_time=$(date +%s)
          pnpm turbo build --dry-run=json > build-analysis.json
          pnpm turbo build
          end_time=$(date +%s)
          
          build_duration=$((end_time - start_time))
          echo "⏱️ Total build time: ${build_duration}s"
          
          # Bundle サイズ分析
          pnpm turbo analyze
          
          # メトリクス送信（DataDog/New Relic等）
          curl -X POST "https://api.datadoghq.com/api/v1/series" \
            -H "Content-Type: application/json" \
            -H "DD-API-KEY: ${{ secrets.DATADOG_API_KEY }}" \
            -d '{
              "series": [
                {
                  "metric": "ci.build.duration",
                  "points": [['$(date +%s)', '$build_duration']],
                  "tags": ["repo:webservice-base", "branch:${{ github.ref_name }}"]
                }
              ]
            }'
      
      - name: Test Performance Analysis
        run: |
          echo "🧪 Analyzing test performance..."
          
          # テスト実行時間分析
          pnpm turbo test:unit --dry-run=json > test-analysis.json
          
          # 遅いテスト特定
          cat test-analysis.json | jq -r '.tasks[] | select(.duration > 10000) | .taskId + ": " + (.duration/1000|tostring) + "s"'
```

### デプロイメント成功率追跡

```bash
# dev/ci/scripts/deployment-metrics.sh
#!/bin/bash

ENVIRONMENT=$1
STATUS=$2  # success/failure
DURATION=$3

# メトリクス送信
curl -X POST "https://api.datadoghq.com/api/v1/series" \
  -H "Content-Type: application/json" \
  -H "DD-API-KEY: $DATADOG_API_KEY" \
  -d "{
    \"series\": [
      {
        \"metric\": \"deployment.count\",
        \"points\": [[$(date +%s), 1]],
        \"tags\": [\"env:$ENVIRONMENT\", \"status:$STATUS\"]
      },
      {
        \"metric\": \"deployment.duration\",
        \"points\": [[$(date +%s), $DURATION]],
        \"tags\": [\"env:$ENVIRONMENT\"]
      }
    ]
  }"

# 成功率計算・アラート
if [ "$STATUS" = "failure" ]; then
  echo "🚨 Deployment failed - triggering alert"
  # PagerDuty/Slack通知
fi
```

---

## ✅ CI/CDパイプライン設計チェックリスト

### CI（継続的インテグレーション）
- [ ] 高速なフィードバック（5分以内でbasicチェック完了）
- [ ] 並列実行によるビルド時間最適化
- [ ] Turbo Remote Cacheによるキャッシュ最適化
- [ ] 変更ファイル検出による効率的テスト実行
- [ ] マトリックス戦略によるマルチ環境テスト

### CD（継続的デプロイメント）
- [ ] 環境別デプロイメント戦略（ステージング自動、本番承認付き）
- [ ] Blue-Green/Rolling Update対応
- [ ] データベースマイグレーション自動化
- [ ] ヘルスチェック・スモークテスト自動実行
- [ ] 緊急ロールバック機能

### セキュリティ・運用
- [ ] Infisical統合による環境変数セキュア管理
- [ ] コンテナイメージ脆弱性スキャン
- [ ] デプロイメント承認フロー・監査ログ
- [ ] 障害時通知・エスカレーション設定
- [ ] パフォーマンス監視・メトリクス収集

### 開発体験
- [ ] プルリクエスト時の自動プレビュー環境
- [ ] 明確なエラーメッセージ・デバッグ情報
- [ ] ワークフロー実行時間・成功率の可視化
- [ ] 開発者向けローカル再現スクリプト

---

## 🛠️ トラブルシューティング・デバッグ

### よくある問題と解決策

```bash
# dev/ci/scripts/troubleshooting.sh

echo "🔍 CI/CD Troubleshooting Guide"

# 1. Turbo キャッシュ問題
echo "## Turbo Cache Issues"
echo "Clear cache: rm -rf .turbo && pnpm turbo build --no-cache"

# 2. 依存関係問題
echo "## Dependency Issues"
echo "Reset lock file: rm pnpm-lock.yaml && pnpm install"

# 3. Docker ビルド問題
echo "## Docker Build Issues"
echo "Clear build cache: docker builder prune -f"
echo "Multi-platform build: docker buildx build --platform linux/amd64,linux/arm64"

# 4. 環境変数問題
echo "## Environment Variable Issues"
echo "Check Infisical: infisical secrets"
echo "Validate env: infisical run --env=test -- env | grep DATABASE"

# 5. テスト問題
echo "## Test Issues"
echo "Reset test DB: pnpm db:reset:test"
echo "Clear test cache: rm -rf coverage && pnpm test:unit --no-cache"
```

### パフォーマンス分析

```typescript
// dev/ci/scripts/analyze-performance.ts
import { execSync } from 'child_process'
import fs from 'fs'

interface BuildAnalysis {
  totalTime: number
  slowestTasks: Array<{
    task: string
    duration: number
    cache: 'HIT' | 'MISS'
  }>
}

export async function analyzeCI(): Promise<BuildAnalysis> {
  // Turbo分析実行
  const analysis = execSync('pnpm turbo build --dry-run=json', { encoding: 'utf8' })
  const data = JSON.parse(analysis)
  
  // 遅いタスク特定
  const slowestTasks = data.tasks
    .sort((a: any, b: any) => b.duration - a.duration)
    .slice(0, 5)
    .map((task: any) => ({
      task: task.taskId,
      duration: task.duration / 1000, // ms -> s
      cache: task.cache.status
    }))
  
  return {
    totalTime: data.summary.duration / 1000,
    slowestTasks
  }
}

// 最適化提案
export function suggestOptimizations(analysis: BuildAnalysis): string[] {
  const suggestions: string[] = []
  
  if (analysis.totalTime > 300) { // 5分超
    suggestions.push('Consider splitting large applications')
    suggestions.push('Review dependency graph for unnecessary builds')
  }
  
  const cacheMisses = analysis.slowestTasks.filter(t => t.cache === 'MISS')
  if (cacheMisses.length > 2) {
    suggestions.push('Optimize cache configuration for consistent builds')
  }
  
  return suggestions
}
```

---

## 🎯 次のステップ

1. **基本CI/CDパイプライン設定**: GitHub Actions基本ワークフロー作成
2. **Turbo最適化設定**: キャッシュ戦略・並列実行設定
3. **環境別デプロイメント**: ステージング・本番デプロイフロー
4. **監視・アラート設定**: パフォーマンス監視・障害通知
5. **Blue-Green/ロールバック実装**: 高可用性デプロイメント戦略

---

## 📚 参考資料

### CI/CDツール・サービス
- [GitHub Actions](https://docs.github.com/en/actions) - 公式ドキュメント
- [Turbo](https://turbo.build/) - モノレポビルドシステム
- [Infisical](https://infisical.com/) - セキュア環境変数管理

### デプロイメント戦略
- [Blue-Green Deployment](https://martinfowler.com/bliki/BlueGreenDeployment.html) - Martin Fowler
- [Rolling Deployment](https://docs.aws.amazon.com/whitepapers/latest/overview-deployment-options/rolling-deployments.html) - AWS

### コンテナ最適化
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/) - 公式ベストプラクティス
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/) - Docker公式

---

© 2025 WebService-Next-Hono-Base Development Team
