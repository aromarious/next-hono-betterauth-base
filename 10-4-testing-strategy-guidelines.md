# テスト戦略ガイドライン

WebService-Next-Hono-Base を基盤とするWebサービス開発において、包括的なテスト戦略の設計・実装ガイドラインを提供します。

---

## 🎯 ガイドラインの目的

このガイドラインは：
- **品質保証の体系化**: Unit/Integration/E2E テストの戦略的実装
- **CI/CD統合**: 自動化されたテストパイプラインの構築方法
- **型安全テスト**: TypeScript + Drizzle + OpenAPI を活用した型安全なテスト実装
- Next.js + Hono + Better Auth 構成での最適なテスト設計を実現

---

## 📋 テスト戦略の全体像

### テストピラミッド
```mermaid
graph TD
    A[E2E Tests<br/>少数・高価値] --> B[Integration Tests<br/>中程度・API+DB]
    B --> C[Unit Tests<br/>多数・高速]
    
    style A fill:#ff6b6b
    style B fill:#4ecdc4  
    style C fill:#45b7d1
```

### テストレベル別責任範囲

| テストレベル | 対象範囲 | 実行環境 | 目的 | 実行頻度 |
|-------------|----------|----------|------|----------|
| **Unit Tests** | 関数・クラス・コンポーネント単体 | メモリ内・Mock | ロジックの正確性 | 開発時・PR時 |
| **Integration Tests** | API + DB + 外部サービス | テストDB | システム連携 | PR時・デプロイ前 |
| **E2E Tests** | ブラウザ・ユーザーシナリオ | 統合環境 | ユーザー体験 | デプロイ後 |
| **Contract Tests** | API仕様準拠 | Mock Server | 契約整合性 | OpenAPI変更時 |

---

## 📁 プロジェクトファイル構成

### テスト関連ディレクトリ構造
```
repo/
  apps/
    web/
      __tests__/
        components/         # React コンポーネントテスト
        pages/             # ページテスト（Next.js）
        hooks/             # カスタムフックテスト
        utils/             # ユーティリティテスト
        e2e/               # E2E テストスイート
          auth.spec.ts     # 認証フローテスト
          user.spec.ts     # ユーザー機能テスト
      playwright.config.ts
      vitest.config.ts
    api/
      __tests__/
        routes/            # API ルートテスト
        middleware/        # ミドルウェアテスト
        services/          # サービス層テスト
        integration/       # 統合テスト
          auth.test.ts     # 認証統合テスト
          user.test.ts     # ユーザー統合テスト
      vitest.config.ts
  packages/
    domain/
      __tests__/           # ドメイン層テスト
    application/
      __tests__/           # アプリケーション層テスト
    infrastructure/
      __tests__/           # インフラ層テスト
        repositories/      # リポジトリテスト
  dev/
    testing/
      setup.ts            # テスト共通設定
      factories/          # テストデータファクトリー
      fixtures/           # テストフィクスチャ
      helpers/            # テストヘルパー関数
```

---

## 🧪 Unit Tests 実装戦略

### Vitest設定・基本構成

```typescript
// apps/api/vitest.config.ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['../../dev/testing/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/migrations/**',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        }
      }
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../../packages'),
      '@dev': path.resolve(__dirname, '../../dev'),
    }
  }
})
```

### API層のUnitテスト実装

