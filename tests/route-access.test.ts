import { describe, expect, it } from "vitest";

import {
  REPARTO_ROUTE_ACCESS,
  canActOnRepartoRoute,
  canViewRepartoRoute,
  repartoRouteAccess
} from "../src/runtime/routeAccess.js";
import { buildRepartoRoutes, type RepartoRouteName } from "../src/runtime/routes.js";
import {
  ORDERED_ROLES,
  type RepartoCurrentUser,
  type RepartoRole
} from "../src/runtime/authAdapter.js";

/**
 * The §8.1 route map against the §21.1 role/capability table.
 *
 * This file holds the map itself; `route-gating.test.tsx` holds what the views
 * do with it. The two are deliberately separate — the map is the claim, and it
 * should be readable and provable without mounting React.
 */

/**
 * A session on one of the five canonical rows of the role/flag truth table.
 *
 * `is_superuser` follows the role because no other pairing is issuable: the
 * SDK's `UserModel` rejects a disagreeing pair outright. The last case below
 * asks for a disagreeing one deliberately.
 */
function who(role: RepartoRole, is_superuser = role === "superadmin"): RepartoCurrentUser {
  return { id: "user-1", role, is_superuser };
}

const ROUTES = Object.keys(REPARTO_ROUTE_ACCESS) as RepartoRouteName[];

describe("reparto route access map", () => {
  it("covers exactly the built route set, with no route left ungated", () => {
    expect(ROUTES.sort()).toEqual(
      (Object.keys(buildRepartoRoutes()) as RepartoRouteName[]).sort()
    );
  });

  it("puts every route's read floor at READER — no route is open to USER", () => {
    for (const route of ROUTES) {
      expect(repartoRouteAccess(route).view, route).toBe("reader");
      expect(canViewRepartoRoute(who("user"), route), route).toBe(false);
      expect(canViewRepartoRoute(who("reader"), route), route).toBe(true);
    }
  });

  it("puts every write floor at ADMIN except the two own-data routes", () => {
    const writerRoutes = ROUTES.filter(
      (route) => REPARTO_ROUTE_ACCESS[route].act === "writer"
    );
    expect(writerRoutes.sort()).toEqual(["teacherRoster", "teacherView"]);
    for (const route of ROUTES) {
      if (writerRoutes.includes(route)) continue;
      expect(repartoRouteAccess(route).act, route).toBe("admin");
    }
  });

  it("never lets a route act below the role it lets view", () => {
    for (const route of ROUTES) {
      const { act, view } = repartoRouteAccess(route);
      // `ORDERED_ROLES` runs highest privilege first, so the more privileged
      // floor is the one with the lower index.
      expect(
        ORDERED_ROLES.indexOf(act) <= ORDERED_ROLES.indexOf(view),
        route
      ).toBe(true);
    }
  });

  it("answers the §21.1 matrix for every role on every route", () => {
    const expected: Record<RepartoRole, { view: boolean; adminAct: boolean; writerAct: boolean }> = {
      user: { view: false, adminAct: false, writerAct: false },
      reader: { view: true, adminAct: false, writerAct: false },
      writer: { view: true, adminAct: false, writerAct: true },
      admin: { view: true, adminAct: true, writerAct: true },
      superadmin: { view: true, adminAct: true, writerAct: true }
    };
    for (const role of ORDERED_ROLES) {
      for (const route of ROUTES) {
        const answer = expected[role];
        expect(canViewRepartoRoute(who(role), route), `${role}/${route}`).toBe(
          answer.view
        );
        expect(canActOnRepartoRoute(who(role), route), `${role}/${route}`).toBe(
          REPARTO_ROUTE_ACCESS[route].act === "writer"
            ? answer.writerAct
            : answer.adminAct
        );
      }
    }
  });

  it("refuses a disagreeing role/is_superuser pair, and every absent session", () => {
    // The role decides, and the pair must be one the platform can issue. A
    // `USER` carrying the flag is not a superadmin the service would honour —
    // it is a token `UserModel` refuses to validate at all — so the client
    // offers it nothing rather than affordances that come back 403.
    expect(canActOnRepartoRoute(who("user", true), "planning")).toBe(false);
    expect(canViewRepartoRoute(who("user", true), "dashboard")).toBe(false);
    // The mirror case: a `superadmin` whose flag disagrees is refused too.
    expect(canActOnRepartoRoute(who("superadmin", false), "planning")).toBe(false);
    expect(canViewRepartoRoute(null, "dashboard")).toBe(false);
    expect(canActOnRepartoRoute(undefined, "teacherView")).toBe(false);
  });
});
