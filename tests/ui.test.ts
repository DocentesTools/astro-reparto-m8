import { describe, expect, it } from "vitest";
import {
  buildCurrentTurnDisplay,
  buildExportCenterState,
  buildPlanningImportDraftState,
  buildTeacherChoiceState,
  buildVersionComparisonView,
  buildVersionSelectionState,
  canCompareVersions,
  classifyDirectChoiceConflict,
  getLanConnectionState,
  nextLeadershipWorkflowAction,
  versionSectionLabelKey
} from "../src/runtime/ui/index.js";
import {
  RepartoApiError,
  RepartoUnauthenticatedError
} from "../src/runtime/errors.js";
import type {
  AssignmentPublic,
  AssignmentValidationReport,
  CurrentTurnSummary,
  ExportArtifactPublic,
  HourRequirementPublic,
  MeetingSessionPublic,
  PlanValidationReport,
  ProcessVersionPublic,
  TeachingPlanPublic,
  VersionComparison
} from "../src/runtime/schemas.js";

const processId = "11111111-1111-4111-8111-111111111111";
const sessionId = "22222222-2222-4222-8222-222222222222";
const teacherId = "33333333-3333-4333-8333-333333333333";
const otherTeacherId = "44444444-4444-4444-8444-444444444444";
const mathsActivity = "77777777-7777-4777-8777-777777777777";
const tutoringActivity = "88888888-8888-4888-8888-888888888888";
const now = "2026-07-04T10:00:00Z";

const session: MeetingSessionPublic = {
  id: sessionId,
  assignment_process_id: processId,
  status: "selecting",
  lan_access_enabled: true,
  direct_teacher_selection_enabled: true,
  selection_mode: "strict",
  notes: null,
  started_at: now,
  started_by_user_id: null,
  paused_at: null,
  closed_at: null,
  created_at: now,
  updated_at: now
};

function slot(
  id: string,
  overrides: Partial<HourRequirementPublic> = {}
): HourRequirementPublic {
  return {
    id,
    assignment_process_id: processId,
    teaching_activity_id: mathsActivity,
    position_index: 0,
    required_teacher_hours: "4.00",
    status: "available",
    created_generation: 1,
    last_validated_generation: 1,
    retired_generation: null,
    superseded_by_requirement_id: null,
    created_at: now,
    updated_at: now,
    ...overrides
  };
}

function heldBy(
  processTeacherId: string,
  overrides: Partial<AssignmentPublic> = {}
): AssignmentPublic {
  return {
    id: `assignment-${processTeacherId}`,
    assignment_process_id: processId,
    hour_requirement_id: "slot-taken",
    teaching_activity_id: mathsActivity,
    process_teacher_id: processTeacherId,
    source: "teacher_direct",
    status: "active",
    chosen_by_user_id: null,
    confirmed_by_user_id: null,
    notes: null,
    created_at: now,
    updated_at: now,
    ...overrides
  };
}

const ownTurn = {
  meeting_session_id: sessionId,
  selection_turn_id: "66666666-6666-4666-8666-666666666666",
  process_teacher_id: teacherId,
  position: 1,
  status: "active",
  started_at: now
} satisfies CurrentTurnSummary;

function choiceInput(
  overrides: Partial<Parameters<typeof buildTeacherChoiceState>[0]> = {}
) {
  return {
    processTeacherId: teacherId,
    currentTurn: ownTurn,
    meetingSession: session,
    readiness: "ready" as const,
    selectionBlocked: false,
    requirements: [slot("slot-1")],
    assignments: [],
    selectedSlotId: "slot-1",
    ...overrides
  };
}

