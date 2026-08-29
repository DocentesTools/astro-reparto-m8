export type RepartoAuthAdapter = {
  getAccessToken: () => string | null | Promise<string | null>;
  refresh?: () => string | null | Promise<string | null>;
  onUnauthenticated?: (reason: "unauthenticated" | "refresh-failed") => void;
  getCurrentUser?: () => RepartoCurrentUser | null | Promise<RepartoCurrentUser | null>;
};

/**
 * Roles ordered from **highest** to **lowest** privilege.
 *
 * A mirror of `auth_sdk_m8/authorization.py` — the canonical source both this
 * package and `@mano8/astro-auth-m8` answer to — reproduced here rather than
 * imported, and reproduced *exactly*: same order, same names, same signatures
 * as the peer's `@mano8/astro-auth-m8/authorization`. The fleet's
 * `no-cross-plugin-import` gate (`C12`, `scripts/verify-fleet-gates.mjs`)
 * forbids one business plugin importing another at runtime, which is what keeps
 * these packages independently installable, so the deletion `RBAC-06` asks for
 * cannot be a plain import today.
 *
 * What stands in for it is `tests/authorization-mirror.test.ts`: it imports the
 * peer's bindings and asserts agreement across every role pair and every
 * role/flag pair, so this file cannot drift from the peer — or, through it,
 * from the SDK — without failing the build. It is one hierarchy verified in two
 * places, not two opinions. Widening the fleet gate for a pure, framework-
 * neutral authorization module, or lifting these primitives into the shared
 * layer, would let the copy go; both are fleet-wide decisions.
 */
export const ORDERED_ROLES = [
  "superadmin",
  "admin",
  "writer",
  "reader",
  "user"
] as const;

export type RepartoRole = (typeof ORDERED_ROLES)[number];

/** The single role that carries superuser authority. */
const SUPERADMIN_ROLE: RepartoRole = "superadmin";

function isKnownRole(role: RepartoRole): boolean {
  return (ORDERED_ROLES as readonly string[]).includes(role);
}

/**
 * Whether `currentRole` meets or exceeds `requiredRole`.
 *
 * The one hierarchy comparison in the package (`RBAC-06`): no view re-derives
 * its own, and none compares roles by exact membership — exact membership hides
 * an admin surface from a superadmin. Returns `false` for an insufficient or
 * unrecognised role.
 */
export function hasMinimumRole(
  currentRole: RepartoRole,
  requiredRole: RepartoRole
): boolean {
  const current = ORDERED_ROLES.indexOf(currentRole);
  const required = ORDERED_ROLES.indexOf(requiredRole);
  if (current === -1 || required === -1) return false;
  return current <= required;
}

/**
 * Whether `role` and `isSuperuser` agree per the canonical truth table.
 *
 * ```text
 * role         is_superuser=false    is_superuser=true
 * user         valid, non-superuser  invalid
 * reader       valid, non-superuser  invalid
 * writer       valid, non-superuser  invalid
 * admin        valid, non-superuser  invalid
 * superadmin   invalid               valid superuser
 * ```
 *
 * Compared strictly rather than by truthiness, and an unrecognised role is not
 * one of the five rows, so it fails closed.
 */
export function privilegeClaimsAreConsistent(
  role: RepartoRole,
  isSuperuser: boolean
): boolean {
  if (!isKnownRole(role)) return false;
  if (role === SUPERADMIN_ROLE) return isSuperuser === true;
  return isSuperuser === false;
}

/**
 * The dual-evidence canonical-superuser predicate.
 *
 * Requires both the consistency invariant and the canonical pair, so a stray
 * `is_superuser: true` on a non-superadmin role — or the reverse — never grants
 * superuser privileges.
 */
export function hasSuperuserPrivileges(
  role: RepartoRole,
  isSuperuser: boolean
): boolean {
  return (
    privilegeClaimsAreConsistent(role, isSuperuser) &&
    role === SUPERADMIN_ROLE &&
    isSuperuser === true
  );
}

export type RepartoCurrentUser = {
  id: string;
  role: RepartoRole;
  is_superuser: boolean;
};

