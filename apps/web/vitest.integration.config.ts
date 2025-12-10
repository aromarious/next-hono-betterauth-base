import { defineConfig } from "vitest/config"

// Define configuration explicitly to avoid merge issues with base config exclusions
export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    include: ["**/*.integration.test.ts"],
    exclude: ["node_modules", ".next"],
    fileParallelism: false, // Enforce sequential execution
  },
})
