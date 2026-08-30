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

/**
 * The eight routes whose data is the department-head tier.
 *
 * The live four (`W5.3`): `dashboard` and `meeting` read `GET …/dashboard`;
 * `participants` and `assignments` read `GET …/teachers`.
 *
 * The after-the-fact four (`W7.1`): `planning` reads
 * `GET …/teaching-plan/validations`, whose messages have named the participant
 * a finding is about since `W5.1`; `audit` reads `GET …/audit-events/`, whose
 * extra-hours event carries the head's written `reason` beside that
 * participant's hours; `versions` reads `GET …/versions` and
 * `GET …/compare-previous-year`, both whole-process snapshots; `exports` reads
 * `GET …/exports`, the inventory built from all of it.
 *
 * The service answers `403` below `ADMIN` on every one, so a `reader` floor
 * here would render a shell around a refused request.
 */
const ADMIN_VIEW_ROUTES: RepartoRouteName[] = [
  "assignments",
  "audit",
  "dashboard",
  "exports",
  "meeting",
  "participants",
  "planning",
  "versions"
];

describe("reparto route access map", () => {
  it("covers exactly the built route set, with no route left ungated", () => {
    expect(ROUTES.sort()).toEqual(
      (Object.keys(buildRepartoRoutes()) as RepartoRouteName[]).sort()
    );
  });

  it("opens no route to USER, and the department-head reads to no one below ADMIN", () => {
    for (const route of ROUTES) {
      const admin = ADMIN_VIEW_ROUTES.includes(route);
      expect(repartoRouteAccess(route).view, route).toBe(admin ? "admin" : "reader");
      expect(canViewRepartoRoute(who("user"), route), route).toBe(false);
      expect(canViewRepartoRoute(who("reader"), route), route).toBe(!admin);
      expect(canViewRepartoRoute(who("writer"), route), route).toBe(!admin);
      expect(canViewRepartoRoute(who("admin"), route), route).toBe(true);
    }
  });

  it("names the department-head-only routes explicitly, so a ninth cannot appear unnoticed", () => {
    const byMap = ROUTES.filter(
      (route) => REPARTO_ROUTE_ACCESS[route].view === "admin"
    );
    expect(byMap.sort()).toEqual([...ADMIN_VIEW_ROUTES].sort());
  });

  it("keeps the teacher and shared-screen routes at the reader floor", () => {
    // `teacherView` reads `…/lan/me` and `sharedScreen` reads `…/summary`.
    // Neither carries another participant's figures, so neither moved with
    // `W5.3` or `W7.1` — and narrowing that took either away would have cost a
    // screen. `sharedScreen` in particular is what keeps the planning
    // narrowing a tier decision rather than a loss of function: the nameless
    // readiness counts a participant actually needs are on `…/summary`.
    expect(repartoRouteAccess("teacherView").view).toBe("reader");
    expect(repartoRouteAccess("sharedScreen").view).toBe("reader");
    expect(canViewRepartoRoute(who("reader"), "teacherView")).toBe(true);
    expect(canViewRepartoRoute(who("reader"), "sharedScreen")).toBe(true);
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
          REPARTO_ROUTE_ACCESS[route].view === "admin"
            ? answer.adminAct
            : answer.view
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
