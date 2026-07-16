// Client-side auth bridge for the fa-auth-astro provider.
//
// reparto-docente-m8 only accepts fa-auth-m8 tokens. In starter mode, auth owns
// configuration, token storage, refresh, and user lookup; reparto consumes its
// browser adapter through this small contract and adapts it locally. That keeps
// the packages independently installable without runtime cross-plugin imports.
import {
  createFaAuthAdapter,
  getRepartoAuthAdapter,
  setRepartoAuthAdapter
} from "./authAdapter.js";

type FaAuthBrowserAdapter = {
  getAccessToken: () => string | null | Promise<string | null>;
  refresh: () => string | null | Promise<string | null>;
  getCurrentUser: () => Promise<{
    id: string;
    role: "superadmin" | "admin" | "writer" | "reader" | "user";
    is_superuser: boolean;
  }>;
};

function getFaAuthBrowserAdapter(): FaAuthBrowserAdapter | null {
  return (globalThis as typeof globalThis & {
    __M8_FA_AUTH_ADAPTER__?: FaAuthBrowserAdapter;
  }).__M8_FA_AUTH_ADAPTER__ ?? null;
}

export type RepartoFaAuthBridgeOptions = {
  /** Login route path, without the locale prefix. Defaults to `/login`. */
  loginPath?: string;
  /** Locale segments that may prefix the current path (e.g. `["en","fr"]`). */
  locales?: string[];
  /** Route prefixes the guard applies to. Defaults to `["/reparto"]`. */
  routePrefixes?: string[];
};

let installed = false;

function splitLocale(pathname: string, locales: string[]): { locale: string; rest: string } {
  const [, first = "", ...rest] = pathname.split("/");
  if (locales.includes(first)) return { locale: first, rest: `/${rest.join("/")}` };
  return { locale: "", rest: pathname };
}

export function isRepartoRoute(pathname: string, options: RepartoFaAuthBridgeOptions = {}): boolean {
  const prefixes = options.routePrefixes ?? ["/reparto"];
  const { rest } = splitLocale(pathname, options.locales ?? []);
  return prefixes.some((prefix) => rest === prefix || rest.startsWith(`${prefix}/`));
}

export function resolveLoginHref(pathname: string, options: RepartoFaAuthBridgeOptions = {}): string {
  const loginPath = options.loginPath ?? "/login";
  const { locale } = splitLocale(pathname, options.locales ?? []);
  return locale ? `/${locale}${loginPath}` : loginPath;
}

function redirectToLogin(options: RepartoFaAuthBridgeOptions): void {
  if (typeof window === "undefined") return;
  const { pathname, search, origin } = window.location;
  const loginHref = resolveLoginHref(pathname, options);
  if (new URL(loginHref, origin).pathname === pathname) return;
  const next = encodeURIComponent(pathname + search);
  window.location.assign(`${loginHref}?next=${next}`);
}

async function guardCurrentRepartoRoute(options: RepartoFaAuthBridgeOptions): Promise<void> {
  if (typeof window === "undefined" || !isRepartoRoute(window.location.pathname, options)) return;
  const adapter = getRepartoAuthAdapter();
  if (await adapter.getAccessToken()) return;

  try {
    if (adapter.refresh && await adapter.refresh()) return;
  } catch {
    // Treat refresh failures like a missing session and redirect below.
  }

  redirectToLogin(options);
}

/** Register reparto's local adapter from auth's browser contract. */
export function installRepartoFaAuthBridge(options: RepartoFaAuthBridgeOptions = {}): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  setRepartoAuthAdapter(
    createFaAuthAdapter({
      getToken: () => getFaAuthBrowserAdapter()?.getAccessToken() ?? null,
      refreshToken: () => getFaAuthBrowserAdapter()?.refresh() ?? null,
      getCurrentUser: () => getFaAuthBrowserAdapter()?.getCurrentUser() ?? null,
      onUnauthenticated: () => redirectToLogin(options)
    })
  );

  void guardCurrentRepartoRoute(options);
}

/** Test-only: allow {@link installRepartoFaAuthBridge} to run again. */
export function resetRepartoFaAuthBridge(): void {
  installed = false;
}
