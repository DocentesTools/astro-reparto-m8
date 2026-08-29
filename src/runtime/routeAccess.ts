import {
  sessionHasMinimumRole,
  type RepartoCurrentUser,
  type RepartoRole
} from "./authAdapter.js";
import type { RepartoRouteName } from "./routes.js";

/**
 * The two floors every reparto route carries.
 *
 * `view` is the minimum role that may see the route at all. It is `reader` on
 * most routes — the service gates every read at `>= READER` (plan §21.4), so a
 * `USER`-role session — a valid platform identity with zero capability in this
 * application (§21.1) — renders no reparto view, and an unidentified session
 * renders none either.
 *
 * It is `admin` on the four routes whose *data* is department-head-only
 * (remediation `W5.3`). `GET …/dashboard` and `GET …/teachers` carry the
 * confidentiality tier §20.25 calls department-head — every participant's
 * hours, the validation findings that name them, and the head's written
 * extra-hours reason — and the service now answers `403` below `ADMIN` on both.
 * A `view` floor left at `reader` there would render a shell around a refused
 * request, which is the same mistake as offering an affordance the backend
 * refuses, one layer up.
 *
 * `act` is the minimum role at which the route's write affordances may appear.
 * It mirrors the service's own gate on the mutations the route issues, so a
 * control is offered only where the request behind it would be accepted: an
 * affordance the backend would refuse is worse than no affordance at all.
 */
export type RepartoRouteAccess = {
  view: RepartoRole;
  act: RepartoRole;
};

/**
 * The §8.1 route map, each route against the role it requires.
 *
 * `view` is `admin` on `dashboard`, `meeting`, `participants` and `assignments`
 * — the four routes built on `GET …/dashboard` or `GET …/teachers`, both of
 * which the service serves to an administrator only (`W5.3`). The teacher's own
 * route reads `…/lan/me` and the projected screen reads `…/summary`, so both
 * stay at `reader`.
 *
 * `act` is `admin` on every department-head and platform-setup route (§21.2:
 * department-head authority is `ADMIN`/`SUPERADMIN` and nothing else), and
 * `writer` on exactly the two routes that carry own-data actions (§21.3):
 *
 * * `teacherView` — the caller's own direct selection (`POST
 *   /assignments/direct-choice`) and their own turn (`start`/`complete`/`skip`);
 * * `teacherRoster` — the caller's own `TeacherProfile` (`PATCH
 *   /teacher-profiles/{id}`), whose per-row ownership check is applied by the
 *   view on top of this floor; creating, linking and deleting a profile stay
 *   `admin`.
 *
 * A `writer` floor is a floor, not a grant: it says the tier may hold such an
 * affordance at all, never that this particular record is theirs.
 */
export const REPARTO_ROUTE_ACCESS: Record<RepartoRouteName, RepartoRouteAccess> = {
  // `useRepartoDashboard` — the department-head payload (`W5.3`).
  dashboard: { view: "admin", act: "admin" },
  meeting: { view: "admin", act: "admin" },
  processList: { view: "reader", act: "admin" },
  teacherView: { view: "reader", act: "writer" },
  sharedScreen: { view: "reader", act: "admin" },
  versions: { view: "reader", act: "admin" },
  exports: { view: "reader", act: "admin" },
  schools: { view: "reader", act: "admin" },
  academicYears: { view: "reader", act: "admin" },
  departments: { view: "reader", act: "admin" },
  teacherRoster: { view: "reader", act: "writer" },
  subjects: { view: "reader", act: "admin" },
  teachingGroups: { view: "reader", act: "admin" },
  classroomStages: { view: "reader", act: "admin" },
  groupSubjects: { view: "reader", act: "admin" },
  processSettings: { view: "reader", act: "admin" },
  allocation: { view: "reader", act: "admin" },
  planning: { view: "reader", act: "admin" },
  requirements: { view: "reader", act: "admin" },
  // `useRepartoProcessTeachers` — every participant's hours and the
  // extra-hours reason (`W5.3`); the assignment board reads the same roster
  // alongside the feasibility witness, which was already admin-only.
  participants: { view: "admin", act: "admin" },
  assignments: { view: "admin", act: "admin" },
  audit: { view: "reader", act: "admin" }
};

export function repartoRouteAccess(route: RepartoRouteName): RepartoRouteAccess {
  return REPARTO_ROUTE_ACCESS[route];
}

/** Whether the signed-in user may see `route` at all. */
export function canViewRepartoRoute(
  user: RepartoCurrentUser | null | undefined,
  route: RepartoRouteName
): boolean {
  return sessionHasMinimumRole(user, REPARTO_ROUTE_ACCESS[route].view);
}

/**
 * Whether the signed-in user's tier may hold `route`'s write affordances.
 *
 * Ownership is a separate question and is not answered here: a `writer` clears
 * `teacherRoster`'s floor, and the roster view still shows the edit control on
 * their own row only.
 */
export function canActOnRepartoRoute(
  user: RepartoCurrentUser | null | undefined,
  route: RepartoRouteName
): boolean {
  return sessionHasMinimumRole(user, REPARTO_ROUTE_ACCESS[route].act);
}
