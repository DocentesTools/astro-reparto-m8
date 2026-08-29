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
 * It is `admin` on the eight routes whose *data* is department-head-only
 * (remediation `W5.3`, extended by `W7.1`). `GET …/dashboard` and
 * `GET …/teachers` carry the confidentiality tier §20.25 calls department-head
 * — every participant's hours, the validation findings that name them, and the
 * head's written extra-hours reason — and the service answers `403` below
 * `ADMIN` on both. `W7.1` then settled the reads of that same tier served
 * *after the fact*: the two validation reports, the stored audit trail, the
 * version list with both comparison routes, and the export inventory. A `view`
 * floor left at `reader` on any of them would render a shell around a refused
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
 * `view` is `admin` on eight routes. Four are built on `GET …/dashboard` or
 * `GET …/teachers`, which the service serves to an administrator only
 * (`W5.3`): `dashboard`, `meeting`, `participants` and `assignments`. Four more
 * read the same tier after the fact (`W7.1`): `planning` reads
 * `GET …/teaching-plan/validations`, `audit` reads `GET …/audit-events/`,
 * `versions` reads `GET …/versions` and `GET …/compare-previous-year`, and
 * `exports` reads `GET …/exports`. The teacher's own route reads `…/lan/me` and
 * the projected screen reads `…/summary` — neither carries another
 * participant's figures, so both stay at `reader`.
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
  // `useRepartoProcessVersions` / `useRepartoExportArtifacts` — a snapshot is a
  // whole-process dump carrying `extra_hours_reason`, and the artefact list
  // inventories what was built from it (`W7.1`).
  versions: { view: "admin", act: "admin" },
  exports: { view: "admin", act: "admin" },
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
  // `useRepartoTeachingPlanValidations` — since `W5.1` every finding names the
  // participant it is about and quotes their hours (`W7.1`). The nameless
  // readiness counts live on `sharedScreen`, which reads `…/summary`.
  planning: { view: "admin", act: "admin" },
  requirements: { view: "reader", act: "admin" },
  // `useRepartoProcessTeachers` — every participant's hours and the
  // extra-hours reason (`W5.3`); the assignment board reads the same roster
  // alongside the feasibility witness, which was already admin-only.
  participants: { view: "admin", act: "admin" },
  assignments: { view: "admin", act: "admin" },
  // `useRepartoAuditEvents` — the extra-hours event is stored with the head's
  // written `reason` beside that participant's hours, which the SSE teacher
  // tier withholds even about the viewer themselves (`W7.1`).
  audit: { view: "admin", act: "admin" }
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
