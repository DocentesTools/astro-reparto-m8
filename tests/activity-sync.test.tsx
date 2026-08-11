import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { getRepartoDictionary } from "../src/runtime/i18n/index.js";
import {
  ActivitySyncDifferences,
  ActivitySyncView,
  buildActivitySyncRows
} from "../src/runtime/react/default-ui/planning/activity-sync.js";
import { buildMainSubjectMaterializationRows } from "../src/runtime/react/default-ui/planning/main-materialization.js";
import {
  MainActivitySyncPreviewSchema,
  MainActivitySyncResultSchema,
  type GroupSubjectPublic,
  type MainActivitySyncPreview,
  type SubjectPublic,
  type TeachingActivityPublic,
  type TeachingGroupPublic
} from "../src/runtime/schemas.js";
import {
  buildActivitySyncPreviewState,
  listOutOfSyncActivities
} from "../src/runtime/ui/activitySync.js";

const processId = "11111111-1111-4111-8111-111111111111";
const planId = "22222222-2222-4222-8222-222222222222";
const subjectId = "33333333-3333-4333-8333-333333333333";
const otherSubjectId = "44444444-4444-4444-8444-444444444444";
const groupId = "55555555-5555-4555-8555-555555555555";
const cellId = "66666666-6666-4666-8666-666666666666";
const orphanCellId = "77777777-7777-4777-8777-777777777777";
const activityId = "88888888-8888-4888-8888-888888888888";
const slotId = "99999999-9999-4999-8999-999999999999";
const timestamp = "2026-08-04T10:00:00Z";
const fingerprint = "a".repeat(64);

const dict = getRepartoDictionary("en");

function activity(
  overrides: Partial<TeachingActivityPublic> = {}
): TeachingActivityPublic {
  return {
    id: activityId,
    teaching_plan_id: planId,
    subject_id: subjectId,
    allocation_category: "main",
    activity_type: "ordinary",
    group_weekly_hours_per_group: "3.00",
    teacher_weekly_hours_per_position: "3.00",
    required_teacher_count: 1,
    notes: null,
    source: "main_generated",
    source_group_subject_id: cellId,
    sync_state: "out_of_sync",
    retired_at: null,
    group_subject_ids: [cellId],
    linked_group_count: 1,
    created_at: timestamp,
    updated_at: timestamp,
    ...overrides
  };
}

const subjects: SubjectPublic[] = [
  {
    id: subjectId,
    assignment_process_id: processId,
    name: "Mathematics",
    allocation_category: "main",
    activity_type: "ordinary",
    default_group_weekly_hours: "3.00",
    default_teacher_weekly_hours_per_position: "3.00",
    default_required_teacher_count: 1,
    allows_multiple_groups: false,
    allows_zero_groups: false,
    notes: null,
    created_at: timestamp,
    updated_at: timestamp
  }
];

const teachingGroups: TeachingGroupPublic[] = [
  {
    id: groupId,
    assignment_process_id: processId,
    classroom_stage_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    classroom_stage: {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      stage: "Secondary",
      min_grade: 1,
      max_grade: 4,
      label: "Secondary",
      created_at: timestamp,
      updated_at: timestamp
    },
    grade: 1,
    group_code: "1A",
    label: "1A",
    notes: null,
    created_at: timestamp,
    updated_at: timestamp
  }
];

const groupSubjects: GroupSubjectPublic[] = [
  {
    id: cellId,
    assignment_process_id: processId,
    teaching_group_id: groupId,
    subject_id: subjectId,
    group_weekly_hours: "4.00",
    teacher_weekly_hours_per_position: "4.00",
    required_teacher_count: 2,
    active: true,
    notes: null,
    created_at: timestamp,
    updated_at: timestamp
  }
];

function preview(
  overrides: Partial<MainActivitySyncPreview> = {}
): MainActivitySyncPreview {
  return MainActivitySyncPreviewSchema.parse({
    group_subject_id: cellId,
    teaching_activity_id: activityId,
    sync_state: "out_of_sync",
    source_active: true,
    source_values: {
      group_weekly_hours_per_group: 4,
      teacher_weekly_hours_per_position: 4,
      required_teacher_count: 2
    },
    current_values: {
      group_weekly_hours_per_group: 3,
      teacher_weekly_hours_per_position: 3,
      required_teacher_count: 1
    },
    differences: [
      {
        field: "group_weekly_hours_per_group",
        current_value: 3,
        source_value: 4
      }
    ],
    assignment_impact: {
      active_assignment_count: 1,
      affected_assignment_count: 0,
      affected_requirement_ids: [],
      requires_reconciliation: false
    },
    retirement_required: false,
    is_noop: false,
    preview_fingerprint: fingerprint,
    ...overrides
  });
}

