import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  canManageClassroomStages,
  createFaAuthAdapter,
  createInMemoryAuthAdapter,
  getRepartoAuthAdapter,
  ORDERED_ROLES,
  REPARTO_ADMIN_MINIMUM_ROLE,
  resetRepartoAuthAdapter,
  resolveRepartoViewMode,
  sessionHasMinimumRole,
  setRepartoAuthAdapter,
  type RepartoCurrentUser,
  type RepartoRole
} from "../src/runtime/authAdapter.js";
import { repartoUrl, request } from "../src/runtime/client.js";
import {
  configureReparto,
  getRepartoConfig,
  resetRepartoConfig
} from "../src/runtime/config.js";
import {
  messageFromDetail,
  normalizeFastApiError,
  RepartoApiError,
  RepartoUnauthenticatedError
} from "../src/runtime/errors.js";

const okSchema = z.object({ ok: z.boolean() });
const fetchMock = vi.fn();

function makeResponse(
  status: number,
  body: unknown,
  opts: { jsonThrows?: boolean; text?: string } = {}
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    clone() {
      return this;
    },
    async json() {
      if (opts.jsonThrows) throw new Error("not json");
      return body;
    },
    async text() {
      return opts.text ?? (typeof body === "string" ? body : JSON.stringify(body));
    }
  } as unknown as Response;
}

