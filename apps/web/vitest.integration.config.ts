import path from "node:path"
import { fileURLToPath } from "node:url"
import { loadEnv } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

export default defineConfig(({ mode }) => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  // Load .env file explicitly
  const env = loadEnv(mode, __dirname, "")

  return {
    plugins: [tsconfigPaths({ root: __dirname })],
    test: {
      name: "integration",
      globals: false,
      environment: "node",
      include: ["**/*.integration.test.ts"],
      exclude: ["node_modules", ".next", "test-e2e/**"],
      fileParallelism: false, // Enforce sequential execution
      globalSetup: ["./server/test-setup/integration-global-setup.ts"],
      setupFiles: ["./server/test-setup/load-env.ts"],
      env: {
        ...env,
      },
      coverage: {
        provider: "v8" as const,
        reporter: ["text", "json", "html", "json-summary"],
      },
    },
  }
})
