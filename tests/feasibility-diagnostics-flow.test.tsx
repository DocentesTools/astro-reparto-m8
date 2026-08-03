// @vitest-environment jsdom
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getRepartoDictionary } from "../src/runtime/i18n/index.js";
import { RepartoApiError } from "../src/runtime/errors.js";
import type {
  FeasibilityDiagnosticsReport,
  TeachingPlanPublic
} from "../src/runtime/schemas.js";

/**
 * The connected department-head diagnostics panel (§20.20 "Infeasibility
 * diagnostics and remediation panel").
 *
 * `feasibility-diagnostics.test.tsx` proves the state helper and the pure
 * view. What is proven here is the wiring: the department-head-only request
 * fires only when the stored status justifies it, a 404 plan is "no plan"
 * rather than an error, and the evaluate action round-trips through the
 * mutation with its success and failure toasts.
 */

const processId = "11111111-1111-4111-8111-111111111111";
const planId = "22222222-2222-4222-8222-222222222222";
const activityId = "33333333-3333-4333-8333-333333333333";
const subjectId = "77777777-7777-4777-8777-777777777777";
const requirementId = "44444444-4444-4444-8444-444444444444";
const now = "2026-08-03T10:00:00Z";
const dict = getRepartoDictionary("en");

function planFixture(
  overrides: Partial<TeachingPlanPublic> = {}
): TeachingPlanPublic {
  return {
    id: planId,
    assignment_process_id: processId,
    allocation_revision_id: null,
    status: "balanced",
    current_generation_number: 0,
    locked_at: null,
    locked_by_user_id: null,
    requirements_generated_at: null,
    stale_reason: null,
    feasibility_status: "infeasible",
    feasibility_generation: 0,
    feasibility_checked_at: now,
    feasibility_input_fingerprint: "fingerprint",
    feasibility_solver_version: "bounded-dfs-v1",
    feasibility_diagnostics_ref: `feasibility-witness:${planId}`,
    created_at: now,
    updated_at: now,
    ...overrides
  };
}

function reportFixture(
  overrides: Partial<FeasibilityDiagnosticsReport> = {}
): FeasibilityDiagnosticsReport {
  return {
    teaching_plan_id: planId,
    assignment_process_id: processId,
    status: "infeasible",
    checked_at: now,
    diagnostics: [
      {
        code: "slot_exceeds_every_target",
        message: "A remaining slot exceeds every participant's remaining target.",
        related_ids: [requirementId]
      }
    ],
    ...overrides
  };
}

const subjectBody = {
  id: subjectId,
  assignment_process_id: processId,
  name: "Mathematics",
  code: "MAT",
  allows_zero_groups: false,
  allows_multiple_groups: true,
  activity_type: "ordinary",
  default_group_weekly_hours: "3.00",
  default_teacher_weekly_hours_per_position: "3.00",
  default_required_teacher_count: 1,
  created_at: now,
  updated_at: now
};

const activityBody = {
  id: activityId,
  teaching_plan_id: planId,
  subject_id: subjectId,
  allocation_category: "secondary",
  activity_type: "ordinary",
  group_weekly_hours_per_group: "3.00",
  teacher_weekly_hours_per_position: "3.00",
  required_teacher_count: 1,
  notes: null,
  source: "secondary_manual",
  source_group_subject_id: null,
  sync_state: "in_sync",
  retired_at: null,
  group_subject_ids: [],
  linked_group_count: 0,
  created_at: now,
  updated_at: now
};

const slotBody = {
  id: requirementId,
  assignment_process_id: processId,
  teaching_activity_id: activityId,
  position_index: 0,
  required_teacher_hours: "3.00",
  status: "available",
  created_generation: 0,
  last_validated_generation: 0,
  retired_generation: null,
  superseded_by_requirement_id: null,
  created_at: now,
  updated_at: now
};

const state = vi.hoisted(() => ({
  plan: null as unknown,
  planLoading: false,
  planError: null as unknown,
  report: null as unknown,
  reportLoading: false,
  reportError: null as unknown,
  diagnosticsEnabled: null as boolean | null,
  evaluatePending: false
}));

const hooks = vi.hoisted(() => ({
  evaluate: vi.fn()
}));

const toasts = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock("../src/runtime/react/hooks.js", () => ({
  useRepartoTeachingPlan: () => ({
    data: state.plan ?? undefined,
    error: state.planError,
    isError: state.planError !== null,
    isLoading: state.planLoading
  }),
  useRepartoFeasibilityDiagnostics: (_processId?: string, enabled?: boolean) => {
    state.diagnosticsEnabled = enabled ?? null;
    return {
      data: state.report ?? undefined,
      error: state.reportError,
      isError: state.reportError !== null,
      isLoading: state.reportLoading
    };
  },
  useRepartoTeachingActivities: () => ({
    data: { data: [activityBody], count: 1 }
  }),
  useRepartoSubjects: () => ({ data: { data: [subjectBody], count: 1 } }),
  useRepartoHourRequirements: () => ({
    data: { data: [slotBody], count: 1 }
  }),
  useEvaluateRepartoFeasibility: () => ({
    mutate: hooks.evaluate,
    isPending: state.evaluatePending
  })
}));