```typescript
// apps/api/__tests__/routes/auth.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Hono } from 'hono'
import { authRoutes } from '../../src/routes/auth.js'
import { testClient } from 'hono/testing'
import { UserRepository } from '@shared/infrastructure/db/repositories/user.repository.js'

// モック設定
vi.mock('@shared/infrastructure/db/repositories/user.repository.js')
const mockUserRepository = vi.mocked(UserRepository)

describe('Auth Routes', () => {
  let app: Hono
  let client: ReturnType<typeof testClient>

  beforeEach(() => {
    app = new Hono()
    app.route('/auth', authRoutes)
    client = testClient(app)
    vi.clearAllMocks()
  })

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User'
      }
      
      const mockUser = {
        id: 'user_123',
        email: userData.email,
        name: userData.name,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockUserRepository.prototype.create.mockResolvedValue(mockUser)

      // Act
      const response = await client.auth.register.$post({
        json: userData
      })

      // Assert
      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.user.email).toBe(userData.email)
      expect(data.data.user.name).toBe(userData.name)
      expect(mockUserRepository.prototype.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: userData.email,
          name: userData.name
        })
      )
    })

    it('should return 400 for invalid email format', async () => {
      // Arrange
      const invalidUserData = {
        email: 'invalid-email',
        password: 'SecurePass123!',
        name: 'Test User'
      }

      // Act
      const response = await client.auth.register.$post({
        json: invalidUserData
      })

      // Assert
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
      expect(data.error.details).toContainEqual(
        expect.objectContaining({
          field: 'email',
          message: expect.stringContaining('valid email')
        })
      )
    })

    it('should return 409 for duplicate email', async () => {
      // Arrange
      const userData = {
        email: 'existing@example.com',
        password: 'SecurePass123!',
        name: 'Test User'
      }

      mockUserRepository.prototype.create.mockRejectedValue(
        new Error('UNIQUE constraint failed: users.email')
      )

      // Act
      const response = await client.auth.register.$post({
        json: userData
      })

      // Assert
      expect(response.status).toBe(409)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('CONFLICT')
    })
  })

  describe('POST /auth/login', () => {
    it('should login user with valid credentials', async () => {
      // テスト実装...
    })

    it('should return 401 for invalid credentials', async () => {
      // テスト実装...
    })
  })
})
```

### ドメイン層・アプリケーション層のテスト

```typescript
// packages/domain/__tests__/user.test.ts
import { describe, it, expect } from 'vitest'
import { User } from '../src/entities/user.js'
import { Email } from '../src/value-objects/email.js'

describe('User Entity', () => {
  describe('User Creation', () => {
    it('should create user with valid data', () => {
      // Arrange
      const userData = {
        id: 'user_123',
        email: new Email('test@example.com'),
        name: 'Test User',
        emailVerified: false
      }

      // Act
      const user = new User(userData)

      // Assert
      expect(user.id).toBe(userData.id)
      expect(user.email.value).toBe('test@example.com')
      expect(user.name).toBe(userData.name)
      expect(user.isEmailVerified()).toBe(false)
    })

    it('should throw error for invalid email', () => {
      // Arrange & Act & Assert
      expect(() => {
        new Email('invalid-email')
      }).toThrow('Invalid email format')
    })
  })

  describe('User Methods', () => {
    it('should verify email successfully', () => {
      // Arrange
      const user = new User({
        id: 'user_123',
        email: new Email('test@example.com'),
        name: 'Test User',
        emailVerified: false
      })

      // Act
      user.verifyEmail()

      // Assert
      expect(user.isEmailVerified()).toBe(true)
    })

    it('should update profile information', () => {
      // Arrange
      const user = new User({
        id: 'user_123',
        email: new Email('test@example.com'),
        name: 'Test User',
        emailVerified: true
      })

      // Act
      user.updateProfile({ name: 'Updated Name' })

      // Assert
      expect(user.name).toBe('Updated Name')
    })
  })
})
```

---

## 🔗 Integration Tests 実装戦略

### テストデータベース設定

```typescript
// dev/testing/setup.ts
import { beforeAll, afterAll, beforeEach } from 'vitest'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { getTestDb, closeTestDb } from './test-db.js'
import { seedTestData, cleanupTestData } from './fixtures/index.js'

beforeAll(async () => {
  // テストDB接続・マイグレーション実行
  const db = getTestDb()
  await migrate(db, { migrationsFolder: '../../ops/db/migrations' })
})

afterAll(async () => {
  // テストDB接続終了
  await closeTestDb()
})

beforeEach(async () => {
  // 各テスト前にデータをクリーンアップ・基本データ投入
  await cleanupTestData()
  await seedTestData()
})
```