beforeEach(() => {
  resetRepartoConfig();
  resetRepartoAuthAdapter();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("runtime config", () => {
  it("merges and resets config", () => {
    expect(configureReparto({ apiBase: "/r" }).apiBase).toBe("/r");
    expect(configureReparto().apiBase).toBe("/r");
    resetRepartoConfig();
    expect(getRepartoConfig().apiBase).toBe("/reparto");
  });
});

describe("errors", () => {
  it("normalizes FastAPI details and messages", () => {
    expect(normalizeFastApiError({ detail: "x" })).toBe("x");
    expect(normalizeFastApiError("raw")).toBe("raw");
    expect(messageFromDetail(" boom ")).toBe("boom");
    expect(messageFromDetail(" ")).toBeUndefined();
    expect(messageFromDetail([{ msg: "a" }, { msg: "b" }, 1, { no: 1 }])).toBe("a; b");
    expect(messageFromDetail([{ no: 1 }])).toBeUndefined();
    expect(messageFromDetail({ no: 1 })).toBeUndefined();
    expect(new RepartoApiError(500, {}).message).toBe("Reparto API request failed");
    expect(new RepartoUnauthenticatedError().message).toBe("Authentication required");
  });
});

describe("auth adapter", () => {
  it("stores token in memory and resets active adapter", async () => {
    const adapter = createInMemoryAuthAdapter("t0");
    expect(await adapter.getAccessToken()).toBe("t0");
    adapter.setAccessToken("t1");
    expect(await adapter.getAccessToken()).toBe("t1");
    setRepartoAuthAdapter(adapter);
    expect(getRepartoAuthAdapter()).toBe(adapter);
    resetRepartoAuthAdapter();
    expect(getRepartoAuthAdapter()).not.toBe(adapter);
  });

  it("maps fa-auth token and refresh bindings", async () => {
    const adapter = createFaAuthAdapter({
      getToken: () => "tok",
      refreshToken: async () => ({ access_token: "fresh" })
    });
    expect(await adapter.getAccessToken()).toBe("tok");
    expect(await adapter.refresh?.()).toBe("fresh");
    expect(
      await createFaAuthAdapter({ getToken: () => null, refreshToken: () => "x" }).refresh?.()
    ).toBe("x");
    expect(
      await createFaAuthAdapter({ getToken: () => null, refreshToken: () => null }).refresh?.()
    ).toBeNull();
    expect(
      await createFaAuthAdapter({ getToken: () => null, refreshToken: () => ({}) }).refresh?.()
    ).toBeNull();
    expect(await createFaAuthAdapter({ getToken: () => null }).refresh?.()).toBeNull();
    const profile = { id: "user-1", role: "admin" as const, is_superuser: false };
    const withProfile = createFaAuthAdapter({ getToken: () => null, getCurrentUser: () => profile });
    expect(await withProfile.getCurrentUser?.()).toEqual(profile);
  });

  it("recognizes existing stage-admin roles", () => {
    expect(canManageClassroomStages(null)).toBe(false);
    expect(canManageClassroomStages({ id: "user-1", role: "writer", is_superuser: false })).toBe(false);
    expect(canManageClassroomStages({ id: "user-1", role: "admin", is_superuser: false })).toBe(true);
    expect(canManageClassroomStages({ id: "user-1", role: "superadmin", is_superuser: true })).toBe(true);
    // Neither claim decides alone: a disagreeing pair is a token the service
    // refuses to validate, so it manages nothing.
    expect(canManageClassroomStages({ id: "user-1", role: "user", is_superuser: true })).toBe(false);
    expect(canManageClassroomStages({ id: "user-1", role: "superadmin", is_superuser: false })).toBe(false);
  });

  /**
   * The one role comparison in the package (`RBAC-06`), and the session-shaped
   * seam over it. The hierarchy itself mirrors `auth_sdk_m8` through the auth
   * peer; `authorization-mirror.test.ts` proves that agreement exhaustively, so
   * a drift here is a drift from the service, not a UI preference.
   */
  describe("sessionHasMinimumRole", () => {
    const as = (role: RepartoRole, is_superuser = role === "superadmin"): RepartoCurrentUser => ({
      id: "user-1",
      role,
      is_superuser
    });

    it("orders the five roles exactly as the service does", () => {
      // Highest privilege first, matching `RoleType.get_ordered_roles()`.
      expect([...ORDERED_ROLES]).toEqual([
        "superadmin",
        "admin",
        "writer",
        "reader",
        "user"
      ]);
      for (const [index, held] of ORDERED_ROLES.entries()) {
        for (const [required, minimum] of ORDERED_ROLES.entries()) {
          expect(sessionHasMinimumRole(as(held), minimum)).toBe(index <= required);
        }
      }
    });

    it("fails closed on every unknown session", () => {
      expect(sessionHasMinimumRole(null, "user")).toBe(false);
      expect(sessionHasMinimumRole(undefined, "user")).toBe(false);
      // A role this client does not know is not a role it can rank, and an
      // unrankable role never clears a floor — not even the lowest one.
      expect(sessionHasMinimumRole(as("ghost" as RepartoRole, false), "user")).toBe(false);
    });

    it("refuses a session whose role and is_superuser disagree", () => {
      // The service decides from the role alone (`AUTH-INV-01`) and will not
      // validate a disagreeing pair at all, so neither claim is read on its own
      // here either. Both mismatched directions are refused.
      expect(sessionHasMinimumRole(as("user", true), "superadmin")).toBe(false);
      expect(sessionHasMinimumRole(as("user", true), "user")).toBe(false);
      expect(sessionHasMinimumRole(as("superadmin", false), "admin")).toBe(false);
      expect(sessionHasMinimumRole(as("ghost" as RepartoRole, true), "admin")).toBe(false);
    });
  });

  describe("resolveRepartoViewMode", () => {
    it("gives the admin surface to ADMIN and above, and to nobody else", () => {
      expect(REPARTO_ADMIN_MINIMUM_ROLE).toBe("admin");
      const mode = (role: RepartoRole) =>
        resolveRepartoViewMode({
          id: "user-1",
          role,
          is_superuser: role === "superadmin"
        });
      expect(mode("superadmin")).toBe("admin");
      expect(mode("admin")).toBe("admin");
      // §21.2: department-head authority is ADMIN+, and a WRITER's own-data
      // affordances are not the administrative surface.
      expect(mode("writer")).toBe("readonly");
      expect(mode("reader")).toBe("readonly");
      expect(mode("user")).toBe("readonly");
      expect(resolveRepartoViewMode(null)).toBe("readonly");
      expect(resolveRepartoViewMode(undefined)).toBe("readonly");
    });
  });
});

describe("client", () => {
  it("builds URLs and rejects unsupported protocols", () => {
    configureReparto({ apiBase: "/reparto", apiPrefix: "/fastapi" });
    expect(repartoUrl("api", "/assignment-processes/")).toBe(
      "http://localhost/reparto/fastapi/assignment-processes/"
    );
    expect(repartoUrl("absolute", "https://service.test/x")).toBe(
      "https://service.test/x"
    );
    expect(() => repartoUrl("absolute", "javascript:alert(1)")).toThrow(
      "Unsupported reparto API protocol"
    );
    vi.stubGlobal("window", { location: { origin: "https://app.test" } });
    expect(repartoUrl("api", "/x")).toBe("https://app.test/reparto/fastapi/x");
  });

  it("performs authed requests with query, headers, and body", async () => {
    setRepartoAuthAdapter(createInMemoryAuthAdapter("abc"));
    fetchMock.mockResolvedValueOnce(makeResponse(200, { ok: true }));
    const result = await request({
      method: "POST",
      path: "/x",
      query: { a: 1, b: null, c: false },
      headers: { "X-Test": "1" },
      body: { y: 2 },
      schema: okSchema,
      auth: true
    });
    expect(result).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("a=1");
    expect(url).not.toContain("b=");
    expect(url).toContain("c=false");
    expect((init.headers as Headers).get("Authorization")).toBe("Bearer abc");
    expect((init.headers as Headers).get("X-Test")).toBe("1");
    expect(init.body).toBe(JSON.stringify({ y: 2 }));
  });

  it("refreshes before the first authenticated request when the token is missing", async () => {
    setRepartoAuthAdapter({ getAccessToken: () => null, refresh: async () => "fresh" });
    fetchMock.mockResolvedValueOnce(makeResponse(200, { ok: true }));
    await request({ method: "GET", path: "/x", schema: okSchema, auth: true });
    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Headers).get("Authorization")).toBe("Bearer fresh");
  });

  it("does not fetch authenticated resources when no token can be resolved", async () => {
    const onUnauthenticated = vi.fn();
    setRepartoAuthAdapter({
      getAccessToken: () => null,
      refresh: async () => null,
      onUnauthenticated
    });
    await expect(
      request({ method: "GET", path: "/x", schema: okSchema, auth: true })
    ).rejects.toBeInstanceOf(RepartoUnauthenticatedError);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(onUnauthenticated).toHaveBeenCalledWith("refresh-failed");
  });

  it("does not fetch authenticated resources when preflight refresh throws", async () => {
    const onUnauthenticated = vi.fn();
    setRepartoAuthAdapter({
      getAccessToken: () => null,
      refresh: async () => {
        throw new Error("refresh failed");
      },
      onUnauthenticated
    });
    await expect(
      request({ method: "GET", path: "/x", schema: okSchema, auth: true })
    ).rejects.toBeInstanceOf(RepartoUnauthenticatedError);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(onUnauthenticated).toHaveBeenCalledWith("refresh-failed");
  });

  it("does not fetch authenticated resources when no refresh path exists", async () => {
    const onUnauthenticated = vi.fn();
    setRepartoAuthAdapter({
      getAccessToken: () => null,
      onUnauthenticated
    });
    await expect(
      request({ method: "GET", path: "/x", schema: okSchema, auth: true })
    ).rejects.toBeInstanceOf(RepartoUnauthenticatedError);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(onUnauthenticated).toHaveBeenCalledWith("unauthenticated");
  });

  it("does not refresh authenticated requests when skipRefresh is set", async () => {
    const onUnauthenticated = vi.fn();
    const refresh = vi.fn(async () => "fresh");
    setRepartoAuthAdapter({
      getAccessToken: () => null,
      refresh,
      onUnauthenticated
    });
    await expect(
      request({
        method: "GET",
        path: "/x",
        schema: okSchema,
        auth: true,
        skipRefresh: true
      })
    ).rejects.toBeInstanceOf(RepartoUnauthenticatedError);
    expect(refresh).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(onUnauthenticated).toHaveBeenCalledWith("unauthenticated");
  });

  it("returns undefined for empty responses", async () => {
    fetchMock.mockResolvedValueOnce(makeResponse(204, null));
    await expect(request({ method: "DELETE", path: "/x" })).resolves.toBeUndefined();
    fetchMock.mockResolvedValueOnce(makeResponse(200, { ok: true }));
    await expect(request({ method: "GET", path: "/x" })).resolves.toBeUndefined();
  });

  it("refreshes once after 401", async () => {
    setRepartoAuthAdapter({ getAccessToken: () => "old", refresh: async () => "new" });
    fetchMock
      .mockResolvedValueOnce(makeResponse(401, { detail: "expired" }))
      .mockResolvedValueOnce(makeResponse(200, { ok: true }));
    await expect(
      request({ method: "GET", path: "/x", schema: okSchema, auth: true })
    ).resolves.toEqual({ ok: true });
    const [, retryInit] = fetchMock.mock.calls[1];
    expect((retryInit.headers as Headers).get("Authorization")).toBe("Bearer new");
  });

  it("maps failed refresh and plain 401", async () => {
    const onUnauthenticated = vi.fn();
    setRepartoAuthAdapter({
      getAccessToken: () => "old",
      refresh: async () => null,
      onUnauthenticated
    });
    fetchMock.mockResolvedValueOnce(makeResponse(401, {}));
    await expect(
      request({ method: "GET", path: "/x", schema: okSchema, auth: true })
    ).rejects.toBeInstanceOf(RepartoUnauthenticatedError);
    expect(onUnauthenticated).toHaveBeenCalledWith("refresh-failed");

    setRepartoAuthAdapter({
      getAccessToken: () => "old",
      refresh: async () => {
        throw new Error("refresh failed");
      },
      onUnauthenticated
    });
    fetchMock.mockResolvedValueOnce(makeResponse(401, {}));
    await expect(
      request({ method: "GET", path: "/x", schema: okSchema, auth: true })
    ).rejects.toBeInstanceOf(RepartoUnauthenticatedError);
    expect(onUnauthenticated).toHaveBeenCalledWith("refresh-failed");

    setRepartoAuthAdapter({ getAccessToken: () => "old", onUnauthenticated });
    fetchMock.mockResolvedValueOnce(makeResponse(401, {}));
    await expect(
      request({ method: "GET", path: "/x", schema: okSchema, auth: true, skipRefresh: true })
    ).rejects.toBeInstanceOf(RepartoUnauthenticatedError);
    expect(onUnauthenticated).toHaveBeenCalledWith("unauthenticated");

    setRepartoAuthAdapter({ getAccessToken: () => "old" });
    fetchMock.mockResolvedValueOnce(makeResponse(401, {}));
    await expect(
      request({ method: "GET", path: "/x", schema: okSchema, auth: true })
    ).rejects.toBeInstanceOf(RepartoUnauthenticatedError);
  });

  it("maps JSON and text error bodies", async () => {
    fetchMock.mockResolvedValueOnce(makeResponse(500, { detail: "boom" }));
    await expect(request({ method: "GET", path: "/x", schema: okSchema })).rejects.toMatchObject({
      status: 500,
      detail: "boom"
    });
    fetchMock.mockResolvedValueOnce(makeResponse(502, null, { jsonThrows: true, text: "bad" }));
    await expect(request({ method: "GET", path: "/x", schema: okSchema })).rejects.toMatchObject({
      status: 502,
      detail: "bad"
    });
  });
});
