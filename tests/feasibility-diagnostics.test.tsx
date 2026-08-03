import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { getRepartoDictionary } from "../src/runtime/i18n/index.js";
import type {
  FeasibilityDiagnosticCode,
  FeasibilityDiagnosticsReport,
  HourRequirementPublic,
  SubjectPublic,
  TeachingActivityPublic,
  TeachingPlanPublic
} from "../src/runtime/schemas.js";
import {
  buildFeasibilityDiagnosticRows,
  buildFeasibilityPanelState,
  EMPTY_FEASIBILITY_LOOKUP,
  feasibilityRelatedKind,
  isFeasibilityDiagnosticsExpected
} from "../src/runtime/ui/feasibility.js";
import {
  buildFeasibilityDiagnosticsLookup,
  FeasibilityDiagnosticsView
} from "../src/runtime/react/default-ui/planning/feasibility-diagnostics.js";

const processId = "11111111-1111-4111-8111-111111111111";
const planId = "22222222-2222-4222-8222-222222222222";
const activityId = "33333333-3333-4333-8333-333333333333";
const subjectId = "77777777-7777-4777-8777-777777777777";
const requirementId = "44444444-4444-4444-8444-444444444444";
const orphanId = "55555555-5555-4555-8555-555555555555";
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
    diagnostics: [],
    ...overrides
  };
}

const subject = {
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
} satisfies SubjectPublic;

const activity = {
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
} satisfies TeachingActivityPublic;

const slot = {
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
} satisfies HourRequirementPublic;

const lookup = buildFeasibilityDiagnosticsLookup({
  activities: [activity],
  dict,
  requirements: [slot],
  subjects: [subject]
});

describe("feasibilityRelatedKind", () => {
  it("decides the related-id meaning from the stable code only", () => {
    expect(feasibilityRelatedKind("slot_exceeds_every_target")).toBe("slot");
    expect(feasibilityRelatedKind("distinct_teacher_shortfall")).toBe(
      "activity"
    );
    const noneCodes: FeasibilityDiagnosticCode[] = [
      "incompatible_residual_totals",
      "unsatisfiable_targets",
      "instance_size_limit",
      "step_limit",
      "time_limit"
    ];
    for (const code of noneCodes) {
      expect(feasibilityRelatedKind(code)).toBe("none");
    }
  });
});

describe("isFeasibilityDiagnosticsExpected", () => {
  it("justifies the department-head request only for negative outcomes", () => {
    expect(isFeasibilityDiagnosticsExpected("infeasible")).toBe(true);
    expect(isFeasibilityDiagnosticsExpected("unknown")).toBe(true);
    expect(isFeasibilityDiagnosticsExpected("feasible")).toBe(false);
    expect(isFeasibilityDiagnosticsExpected("not_evaluated")).toBe(false);
    expect(isFeasibilityDiagnosticsExpected(null)).toBe(false);
    expect(isFeasibilityDiagnosticsExpected(undefined)).toBe(false);
  });
});

describe("buildFeasibilityDiagnosticRows", () => {
  it("reads a missing report as zero rows, never as an error", () => {
    expect(buildFeasibilityDiagnosticRows(null)).toEqual([]);
    expect(buildFeasibilityDiagnosticRows(undefined)).toEqual([]);
    expect(buildFeasibilityDiagnosticRows(reportFixture())).toEqual([]);
  });

  it("resolves activity and slot references through the supplied lookup", () => {
    const rows = buildFeasibilityDiagnosticRows(
      reportFixture({
        diagnostics: [
          {
            code: "distinct_teacher_shortfall",
            message: "An activity has too few distinct participants.",
            related_ids: [activityId, orphanId]
          },
          {
            code: "slot_exceeds_every_target",
            message: "A remaining slot exceeds every target.",
            related_ids: [requirementId]
          }
        ]
      }),
      lookup
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]?.affected).toEqual(["Mathematics · Ordinary"]);
    expect(rows[0]?.unresolvedCount).toBe(1);
    expect(rows[1]?.affected).toEqual(["Mathematics · Ordinary · Position 1"]);
    expect(rows[1]?.unresolvedCount).toBe(0);
    expect(rows[0]?.message).toContain("too few distinct participants");
  });

  it("counts rather than prints identifiers a code should not carry", () => {
    const rows = buildFeasibilityDiagnosticRows(
      reportFixture({
        diagnostics: [
          {
            code: "unsatisfiable_targets",
            message: "No exact assignment satisfies every participant target.",
            related_ids: [activityId]
          }
        ]
      }),
      lookup
    );
    expect(rows[0]?.affected).toEqual([]);
    expect(rows[0]?.unresolvedCount).toBe(1);
  });

  it("fails closed with the empty lookup", () => {
    const rows = buildFeasibilityDiagnosticRows(
      reportFixture({
        diagnostics: [
          {
            code: "distinct_teacher_shortfall",
            message: "An activity has too few distinct participants.",
            related_ids: [activityId]
          },
          {
            code: "slot_exceeds_every_target",
            message: "A remaining slot exceeds every target.",
            related_ids: [requirementId]
          }
        ]
      }),
      EMPTY_FEASIBILITY_LOOKUP
    );
    expect(rows[0]?.affected).toEqual([]);
    expect(rows[0]?.unresolvedCount).toBe(1);
    expect(rows[1]?.affected).toEqual([]);
    expect(rows[1]?.unresolvedCount).toBe(1);
  });
});

