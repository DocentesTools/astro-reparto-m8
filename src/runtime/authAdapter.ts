export type RepartoAuthAdapter = {
  getAccessToken: () => string | null | Promise<string | null>;
  refresh?: () => string | null | Promise<string | null>;
  onUnauthenticated?: (reason: "unauthenticated" | "refresh-failed") => void;
  getCurrentUser?: () => RepartoCurrentUser | null | Promise<RepartoCurrentUser | null>;
};

/**
 * The role hierarchy, lowest capability first.
 *
 * This mirrors the service's own `has_minimum_role` order (§21.1). It is the
 * single ordering in the package: no view re-derives its own role comparison
 * (`RBAC-06`), and no view decides what a role may do from anything other than
 * the signed-in user reported here (`RBAC-05`).
 */
export const REPARTO_ROLE_ORDER = [
  "user",
  "reader",
  "writer",
  "admin",
  "superadmin"
] as const;

export type RepartoRole = (typeof REPARTO_ROLE_ORDER)[number];

export type RepartoCurrentUser = {
  id: string;
  role: RepartoRole;
  is_superuser: boolean;
};

/**
 * Whether the signed-in user holds at least `minimum`.
 *
 * Fails closed on every unknown: no session, an unresolved session and a role
 * the client does not recognise all answer `false`. `is_superuser` is read as
 * `superadmin` because the service treats the flag and the role as one canonical
 * truth, and a client that ignored it would hide affordances the backend grants.
 */
export function hasMinimumRole(
  user: RepartoCurrentUser | null | undefined,
  minimum: RepartoRole
): boolean {
  if (!user) return false;
  const held = user.is_superuser ? "superadmin" : user.role;
  const heldRank = REPARTO_ROLE_ORDER.indexOf(held);
  if (heldRank < 0) return false;
  return heldRank >= REPARTO_ROLE_ORDER.indexOf(minimum);
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
  return hasMinimumRole(user, REPARTO_ADMIN_MINIMUM_ROLE) ? "admin" : "readonly";
}

export function canManageClassroomStages(user: RepartoCurrentUser | null): boolean {
  return hasMinimumRole(user, REPARTO_ADMIN_MINIMUM_ROLE);
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
