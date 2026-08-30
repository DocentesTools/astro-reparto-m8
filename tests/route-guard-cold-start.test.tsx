// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RepartoRouteGuard } from "../src/runtime/react/default-ui/route-guard.js";
import { getRepartoDictionary } from "../src/runtime/i18n/index.js";
import {
  resetRepartoAuthAdapter,
  setRepartoAuthAdapter,
  type RepartoAuthAdapter,
  type RepartoCurrentUser
} from "../src/runtime/authAdapter.js";

/**
 * §13.6 walk-through finding: on the built host every reparto route stayed on
 * "Checking your access…" forever.
 *
 * The routes mount before the host's auth provider has restored the session
 * from its refresh cookie, so the first `getCurrentUser` reaches the issuer
 * with no token and is refused. The hook awaited that promise with no
 * rejection path, so `resolved` never became true — and because the starter
 * routes are `client:only`, nothing ever painted again. Every gate in this
 * package was green while no route was usable, which is exactly the gap the
 * live walk-through exists to close.
 *
 * These tests hold the two halves of the fix: a cold start recovers, and a
 * genuine failure fails closed instead of hanging.
 */

const dict = getRepartoDictionary("en");

const ADMIN: RepartoCurrentUser = {
  id: "11111111-1111-4111-8111-111111111111",
  role: "admin",
  is_superuser: false
};

afterEach(() => {
  cleanup();
  resetRepartoAuthAdapter();
});

/** An adapter whose first `getCurrentUser` fails until a refresh has run. */
function coldStartAdapter(options: { refreshWorks: boolean }) {
  const calls = { getCurrentUser: 0, refresh: 0 };
  let token: string | null = null;
  const adapter: RepartoAuthAdapter = {
    getAccessToken: () => token,
    refresh: async () => {
      calls.refresh += 1;
      if (options.refreshWorks) token = "access-token";
      return token;
    },
    getCurrentUser: async () => {
      calls.getCurrentUser += 1;
      if (!token) throw new Error("Session expired. Please log in again.");
      return ADMIN;
    }
  };
  return { adapter, calls };
}

describe("RepartoRouteGuard cold start", () => {
  it("recovers the session and renders the route when the first lookup is refused", async () => {
    const { adapter, calls } = coldStartAdapter({ refreshWorks: true });
    setRepartoAuthAdapter(adapter);

    render(
      <RepartoRouteGuard locale="en" route="dashboard">
        <p>route content</p>
      </RepartoRouteGuard>
    );

    expect(screen.getByText(dict.view.access.checking)).toBeTruthy();
    await waitFor(() => expect(screen.getByText("route content")).toBeTruthy());
    expect(calls.refresh).toBe(1);
    // Asked again after the refresh — the retry is what makes it recover.
    expect(calls.getCurrentUser).toBeGreaterThan(1);
  });

  it("refreshes once for concurrently mounted guards", async () => {
    const { adapter, calls } = coldStartAdapter({ refreshWorks: true });
    setRepartoAuthAdapter(adapter);

    render(
      <>
        <RepartoRouteGuard locale="en" route="dashboard">
          <p>first</p>
        </RepartoRouteGuard>
        <RepartoRouteGuard locale="en" route="planning">
          <p>second</p>
        </RepartoRouteGuard>
      </>
    );

    await waitFor(() => {
      expect(screen.getByText("first")).toBeTruthy();
      expect(screen.getByText("second")).toBeTruthy();
    });
    // The issuer rotates the refresh token: a second concurrent refresh would
    // invalidate the first and report a valid session as expired.
    expect(calls.refresh).toBe(1);
  });

  it("fails closed rather than waiting forever when recovery also fails", async () => {
    const { adapter, calls } = coldStartAdapter({ refreshWorks: false });
    setRepartoAuthAdapter(adapter);

    render(
      <RepartoRouteGuard locale="en" route="dashboard">
        <p>route content</p>
      </RepartoRouteGuard>
    );

    await waitFor(() => expect(screen.getByText(dict.view.access.forbidden)).toBeTruthy());
    expect(screen.queryByText(dict.view.access.checking)).toBeNull();
    expect(screen.queryByText("route content")).toBeNull();
    expect(calls.getCurrentUser).toBeGreaterThan(1);
  });

  it("does not refresh when the first lookup already answers", async () => {
    const calls = { refresh: 0 };
    setRepartoAuthAdapter({
      getAccessToken: () => "access-token",
      refresh: async () => {
        calls.refresh += 1;
        return "access-token";
      },
      getCurrentUser: async () => ADMIN
    });

    render(
      <RepartoRouteGuard locale="en" route="dashboard">
        <p>route content</p>
      </RepartoRouteGuard>
    );

    await waitFor(() => expect(screen.getByText("route content")).toBeTruthy());
    expect(calls.refresh).toBe(0);
  });
});

/** Guard against the regression returning through an unhandled rejection. */
it("never leaves an unhandled rejection behind on a cold start", async () => {
  const unhandled = vi.fn();
  process.on("unhandledRejection", unhandled);
  const { adapter } = coldStartAdapter({ refreshWorks: true });
  setRepartoAuthAdapter(adapter);

  render(
    <RepartoRouteGuard locale="en" route="dashboard">
      <p>route content</p>
    </RepartoRouteGuard>
  );
  await waitFor(() => expect(screen.getByText("route content")).toBeTruthy());
  await new Promise((resolve) => setTimeout(resolve, 20));

  process.off("unhandledRejection", unhandled);
  expect(unhandled).not.toHaveBeenCalled();
});
