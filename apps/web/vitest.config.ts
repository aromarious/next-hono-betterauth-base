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
      name: "unit",
      globals: false,
      environment: "node",
      include: ["**/*.test.ts", "**/*.test.tsx"],
      exclude: [
        "**/*.integration.test.ts",
        "node_modules",
        ".next",
        "test-e2e/**",
      ],
      env: {
        ...env,
      },
      coverage: {
        provider: "v8" as const,
        reporter: ["text", "json", "html"],
        exclude: [
          "**/*.integration.test.ts",
          "node_modules",
          ".next",
          "*.config.ts",
          "**/*.d.ts",
        ],
      },
    },
  }
})
