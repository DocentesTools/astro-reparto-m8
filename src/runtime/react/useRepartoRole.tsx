import { useEffect, useState } from "react";

import {
  canActOnRepartoRoute,
  canViewRepartoRoute,
  type RepartoRouteAccess,
  repartoRouteAccess
} from "../routeAccess.js";
import type { RepartoRouteName } from "../routes.js";
import {
  getRepartoAuthAdapter,
  hasMinimumRole,
  resolveRepartoViewMode,
  type RepartoCurrentUser,
  type RepartoRole,
  type RepartoViewMode
} from "../authAdapter.js";

export type RepartoRoleState = {
  /**
   * `false` until the adapter has answered. Every gate below treats the
   * unresolved state as "no capability": a view must never show an
   * administrative affordance on the strength of a session it has not read yet.
   */
  resolved: boolean;
  user: RepartoCurrentUser | null;
};

const UNRESOLVED: RepartoRoleState = { resolved: false, user: null };
const ANONYMOUS: RepartoRoleState = { resolved: true, user: null };

/**
 * What the adapter can answer without awaiting anything.
 *
 * An adapter that returns the session synchronously is resolved on the first
 * render, which is what lets a server-rendered reparto route be gated at all —
 * an effect never runs there. An adapter that answers with a promise, and an
 * adapter with no `getCurrentUser` to ask, are the two unresolved cases; the
 * second resolves to the anonymous session immediately, because "this adapter
 * cannot name the user" is an answer, and under §21.5 it is a closed one.
 */
function readSyncSession(): RepartoRoleState {
  const adapter = getRepartoAuthAdapter();
  if (!adapter.getCurrentUser) return ANONYMOUS;
  const answer = adapter.getCurrentUser();
  if (answer && typeof (answer as Promise<unknown>).then === "function") {
    return UNRESOLVED;
  }
  return { resolved: true, user: (answer as RepartoCurrentUser | null) ?? null };
}

/**
 * Read the signed-in user once, through the auth adapter.
 *
 * The adapter's `getCurrentUser` is allowed to be asynchronous, so a session
 * that must be awaited reports the unresolved state first and the resolved one
 * arrives in an effect. The starter routes mount every view with
 * `client:only="react"`, so that effect is the first and only paint a user ever
 * sees.
 */
export function useRepartoCurrentUser(): RepartoRoleState {
  const [state, setState] = useState<RepartoRoleState>(readSyncSession);

  useEffect(() => {
    let active = true;
    void Promise.resolve(
      getRepartoAuthAdapter().getCurrentUser?.() ?? null
    ).then((user) => {
      if (active) setState({ resolved: true, user });
    });
    return () => {
      active = false;
    };
  }, []);

  return state;
}

/**
 * Whether the signed-in user holds at least `minimum`.
 *
 * `null` means "not yet known" — distinct from `false`, so a view can hold a
 * decision back rather than render a denial it may have to take away again.
 * Both non-`true` answers are safe: neither grants anything.
 */
export function useRepartoMinimumRole(minimum: RepartoRole): boolean | null {
  const { resolved, user } = useRepartoCurrentUser();
  if (!resolved) return null;
  return hasMinimumRole(user, minimum);
}

/**
 * The view mode of the signed-in session (`RBAC-05`/`RBAC-06`).
 *
 * Views call this instead of accepting a `mode` prop: a mode a caller can pass
 * in is a mode disconnected from the user holding the session.
 */
export function useRepartoViewMode(): RepartoViewMode {
  const { resolved, user } = useRepartoCurrentUser();
  return resolved ? resolveRepartoViewMode(user) : "readonly";
}

export type RepartoRouteAccessState = RepartoRoleState & {
  /** The route's declared floors, for a view that wants to name them. */
  access: RepartoRouteAccess;
  /** May the session see this route at all? `false` until resolved. */
  canView: boolean;
  /** May the session's tier hold this route's write affordances? */
  canAct: boolean;
};

/**
 * The signed-in session measured against one route's two floors (§8.1/§21.1).
 *
 * Both answers are `false` until the adapter has resolved, so nothing — content
 * or affordance — is rendered on the strength of a session that has not been
 * read. The route guard renders the waiting state from `resolved`, so a view
 * never has to tell "not yet" apart from "not allowed" itself.
 */
export function useRepartoRouteAccess(route: RepartoRouteName): RepartoRouteAccessState {
  const { resolved, user } = useRepartoCurrentUser();
  return {
    access: repartoRouteAccess(route),
    canAct: resolved && canActOnRepartoRoute(user, route),
    canView: resolved && canViewRepartoRoute(user, route),
    resolved,
    user
  };
}

/**
 * Whether this route's write affordances may be rendered at all.
 *
 * Views call this instead of hiding controls behind their own role comparison
 * (`RBAC-06`), and hide rather than disable: a disabled control still tells a
 * `READER` that the action exists for them, and it does not (§21.5).
 */
export function useRepartoCanAct(route: RepartoRouteName): boolean {
  return useRepartoRouteAccess(route).canAct;
}