```typescript
// dev/testing/test-db.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../../ops/db/schema/index.js'

let testDb: ReturnType<typeof drizzle> | null = null
let client: ReturnType<typeof postgres> | null = null

export const getTestDb = () => {
  if (!testDb) {
    const connectionString = process.env.TEST_DATABASE_URL || 
      'postgresql://test:test@localhost:5432/webservice_test'
    
    client = postgres(connectionString, { max: 1 })
    testDb = drizzle(client, { schema })
  }
  return testDb
}

export const closeTestDb = async () => {
  if (client) {
    await client.end()
    client = null
    testDb = null
  }
}
```

### API統合テスト実装

```typescript
// apps/api/__tests__/integration/auth.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { testClient } from 'hono/testing'
import { authRoutes } from '../../src/routes/auth.js'
import { getTestDb } from '@dev/testing/test-db.js'
import { users } from '@shared/ops/db/schema/index.js'
import { eq } from 'drizzle-orm'

describe('Auth Integration Tests', () => {
  let app: Hono
  let client: ReturnType<typeof testClient>
  const db = getTestDb()

  beforeEach(() => {
    app = new Hono()
    app.route('/auth', authRoutes)
    client = testClient(app)
  })

  describe('User Registration Flow', () => {
    it('should register user, store in DB, and return token', async () => {
      // Arrange
      const userData = {
        email: 'integration@example.com',
        password: 'SecurePass123!',
        name: 'Integration Test User'
      }

      // Act - Register
      const registerResponse = await client.auth.register.$post({
        json: userData
      })

      // Assert - Registration
      expect(registerResponse.status).toBe(201)
      const registerData = await registerResponse.json()
      expect(registerData.success).toBe(true)
      expect(registerData.data.user.email).toBe(userData.email)
      expect(registerData.data.token).toBeDefined()

      // Assert - DB Storage
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email))

      expect(dbUser).toBeDefined()
      expect(dbUser.name).toBe(userData.name)
      expect(dbUser.emailVerified).toBe(false)
    })

    it('should prevent duplicate email registration', async () => {
      // Arrange - 最初のユーザー登録
      const userData = {
        email: 'duplicate@example.com',
        password: 'SecurePass123!',
        name: 'First User'
      }

      await client.auth.register.$post({ json: userData })

      // Act - 同じメールで再登録試行
      const duplicateResponse = await client.auth.register.$post({
        json: { ...userData, name: 'Second User' }
      })

      // Assert
      expect(duplicateResponse.status).toBe(409)
      const data = await duplicateResponse.json()
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('CONFLICT')

      // Assert - DB確認（1件のみ）
      const dbUsers = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email))

      expect(dbUsers).toHaveLength(1)
      expect(dbUsers[0].name).toBe('First User')
    })
  })

  describe('Login Flow', () => {
    it('should login with valid credentials and create session', async () => {
      // Arrange - ユーザー事前登録
      const userData = {
        email: 'login@example.com',
        password: 'SecurePass123!',
        name: 'Login Test User'
      }

      await client.auth.register.$post({ json: userData })

      // Act - Login
      const loginResponse = await client.auth.login.$post({
        json: {
          email: userData.email,
          password: userData.password
        }
      })

      // Assert
      expect(loginResponse.status).toBe(200)
      const loginData = await loginResponse.json()
      expect(loginData.success).toBe(true)
      expect(loginData.data.user.email).toBe(userData.email)
      expect(loginData.data.token).toBeDefined()

      // Assert - セッション確認（Better Authのセッション管理）
      const sessionHeader = loginResponse.headers.get('set-cookie')
      expect(sessionHeader).toContain('better-auth.session_token')
    })
  })
})
```

---

