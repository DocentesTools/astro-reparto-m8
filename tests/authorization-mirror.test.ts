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
  sessionHasMinimumRole,
  type RepartoRole
} from "../src/runtime/authAdapter.js";

/**
 * `RBAC-06` — one role hierarchy — is now met by an import, not by a mirror.
 *
 * Until 2026-08-29 `authAdapter.ts` re-implemented the hierarchy because the
 * fleet's `no-cross-plugin-import` gate (`C12`) refused the import, and this
 * file proved the copy agreed with `@mano8/astro-auth-m8/authorization` across
 * every role pair and every role/flag pair. Decision 4 widened the gate for
 * that one pure, framework-neutral specifier, so the copy is deleted.
 *
 * What is worth gating now is not agreement but **identity**: that the package
 * still re-exports the peer's own bindings and has not quietly grown a second
 * implementation that merely behaves the same today. `toBe` is the whole point
 * here — a re-fork would still pass a behavioural comparison on the day it
 * landed, and fail this.
 *
 * The behavioural truth table itself is the peer's to test, and it does
 * (`astro-auth-m8/tests/authorization.test.ts`); what stays here is the one
 * predicate this package adds on top, `sessionHasMinimumRole`.
 */
describe("the role hierarchy is the auth peer's, by identity", () => {
  it("re-exports the peer's ORDERED_ROLES, not a copy of it", () => {
    expect(ORDERED_ROLES).toBe(SHARED_ORDERED_ROLES);
  });

  it("re-exports the peer's three predicates, not copies of them", () => {
    expect(hasMinimumRole).toBe(sharedHasMinimumRole);
    expect(privilegeClaimsAreConsistent).toBe(sharedPrivilegeClaimsAreConsistent);
    expect(hasSuperuserPrivileges).toBe(sharedHasSuperuserPrivileges);
  });
});

describe("sessionHasMinimumRole, the seam this package adds", () => {
  it("fails closed on no session and on an unresolved one", () => {
    expect(sessionHasMinimumRole(null, "user")).toBe(false);
    expect(sessionHasMinimumRole(undefined, "user")).toBe(false);
  });

  it("answers the imported hierarchy for every consistent role pair", () => {
    for (const role of ORDERED_ROLES) {
      const is_superuser = role === "superadmin";
      for (const minimum of ORDERED_ROLES) {
        expect(
          sessionHasMinimumRole({ id: "u", role, is_superuser }, minimum),
          `${role} >= ${minimum}`
        ).toBe(hasMinimumRole(role, minimum));
      }
    }
  });

  it("refuses a session whose role and flag disagree, in both directions", () => {
    expect(sessionHasMinimumRole({ id: "u", role: "admin", is_superuser: true }, "user")).toBe(
      false
    );
    expect(
      sessionHasMinimumRole({ id: "u", role: "superadmin", is_superuser: false }, "user")
    ).toBe(false);
  });

  it("fails closed on a role the client does not recognise", () => {
    const ghost = "ghost" as RepartoRole;
    expect(sessionHasMinimumRole({ id: "u", role: ghost, is_superuser: false }, "user")).toBe(
      false
    );
  });
});
