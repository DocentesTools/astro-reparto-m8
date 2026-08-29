/**
 * Contract-table gate (`W7.2`).
 *
 * `src/runtime/compatibility.ts` is this plugin's statement of what it believes
 * the service serves. Nothing compared it with either side of that claim, and
 * the cost was visible: `W1.4` added the two teacher-profile claim operations,
 * shipped wrappers that call them, and left the table silent about both. The
 * plugin was calling endpoints its own compatibility statement did not declare.
 *
 * Two directions, because only one of them had ever been checked by anything:
 *
 *   declared-is-served   every operation in the table appears in the service's
 *                        own published surface. The service's drift gate
 *                        (`reparto-docente-m8/tests/test_served_api_surface.py`)
 *                        already refuses a route added, removed or re-verbed
 *                        there; this is the consumer half it was written for.
 *   wrapper-is-declared  every `request({ method, path })` under
 *                        `src/runtime/api/` appears in the table. This is the
 *                        direction that failed: a wrapper is what actually goes
 *                        on the wire, and the table is the only thing a host
 *                        can read before installing.
 *
 * **Standalone by construction.** The plugin must stay installable and
 * verifiable with no sibling checkout, so this gate never reads across
 * repositories. It reads `contract/served-api-surface.json`, a tracked copy of
 * the service's artifact refreshed by `npm run refresh:served-surface` — the
 * same shape, and the same deliberate-act-with-a-reviewable-diff rule, as the
 * artifact it is copied from.
 *
 * The path reader is static and **fails closed**. A path it cannot resolve to a
 * literal is reported as a violation rather than skipped: a gate that quietly
 * drops the wrappers it does not understand is the exact failure this one
 * exists to remove.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));

const CONFIG = {
  /** Compiled contract table, read after `npm run build`. */
  compatibilityModule: "dist/src/runtime/compatibility.js",
  /** Vendored copy of the service's own published surface. */
  surfaceFixture: "contract/served-api-surface.json",
  /** Wrapper tree, scanned for the operations it puts on the wire. */
  apiDir: "src/runtime/api",
  /** Aggregator only; it declares no operation of its own. */
  apiIndex: "index.ts",
  /** Named script that refreshes the fixture, quoted in every failure. */
  refreshCommand: "npm run refresh:served-surface",
};

const failures = [];
const fail = (gate, where, detail) => failures.push({ gate, where, detail });

const read = (file) => readFileSync(join(ROOT, file), "utf8");

/**
 * A wrapper's path argument, resolved to the literal the service publishes.
 *
 * Three forms appear in the tree and all three are resolved rather than
 * special-cased away: a plain string, a template literal, and `+`-joined
 * template literals split across lines to stay inside the line length. A
 * `${...}` hole is either a bare identifier — a path parameter, rendered as
 * the snake_case name the service declares — or a call to a module-local path
 * helper, which is inlined with its arguments bound positionally.
 *
 * Anything else returns `null` and is reported by the caller.
 */
