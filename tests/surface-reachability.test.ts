import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Every exported view and panel is reachable from a starter route, or is
 * listed below as host-mounted (§13.2a, the gate-gap bullet).
 *
 * Nine of the eleven `S2-*` findings had one shape: a component was built,
 * localized and tested, and nothing mounted it. `GroupSubjectBulkEditor` was
 * green for weeks with two test files as its only callers. The 2026-08-09 pair
 * (`20f7e96`) had the same signature. No suite could see it, because a test
 * that imports a component proves it compiles, not that an operator can reach
 * it.
 *
 * So this file asks the reachability question directly: start at the `.astro`
 * entry points the integration injects, follow what each mounts, and keep
 * following. A component the walk never reaches is unreachable in `starter`
 * mode — which is fine only if it is deliberately host-mounted, and the list of
 * those is right here, short enough to read and asserted against the same list
 * in `docs/host-integration.md`.
 *
 * The walk is over source text rather than a rendered tree on purpose: a
 * rendered tree only shows the branches the props chose, and "nothing mounts
 * it" is a property of the source.
 */

const root = process.cwd();
const runtimeDir = join(root, "src", "runtime");

/**
 * Exports that no starter route mounts, each with the reason it is still
 * exported. This list *is* the assertion: adding a name here is the deliberate
 * act of saying "no route mounts this, and that is intended".
 */
const HOST_MOUNTED: Record<string, string> = {
  DepartmentHeadView: "headless alias of RepartoDashboardView (the dashboard route mounts that)",
  ProcessesView: "headless alias of RepartoProcessesView (the processList route mounts that)",
  TeacherLanView: "headless alias of RepartoMyView (the teacherView route mounts that)",
  SharedScreenView: "headless alias of RepartoSharedView (the sharedScreen route mounts that)",
  RepartoExportCenterView: "headless alias of RepartoExportsView (the exports route mounts that)"
};

/** The two React subpaths a host may mount components from. */
const PUBLIC_COMPONENT_BARRELS = [
  join(runtimeDir, "react", "default-ui", "index.tsx"),
  join(runtimeDir, "react", "index.ts")
];

function sourceFiles(dir: string): string[] {
  const found: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) found.push(...sourceFiles(path));
    else if (/\.tsx?$/.test(path)) found.push(path);
  }
  return found;
}

/** Resolve a relative `./x.js` specifier to the `.ts`/`.tsx` file behind it. */
function resolveSpecifier(fromFile: string, specifier: string): string | null {
  if (!specifier.startsWith(".")) return null;
  const base = resolve(dirname(fromFile), specifier).replace(/\.js$/, "");
  for (const candidate of [
    `${base}.tsx`,
    `${base}.ts`,
    join(base, "index.tsx"),
    join(base, "index.ts")
  ]) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/** Names in an `export { … }` / `import { … }` clause, aliases resolved, types dropped. */
function clauseNames(clause: string, side: "local" | "exported"): string[] {
  return clause
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && !part.startsWith("type "))
    .map((part) => {
      const [local, exported] = part.split(/\s+as\s+/).map((piece) => piece.trim());
      return side === "local" ? local : (exported ?? local);
    });
}

/** JSX mounts (`<Name`) in a source text. */
function mountedNames(source: string): string[] {
  return [...source.matchAll(/<([A-Z][A-Za-z0-9_]*)/g)].map((match) => match[1]);
}

type Sources = Map<string, string>;

function readSources(overrides: Record<string, string> = {}): Sources {
  const sources: Sources = new Map();
  for (const file of sourceFiles(runtimeDir)) {
    sources.set(file, readFileSync(file, "utf8"));
  }
  for (const [relative, source] of Object.entries(overrides)) {
    sources.set(join(root, relative), source);
  }
  return sources;
}

/** `name -> file that defines it`, following `export { … } from` re-export edges. */
function defineIndex(sources: Sources): Map<string, string> {
  const defines = new Map<string, string>();
  const reexported = new Map<string, { local: string; target: string | null }>();

  for (const [file, source] of sources) {
    for (const match of source.matchAll(
      /^\s*(?:export\s+)?(?:default\s+)?function\s+([A-Za-z0-9_]+)/gm
    )) {
      if (!defines.has(match[1])) defines.set(match[1], file);
    }
    for (const match of source.matchAll(/^\s*(?:export\s+)?const\s+([A-Za-z0-9_]+)\s*[:=]/gm)) {
      if (!defines.has(match[1])) defines.set(match[1], file);
    }
    for (const match of source.matchAll(/export\s*\{([^}]*)\}\s*from\s*"([^"]+)"/g)) {
      const target = resolveSpecifier(file, match[2]);
      const locals = clauseNames(match[1], "local");
      const exports = clauseNames(match[1], "exported");
      exports.forEach((name, index) => {
        reexported.set(name, { local: locals[index], target });
      });
    }
  }

  // A re-exported name resolves to wherever its *local* name is defined; the
  // barrel itself defines nothing.
  for (const [name, { local }] of reexported) {
    if (!defines.has(name) && defines.has(local)) defines.set(name, defines.get(local)!);
  }
  return defines;
}