describe("out-of-sync main activities", () => {
  it("reads the drift from the service's own sync state", () => {
    const activities = [
      activity(),
      // In sync, retired, and source-less activities are all excluded — the
      // last one has no cell to preview against and the sync endpoints are
      // addressed by cell id.
      activity({ id: "in-sync", sync_state: "in_sync" }),
      activity({ id: "retired", retired_at: timestamp }),
      activity({ id: "orphan", source_group_subject_id: null }),
      activity({ id: "secondary", source: "secondary_manual" })
    ];

    expect(listOutOfSyncActivities(activities)).toEqual([
      { activityId, groupSubjectId: cellId, subjectId }
    ]);
  });

  it("labels a row and never falls back to an identifier", () => {
    const rows = buildActivitySyncRows({
      activities: [
        activity(),
        activity({
          id: "unresolvable",
          subject_id: otherSubjectId,
          source_group_subject_id: orphanCellId,
          group_subject_ids: [orphanCellId]
        })
      ],
      dict,
      groupSubjects,
      subjects,
      teachingGroups
    });

    expect(rows).toEqual([
      {
        activityId,
        groupSubjectId: cellId,
        subject: "Mathematics",
        teachingGroup: "1A"
      },
      {
        activityId: "unresolvable",
        groupSubjectId: orphanCellId,
        subject: dict.requirements.unknownSubject,
        teachingGroup: dict.planning.sync.unknownTeachingGroup
      }
    ]);
    // An unresolved row still appears, and prints no UUID.
    expect(JSON.stringify(rows)).not.toContain(otherSubjectId);
  });

  it("shows the drift as its own materialization state", () => {
    const rows = buildMainSubjectMaterializationRows({
      activities: [activity()],
      groupSubjects,
      subjects,
      teachingGroups
    });

    expect(rows.map((row) => row.state)).toEqual(["out_of_sync"]);
    expect(
      buildMainSubjectMaterializationRows({
        activities: [activity({ sync_state: "in_sync" })],
        groupSubjects,
        subjects,
        teachingGroups
      }).map((row) => row.state)
    ).toEqual(["materialized"]);
    expect(
      buildMainSubjectMaterializationRows({
        activities: [],
        groupSubjects,
        subjects,
        teachingGroups
      }).map((row) => row.state)
    ).toEqual(["missing"]);
  });
});

describe("activity sync preview state", () => {
  it("treats an absent preview as idle, not as 'already in sync'", () => {
    expect(buildActivitySyncPreviewState(null)).toEqual({ kind: "idle" });
    expect(buildActivitySyncPreviewState(undefined)).toEqual({ kind: "idle" });
  });

  it("carries the fingerprint and the server-owned impact through", () => {
    const state = buildActivitySyncPreviewState(
      preview({
        assignment_impact: {
          active_assignment_count: 2,
          affected_assignment_count: 1,
          affected_requirement_ids: [slotId],
          requires_reconciliation: true
        }
      })
    );

    expect(state).toEqual({
      kind: "applicable",
      differences: [
        {
          field: "group_weekly_hours_per_group",
          currentValue: "3.00",
          sourceValue: "4.00"
        }
      ],
      requiresReconciliation: true,
      affectedAssignmentCount: 1,
      activeAssignmentCount: 2,
      fingerprint
    });
  });

  it("blocks a retired source even when the values differ", () => {
    const state = buildActivitySyncPreviewState(
      preview({ source_active: false, retirement_required: true })
    );

    expect(state.kind).toBe("blocked");
    expect(state).toMatchObject({ reason: "retirement_required" });
  });

  it("blocks an activity the service already considers in sync", () => {
    const state = buildActivitySyncPreviewState(
      preview({
        sync_state: "in_sync",
        is_noop: true,
        differences: []
      })
    );

    expect(state).toMatchObject({ reason: "no_changes", differences: [] });
    // A no-op preview on an activity still marked out of sync stays applicable:
    // applying is what clears the mark.
    expect(
      buildActivitySyncPreviewState(preview({ is_noop: true, differences: [] }))
    ).toMatchObject({ kind: "applicable" });
  });
});

