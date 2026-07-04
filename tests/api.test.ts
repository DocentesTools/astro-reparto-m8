import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  assignments,
  assignmentProcesses,
  history,
  meetingSessions,
  selectionTurns
} from "../src/runtime/api/index.js";
import { setRepartoAuthAdapter } from "../src/runtime/authAdapter.js";
import { resetRepartoConfig } from "../src/runtime/config.js";

const processId = "11111111-1111-4111-8111-111111111111";
const sessionId = "22222222-2222-4222-8222-222222222222";
const userId = "33333333-3333-4333-8333-333333333333";
const turnId = "77777777-7777-4777-8777-777777777777";
const teacherId = "88888888-8888-4888-8888-888888888888";
const requirementId = "99999999-9999-4999-8999-999999999999";
const versionId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const nextVersionId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const artifactId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const now = "2026-07-04T10:00:00Z";
const fetchMock = vi.fn();

const processBody = {
  id: processId,
  academic_year_id: "44444444-4444-4444-8444-444444444444",
  school_id: "55555555-5555-4555-8555-555555555555",
  department_id: "66666666-6666-4666-8666-666666666666",
  status: "meeting_open",
  default_teacher_hours_reference: null,
  selection_order_enabled: false,
  selection_order_mode: "none",
  direct_teacher_selection_enabled: false,
  lan_access_enabled: true,
  created_from_process_id: null,
  closed_at: null,
  closed_by_user_id: null,
  created_by_user_id: userId,
  created_at: now,
  updated_at: now
};

const sessionBody = {
  id: sessionId,
  assignment_process_id: processId,
  status: "open",
  lan_access_enabled: true,
  direct_teacher_selection_enabled: false,
  selection_mode: "none",
  notes: null,
  started_at: now,
  started_by_user_id: userId,
  paused_at: null,
  closed_at: null,
  created_at: now,
  updated_at: now
};

const turnBody = {
  id: turnId,
  meeting_session_id: sessionId,
  process_teacher_id: teacherId,
  position: 0,
  status: "active",
  skip_reason: null,
  forced_by_user_id: null,
  notes: null,
  started_at: now,
  completed_at: null,
  skipped_at: null,
  created_at: now,
  updated_at: now
};

const globalBalanceBody = {
  total_required_hours: 4,
  total_available_hours: 4,
  total_assigned_hours: 4,
  pending_required_hours: 0,
  availability_difference: 0,
  uncovered_requirements: 0,
  overloaded_teachers: 0,
  state: "balanced"
};

const teacherBalanceBody = {
  process_teacher_id: teacherId,
  teacher_profile_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  display_name: "Linked Teacher",
  available_hours: 4,
  assigned_hours: 4,
  remaining_hours: 0,
  excess_hours: 0,
  assignment_count: 1,
  has_override: false,
  state: "balanced"
};

const summaryBody = {
  process_id: processId,
  global_balance: globalBalanceBody,
  validations: [
    {
      severity: "info",
      code: "process.balanced",
      message: "Process hours are balanced.",
      entity_type: "process",
      entity_id: processId
    }
  ],
  current_turn: null,
  blocking_validation_count: 0
};

const teacherLanSummaryBody = {
  process_id: processId,
  global_balance: globalBalanceBody,
  current_turn: null,
  blocking_validation_count: 0,
  teacher_profile_id: teacherBalanceBody.teacher_profile_id,
  process_teacher_id: teacherId,
  generated_at: now,
  teacher_balance: teacherBalanceBody
};

const assignmentBody = {
  id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  assignment_process_id: processId,
  hour_requirement_id: requirementId,
  process_teacher_id: teacherId,
  assigned_hours: 4,
  assignment_type: "main",
  source: "teacher_direct",
  status: "confirmed",
  chosen_by_user_id: userId,
  confirmed_by_user_id: userId,
  override_reason: null,
  overridden_by_user_id: null,
  notes: null,
  created_at: now,
  updated_at: now
};

const versionBody = {
  id: versionId,
  assignment_process_id: processId,
  version_number: 1,
  status: "meeting_open",
  reason: "baseline",
  created_by_user_id: userId,
  snapshot_json: { process: { id: processId } },
  created_at: now,
  updated_at: now
};

const comparisonBody = {
  left_version_id: versionId,
  right_version_id: nextVersionId,
  changed_sections: ["assignments"],
  required_hours_delta: 0,
  assigned_hours_delta: 4,
  teacher_count_delta: 0,
  requirement_count_delta: 0,
  assignment_count_delta: 1
};

