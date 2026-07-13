import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      // 100% is enforced on the non-React runtime only (see CLAUDE.md). The
      // React layer (*.tsx) ships as SSR-rendered scaffolding and is exercised
      // via renderToStaticMarkup, not held to the line/branch threshold.
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.tsx"],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100
      }
    }
  }
});