describe("LAN UI state", () => {
  it("classifies connection freshness", () => {
    expect(getLanConnectionState(null, 20)).toBe("disconnected");
    expect(getLanConnectionState(10, 20, 15)).toBe("live");
    expect(getLanConnectionState(0, 20, 15)).toBe("stale");
  });

  it("formats current-turn display state", () => {
    expect(buildCurrentTurnDisplay(null)).toMatchObject({
      statusLabel: "Waiting",
      turnLabel: "No active turn",
      positionLabel: "No position"
    });
    expect(
      buildCurrentTurnDisplay({
        meeting_session_id: sessionId,
        selection_turn_id: "66666666-6666-4666-8666-666666666666",
        process_teacher_id: teacherId,
        position: 2,
        status: "active",
        started_at: now
      })
    ).toMatchObject({
      statusLabel: "Active",
      turnLabel: `Teacher ${teacherId}`,
      positionLabel: "Turn 3",
      startedLabel: now
    });
    expect(
      buildCurrentTurnDisplay({
        meeting_session_id: sessionId,
        selection_turn_id: "66666666-6666-4666-8666-666666666666",
        process_teacher_id: teacherId,
        position: 0,
        status: "pending",
        started_at: null
      }).startedLabel
    ).toBe("Not started");
  });

  it("offers a whole position and reports the hours it assigns", () => {
    const state = buildTeacherChoiceState(
      choiceInput({ remainingTargetHours: "6.00" })
    );
    expect(state).toMatchObject({
      canChoose: true,
      disabledReason: null,
      selectableCount: 1,
      // The hours of the position itself, not a `required − assigned` remainder.
      impactHours: "4.00",
      remainingTargetHours: "6.00",
      passTurnEnabled: true
    });
    expect(state.selectedSlot).toMatchObject({ slotId: "slot-1", canChoose: true });
  });

  it("blocks on the meeting and the plan before looking at any position", () => {
    expect(
      buildTeacherChoiceState(choiceInput({ meetingSession: null })).disabledReason
    ).toBe("meeting_not_open");
    expect(
      buildTeacherChoiceState(
        choiceInput({ meetingSession: { ...session, status: "paused" } })
      ).disabledReason
    ).toBe("meeting_not_open");
    expect(
      buildTeacherChoiceState(
        choiceInput({
          meetingSession: { ...session, direct_teacher_selection_enabled: false }
        })
      ).disabledReason
    ).toBe("direct_selection_disabled");
    expect(
      buildTeacherChoiceState(choiceInput({ readiness: "not_ready" })).disabledReason
    ).toBe("plan_not_ready");
    expect(
      buildTeacherChoiceState(choiceInput({ readiness: "recalculation_required" }))
        .disabledReason
    ).toBe("reconciliation_required");
    expect(
      buildTeacherChoiceState(choiceInput({ selectionBlocked: true })).disabledReason
    ).toBe("selection_blocked");
    expect(
      buildTeacherChoiceState(
        choiceInput({
          currentTurn: { ...ownTurn, process_teacher_id: otherTeacherId }
        })
      ).disabledReason
    ).toBe("not_your_turn");
    expect(
      buildTeacherChoiceState(choiceInput({ selectedSlotId: null })).disabledReason
    ).toBe("no_slot_chosen");
  });

  it("reads the session's selection mode the way the service does", () => {
    // Strict: the service accepts a choice only inside the caller's own active
    // turn, so *no* active turn is a refusal too — not merely someone else's.
    expect(
      buildTeacherChoiceState(choiceInput({ currentTurn: null })).disabledReason
    ).toBe("not_your_turn");
    expect(
      buildTeacherChoiceState(
        choiceInput({
          currentTurn: { ...ownTurn, process_teacher_id: otherTeacherId }
        })
      ).disabledReason
    ).toBe("not_your_turn");
    // …and the caller's own active turn still clears it.
    expect(buildTeacherChoiceState(choiceInput()).disabledReason).toBeNull();

    // Informative/none: the service ignores turns, and with none active the
    // panel opens. The mode is therefore read, never assumed.
    for (const selection_mode of ["informative", "none"] as const) {
      expect(
        buildTeacherChoiceState(
          choiceInput({
            currentTurn: null,
            meetingSession: { ...session, selection_mode }
          })
        ).disabledReason
      ).toBeNull();
    }
  });

  it("treats a reopened meeting as open for direct selection", () => {
    // The service accepts open / selecting / reopened
    // (`_get_direct_selection_session`); a reopened meeting is running again.
    expect(
      buildTeacherChoiceState(
        choiceInput({ meetingSession: { ...session, status: "reopened" } })
      ).disabledReason
    ).toBeNull();
    expect(
      buildTeacherChoiceState(
        choiceInput({ meetingSession: { ...session, status: "open" } })
      ).disabledReason
    ).toBeNull();
    expect(
      buildTeacherChoiceState(
        choiceInput({ meetingSession: { ...session, status: "prepared" } })
      ).disabledReason
    ).toBe("meeting_not_open");
    expect(
      buildTeacherChoiceState(
        choiceInput({ meetingSession: { ...session, status: "closed" } })
      ).disabledReason
    ).toBe("meeting_not_open");
  });

  it("fails closed when the service state is not known", () => {
    // An unknown readiness or blocked flag is not an implicit "go": a teacher
    // client never assumes the assignment stage is open.
    expect(
      buildTeacherChoiceState(choiceInput({ readiness: null })).disabledReason
    ).toBe("plan_not_ready");
    expect(
      buildTeacherChoiceState(choiceInput({ selectionBlocked: null })).disabledReason
    ).toBe("selection_blocked");
    const bare = buildTeacherChoiceState({
      processTeacherId: teacherId,
      currentTurn: null,
      meetingSession: session,
      requirements: [slot("slot-1")],
      assignments: []
    });
    expect(bare.canChoose).toBe(false);
    expect(bare.disabledReason).toBe("plan_not_ready");
    expect(bare.passTurnEnabled).toBe(false);
  });

  it("disables the positions the service would refuse, one reason each", () => {
    const state = buildTeacherChoiceState(
      choiceInput({
        requirements: [
          slot("slot-1"),
          slot("slot-taken", { position_index: 1 }),
          slot("slot-stale", { position_index: 2, status: "stale" }),
          slot("slot-tutoring", {
            teaching_activity_id: tutoringActivity,
            required_teacher_hours: "3.00"
          })
        ],
        // The viewer already holds a maths position through an earlier choice.
        assignments: [heldBy(teacherId)],
        remainingTargetHours: "2.50"
      })
    );
    const reasons = Object.fromEntries(
      state.slots.map((entry) => [entry.slotId, entry.disabledReason])
    );
    expect(reasons["slot-taken"]).toBe("slot_occupied");
    expect(reasons["slot-stale"]).toBe("slot_not_available");
    // Same activity as the position already held (plan §3.7).
    expect(reasons["slot-1"]).toBe("duplicate_activity_position");
    // 3.00 teacher hours do not fit 2.50 remaining, and a position cannot be
    // split (plan §3.8).
    expect(reasons["slot-tutoring"]).toBe("exceeds_remaining_target");
    expect(state.selectableCount).toBe(0);
    expect(state.disabledReason).toBe("duplicate_activity_position");
  });

  it("leaves the exact-fit rule to the service when the target is unknown", () => {
    const state = buildTeacherChoiceState(
      choiceInput({
        requirements: [slot("slot-1", { required_teacher_hours: "40.00" })]
      })
    );
    expect(state.remainingTargetHours).toBeNull();
    expect(state.canChoose).toBe(true);
  });

  it("ignores a cancelled row when deciding the distinct-position rule", () => {
    const state = buildTeacherChoiceState(
      choiceInput({ assignments: [heldBy(teacherId, { status: "cancelled" })] })
    );
    expect(state.canChoose).toBe(true);
    // Another teacher's live position of the same activity is their problem,
    // not a block on this viewer.
    expect(
      buildTeacherChoiceState(choiceInput({ assignments: [heldBy(otherTeacherId)] }))
        .canChoose
    ).toBe(true);
  });

  it("classifies a refused choice by status, never by the wording", () => {
    expect(
      classifyDirectChoiceConflict(
        new RepartoApiError(409, "Selection would strand the remaining state.")
      )
    ).toEqual({
      reason: "state_changed",
      message: "Selection would strand the remaining state."
    });
    // Every 400 is a rule refusal, whatever the sentence says: choosing the
    // same position again cannot help.
    expect(
      classifyDirectChoiceConflict(
        new RepartoApiError(400, "Requirement is already assigned; a slot cannot be shared.")
      ).reason
    ).toBe("refused");
    expect(
      classifyDirectChoiceConflict(
        new RepartoApiError(400, "Only an active process teacher is eligible.")
      ).reason
    ).toBe("refused");
    expect(
      classifyDirectChoiceConflict(new RepartoApiError(422, [])).reason
    ).toBe("refused");
    expect(
      classifyDirectChoiceConflict(new RepartoApiError(404, "Not found")).reason
    ).toBe("not_found");
    expect(
      classifyDirectChoiceConflict(new RepartoApiError(403, "Forbidden")).reason
    ).toBe("not_allowed");
    expect(
      classifyDirectChoiceConflict(new RepartoUnauthenticatedError("expired")).reason
    ).toBe("signed_out");
    expect(classifyDirectChoiceConflict(new TypeError("fetch failed"))).toMatchObject({
      reason: "network"
    });
    expect(classifyDirectChoiceConflict(new Error("boom")).reason).toBe("server");
    expect(
      classifyDirectChoiceConflict(new RepartoApiError(401, "Expired")).reason
    ).toBe("signed_out");
    expect(
      classifyDirectChoiceConflict(new RepartoApiError(503, "Unavailable")).reason
    ).toBe("server");
    // A field-level rejection carries no form message: the panel shows the
    // localized reason alone rather than an empty quote from the service.
    expect(
      classifyDirectChoiceConflict(
        new RepartoApiError(422, [
          { loc: ["body", "hour_requirement_id"], msg: "Field required", type: "missing" }
        ])
      )
    ).toEqual({ reason: "refused", message: "" });
    expect(classifyDirectChoiceConflict("not an error")).toEqual({
      reason: "server",
      message: "Unknown error"
    });
  });
});