const artifactBody = {
  id: artifactId,
  assignment_process_id: processId,
  process_version_id: versionId,
  export_type: "backup",
  format: "json",
  file_path: `exports/${processId}/backup.json`,
  created_by_user_id: userId,
  checksum: "a".repeat(64),
  content: "{\"process\":{}}",
  created_at: now,
  updated_at: now
};

function response(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    clone() {
      return this;
    },
    async json() {
      return body;
    },
    async text() {
      return JSON.stringify(body);
    }
  } as unknown as Response;
}

beforeEach(() => {
  resetRepartoConfig();
  setRepartoAuthAdapter({ getAccessToken: () => "token" });
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("assignment process API", () => {
  it("lists and gets processes", async () => {
    fetchMock.mockResolvedValueOnce(response({ data: [processBody], count: 1 }));
    await expect(assignmentProcesses.list({ skip: 1, limit: 2 })).resolves.toMatchObject({
      count: 1
    });
    expect(fetchMock.mock.calls[0][0]).toContain("skip=1");
    fetchMock.mockResolvedValueOnce(response(processBody));
    await expect(assignmentProcesses.get(processId)).resolves.toMatchObject({
      id: processId
    });
    fetchMock.mockResolvedValueOnce(response(processBody));
    await expect(
      assignmentProcesses.create({
        academic_year_id: processBody.academic_year_id,
        school_id: processBody.school_id,
        department_id: processBody.department_id
      })
    ).resolves.toMatchObject({ id: processId });
    fetchMock.mockResolvedValueOnce(response(processBody));
    await expect(
      assignmentProcesses.update(processId, { lan_access_enabled: true })
    ).resolves.toMatchObject({ lan_access_enabled: true });
    fetchMock.mockResolvedValueOnce(
      response({ ...processBody, status: "sent_to_school_leadership" })
    );
    await expect(
      assignmentProcesses.transition(processId, {
        target_status: "sent_to_school_leadership"
      })
    ).resolves.toMatchObject({ status: "sent_to_school_leadership" });
    fetchMock.mockResolvedValueOnce(response({ ...processBody, status: "reopened" }));
    await expect(
      assignmentProcesses.reopen(processId, { reason: "Returned by leadership" })
    ).resolves.toMatchObject({ status: "reopened" });
    fetchMock.mockResolvedValueOnce(response(summaryBody));
    await expect(assignmentProcesses.summary(processId)).resolves.toMatchObject({
      blocking_validation_count: 0
    });
    fetchMock.mockResolvedValueOnce(response(teacherLanSummaryBody));
    await expect(assignmentProcesses.myLanSummary(processId)).resolves.toMatchObject({
      teacher_balance: { display_name: "Linked Teacher" }
    });
    expect(assignmentProcesses.eventsUrl(processId)).toBe(
      `http://localhost/reparto/assignment-processes/${processId}/events`
    );
  });
});

describe("meeting session API", () => {
  it("lists, creates, updates, and closes sessions", async () => {
    fetchMock.mockResolvedValueOnce(response({ data: [sessionBody], count: 1 }));
    await expect(meetingSessions.list(processId)).resolves.toMatchObject({ count: 1 });
    fetchMock.mockResolvedValueOnce(response(sessionBody));
    await expect(
      meetingSessions.create(processId, {
        assignment_process_id: processId,
        status: "open"
      })
    ).resolves.toMatchObject({ id: sessionId });
    fetchMock.mockResolvedValueOnce(response({ ...sessionBody, status: "paused" }));
    await expect(
      meetingSessions.update(processId, sessionId, { status: "paused" })
    ).resolves.toMatchObject({ status: "paused" });
    fetchMock.mockResolvedValueOnce(response({ ...sessionBody, status: "closed" }));
    await expect(meetingSessions.close(processId, sessionId)).resolves.toMatchObject({
      status: "closed"
    });
  });

  it("validates direct selection payloads", async () => {
    expect(() =>
      meetingSessions.create(processId, {
        assignment_process_id: processId,
        lan_access_enabled: false,
        direct_teacher_selection_enabled: true
      })
    ).toThrow("Direct teacher selection requires LAN access.");
    expect(() =>
      meetingSessions.update(processId, sessionId, {
        lan_access_enabled: false,
        direct_teacher_selection_enabled: true
      })
    ).toThrow("Direct teacher selection requires LAN access.");
  });
});

describe("selection turn API", () => {
  it("lists and runs turn actions", async () => {
    fetchMock.mockResolvedValueOnce(response({ data: [turnBody], count: 1 }));
    await expect(selectionTurns.list(processId, sessionId)).resolves.toMatchObject({
      count: 1
    });
    fetchMock.mockResolvedValueOnce(response({ data: [turnBody], count: 1 }));
    await expect(selectionTurns.initialize(processId, sessionId)).resolves.toMatchObject({
      count: 1
    });
    fetchMock.mockResolvedValueOnce(response(turnBody));
    await expect(selectionTurns.start(processId, sessionId, turnId)).resolves.toMatchObject({
      id: turnId
    });
    fetchMock.mockResolvedValueOnce(
      response({ ...turnBody, status: "completed", completed_at: now })
    );
    await expect(
      selectionTurns.complete(processId, sessionId, turnId, {
        assignment: {
          assignment_process_id: processId,
          hour_requirement_id: requirementId,
          process_teacher_id: teacherId,
          assigned_hours: 4
        }
      })
    ).resolves.toMatchObject({ status: "completed" });
    fetchMock.mockResolvedValueOnce(
      response({ ...turnBody, status: "skipped", skip_reason: "Absent" })
    );
    await expect(
      selectionTurns.skip(processId, sessionId, turnId, { reason: "Absent" })
    ).resolves.toMatchObject({ skip_reason: "Absent" });
    fetchMock.mockResolvedValueOnce(
      response({ ...turnBody, status: "overridden", forced_by_user_id: userId })
    );
    await expect(
      selectionTurns.override(processId, sessionId, turnId, {
        reason: "Department head decision"
      })
    ).resolves.toMatchObject({ forced_by_user_id: userId });
  });

  it("validates turn action and assignment payloads", async () => {
    expect(() =>
      selectionTurns.skip(processId, sessionId, turnId, { reason: "" })
    ).toThrow();
    expect(() =>
      selectionTurns.complete(processId, sessionId, turnId, {
        assignment: {
          assignment_process_id: processId,
          hour_requirement_id: requirementId,
          process_teacher_id: teacherId,
          assigned_hours: 0
        }
      })
    ).toThrow();
  });
});

describe("assignment direct choice API", () => {
  it("creates direct teacher choices", async () => {
    fetchMock.mockResolvedValueOnce(response(assignmentBody));
    await expect(
      assignments.directChoice(processId, {
        meeting_session_id: sessionId,
        hour_requirement_id: requirementId,
        assigned_hours: 4
      })
    ).resolves.toMatchObject({ source: "teacher_direct" });
    expect(fetchMock.mock.calls[0][0]).toContain(
      `/assignment-processes/${processId}/assignments/direct-choice`
    );
  });

  it("validates direct teacher choices", () => {
    expect(() =>
      assignments.directChoice(processId, {
        meeting_session_id: sessionId,
        hour_requirement_id: requirementId,
        assigned_hours: 0
      })
    ).toThrow();
  });
});

describe("history API", () => {
  it("runs version and export calls", async () => {
    fetchMock.mockResolvedValueOnce(response({ data: [versionBody], count: 1 }));
    await expect(history.listVersions(processId)).resolves.toMatchObject({
      count: 1
    });
    fetchMock.mockResolvedValueOnce(response(versionBody));
    await expect(
      history.createVersion(processId, { reason: "baseline" })
    ).resolves.toMatchObject({ id: versionId });
    fetchMock.mockResolvedValueOnce(response(comparisonBody));
    await expect(
      history.compareVersions(processId, versionId, nextVersionId)
    ).resolves.toMatchObject({ assignment_count_delta: 1 });
    fetchMock.mockResolvedValueOnce(response(comparisonBody));
    await expect(history.comparePreviousYear(processId)).resolves.toMatchObject({
      changed_sections: ["assignments"]
    });
    fetchMock.mockResolvedValueOnce(response({ data: [artifactBody], count: 1 }));
    await expect(history.listExports(processId)).resolves.toMatchObject({
      count: 1
    });
    fetchMock.mockResolvedValueOnce(response(artifactBody));
    await expect(
      history.createExport(processId, {
        export_type: "backup",
        format: "json",
        process_version_id: versionId
      })
    ).resolves.toMatchObject({ checksum: "a".repeat(64) });
    fetchMock.mockResolvedValueOnce(response(processBody));
    await expect(
      history.restoreDraft(processId, { content: artifactBody.content })
    ).resolves.toMatchObject({ id: processId });
  });

  it("validates export calls", () => {
    expect(() =>
      history.createExport(processId, {
        export_type: "backup",
        format: "xml"
      } as never)
    ).toThrow();
    expect(() => history.restoreDraft(processId, { content: "" })).toThrow();
  });
});
