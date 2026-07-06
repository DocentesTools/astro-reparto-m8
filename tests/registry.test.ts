import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(join(root, path), "utf8")) as T;
}

type RegistryFile = {
  name: string;
  items: Array<{
    name: string;
    registryDependencies?: string[];
    files?: Array<{ path: string; target?: string }>;
  }>;
};

type RegistryItem = {
  name: string;
  registryDependencies?: string[];
  files: Array<{ path: string; target?: string; content: string }>;
};

describe("reparto shadcn registry", () => {
  it("ships astro-ui-m8 as a normal dependency for registry consumers", () => {
    const pkg = readJson<{
      dependencies?: Record<string, string>;
      files?: string[];
      scripts?: Record<string, string>;
    }>("package.json");

    expect(pkg.dependencies?.["@mano8/astro-ui-m8"]).toBe("^0.1.0-alpha.1");
    expect(pkg.files).toEqual(expect.arrayContaining(["registry.json", "registry/r"]));
    expect(pkg.scripts?.["build:registry"]).toBe("node scripts/build-registry.mjs");
    expect(pkg.scripts?.build).toContain("npm run build:registry");
  });

  it("generates installable registry items that compose astro-ui-m8", () => {
    const registry = readJson<RegistryFile>("registry.json");
    const generatedIndex = readJson<RegistryFile>("registry/r/registry.json");
    const itemNames = registry.items.map((item) => item.name);

    expect(itemNames).toEqual([
      "reparto-processes-table",
      "reparto-state-panel",
      "reparto-starter-views"
    ]);
    expect(generatedIndex.items.map((item) => item.name)).toEqual(itemNames);

    const generatedItems = itemNames.map((name) =>
      readJson<RegistryItem>(`registry/r/${name}.json`)
    );
    expect(generatedItems.map((item) => item.name)).toEqual(itemNames);
    expect(
      generatedItems.flatMap((item) => item.registryDependencies ?? [])
    ).toEqual(
      expect.arrayContaining([
        "./node_modules/@mano8/astro-ui-m8/registry/r/data-table.json",
        "./node_modules/@mano8/astro-ui-m8/registry/r/state-loading.json",
        "./node_modules/@mano8/astro-ui-m8/registry/r/state-empty.json",
        "./node_modules/@mano8/astro-ui-m8/registry/r/state-error.json",
        "./node_modules/@mano8/astro-ui-m8/registry/r/state-unauthorized.json"
      ])
    );
    expect(generatedItems.flatMap((item) => item.files).map((file) => file.target))
      .toEqual(
        expect.arrayContaining([
          "components/fa-reparto/reparto-processes-table.tsx",
          "components/fa-reparto/reparto-state-panel.tsx",
          "components/fa-reparto/reparto-starter-views.tsx"
        ])
      );
    expect(
      generatedItems.flatMap((item) => item.files).map((file) => file.content)
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining("@/components/m8-ui/data-table"),
        expect.stringContaining("@/components/m8-ui/state-loading"),
        expect.stringContaining("@mano8/astro-reparto-m8/default-ui")
      ])
    );
  });
});