describe("buildFeasibilityPanelState", () => {
  it("keeps a missing plan and an unevaluated plan as their own states", () => {
    expect(buildFeasibilityPanelState({ plan: null })).toEqual({
      kind: "no_plan"
    });
    expect(buildFeasibilityPanelState({ plan: undefined })).toEqual({
      kind: "no_plan"
    });
    expect(
      buildFeasibilityPanelState({
        plan: planFixture({ feasibility_status: "not_evaluated" })
      })
    ).toEqual({ kind: "not_evaluated" });
  });

  it("reports a feasible plan with no diagnostics request and no rows", () => {
    const state = buildFeasibilityPanelState({
      plan: planFixture({ feasibility_status: "feasible" })
    });
    expect(state).toEqual({
      kind: "evaluated",
      status: "feasible",
      checkedAt: now,
      solverVersion: "bounded-dfs-v1",
      diagnosticsExpected: false,
      rows: []
    });
  });

  it("carries the findings for a negative evaluation", () => {
    const state = buildFeasibilityPanelState({
      plan: planFixture({ feasibility_status: "infeasible" }),
      report: reportFixture({
        diagnostics: [
          {
            code: "incompatible_residual_totals",
            message: "Remaining participant targets and slot hours differ.",
            related_ids: []
          }
        ]
      }),
      lookup
    });
    expect(state.kind).toBe("evaluated");
    if (state.kind !== "evaluated") return;
    expect(state.diagnosticsExpected).toBe(true);
    expect(state.rows).toHaveLength(1);
    expect(state.rows[0]?.code).toBe("incompatible_residual_totals");
  });

  it("falls back to the empty lookup when none is supplied", () => {
    const state = buildFeasibilityPanelState({
      plan: planFixture({ feasibility_status: "unknown" }),
      report: reportFixture({
        status: "unknown",
        diagnostics: [
          {
            code: "distinct_teacher_shortfall",
            message: "An activity has too few distinct participants.",
            related_ids: [activityId]
          }
        ]
      })
    });
    expect(state.kind).toBe("evaluated");
    if (state.kind !== "evaluated") return;
    expect(state.rows[0]?.unresolvedCount).toBe(1);
  });
});

describe("buildFeasibilityDiagnosticsLookup", () => {
  it("labels activities and slots with the requirements vocabulary", () => {
    expect(lookup.activityLabel(activityId)).toBe("Mathematics · Ordinary");
    expect(lookup.activityLabel(orphanId)).toBeNull();
    expect(lookup.slotLabel(requirementId)).toBe(
      "Mathematics · Ordinary · Position 1"
    );
    expect(lookup.slotLabel(orphanId)).toBeNull();
  });

  it("labels a slot whose activity is gone with the unknown-activity text", () => {
    const orphanSlotLookup = buildFeasibilityDiagnosticsLookup({
      activities: [],
      dict,
      requirements: [slot],
      subjects: []
    });
    expect(orphanSlotLookup.slotLabel(requirementId)).toBe(
      "Unknown teaching activity · Position 1"
    );
    expect(orphanSlotLookup.activityLabel(activityId)).toBeNull();
  });

  it("labels an activity whose subject is gone with the unknown-subject text", () => {
    const orphanSubjectLookup = buildFeasibilityDiagnosticsLookup({
      activities: [activity],
      dict,
      requirements: [],
      subjects: []
    });
    expect(orphanSubjectLookup.activityLabel(activityId)).toBe(
      "Unknown subject · Ordinary"
    );
  });
});

