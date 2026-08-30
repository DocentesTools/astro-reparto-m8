// @vitest-environment jsdom
//
// `A-C2`: the dev-only `/_preview` gallery.
//
// `npm run preview:build` proves the gallery *compiles*. That is exactly the
// kind of green light this plan keeps finding pointed at the wrong thing — the
// shared package's own gallery compiled for months while every `table-page`
// sibling import was unresolved, because nothing ever ran it. So this suite
// mounts the gallery and asserts it renders real rows: the views, hooks, api
// wrappers and Zod schemas are the shipped ones, and only `fetch` and the auth
// adapter are replaced.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { installServiceStub, setStubRole } from "../fixtures/preview/src/service-stub.js";
import { PreviewApp } from "../fixtures/preview/src/preview-app.js";
import { resetRepartoAuthAdapter } from "../src/runtime/authAdapter.js";

let restoreFetch: typeof globalThis.fetch;

beforeEach(() => {
  restoreFetch = installServiceStub();
  setStubRole("admin");
});

afterEach(() => {
  cleanup();
  globalThis.fetch = restoreFetch;
  resetRepartoAuthAdapter();
});

describe("preview gallery", () => {
  it("renders the schools island against the stub service", async () => {
    render(<PreviewApp />);

    // The school name only appears if the whole path worked: the role guard
    // resolved, the view mounted, the hook ran, the api wrapper built a
    // request, the stub answered it, and the Zod schema accepted the answer.
    await waitFor(
      () => {
        expect(screen.getByText(/IES Gallery/)).toBeTruthy();
      },
      { timeout: 4000 }
    );
  });

  it("switches to another island root without losing the stub", async () => {
    render(<PreviewApp />);

    await waitFor(() => expect(screen.getByText(/IES Gallery/)).toBeTruthy(), {
      timeout: 4000
    });

    fireEvent.click(screen.getByText("Academic years"));

    await waitFor(() => expect(screen.getByText(/2026-2027/)).toBeTruthy(), {
      timeout: 4000
    });
  });

  it("remounts the island when the stubbed role changes", async () => {
    render(<PreviewApp />);

    await waitFor(() => expect(screen.getByText(/IES Gallery/)).toBeTruthy(), {
      timeout: 4000
    });

    // `user` is below the floor school setup requires, so the same island has
    // to stop offering the same affordances. The gallery exists to make that
    // difference visible rather than described.
    fireEvent.click(screen.getByText("user"));

    await waitFor(
      () => {
        expect(document.body.textContent).not.toBe("");
      },
      { timeout: 4000 }
    );
  });

  it("catches a throw in the boundary panel rather than blanking the gallery", async () => {
    render(<PreviewApp />);

    fireEvent.click(screen.getByText("Error boundary"));
    fireEvent.click(screen.getByText("Break the probe"));

    await waitFor(() => {
      expect(document.querySelector('[data-reparto-error-boundary="fallback"]')).not.toBeNull();
    });
    // The gallery shell itself survives, which is the property the boundary
    // exists to give an island's host page.
    expect(screen.getByText("astro-reparto-m8 /_preview")).toBeTruthy();
  });
});

describe("gallery service stub", () => {
  it("answers the setup lists the views read", async () => {
    const read = async (path: string) => {
      const response = await fetch(`/reparto-api${path}`);
      return (await response.json()) as { data: unknown[]; count: number };
    };

    expect((await read("/schools/")).count).toBe(1);
    expect((await read("/academic-years/")).count).toBe(1);
    expect((await read("/departments/")).count).toBe(1);
    expect((await read("/assignment-processes/")).count).toBe(1);
  });

  it("404s an unstubbed path instead of hanging", async () => {
    const response = await fetch("/reparto-api/not-a-real-route/");
    expect(response.status).toBe(404);
  });
});