/**
 * Whether the signed-in session holds at least `minimum`.
 *
 * The session-shaped seam over `hasMinimumRole`, which compares two roles.
 * Fails closed on every unknown: no session, an unresolved session and a role
 * the client does not recognise all answer `false`.
 *
 * **`is_superuser` does not decide anything here, and the pair must agree.**
 * The service reaches the same answer the same way: `DomainController.
 * _require_role` measures `current_user.role` alone through the SDK's
 * `has_minimum_role` and deliberately never inspects the flag (`AUTH-INV-01`),
 * while the SDK's `UserModel` refuses to validate a token whose `role` and
 * `is_superuser` disagree at all. So a disagreeing pair is not a privileged
 * session this client should second-guess — it is a session the service would
 * reject outright, and granting it the administrative surface would only offer
 * controls whose every request comes back refused.
 *
 * This replaces an earlier reading that treated `is_superuser: true` as
 * `superadmin` on its own. That reading granted the admin surface to a pair the
 * backend rejects, hid nothing the backend grants, and was the one point on
 * which this package and `@mano8/astro-auth-m8` disagreed.
 */
export function sessionHasMinimumRole(
  user: RepartoCurrentUser | null | undefined,
  minimum: RepartoRole
): boolean {
  if (!user) return false;
  if (!privilegeClaimsAreConsistent(user.role, user.is_superuser)) return false;
  return hasMinimumRole(user.role, minimum);
}

/**
 * Department-head authority is `ADMIN`/`SUPERADMIN` and nothing else (§21.2):
 * `department_head_user_id` is descriptive, never an authorization input.
 */
export const REPARTO_ADMIN_MINIMUM_ROLE: RepartoRole = "admin";

/**
 * The two shapes a reparto view takes: the administrative surface, and the
 * read-only one everyone else gets.
 */
export type RepartoViewMode = "admin" | "readonly";

/**
 * Derive the view mode from the signed-in user — the only source it may come
 * from. A view never receives this as a caller-supplied literal (`RBAC-05`).
 */
export function resolveRepartoViewMode(
  user: RepartoCurrentUser | null | undefined
): RepartoViewMode {
  return sessionHasMinimumRole(user, REPARTO_ADMIN_MINIMUM_ROLE)
    ? "admin"
    : "readonly";
}

export function canManageClassroomStages(user: RepartoCurrentUser | null): boolean {
  return sessionHasMinimumRole(user, REPARTO_ADMIN_MINIMUM_ROLE);
}

let activeAdapter: RepartoAuthAdapter = createInMemoryAuthAdapter();

export function createInMemoryAuthAdapter(
  initialToken: string | null = null
): RepartoAuthAdapter & { setAccessToken: (token: string | null) => void } {
  let token = initialToken;
  return {
    getAccessToken: () => token,
    setAccessToken: (nextToken: string | null) => {
      token = nextToken;
    }
  };
}

export function createFaAuthAdapter(options: {
  getToken: () => string | null | Promise<string | null>;
  refreshToken?: () =>
    | string
    | null
    | { access_token?: unknown }
    | Promise<string | null | { access_token?: unknown }>;
  onUnauthenticated?: RepartoAuthAdapter["onUnauthenticated"];
  getCurrentUser?: RepartoAuthAdapter["getCurrentUser"];
}): RepartoAuthAdapter {
  return {
    getAccessToken: options.getToken,
    refresh: async () => {
      if (!options.refreshToken) return null;
      const refreshed = await options.refreshToken();
      if (typeof refreshed === "string" || refreshed === null) return refreshed;
      return typeof refreshed.access_token === "string"
        ? refreshed.access_token
        : null;
    },
    onUnauthenticated: options.onUnauthenticated,
    getCurrentUser: options.getCurrentUser
  };
}

export function setRepartoAuthAdapter(
  adapter: RepartoAuthAdapter
): RepartoAuthAdapter {
  activeAdapter = adapter;
  return activeAdapter;
}

export function getRepartoAuthAdapter(): RepartoAuthAdapter {
  return activeAdapter;
}

export function resetRepartoAuthAdapter(): void {
  activeAdapter = createInMemoryAuthAdapter();
}
