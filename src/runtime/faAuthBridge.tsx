// Client-side auth bridge for the fa-auth-astro provider.
//
// reparto-docente-m8 only accepts fa-auth-m8 tokens. In `starter` mode the
// plugin owns its routes, so the host never gets to wrap the islands the way it
// does for headless plugins (e.g. media's host-side MediaProvider). Instead the
// integration injects this module on every page (only when
// `auth.provider === "fa-auth-astro"`), which:
//
//   1. registers a RepartoAuthAdapter backed by the auth plugin's in-memory
//      token store (same token + refresh the auth plugin already manages — no
//      second store), so authenticated writes carry `Authorization: Bearer …`;
//   2. verifies the session on reparto routes and redirects unauthenticated
//      visitors to the login page before they can submit a form that the
//      backend would reject with 401.
//
// The `@mano8/astro-auth-m8` imports live here — never in the always-built route
// path — so the plugin still builds with `auth.provider: "custom" | "none"` and
// no auth plugin installed (see the starter fixture).
import { getToken } from "@mano8/astro-auth-m8/client";
import { refreshToken } from "@mano8/astro-auth-m8/api";
import { createFaAuthAdapter, setRepartoAuthAdapter } from "./authAdapter.js";

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

/**
 * Register the fa-auth-backed reparto adapter and, on reparto routes, redirect
 * unauthenticated visitors to the login page. Idempotent and browser-only.
 */
export function installRepartoFaAuthBridge(
  options: RepartoFaAuthBridgeOptions = {}
): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  setRepartoAuthAdapter(
    createFaAuthAdapter({
      getToken,
      refreshToken,
      onUnauthenticated: () => redirectToLogin(options)
    })
  );

  if (isRepartoRoute(window.location.pathname, options)) {
    // A successful refresh also primes the shared token store for the first
    // write; a rejection means there is no valid session → send them to login.
    void refreshToken().catch(() => redirectToLogin(options));
  }
}

/** Test-only: allow {@link installRepartoFaAuthBridge} to run again. */
export function resetRepartoFaAuthBridge(): void {
  installed = false;
}
