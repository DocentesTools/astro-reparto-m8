import {
  resetRepartoAuthAdapter,
  setRepartoAuthAdapter,
  type RepartoCurrentUser,
  type RepartoRole
} from "../../src/runtime/authAdapter.js";

/**
 * Sign a role into the package's auth adapter for the duration of a test.
 *
 * Every reparto route is gated by the signed-in role (§8.1 route map, §21.1), so
 * a test that renders a view has to say who is looking at it. The adapter here
 * answers synchronously, which is what lets a `renderToStaticMarkup` test — no
 * effects, one pass — see the resolved surface rather than the waiting state.
 * `signInReparto(null)` is the anonymous session, and it is refused everywhere.
 */
export function signInReparto(user: RepartoCurrentUser | null): void {
  setRepartoAuthAdapter({
    getAccessToken: () => "test-token",
    getCurrentUser: () => user
  });
}

/** The same session, resolved a frame late — the shape the fa-auth bridge has. */
export function signInRepartoAsync(user: RepartoCurrentUser | null): void {
  setRepartoAuthAdapter({
    getAccessToken: () => "test-token",
    getCurrentUser: async () => user
  });
}

export function repartoUser(
  role: RepartoRole,
  overrides: Partial<RepartoCurrentUser> = {}
): RepartoCurrentUser {
  return {
    id: "00000000-0000-4000-8000-00000000f00d",
    is_superuser: false,
    role,
    ...overrides
  };
}

export { resetRepartoAuthAdapter };
