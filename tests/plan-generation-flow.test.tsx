// @vitest-environment jsdom
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getRepartoDictionary } from "../src/runtime/i18n/index.js";
import { RepartoApiError } from "../src/runtime/errors.js";
import type {
  PlanValidationReport,
  RequirementGenerationPreview,
  RequirementGenerationResult,
  TeachingPlanPublic
} from "../src/runtime/schemas.js";

/**
 * The lock → preview → generate cycle of the planning panel (§13.2 "planning
 * state").
 *
 * `plan-generation.test.tsx` renders each card on its own with fixed props.
 * What is proven here is the workflow those cards belong to: the lock is
 * offered only for a balanced, feasible plan with no blocking finding, the
 * generation is offered only for a locked plan, and a preview that requires
 * reconciliation can never be turned into a generation.
 */

const processId = "11111111-1111-4111-8111-111111111111";
const planId = "22222222-2222-4222-8222-222222222222";
const activityId = "33333333-3333-4333-8333-333333333333";
const userId = "55555555-5555-4555-8555-555555555555";
const now = "2026-07-30T10:00:00Z";
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
    feasibility_status: "feasible",
    feasibility_generation: 0,
    feasibility_checked_at: now,
    feasibility_input_fingerprint: "fingerprint",
    feasibility_solver_version: "solver-v1",
    feasibility_diagnostics_ref: null,
    created_at: now,
    updated_at: now,
    ...overrides
  };
}

function reportFixture(
  overrides: Partial<PlanValidationReport> = {}
): PlanValidationReport {
  return {
    teaching_plan_id: planId,
    assignment_process_id: processId,
    is_assignment_ready: true,
    blocking_count: 0,
    warning_count: 0,
    messages: [],
    ...overrides
  };
}

function previewFixture(
  overrides: Partial<RequirementGenerationPreview> = {}
): RequirementGenerationPreview {
  return {
    next_generation_number: 1,
    to_create: [
      {
        teaching_activity_id: activityId,
        position_index: 0,
        required_teacher_hours: "2.50"
      }
    ],
    to_preserve: [],
    to_retire: [],
    conflicts: [],
    create_count: 1,
    preserve_count: 0,
    retire_count: 0,
    conflict_count: 0,
    requires_reconciliation: false,
    is_noop: false,
    ...overrides
  };
}

const state = vi.hoisted(() => ({
  plan: null as unknown,
  planLoading: false,
  planError: null as unknown,
  report: null as unknown,
  reportLoading: false,
  reportError: null as unknown,
  lockPending: false,
  previewPending: false,
  generatePending: false
}));

const hooks = vi.hoisted(() => ({
  lock: vi.fn(),
  preview: vi.fn(),
  generate: vi.fn()
}));

const toasts = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock("../src/runtime/react/hooks.js", () => ({
  useRepartoTeachingPlan: () => ({
    data: state.plan ?? undefined,
    error: state.planError,
    isError: state.planError !== null,
    isLoading: state.planLoading
  }),
  useRepartoTeachingPlanValidations: () => ({
    data: state.report ?? undefined,
    error: state.reportError,
    isError: state.reportError !== null,
    isLoading: state.reportLoading
  }),
  useLockRepartoTeachingPlan: () => ({
    mutate: hooks.lock,
    isPending: state.lockPending
  }),
  usePreviewRepartoRequirementGeneration: () => ({
    mutate: hooks.preview,
    isPending: state.previewPending
  }),
  useGenerateRepartoRequirements: () => ({
    mutate: hooks.generate,
    isPending: state.generatePending
  })
}));

vi.mock("../src/runtime/react/ui/toast-notification.js", () => ({
  repartoToast: toasts,
  RepartoToastHost: () => null
}));

function action(name: string): HTMLButtonElement | null {
  return document.querySelector(`[data-reparto-action="${name}"]`);
}

function requireAction(name: string): HTMLButtonElement {
  const element = action(name);
  if (element === null) throw new Error(`no action ${name}`);
  return element;
}