function resolvePath(expression, helpers) {
  const segments = [...expression.matchAll(/`([^`]*)`/g)].map((match) => match[1]);
  if (segments.length === 0) {
    const literal = expression.match(/^\s*"([^"]*)"\s*$/);
    return literal ? literal[1] : null;
  }
  // A `+` join is a single path split for line length, so the segments
  // concatenate in source order.
  let path = segments.join("");
  // Helper calls first: their own template can contain parameter holes, which
  // the identifier pass below then renders.
  path = path.replace(/\$\{([A-Za-z_$][\w$]*)\(([^)]*)\)\}/g, (whole, name, argumentList) => {
    const helper = helpers.get(name);
    if (!helper) return whole;
    const args = argumentList.split(",").map((argument) => argument.trim());
    let expanded = helper.template;
    helper.parameters.forEach((parameter, index) => {
      const argument = args[index];
      if (argument === undefined) return;
      expanded = expanded.split(`\${${parameter}}`).join(`\${${argument}}`);
    });
    return expanded;
  });
  path = path.replace(/\$\{([A-Za-z_$][\w$]*)\}/g, (_, identifier) =>
    `{${identifier.replace(/[A-Z]/g, (character) => `_${character.toLowerCase()}`)}}`,
  );
  // A hole that survived both passes was neither a parameter nor a resolvable
  // helper, so the literal is unknown and the caller must say so.
  return path.includes("${") ? null : path;
}

/**
 * Module-local path helpers, as `name -> { parameters, template }`.
 *
 * Only the single-template arrow form is recognised, which is the one the tree
 * uses (`selectionTurns.ts`). A helper written any other way simply is not
 * found, and the wrapper that calls it fails to resolve — reported, not
 * skipped.
 */
function pathHelpers(source) {
  const helpers = new Map();
  const pattern = /const\s+([A-Za-z_$][\w$]*)\s*=\s*\(([^)]*)\)\s*=>\s*\n?\s*`([^`]*)`/g;
  for (const match of source.matchAll(pattern)) {
    const parameters = match[2]
      .split(",")
      .map((parameter) => parameter.trim().split(":")[0].trim())
      .filter(Boolean);
    helpers.set(match[1], { parameters, template: match[3] });
  }
  return helpers;
}

/** Every `request({ method, path })` the wrapper tree puts on the wire. */
function wrapperOperations() {
  const operations = [];
  const files = readdirSync(join(ROOT, CONFIG.apiDir))
    .filter((name) => name.endsWith(".ts") && name !== CONFIG.apiIndex)
    .sort();

  for (const name of files) {
    const file = `${CONFIG.apiDir}/${name}`;
    const source = read(file);
    const helpers = pathHelpers(source);
    const group = name.replace(/\.ts$/, "");

    // Non-greedy to the first `})`. The tree writes these calls both across
    // several lines and on one (`classroomStages.ts`), so the closing brace
    // cannot be anchored to a newline.
    for (const call of source.matchAll(/request<[^>]*>\(\{([\s\S]*?)\}\)/g)) {
      const body = call[1];
      // The wrapper's own name, for a failure a reader can act on: the nearest
      // member key declared above this call site.
      const preceding = [...source.slice(0, call.index).matchAll(/\n {2}([A-Za-z][\w$]*):/g)].pop();
      const operation = `${group}.${preceding ? preceding[1] : "?"}`;
      const where = `${file}:${operation}`;

      const method = body.match(/method:\s*"([A-Z]+)"/)?.[1];
      if (!method) {
        fail("wrapper-is-declared", where, "no literal `method:` on the request call");
        continue;
      }
      // Up to the comma that introduces the next option (`body`, `query`,
      // `schema`, `auth`), so a path split across lines is captured whole.
      const expression = body.match(/path:\s*([\s\S]*?),\s*(?=[A-Za-z]+\s*:)/)?.[1];
      if (expression === undefined) {
        fail("wrapper-is-declared", where, "no `path:` on the request call");
        continue;
      }
      const path = resolvePath(expression, helpers);
      if (path === null) {
        fail(
          "wrapper-is-declared",
          where,
          `the path does not resolve to a literal: ${expression.replace(/\s+/g, " ").trim()}`,
        );
        continue;
      }
      operations.push({ operation, method, path, where });
    }
  }
  return operations;
}

const surface = JSON.parse(read(CONFIG.surfaceFixture));
const compatibility = await import(
  pathToFileURL(join(ROOT, ...CONFIG.compatibilityModule.split("/"))).href
).catch(() => null);

if (!compatibility?.REPARTO_CONTRACT_OPERATIONS) {
  console.error(
    `[verify-contract-operations] ${CONFIG.compatibilityModule} is missing or exports no ` +
      "REPARTO_CONTRACT_OPERATIONS; run `npm run build` before this gate",
  );
  process.exit(1);
}

const declared = compatibility.REPARTO_CONTRACT_OPERATIONS;
const contractVersion = compatibility.REPARTO_CONTRACT_VERSION;

/**
 * The fixture has to be the surface of the contract this plugin declares.
 *
 * Without this the two directions below would still pass while comparing the
 * table against some other version's surface, which is a green gate that
 * checked nothing — the shape `verify-registry-drift` guards against in its own
 * tracked-path check.
 */
if (surface.contract !== contractVersion) {
  fail(
    "fixture-is-current",
    CONFIG.surfaceFixture,
    `records the ${surface.contract} surface, but this plugin declares ${contractVersion}; ` +
      `refresh it with \`${CONFIG.refreshCommand}\``,
  );
}

const servedPaths = new Set(surface.operations);
const prefix = surface.api_prefix;

for (const [name, operation] of Object.entries(declared)) {
  // The SSE stream is declared as an operation but is read by `EventSource`,
  // not by the fetch client; it is served all the same, so it is checked here
  // like any other and simply has no wrapper for the reverse direction.
  const served = `${operation.method} ${prefix}${operation.path}`;
  if (!servedPaths.has(served)) {
    fail(
      "declared-is-served",
      name,
      `declares \`${served}\`, which ${surface.contract} does not serve`,
    );
  }
}

const declaredPaths = new Map(
  Object.entries(declared).map(([name, operation]) => [
    `${operation.method} ${operation.path}`,
    name,
  ]),
);

for (const { method, path, where } of wrapperOperations()) {
  if (!declaredPaths.has(`${method} ${path}`)) {
    fail(
      "wrapper-is-declared",
      where,
      `calls \`${method} ${path}\`, which REPARTO_CONTRACT_OPERATIONS does not declare`,
    );
  }
}

if (failures.length > 0) {
  console.error(`[verify-contract-operations] ${failures.length} violation(s):`);
  for (const { gate, where, detail } of failures) {
    console.error(`  ${gate}: ${where} — ${detail}`);
  }
  process.exit(1);
}

console.log(
  `[verify-contract-operations] ${Object.keys(declared).length} declared operation(s) are all ` +
    `served by ${surface.contract}, and every wrapper under ${CONFIG.apiDir} is declared`,
);