## 🎭 E2E Tests 実装戦略（Playwright）

### Playwright設定

```typescript
// apps/web/playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: [
    {
      command: 'pnpm dev:api',
      port: 8787,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm dev:web',
      port: 3000,
      reuseExistingServer: !process.env.CI,
    },
  ],
})
```

### 認証フローE2Eテスト

```typescript
// apps/web/__tests__/e2e/auth.spec.ts
import { test, expect } from '@playwright/test'
import { generateTestUser } from '@dev/testing/factories/user.factory.js'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // テストデータリセット・基本設定
    await page.goto('/')
  })

  test('should register, login, and logout successfully', async ({ page }) => {
    const testUser = generateTestUser()

    // ユーザー登録
    await page.getByRole('link', { name: '新規登録' }).click()
    await expect(page).toHaveURL('/auth/register')

    await page.getByLabel('メールアドレス').fill(testUser.email)
    await page.getByLabel('パスワード').fill(testUser.password)
    await page.getByLabel('ユーザー名').fill(testUser.name)
    await page.getByRole('button', { name: '登録' }).click()

    // 登録成功後、ダッシュボードにリダイレクト
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByText(`こんにちは、${testUser.name}さん`)).toBeVisible()

    // ログアウト
    await page.getByRole('button', { name: 'メニュー' }).click()
    await page.getByRole('menuitem', { name: 'ログアウト' }).click()

    // ログアウト後、トップページにリダイレクト
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('link', { name: 'ログイン' })).toBeVisible()

    // 再ログイン
    await page.getByRole('link', { name: 'ログイン' }).click()
    await page.getByLabel('メールアドレス').fill(testUser.email)
    await page.getByLabel('パスワード').fill(testUser.password)
    await page.getByRole('button', { name: 'ログイン' }).click()

    // ログイン成功確認
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByText(`こんにちは、${testUser.name}さん`)).toBeVisible()
  })

  test('should show validation errors for invalid registration', async ({ page }) => {
    await page.getByRole('link', { name: '新規登録' }).click()

    // 無効なデータで登録試行
    await page.getByLabel('メールアドレス').fill('invalid-email')
    await page.getByLabel('パスワード').fill('weak')
    await page.getByLabel('ユーザー名').fill('')
    await page.getByRole('button', { name: '登録' }).click()

    // バリデーションエラー確認
    await expect(page.getByText('有効なメールアドレスを入力してください')).toBeVisible()
    await expect(page.getByText('パスワードは8文字以上である必要があります')).toBeVisible()
    await expect(page.getByText('ユーザー名は必須です')).toBeVisible()

    // ページ遷移しないことを確認
    await expect(page).toHaveURL('/auth/register')
  })

  test('should handle login with wrong credentials', async ({ page }) => {
    await page.getByRole('link', { name: 'ログイン' }).click()

    await page.getByLabel('メールアドレス').fill('nonexistent@example.com')
    await page.getByLabel('パスワード').fill('wrongpassword')
    await page.getByRole('button', { name: 'ログイン' }).click()

    // エラーメッセージ確認
    await expect(page.getByText('メールアドレスまたはパスワードが正しくありません')).toBeVisible()
    await expect(page).toHaveURL('/auth/login')
  })
})

test.describe('Protected Routes', () => {
  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await page.goto('/dashboard')
    
    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL('/auth/login')
    await expect(page.getByText('ログインが必要です')).toBeVisible()
  })

  test('should allow access to protected route after login', async ({ page }) => {
    const testUser = generateTestUser()

    // 事前にユーザー登録（APIで直接実行）
    await page.request.post('/api/v1/auth/register', {
      data: testUser
    })

    // ログイン
    await page.goto('/auth/login')
    await page.getByLabel('メールアドレス').fill(testUser.email)
    await page.getByLabel('パスワード').fill(testUser.password)
    await page.getByRole('button', { name: 'ログイン' }).click()

    // 保護されたルートにアクセス
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByText(`こんにちは、${testUser.name}さん`)).toBeVisible()
  })
})
```

