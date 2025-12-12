import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    globals: false,
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["**/*.integration.test.ts", "node_modules", ".next"],
    coverage: {
      provider: "v8" as "v8",
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
})
