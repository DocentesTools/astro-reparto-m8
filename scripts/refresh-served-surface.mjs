/**
 * Refresh the vendored copy of the service's served surface (`W7.2`).
 *
 * `contract/served-api-surface.json` is `reparto-docente-m8`'s own artifact,
 * copied in. It is vendored rather than read across repositories because this
 * plugin has to stay installable and verifiable with no sibling checkout: the
 * gate that consumes it (`npm run verify:contract-operations`) runs from a
 * bare `npm ci` of this repository alone.
 *
 * Copying is a deliberate act with a reviewable diff, which is the same rule
 * the service applies to producing the artifact in the first place. A service
 * route added, removed or re-verbed reaches this plugin only when someone runs
 * this script, and the diff is what they review.
 *
 *     npm run refresh:served-surface
 *     REPARTO_SERVICE_PATH=../elsewhere/reparto-docente-m8 npm run refresh:served-surface
 *
 * The default location is the sibling checkout, which is where the workspace
 * puts it. Nothing here requires that workspace to exist — with no checkout
 * found the script says so and changes nothing, leaving the tracked fixture
 * (and therefore the gate) exactly as it was.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));

const FIXTURE = join(ROOT, "contract", "served-api-surface.json");
const SOURCE_ARTIFACT = join("docs", "served-api-surface.json");
const DEFAULT_SERVICE_PATH = join("..", "reparto-docente-m8");
const ENV_VAR = "REPARTO_SERVICE_PATH";

const configured = process.env[ENV_VAR] ?? DEFAULT_SERVICE_PATH;
const servicePath = isAbsolute(configured) ? configured : resolve(ROOT, configured);
const source = join(servicePath, SOURCE_ARTIFACT);

if (!existsSync(source)) {
  console.error(`[refresh-served-surface] no service artifact at ${source}`);
  console.error(
    `  Point ${ENV_VAR} at a reparto-docente-m8 checkout, or leave the tracked fixture as it is —`,
  );
  console.error("  this package does not require a sibling checkout to build, test or verify.");
  process.exit(1);
}

const artifact = readFileSync(source, "utf8");
const parsed = JSON.parse(artifact);
for (const key of ["contract", "contract_range", "api_prefix", "operations"]) {
  if (!(key in parsed)) {
    console.error(`[refresh-served-surface] ${source} has no \`${key}\`; refusing to vendor it`);
    process.exit(1);
  }
}

const before = existsSync(FIXTURE) ? readFileSync(FIXTURE, "utf8") : null;
if (before === artifact) {
  console.log(`[refresh-served-surface] already current at ${parsed.contract}`);
  process.exit(0);
}

writeFileSync(FIXTURE, artifact, "utf8");
console.log(
  `[refresh-served-surface] vendored ${parsed.operations.length} operation(s) from ` +
    `${parsed.contract}; review the diff and commit it`,
);
