// @vitest-environment jsdom
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getRepartoDictionary } from "../src/runtime/i18n/index.js";
import { RepartoApiError } from "../src/runtime/errors.js";
import {
  buildTeachingPlanCreationState,
  buildTeachingPlanUnlockState,
  isDuplicateTeachingPlanError,
  isMissingTeachingPlanError
} from "../src/runtime/ui/teachingPlan.js";
import type { TeachingPlanPublic } from "../src/runtime/schemas.js";

/**
 * Stage 2 has to be startable (audit finding `S2-01`).
 *
 * `POST …/teaching-plan` had a wrapper and a contract entry and no caller, so
 * the plan row was never created and every Stage 2 read answered 404 with no
 * control on screen that could change it. These tests hold three things the
 * fix has to keep: the 404 is an empty state and not a transport failure, the
 * create affordance appears exactly while the plan is absent, and a second
 * attempt shows the service's own 409 rather than a generic failure.
 */

const processId = "11111111-1111-4111-8111-111111111111";
const planId = "22222222-2222-4222-8222-222222222222";
const now = "2026-08-10T10:00:00Z";
const dict = getRepartoDictionary("en");

function planFixture(
  overrides: Partial<TeachingPlanPublic> = {}
): TeachingPlanPublic {
  return {
    id: planId,
    assignment_process_id: processId,
    allocation_revision_id: null,
    status: "draft",
    current_generation_number: 0,
    locked_at: null,
    locked_by_user_id: null,
    requirements_generated_at: null,
    stale_reason: null,
    feasibility_status: "not_evaluated",
    feasibility_generation: 0,
    feasibility_checked_at: null,
    feasibility_input_fingerprint: null,
    feasibility_solver_version: null,
    feasibility_diagnostics_ref: null,
    created_at: now,
    updated_at: now,
    ...overrides
  };
}

const state = vi.hoisted(() => ({
  plan: null as unknown,
  planLoading: false,
  planError: null as unknown,
  createPending: false,
  canAct: true
}));

const hooks = vi.hoisted(() => ({ create: vi.fn(), refetch: vi.fn() }));
const toasts = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock("../src/runtime/react/hooks.js", () => ({
  useRepartoTeachingPlan: () => ({
    data: state.plan ?? undefined,
    error: state.planError,
    isError: state.planError !== null,
    isLoading: state.planLoading,
    refetch: hooks.refetch
  }),
  useCreateRepartoTeachingPlan: () => ({
    mutate: hooks.create,
    isPending: state.createPending
  })
}));

vi.mock("../src/runtime/react/useRepartoRole.js", () => ({
  useRepartoCanAct: () => state.canAct,
  RepartoRouteGuard: ({ children }: { children: unknown }) => children,
  Shell: ({ children }: { children: unknown }) => children,
  WithSelectedProcess: ({ children }: { children: unknown }) => children
}));

vi.mock("../src/runtime/react/ui/toast-notification.js", () => ({
  repartoToast: toasts,
  RepartoToastHost: () => null
}));

function panel(): HTMLElement | null {
  return document.querySelector(
    '[data-reparto-component="teaching-plan-creation"]'
  );
}

function action(name: string): HTMLButtonElement | null {
  return document.querySelector(`[data-reparto-action="${name}"]`);
}

async function renderPanel() {
  const { TeachingPlanCreation } = await import(
    "../src/runtime/react/default-ui/planning/plan-creation.js"
  );
  return render(<TeachingPlanCreation locale="en" processId={processId} />);
}

beforeEach(() => {
  state.plan = null;
  state.planLoading = false;
  state.planError = new RepartoApiError(
    404,
    `No teaching plan for process ${processId}.`
  );
  state.createPending = false;
  state.canAct = true;
  vi.clearAllMocks();
});

afterEach(cleanup);

