import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { getRepartoDictionary } from "../src/runtime/i18n/index.js";
import {
  PlanLockConfirmation,
  PlanValidationSummary,
  RequirementGenerationPreviewCard,
  RequirementGenerationResultCard,
  isRequirementGenerationAvailable
} from "../src/runtime/react/default-ui/planning/plan-generation.js";
import type {
  PlanValidationReport,
  RequirementGenerationPreview,
  RequirementGenerationResult,
  TeachingPlanPublic
} from "../src/runtime/schemas.js";

const processId = "11111111-1111-4111-8111-111111111111";
const planId = "22222222-2222-4222-8222-222222222222";
const activityId = "33333333-3333-4333-8333-333333333333";
const requirementId = "44444444-4444-4444-8444-444444444444";
const userId = "55555555-5555-4555-8555-555555555555";
const now = "2026-07-30T10:00:00Z";
const dict = getRepartoDictionary("en");

const plan = {
  id: planId,
  assignment_process_id: processId,
  allocation_revision_id: null,
  status: "locked",
  current_generation_number: 0,
  locked_at: now,
  locked_by_user_id: userId,
  requirements_generated_at: null,
  stale_reason: null,
  feasibility_status: "feasible",
  feasibility_generation: 0,
  feasibility_checked_at: now,
  feasibility_input_fingerprint: "fingerprint",
  feasibility_solver_version: "solver-v1",
  feasibility_diagnostics_ref: null,
  created_at: now,
  updated_at: now
} satisfies TeachingPlanPublic;

const report = {
  teaching_plan_id: planId,
  assignment_process_id: processId,
  is_assignment_ready: false,
  blocking_count: 1,
  warning_count: 1,
  messages: [
    {
      severity: "blocking",
      code: "plan.group_balance_mismatch",
      message: "Group hours do not match the allocation.",
      entity_type: "teaching_plan",
      entity_id: planId
    },
    {
      severity: "warning",
      code: "plan.activity_without_group",
      message: "One activity has no linked group.",
      entity_type: "teaching_activity",
      entity_id: activityId
    }
  ]
} satisfies PlanValidationReport;

const preview = {
  next_generation_number: 1,
  to_create: [
    {
      teaching_activity_id: activityId,
      position_index: 0,
      required_teacher_hours: "2.50"
    }
  ],
  create_count: 1,
  preserve_ids: [],
  preserve_count: 0,
  retire_ids: [],
  retire_count: 0,
  conflict_ids: [],
  conflict_count: 0,
  requires_reconciliation: false,
  is_noop: false
} satisfies RequirementGenerationPreview;

const generatedSlot = {
  id: requirementId,
  assignment_process_id: processId,
  teaching_activity_id: activityId,
  position_index: 0,
  required_teacher_hours: "2.50",
  status: "available",
  created_generation: 1,
  last_validated_generation: 1,
  retired_generation: null,
  superseded_by_requirement_id: null,
  created_at: now,
  updated_at: now
} as const;

const result = {
  generation_number: 1,
  created: [generatedSlot],
  created_count: 1,
  preserved_count: 0,
  retired_count: 0,
  data: [generatedSlot],
  count: 1
} satisfies RequirementGenerationResult;

describe("plan lock and requirement-generation UI", () => {
  it("derives generation availability only from server-generatable states", () => {
    expect(isRequirementGenerationAvailable(plan)).toBe(true);
    expect(
      isRequirementGenerationAvailable({ ...plan, status: "stale" })
    ).toBe(true);
    expect(
      isRequirementGenerationAvailable({ ...plan, status: "balanced" })
    ).toBe(false);
    expect(isRequirementGenerationAvailable(null)).toBe(false);
  });

  it("renders service validation findings and all query states", () => {
    const findings = renderToStaticMarkup(
      <PlanValidationSummary
        dict={dict}
        error={null}
        isLoading={false}
        report={report}
      />
    );
    expect(findings).toContain('data-plan-validation-count="blocking"');
    expect(findings).toContain('data-plan-validation-severity="warning"');
    expect(findings).toContain("plan.group_balance_mismatch");

    const empty = renderToStaticMarkup(
      <PlanValidationSummary
        dict={dict}
        error={null}
        isLoading={false}
        report={{ ...report, blocking_count: 0, warning_count: 0, messages: [] }}
      />
    );
    expect(empty).toContain('data-reparto-state="valid"');

    const unavailable = renderToStaticMarkup(
      <PlanValidationSummary
        dict={dict}
        error={new Error("validation request failed")}
        isLoading
        report={null}
      />
    );
    expect(unavailable).toContain('data-reparto-state="loading"');
    expect(unavailable).toContain("validation request failed");

    const unknownError = renderToStaticMarkup(
      <PlanValidationSummary
        dict={dict}
        error={{ status: 503 }}
        isLoading={false}
        report={null}
      />
    );
    expect(unknownError).toContain(dict.planning.generation.validationsUnavailable);
  });

  it("confirms only server-observed lock lifecycle states", () => {
    const locked = renderToStaticMarkup(
      <PlanLockConfirmation dict={dict} plan={plan} />
    );
    expect(locked).toContain('data-plan-lock-confirmed="true"');
    expect(locked).toContain('data-teaching-plan-status="locked"');

    const unlocked = renderToStaticMarkup(
      <PlanLockConfirmation
        dict={dict}
        plan={{ ...plan, status: "balanced" }}
      />
    );
    expect(unlocked).toContain('data-plan-lock-confirmed="false"');
    expect(unlocked).toContain("does not expose a lock action yet");

    expect(
      renderToStaticMarkup(<PlanLockConfirmation dict={dict} plan={null} />)
    ).toContain('data-plan-lock-confirmed="false"');
  });

  it("renders the generation preview, reconciliation guard and no-op state", () => {
    const normal = renderToStaticMarkup(
      <RequirementGenerationPreviewCard
        dict={dict}
        isPending={false}
        onCancel={() => undefined}
        onConfirm={() => undefined}
        preview={preview}
      />
    );
    expect(normal).toContain(
      'data-reparto-dialog="requirement-generation-confirmation"'
    );
    expect(normal).toContain('data-generation-preview-count="create"');
    expect(normal).toContain('data-reparto-action="generate-requirements"');

    const conflict = renderToStaticMarkup(
      <RequirementGenerationPreviewCard
        dict={dict}
        isPending
        onCancel={() => undefined}
        onConfirm={() => undefined}
        preview={{
          ...preview,
          create_count: 0,
          conflict_ids: [requirementId],
          conflict_count: 1,
          requires_reconciliation: true,
          is_noop: true
        }}
      />
    );
    expect(conflict).toContain('data-reparto-state="reconciliation-required"');
    expect(conflict).toContain('data-reparto-state="noop"');
    expect(conflict).toContain("disabled");
  });

  it("renders the applied result and authoritative generated-slot count", () => {
    const html = renderToStaticMarkup(
      <RequirementGenerationResultCard dict={dict} result={result} />
    );
    expect(html).toContain('data-reparto-slot="requirement-generation-result"');
    expect(html).toContain('data-generation-number="1"');
    expect(html).toContain('data-generated-slot-count="1"');
    expect(html).toContain("Generation 1 created 1");
  });
});