vi.mock("../src/runtime/react/ui/toast-notification.js", () => ({
  repartoToast: toasts,
  RepartoToastHost: () => null
}));

function action(name: string): HTMLButtonElement | null {
  return document.querySelector(`[data-reparto-action="${name}"]`);
}

async function renderPanel() {
  const { FeasibilityDiagnosticsPanel } = await import(
    "../src/runtime/react/default-ui/planning/feasibility-diagnostics.js"
  );
  return render(
    <FeasibilityDiagnosticsPanel locale="en" processId={processId} />
  );
}

beforeEach(() => {
  state.plan = planFixture();
  state.planLoading = false;
  state.planError = null;
  state.report = reportFixture();
  state.reportLoading = false;
  state.reportError = null;
  state.diagnosticsEnabled = null;
  state.evaluatePending = false;
  vi.clearAllMocks();
});

afterEach(cleanup);

describe("department-head feasibility diagnostics panel", () => {
  it("requests the findings and renders them with resolved labels", async () => {
    await renderPanel();

    expect(state.diagnosticsEnabled).toBe(true);
    expect(
      document.querySelector('[data-reparto-list="feasibility-diagnostics"]')
    ).not.toBeNull();
    expect(
      document.querySelector(
        '[data-feasibility-diagnostic-code="slot_exceeds_every_target"]'
      )?.textContent
    ).toContain("Mathematics · Ordinary · Position 1");
    expect(
      document
        .querySelector('[data-reparto-slot="feasibility-evaluation-status"]')
        ?.getAttribute("data-feasibility-status")
    ).toBe("infeasible");
  });

  it("never fires the department-head-only request for a feasible plan", async () => {
    state.plan = planFixture({ feasibility_status: "feasible" });
    await renderPanel();

    expect(state.diagnosticsEnabled).toBe(false);
    expect(
      document.querySelector('[data-reparto-state="no-findings"]')
    ).not.toBeNull();
    expect(
      document.querySelector('[data-reparto-list="feasibility-diagnostics"]')
    ).toBeNull();
  });

  it("treats a 404 plan as no plan and disables the evaluation", async () => {
    state.plan = null;
    state.planError = new RepartoApiError(404, "No teaching plan for process.");
    await renderPanel();

    expect(
      document.querySelector('[data-reparto-state="no-plan"]')?.textContent
    ).toBe(dict.planning.feasibility.noPlan);
    const evaluate = action("evaluate-feasibility");
    expect(evaluate?.disabled).toBe(true);
    expect(evaluate?.getAttribute("data-disabled-reason")).toBe(
      dict.planning.feasibility.evaluateDisabledNoPlan
    );
  });

  it("surfaces a non-404 plan error instead of misreading it as no plan", async () => {
    state.plan = null;
    state.planError = new RepartoApiError(500, "boom");
    await renderPanel();

    expect(
      document.querySelector('[data-reparto-state="error"]')?.textContent
    ).toContain("boom");
    expect(document.querySelector('[data-reparto-state="no-plan"]')).toBeNull();
  });

  it("shows the loading state while the plan is unresolved", async () => {
    state.plan = null;
    state.planLoading = true;
    await renderPanel();

    expect(
      document.querySelector('[data-reparto-state="loading"]')?.textContent
    ).toBe(dict.planning.feasibility.planLoading);
  });

  it("runs the evaluation from the action and toasts the stored status", async () => {
    state.plan = planFixture({ feasibility_status: "not_evaluated" });
    await renderPanel();

    expect(
      document.querySelector('[data-reparto-state="not-evaluated"]')
    ).not.toBeNull();
    const evaluate = action("evaluate-feasibility");
    expect(evaluate?.disabled).toBe(false);
    fireEvent.click(evaluate as HTMLButtonElement);
    expect(hooks.evaluate).toHaveBeenCalledWith(processId, expect.anything());

    hooks.evaluate.mock.calls[0][1].onSuccess({
      status: "feasible"
    });
    await waitFor(() => {
      expect(toasts.success).toHaveBeenCalledWith(
        dict.planning.feasibility.evaluateSuccess.replace(
          "{status}",
          dict.dashboard.feasibility.feasible
        )
      );
    });
  });

  it("maps an evaluation failure without leaving the panel", async () => {
    await renderPanel();
    fireEvent.click(action("evaluate-feasibility") as HTMLButtonElement);

    hooks.evaluate.mock.calls[0][1].onError(new Error("conflict"));
    await waitFor(() => {
      expect(toasts.error).toHaveBeenCalledWith(
        dict.planning.feasibility.evaluateError,
        "conflict"
      );
    });
  });

  it("keeps the action from double-firing while an evaluation runs", async () => {
    state.evaluatePending = true;
    await renderPanel();

    const evaluate = action("evaluate-feasibility") as HTMLButtonElement;
    expect(evaluate.disabled).toBe(true);
    fireEvent.click(evaluate);
    expect(hooks.evaluate).not.toHaveBeenCalled();
  });
});