/** Component names mounted by the `.astro` files `ROUTE_ENTRYPOINTS` names. */
function routeRoots(): { entrypoints: string[]; roots: Set<string> } {
  const integration = readFileSync(join(root, "src", "integration.ts"), "utf8");
  const entrypoints = [
    ...integration.matchAll(
      /\w+:\s*"@mano8\/astro-reparto-m8\/routes\/([\w.-]+)\.astro"/g
    )
  ].map((match) => match[1]);

  const roots = new Set<string>();
  for (const entry of entrypoints) {
    const page = readFileSync(join(root, "src", "routes", `${entry}.astro`), "utf8");
    for (const name of mountedNames(page)) roots.add(name);
  }
  return { entrypoints, roots };
}

/** Everything mounted, directly or transitively, from a starter route. */
function reachableFromRoutes(sources: Sources): Set<string> {
  const defines = defineIndex(sources);
  const { roots } = routeRoots();
  const reachable = new Set<string>();
  const pending = [...roots];

  while (pending.length > 0) {
    const name = pending.pop()!;
    if (reachable.has(name)) continue;
    reachable.add(name);
    const file = defines.get(name);
    const source = file ? sources.get(file) : undefined;
    if (!source) continue;
    for (const mounted of mountedNames(source)) {
      if (!reachable.has(mounted)) pending.push(mounted);
    }
  }
  return reachable;
}

/** Component-shaped value exports of a public barrel. */
function barrelComponents(file: string): string[] {
  const source = readFileSync(file, "utf8");
  const names = new Set<string>();
  for (const match of source.matchAll(/export\s*\{([^}]*)\}\s*from\s*"([^"]+)"/g)) {
    for (const name of clauseNames(match[1], "exported")) names.add(name);
  }
  for (const match of source.matchAll(/export\s+function\s+([A-Za-z0-9_]+)/g)) {
    names.add(match[1]);
  }
  // PascalCase is the component convention; hooks (`useX`) and builders
  // (`buildX`) are not mounted and are covered by their own suites.
  return [...names].filter((name) => /^[A-Z]/.test(name));
}

const publicComponents = [
  ...new Set(PUBLIC_COMPONENT_BARRELS.flatMap(barrelComponents))
].sort();

describe("exported surface reachability", () => {
  it("walks every route entry point the integration injects", () => {
    const { entrypoints, roots } = routeRoots();
    // One per injected route: the walk covers the whole starter surface, not a
    // subset that happens to mention the panels under test.
    expect(entrypoints).toHaveLength(22);
    expect(roots.has("RepartoGroupSubjectsView")).toBe(true);
    expect(roots.has("RepartoPlanningView")).toBe(true);
  });

  it("reaches every exported view and panel, or names it host-mounted", () => {
    const reachable = reachableFromRoutes(readSources());
    const unreachable = publicComponents.filter(
      (name) => !reachable.has(name) && !(name in HOST_MOUNTED)
    );
    expect(unreachable).toEqual([]);
  });

  it("keeps the host-mounted list free of names a route does mount", () => {
    const reachable = reachableFromRoutes(readSources());
    const stale = Object.keys(HOST_MOUNTED).filter((name) => reachable.has(name));
    expect(stale).toEqual([]);
  });

  it("keeps the host-mounted list free of names the package no longer exports", () => {
    const gone = Object.keys(HOST_MOUNTED).filter(
      (name) => !publicComponents.includes(name)
    );
    expect(gone).toEqual([]);
  });

  it("states the same host-mounted list in docs/host-integration.md", () => {
    // The consumer-visible half of this gate. `S2-02` happened because the doc
    // called the bulk editor host-mounted while the host mounted starter routes
    // only; the two statements must be one statement.
    const doc = readFileSync(join(root, "docs", "host-integration.md"), "utf8");
    const section = doc.split("### 6.1 Exports no starter route mounts")[1] ?? "";
    const listed = [...section.split("\n---")[0].matchAll(/^\| `([A-Za-z0-9_]+)` \|/gm)].map(
      (match) => match[1]
    );
    expect(listed.sort()).toEqual(Object.keys(HOST_MOUNTED).sort());
  });

  it("reports a panel that loses its only mount", () => {
    // The discrimination this file exists for, run against the `S2-02` shape:
    // with the bulk editor unmounted from the matrix route, and nothing else
    // changed, it must fall out of the reachable set.
    const view = "src/runtime/react/default-ui/process-crud/group-subjects/index.tsx";
    const original = readFileSync(join(root, view), "utf8");
    expect(original).toContain("<GroupSubjectBulkEditor");

    const unmounted = readSources({
      [view]: original.replaceAll("<GroupSubjectBulkEditor", "<UnmountedPlaceholder")
    });
    const reachable = reachableFromRoutes(unmounted);
    expect(reachable.has("GroupSubjectBulkEditor")).toBe(false);
    // Everything else the route mounts is still reached, so the failure would
    // name the panel rather than collapse the whole walk.
    expect(reachable.has("GroupSubjectMatrixList")).toBe(true);
    expect(reachable.has("GroupSubjectCellForm")).toBe(true);
  });
});