describe("history UI state", () => {
  const backup: ExportArtifactPublic = {
    id: "77777777-7777-4777-8777-777777777777",
    assignment_process_id: processId,
    process_version_id: null,
    export_type: "backup",
    format: "json",
    file_path: "backup.json",
    created_by_user_id: "88888888-8888-4888-8888-888888888888",
    checksum: "a".repeat(64),
    content: "{}",
    created_at: now,
    updated_at: now
  };
  const version = {
    id: "99999999-9999-4999-8999-999999999999",
    assignment_process_id: processId,
    version_number: 1,
    status: "draft",
    reason: null,
    created_by_user_id: "88888888-8888-4888-8888-888888888888",
    snapshot_json: {},
    created_at: now,
    updated_at: now
  } satisfies ProcessVersionPublic;

  const plan: TeachingPlanPublic = {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaab",
    assignment_process_id: processId,
    allocation_revision_id: null,
    status: "requirements_generated",
    current_generation_number: 1,
    locked_at: now,
    locked_by_user_id: "88888888-8888-4888-8888-888888888888",
    requirements_generated_at: now,
    stale_reason: null,
    feasibility_status: "feasible",
    feasibility_generation: 1,
    feasibility_checked_at: now,
    feasibility_input_fingerprint: "fingerprint",
    feasibility_solver_version: "solver-v1",
    feasibility_diagnostics_ref: null,
    created_at: now,
    updated_at: now
  };
  const planReport: PlanValidationReport = {
    teaching_plan_id: plan.id,
    assignment_process_id: processId,
    is_assignment_ready: true,
    blocking_count: 0,
    warning_count: 0,
    messages: []
  };
  const assignmentReport: AssignmentValidationReport = {
    assignment_process_id: processId,
    is_final_ready: true,
    blocking_count: 0,
    warning_count: 0,
    messages: []
  };

  it("keeps draft and provisional planning exports open on an inexact plan", () => {
    // §3.10: a draft or provisional artifact exists to *show* an imbalance, so
    // blocking findings may not withhold it. Only the final mode is strict.
    const state = buildExportCenterState({
      plan: { ...plan, status: "unbalanced", feasibility_status: "not_evaluated" },
      planValidations: { ...planReport, is_assignment_ready: false, blocking_count: 2 },
      assignmentValidations: assignmentReport
    });
    expect(state.planningExports).toEqual([
      { mode: "draft", blocked: false, reason: null, printsFeasibility: true },
      { mode: "provisional", blocked: false, reason: null, printsFeasibility: true },
      {
        mode: "final",
        blocked: true,
        reason: "blocking_validations",
        printsFeasibility: false
      }
    ]);
    // §20.25: a provisional document prints the status; it must be readable
    // from the state rather than re-derived from the plan by every caller.
    expect(state.feasibilityStatus).toBe("not_evaluated");
  });

  it("reports a missing plan as its own reason, on every planning mode", () => {
    const state = buildExportCenterState();
    expect(state.planningExports.map((offer) => offer.reason)).toEqual([
      "plan_missing",
      "plan_missing",
      "plan_missing"
    ]);
    // No plan is not "not evaluated": there is nothing to evaluate yet.
    expect(state.feasibilityStatus).toBeNull();
    expect(state.planStatus).toBeNull();
  });

  it("gates the final assignment export on a complete reparto and feasibility", () => {
    expect(
      buildExportCenterState({
        plan,
        planValidations: planReport,
        assignmentValidations: assignmentReport
      }).finalExport
    ).toEqual({
      allowed: true,
      reasons: [],
      archivesProcess: true,
      blockingCount: 0
    });
    // Every refusal is listed, not only the first: a head who clears the
    // findings must already know feasibility is the next gate (§20.25).
    expect(
      buildExportCenterState({
        plan: { ...plan, feasibility_status: "unknown" },
        assignmentValidations: {
          ...assignmentReport,
          is_final_ready: false,
          blocking_count: 3
        }
      }).finalExport
    ).toMatchObject({
      allowed: false,
      reasons: ["assignment_blocking", "feasibility_not_confirmed"],
      blockingCount: 3
    });
    // A plan that never generated slots cannot close, whatever the findings say.
    expect(
      buildExportCenterState({
        plan: { ...plan, status: "balanced" },
        assignmentValidations: assignmentReport
      }).finalExport.reasons
    ).toEqual(["requirements_not_generated"]);
    // Fail closed: an unread report is not an empty one.
    expect(buildExportCenterState({ plan }).finalExport.reasons).toEqual([
      "findings_unavailable"
    ]);
  });

  it("offers the stored documents unconditionally and counts the backups", () => {
    const state = buildExportCenterState({
      plan,
      assignmentValidations: {
        ...assignmentReport,
        is_final_ready: false,
        blocking_count: 1
      },
      artifacts: [backup, { ...backup, id: "77777777-7777-4777-8777-777777777778" }]
    });
    // `final` is the strict export above, never one button in a document row.
    expect(state.documentExportTypes).toEqual([
      "internal_draft",
      "school_leadership",
      "teacher_summary",
      "backup"
    ]);
    expect(state.backupCount).toBe(2);
    expect(state.latestBackupId).toBe("77777777-7777-4777-8777-777777777778");
    expect(state.restore).toMatchObject({ allowed: true, reason: null });
    expect(
      buildExportCenterState({ artifacts: [backup], processStatus: "meeting_open" })
        .restore
    ).toMatchObject({ allowed: false, reason: "process_not_draft" });
    expect(
      buildExportCenterState({ artifacts: [{ ...backup, format: "pdf" }] })
    ).toMatchObject({
      backupCount: 0,
      latestBackupId: null,
      restore: { allowed: false, reason: "no_backup", backup: null }
    });
  });

  it("validates planning import JSON without applying a balance gate", () => {
    const subjectId = "11111111-1111-4111-8111-111111111112";
    expect(buildPlanningImportDraftState(" ")).toEqual({
      request: null,
      error: "empty"
    });
    expect(buildPlanningImportDraftState("{")).toEqual({
      request: null,
      error: "invalid_json"
    });
    expect(buildPlanningImportDraftState('{"activities":[{"subject_id":"bad"}]}')).toEqual({
      request: null,
      error: "invalid_contract"
    });
    expect(
      buildPlanningImportDraftState(
        JSON.stringify({
          activities: [
            {
              subject_id: subjectId,
              group_weekly_hours_per_group: "2.00",
              teacher_weekly_hours_per_position: "3.00"
            }
          ]
        })
      )
    ).toMatchObject({
      error: null,
      request: {
        activities: [
          {
            subject_id: subjectId,
            allocation_category: "secondary",
            activity_type: "ordinary"
          }
        ]
      }
    });
  });

  const comparison: VersionComparison = {
    left_version_id: version.id,
    right_version_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    changed_sections: ["teaching_activities", "teachers"],
    allocation_changed: true,
    group_hours_changed: true,
    teacher_load_changed: false,
    subject_category_changed: false,
    activity_added_or_removed: true,
    group_link_added_or_removed: true,
    teacher_position_count_changed: false,
    participant_target_changed: true,
    requirement_generation_changed: true,
    allocation_delta: "-4.00",
    group_load_delta: "12.50",
    teacher_load_delta: "0.00",
    participant_target_total_delta: "3.00",
    generation_number_delta: 1,
    teacher_count_delta: -1,
    activity_count_delta: 0,
    requirement_count_delta: 2
  };

  it("renders every §10.3 dimension with the deltas the service pairs to it", () => {
    const view = buildVersionComparisonView(comparison);
    expect(view.dimensions.map((dimension) => dimension.key)).toEqual([
      "allocation",
      "group_hours",
      "teacher_load",
      "subject_category",
      "activity",
      "group_link",
      "teacher_position_count",
      "participant_target",
      "requirement_generation"
    ]);
    expect(view.changedDimensionCount).toBe(6);
    expect(view.identical).toBe(false);
    expect(view.otherChangesOnly).toBe(false);
    expect(view.changedSections).toEqual(["teaching_activities", "teachers"]);
    // Hour deltas keep the service's canonical string; the sign comes from the
    // decimal helpers, never from reading the text or from a float compare.
    expect(view.dimensions[0].deltas).toEqual([
      { key: "allocation_delta", unit: "hours", value: "-4.00", sign: -1 }
    ]);
    expect(view.dimensions[1].deltas[0]).toMatchObject({
      value: "12.50",
      sign: 1
    });
    expect(view.dimensions[2].deltas[0]).toMatchObject({
      value: "0.00",
      sign: 0
    });
    // Three dimensions are set comparisons the service publishes no delta for;
    // they stay empty rather than being padded with a zero it never sent.
    expect(view.dimensions[3].deltas).toEqual([]);
    expect(view.dimensions[5].deltas).toEqual([]);
    expect(view.dimensions[6].deltas).toEqual([]);
    expect(view.dimensions[7].deltas).toEqual([
      {
        key: "participant_target_total_delta",
        unit: "hours",
        value: "3.00",
        sign: 1
      },
      { key: "teacher_count_delta", unit: "count", value: -1, sign: -1 }
    ]);
    expect(view.dimensions[8].deltas.map((delta) => delta.key)).toEqual([
      "generation_number_delta",
      "requirement_count_delta"
    ]);
  });

  it("keeps a changed flag authoritative over a zero delta", () => {
    // One activity added and one removed: the set changed, the count did not.
    const view = buildVersionComparisonView(comparison);
    const activity = view.dimensions[4];
    expect(activity.changed).toBe(true);
    expect(activity.deltas[0]).toEqual({
      key: "activity_count_delta",
      unit: "count",
      value: 0,
      sign: 0
    });
  });

  it("reports an absent allocation as not comparable, never as zero", () => {
    const view = buildVersionComparisonView({
      ...comparison,
      allocation_delta: null
    });
    expect(view.dimensions[0].deltas[0]).toEqual({
      key: "allocation_delta",
      unit: "hours",
      value: null,
      sign: null
    });
  });

  it("separates identical snapshots from sections-only differences", () => {
    const unchangedFlags = {
      ...comparison,
      allocation_changed: false,
      group_hours_changed: false,
      activity_added_or_removed: false,
      group_link_added_or_removed: false,
      participant_target_changed: false,
      requirement_generation_changed: false
    };
    const sectionsOnly = buildVersionComparisonView(unchangedFlags);
    expect(sectionsOnly.identical).toBe(false);
    expect(sectionsOnly.otherChangesOnly).toBe(true);
    expect(sectionsOnly.changedDimensionCount).toBe(0);

    const identical = buildVersionComparisonView({
      ...unchangedFlags,
      changed_sections: []
    });
    expect(identical.identical).toBe(true);
    expect(identical.otherChangesOnly).toBe(false);
  });

  it("labels snapshot sections and reports an unknown one as its own code", () => {
    expect(versionSectionLabelKey("teachers")).toBe("processParticipants");
    expect(versionSectionLabelKey("allocation_revisions")).toBe(
      "allocationRevisions"
    );
    expect(versionSectionLabelKey("requirements")).toBe("requirements");
    expect(versionSectionLabelKey("something_new")).toBeNull();
  });

  it("defaults the comparison to the last two versions", () => {
    const second = { ...version, id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", version_number: 2 };
    const third = { ...version, id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", version_number: 3 };
    expect(buildVersionSelectionState([version, second, third])).toEqual({
      leftVersionId: second.id,
      rightVersionId: third.id,
      canCompare: true,
      reason: null
    });
    expect(canCompareVersions([version])).toBe(false);
    expect(canCompareVersions([version, second])).toBe(true);
  });

  it("refuses a single version and a version compared with itself", () => {
    expect(buildVersionSelectionState([])).toEqual({
      leftVersionId: null,
      rightVersionId: null,
      canCompare: false,
      reason: "not_enough_versions"
    });
    expect(buildVersionSelectionState([version])).toMatchObject({
      leftVersionId: null,
      rightVersionId: version.id,
      canCompare: false,
      reason: "not_enough_versions"
    });
    const second = { ...version, id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", version_number: 2 };
    expect(
      buildVersionSelectionState([version, second], {
        left: second.id,
        right: second.id
      })
    ).toMatchObject({ canCompare: false, reason: "same_version" });
  });

  it("drops a requested version the process does not own", () => {
    const second = { ...version, id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", version_number: 2 };
    expect(
      buildVersionSelectionState([version, second], {
        left: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        right: null
      })
    ).toMatchObject({ leftVersionId: version.id, rightVersionId: second.id });
  });

  it("summarizes leadership workflow actions", () => {
    expect(nextLeadershipWorkflowAction("sent_to_school_leadership")).toBe(
      "mark-returned"
    );
    expect(nextLeadershipWorkflowAction("returned_by_school_leadership")).toBe(
      "start-revision"
    );
    expect(nextLeadershipWorkflowAction("final")).toBe("reopen-final");
    expect(nextLeadershipWorkflowAction("draft")).toBeNull();
  });
});