describe("activity sync view", () => {
  const rows = buildActivitySyncRows({
    activities: [activity()],
    dict,
    groupSubjects,
    subjects,
    teachingGroups
  });

  it("renders the empty, loading and error states without a row", () => {
    expect(
      renderToStaticMarkup(
        <ActivitySyncView
          dict={dict}
          rows={[]}
          selectedRow={null}
          state={{ kind: "idle" }}
        />
      )
    ).toContain(dict.planning.sync.empty);
    expect(
      renderToStaticMarkup(
        <ActivitySyncView
          dict={dict}
          isLoading
          rows={[]}
          selectedRow={null}
          state={{ kind: "idle" }}
        />
      )
    ).toContain(dict.planning.sync.loading);
    const failed = renderToStaticMarkup(
      <ActivitySyncView
        dict={dict}
        error={new Error("boom")}
        rows={[]}
        selectedRow={null}
        state={{ kind: "idle" }}
      />
    );
    expect(failed).toContain("boom");
    expect(
      renderToStaticMarkup(
        <ActivitySyncView
          dict={dict}
          error={{ nope: true }}
          rows={[]}
          selectedRow={null}
          state={{ kind: "idle" }}
        />
      )
    ).toContain(dict.planning.sync.unavailable);
  });

  it("marks each drifted activity and offers a review action", () => {
    const markup = renderToStaticMarkup(
      <ActivitySyncView
        dict={dict}
        rows={rows}
        selectedRow={null}
        state={{ kind: "idle" }}
      />
    );

    expect(markup).toContain(`data-activity-sync-row="${cellId}"`);
    expect(markup).toContain('data-activity-sync-state="out_of_sync"');
    expect(markup).toContain(dict.planning.sync.reviewAction);
    // No preview is open, so nothing claims what would change.
    expect(markup).not.toContain('data-reparto-dialog="activity-sync-preview"');
  });

  it("prints both sides of every difference and the apply action", () => {
    const markup = renderToStaticMarkup(
      <ActivitySyncView
        dict={dict}
        rows={rows}
        selectedRow={rows[0]}
        state={buildActivitySyncPreviewState(preview())}
      />
    );

    expect(markup).toContain('data-reparto-dialog="activity-sync-preview"');
    expect(markup).toContain(
      'data-activity-sync-field="group_weekly_hours_per_group"'
    );
    expect(markup).toContain("3.00");
    expect(markup).toContain("4.00");
    expect(markup).toContain(dict.planning.sync.applyAction);
    expect(markup).toContain('data-activity-sync-impact="none"');
  });

  it("warns before an apply that pushes assigned slots into reconciliation", () => {
    const markup = renderToStaticMarkup(
      <ActivitySyncView
        dict={dict}
        rows={rows}
        selectedRow={rows[0]}
        state={buildActivitySyncPreviewState(
          preview({
            assignment_impact: {
              active_assignment_count: 2,
              affected_assignment_count: 1,
              affected_requirement_ids: [slotId],
              requires_reconciliation: true
            }
          })
        )}
      />
    );

    expect(markup).toContain(
      'data-activity-sync-impact="reconciliation-required"'
    );
    // The count comes from the payload; the slot ids never reach a label.
    expect(markup).toContain("1 assigned positions");
    expect(markup).not.toContain(slotId);
  });

  it("offers no apply for a blocked preview", () => {
    const markup = renderToStaticMarkup(
      <ActivitySyncView
        dict={dict}
        rows={rows}
        selectedRow={rows[0]}
        state={buildActivitySyncPreviewState(
          preview({ source_active: false, retirement_required: true })
        )}
      />
    );

    expect(markup).toContain(
      'data-activity-sync-blocked="retirement_required"'
    );
    expect(markup).toContain(dict.planning.sync.blocked.retirement_required);
    expect(markup).not.toContain(dict.planning.sync.applyAction);
  });

  it("says so when a preview carries no value difference", () => {
    const markup = renderToStaticMarkup(
      <ActivitySyncDifferences
        dict={dict}
        state={buildActivitySyncPreviewState(
          preview({ is_noop: true, differences: [] })
        )}
      />
    );

    expect(markup).toContain(dict.planning.sync.noValueDifferences);
    expect(
      renderToStaticMarkup(
        <ActivitySyncDifferences dict={dict} state={{ kind: "idle" }} />
      )
    ).toContain(dict.planning.sync.noValueDifferences);
  });
});

describe("sync contract schemas", () => {
  it("normalizes every planning value to the canonical two-place string", () => {
    const parsed = preview();

    expect(parsed.source_values).toEqual({
      group_weekly_hours_per_group: "4.00",
      teacher_weekly_hours_per_position: "4.00",
      required_teacher_count: 2
    });
    expect(parsed.differences[0]).toEqual({
      field: "group_weekly_hours_per_group",
      current_value: "3.00",
      source_value: "4.00"
    });
  });

  it("rejects a fingerprint that is not the service's 64-character token", () => {
    expect(() =>
      MainActivitySyncPreviewSchema.parse({
        ...preview(),
        preview_fingerprint: "short"
      })
    ).toThrow();
  });

  it("parses an apply result with its committed plan status", () => {
    const result = MainActivitySyncResultSchema.parse({
      activity: { ...activity(), sync_state: "in_sync" },
      applied_differences: [
        {
          field: "required_teacher_count",
          current_value: 1,
          source_value: 2
        }
      ],
      assignment_impact: {
        active_assignment_count: 0,
        affected_assignment_count: 0,
        affected_requirement_ids: [],
        requires_reconciliation: false
      },
      teaching_plan_status: "draft",
      was_noop: false
    });

    expect(result.activity.sync_state).toBe("in_sync");
    expect(result.teaching_plan_status).toBe("draft");
    expect(result.was_noop).toBe(false);
  });
});
