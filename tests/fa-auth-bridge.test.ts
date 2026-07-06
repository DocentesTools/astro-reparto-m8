import { afterEach, describe, expect, it, vi } from "vitest";

const authApi = vi.hoisted(() => ({
  refreshToken: vi.fn(async () => ({ access_token: "tok" }))
}));
const authClient = vi.hoisted(() => ({ getToken: vi.fn(() => "tok") }));

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

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
  resetRepartoAuthAdapter();
  resetRepartoFaAuthBridge();
  authApi.refreshToken.mockReset();
  authApi.refreshToken.mockResolvedValue({ access_token: "tok" });
  authClient.getToken.mockReset();
  authClient.getToken.mockReturnValue("tok");
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
    expect(
      resolveLoginHref("/en/reparto/setup/schools", {
        loginPath: "/auth/login",
        locales: ["en", "es"]
      })
    ).toBe("/en/auth/login");
  });
});

describe("installRepartoFaAuthBridge", () => {
  it("registers a fa-auth-backed adapter and verifies the session on reparto routes", async () => {
    stubWindow("/en/reparto/setup/schools");
    installRepartoFaAuthBridge({ locales: ["en"], loginPath: "/auth/login" });

    expect(await getRepartoAuthAdapter().getAccessToken()).toBe("tok");
    expect(authApi.refreshToken).toHaveBeenCalledTimes(1);
  });

  it("redirects to the locale login page when the session refresh fails", async () => {
    authApi.refreshToken.mockRejectedValueOnce(new Error("no session"));
    const assign = stubWindow("/es/reparto/setup/schools", "?tab=1");
    installRepartoFaAuthBridge({ locales: ["en", "es"], loginPath: "/auth/login" });

    await vi.waitFor(() =>
      expect(assign).toHaveBeenCalledWith(
        "/es/auth/login?next=%2Fes%2Freparto%2Fsetup%2Fschools%3Ftab%3D1"
      )
    );
  });

  it("does not verify the session outside reparto routes", () => {
    stubWindow("/en/docs");
    installRepartoFaAuthBridge({ locales: ["en"] });
    expect(authApi.refreshToken).not.toHaveBeenCalled();
  });

  it("is idempotent until reset", () => {
    stubWindow("/reparto");
    installRepartoFaAuthBridge();
    installRepartoFaAuthBridge();
    expect(authApi.refreshToken).toHaveBeenCalledTimes(1);
  });
});
