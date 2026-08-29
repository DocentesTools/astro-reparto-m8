// @vitest-environment jsdom
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getRepartoDictionary } from "../src/runtime/i18n/index.js";
import { RepartoApiError } from "../src/runtime/errors.js";
import type {
  DepartmentHourAllocationRevisionPublic,
  RequirementReconciliationPreview,
  RequirementReconciliationResult,
  SubjectPublic,
  TeachingActivityPublic,
  TeachingPlanPublic
} from "../src/runtime/schemas.js";

/**
 * The allocation-revision and reconciliation cycle (§13.2 "planning state" and
 * "conflicts").
 *
 * `allocation-reconciliation.test.tsx` proves the request builder and each card
 * in isolation. What is proven here is the panel's own refusals: reconciliation
 * is offered only for a service-declared stale or reconciliation-required plan,
 * the resolution is reason-required, the confirmation carries the preview's own
 * conflict count so a moved world is rejected by the service, and a stale
 * preview is withdrawn rather than retried.
 */

const processId = "11111111-1111-4111-8111-111111111111";
const planId = "22222222-2222-4222-8222-222222222222";
const activityId = "33333333-3333-4333-8333-333333333333";
const requirementId = "44444444-4444-4444-8444-444444444444";
const assignmentId = "55555555-5555-4555-8555-555555555555";
const teacherId = "66666666-6666-4666-8666-666666666666";
const subjectId = "77777777-7777-4777-8777-777777777777";
const revisionId = "88888888-8888-4888-8888-888888888888";
const userId = "99999999-9999-4999-8999-999999999999";
const now = "2026-08-02T10:00:00Z";
const dict = getRepartoDictionary("en");

function planFixture(
  overrides: Partial<TeachingPlanPublic> = {}
): TeachingPlanPublic {
  return {
    id: planId,
    assignment_process_id: processId,
    allocation_revision_id: revisionId,
    status: "reconciliation_required",
    current_generation_number: 4,
    locked_at: now,
    locked_by_user_id: userId,
    requirements_generated_at: now,
    stale_reason: "Allocation changed",
    feasibility_status: "feasible",
    feasibility_generation: 4,
    feasibility_checked_at: now,
    feasibility_input_fingerprint: "fingerprint",
    feasibility_solver_version: "solver-v1",
    feasibility_diagnostics_ref: null,
    created_at: now,
    updated_at: now,
    ...overrides
  };
}

const subject: SubjectPublic = {
  id: subjectId,
  assignment_process_id: processId,
  name: "Mathematics",
  allocation_category: "main",
  activity_type: "ordinary",
  default_group_weekly_hours: "4.00",
  default_teacher_weekly_hours_per_position: "4.00",
  default_required_teacher_count: 1,
  allows_multiple_groups: false,
  allows_zero_groups: false,
  notes: null,
  created_at: now,
  updated_at: now
};

const activity: TeachingActivityPublic = {
  id: activityId,
  teaching_plan_id: planId,
  subject_id: subjectId,
  allocation_category: "main",
  activity_type: "ordinary",
  group_weekly_hours_per_group: "4.00",
  teacher_weekly_hours_per_position: "4.00",
  required_teacher_count: 1,
  notes: null,
  source: "main_generated",
  source_group_subject_id: null,
  sync_state: "in_sync",
  retired_at: null,
  group_subject_ids: [],
  linked_group_count: 0,
  created_at: now,
  updated_at: now
};

const conflict = {
  requirement_id: requirementId,
  teaching_activity_id: activityId,
  position_index: 0,
  resolution: "value_changed",
  current_required_teacher_hours: "4.00",
  new_required_teacher_hours: "5.00",
  assignment_id: assignmentId,
  process_teacher_id: teacherId,
  superseded_by_requirement_id: null
} as const;

function previewFixture(
  overrides: Partial<RequirementReconciliationPreview> = {}
): RequirementReconciliationPreview {
  return {
    next_generation_number: 5,
    conflicts: [conflict],
    conflict_count: 1,
    create_count: 1,
    preserve_count: 3,
    retire_count: 1,
    requires_reconciliation: true,
    is_noop: false,
    ...overrides
  };
}

const revision: DepartmentHourAllocationRevisionPublic = {
  id: revisionId,
  assignment_process_id: processId,
  revision_number: 2,
  allocated_group_weekly_hours: "120.00",
  reason: "Leadership changed the allocation",
  source: "manual_transcription",
  source_reference: null,
  received_at: null,
  created_by_user_id: userId,
  superseded_at: null,
  created_at: now,
  updated_at: now
};

const state = vi.hoisted(() => ({
  canAct: true,
  plan: null as unknown,
  planLoading: false,
  planError: null as unknown,
  revisions: [] as unknown[],
  revisionsLoading: false,
  revisionsError: null as unknown,
  createPending: false,
  previewPending: false,
  reconcilePending: false
}));