async function renderPanel() {
  const { PlanLockAndRequirementGeneration } = await import(
    "../src/runtime/react/default-ui/planning/plan-generation.js"
  );
  return render(
    <PlanLockAndRequirementGeneration locale="en" processId={processId} />
  );
}

beforeEach(() => {
  state.plan = planFixture();
  state.planLoading = false;
  state.planError = null;
  state.report = reportFixture();
  state.reportLoading = false;
  state.reportError = null;
  state.lockPending = false;
  state.previewPending = false;
  state.generatePending = false;
  vi.clearAllMocks();
});

afterEach(cleanup);

describe("plan lock gate", () => {
  it("offers the lock for a balanced, feasible plan with no blocking finding", async () => {
    await renderPanel();

    const review = requireAction("review-plan-lock");
    expect(review.disabled).toBe(false);
    expect(review.getAttribute("data-disabled-reason")).toBeNull();
  });

  it.each([
    [
      "the validations have not been read yet",
      { report: null },
      "lockDisabledValidations"
    ],
    [
      "a blocking finding is open",
      { report: reportFixture({ blocking_count: 2 }) },
      "lockDisabledBlocking"
    ],
    [
      "feasibility is not confirmed",
      { plan: planFixture({ feasibility_status: "not_evaluated" }) },
      "lockDisabledFeasibility"
    ],
    [
      "the plan is not balanced",
      { plan: planFixture({ status: "draft" }) },
      "lockDisabledStatus"
    ]
  ])("refuses the lock when %s", async (_label, patch, reasonKey) => {
    Object.assign(state, patch);
    await renderPanel();

    const review = requireAction("review-plan-lock");
    expect(review.disabled).toBe(true);
    // The refusal names its own cause instead of a bare disabled button.
    expect(review.getAttribute("data-disabled-reason")).toBe(
      dict.planning.generation[
        reasonKey as keyof typeof dict.planning.generation
      ]
    );
    expect(hooks.lock).not.toHaveBeenCalled();
  });

  it("locks only through the focused confirmation", async () => {
    await renderPanel();

    fireEvent.click(requireAction("review-plan-lock"));
    // Reviewing is not locking.
    expect(hooks.lock).not.toHaveBeenCalled();
    expect(
      document.querySelector('[data-reparto-dialog="plan-lock-confirmation"]')
    ).not.toBeNull();

    fireEvent.click(requireAction("lock-plan"));
    expect(hooks.lock).toHaveBeenCalledWith(processId, expect.anything());
  });

  it("shows the locked plan the service returned, not an assumed one", async () => {
    await renderPanel();
    fireEvent.click(requireAction("review-plan-lock"));
    fireEvent.click(requireAction("lock-plan"));

    hooks.lock.mock.calls[0][1].onSuccess(
      planFixture({ status: "locked", locked_at: now, locked_by_user_id: userId })
    );

    await waitFor(() => {
      expect(
        document
          .querySelector('[data-reparto-slot="plan-lock-confirmation"]')
          ?.getAttribute("data-plan-lock-confirmed")
      ).toBe("true");
    });
    expect(toasts.success).toHaveBeenCalledWith(
      dict.planning.generation.lockSuccess
    );
    // With the plan locked, generation becomes reachable.
    expect(requireAction("preview-requirement-generation").disabled).toBe(false);
  });

  it("leaves the plan unlocked when the service refuses", async () => {
    await renderPanel();
    fireEvent.click(requireAction("review-plan-lock"));
    fireEvent.click(requireAction("lock-plan"));

    hooks.lock.mock.calls[0][1].onError(
      new RepartoApiError(409, "The allocation changed since the check.")
    );

    await waitFor(() => {
      expect(toasts.error).toHaveBeenCalledWith(
        dict.planning.generation.lockError,
        "The allocation changed since the check."
      );
    });
    expect(
      document
        .querySelector('[data-reparto-slot="plan-lock-confirmation"]')
        ?.getAttribute("data-plan-lock-confirmed")
    ).toBe("false");
    expect(document.body.textContent).toContain(
      "The allocation changed since the check."
    );
  });

  it("cancels the confirmation without locking", async () => {
    await renderPanel();
    fireEvent.click(requireAction("review-plan-lock"));
    fireEvent.click(requireAction("cancel"));

    expect(hooks.lock).not.toHaveBeenCalled();
    expect(
      document.querySelector('[data-reparto-dialog="plan-lock-confirmation"]')
    ).toBeNull();
  });
});

