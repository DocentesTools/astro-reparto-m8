import { describe, expect, it } from "vitest";
import {
  buildCurrentTurnDisplay,
  buildExportCenterState,
  buildTeacherChoiceState,
  buildVersionComparisonLabel,
  canCompareVersions,
  directChoiceConflictMessage,
  getLanConnectionState,
  nextLeadershipWorkflowAction
} from "../src/runtime/ui/index.js";
import type {
  ExportArtifactPublic,
  MeetingSessionPublic,
  ProcessSummary,
  ProcessVersionPublic,
  TeacherLanSummary,
  VersionComparison
} from "../src/runtime/schemas.js";

const processId = "11111111-1111-4111-8111-111111111111";
const sessionId = "22222222-2222-4222-8222-222222222222";
const teacherId = "33333333-3333-4333-8333-333333333333";
const otherTeacherId = "44444444-4444-4444-8444-444444444444";
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

const summary: TeacherLanSummary = {
  process_id: processId,
  teacher_profile_id: "55555555-5555-4555-8555-555555555555",
  process_teacher_id: teacherId,
  generated_at: now,
  global_balance: globalBalance,
  teacher_balance: {
    process_teacher_id: teacherId,
    teacher_profile_id: "55555555-5555-4555-8555-555555555555",
    display_name: "Teacher",
    available_hours: 4,
    assigned_hours: 0,
    remaining_hours: 4,
    excess_hours: 0,
    assignment_count: 0,
    has_override: false,
    state: "pending"
  },
  current_turn: null,
  blocking_validation_count: 0
};

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

  it("enables and disables direct teacher choices", () => {
    expect(
      buildTeacherChoiceState({
        summary,
        meetingSession: session,
        requirementRequiredHours: 4,
        requirementAssignedHours: 1
      })
    ).toMatchObject({
      canChoose: true,
      impactHours: 3,
      passTurnEnabled: false
    });
    expect(
      buildTeacherChoiceState({
        summary,
        meetingSession: null,
        requirementRequiredHours: 4,
        requirementAssignedHours: 0
      }).disabledReason
    ).toBe("Meeting is not open.");
    expect(
      buildTeacherChoiceState({
        summary,
        meetingSession: { ...session, direct_teacher_selection_enabled: false },
        requirementRequiredHours: 4,
        requirementAssignedHours: 0
      }).disabledReason
    ).toBe("Direct selection is disabled.");
    expect(
      buildTeacherChoiceState({
        summary: {
          ...summary,
          current_turn: {
            meeting_session_id: sessionId,
            selection_turn_id: "66666666-6666-4666-8666-666666666666",
            process_teacher_id: otherTeacherId,
            position: 1,
            status: "active",
            started_at: now
          }
        },
        meetingSession: session,
        requirementRequiredHours: 4,
        requirementAssignedHours: 0
      }).disabledReason
    ).toBe("It is another teacher's turn.");
    expect(
      buildTeacherChoiceState({
        summary,
        meetingSession: session,
        requirementRequiredHours: 4,
        requirementAssignedHours: 4
      }).disabledReason
    ).toBe("Requirement is already covered.");
  });

  it("enables pass-turn for the active teacher and normalizes conflicts", () => {
    const ownTurn = {
      ...summary,
      current_turn: {
        meeting_session_id: sessionId,
        selection_turn_id: "66666666-6666-4666-8666-666666666666",
        process_teacher_id: teacherId,
        position: 1,
        status: "active",
        started_at: now
      }
    } satisfies TeacherLanSummary;
    expect(
      buildTeacherChoiceState({
        summary: ownTurn,
        meetingSession: session,
        requirementRequiredHours: 4,
        requirementAssignedHours: 0
      }).passTurnEnabled
    ).toBe(true);
    expect(directChoiceConflictMessage("already covered")).toBe(
      "This requirement was already covered."
    );
    expect(directChoiceConflictMessage("wrong turn")).toBe(
      "The active turn changed. Refresh the meeting state."
    );
    expect(directChoiceConflictMessage("network")).toBe("network");
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