const hooks = vi.hoisted(() => ({
  createRevision: vi.fn(),
  preview: vi.fn(),
  reconcile: vi.fn()
}));

const toasts = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

// The allocation panel now owns its own `admin` write floor (§21.5, audit
// `S2-06`), because `/allocation` mounts it with nothing else gating it.
vi.mock("../src/runtime/react/useRepartoRole.js", () => ({
  useRepartoCanAct: () => state.canAct,
  useRepartoViewMode: () => (state.canAct ? "admin" : "readonly")
}));

vi.mock("../src/runtime/react/hooks.js", () => ({
  useRepartoTeachingPlan: () => ({
    data: state.plan ?? undefined,
    error: state.planError,
    isError: state.planError !== null,
    isLoading: state.planLoading
  }),
  useRepartoAllocationRevisions: () => ({
    data: { data: state.revisions, count: state.revisions.length },
    error: state.revisionsError,
    isError: state.revisionsError !== null,
    isLoading: state.revisionsLoading
  }),
  useRepartoTeachingActivities: () => ({
    data: { data: [activity], count: 1 },
    error: null,
    isError: false,
    isLoading: false
  }),
  useRepartoSubjects: () => ({
    data: { data: [subject], count: 1 },
    error: null,
    isError: false,
    isLoading: false
  }),
  useCreateRepartoAllocationRevision: () => ({
    mutate: hooks.createRevision,
    isPending: state.createPending
  }),
  usePreviewRepartoRequirementReconciliation: () => ({
    mutate: hooks.preview,
    isPending: state.previewPending
  }),
  useReconcileRepartoRequirements: () => ({
    mutate: hooks.reconcile,
    isPending: state.reconcilePending
  })
}));

vi.mock("../src/runtime/react/ui/toast-notification.js", () => ({
  repartoToast: toasts,
  RepartoToastHost: () => null
}));

function field(name: string) {
  const element = document.querySelector(`[data-reparto-field="${name}"]`);
  if (element === null) throw new Error(`no field ${name}`);
  return element;
}

function action(name: string): HTMLButtonElement | null {
  return document.querySelector(`[data-reparto-action="${name}"]`);
}

function requireAction(name: string): HTMLButtonElement {
  const element = action(name);
  if (element === null) throw new Error(`no action ${name}`);
  return element;
}

async function renderPanel() {
  const { AllocationChangeReconciliation } = await import(
    "../src/runtime/react/default-ui/planning/allocation-reconciliation.js"
  );
  return render(
    <AllocationChangeReconciliation locale="en" processId={processId} />
  );
}

/** Open the reconciliation preview the service accepts. */
function takePreview(result = previewFixture()) {
  fireEvent.click(requireAction("preview-requirement-reconciliation"));
  hooks.preview.mock.calls.at(-1)![1].onSuccess(result);
}

beforeEach(() => {
  state.canAct = true;
  state.plan = planFixture();
  state.planLoading = false;
  state.planError = null;
  state.revisions = [revision];
  state.revisionsLoading = false;
  state.revisionsError = null;
  state.createPending = false;
  state.previewPending = false;
  state.reconcilePending = false;
  vi.clearAllMocks();
});

afterEach(cleanup);

