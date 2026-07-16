import { afterEach, describe, expect, it, vi } from "vitest";
import { installRepartoFaAuthBridge, isRepartoRoute, resetRepartoFaAuthBridge, resolveLoginHref } from "../src/runtime/faAuthBridge.js";
import { getRepartoAuthAdapter, resetRepartoAuthAdapter } from "../src/runtime/authAdapter.js";

const authAdapter = {
  getAccessToken: vi.fn(() => "tok"),
  refresh: vi.fn(async () => "tok"),
  getCurrentUser: vi.fn(async () => ({ id: "user-1", role: "admin" as const, is_superuser: false }))
};

function stubAuthAdapter() {
  (globalThis as typeof globalThis & { __M8_FA_AUTH_ADAPTER__?: typeof authAdapter }).__M8_FA_AUTH_ADAPTER__ = authAdapter;
}

function stubWindow(pathname: string, search = "") {
  const assign = vi.fn();
  (globalThis as { window?: unknown }).window = { location: { pathname, search, origin: "https://host.test", assign } };
  return assign;
}

async function flushBridgeGuard() {
  await Promise.resolve();
  await Promise.resolve();
}

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
  delete (globalThis as { __M8_FA_AUTH_ADAPTER__?: unknown }).__M8_FA_AUTH_ADAPTER__;
  resetRepartoAuthAdapter();
  resetRepartoFaAuthBridge();
  authAdapter.getAccessToken.mockReset();
  authAdapter.getAccessToken.mockReturnValue("tok");
  authAdapter.refresh.mockReset();
  authAdapter.refresh.mockResolvedValue("tok");
  authAdapter.getCurrentUser.mockReset();
  authAdapter.getCurrentUser.mockResolvedValue({ id: "user-1", role: "admin", is_superuser: false });
});

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
    expect(resolveLoginHref("/en/reparto/setup/schools", { loginPath: "/auth/login", locales: ["en", "es"] })).toBe("/en/auth/login");
  });
});

describe("installRepartoFaAuthBridge", () => {
  it("registers the auth browser adapter without making an eager refresh", async () => {
    stubAuthAdapter();
    stubWindow("/en/reparto/setup/schools");
    installRepartoFaAuthBridge({ locales: ["en"], loginPath: "/auth/login" });
    await flushBridgeGuard();
    const adapter = getRepartoAuthAdapter();
    expect(await adapter.getAccessToken()).toBe("tok");
    expect(authAdapter.refresh).not.toHaveBeenCalled();
    expect(await adapter.refresh?.()).toBe("tok");
    expect(authAdapter.refresh).toHaveBeenCalledTimes(1);
  });

  it("keeps the visitor on reparto pages when auth refresh restores a token", async () => {
    const assign = stubWindow("/es/reparto/setup/schools");
    stubAuthAdapter();
    authAdapter.getAccessToken.mockReturnValue(null);
    authAdapter.refresh.mockResolvedValue("fresh");
    installRepartoFaAuthBridge({ locales: ["es"], loginPath: "/auth/login" });
    await flushBridgeGuard();
    expect(authAdapter.refresh).toHaveBeenCalledTimes(1);
    expect(assign).not.toHaveBeenCalled();
  });

  it("redirects reparto route entry to localized login when no session exists", async () => {
    const assign = stubWindow("/es/reparto/setup/schools", "?tab=1");
    stubAuthAdapter();
    authAdapter.getAccessToken.mockReturnValue(null);
    authAdapter.refresh.mockResolvedValue(null);
    installRepartoFaAuthBridge({ locales: ["en", "es"], loginPath: "/auth/login" });
    await flushBridgeGuard();
    expect(assign).toHaveBeenCalledWith("/es/auth/login?next=%2Fes%2Freparto%2Fsetup%2Fschools%3Ftab%3D1");
  });

  it("does not guard unrelated host routes", async () => {
    const assign = stubWindow("/es/docs");
    stubAuthAdapter();
    authAdapter.getAccessToken.mockReturnValue(null);
    installRepartoFaAuthBridge({ locales: ["es"], loginPath: "/auth/login" });
    await flushBridgeGuard();
    expect(authAdapter.refresh).not.toHaveBeenCalled();
    expect(assign).not.toHaveBeenCalled();
  });

  it("redirects to the locale login page when the adapter reports no session", async () => {
    const assign = stubWindow("/es/reparto/setup/schools", "?tab=1");
    stubAuthAdapter();
    installRepartoFaAuthBridge({ locales: ["en", "es"], loginPath: "/auth/login" });
    await flushBridgeGuard();
    getRepartoAuthAdapter().onUnauthenticated?.("refresh-failed");
    expect(assign).toHaveBeenCalledWith("/es/auth/login?next=%2Fes%2Freparto%2Fsetup%2Fschools%3Ftab%3D1");
  });

  it("is idempotent until reset", () => {
    stubAuthAdapter();
    stubWindow("/reparto");
    installRepartoFaAuthBridge();
    installRepartoFaAuthBridge();
    expect(authAdapter.getAccessToken).toHaveBeenCalledTimes(1);
  });
});
