// @vitest-environment jsdom
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { en } from "../src/runtime/i18n/en.js";
import { DEFAULT_REPARTO_NAV } from "../src/integration.js";
import { REPARTO_ROUTE_ACCESS } from "../src/runtime/routeAccess.js";
import { buildRepartoRoutes } from "../src/runtime/routes.js";
import {
  buildProcessReopenRequest,
  buildProcessReopenState,
  buildProcessSettingsRequest,
  buildProcessSettingsValues,
  isSelectionOrderModeEffective
} from "../src/runtime/ui/processSettings.js";
import type {
  AssignmentProcessPublic,
  AssignmentProcessStatus
} from "../src/runtime/schemas.js";

/**
 * Process settings and the reopen edge as surfaces an operator can reach
 * (§13.2a `S2-03`, `S2-05`).
 *
 * `AssignmentProcessUpdateSchema` carried every selection and LAN field and
 * `assignmentProcesses.update` / `.reopen` were both wrappers — with no hook
 * and no control behind either, a process was create-only, §8.2 step 7 had no
 * entry point, and a closed process refused every child write while the service
 * told the operator to *"reopen it first"*.
 *
 * The claims here are the reachable ones: the route is in all four maps, the
 * form sends only what changed and never `status`, and the reopen control
 * appears exactly for a frozen process and acts only where the service accepts
 * the edge.
 */

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");
const processId = "11111111-1111-4111-8111-111111111111";
const now = "2026-08-11T10:00:00Z";
const dict = en;

function makeProcess(
  overrides: Partial<AssignmentProcessPublic> = {}
): AssignmentProcessPublic {
  return {
    id: processId,
    academic_year_id: "22222222-2222-4222-8222-222222222222",
    school_id: "33333333-3333-4333-8333-333333333333",
    department_id: "44444444-4444-4444-8444-444444444444",
    status: "draft",
    default_teacher_hours_reference: null,
    selection_order_enabled: false,
    selection_order_mode: "none",
    direct_teacher_selection_enabled: false,
    lan_access_enabled: false,
    created_from_process_id: null,
    closed_at: null,
    closed_by_user_id: null,
    created_by_user_id: "55555555-5555-4555-8555-555555555555",
    created_at: now,
    updated_at: now,
    ...overrides
  };
}

const state = vi.hoisted(() => ({
  canAct: true,
  process: null as unknown,
  isLoading: false,
  isError: false,
  error: null as unknown
}));