describe("allocation revision recording", () => {
  it("withholds the record control below the admin floor and says so", async () => {
    // Mounted as the `/allocation` route mounts it. The reconciliation panel
    // that embeds it is withheld entirely below the floor now, so this case
    // asks the panel that a `READER` is actually shown.
    state.canAct = false;
    const { LeadershipAllocationPanel } = await import(
      "../src/runtime/react/default-ui/planning/allocation-reconciliation.js"
    );
    render(<LeadershipAllocationPanel locale="en" processId={processId} />);

    expect(action("record-allocation-revision")).toBeNull();
    expect(
      document.querySelector('[data-reparto-state="read-only"]')?.textContent
    ).toBe(dict.allocation.readOnly);
    // The history is data a `READER` is entitled to (§21.4).
    expect(
      document.querySelector('[data-reparto-slot="allocation-revision-history"]')
    ).not.toBeNull();
  });

  it("records an audited revision with trimmed values", async () => {
    await renderPanel();
    fireEvent.click(requireAction("record-allocation-revision"));

    fireEvent.change(field("allocated_group_weekly_hours"), {
      target: { value: "132.50" }
    });
    fireEvent.change(field("reason"), {
      target: { value: "  Leadership raised the allocation  " }
    });
    fireEvent.submit(
      document.querySelector('[data-reparto-form="allocation-revision"]')!
    );

    const sent = hooks.createRevision.mock.calls[0][0];
    expect(sent.processId).toBe(processId);
    expect(sent.body.allocated_group_weekly_hours).toBe("132.50");
    expect(sent.body.reason).toBe("Leadership raised the allocation");
    expect(sent.body.source).toBe("manual_transcription");
  });

  it("refuses to record a revision with no reason or no hours", async () => {
    await renderPanel();
    fireEvent.click(requireAction("record-allocation-revision"));

    fireEvent.submit(
      document.querySelector('[data-reparto-form="allocation-revision"]')!
    );

    // An allocation change is an audited event; it cannot be anonymous.
    expect(hooks.createRevision).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(document.body.textContent).toContain(dict.error.required);
    });
  });

  it("closes and clears the form once the service accepts it", async () => {
    await renderPanel();
    fireEvent.click(requireAction("record-allocation-revision"));
    fireEvent.change(field("allocated_group_weekly_hours"), {
      target: { value: "132.50" }
    });
    fireEvent.change(field("reason"), { target: { value: "Raised" } });
    fireEvent.submit(
      document.querySelector('[data-reparto-form="allocation-revision"]')!
    );

    hooks.createRevision.mock.calls[0][1].onSuccess(revision);

    await waitFor(() => {
      expect(
        document.querySelector('[data-reparto-form="allocation-revision"]')
      ).toBeNull();
    });
    expect(toasts.success).toHaveBeenCalledWith(
      dict.planning.reconciliation.allocationRecorded
    );
  });

  it("keeps the form open with the service's message when it refuses", async () => {
    await renderPanel();
    fireEvent.click(requireAction("record-allocation-revision"));
    fireEvent.change(field("allocated_group_weekly_hours"), {
      target: { value: "132.50" }
    });
    fireEvent.change(field("reason"), { target: { value: "Raised" } });
    fireEvent.submit(
      document.querySelector('[data-reparto-form="allocation-revision"]')!
    );

    hooks.createRevision.mock.calls[0][1].onError(
      new RepartoApiError(422, "Hours must be a two-decimal string.")
    );

    await waitFor(() => {
      expect(toasts.error).toHaveBeenCalledWith(
        dict.planning.reconciliation.allocationError,
        "Hours must be a two-decimal string."
      );
    });
    expect(
      document.querySelector('[data-reparto-form="allocation-revision"]')
    ).not.toBeNull();
  });

  it("prints the service's own message when the history cannot be read", async () => {
    state.revisions = [];
    state.revisionsError = new Error("Revisions endpoint unavailable");
    await renderPanel();

    expect(
      document.querySelector('[data-reparto-state="error"]')?.textContent
    ).toBe("Revisions endpoint unavailable");
  });
});

