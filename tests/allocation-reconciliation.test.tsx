import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { RepartoApiError } from "../src/runtime/errors.js";
import { getRepartoDictionary } from "../src/runtime/i18n/index.js";
import {
  AllocationRevisionHistory,
  ReconciliationStatusCard,
  RequirementReconciliationPreviewCard,
  RequirementReconciliationResultCard,
  buildAllocationRevisionRequest,
  buildReconciliationConflictRows,
  isAllocationReconciliationAvailable,
  isStaleRequirementReconciliationError
} from "../src/runtime/react/default-ui/planning/allocation-reconciliation.js";
import type {
  DepartmentHourAllocationRevisionPublic,
  RequirementReconciliationPreview,
  RequirementReconciliationResult,
  SubjectPublic,
  TeachingActivityPublic,
  TeachingPlanPublic
} from "../src/runtime/schemas.js";

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

const plan = {
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
  updated_at: now
} satisfies TeachingPlanPublic;

const subject = {
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
} satisfies SubjectPublic;

const activity = {
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
} satisfies TeachingActivityPublic;

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

const preview = {
  next_generation_number: 5,
  conflicts: [conflict],
  conflict_count: 1,
  create_count: 1,
  preserve_count: 3,
  retire_count: 1,
  requires_reconciliation: true,
  is_noop: false
} satisfies RequirementReconciliationPreview;

const revision = {
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
} satisfies DepartmentHourAllocationRevisionPublic;

const replacement = {
  id: requirementId,
  assignment_process_id: processId,
  teaching_activity_id: activityId,
  position_index: 0,
  required_teacher_hours: "5.00",
  status: "available",
  created_generation: 5,
  last_validated_generation: 5,
  retired_generation: null,
  superseded_by_requirement_id: null,
  created_at: now,
  updated_at: now
} as const;

const result = {
  generation_number: 5,
  resolved: [{ ...conflict, superseded_by_requirement_id: requirementId }],
  resolved_count: 1,
  released_assignment_ids: [assignmentId],
  created: [replacement],
  created_count: 1,
  preserved_count: 3,
  retired_count: 1,
  data: [replacement],
  count: 5
} satisfies RequirementReconciliationResult;