---

## 📋 Contract Tests（OpenAPI準拠テスト）

### OpenAPI契約テスト

```typescript
// apps/api/__tests__/contract/openapi.test.ts
import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { testClient } from 'hono/testing'
import { OpenAPIHono } from '@hono/zod-openapi'
import { authRoutes } from '../../src/routes/auth.js'
import openApiSpec from '@shared/openapi/openapi.yaml'

describe('OpenAPI Contract Tests', () => {
  let app: OpenAPIHono
  let client: ReturnType<typeof testClient>

  beforeEach(() => {
    app = new OpenAPIHono()
    app.route('/v1/auth', authRoutes)
    client = testClient(app)
  })

  describe('API Response Structure', () => {
    it('should match OpenAPI schema for successful registration', async () => {
      // Arrange
      const userData = {
        email: 'contract@example.com',
        password: 'SecurePass123!',
        name: 'Contract Test User'
      }

      // Act
      const response = await client.v1.auth.register.$post({
        json: userData
      })

      // Assert - Status Code
      expect(response.status).toBe(201)

      // Assert - Response Structure
      const data = await response.json()
      
      // OpenAPI仕様に基づくスキーマ検証
      expect(data).toMatchObject({
        success: expect.any(Boolean),
        data: {
          user: {
            id: expect.any(String),
            email: expect.any(String),
            name: expect.any(String),
            createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/),
            updatedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/),
          },
          token: expect.any(String),
          expiresAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/),
        }
      })

      // パスワードが含まれていないことを確認
      expect(data.data.user).not.toHaveProperty('password')
    })

    it('should match OpenAPI schema for validation errors', async () => {
      // Act
      const response = await client.v1.auth.register.$post({
        json: {
          email: 'invalid-email',
          password: 'weak',
          name: ''
        }
      })

      // Assert
      expect(response.status).toBe(400)
      const data = await response.json()

      expect(data).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.any(String),
          details: expect.arrayContaining([
            expect.objectContaining({
              field: expect.any(String),
              message: expect.any(String)
            })
          ])
        }
      })
    })
  })

  describe('Request Validation', () => {
    it('should reject requests not matching OpenAPI schema', async () => {
      // Act - 必須フィールド不足
      const response = await client.v1.auth.register.$post({
        json: {
          email: 'test@example.com'
          // password, name が不足
        }
      })

      // Assert
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })
  })
})
```

---

## 📊 テストカバレッジ・品質管理

### カバレッジ目標・測定

```typescript
// dev/testing/coverage.config.ts
export const coverageConfig = {
  // カバレッジ目標
  thresholds: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
    // ファイル別詳細設定
    './packages/domain/**/*.ts': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
    },
    './apps/api/src/routes/**/*.ts': {
      statements: 85,
      branches: 80,
      functions: 85,
      lines: 85,
    }
  },

  // カバレッジ除外対象
  exclude: [
    'node_modules/**',
    '**/*.d.ts',
    '**/*.config.{js,ts}',
    '**/migrations/**',
    '**/__tests__/**',
    '**/dev/**',
  ],

  // レポート形式
  reporters: ['text', 'json', 'html', 'lcov'],
}
```

### 品質ゲート設定

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm test:unit
      - run: pnpm test:coverage

      # カバレッジ品質ゲート
      - name: Coverage Quality Gate
        run: |
          if [ $(pnpm test:coverage:check | grep "FAIL" | wc -l) -gt 0 ]; then
            echo "❌ Coverage threshold not met"
            exit 1
          fi
          echo "✅ Coverage threshold met"

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
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
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm db:migrate:test
      - run: pnpm test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm playwright install --with-deps
      - run: pnpm test:e2e

      # E2Eテスト失敗時のデバッグ情報保存
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 🏗️ テストデータ管理

### ファクトリーパターン実装

