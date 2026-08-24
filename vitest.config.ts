import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov"],
      // 100% is enforced on the non-React runtime only (see CLAUDE.md). The
      // React layer (*.tsx) ships as SSR-rendered scaffolding and is exercised
      // via renderToStaticMarkup, not held to the line/branch threshold.
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.tsx",
        // The `/_preview` gallery and its service stub (`A-C2`). Dev-only, in
        // no tarball, and exercised by `tests/preview-gallery.test.tsx` — but
        // held to what it is for, not to a product coverage threshold. Listed
        // explicitly because importing the fixture from a test is what pulls
        // it into the v8 report in the first place.
        "fixtures/**"
      ],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100
      }
    }
  }
});
