import { afterEach, describe, expect, it, vi } from "vitest";

const authApi = vi.hoisted(() => ({
  refreshToken: vi.fn(async () => ({ access_token: "tok" }))
}));
const authClient = vi.hoisted(() => ({
  getToken: vi.fn(() => "tok"),
  configureAuth: vi.fn()
}));

vi.mock("@mano8/astro-auth-m8/api", () => authApi);
vi.mock("@mano8/astro-auth-m8/client", () => authClient);

import {
  installRepartoFaAuthBridge,
  isRepartoRoute,
  resetRepartoFaAuthBridge,
  resolveLoginHref
} from "../src/runtime/faAuthBridge.js";
import {
  getRepartoAuthAdapter,
  resetRepartoAuthAdapter
} from "../src/runtime/authAdapter.js";

function stubWindow(pathname: string, search = "") {
  const assign = vi.fn();
  (globalThis as { window?: unknown }).window = {
    location: { pathname, search, origin: "https://host.test", assign }
  };
  return assign;
}

async function flushBridgeGuard() {
  await Promise.resolve();
  await Promise.resolve();
}

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
  vi.unstubAllEnvs();
  resetRepartoAuthAdapter();
  resetRepartoFaAuthBridge();
  authApi.refreshToken.mockReset();
  authApi.refreshToken.mockResolvedValue({ access_token: "tok" });
  authClient.getToken.mockReset();
  authClient.getToken.mockReturnValue("tok");
  authClient.configureAuth.mockReset();
});

/** Set the auth API base the host build injects for the fa-auth client. */
function stubAuthApiBase(apiBase: string) {
  vi.stubEnv("PUBLIC_FA_AUTH_API_BASE", apiBase);
}

describe("isRepartoRoute", () => {
  it("matches reparto routes with and without a locale prefix", () => {
    expect(isRepartoRoute("/reparto/setup/schools")).toBe(true);
    expect(isRepartoRoute("/reparto")).toBe(true);
    expect(isRepartoRoute("/en/reparto/setup/schools", { locales: ["en", "es"] })).toBe(true);
    expect(isRepartoRoute("/en/docs", { locales: ["en"] })).toBe(false);
    expect(isRepartoRoute("/repartoxyz")).toBe(false);
    expect(isRepartoRoute("/media/library", { routePrefixes: ["/media"] })).toBe(true);
  });
});

describe("resolveLoginHref", () => {
  it("prefixes the active locale when present", () => {
    expect(resolveLoginHref("/reparto/setup/schools")).toBe("/login");
    expect(
      resolveLoginHref("/en/reparto/setup/schools", {
        loginPath: "/auth/login",
        locales: ["en", "es"]
      })
    ).toBe("/en/auth/login");
  });
});

describe("installRepartoFaAuthBridge", () => {
  it("points the fa-auth client at the configured auth service", () => {
    stubAuthApiBase("http://auth.test/user");
    stubWindow("/en/reparto/setup/schools");
    installRepartoFaAuthBridge({ locales: ["en"] });

    expect(authClient.configureAuth).toHaveBeenCalledWith({
      apiBase: "http://auth.test/user"
    });
  });

  it("registers a fa-auth-backed adapter without making an eager request", async () => {
    stubWindow("/en/reparto/setup/schools");
    installRepartoFaAuthBridge({ locales: ["en"], loginPath: "/auth/login" });
    await flushBridgeGuard();

    const adapter = getRepartoAuthAdapter();
    expect(await adapter.getAccessToken()).toBe("tok");
    // With a token already present, the route guard does not refresh eagerly.
    expect(authApi.refreshToken).not.toHaveBeenCalled();
    // The wired adapter delegates refresh to fa-auth's refreshToken.
    expect(await adapter.refresh?.()).toBe("tok");
    expect(authApi.refreshToken).toHaveBeenCalledTimes(1);
  });

  it("keeps the visitor on reparto pages when fa-auth refresh restores a token", async () => {
    const assign = stubWindow("/es/reparto/setup/schools");
    authClient.getToken.mockReturnValue(null);
    authApi.refreshToken.mockResolvedValue({ access_token: "fresh" });

    installRepartoFaAuthBridge({ locales: ["es"], loginPath: "/auth/login" });
    await flushBridgeGuard();

    expect(authApi.refreshToken).toHaveBeenCalledTimes(1);
    expect(assign).not.toHaveBeenCalled();
  });

  it("redirects reparto route entry to localized login when no session exists", async () => {
    const assign = stubWindow("/es/reparto/setup/schools", "?tab=1");
    authClient.getToken.mockReturnValue(null);
    authApi.refreshToken.mockResolvedValue(null);

    installRepartoFaAuthBridge({ locales: ["en", "es"], loginPath: "/auth/login" });
    await flushBridgeGuard();

    expect(assign).toHaveBeenCalledWith(
      "/es/auth/login?next=%2Fes%2Freparto%2Fsetup%2Fschools%3Ftab%3D1"
    );
  });

  it("does not guard unrelated host routes", async () => {
    const assign = stubWindow("/es/docs");
    authClient.getToken.mockReturnValue(null);

    installRepartoFaAuthBridge({ locales: ["es"], loginPath: "/auth/login" });
    await flushBridgeGuard();

    expect(authApi.refreshToken).not.toHaveBeenCalled();
    expect(assign).not.toHaveBeenCalled();
  });

  it("redirects to the locale login page when the adapter reports no session", async () => {
    const assign = stubWindow("/es/reparto/setup/schools", "?tab=1");
    installRepartoFaAuthBridge({ locales: ["en", "es"], loginPath: "/auth/login" });
    await flushBridgeGuard();

    getRepartoAuthAdapter().onUnauthenticated?.("refresh-failed");

    expect(assign).toHaveBeenCalledWith(
      "/es/auth/login?next=%2Fes%2Freparto%2Fsetup%2Fschools%3Ftab%3D1"
    );
  });

  it("is idempotent until reset", () => {
    stubAuthApiBase("http://auth.test/user");
    stubWindow("/reparto");
    installRepartoFaAuthBridge();
    installRepartoFaAuthBridge();
    expect(authClient.configureAuth).toHaveBeenCalledTimes(1);
  });
});
