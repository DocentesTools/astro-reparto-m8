import { describe, expect, it } from "vitest";
import {
  buildCurrentTurnDisplay,
  buildExportCenterState,
  buildTeacherChoiceState,
  buildVersionComparisonLabel,
  canCompareVersions,
  classifyDirectChoiceConflict,
  getLanConnectionState,
  nextLeadershipWorkflowAction
} from "../src/runtime/ui/index.js";
import {
  RepartoApiError,
  RepartoUnauthenticatedError
} from "../src/runtime/errors.js";
import type {
  AssignmentPublic,
  CurrentTurnSummary,
  ExportArtifactPublic,
  HourRequirementPublic,
  MeetingSessionPublic,
  ProcessSummary,
  ProcessVersionPublic,
  VersionComparison
} from "../src/runtime/schemas.js";

const processId = "11111111-1111-4111-8111-111111111111";
const sessionId = "22222222-2222-4222-8222-222222222222";
const teacherId = "33333333-3333-4333-8333-333333333333";
const otherTeacherId = "44444444-4444-4444-8444-444444444444";
const mathsActivity = "77777777-7777-4777-8777-777777777777";
const tutoringActivity = "88888888-8888-4888-8888-888888888888";
const now = "2026-07-04T10:00:00Z";

const globalBalance = {
  total_required_hours: 4,
  total_available_hours: 4,
  total_assigned_hours: 0,
  pending_required_hours: 4,
  availability_difference: 0,
  uncovered_requirements: 1,
  overloaded_teachers: 0,
  state: "pending"
} as const;

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
  const processSummary: ProcessSummary = {
    process_id: processId,
    global_balance: globalBalance,
    validations: [],
    current_turn: null,
    blocking_validation_count: 0
  };
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

  it("builds export-center state", () => {
    expect(buildExportCenterState(processSummary, [])).toMatchObject({
      finalBlocked: false,
      latestBackupId: null,
      restoreDraftEnabled: false
    });
    expect(
      buildExportCenterState(
        { ...processSummary, blocking_validation_count: 1 },
        [backup]
      )
    ).toMatchObject({
      finalBlocked: true,
      latestBackupId: backup.id,
      restoreDraftEnabled: true
    });
  });

  it("summarizes comparisons and leadership workflow actions", () => {
    const comparison: VersionComparison = {
      left_version_id: version.id,
      right_version_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      changed_sections: ["teachers", "assignments"],
      required_hours_delta: 0,
      assigned_hours_delta: 4,
      teacher_count_delta: 0,
      requirement_count_delta: 0,
      assignment_count_delta: 1
    };
    expect(buildVersionComparisonLabel(comparison)).toBe("teachers, assignments");
    expect(buildVersionComparisonLabel({ ...comparison, changed_sections: [] })).toBe(
      "No changes"
    );
    expect(canCompareVersions([version])).toBe(false);
    expect(canCompareVersions([version, { ...version, version_number: 2 }])).toBe(
      true
    );
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
