export default [
  "../../packages/*",
  {
    extends: "../../apps/web/vitest.config.ts",
    test: {
      name: "unit",
      include: ["**/*.test.ts"],
      exclude: ["**/*.integration.test.ts", "test/**"],
    },
  },
  {
    extends: "../../apps/web/vitest.integration.config.ts",
    test: {
      name: "integration",
      include: ["**/*.integration.test.ts"],
    },
  },
]
