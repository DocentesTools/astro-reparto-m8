import { describe, expect, it } from "vitest";

import { en } from "../src/runtime/i18n/en.js";
import { es } from "../src/runtime/i18n/es.js";
import { fr } from "../src/runtime/i18n/fr.js";
import {
  GroupSubjectBulkConflictSchema,
  GroupSubjectBulkPreviewSchema
} from "../src/runtime/schemas.js";
import {
  formatValidationFinding,
  groupSubjectBulkValidationErrorText,
  hasValidValidationParams,
  VALIDATION_PARAM_CONTRACT,
  type ValidationParams
} from "../src/runtime/validationFindings.js";

const samples: ReadonlyArray<{
  code: keyof typeof VALIDATION_PARAM_CONTRACT;
  params: ValidationParams;
}> = [
  { code: "plan.missing_allocation", params: {} },
  {
    code: "plan.group_hours_imbalanced",
    params: {
      allocation_hours: "120.00",
      difference_hours: "-1.25",
      group_hours: "118.75"
    }
  },
  {
    code: "plan.teacher_load_imbalanced",
    params: {
      difference_hours: "+2.25",
      target_hours: "120.00",
      teacher_hours: "122.25"
    }
  },
  {
    code: "plan.main_subject_not_materialized",
    params: { group_label: "1º ESO A", subject_label: "Mathematics" }
  },
  { code: "activity.missing_groups", params: { activity_label: "Tutoring" } },
  {
    code: "activity.multiple_groups_not_allowed",
    params: { activity_label: "Mathematics", group_count: 3 }
  },
  {
    code: "activity.linked_subject_mismatch",
    params: { activity_label: "Mathematics" }
  },
  { code: "activity.out_of_sync", params: { activity_label: "Mathematics" } },
  { code: "plan.requirements_not_generated", params: {} },
  { code: "requirement.stale", params: { count: 3 } },
  { code: "plan.stale", params: { status: "reconciliation_required" } },
  {
    code: "plan.feasibility_not_confirmed",
    params: { status: "not_evaluated" }
  },
  {
    code: "teacher.overloaded_authorized",
    params: { extra_hours: "2.00", teacher_label: "Ada Lovelace" }
  },
  { code: "plan.secondary_activities_available", params: { count: 3 } },
  { code: "requirement.unassigned", params: { count: 3 } },
  {
    code: "participant.over_target",
    params: {
      assigned_hours: "20.25",
      difference_hours: "+2.25",
      target_hours: "18.00",
      teacher_label: "Ada Lovelace"
    }
  },
  {
    code: "participant.below_target",
    params: {
      assigned_hours: "15.75",
      difference_hours: "-2.25",
      target_hours: "18.00",
      teacher_label: "Ada Lovelace"
    }
  }
];

describe("validation finding catalog", () => {
  it.each([
    ["en", en],
    ["es", es],
    ["fr", fr]
  ] as const)("renders all 17 known codes in %s", (_locale, dict) => {
    expect(samples).toHaveLength(17);
    for (const sample of samples) {
      const rendered = formatValidationFinding(dict, {
        ...sample,
        message: `service fallback for ${sample.code}`
      });
      expect(rendered).not.toContain("service fallback");
      expect(rendered).not.toMatch(
        /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i
      );
    }
  });

  it.each([
    "activity.multiple_groups_not_allowed",
    "plan.secondary_activities_available",
    "requirement.stale",
    "requirement.unassigned"
  ] as const)("selects zero, one and many forms for %s", (code) => {
    const base = code.startsWith("activity.")
      ? { activity_label: "Mathematics" }
      : {};
    const countKey = code.startsWith("activity.") ? "group_count" : "count";

    for (const dict of [en, es, fr]) {
      const render = (count: number) =>
        formatValidationFinding(dict, {
          code,
          message: "service fallback",
          params: { ...base, [countKey]: count }
        });
      expect(new Set([render(0), render(1), render(4)])).toHaveLength(3);
    }
  });

  it("preserves signed canonical decimal strings", () => {
    expect(
      formatValidationFinding(en, {
        code: "plan.group_hours_imbalanced",
        message: "fallback",
        params: {
          allocation_hours: "120.00",
          difference_hours: "-1.25",
          group_hours: "118.75"
        }
      })
    ).toContain("-1.25");
    expect(
      formatValidationFinding(en, {
        code: "participant.over_target",
        message: "fallback",
        params: {
          assigned_hours: "20.25",
          difference_hours: "+2.25",
          target_hours: "18.00",
          teacher_label: "Ada Lovelace"
        }
      })
    ).toContain("+2.25");
  });

  it("retains older-service and additive unknown-code fallbacks", () => {
    expect(
      formatValidationFinding(en, {
        code: "plan.missing_allocation",
        message: "Legacy service fallback"
      })
    ).not.toBe("Legacy service fallback");

    expect(
      formatValidationFinding(es, {
        code: "participant.below_target",
        message: "Older service fallback"
      })
    ).toBe("Older service fallback");
    expect(
      formatValidationFinding(fr, {
        code: "future.additive_code",
        message: "Future service fallback",
        params: { future_value: "kept" }
      })
    ).toBe("Future service fallback");

    expect(
      formatValidationFinding(en, {
        code: "participant.over_target",
        message: "Invalid params fallback",
        params: {
          assigned_hours: "20.25",
          difference_hours: "+2.25",
          target_hours: "18.00"
        }
      })
    ).toBe("Invalid params fallback");
  });

  it("validates exact key and value-kind contracts", () => {
    expect(hasValidValidationParams("future.additive_code", undefined)).toBe(true);
    expect(hasValidValidationParams("plan.stale", undefined)).toBe(true);
    expect(hasValidValidationParams("plan.missing_allocation", {})).toBe(true);
    expect(hasValidValidationParams("plan.stale", { extra: "value", status: "draft" })).toBe(
      false
    );
    expect(hasValidValidationParams("plan.stale", { state: "draft" })).toBe(false);
    expect(hasValidValidationParams("plan.stale", { status: 1 })).toBe(false);
    expect(hasValidValidationParams("requirement.stale", { count: 1.5 })).toBe(false);
  });

  it("localizes known status values and preserves additive values", () => {
    const render = (code: "plan.stale" | "plan.feasibility_not_confirmed", status: string) =>
      formatValidationFinding(en, {
        code,
        message: "fallback",
        params: { status }
      });

    expect(render("plan.stale", "reconciliation_required")).not.toContain(
      "reconciliation_required"
    );
    expect(render("plan.stale", "future_status")).toContain("future_status");
    expect(render("plan.feasibility_not_confirmed", "not_evaluated")).not.toContain(
      "not_evaluated"
    );
    expect(render("plan.feasibility_not_confirmed", "future_status")).toContain(
      "future_status"
    );
  });
});

