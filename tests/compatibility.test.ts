import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import {
  REPARTO_CONTRACT_VERSION,
  REPARTO_SERVICE_VERSION_RANGE,
  REPARTO_TESTED_SERVICE_VERSION
} from "../src/runtime/compatibility.js";

const packageJson = JSON.parse(
  readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../package.json"), "utf-8")
) as { repartoDocenteM8?: { contract?: string; testedServiceVersion?: string; serviceVersionRange?: string } };

describe("reparto-docente-m8 manifest/runtime parity", () => {
  // The `repartoDocenteM8` block is the published, machine-readable half of
  // the same claim `compatibility.ts` enforces at runtime: a host or a fleet
  // tool reads the package metadata, the browser preflight reads the
  // constants. Nothing else keeps the two halves together, so a contract or
  // service-version-range repoint that edited one and forgot the other would
  // ship a package that advertises a range it does not check. Pinned against
  // the constants rather than against literals so the next repoint has
  // exactly one place to edit. The client-side twin of `A30`
  // (`B12-manifest-runtime-parity-lock`).
  it("keeps the published repartoDocenteM8 package metadata identical to the constants", () => {
    expect(packageJson.repartoDocenteM8).toEqual({
      contract: REPARTO_CONTRACT_VERSION,
      testedServiceVersion: REPARTO_TESTED_SERVICE_VERSION,
      serviceVersionRange: REPARTO_SERVICE_VERSION_RANGE
    });
  });
});