const hooks = vi.hoisted(() => ({ update: vi.fn(), reopen: vi.fn() }));
const toasts = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock("../src/runtime/react/hooks.js", () => ({
  useRepartoProcess: () => ({
    data: state.process,
    error: state.error,
    isError: state.isError,
    isLoading: state.isLoading
  }),
  useUpdateRepartoProcess: () => ({ isPending: false, mutate: hooks.update }),
  useReopenRepartoProcess: () => ({ isPending: false, mutate: hooks.reopen })
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

function field(name: string) {
  const element = document.querySelector(`[data-reparto-field="${name}"]`);
  if (element === null) throw new Error(`no field ${name}`);
  return element;
}

function action(name: string): HTMLButtonElement {
  const element = document.querySelector(`[data-reparto-action="${name}"]`);
  if (element === null) throw new Error(`no action ${name}`);
  return element as HTMLButtonElement;
}

async function renderView() {
  const { RepartoProcessSettingsView } = await import(
    "../src/runtime/react/default-ui/process-crud/process-settings/index.js"
  );
  render(
    <RepartoProcessSettingsView
      config={{ apiBase: "/api", apiPrefix: "/reparto" }}
      locale="en"
      processId={processId}
    />
  );
}

beforeEach(() => {
  state.canAct = true;
  state.process = makeProcess();
  state.isLoading = false;
  state.isError = false;
  state.error = null;
  vi.clearAllMocks();
});

afterEach(cleanup);

describe("the processSettings route is declared in all four maps", () => {
  it("has a default path, an access floor, an entrypoint and a nav entry", () => {
    expect(buildRepartoRoutes().processSettings).toBe(
      "/reparto/processes/[processId]/settings"
    );
    expect(REPARTO_ROUTE_ACCESS.processSettings).toEqual({
      view: "reader",
      act: "admin"
    });

    const integration = readFileSync(
      join(repoRoot, "src", "integration.ts"),
      "utf8"
    );
    expect(integration).toContain(
      'processSettings: "@mano8/astro-reparto-m8/routes/settings.astro"'
    );

    // Stage 1, and after the matrix: §8.2 step 7 is the last configuration
    // decision before planning starts.
    const entries = DEFAULT_REPARTO_NAV.configuration.entries.map(
      (entry) => entry.route
    );
    expect(entries).toContain("processSettings");
    expect(entries.indexOf("processSettings")).toBeGreaterThan(
      entries.indexOf("groupSubjects")
    );
  });

  it("ships the starter page that mounts the view", () => {
    const route = readFileSync(
      join(repoRoot, "src", "routes", "settings.astro"),
      "utf8"
    );
    expect(route).toContain("RepartoProcessSettingsView");
    expect(route).toContain('client:only="react"');

    const manifest = JSON.parse(
      readFileSync(join(repoRoot, "package.json"), "utf8")
    ) as { exports: Record<string, string> };
    expect(manifest.exports["./routes/settings.astro"]).toBe(
      "./src/routes/settings.astro"
    );
  });
});

describe("buildProcessSettingsRequest", () => {
  it("sends only the fields that changed", () => {
    const process = makeProcess({ lan_access_enabled: false });
    const values = {
      ...buildProcessSettingsValues(process),
      lanAccessEnabled: true
    };
    const built = buildProcessSettingsRequest(values, process);

    expect(built).toEqual({
      ok: true,
      changed: true,
      request: { lan_access_enabled: true }
    });
  });

  it("reports an untouched form as unchanged rather than an empty PATCH", () => {
    const process = makeProcess();
    expect(
      buildProcessSettingsRequest(buildProcessSettingsValues(process), process)
    ).toEqual({ ok: true, changed: false });
  });

  it("keeps a blank hours reference distinct from a typed zero", () => {
    const process = makeProcess({ default_teacher_hours_reference: 18 });
    const blank = buildProcessSettingsRequest(
      {
        ...buildProcessSettingsValues(process),
        defaultTeacherHoursReference: ""
      },
      process
    );
    expect(blank).toEqual({
      ok: true,
      changed: true,
      request: { default_teacher_hours_reference: null }
    });

    const zero = buildProcessSettingsRequest(
      {
        ...buildProcessSettingsValues(process),
        defaultTeacherHoursReference: "0"
      },
      process
    );
    expect(zero).toEqual({
      ok: true,
      changed: true,
      request: { default_teacher_hours_reference: 0 }
    });
  });

  it("refuses an hour value the decimal contract forbids", () => {
    expect(
      buildProcessSettingsRequest(
        {
          ...buildProcessSettingsValues(makeProcess()),
          defaultTeacherHoursReference: "18.456"
        },
        makeProcess()
      )
    ).toEqual({
      ok: false,
      errors: { defaultTeacherHoursReference: "too_many_decimals" }
    });
  });

  it("never carries status, which the service reserves for the transition", () => {
    const process = makeProcess({ status: "draft" });
    const built = buildProcessSettingsRequest(
      { ...buildProcessSettingsValues(process), lanAccessEnabled: true },
      process
    );
    expect(built.ok && built.changed && "status" in built.request).toBe(false);
  });

  it("calls a mode inert while the selection order is off", () => {
    const values = buildProcessSettingsValues(
      makeProcess({ selection_order_mode: "strict" })
    );
    expect(isSelectionOrderModeEffective(values)).toBe(false);
    expect(
      isSelectionOrderModeEffective({ ...values, selectionOrderEnabled: true })
    ).toBe(true);
  });
});

describe("buildProcessReopenState", () => {
  it.each([
    ["draft", false, false, "mutable"],
    ["assigning", false, false, "mutable"],
    ["final", true, true, null],
    ["archived", true, false, "terminal"]
  ] as [AssignmentProcessStatus, boolean, boolean, string | null][])(
    "classifies %s as frozen=%s reopenable=%s",
    (status, isFrozen, canReopen, blockedReason) => {
      expect(
        buildProcessReopenState({
          canAct: true,
          process: makeProcess({ status })
        })
      ).toEqual({ isFrozen, canReopen, blockedReason });
    }
  );

  it("states the frozen process below the write floor without the control", () => {
    expect(
      buildProcessReopenState({
        canAct: false,
        process: makeProcess({ status: "final" })
      })
    ).toEqual({ isFrozen: true, canReopen: false, blockedReason: "read-only" });
  });

  it("says nothing at all before the process has been read", () => {
    expect(buildProcessReopenState({ canAct: true, process: null })).toEqual({
      isFrozen: false,
      canReopen: false,
      blockedReason: "unknown"
    });
  });

  it("requires a reason of 1-500 characters on the reopen", () => {
    expect(buildProcessReopenRequest("   ")).toEqual({
      ok: false,
      error: "required"
    });
    expect(buildProcessReopenRequest("x".repeat(501))).toEqual({
      ok: false,
      error: "too_long"
    });
    expect(buildProcessReopenRequest("  returned  ")).toEqual({
      ok: true,
      request: { reason: "returned" }
    });
  });
});

describe("the settings form on the route", () => {
  it("mounts the form and shows the status without offering it", async () => {
    await renderView();

    expect(
      document.querySelector('[data-reparto-route="process-settings"]')
    ).not.toBeNull();
    expect(document.querySelector('[data-reparto-form="process-settings"]')).not.toBeNull();
    expect(
      document.querySelector('[data-reparto-slot="process-status"]')?.textContent
    ).toContain(dict.entity.assignmentProcess.status.draft);
    // `update_process` answers 400 for a `status` field, so no control offers it.
    expect(document.querySelector('[data-reparto-field="status"]')).toBeNull();
  });

  it("saves only the switched field", async () => {
    await renderView();

    fireEvent.click(field("lan_access_enabled"));
    fireEvent.click(action("save-process-settings"));

    expect(hooks.update).toHaveBeenCalledTimes(1);
    const sent = hooks.update.mock.calls[0][0];
    expect(sent.processId).toBe(processId);
    expect(sent.body).toEqual({ lan_access_enabled: true });
  });

  it("withholds the save while nothing has changed", async () => {
    await renderView();

    expect(action("save-process-settings").disabled).toBe(true);
    expect(
      document.querySelector('[data-reparto-state="unchanged"]')?.textContent
    ).toBe(dict.processSettings.unchanged);
  });

  it("states an inert selection-order mode rather than forcing the switch", async () => {
    state.process = makeProcess({ selection_order_mode: "strict" });
    await renderView();

    expect(
      document.querySelector('[data-reparto-slot="selection-order-mode-inert"]')
        ?.textContent
    ).toBe(dict.processSettings.hint.modeInert);
  });

  it("rejects an out-of-contract hour value before the request leaves", async () => {
    await renderView();

    fireEvent.change(field("default_teacher_hours_reference"), {
      target: { value: "18.456" }
    });
    fireEvent.click(action("save-process-settings"));

    expect(hooks.update).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(document.body.textContent).toContain(
        dict.processSettings.hoursError.too_many_decimals
      );
    });
  });

  it("reports a refused save with the service's own words", async () => {
    await renderView();
    fireEvent.click(field("lan_access_enabled"));
    fireEvent.click(action("save-process-settings"));

    const { RepartoApiError } = await import("../src/runtime/errors.js");
    hooks.update.mock.calls[0][1].onError(
      new RepartoApiError(400, "Process status is owned by the transition endpoint.")
    );

    await waitFor(() => {
      expect(toasts.error).toHaveBeenCalledWith(
        dict.processSettings.saveError,
        "Process status is owned by the transition endpoint."
      );
    });
  });

  it("withholds every settings affordance below ADMIN and says so", async () => {
    state.canAct = false;
    await renderView();

    expect(document.querySelectorAll("[data-reparto-action]")).toHaveLength(0);
    expect(
      document.querySelector('[data-reparto-form="process-settings"]')
    ).toBeNull();
    expect(
      document.querySelector('[data-reparto-state="read-only"]')?.textContent
    ).toBe(dict.processSettings.readOnly);
    // A reader still reads the status: it is data they are entitled to (§21.4).
    expect(
      document.querySelector('[data-reparto-slot="process-status"]')
    ).not.toBeNull();
  });
});

describe("the reopen control on the route", () => {
  it("says nothing at all while the process still accepts writes", async () => {
    await renderView();

    expect(
      document.querySelector('[data-reparto-component="process-reopen"]')
    ).toBeNull();
  });

  it("states the refusal and offers the reason-carrying reopen for a final process", async () => {
    state.process = makeProcess({ status: "final", closed_at: now });
    await renderView();

    expect(
      document.querySelector('[data-reparto-state="process-frozen"]')?.textContent
    ).toBe(dict.processSettings.reopen.frozen);
    // The consequence is stated before the press, not after (§20.18 in spirit).
    expect(
      document.querySelector(
        '[data-reparto-slot="process-reopen-consequence"]'
      )?.textContent
    ).toBe(dict.processSettings.reopen.consequence);

    fireEvent.change(field("reopen_reason"), {
      target: { value: "leadership returned the proposal" }
    });
    fireEvent.click(action("reopen-process"));

    expect(hooks.reopen).toHaveBeenCalledTimes(1);
    expect(hooks.reopen.mock.calls[0][0]).toEqual({
      processId,
      body: { reason: "leadership returned the proposal" }
    });
  });

  it("refuses to reopen without a reason", async () => {
    state.process = makeProcess({ status: "final" });
    await renderView();

    fireEvent.click(action("reopen-process"));

    expect(hooks.reopen).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(document.body.textContent).toContain(
        dict.processSettings.reopen.reasonRequired
      );
    });
  });

  it("explains an archived process instead of offering a control that 400s", async () => {
    state.process = makeProcess({ status: "archived" });
    await renderView();

    expect(
      document.querySelector('[data-reparto-state="terminal"]')?.textContent
    ).toBe(dict.processSettings.reopen.terminal);
    expect(
      document.querySelector('[data-reparto-action="reopen-process"]')
    ).toBeNull();
  });

  it("states the frozen process below the write floor without the control", async () => {
    state.canAct = false;
    state.process = makeProcess({ status: "final" });
    await renderView();

    expect(
      document.querySelector('[data-reparto-state="process-frozen"]')
    ).not.toBeNull();
    expect(
      document.querySelector('[data-reparto-action="reopen-process"]')
    ).toBeNull();
  });
});
