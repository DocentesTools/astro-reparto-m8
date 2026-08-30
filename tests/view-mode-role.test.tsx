// @vitest-environment jsdom
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DepartmentHeadWorkspace } from "../src/runtime/react/DepartmentHeadWorkspace.js";
import { getRepartoDictionary } from "../src/runtime/i18n/index.js";
import {
  resetRepartoAuthAdapter,
  setRepartoAuthAdapter,
  type RepartoCurrentUser,
  type RepartoRole
} from "../src/runtime/authAdapter.js";
import type { ProcessSummary } from "../src/runtime/schemas.js";

/**
 * §21.8: the view mode comes from the signed-in user and from nowhere else.
 *
 * `DepartmentHeadWorkspace` and `WithSelectedProcess` used to take a `mode`
 * prop, and every route passed a literal — so the administrative surface was a
 * caller's opinion rather than a fact about the session (`RBAC-05`). The prop
 * is gone; these tests hold the two directions of the replacement gate, and the
 * per-route sweep over the §8.1 route map belongs to the route-gating item that
 * follows this one.
 */

const dict = getRepartoDictionary("en");

const processQueryState = vi.hoisted(() => ({
  processes: [] as unknown[]
}));

vi.mock("../src/runtime/react/hooks.js", () => ({
  useRepartoProcesses: () => ({
    data: { data: processQueryState.processes, count: processQueryState.processes.length },
    isLoading: false,
    isError: false,
    error: null
  }),
  useCreateRepartoProcess: () => ({ mutate: vi.fn(), isPending: false }),
  useCreateRepartoSchool: () => ({ mutate: vi.fn(), isPending: false }),
  useCreateRepartoAcademicYear: () => ({ mutate: vi.fn(), isPending: false }),
  useCreateRepartoDepartment: () => ({ mutate: vi.fn(), isPending: false }),
  useRepartoSchools: () => ({ data: { data: [], count: 0 } }),
  useRepartoAcademicYears: () => ({ data: { data: [], count: 0 } }),
  useRepartoDepartments: () => ({ data: { data: [], count: 0 } })
}));

vi.mock("../src/runtime/react/useRepartoEvents.js", () => ({
  useRepartoEventStream: () => ({
    connectionState: "disconnected",
    error: null,
    lastEventAtMs: null,
    lastEventType: null
  })
}));

const summary: ProcessSummary = {
  process_id: "11111111-1111-4111-8111-111111111111",
  generated_at: "2026-08-11T10:00:00Z",
  plan_status: "locked",
  plan_balance: null,
  readiness: "ready",
  total_slots: 4,
  assigned_slots: 1,
  available_slots: 3,
  balanced_participant_count: 1,
  pending_participant_count: 0,
  overloaded_participant_count: 0,
  current_turn: null,
  blocking_validation_count: 0
};

function signIn(user: RepartoCurrentUser | null) {
  setRepartoAuthAdapter({
    getAccessToken: () => "token",
    // Asynchronous on purpose: the real bridge answers from the auth store, so
    // the gate must survive resolving a frame after the first paint.
    getCurrentUser: async () => user
  });
}

function who(role: RepartoRole, is_superuser = role === "superadmin"): RepartoCurrentUser {
  return { id: "user-1", role, is_superuser };
}

function turnControls() {
  return document.querySelectorAll("[data-reparto-action]");
}

async function renderWorkspace() {
  const result = render(<DepartmentHeadWorkspace locale="en" summary={summary} />);
  await waitFor(() => {
    expect(document.querySelector('[data-reparto-route="dashboard"]')).not.toBeNull();
  });
  return result;
}

beforeEach(() => {
  processQueryState.processes = [];
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
  resetRepartoAuthAdapter();
});

describe("department-head workspace — mode follows the session", () => {
  it.each([
    ["admin", who("admin")],
    ["superadmin", who("superadmin")]
  ])("gives %s the turn controls and the admin heading", async (_label, user) => {
    signIn(user);
    await renderWorkspace();

    await waitFor(() => {
      expect(document.body.textContent).toContain(dict.dashboard.mode.admin);
    });
    expect(document.body.textContent).toContain(dict.dashboard.subtitleAdmin);
    const keys = [...turnControls()].map((node) =>
      node.getAttribute("data-reparto-action")
    );
    expect(keys).toEqual([
      "initialize-turns",
      "start-turn",
      "complete-turn",
      "skip-turn",
      "override-turn"
    ]);
  });

  it.each([
    ["writer", who("writer")],
    ["reader", who("reader")],
    ["user", who("user")]
  ])("gives %s the read-only surface and no turn control", async (_label, user) => {
    signIn(user);
    await renderWorkspace();

    await waitFor(() => {
      expect(document.body.textContent).toContain(dict.dashboard.mode.readonly);
    });
    expect(document.body.textContent).toContain(dict.dashboard.subtitleReadonly);
    // Absent, not disabled — the same rule the classroom-stages gate follows.
    expect(turnControls()).toHaveLength(0);
    // The read-only surface still reads: withholding an action is not
    // withholding the data a READER is entitled to (§21.4).
    expect(document.querySelector('[data-reparto-panel="assignment-progress"]')).not.toBeNull();
  });

  it("stays read-only for an anonymous session and for a silent adapter", async () => {
    signIn(null);
    await renderWorkspace();
    expect(turnControls()).toHaveLength(0);

    cleanup();
    // No `getCurrentUser` at all: the workspace must not assume authority.
    setRepartoAuthAdapter({ getAccessToken: () => "token" });
    await renderWorkspace();
    await waitFor(() => {
      expect(document.body.textContent).toContain(dict.dashboard.mode.readonly);
    });
    expect(turnControls()).toHaveLength(0);
  });
});

describe("process toolbar — badge follows the session", () => {
  async function renderToolbar() {
    const { WithSelectedProcess } = await import(
      "../src/runtime/react/default-ui/process-context.js"
    );
    processQueryState.processes = [{ id: summary.process_id, status: "in_progress" }];
    const result = render(
      <WithSelectedProcess locale="en" processId={summary.process_id}>
        {() => <span data-reparto-child="" />}
      </WithSelectedProcess>
    );
    await waitFor(() => {
      expect(document.querySelector("[data-reparto-child]")).not.toBeNull();
    });
    return result;
  }

  it("labels an admin session admin and a writer session read-only", async () => {
    signIn(who("admin"));
    await renderToolbar();
    await waitFor(() => {
      expect(
        document.querySelector("[data-reparto-dashboard-mode]")?.getAttribute(
          "data-reparto-dashboard-mode"
        )
      ).toBe("admin");
    });

    cleanup();
    signIn(who("writer"));
    await renderToolbar();
    await waitFor(() => {
      expect(
        document.querySelector("[data-reparto-dashboard-mode]")?.getAttribute(
          "data-reparto-dashboard-mode"
        )
      ).toBe("readonly");
    });
  });
});