```typescript
// dev/testing/factories/user.factory.ts
import { faker } from '@faker-js/faker/locale/ja'
import { createId } from '@paralleldrive/cuid2'
import type { User } from '@shared/domain/entities/user.js'

export interface TestUserData {
  id?: string
  email?: string
  password?: string
  name?: string
  emailVerified?: boolean
}

export const generateTestUser = (overrides: TestUserData = {}): Required<TestUserData> => {
  return {
    id: createId(),
    email: faker.internet.email(),
    password: 'TestPass123!',
    name: faker.person.fullName(),
    emailVerified: false,
    ...overrides,
  }
}

export const generateTestUsers = (count: number, overrides: TestUserData = []): Required<TestUserData>[] => {
  return Array.from({ length: count }, () => generateTestUser(overrides))
}

// 特定パターンのテストユーザー
export const testUserPatterns = {
  validUser: (): Required<TestUserData> => generateTestUser({
    email: 'valid@example.com',
    name: 'Valid Test User',
    emailVerified: true
  }),

  unverifiedUser: (): Required<TestUserData> => generateTestUser({
    email: 'unverified@example.com',
    name: 'Unverified User',
    emailVerified: false
  }),

  adminUser: (): Required<TestUserData> => generateTestUser({
    email: 'admin@example.com',
    name: 'Admin User',
    emailVerified: true
  })
}
```

### テストフィクスチャ管理

```typescript
// dev/testing/fixtures/auth.fixture.ts
import { getTestDb } from '../test-db.js'
import { users, sessions } from '@shared/ops/db/schema/index.js'
import { generateTestUser } from '../factories/user.factory.js'

export class AuthFixture {
  private db = getTestDb()

  async createUser(userData?: Partial<TestUserData>) {
    const testUser = generateTestUser(userData)
    
    const [user] = await this.db
      .insert(users)
      .values({
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        emailVerified: testUser.emailVerified,
      })
      .returning()

    return { user, password: testUser.password }
  }

  async createUserWithSession(userData?: Partial<TestUserData>) {
    const { user, password } = await this.createUser(userData)
    
    const [session] = await this.db
      .insert(sessions)
      .values({
        id: `session_${createId()}`,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7日後
      })
      .returning()

    return { user, session, password }
  }

  async cleanup() {
    await this.db.delete(sessions)
    await this.db.delete(users)
  }
}
```

---

## 🚀 CI/CD統合・自動化

### package.json テストスクリプト

```json
{
  "scripts": {
    "test": "run-s test:*",
    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:contract": "vitest run --config vitest.contract.config.ts",
    "test:coverage": "vitest run --coverage",
    "test:coverage:check": "vitest run --coverage --reporter=json | jq '.coverageMap'",
    "test:ci": "run-s test:unit test:integration test:contract",
    "test:ci:full": "run-s test:ci test:e2e"
  }
}
```

### テスト環境の自動セットアップ

```bash
#!/bin/bash
# dev/testing/setup-test-env.sh

echo "🚀 Setting up test environment..."

# Docker Compose でテスト用DB起動
docker-compose -f docker-compose.test.yml up -d postgres-test

# DB接続待機
echo "⏳ Waiting for database..."
until docker-compose -f docker-compose.test.yml exec -T postgres-test pg_isready; do
  sleep 1
done

# テストDBマイグレーション
echo "📊 Running test database migrations..."
infisical run --env=test -- pnpm db:migrate

# テストサーバー起動
echo "🌐 Starting test servers..."
pnpm dev:api &
API_PID=$!
pnpm dev:web &
WEB_PID=$!

# サーバー起動待機
sleep 10

# テスト実行
echo "🧪 Running tests..."
pnpm test:ci:full

# 結果
TEST_EXIT_CODE=$?

# クリーンアップ
echo "🧹 Cleaning up..."
kill $API_PID $WEB_PID
docker-compose -f docker-compose.test.yml down

exit $TEST_EXIT_CODE
```

