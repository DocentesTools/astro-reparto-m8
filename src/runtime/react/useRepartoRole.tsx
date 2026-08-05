import { useEffect, useState } from "react";

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

/**
 * Read the signed-in user once, through the auth adapter.
 *
 * The adapter's `getCurrentUser` is allowed to be asynchronous, so the first
 * render always reports the unresolved state and the resolved one arrives in an
 * effect. The starter routes mount every view with `client:only="react"`, so
 * that effect is the first and only paint a user ever sees; the static-markup
 * render used by the package tests is scaffolding, and it is read-only by
 * construction because no session has been read at that point.
 */
export function useRepartoCurrentUser(): RepartoRoleState {
  const [state, setState] = useState<RepartoRoleState>(UNRESOLVED);

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