describe("allocation-change reconciliation UI", () => {
  it("builds an exact audited allocation request and validates local fields", () => {
    expect(
      buildAllocationRevisionRequest(
        {
          allocatedHours: "120",
          reason: "  Leadership update  ",
          source: "file_import",
          sourceReference: "  allocation.csv  "
        },
        dict
      )
    ).toEqual({
      ok: true,
      request: {
        allocated_group_weekly_hours: "120.00",
        reason: "Leadership update",
        source: "file_import",
        source_reference: "allocation.csv"
      }
    });

    expect(
      buildAllocationRevisionRequest(
        {
          allocatedHours: "0",
          reason: "",
          source: "other",
          sourceReference: "x".repeat(501)
        },
        dict
      )
    ).toMatchObject({
      ok: false,
      errors: {
        allocatedHours: dict.planning.reconciliation.positiveHoursError,
        reason: dict.error.required,
        sourceReference: dict.planning.reconciliation.sourceReferenceError
      }
    });
    expect(
      buildAllocationRevisionRequest(
        {
          allocatedHours: "1.234",
          reason: "x".repeat(501),
          source: "manual_transcription",
          sourceReference: ""
        },
        dict
      )
    ).toMatchObject({ ok: false });
  });

  it("derives reconciliation availability only from service-owned plan states", () => {
    expect(isAllocationReconciliationAvailable(plan)).toBe(true);
    expect(
      isAllocationReconciliationAvailable({ ...plan, status: "stale" })
    ).toBe(true);
    expect(
      isAllocationReconciliationAvailable({
        ...plan,
        status: "requirements_generated"
      })
    ).toBe(false);
    expect(isAllocationReconciliationAvailable(null)).toBe(false);
    expect(
      isStaleRequirementReconciliationError(
        new RepartoApiError(409, "Preview changed")
      )
    ).toBe(true);
    expect(
      isStaleRequirementReconciliationError(
        new RepartoApiError(400, "Invalid")
      )
    ).toBe(false);
  });

  it("renders stale state, preserved assignment notice and immutable history", () => {
    const stale = renderToStaticMarkup(
      <ReconciliationStatusCard dict={dict} plan={plan} />
    );
    expect(stale).toContain('data-reparto-state="stale"');
    expect(stale).toContain('data-reparto-state="assignments-preserved"');
    expect(stale).toContain('data-teaching-plan-status="reconciliation_required"');

    const current = renderToStaticMarkup(
      <ReconciliationStatusCard
        dict={dict}
        plan={{ ...plan, status: "requirements_generated" }}
      />
    );
    expect(current).toContain('data-reparto-state="current"');

    const history = renderToStaticMarkup(
      <AllocationRevisionHistory
        dict={dict}
        isLoading={false}
        revisions={[
          {
            ...revision,
            id: "10101010-1010-4010-8010-101010101010",
            revision_number: 1,
            superseded_at: now
          },
          revision
        ]}
      />
    );
    expect(history).toContain('data-reparto-table="allocation-revisions"');
    expect(history).toContain('data-reparto-state="current-allocation"');
    expect(history).toContain(dict.planning.reconciliation.historyPreserved);

    expect(
      renderToStaticMarkup(
        <AllocationRevisionHistory dict={dict} isLoading revisions={[]} />
      )
    ).toContain('data-reparto-state="loading"');
    expect(
      renderToStaticMarkup(
        <AllocationRevisionHistory
          dict={dict}
          isLoading={false}
          revisions={[]}
        />
      )
    ).toContain('data-reparto-state="empty"');
  });

  it("renders affected requirements, preserved counts and manual resolution actions", () => {
    expect(
      buildReconciliationConflictRows(
        preview,
        [activity],
        [subject],
        "Unknown"
      )
    ).toEqual([
      {
        requirementId,
        activityLabel: "Mathematics",
        position: 1,
        currentHours: "4.00",
        newHours: "5.00",
        resolution: "value_changed"
      }
    ]);

    const html = renderToStaticMarkup(
      <RequirementReconciliationPreviewCard
        activities={[activity]}
        dict={dict}
        isPending={false}
        onCancel={() => undefined}
        onConfirm={() => undefined}
        onReasonChange={() => undefined}
        preview={preview}
        reason="Reviewed with the department"
        subjects={[subject]}
      />
    );
    expect(html).toContain('data-reconciliation-preview-count="preserve"');
    expect(html).toContain('data-reparto-table="reconciliation-conflicts"');
    expect(html).toContain('data-reparto-manual-action="release-and-replace"');
    expect(html).toContain('data-reparto-action="reconcile-requirements"');
    expect(html).toContain("Mathematics");
    expect(html).toContain("4.00 hours → 5.00 hours");

    const removed = renderToStaticMarkup(
      <RequirementReconciliationPreviewCard
        activities={[]}
        dict={dict}
        isPending
        onCancel={() => undefined}
        onConfirm={() => undefined}
        onReasonChange={() => undefined}
        preview={{
          ...preview,
          conflicts: [
            {
              ...conflict,
              resolution: "removed",
              new_required_teacher_hours: null
            }
          ]
        }}
        reason=""
        subjects={[]}
      />
    );
    expect(removed).toContain('data-reparto-manual-action="release-and-retire"');
    expect(removed).toContain("disabled");

    const noConflicts = renderToStaticMarkup(
      <RequirementReconciliationPreviewCard
        activities={[]}
        dict={dict}
        isPending={false}
        onCancel={() => undefined}
        onConfirm={() => undefined}
        onReasonChange={() => undefined}
        preview={{
          ...preview,
          conflicts: [],
          conflict_count: 0,
          requires_reconciliation: false,
          is_noop: true
        }}
        reason="No assigned conflicts"
        subjects={[]}
      />
    );
    expect(noConflicts).toContain('data-reparto-state="no-conflicts"');
    expect(noConflicts).toContain('data-reparto-state="noop"');
  });

  it("renders the authoritative reconciliation result and live-slot count", () => {
    const html = renderToStaticMarkup(
      <RequirementReconciliationResultCard dict={dict} result={result} />
    );
    expect(html).toContain('data-reparto-slot="requirement-reconciliation-result"');
    expect(html).toContain('data-generation-number="5"');
    expect(html).toContain('data-reconciled-live-slot-count="5"');
    expect(html).toContain("released 1 assignments");
  });
});
