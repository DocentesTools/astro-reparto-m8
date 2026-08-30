// @vitest-environment jsdom
import { cleanup, fireEvent, render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { en } from "../src/runtime/i18n/en.js";
import { DEFAULT_REPARTO_NAV } from "../src/integration.js";
import { REPARTO_ROUTE_ACCESS } from "../src/runtime/routeAccess.js";
import { buildRepartoRoutes } from "../src/runtime/routes.js";
import type { DepartmentHourAllocationRevisionPublic } from "../src/runtime/schemas.js";

/**
 * The leadership allocation as a Stage 1 route (§13.2a `S2-06`, `S2-10`).
 *
 * Recording the **first** revision is §8.2 step 2 and it existed only inside
 * `AllocationChangeReconciliation` on `/planning`, framed as reconciling a
 * *change*. Nothing was broken — the form was never gated on `canReconcile` —
 * so what this file proves is reachability and framing: the route is in all
 * four maps, it mounts the same panel the reconciliation surface embeds, and
 * one implementation serves both.
 */

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");
const processId = "11111111-1111-4111-8111-111111111111";
const revisionId = "22222222-2222-4222-8222-222222222222";
const userId = "33333333-3333-4333-8333-333333333333";
const now = "2026-08-11T10:00:00Z";
const dict = en;

const revision: DepartmentHourAllocationRevisionPublic = {
  id: revisionId,
  assignment_process_id: processId,
  revision_number: 1,
  allocated_group_weekly_hours: "120.00",
  source: "manual_transcription",
  source_reference: null,
  reason: "First communication",
  is_current: true,
  superseded_at: null,
  created_by_user_id: userId,
  created_at: now,
  updated_at: now
};

const state = vi.hoisted(() => ({ canAct: true, revisions: [] as unknown[] }));
const hooks = vi.hoisted(() => ({ createRevision: vi.fn() }));
const toasts = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock("../src/runtime/react/hooks.js", () => ({
  useRepartoAllocationRevisions: () => ({
    data: { data: state.revisions, count: state.revisions.length },
    error: null,
    isError: false,
    isLoading: false
  }),
  useCreateRepartoAllocationRevision: () => ({
    isPending: false,
    mutate: hooks.createRevision
  })
}));

vi.mock("../src/runtime/react/useRepartoRole.js", () => ({
  useRepartoCanAct: () => state.canAct,
  useRepartoViewMode: () => (state.canAct ? "admin" : "readonly")
}));

vi.mock("../src/runtime/react/ui/toast-notification.js", () => ({
  repartoToast: toasts,
  RepartoToastHost: () => null
}));

vi.mock("../src/runtime/react/default-ui/route-guard.js", () => ({
  RepartoRouteGuard: ({ children }: { children?: unknown }) => children
}));

vi.mock("../src/runtime/react/default-ui/process-context.js", async () => {
  const actual = await vi.importActual<
    typeof import("../src/runtime/react/default-ui/process-context.js")
  >("../src/runtime/react/default-ui/process-context.js");
  return {
    ...actual,
    Shell: ({ children }: { children?: unknown }) => children,
    WithSelectedProcess: ({
      children
    }: {
      children: (id: string) => unknown;
    }) => children(processId)
  };
});

function action(name: string): HTMLButtonElement | null {
  return document.querySelector(`[data-reparto-action="${name}"]`);
}

async function renderView() {
  const { RepartoAllocationView } = await import(
    "../src/runtime/react/default-ui/process-crud/allocation/index.js"
  );
  render(
    <RepartoAllocationView
      config={{ apiBase: "/api", apiPrefix: "/reparto" }}
      locale="en"
      processId={processId}
    />
  );
}

beforeEach(() => {
  state.canAct = true;
  state.revisions = [revision];
  vi.clearAllMocks();
});

afterEach(cleanup);

describe("the allocation route is declared in all four maps", () => {
  it("has a default path, an access floor, an entrypoint and a Stage 1 nav entry", () => {
    expect(buildRepartoRoutes().allocation).toBe(
      "/reparto/processes/[processId]/allocation"
    );
    expect(REPARTO_ROUTE_ACCESS.allocation).toEqual({
      view: "reader",
      act: "admin"
    });

    const integration = readFileSync(
      join(repoRoot, "src", "integration.ts"),
      "utf8"
    );
    expect(integration).toContain(
      'allocation: "@mano8/astro-reparto-m8/routes/allocation.astro"'
    );

    // §8.2 step 2: after the school-wide reference data and before the
    // participants that step 3 adds. Stage 1, never Stage 2.
    const configuration = DEFAULT_REPARTO_NAV.configuration.entries.map(
      (entry) => entry.route
    );
    expect(configuration).toContain("allocation");
    expect(configuration.indexOf("allocation")).toBe(
      configuration.indexOf("participants") - 1
    );
    expect(
      DEFAULT_REPARTO_NAV.planning.entries.some(
        (entry) => entry.route === "allocation"
      )
    ).toBe(false);
  });

  it("ships the starter page that mounts the view", () => {
    const route = readFileSync(
      join(repoRoot, "src", "routes", "allocation.astro"),
      "utf8"
    );
    expect(route).toContain("RepartoAllocationView");
    expect(route).toContain('client:only="react"');

    const manifest = JSON.parse(
      readFileSync(join(repoRoot, "package.json"), "utf8")
    ) as { exports: Record<string, string> };
    expect(manifest.exports["./routes/allocation.astro"]).toBe(
      "./src/routes/allocation.astro"
    );
  });
});

describe("the allocation route mounts the shared panel", () => {
  it("frames the allocation as Stage 1 and shows the immutable history", async () => {
    await renderView();

    expect(
      document.querySelector('[data-reparto-route="allocation"]')
    ).not.toBeNull();
    expect(
      document.querySelector('[data-reparto-component="leadership-allocation"]')
    ).not.toBeNull();
    expect(document.body.textContent).toContain(dict.allocation.pageTitle);
    expect(
      document.querySelector('[data-reparto-slot="allocation-revision-history"]')
        ?.textContent
    ).toContain("120.00");
  });

  it("records a revision through the same form the planning panel embeds", async () => {
    await renderView();

    fireEvent.click(action("record-allocation-revision") as HTMLButtonElement);
    fireEvent.change(
      document.querySelector(
        '[data-reparto-field="allocated_group_weekly_hours"]'
      ) as HTMLInputElement,
      { target: { value: "132" } }
    );
    fireEvent.change(
      document.querySelector('[data-reparto-field="reason"]') as HTMLElement,
      { target: { value: "Leadership raised the allocation" } }
    );
    fireEvent.submit(
      document.querySelector(
        '[data-reparto-form="allocation-revision"]'
      ) as HTMLFormElement
    );

    expect(hooks.createRevision).toHaveBeenCalledTimes(1);
    const sent = hooks.createRevision.mock.calls[0][0];
    expect(sent.processId).toBe(processId);
    expect(sent.body.allocated_group_weekly_hours).toBe("132.00");
    expect(sent.body.reason).toBe("Leadership raised the allocation");
  });

  it("withholds the record control below ADMIN and still shows the history", async () => {
    state.canAct = false;
    await renderView();

    expect(action("record-allocation-revision")).toBeNull();
    expect(
      document.querySelector('[data-reparto-state="read-only"]')?.textContent
    ).toBe(dict.allocation.readOnly);
    expect(
      document.querySelector('[data-reparto-slot="allocation-revision-history"]')
    ).not.toBeNull();
  });
});