describe("teaching-plan presence", () => {
  it("reads a 404 as absence and any other status as a failed read", () => {
    expect(isMissingTeachingPlanError(new RepartoApiError(404, "nope"))).toBe(
      true
    );
    expect(isMissingTeachingPlanError(new RepartoApiError(500, "boom"))).toBe(
      false
    );
    expect(isMissingTeachingPlanError(new Error("offline"))).toBe(false);
    expect(isDuplicateTeachingPlanError(new RepartoApiError(409, "exists"))).toBe(
      true
    );
    expect(isDuplicateTeachingPlanError(new RepartoApiError(404, "nope"))).toBe(
      false
    );
  });

  it.each([
    [
      "the plan exists",
      { canAct: true, error: null, isLoading: false, plan: planFixture() },
      { presence: "present", canCreate: false, blockedReason: "already-exists" }
    ],
    [
      "the read has not settled",
      { canAct: true, error: null, isLoading: true, plan: null },
      { presence: "unknown", canCreate: false, blockedReason: "pending" }
    ],
    [
      "the read answered 404 for an admin",
      {
        canAct: true,
        error: new RepartoApiError(404, "none"),
        isLoading: false,
        plan: null
      },
      { presence: "absent", canCreate: true, blockedReason: null }
    ],
    [
      "the read answered 404 below the write floor",
      {
        canAct: false,
        error: new RepartoApiError(404, "none"),
        isLoading: false,
        plan: null
      },
      { presence: "absent", canCreate: false, blockedReason: "read-only" }
    ],
    [
      "the read failed for another reason",
      {
        canAct: true,
        error: new RepartoApiError(503, "unavailable"),
        isLoading: false,
        plan: null
      },
      { presence: "unavailable", canCreate: false, blockedReason: "unavailable" }
    ]
  ])("classifies %s", (_label, input, expected) => {
    expect(buildTeachingPlanCreationState(input)).toEqual(expected);
  });
});

/**
 * Two questions the unlock surface must keep apart (audit finding `S2-04`):
 * what §20.14 says the plan requires, and what the served endpoint accepts.
 * They disagree for every generation-owned status, and collapsing them either
 * hides the requirement or offers a control that answers 409.
 */
describe("teaching-plan unlock state", () => {
  it.each([
    [
      "there is no plan",
      { canAct: true, plan: null },
      { requiresUnlock: false, canUnlock: false, blockedReason: "absent" }
    ],
    [
      "the plan is still draft",
      { canAct: true, plan: planFixture({ status: "draft" }) },
      { requiresUnlock: false, canUnlock: false, blockedReason: "already-mutable" }
    ],
    [
      "the plan is unbalanced",
      { canAct: true, plan: planFixture({ status: "unbalanced" }) },
      { requiresUnlock: false, canUnlock: false, blockedReason: "already-mutable" }
    ],
    [
      "the plan is balanced and editable",
      { canAct: true, plan: planFixture({ status: "balanced" }) },
      { requiresUnlock: false, canUnlock: false, blockedReason: "already-mutable" }
    ],
    [
      "the plan is locked and the session may act",
      { canAct: true, plan: planFixture({ status: "locked" }) },
      { requiresUnlock: true, canUnlock: true, blockedReason: null }
    ],
    [
      "the plan is locked below the write floor",
      { canAct: false, plan: planFixture({ status: "locked" }) },
      { requiresUnlock: true, canUnlock: false, blockedReason: "read-only" }
    ],
    [
      "requirements have been generated",
      { canAct: true, plan: planFixture({ status: "requirements_generated" }) },
      { requiresUnlock: true, canUnlock: false, blockedReason: "generation-owned" }
    ],
    [
      "the plan went stale",
      { canAct: true, plan: planFixture({ status: "stale" }) },
      { requiresUnlock: true, canUnlock: false, blockedReason: "generation-owned" }
    ],
    [
      "the plan needs reconciliation",
      { canAct: true, plan: planFixture({ status: "reconciliation_required" }) },
      { requiresUnlock: true, canUnlock: false, blockedReason: "generation-owned" }
    ]
  ])("classifies %s", (_label, input, expected) => {
    expect(buildTeachingPlanUnlockState(input)).toEqual(expected);
  });
});

