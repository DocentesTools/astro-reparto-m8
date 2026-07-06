// Client-side auth bridge for the fa-auth-astro provider.
//
// reparto-docente-m8 only accepts fa-auth-m8 tokens. In `starter` mode the
// plugin owns its routes, so — unlike headless plugins that the host wraps in a
// host-side provider (e.g. media's MediaProvider, prompt's PromptProvider) — no
// host island ever configures the auth runtime or wires the reparto adapter on
// these pages. The integration injects this module on every page (only when
// `auth.provider === "fa-auth-astro"`), which:
//
//   1. points the fa-auth client at the same backend the host configured
//      (`PUBLIC_FA_AUTH_API_BASE`), so its `refreshToken`/`getToken` resolve to
//      the auth service instead of the current origin;
//   2. registers a RepartoAuthAdapter backed by fa-auth's `getToken` +
//      `refreshToken`. It performs NO eager network call: exactly like the
//      prompt client, the reparto client lazily calls `adapter.refresh()` on a
//      401 (fa-auth owns the refresh + token store — no second store, no
//      duplicate refresh), then retries the request with the fresh Bearer.
//
// On a genuinely unauthenticated visit the reparto client's refresh fails and
// invokes `onUnauthenticated`, which sends the visitor to the login page.
//
// The `@mano8/astro-auth-m8` imports live here — never in the always-built route
// path — so the plugin still builds with `auth.provider: "custom" | "none"` and
// no auth plugin installed (see the starter fixture).
import { getToken, configureAuth } from "@mano8/astro-auth-m8/client";
import { refreshToken } from "@mano8/astro-auth-m8/api";
import {
  createFaAuthAdapter,
  getRepartoAuthAdapter,
  setRepartoAuthAdapter
} from "./authAdapter.js";

export type RepartoFaAuthBridgeOptions = {
  /** Login route path, without the locale prefix. Defaults to `/login`. */
  loginPath?: string;
  /** Locale segments that may prefix the current path (e.g. `["en","fr"]`). */
  locales?: string[];
  /** Route prefixes the guard applies to. Defaults to `["/reparto"]`. */
  routePrefixes?: string[];
};

let installed = false;

/** Strip a leading locale segment so route/login logic is locale-agnostic. */
function splitLocale(
  pathname: string,
  locales: string[]
): { locale: string; rest: string } {
  const [, first = "", ...rest] = pathname.split("/");
  if (locales.includes(first)) {
    return { locale: first, rest: `/${rest.join("/")}` };
  }
  return { locale: "", rest: pathname };
}

/** True when `pathname` targets one of the reparto route prefixes. */
export function isRepartoRoute(
  pathname: string,
  options: RepartoFaAuthBridgeOptions = {}
): boolean {
  const prefixes = options.routePrefixes ?? ["/reparto"];
  const { rest } = splitLocale(pathname, options.locales ?? []);
  return prefixes.some(
    (prefix) => rest === prefix || rest.startsWith(`${prefix}/`)
  );
}

/** Build the locale-aware login href for a given path. */
export function resolveLoginHref(
  pathname: string,
  options: RepartoFaAuthBridgeOptions = {}
): string {
  const loginPath = options.loginPath ?? "/login";
  const { locale } = splitLocale(pathname, options.locales ?? []);
  return locale ? `/${locale}${loginPath}` : loginPath;
}

function redirectToLogin(options: RepartoFaAuthBridgeOptions): void {
  if (typeof window === "undefined") return;
  const { pathname, search, origin } = window.location;
  const loginHref = resolveLoginHref(pathname, options);
  // Guard against redirect loops if the login page ever matches.
  if (new URL(loginHref, origin).pathname === pathname) return;
  const next = encodeURIComponent(pathname + search);
  window.location.assign(`${loginHref}?next=${next}`);
}

async function guardCurrentRepartoRoute(
  options: RepartoFaAuthBridgeOptions
): Promise<void> {
  if (typeof window === "undefined") return;
  if (!isRepartoRoute(window.location.pathname, options)) return;

  const adapter = getRepartoAuthAdapter();
  if (await adapter.getAccessToken()) return;

  try {
    const refreshed = adapter.refresh ? await adapter.refresh() : null;
    if (refreshed) return;
  } catch {
    // Treat refresh failures like a missing session and redirect below.
  }

  redirectToLogin(options);
}

/** Resolve the fa-auth API base the host configured for the auth service. */
function resolveAuthApiBase(): string | undefined {
  return import.meta.env.PUBLIC_FA_AUTH_API_BASE;
}

/**
 * Register the fa-auth-backed reparto adapter. Points the fa-auth client at the
 * configured auth service, then wires `getToken`/`refreshToken` so the reparto
 * client can lazily refresh on a 401. No eager request is made. Idempotent and
 * browser-only.
 */
export function installRepartoFaAuthBridge(
  options: RepartoFaAuthBridgeOptions = {}
): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  // fa-auth's refreshToken/getToken resolve their URL against this base; without
  // it they would post to the current origin (the Astro host) and 404.
  const apiBase = resolveAuthApiBase();
  if (apiBase) configureAuth({ apiBase });

  setRepartoAuthAdapter(
    createFaAuthAdapter({
      getToken,
      refreshToken,
      // Fires only after the reparto client's own 401 → refresh cycle fails,
      // i.e. the visitor has no valid session — send them to login.
      onUnauthenticated: () => redirectToLogin(options)
    })
  );

  void guardCurrentRepartoRoute(options);
}

/** Test-only: allow {@link installRepartoFaAuthBridge} to run again. */
export function resetRepartoFaAuthBridge(): void {
  installed = false;
}
