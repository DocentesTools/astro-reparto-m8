// The dev-server module split, reproduced in-process.
//
// Under `astro dev` a `client:only` island is served from the package's raw
// path while the integration's injected bridge script is served from Vite's
// optimized dependency cache. Both graphs load `authAdapter.js`, and they load
// different copies of it. A distinct import query gives vitest the same shape:
// two module records for one source file, each evaluating its top level once.
// Before the shared registry, the bridge registered the signed-in session on
// one copy and every view read the other — still the anonymous in-memory
// adapter — so an administrator was refused client-side, with no request made.
import { afterEach, describe, expect, it, vi } from "vitest";

import * as adapterA from "../src/runtime/authAdapter.js";
import * as adapterB from "../src/runtime/authAdapter.js?duplicate-module-instance";
import * as configA from "../src/runtime/config.js";
import * as configB from "../src/runtime/config.js?duplicate-module-instance";
import { sharedState } from "../src/runtime/moduleState.js";
import {
  installRepartoFaAuthBridge,
  resetRepartoFaAuthBridge
} from "../src/runtime/faAuthBridge.js";

const session = { id: "user-1", role: "superadmin" as const, is_superuser: true };

const faAuthBrowserAdapter = {
  getAccessToken: vi.fn(() => "tok"),
  refresh: vi.fn(async () => "tok"),
  getCurrentUser: vi.fn(async () => session)
};

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
  delete (globalThis as { __M8_FA_AUTH_ADAPTER__?: unknown }).__M8_FA_AUTH_ADAPTER__;
  resetRepartoFaAuthBridge();
  adapterA.resetRepartoAuthAdapter();
  configA.resetRepartoConfig();
});

describe("duplicate module instances", () => {
  it("are genuinely two evaluations of one source file", () => {
    expect(adapterB.getRepartoAuthAdapter).not.toBe(adapterA.getRepartoAuthAdapter);
    expect(configB.getRepartoConfig).not.toBe(configA.getRepartoConfig);
  });

  it("answer with the same auth adapter whichever copy registered it", () => {
    const registered = adapterA.createInMemoryAuthAdapter("tok");
    expect(adapterA.setRepartoAuthAdapter(registered)).toBe(registered);

    expect(adapterB.getRepartoAuthAdapter()).toBe(registered);
    expect(adapterA.getRepartoAuthAdapter()).toBe(registered);
  });

  it("answer with the same runtime config whichever copy configured it", () => {
    configA.configureReparto({ apiBase: "https://reparto.test", apiPrefix: "/v1" });

    expect(configB.getRepartoConfig().apiBase).toBe("https://reparto.test");
    expect(configB.getRepartoConfig().apiPrefix).toBe("/v1");
    // The merge reads the shared slot too, so the second copy widens the first
    // copy's config instead of resetting the fields it does not name.
    configB.configureReparto({ apiPrefix: "" });
    expect(configA.getRepartoConfig().apiBase).toBe("https://reparto.test");
    expect(configA.getRepartoConfig().apiPrefix).toBe("");
  });

  it("reset through either copy", () => {
    configB.configureReparto({ apiBase: "https://reparto.test" });
    configB.resetRepartoConfig();
    expect(configA.getRepartoConfig().apiBase).toBe("/reparto");

    adapterB.setRepartoAuthAdapter(adapterB.createInMemoryAuthAdapter("tok"));
    adapterB.resetRepartoAuthAdapter();
    expect(adapterA.getRepartoAuthAdapter().getAccessToken()).toBeNull();
  });
});

describe("installRepartoFaAuthBridge across the split", () => {
  it("names the signed-in user to a view holding the other copy", async () => {
    (globalThis as { __M8_FA_AUTH_ADAPTER__?: unknown }).__M8_FA_AUTH_ADAPTER__ =
      faAuthBrowserAdapter;
    (globalThis as { window?: unknown }).window = {
      location: { pathname: "/en/reparto", search: "", origin: "https://host.test", assign: vi.fn() }
    };

    installRepartoFaAuthBridge({ loginPath: "/auth/login", locales: ["en"] });

    // The read a starter route's island performs, from the copy the bridge
    // never touched. Before the shared slot this answered `null`, and the route
    // painted its read-only notice at a superadmin.
    await expect(adapterB.getRepartoAuthAdapter().getCurrentUser?.()).resolves.toEqual(session);
    expect(adapterB.resolveRepartoViewMode(session)).toBe("admin");
  });
});

describe("sharedState", () => {
  it("creates the initial value once and hands it to every later reader", () => {
    const createInitial = vi.fn(() => ({ calls: 0 }));
    const first = sharedState("test.lazy-slot", createInitial);
    const second = sharedState("test.lazy-slot", createInitial);

    const value = first.get();
    expect(second.get()).toBe(value);
    expect(createInitial).toHaveBeenCalledTimes(1);
  });

  it("keeps a value registered before anything read the slot", () => {
    const createInitial = vi.fn(() => "initial");
    const slot = sharedState("test.written-slot", createInitial);

    slot.set("registered");
    expect(slot.get()).toBe("registered");
    expect(createInitial).not.toHaveBeenCalled();
  });

  it("keeps slots apart by key", () => {
    sharedState("test.key-a", () => "a").set("a");
    expect(sharedState("test.key-b", () => "b").get()).toBe("b");
  });
});
