export default [
  {
    extends: "apps/web/vitest.config.ts",
    root: "apps/web",
    test: {
      name: "unit",
      include: ["**/*.test.ts"],
      exclude: ["**/*.integration.test.ts", "test/**"],
    },
  },
  {
    extends: "apps/web/vitest.integration.config.ts",
    root: "apps/web",
    test: {
      name: "integration",
      include: ["**/*.integration.test.ts"],
    },
  },
]
