// Headless standalone smoke for the published tarball (`C12`).
//
// This file is compiled *and executed* against an installed
// `@mano8/astro-reparto-m8`, in a throwaway directory that has no workspace
// checkout above it — which is the point: `STANDALONE-CHILD-USABILITY` says the
// child must work with nothing but its own tarball. It touches only the
// headless subpaths, so it needs no React, no Astro and no running service.
import {
  REPARTO_CONTRACT_VERSION,
  assertRepartoCompatibility
} from "@mano8/astro-reparto-m8/compatibility";
import {
  addHours,
  compareHours,
  normalizeHours,
  parseHoursField
} from "@mano8/astro-reparto-m8/decimals";
import {
  canActOnRepartoRoute,
  canViewRepartoRoute,
  repartoRouteAccess
} from "@mano8/astro-reparto-m8/route-access";
import { buildRepartoRoutes } from "@mano8/astro-reparto-m8/routes";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[tarball-consumer] ${message}`);
}

// The contract the package declares must match what package.json publishes, or
// a consumer's compatibility check is asserting against a stale constant.
assert(
  REPARTO_CONTRACT_VERSION === "reparto-docente-m8@2.0.0",
  `unexpected contract: ${REPARTO_CONTRACT_VERSION}`
);

// A service inside the supported contract is accepted; a sibling M8 service
// serving the same payload shape has to be named rather than blessed.
assertRepartoCompatibility({
  service: "reparto-docente-m8",
  version: "2.0.0",
  contract: { name: "reparto-docente-m8", version: "2.0.0" }
});
let rejectedSibling = false;
try {
  assertRepartoCompatibility({
    service: "media-service-m8",
    version: "2.0.0",
    contract: { name: "media-service-m8", version: "2.0.0" }
  });
} catch {
  rejectedSibling = true;
}
assert(rejectedSibling, "a sibling service's /meta was not rejected");

// The canonical two-decimal hour representation survives the build. This is the
// package's own rule — no hour value is ever compared in binary floating point
// — so it has to hold in the installed package and not only in the repository.
assert(normalizeHours("1.1") === "1.10", `hour normalisation drifted: ${normalizeHours("1.1")}`);
let rejectedThirdDecimal = false;
try {
  normalizeHours("1.005");
} catch {
  rejectedThirdDecimal = true;
}
assert(rejectedThirdDecimal, "a third decimal place was silently rounded instead of refused");
assert(addHours("0.1", "0.2") === "0.30", `hour addition drifted: ${addHours("0.1", "0.2")}`);
assert(compareHours("1.10", "1.1") === 0, "equal hours did not compare equal");
assert(parseHoursField("").state === "unset", "an empty hour input was not read as unset");
const zeroHours = parseHoursField("0");
assert(
  zeroHours.state === "valid" && zeroHours.hours === "0.00",
  "a zero hour input was not distinguished from unset"
);
assert(parseHoursField("1.005").state === "invalid", "a third decimal place was accepted");

// The one route-to-role map: `reader` sees everything, and write affordances
// need `admin` outside the two own-data routes.
const reader = { id: "r", role: "reader" as const, is_superuser: false };
const admin = { id: "a", role: "admin" as const, is_superuser: false };
assert(canViewRepartoRoute(reader, "processList"), "a reader cannot see the process list");
assert(!canViewRepartoRoute(null, "processList"), "a signed-out visitor can see the process list");
assert(!canActOnRepartoRoute(reader, "schools"), "a reader holds a write affordance on schools");
assert(canActOnRepartoRoute(admin, "schools"), "an admin holds no write affordance on schools");
assert(
  repartoRouteAccess("teacherView").act === "writer",
  "the own-data route's write floor is not writer"
);

// The starter route map is buildable from the installed package and does not
// collide with itself.
const routes = buildRepartoRoutes();
const patterns = Object.values(routes).filter(
  (pattern): pattern is string => typeof pattern === "string"
);
assert(patterns.length > 0, "the installed route builder produced no routes");
assert(
  new Set(patterns).size === patterns.length,
  `the default route map collides with itself: ${patterns.join(", ")}`
);

console.log("[tarball-consumer] installed package passed the headless smoke");