describe("requirement generation gate", () => {
  it("withholds generation until the plan is locked", async () => {
    await renderPanel();

    const preview = requireAction("preview-requirement-generation");
    expect(preview.disabled).toBe(true);
    expect(preview.getAttribute("data-disabled-reason")).toBe(
      dict.planning.generation.previewDisabled
    );
    fireEvent.click(preview);
    expect(hooks.preview).not.toHaveBeenCalled();
  });

  it("previews and then generates for a locked plan", async () => {
    state.plan = planFixture({ status: "locked", locked_at: now });
    await renderPanel();

    fireEvent.click(requireAction("preview-requirement-generation"));
    expect(hooks.preview).toHaveBeenCalledWith(processId, expect.anything());
    hooks.preview.mock.calls[0][1].onSuccess(previewFixture());

    await waitFor(() => {
      expect(
        document.querySelector(
          '[data-reparto-dialog="requirement-generation-confirmation"]'
        )
      ).not.toBeNull();
    });
    expect(
      document.querySelector('[data-generation-preview-count="create"]')
        ?.textContent
    ).toBe("1");

    fireEvent.click(requireAction("generate-requirements"));
    expect(hooks.generate).toHaveBeenCalledWith(processId, expect.anything());

    const result: RequirementGenerationResult = {
      generation_number: 1,
      created_count: 1,
      preserved_count: 0,
      retired_count: 0,
      count: 1
    };
    hooks.generate.mock.calls[0][1].onSuccess(result);

    // The preview is consumed and replaced by the authoritative result.
    await waitFor(() => {
      expect(
        document.querySelector(
          '[data-reparto-dialog="requirement-generation-confirmation"]'
        )
      ).toBeNull();
    });
    expect(toasts.success).toHaveBeenCalledTimes(1);
  });

  it("never generates from a preview that requires reconciliation", async () => {
    state.plan = planFixture({ status: "locked" });
    await renderPanel();
    fireEvent.click(requireAction("preview-requirement-generation"));
    hooks.preview.mock.calls[0][1].onSuccess(
      previewFixture({ requires_reconciliation: true, conflict_count: 3 })
    );

    await waitFor(() => {
      expect(
        document.querySelector('[data-reparto-state="reconciliation-required"]')
      ).not.toBeNull();
    });
    const generate = requireAction("generate-requirements");
    expect(generate.disabled).toBe(true);
    expect(generate.getAttribute("data-disabled-reason")).toBe(
      dict.planning.generation.reconciliationRequired
    );
    fireEvent.click(generate);
    expect(hooks.generate).not.toHaveBeenCalled();
  });

  it("marks a preview that would change nothing", async () => {
    state.plan = planFixture({ status: "locked" });
    await renderPanel();
    fireEvent.click(requireAction("preview-requirement-generation"));
    hooks.preview.mock.calls[0][1].onSuccess(
      previewFixture({ create_count: 0, to_create: [], is_noop: true })
    );

    await waitFor(() => {
      expect(document.querySelector('[data-reparto-state="noop"]')).not.toBeNull();
    });
    expect(document.body.textContent).toContain(
      dict.planning.generation.noChanges
    );
  });

  it("drops the preview when the service refuses it", async () => {
    state.plan = planFixture({ status: "locked" });
    await renderPanel();
    fireEvent.click(requireAction("preview-requirement-generation"));
    hooks.preview.mock.calls[0][1].onError(
      new RepartoApiError(422, "The plan is no longer locked.")
    );

    await waitFor(() => {
      expect(toasts.error).toHaveBeenCalledWith(
        dict.planning.generation.previewError,
        "The plan is no longer locked."
      );
    });
    expect(
      document.querySelector(
        '[data-reparto-dialog="requirement-generation-confirmation"]'
      )
    ).toBeNull();
  });

  it("keeps the preview open when the generation itself fails", async () => {
    state.plan = planFixture({ status: "locked" });
    await renderPanel();
    fireEvent.click(requireAction("preview-requirement-generation"));
    hooks.preview.mock.calls[0][1].onSuccess(previewFixture());
    await waitFor(() => requireAction("generate-requirements"));

    fireEvent.click(requireAction("generate-requirements"));
    hooks.generate.mock.calls[0][1].onError(
      new RepartoApiError(500, "Generator unavailable.")
    );

    await waitFor(() => {
      expect(toasts.error).toHaveBeenCalledWith(
        dict.planning.generation.generateError,
        "Generator unavailable."
      );
    });
    expect(
      document.querySelector(
        '[data-reparto-dialog="requirement-generation-confirmation"]'
      )
    ).not.toBeNull();
  });

  it("cancels a preview without generating", async () => {
    state.plan = planFixture({ status: "locked" });
    await renderPanel();
    fireEvent.click(requireAction("preview-requirement-generation"));
    hooks.preview.mock.calls[0][1].onSuccess(previewFixture());
    await waitFor(() => requireAction("generate-requirements"));

    fireEvent.click(requireAction("cancel"));
    expect(hooks.generate).not.toHaveBeenCalled();
    expect(
      document.querySelector(
        '[data-reparto-dialog="requirement-generation-confirmation"]'
      )
    ).toBeNull();
  });

  // A locked plan is the normal entry point; a stale one is re-generated to
  // absorb an allocation change that did not need explicit reconciliation.
  it.each([["locked"], ["stale"]])(
    "keeps generation reachable for a %s plan",
    async (status) => {
      state.plan = planFixture({
        status: status as TeachingPlanPublic["status"]
      });
      await renderPanel();

      expect(requireAction("preview-requirement-generation").disabled).toBe(
        false
      );
    }
  );

  // `reconciliation_required` must go through the reconciliation panel first,
  // and `requirements_generated` already has its generation: re-running either
  // from here would bypass a decision the service expects to be made elsewhere.
  it.each([
    ["draft"],
    ["balanced"],
    ["requirements_generated"],
    ["reconciliation_required"]
  ])("withholds generation for a %s plan", async (status) => {
    state.plan = planFixture({
      status: status as TeachingPlanPublic["status"]
    });
    await renderPanel();

    const preview = requireAction("preview-requirement-generation");
    expect(preview.disabled).toBe(true);
    expect(preview.getAttribute("data-disabled-reason")).toBe(
      dict.planning.generation.previewDisabled
    );
  });
});

describe("plan panel transport states", () => {
  it("reports a loading plan and suspends the actions", async () => {
    state.plan = null;
    state.planLoading = true;
    await renderPanel();

    expect(document.querySelector('[data-reparto-state="loading"]')).not.toBeNull();
    expect(requireAction("preview-requirement-generation").disabled).toBe(true);
    // With no plan there is nothing to lock, so no lock control is offered.
    expect(action("review-plan-lock")).toBeNull();
  });

  it("prints the service's own message when the plan cannot be read", async () => {
    state.plan = null;
    state.planError = new Error("Plan endpoint unavailable");
    await renderPanel();

    expect(document.querySelector('[data-reparto-state="error"]')?.textContent).toBe(
      "Plan endpoint unavailable"
    );
    expect(requireAction("preview-requirement-generation").disabled).toBe(true);
  });

  it("falls back to a generic message for a non-Error plan failure", async () => {
    state.plan = null;
    state.planError = "offline";
    await renderPanel();

    expect(document.querySelector('[data-reparto-state="error"]')?.textContent).toBe(
      dict.planning.generation.planUnavailable
    );
  });
});
