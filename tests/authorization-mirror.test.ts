import { describe, expect, it } from "vitest";

import {
  hasMinimumRole as sharedHasMinimumRole,
  hasSuperuserPrivileges as sharedHasSuperuserPrivileges,
  ORDERED_ROLES as SHARED_ORDERED_ROLES,
  privilegeClaimsAreConsistent as sharedPrivilegeClaimsAreConsistent
} from "@mano8/astro-auth-m8/authorization";

import {
  hasMinimumRole,
  hasSuperuserPrivileges,
  ORDERED_ROLES,
  privilegeClaimsAreConsistent,
  type RepartoRole
} from "../src/runtime/authAdapter.js";

/**
 * `authAdapter.ts` mirrors `@mano8/astro-auth-m8/authorization`, which mirrors
 * `auth_sdk_m8/authorization.py`. This file is what makes that a mirror rather
 * than a second opinion (`RBAC-06`).
 *
 * It exists because the two cannot simply be one import: the fleet's
 * `no-cross-plugin-import` gate (`C12`) forbids a business plugin importing
 * another at runtime, and `src/` is what that gate scans. `tests/` is not, so
 * the agreement is proven here instead — exhaustively, not by spot check, so
 * any divergence in order, in the hierarchy comparison or in the role/flag
 * truth table fails the build on the next run.
 *
 * If the gate is ever widened for a pure authorization module, or these
 * primitives move to the shared layer, the local copy goes and this file goes
 * with it.
 */
describe("role authorization mirrors the auth peer exactly", () => {
  it("orders the roles identically", () => {
    expect([...ORDERED_ROLES]).toEqual([...SHARED_ORDERED_ROLES]);
  });

  it("answers hasMinimumRole identically for all 25 role pairs", () => {
    for (const held of ORDERED_ROLES) {
      for (const required of ORDERED_ROLES) {
        expect(
          hasMinimumRole(held, required),
          `${held} >= ${required}`
        ).toBe(sharedHasMinimumRole(held, required));
      }
    }
  });

  it("answers the claim truth table identically for all 10 role/flag pairs", () => {
    for (const role of ORDERED_ROLES) {
      for (const isSuperuser of [true, false]) {
        expect(
          privilegeClaimsAreConsistent(role, isSuperuser),
          `${role}/${isSuperuser}`
        ).toBe(sharedPrivilegeClaimsAreConsistent(role, isSuperuser));
        expect(
          hasSuperuserPrivileges(role, isSuperuser),
          `${role}/${isSuperuser}`
        ).toBe(sharedHasSuperuserPrivileges(role, isSuperuser));
      }
    }
  });

  it("fails closed on an unrecognised role in both implementations", () => {
    const ghost = "ghost" as RepartoRole;
    expect(hasMinimumRole(ghost, "user")).toBe(sharedHasMinimumRole(ghost, "user"));
    expect(hasMinimumRole(ghost, "user")).toBe(false);
    expect(privilegeClaimsAreConsistent(ghost, true)).toBe(
      sharedPrivilegeClaimsAreConsistent(ghost, true)
    );
    expect(privilegeClaimsAreConsistent(ghost, false)).toBe(
      sharedPrivilegeClaimsAreConsistent(ghost, false)
    );
    expect(hasSuperuserPrivileges(ghost, true)).toBe(false);
  });
});