describe("teaching-plan creation panel", () => {
  it("offers creation and states the absence without an alert", async () => {
    await renderPanel();

    const section = panel();
    expect(section).not.toBeNull();
    expect(section?.getAttribute("data-teaching-plan-presence")).toBe("absent");
    // The empty state announces itself as status, never as an error.
    const absence = section?.querySelector('[data-reparto-state="absent"]');
    expect(absence?.getAttribute("role")).toBe("status");
    expect(absence?.textContent).toBe(dict.planning.creation.absent);
    expect(section?.querySelector('[role="alert"]')).toBeNull();
    expect(action("create-teaching-plan")?.disabled).toBe(false);
  });

  it("disappears once the plan exists", async () => {
    state.plan = planFixture();
    state.planError = null;
    await renderPanel();

    expect(panel()).toBeNull();
  });

  it("says nothing while the plan read is still in flight", async () => {
    state.planError = null;
    state.planLoading = true;
    await renderPanel();

    expect(panel()).toBeNull();
  });

  it("withholds the control below the admin write floor", async () => {
    state.canAct = false;
    await renderPanel();

    expect(panel()).not.toBeNull();
    // An unwired control is a dead end, so the refusal is stated instead.
    expect(action("create-teaching-plan")).toBeNull();
    expect(
      panel()?.querySelector('[data-reparto-state="read-only"]')?.textContent
    ).toBe(dict.planning.creation.readOnly);
  });

  it("reports a non-404 plan read as a failure and offers no creation", async () => {
    state.planError = new RepartoApiError(503, "Service unavailable");
    await renderPanel();

    const section = panel();
    expect(section?.getAttribute("data-teaching-plan-presence")).toBe(
      "unavailable"
    );
    const failure = section?.querySelector('[data-reparto-state="unavailable"]');
    expect(failure?.getAttribute("role")).toBe("alert");
    expect(action("create-teaching-plan")).toBeNull();
  });

  it("creates the plan for the selected process", async () => {
    await renderPanel();

    fireEvent.click(action("create-teaching-plan")!);

    expect(hooks.create).toHaveBeenCalledTimes(1);
    expect(hooks.create.mock.calls[0]?.[0]).toBe(processId);
  });

  it("surfaces the service's 409 on a second attempt and re-reads the plan", async () => {
    hooks.create.mockImplementation(
      (_id: string, options: { onError: (error: unknown) => void }) => {
        options.onError(
          new RepartoApiError(409, "Assignment process already has a plan.")
        );
      }
    );
    await renderPanel();

    fireEvent.click(action("create-teaching-plan")!);

    await waitFor(() => {
      expect(toasts.error).toHaveBeenCalledWith(
        dict.planning.creation.duplicateError,
        "Assignment process already has a plan."
      );
    });
    // The conflict is the service's, so its own words reach the form.
    const formError = panel()?.querySelector('[data-reparto-slot="form-error"]');
    expect(formError?.getAttribute("data-reparto-error-key")).toBe("conflict");
    expect(formError?.textContent).toBe(
      "Assignment process already has a plan."
    );
    expect(hooks.refetch).toHaveBeenCalledTimes(1);
  });

  it("reports any other creation failure as a failure", async () => {
    hooks.create.mockImplementation(
      (_id: string, options: { onError: (error: unknown) => void }) => {
        options.onError(new RepartoApiError(403, "Not permitted."));
      }
    );
    await renderPanel();

    fireEvent.click(action("create-teaching-plan")!);

    await waitFor(() => {
      expect(toasts.error).toHaveBeenCalledWith(
        dict.planning.creation.error,
        "Not permitted."
      );
    });
    expect(hooks.refetch).not.toHaveBeenCalled();
  });
});

describe("planning balance header", () => {
  it("presents a missing plan as an empty state, not a transport failure", async () => {
    const { PlanningBalanceHeader } = await import(
      "../src/runtime/react/default-ui/planning/balance-header.js"
    );
    render(
      <PlanningBalanceHeader
        balance={null}
        dict={dict}
        error={new RepartoApiError(404, `No teaching plan for ${processId}.`)}
        isLoading={false}
      />
    );

    const header = document.querySelector(
      '[data-reparto-slot="planning-balance-header"]'
    );
    expect(header?.querySelector('[role="alert"]')).toBeNull();
    const noPlan = header?.querySelector('[data-reparto-state="no-plan"]');
    expect(noPlan?.getAttribute("role")).toBe("status");
    expect(noPlan?.textContent).toBe(dict.planning.noPlanYet);
  });

  it("still alerts on a read that genuinely failed", async () => {
    const { PlanningBalanceHeader } = await import(
      "../src/runtime/react/default-ui/planning/balance-header.js"
    );
    render(
      <PlanningBalanceHeader
        balance={null}
        dict={dict}
        error={new RepartoApiError(500, "Internal error")}
        isLoading={false}
      />
    );

    const header = document.querySelector(
      '[data-reparto-slot="planning-balance-header"]'
    );
    expect(header?.querySelector('[role="alert"]')?.textContent).toBe(
      "Internal error"
    );
    expect(header?.querySelector('[data-reparto-state="no-plan"]')).toBeNull();
  });
});