describe("C11 forward-compatible bulk prose", () => {
  it("accepts a bare sentence and a coded object for one validation error", () => {
    const base = {
      mode: "upsert" as const,
      subject_id: "11111111-1111-4111-8111-111111111111",
      matched_group_ids: [],
      to_create: [],
      to_update: [],
      unchanged: [],
      conflicts: [],
      expected_affected_count: 0
    };

    const legacy = GroupSubjectBulkPreviewSchema.parse({
      ...base,
      validation_errors: ["minimum_grade must be less than or equal to maximum_grade."]
    });
    expect(legacy.validation_errors[0]).toBe(
      "minimum_grade must be less than or equal to maximum_grade."
    );

    const migrated = GroupSubjectBulkPreviewSchema.parse({
      ...base,
      validation_errors: [
        {
          code: "group_subject.inverted_grade_range",
          message: "minimum_grade must be less than or equal to maximum_grade.",
          params: { minimum_grade: 3, maximum_grade: 1 }
        }
      ]
    });
    expect(migrated.validation_errors[0]).toEqual({
      code: "group_subject.inverted_grade_range",
      message: "minimum_grade must be less than or equal to maximum_grade.",
      params: { minimum_grade: 3, maximum_grade: 1 }
    });

    expect(() =>
      GroupSubjectBulkPreviewSchema.parse({ ...base, validation_errors: [""] })
    ).toThrow();
    expect(() =>
      GroupSubjectBulkPreviewSchema.parse({
        ...base,
        validation_errors: [{ code: "x", message: "y", extra: true }]
      })
    ).toThrow();
  });

  it("reads display text from either arm", () => {
    expect(groupSubjectBulkValidationErrorText("plain sentence")).toBe("plain sentence");
    expect(
      groupSubjectBulkValidationErrorText({
        code: "group_subject.inverted_grade_range",
        message: "coded sentence"
      })
    ).toBe("coded sentence");
  });

  it("accepts a conflict with and without the staged code and params", () => {
    const teaching_group_id = "22222222-2222-4222-8222-222222222222";

    expect(
      GroupSubjectBulkConflictSchema.parse({
        teaching_group_id,
        reason: "No existing group-subject row to update."
      })
    ).toEqual({
      teaching_group_id,
      reason: "No existing group-subject row to update."
    });

    expect(
      GroupSubjectBulkConflictSchema.parse({
        teaching_group_id,
        reason: "No existing group-subject row to update.",
        code: "group_subject.no_row_to_update",
        params: { group_label: "1A", subject_label: "Maths" }
      }).code
    ).toBe("group_subject.no_row_to_update");

    expect(() =>
      GroupSubjectBulkConflictSchema.parse({
        teaching_group_id,
        reason: "r",
        params: { hours: 1.5 }
      })
    ).toThrow();
  });
});
