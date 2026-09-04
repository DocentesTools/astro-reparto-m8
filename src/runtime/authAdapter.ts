import {
  hasMinimumRole,
  hasSuperuserPrivileges,
  ORDERED_ROLES,
  privilegeClaimsAreConsistent
} from "@mano8/astro-auth-m8/authorization";

import { sharedState } from "./moduleState.js";

export type RepartoAuthAdapter = {
  getAccessToken: () => string | null | Promise<string | null>;
  refresh?: () => string | null | Promise<string | null>;
  onUnauthenticated?: (reason: "unauthenticated" | "refresh-failed") => void;
  getCurrentUser?: () => RepartoCurrentUser | null | Promise<RepartoCurrentUser | null>;
};

/**
 * The fleet's one role hierarchy and role/flag truth table, re-exported.
 *
 * `@mano8/astro-auth-m8/authorization` is the TypeScript mirror of
 * `auth_sdk_m8/authorization.py`, the canonical source both this package and
 * the auth peer answer to. These four bindings were *copied* here until
 * 2026-08-29: the fleet's `no-cross-plugin-import` gate (`C12`,
 * `scripts/verify-fleet-gates.mjs`) refused the import, so `RBAC-06` — one
 * hierarchy — could only be met by a mirror pinned with an exhaustive test.
 *
 * Decision 4 widened that gate for exactly this specifier, and the copy is
 * gone. The exemption is narrow on purpose: the module is pure and
 * framework-neutral, every other subpath of the auth peer is still refused, and
 * this package already requires `@mano8/astro-auth-m8` as its official auth
 * peer (`peerDependencies`), so the import adds no install a consumer did not
 * already owe. `tests/authorization-mirror.test.ts` now asserts these *are* the
 * peer's own bindings, by identity, so a re-fork fails the build.
 *
 * Re-exported under the names this module already published, so the package
 * surface is unchanged and `authAdapter.ts` remains the one place reparto
 * states the hierarchy.
 */
export {
  hasMinimumRole,
  hasSuperuserPrivileges,
  ORDERED_ROLES,
  privilegeClaimsAreConsistent
};

/** The five roles, highest privilege first, as the peer orders them. */
export type RepartoRole = (typeof ORDERED_ROLES)[number];

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

/**
 * The registered adapter, in the one slot every copy of this module shares.
 *
 * Not a module-level `let`: the bridge that registers the adapter and the view
 * that reads it back do not always load the same copy of this file. See
 * `moduleState.ts` for the dev-server module split that makes that so.
 */
const activeAdapter = sharedState<RepartoAuthAdapter>(
  "authAdapter.active",
  createInMemoryAuthAdapter
);

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
  activeAdapter.set(adapter);
  return adapter;
}

export function getRepartoAuthAdapter(): RepartoAuthAdapter {
  return activeAdapter.get();
}

export function resetRepartoAuthAdapter(): void {
  activeAdapter.set(createInMemoryAuthAdapter());
}
