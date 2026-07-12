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

    expect(pkg.dependencies?.["@mano8/astro-ui-m8"]).toBe("^1.0.0");
    expect(pkg.files).toEqual(expect.arrayContaining(["registry.json", "registry/r"]));
    expect(pkg.scripts?.["build:registry"]).toBe("node scripts/build-registry.mjs");
    expect(pkg.scripts?.build).toContain("npm run build:registry");
  });

  it("generates installable registry items that compose astro-ui-m8", () => {
    const registry = readJson<RegistryFile>("registry.json");
    const generatedIndex = readJson<RegistryFile>("registry/r/registry.json");
    const itemNames = registry.items.map((item) => item.name);

    expect(itemNames).toEqual([
      "reparto-classroom-stages-view",
      "reparto-processes-table",
      "reparto-state-panel",
      "reparto-starter-views",
      "reparto-crud-table",
      "reparto-fk-select",
      "reparto-delete-confirm",
      "reparto-school-dialog",
      "reparto-academic-year-dialog",
      "reparto-department-dialog",
      "reparto-teacher-roster-dialog"
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
          "components/fa-reparto/reparto-starter-views.tsx",
          "components/fa-reparto/reparto-crud-table.tsx",
          "components/fa-reparto/reparto-fk-select.tsx",
          "components/fa-reparto/reparto-delete-confirm.tsx",
          "components/fa-reparto/reparto-school-dialog.tsx",
          "components/fa-reparto/reparto-academic-year-dialog.tsx",
          "components/fa-reparto/reparto-department-dialog.tsx",
          "components/fa-reparto/reparto-teacher-roster-dialog.tsx"
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

  it("ships Phase 1 admin CRUD skins that compose reparto hooks + i18n", () => {
    const registry = readJson<RegistryFile>("registry.json");
    const names = registry.items.map((item) => item.name);
    const phase1 = [
      "reparto-crud-table",
      "reparto-fk-select",
      "reparto-delete-confirm",
      "reparto-school-dialog",
      "reparto-academic-year-dialog",
      "reparto-department-dialog",
      "reparto-teacher-roster-dialog"
    ];
    for (const name of phase1) {
      expect(names, `missing ${name}`).toContain(name);
    }
    const fk = readJson<RegistryItem>("registry/r/reparto-fk-select.json");
    expect(fk.files[0].content).toContain("create-new");
    expect(fk.files[0].content).toContain("RepartoFkSelect");
    const dept = readJson<RegistryItem>("registry/r/reparto-department-dialog.json");
    expect(dept.files[0].content).toContain("useRepartoSchools");
    expect(dept.files[0].content).toContain("RepartoFkSelect");
    const roster = readJson<RegistryItem>("registry/r/reparto-teacher-roster-dialog.json");
    expect(roster.files[0].content).toContain("useDeleteRepartoTeacherProfile");
    expect(roster.files[0].content).toContain("RepartoDeleteConfirm");
    const year = readJson<RegistryItem>("registry/r/reparto-academic-year-dialog.json");
    expect(year.files[0].content).toContain("useArchiveRepartoAcademicYear");
    expect(year.files[0].content).toContain('type="date"');
  });
});