describe("reconciliation gate", () => {
  it.each([["stale"], ["reconciliation_required"]])(
    "offers reconciliation for a %s plan",
    async (status) => {
      state.plan = planFixture({
        status: status as TeachingPlanPublic["status"]
      });
      await renderPanel();

      expect(
        requireAction("preview-requirement-reconciliation").disabled
      ).toBe(false);
    }
  );

  it.each([["draft"], ["balanced"], ["locked"], ["requirements_generated"]])(
    "withholds reconciliation for a %s plan",
    async (status) => {
      state.plan = planFixture({
        status: status as TeachingPlanPublic["status"]
      });
      await renderPanel();

      const preview = requireAction("preview-requirement-reconciliation");
      // The staleness is the service's to declare, never the client's to infer.
      expect(preview.disabled).toBe(true);
      expect(preview.getAttribute("data-disabled-reason")).toBe(
        dict.planning.reconciliation.previewDisabled
      );
      fireEvent.click(preview);
      expect(hooks.preview).not.toHaveBeenCalled();
    }
  );

  it("lists each affected requirement with its manual resolution", async () => {
    await renderPanel();
    takePreview();

    await waitFor(() => {
      expect(
        document.querySelector(
          '[data-reparto-dialog="requirement-reconciliation-confirmation"]'
        )
      ).not.toBeNull();
    });
    expect(
      document.querySelector('[data-reparto-manual-action]')?.getAttribute(
        "data-reparto-manual-action"
      )
    ).toBe("release-and-replace");
  });

  it("keeps the resolution behind a reason", async () => {
    await renderPanel();
    takePreview();
    await waitFor(() => requireAction("reconcile-requirements"));

    const confirm = requireAction("reconcile-requirements");
    expect(confirm.disabled).toBe(true);
    expect(confirm.getAttribute("data-disabled-reason")).toBe(
      dict.error.required
    );
    fireEvent.click(confirm);
    expect(hooks.reconcile).not.toHaveBeenCalled();

    fireEvent.change(field("reconciliation_reason"), {
      target: { value: "Applying the new allocation" }
    });
    await waitFor(() => {
      expect(requireAction("reconcile-requirements").disabled).toBe(false);
    });
  });

  it("sends the reason with the preview's own conflict count", async () => {
    await renderPanel();
    takePreview(previewFixture({ conflict_count: 4 }));
    await waitFor(() => requireAction("reconcile-requirements"));
    fireEvent.change(field("reconciliation_reason"), {
      target: { value: "Applying the new allocation" }
    });
    fireEvent.click(requireAction("reconcile-requirements"));

    expect(hooks.reconcile.mock.calls[0][0]).toEqual({
      processId,
      body: {
        reason: "Applying the new allocation",
        // The service refuses the call outright if the conflict set moved.
        expected_conflict_count: 4
      }
    });
  });

  it("replaces the preview with the authoritative result", async () => {
    await renderPanel();
    takePreview();
    await waitFor(() => requireAction("reconcile-requirements"));
    fireEvent.change(field("reconciliation_reason"), {
      target: { value: "Applying the new allocation" }
    });
    fireEvent.click(requireAction("reconcile-requirements"));

    const result: RequirementReconciliationResult = {
      generation_number: 5,
      resolved: [{ ...conflict, superseded_by_requirement_id: requirementId }],
      resolved_count: 1,
      released_assignment_ids: [assignmentId],
      created: [],
      created_count: 1,
      preserved_count: 3,
      retired_count: 1,
      data: [],
      count: 5
    };
    hooks.reconcile.mock.calls[0][1].onSuccess(result);

    await waitFor(() => {
      expect(
        document.querySelector(
          '[data-reparto-dialog="requirement-reconciliation-confirmation"]'
        )
      ).toBeNull();
    });
    expect(toasts.success).toHaveBeenCalledTimes(1);
  });

  it("withdraws a stale preview instead of offering a retry", async () => {
    await renderPanel();
    takePreview();
    await waitFor(() => requireAction("reconcile-requirements"));
    fireEvent.change(field("reconciliation_reason"), {
      target: { value: "Applying the new allocation" }
    });
    fireEvent.click(requireAction("reconcile-requirements"));

    hooks.reconcile.mock.calls[0][1].onError(
      new RepartoApiError(409, "The conflict set changed.")
    );

    await waitFor(() => {
      expect(
        document.querySelector(
          '[data-reparto-dialog="requirement-reconciliation-confirmation"]'
        )
      ).toBeNull();
    });
    expect(toasts.error).toHaveBeenCalledWith(
      dict.planning.reconciliation.stalePreviewError
    );
  });

  it("keeps a still-valid preview when the resolution fails otherwise", async () => {
    await renderPanel();
    takePreview();
    await waitFor(() => requireAction("reconcile-requirements"));
    fireEvent.change(field("reconciliation_reason"), {
      target: { value: "Applying the new allocation" }
    });
    fireEvent.click(requireAction("reconcile-requirements"));

    hooks.reconcile.mock.calls[0][1].onError(
      new RepartoApiError(500, "Reconciler unavailable.")
    );

    await waitFor(() => {
      expect(toasts.error).toHaveBeenCalledWith(
        dict.planning.reconciliation.reconcileError,
        "Reconciler unavailable."
      );
    });
    expect(
      document.querySelector(
        '[data-reparto-dialog="requirement-reconciliation-confirmation"]'
      )
    ).not.toBeNull();
  });

  it("drops a preview the service refused", async () => {
    await renderPanel();
    fireEvent.click(requireAction("preview-requirement-reconciliation"));
    hooks.preview.mock.calls[0][1].onError(
      new RepartoApiError(422, "The plan is no longer stale.")
    );

    await waitFor(() => {
      expect(toasts.error).toHaveBeenCalledWith(
        dict.planning.reconciliation.previewError,
        "The plan is no longer stale."
      );
    });
    expect(
      document.querySelector(
        '[data-reparto-dialog="requirement-reconciliation-confirmation"]'
      )
    ).toBeNull();
  });

  it("reports a preview with no conflict to resolve", async () => {
    await renderPanel();
    takePreview(previewFixture({ conflicts: [], conflict_count: 0, is_noop: true }));

    await waitFor(() => {
      expect(
        document.querySelector('[data-reparto-state="no-conflicts"]')
      ).not.toBeNull();
    });
    expect(document.querySelector('[data-reparto-state="noop"]')).not.toBeNull();
  });

  it("cancels a preview without reconciling", async () => {
    await renderPanel();
    takePreview();
    await waitFor(() => requireAction("reconcile-requirements"));

    fireEvent.click(requireAction("cancel"));
    expect(hooks.reconcile).not.toHaveBeenCalled();
    expect(
      document.querySelector(
        '[data-reparto-dialog="requirement-reconciliation-confirmation"]'
      )
    ).toBeNull();
  });
});
