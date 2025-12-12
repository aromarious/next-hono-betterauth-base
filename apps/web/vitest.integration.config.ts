import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig(() => {
  const root = fileURLToPath(new URL("./", import.meta.url))

  return {
    resolve: {
      alias: {
        "@": root,
      },
    },
    test: {
      globals: false,
      environment: "node",
      include: ["**/*.integration.test.ts"],
      exclude: ["node_modules", ".next"],
      fileParallelism: false, // Enforce sequential execution
      globalSetup: ["./test/integration-global-setup.ts"],
      setupFiles: ["./test/load-env.ts"],
      coverage: {
        provider: "v8" as "v8",
        reporter: ["text", "json", "html"],
      },
    },
  }
})