---

## ✅ テスト戦略チェックリスト

### Unit Tests
- [ ] ドメイン層の全エンティティ・値オブジェクトをテスト
- [ ] アプリケーション層の全ユースケースをテスト
- [ ] API層の全ルート・ミドルウェアをテスト
- [ ] モック・スタブを適切に使用したテスト分離
- [ ] エッジケース・エラーハンドリングのテスト

### Integration Tests
- [ ] API + DB の統合テスト
- [ ] 認証フロー（登録・ログイン・ログアウト）
- [ ] ユーザー管理機能の統合テスト
- [ ] エラーシナリオ・トランザクション確認
- [ ] 外部サービス統合のテスト

### E2E Tests
- [ ] 主要ユーザーシナリオのテスト
- [ ] 認証フロー・画面遷移のテスト
- [ ] レスポンシブデザインのテスト
- [ ] アクセシビリティのテスト
- [ ] パフォーマンス・可用性のテスト

### Contract Tests
- [ ] OpenAPI仕様準拠の確認
- [ ] リクエスト・レスポンススキーマの検証
- [ ] エラーレスポンス形式の統一確認
- [ ] API バージョニング対応のテスト

### 品質・自動化
- [ ] カバレッジ目標の達成（80%以上）
- [ ] CI/CD パイプラインでの自動実行
- [ ] 品質ゲート・失敗時の通知設定
- [ ] テストデータ・環境の適切な管理

---

## 🛠️ デバッグ・トラブルシューティング

### よくある問題と解決策

```typescript
// dev/testing/debug-helpers.ts

export const debugHelpers = {
  // テストDB状態の確認
  async inspectTestDb() {
    const db = getTestDb()
    const userCount = await db.select({ count: count() }).from(users)
    const sessionCount = await db.select({ count: count() }).from(sessions)
    
    console.log('🔍 Test DB State:')
    console.log(`  Users: ${userCount[0].count}`)
    console.log(`  Sessions: ${sessionCount[0].count}`)
  },

  // API レスポンスの詳細確認
  async logApiResponse(response: Response) {
    console.log('📡 API Response:')
    console.log(`  Status: ${response.status}`)
    console.log(`  Headers:`, Object.fromEntries(response.headers.entries()))
    
    const clonedResponse = response.clone()
    const body = await clonedResponse.text()
    console.log(`  Body: ${body}`)
  },

  // E2E テスト時のページ状態確認
  async debugPlaywrightPage(page: Page) {
    console.log('🎭 Page State:')
    console.log(`  URL: ${page.url()}`)
    console.log(`  Title: ${await page.title()}`)
    
    // コンソールエラーの確認
    const errors = await page.evaluate(() => {
      return window.console.errors || []
    })
    if (errors.length > 0) {
      console.log(`  Console Errors:`, errors)
    }
  }
}
```

---

## 🎯 次のステップ

1. **Unit Tests の基盤実装**: Vitest設定・基本テストケース作成
2. **Integration Tests の環境構築**: テストDB・ファクトリー実装
3. **E2E Tests の設定**: Playwright設定・主要シナリオ作成
4. **CI/CD パイプライン統合**: 自動テスト実行・品質ゲート設定
5. **Contract Tests の実装**: OpenAPI準拠テスト・スキーマ検証

---

## 📚 参考資料

### テスティングフレームワーク
- [Vitest](https://vitest.dev/) - 高速なViteベースのテストフレームワーク
- [Playwright](https://playwright.dev/) - 現代的なE2Eテストフレームワーク
- [Testing Library](https://testing-library.com/) - ユーザー中心のテストユーティリティ

### テスト戦略・ベストプラクティス
- [Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html) - Martin Fowler
- [Contract Testing](https://pactflow.io/blog/what-is-contract-testing/) - 契約テスト入門

---

© 2025 WebService-Next-Hono-Base Development Team