describe("FeasibilityDiagnosticsView", () => {
  it("renders the no-plan state with the action disabled", () => {
    const html = renderToStaticMarkup(
      <FeasibilityDiagnosticsView
        dict={dict}
        evaluateDisabled
        evaluateDisabledReason={dict.planning.feasibility.evaluateDisabledNoPlan}
        state={{ kind: "no_plan" }}
      />
    );
    expect(html).toContain('data-reparto-component="feasibility-diagnostics"');
    expect(html).toContain('data-reparto-tier="department-head"');
    expect(html).toContain('data-reparto-state="no-plan"');
    expect(html).toContain('data-reparto-action="evaluate-feasibility"');
    expect(html).toContain("disabled");
    expect(html).toContain(dict.planning.feasibility.evaluateDisabledNoPlan);
  });

  it("renders the not-evaluated state without inventing findings", () => {
    const html = renderToStaticMarkup(
      <FeasibilityDiagnosticsView dict={dict} state={{ kind: "not_evaluated" }} />
    );
    expect(html).toContain('data-reparto-state="not-evaluated"');
    expect(html).not.toContain("feasibility-diagnostic-code");
  });

  it("renders a feasible evaluation as evaluated with no findings", () => {
    const html = renderToStaticMarkup(
      <FeasibilityDiagnosticsView
        dict={dict}
        state={{
          kind: "evaluated",
          status: "feasible",
          checkedAt: now,
          solverVersion: "bounded-dfs-v1",
          diagnosticsExpected: false,
          rows: []
        }}
      />
    );
    expect(html).toContain('data-feasibility-status="feasible"');
    expect(html).toContain('data-reparto-state="no-findings"');
    expect(html).toContain(now);
    expect(html).toContain("bounded-dfs-v1");
  });

  it("renders findings with resolved affected labels and suggestions", () => {
    const html = renderToStaticMarkup(
      <FeasibilityDiagnosticsView
        dict={dict}
        state={{
          kind: "evaluated",
          status: "infeasible",
          checkedAt: now,
          solverVersion: null,
          diagnosticsExpected: true,
          rows: [
            {
              code: "distinct_teacher_shortfall",
              message: "An activity has too few distinct participants.",
              affected: ["Mathematics · Ordinary"],
              unresolvedCount: 2
            }
          ]
        }}
      />
    );
    expect(html).toContain('data-feasibility-status="infeasible"');
    expect(html).toContain('data-reparto-list="feasibility-diagnostics"');
    expect(html).toContain(
      'data-feasibility-diagnostic-code="distinct_teacher_shortfall"'
    );
    expect(html).toContain("Mathematics · Ordinary");
    expect(html).toContain('data-feasibility-unresolved-count="2"');
    expect(html).toContain(dict.planning.feasibility.suggestionTitle);
    // renderToStaticMarkup escapes the apostrophe in the suggestion text.
    expect(html).toContain(
      dict.planning.feasibility.suggestion.distinct_teacher_shortfall.replace(
        /'/g,
        "&#x27;"
      )
    );
    expect(html).not.toContain(orphanId);
  });

  it("renders loading and error states of the diagnostics query", () => {
    const loading = renderToStaticMarkup(
      <FeasibilityDiagnosticsView
        dict={dict}
        diagnosticsLoading
        state={{
          kind: "evaluated",
          status: "unknown",
          checkedAt: null,
          solverVersion: null,
          diagnosticsExpected: true,
          rows: []
        }}
      />
    );
    expect(loading).toContain('data-reparto-state="loading"');
    expect(loading).not.toContain('data-reparto-state="no-findings"');

    const failure = renderToStaticMarkup(
      <FeasibilityDiagnosticsView
        dict={dict}
        diagnosticsError={new Error("conflict")}
        state={{
          kind: "evaluated",
          status: "infeasible",
          checkedAt: null,
          solverVersion: null,
          diagnosticsExpected: true,
          rows: []
        }}
      />
    );
    expect(failure).toContain('data-reparto-state="error"');
    expect(failure).toContain("conflict");

    const unknownFailure = renderToStaticMarkup(
      <FeasibilityDiagnosticsView
        dict={dict}
        diagnosticsError="gone"
        state={{
          kind: "evaluated",
          status: "infeasible",
          checkedAt: null,
          solverVersion: null,
          diagnosticsExpected: true,
          rows: []
        }}
      />
    );
    expect(unknownFailure).toContain(
      dict.planning.feasibility.diagnosticsUnavailable
    );
  });

  it("renders an expected-but-empty finding list as no findings", () => {
    const html = renderToStaticMarkup(
      <FeasibilityDiagnosticsView
        dict={dict}
        state={{
          kind: "evaluated",
          status: "infeasible",
          checkedAt: null,
          solverVersion: null,
          diagnosticsExpected: true,
          rows: []
        }}
      />
    );
    expect(html).toContain('data-reparto-state="no-findings"');
  });
});
