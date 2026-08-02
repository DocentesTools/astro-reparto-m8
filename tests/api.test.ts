import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  academicYears,
  allocationRevisions,
  assignments,
  assignmentProcesses,
  auditEvents,
  classroomStages,
  departments,
  groupSubjects,
  history,
  hourRequirements,
  meetingSessions,
  processTeachers,
  schools,
  selectionTurns,
  subjects,
  teacherProfiles,
  teachingActivities,
  teachingGroups,
  teachingPlans
} from "../src/runtime/api/index.js";
import { setRepartoAuthAdapter } from "../src/runtime/authAdapter.js";
import { resetRepartoConfig } from "../src/runtime/config.js";

const processId = "11111111-1111-4111-8111-111111111111";
const sessionId = "22222222-2222-4222-8222-222222222222";
const userId = "33333333-3333-4333-8333-333333333333";
const turnId = "77777777-7777-4777-8777-777777777777";
const teacherId = "88888888-8888-4888-8888-888888888888";
const requirementId = "99999999-9999-4999-8999-999999999999";
const teachingActivityId = "96969696-9696-4696-8696-969696969696";
const versionId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const nextVersionId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const artifactId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const now = "2026-07-04T10:00:00Z";
const classroomStageId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const fetchMock = vi.fn();

const classroomStageBody = {
  id: classroomStageId,
  stage: "Secundaria",
  min_grade: 1,
  max_grade: 4,
  label: "ESO",
  created_at: now,
  updated_at: now
};

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

const dashboardBody = {
  ...summaryBody,
  generated_at: now,
  teacher_balances: [teacherBalanceBody],
  requirement_balances: [
    {
      hour_requirement_id: requirementId,
      teaching_group_id: "12121212-1212-4121-8121-121212121212",
      teaching_group_label: "1 ESO A",
      subject_id: "34343434-3434-4343-8343-343434343434",
      subject_name: "Mathematics",
      required_hours: 4,
      assigned_hours: 1,
      pending_hours: 3,
      assignment_count: 1,
      has_override: false,
      state: "partial"
    }
  ]
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
  teaching_activity_id: teachingActivityId,
  process_teacher_id: teacherId,
  source: "teacher_direct",
  status: "active",
  chosen_by_user_id: userId,
  confirmed_by_user_id: userId,
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
    fetchMock.mockResolvedValueOnce(response(dashboardBody));
    await expect(assignmentProcesses.dashboard(processId)).resolves.toMatchObject({
      teacher_balances: [{ display_name: "Linked Teacher" }],
      requirement_balances: [{ subject_name: "Mathematics" }]
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
          hour_requirement_id: requirementId,
          process_teacher_id: teacherId
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
          hour_requirement_id: requirementId,
          process_teacher_id: teacherId,
          assigned_hours: 4
        }
      } as never)
    ).toThrow();
  });
});

describe("assignment direct choice API", () => {
  it("creates direct teacher choices", async () => {
    fetchMock.mockResolvedValueOnce(response(assignmentBody));
    await expect(
      assignments.directChoice(processId, {
        meeting_session_id: sessionId,
        hour_requirement_id: requirementId
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
        assigned_hours: 4
      } as never)
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

describe("global entity API (Phase 1)", () => {
  const schoolId = "11111111-1111-4111-8111-111111111111";
  const yearId = "22222222-2222-4222-8222-222222222222";
  const departmentId = "33333333-3333-4333-8333-333333333333";
  const profileId = "44444444-4444-4444-8444-444444444444";
  const userId = "55555555-5555-4555-8555-555555555555";
  const now = "2026-07-04T10:00:00Z";

  const schoolBody = {
    id: schoolId,
    name: "IES Almería Centro",
    locality: null,
    province: null,
    region: "Andalucia",
    address: null,
    notes: null,
    created_at: now,
    updated_at: now
  };
  const yearBody = {
    id: yearId,
    label: "2025-2026",
    start_date: "2025-09-01",
    end_date: "2026-06-30",
    status: "active",
    previous_academic_year_id: null,
    school_id: schoolId,
    created_by_user_id: userId,
    created_at: now,
    updated_at: now
  };
  const departmentBody = {
    id: departmentId,
    school_id: schoolId,
    name: "Matemáticas",
    slug: "matematicas",
    department_head_user_id: null,
    notes: null,
    created_at: now,
    updated_at: now
  };
  const profileBody = {
    id: profileId,
    display_name: "Ana García",
    user_id: null,
    active: true,
    notes: null,
    created_at: now,
    updated_at: now
  };

  it("schools list/get/create/update", async () => {
    fetchMock.mockResolvedValueOnce(response({ data: [schoolBody], count: 1 }));
    await expect(schools.list({ skip: 0, limit: 25 })).resolves.toMatchObject({
      count: 1
    });
    expect(fetchMock.mock.calls[0][0]).toContain("/schools/");

    fetchMock.mockResolvedValueOnce(response(schoolBody));
    await expect(schools.get(schoolId)).resolves.toMatchObject({ id: schoolId });

    fetchMock.mockResolvedValueOnce(response(schoolBody));
    await expect(schools.create({ name: "IES" })).resolves.toMatchObject({
      name: "IES Almería Centro"
    });

    fetchMock.mockResolvedValueOnce(response({ ...schoolBody, name: "Renamed" }));
    await expect(
      schools.update(schoolId, { name: "Renamed" })
    ).resolves.toMatchObject({ name: "Renamed" });
    expect(fetchMock.mock.calls.at(-1)?.[0]).toContain(`/schools/${schoolId}`);
  });

  it("academic years list/create/update/archive", async () => {
    fetchMock.mockResolvedValueOnce(response({ data: [yearBody], count: 1 }));
    await expect(academicYears.list()).resolves.toMatchObject({ count: 1 });

    fetchMock.mockResolvedValueOnce(response(yearBody));
    await expect(academicYears.get(yearId)).resolves.toMatchObject({
      id: yearId
    });

    fetchMock.mockResolvedValueOnce(response(yearBody));
    await expect(
      academicYears.create({
        label: "2025-2026",
        start_date: "2025-09-01",
        end_date: "2026-06-30"
      })
    ).resolves.toMatchObject({ label: "2025-2026" });

    fetchMock.mockResolvedValueOnce(response(yearBody));
    await expect(
      academicYears.update(yearId, { status: "archived" })
    ).resolves.toMatchObject({ status: "active" });

    fetchMock.mockResolvedValueOnce(response({ ...yearBody, status: "archived" }));
    await expect(academicYears.archive(yearId)).resolves.toMatchObject({
      status: "archived"
    });
    expect(fetchMock.mock.calls.at(-1)?.[0]).toContain(
      `/academic-years/${yearId}/archive`
    );
  });

  it("departments list with optional school_id filter, create, update", async () => {
    fetchMock.mockResolvedValueOnce(response({ data: [departmentBody], count: 1 }));
    await expect(
      departments.list({ schoolId: schoolId })
    ).resolves.toMatchObject({ count: 1 });
    expect(fetchMock.mock.calls[0][0]).toContain(`school_id=${schoolId}`);

    fetchMock.mockResolvedValueOnce(response({ data: [], count: 0 }));
    await expect(
      departments.list({ schoolId: null })
    ).resolves.toMatchObject({ count: 0 });

    fetchMock.mockResolvedValueOnce(response(departmentBody));
    await expect(departments.get(departmentId)).resolves.toMatchObject({
      id: departmentId
    });

    fetchMock.mockResolvedValueOnce(response(departmentBody));
    await expect(
      departments.create({ school_id: schoolId, name: "Matemáticas" })
    ).resolves.toMatchObject({ slug: "matematicas" });

    fetchMock.mockResolvedValueOnce(response({ ...departmentBody, name: "Lengua" }));
    await expect(
      departments.update(departmentId, { name: "Lengua" })
    ).resolves.toMatchObject({ name: "Lengua" });
  });

  it("teacher profiles list/get/create/update/link-user/delete", async () => {
    fetchMock.mockResolvedValueOnce(response({ data: [profileBody], count: 1 }));
    await expect(
      teacherProfiles.list({ active: true })
    ).resolves.toMatchObject({ count: 1 });
    expect(fetchMock.mock.calls[0][0]).toContain("active=true");

    fetchMock.mockResolvedValueOnce(response({ data: [profileBody], count: 1 }));
    await expect(
      teacherProfiles.list({ active: null })
    ).resolves.toMatchObject({ count: 1 });

    fetchMock.mockResolvedValueOnce(response(profileBody));
    await expect(teacherProfiles.get(profileId)).resolves.toMatchObject({
      id: profileId
    });

    fetchMock.mockResolvedValueOnce(response(profileBody));
    await expect(
      teacherProfiles.create({ display_name: "Ana" })
    ).resolves.toMatchObject({ display_name: "Ana García" });

    fetchMock.mockResolvedValueOnce(response({ ...profileBody, active: false }));
    await expect(
      teacherProfiles.update(profileId, { active: false })
    ).resolves.toMatchObject({ active: false });

    fetchMock.mockResolvedValueOnce(response({ ...profileBody, user_id: userId }));
    await expect(
      teacherProfiles.linkUser(profileId, { user_id: userId })
    ).resolves.toMatchObject({ user_id: userId });
    expect(fetchMock.mock.calls.at(-1)?.[0]).toContain(
      `/teacher-profiles/${profileId}/link-user`
    );

    fetchMock.mockResolvedValueOnce(response(profileBody));
    await expect(teacherProfiles.remove(profileId)).resolves.toMatchObject({
      id: profileId
    });
    const removeCall = fetchMock.mock.calls.at(-1)?.[1] as RequestInit;
    expect(removeCall?.method).toBe("DELETE");
  });
});

describe("classroom stage API", () => {
  it("lists, reads, creates, updates, and removes stages", async () => {
    fetchMock.mockResolvedValueOnce(response({ data: [classroomStageBody], count: 1 }));
    await expect(classroomStages.list()).resolves.toMatchObject({ count: 1 });
    fetchMock.mockResolvedValueOnce(response(classroomStageBody));
    await expect(classroomStages.get(classroomStageId)).resolves.toMatchObject({ label: "ESO" });
    fetchMock.mockResolvedValueOnce(response(classroomStageBody));
    await expect(classroomStages.create({ stage: "Secundaria", min_grade: 1, max_grade: 4, label: "ESO" })).resolves.toMatchObject({ id: classroomStageId });
    fetchMock.mockResolvedValueOnce(response({ ...classroomStageBody, max_grade: 6 }));
    await expect(classroomStages.update(classroomStageId, { max_grade: 6 })).resolves.toMatchObject({ max_grade: 6 });
    fetchMock.mockResolvedValueOnce(response(classroomStageBody));
    await expect(classroomStages.remove(classroomStageId)).resolves.toMatchObject({ id: classroomStageId });
  });
});

describe("process-scoped entity API (Phase 3 step 1)", () => {
  const processId = "11111111-1111-4111-8111-111111111111";
  const subjectId = "22222222-2222-4222-8222-222222222222";
  const groupId = "33333333-3333-4333-8333-333333333333";
  const stageId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const requirementId = "44444444-4444-4444-8444-444444444444";
  const processTeacherId = "55555555-5555-4555-8555-555555555555";
  const teacherProfileId = "66666666-6666-4666-8666-666666666666";
  const assignmentId = "77777777-7777-4777-8777-777777777777";
  const auditId = "88888888-8888-4888-8888-888888888888";
  const userId = "99999999-9999-4999-8999-999999999999";
  const now = "2026-07-04T10:00:00Z";

  const subjectBody = {
    id: subjectId,
    assignment_process_id: processId,
    name: "Mathematics",
    allocation_category: "main",
    activity_type: "ordinary",
    default_group_weekly_hours: 4,
    default_teacher_weekly_hours_per_position: 4,
    default_required_teacher_count: 1,
    allows_multiple_groups: false,
    allows_zero_groups: false,
    notes: null,
    created_at: now,
    updated_at: now
  };
  const groupSubjectId = "12121212-1212-4121-8121-121212121212";
  const groupSubjectBody = {
    id: groupSubjectId,
    assignment_process_id: processId,
    teaching_group_id: groupId,
    subject_id: subjectId,
    group_weekly_hours: 4,
    teacher_weekly_hours_per_position: null,
    required_teacher_count: 1,
    active: true,
    notes: null,
    created_at: now,
    updated_at: now
  };
  const groupBody = {
    id: groupId,
    assignment_process_id: processId,
    classroom_stage_id: stageId,
    classroom_stage: { id: stageId, stage: "Secundaria", min_grade: 1, max_grade: 4, label: "ESO" },
    grade: 1,
    group_code: "A",
    label: "1 ESO A",
    notes: null,
    created_at: now,
    updated_at: now
  };
  const requirementBody = {
    id: requirementId,
    assignment_process_id: processId,
    teaching_activity_id: teachingActivityId,
    position_index: 0,
    required_teacher_hours: "4.00",
    status: "available",
    created_generation: 1,
    last_validated_generation: 1,
    retired_generation: null,
    superseded_by_requirement_id: null,
    created_at: now,
    updated_at: now
  };
  const processTeacherBody = {
    id: processTeacherId,
    assignment_process_id: processId,
    teacher_profile_id: teacherProfileId,
    available_hours: 18,
    participates_in_selection: true,
    selection_position: 1,
    selection_points: 10,
    selection_criteria_label: "Seniority",
    selection_notes: null,
    order_locked: false,
    status: "active",
    created_at: now,
    updated_at: now
  };
  const assignmentBody = {
    id: assignmentId,
    assignment_process_id: processId,
    hour_requirement_id: requirementId,
    teaching_activity_id: teachingActivityId,
    process_teacher_id: processTeacherId,
    source: "department_head",
    status: "active",
    chosen_by_user_id: userId,
    confirmed_by_user_id: userId,
    notes: null,
    created_at: now,
    updated_at: now
  };
  const auditBody = {
    id: auditId,
    assignment_process_id: processId,
    actor_user_id: userId,
    actor_role: "department_head",
    event_type: "assignment.created",
    entity_type: "assignment",
    entity_id: assignmentId,
    before_json: null,
    after_json: { id: assignmentId },
    reason: "Manual assignment",
    created_at: now,
    updated_at: now
  };

  it("subjects list/get/create/update/remove", async () => {
    fetchMock.mockResolvedValueOnce(response({ data: [subjectBody], count: 1 }));
    await expect(subjects.list(processId)).resolves.toMatchObject({ count: 1 });
    expect(fetchMock.mock.calls[0][0]).toContain(
      `/assignment-processes/${processId}/subjects/`
    );

    fetchMock.mockResolvedValueOnce(response(subjectBody));
    await expect(subjects.get(processId, subjectId)).resolves.toMatchObject({
      id: subjectId
    });

    fetchMock.mockResolvedValueOnce(response(subjectBody));
    await expect(
      subjects.create(processId, { name: "Mathematics" })
    ).resolves.toMatchObject({ name: "Mathematics" });
    expect(
      JSON.parse((fetchMock.mock.calls.at(-1)?.[1] as RequestInit).body as string)
        .assignment_process_id
    ).toBe(processId);

    fetchMock.mockResolvedValueOnce(response({ ...subjectBody, name: "Maths" }));
    await expect(
      subjects.update(processId, subjectId, { name: "Maths" })
    ).resolves.toMatchObject({ name: "Maths" });

    fetchMock.mockResolvedValueOnce(response(subjectBody));
    await expect(subjects.remove(processId, subjectId)).resolves.toMatchObject({
      id: subjectId
    });
    expect(fetchMock.mock.calls.at(-1)?.[0]).toContain(
      `/assignment-processes/${processId}/subjects/${subjectId}`
    );
    expect((fetchMock.mock.calls.at(-1)?.[1] as RequestInit).method).toBe(
      "DELETE"
    );

    expect(() => subjects.create(processId, { name: "" } as never)).toThrow();
    expect(() =>
      subjects.update(processId, subjectId, { name: "" } as never)
    ).toThrow();
  });

  it("group subjects list/get/create/update/remove", async () => {
    fetchMock.mockResolvedValueOnce(
      response({ data: [groupSubjectBody], count: 1 })
    );
    await expect(groupSubjects.list(processId)).resolves.toMatchObject({
      count: 1
    });
    expect(fetchMock.mock.calls.at(-1)?.[0]).toContain(
      `/assignment-processes/${processId}/group-subjects/`
    );

    fetchMock.mockResolvedValueOnce(response(groupSubjectBody));
    await expect(
      groupSubjects.get(processId, groupSubjectId)
    ).resolves.toMatchObject({ group_weekly_hours: "4.00" });

    fetchMock.mockResolvedValueOnce(response(groupSubjectBody));
    await expect(
      groupSubjects.create(processId, {
        teaching_group_id: groupId,
        subject_id: subjectId,
        group_weekly_hours: 4
      })
    ).resolves.toMatchObject({ id: groupSubjectId });
    expect(
      JSON.parse((fetchMock.mock.calls.at(-1)?.[1] as RequestInit).body as string)
    ).toEqual({
      assignment_process_id: processId,
      teaching_group_id: groupId,
      subject_id: subjectId,
      group_weekly_hours: "4.00"
    });

    fetchMock.mockResolvedValueOnce(
      response({ ...groupSubjectBody, required_teacher_count: 2 })
    );
    await expect(
      groupSubjects.update(processId, groupSubjectId, {
        required_teacher_count: 2,
        group_weekly_hours: null
      })
    ).resolves.toMatchObject({ required_teacher_count: 2 });
    const patched = fetchMock.mock.calls.at(-1);
    expect((patched?.[1] as RequestInit).method).toBe("PATCH");
    // An explicit null clears the override back to "inherit the subject
    // default"; an omitted field is left untouched entirely.
    expect(JSON.parse((patched?.[1] as RequestInit).body as string)).toEqual({
      required_teacher_count: 2,
      group_weekly_hours: null
    });

    fetchMock.mockResolvedValueOnce(response(groupSubjectBody));
    await expect(
      groupSubjects.remove(processId, groupSubjectId)
    ).resolves.toMatchObject({ id: groupSubjectId });
    expect(fetchMock.mock.calls.at(-1)?.[0]).toContain(
      `/assignment-processes/${processId}/group-subjects/${groupSubjectId}`
    );
    expect((fetchMock.mock.calls.at(-1)?.[1] as RequestInit).method).toBe(
      "DELETE"
    );

    expect(() =>
      groupSubjects.create(processId, {
        teaching_group_id: groupId,
        subject_id: subjectId,
        required_teacher_count: 0
      })
    ).toThrow();
    expect(() =>
      groupSubjects.update(processId, groupSubjectId, {
        teaching_group_id: groupId
      } as never)
    ).toThrow();
  });

  it("group-subject bulk preview and apply are a confirmed pair", async () => {
    const change = {
      teaching_group_id: groupId,
      group_subject_id: null,
      group_weekly_hours: 4,
      teacher_weekly_hours_per_position: null,
      required_teacher_count: 1
    };
    fetchMock.mockResolvedValueOnce(
      response({
        mode: "create_missing",
        subject_id: subjectId,
        matched_group_ids: [groupId],
        to_create: [change],
        to_update: [],
        unchanged: [],
        conflicts: [],
        validation_errors: [],
        expected_affected_count: 1
      })
    );
    await expect(
      groupSubjects.bulkPreview(processId, {
        subject_id: subjectId,
        mode: "create_missing",
        stage: "ESO",
        group_weekly_hours: 4
      })
    ).resolves.toMatchObject({ expected_affected_count: 1 });
    const previewed = fetchMock.mock.calls.at(-1);
    expect(previewed?.[0]).toContain(
      `/assignment-processes/${processId}/group-subjects/bulk-preview`
    );
    expect((previewed?.[1] as RequestInit).method).toBe("POST");
    expect(JSON.parse((previewed?.[1] as RequestInit).body as string)).toEqual({
      subject_id: subjectId,
      mode: "create_missing",
      stage: "ESO",
      group_weekly_hours: "4.00"
    });

    fetchMock.mockResolvedValueOnce(
      response({
        created_count: 1,
        updated_count: 0,
        data: [groupSubjectBody],
        count: 1
      })
    );
    await expect(
      groupSubjects.bulkApply(processId, {
        subject_id: subjectId,
        mode: "create_missing",
        stage: "ESO",
        group_weekly_hours: 4,
        expected_affected_count: 1
      })
    ).resolves.toMatchObject({ created_count: 1 });
    expect(fetchMock.mock.calls.at(-1)?.[0]).toContain(
      `/assignment-processes/${processId}/group-subjects/bulk-apply`
    );
    expect(
      JSON.parse(
        (fetchMock.mock.calls.at(-1)?.[1] as RequestInit).body as string
      ).expected_affected_count
    ).toBe(1);

    // Apply without the previewed count is not a request worth sending: the
    // backend's 409 staleness guard has nothing to compare against.
    expect(() =>
      groupSubjects.bulkApply(processId, {
        subject_id: subjectId,
        mode: "create_missing"
      } as never)
    ).toThrow();
  });

  it("teaching groups list/get/create/update/remove", async () => {
    fetchMock.mockResolvedValueOnce(response({ data: [groupBody], count: 1 }));
    await expect(teachingGroups.list(processId)).resolves.toMatchObject({
      count: 1
    });
    expect(fetchMock.mock.calls[0][0]).toContain(
      `/assignment-processes/${processId}/groups/`
    );

    fetchMock.mockResolvedValueOnce(response(groupBody));
    await expect(teachingGroups.get(processId, groupId)).resolves.toMatchObject({
      label: "1 ESO A"
    });

    fetchMock.mockResolvedValueOnce(response(groupBody));
    await expect(
      teachingGroups.create(processId, {
        classroom_stage_id: stageId,
        grade: 1,
        group_code: "A",
        label: "1 ESO A"
      })
    ).resolves.toMatchObject({ group_code: "A" });
    expect(
      JSON.parse((fetchMock.mock.calls.at(-1)?.[1] as RequestInit).body as string)
        .assignment_process_id
    ).toBe(processId);

    fetchMock.mockResolvedValueOnce(response({ ...groupBody, label: "Renamed" }));
    await expect(
      teachingGroups.update(processId, groupId, { label: "Renamed" })
    ).resolves.toMatchObject({ label: "Renamed" });

    fetchMock.mockResolvedValueOnce(response(groupBody));
    await expect(
      teachingGroups.remove(processId, groupId)
    ).resolves.toMatchObject({ id: groupId });
    expect((fetchMock.mock.calls.at(-1)?.[1] as RequestInit).method).toBe(
      "DELETE"
    );

    fetchMock.mockResolvedValueOnce(response({ data: [groupBody], count: 1 }));
    await expect(teachingGroups.bulkCreate(processId, {
      classroom_stage_id: stageId, grade: 1, group_start: "A", group_end: "A"
    })).resolves.toMatchObject({ count: 1 });

    expect(() =>
      teachingGroups.create(processId, {
        classroom_stage_id: stageId,
        grade: 0,
        group_code: "A",
        label: "1 ESO A"
      } as never)
    ).toThrow();
    expect(() =>
      teachingGroups.update(processId, groupId, { group_code: "" } as never)
    ).toThrow();
  });

  it("reads generated hour-requirement slots without mutation methods", async () => {
    fetchMock.mockResolvedValueOnce(
      response({ data: [requirementBody], count: 1 })
    );
    await expect(hourRequirements.list(processId)).resolves.toMatchObject({
      count: 1
    });
    expect(fetchMock.mock.calls[0][0]).toContain(
      `/assignment-processes/${processId}/requirements/`
    );

    fetchMock.mockResolvedValueOnce(response(requirementBody));
    await expect(
      hourRequirements.get(processId, requirementId)
    ).resolves.toMatchObject({ required_teacher_hours: "4.00" });
    expect(hourRequirements).not.toHaveProperty("create");
    expect(hourRequirements).not.toHaveProperty("update");
    expect(hourRequirements).not.toHaveProperty("remove");
  });

  it("process teachers list/get/create/update/remove", async () => {
    fetchMock.mockResolvedValueOnce(
      response({ data: [processTeacherBody], count: 1 })
    );
    await expect(processTeachers.list(processId)).resolves.toMatchObject({
      count: 1
    });
    expect(fetchMock.mock.calls[0][0]).toContain(
      `/assignment-processes/${processId}/teachers/`
    );

    fetchMock.mockResolvedValueOnce(response(processTeacherBody));
    await expect(
      processTeachers.get(processId, processTeacherId)
    ).resolves.toMatchObject({ status: "active" });

    fetchMock.mockResolvedValueOnce(response(processTeacherBody));
    await expect(
      processTeachers.create(processId, {
        teacher_profile_id: teacherProfileId,
        available_hours: 18
      })
    ).resolves.toMatchObject({ available_hours: 18 });
    expect(
      JSON.parse((fetchMock.mock.calls.at(-1)?.[1] as RequestInit).body as string)
        .assignment_process_id
    ).toBe(processId);

    fetchMock.mockResolvedValueOnce(
      response({ ...processTeacherBody, status: "inactive" })
    );
    await expect(
      processTeachers.update(processId, processTeacherId, {
        status: "inactive"
      })
    ).resolves.toMatchObject({ status: "inactive" });

    fetchMock.mockResolvedValueOnce(response(processTeacherBody));
    await expect(
      processTeachers.remove(processId, processTeacherId)
    ).resolves.toMatchObject({ id: processTeacherId });
    expect((fetchMock.mock.calls.at(-1)?.[1] as RequestInit).method).toBe(
      "DELETE"
    );

    expect(() =>
      processTeachers.create(processId, {
        teacher_profile_id: teacherProfileId,
        available_hours: -1
      } as never)
    ).toThrow();
    expect(() =>
      processTeachers.update(processId, processTeacherId, {
        status: "removed"
      } as never)
    ).toThrow();
  });

  it("assignments list/get/validations/create/update + undo/reassign", async () => {
    fetchMock.mockResolvedValueOnce(response({ data: [assignmentBody], count: 1 }));
    await expect(assignments.list(processId)).resolves.toMatchObject({
      count: 1
    });
    expect(fetchMock.mock.calls[0][0]).toContain(
      `/assignment-processes/${processId}/assignments/`
    );

    fetchMock.mockResolvedValueOnce(response(assignmentBody));
    await expect(
      assignments.get(processId, assignmentId)
    ).resolves.toMatchObject({ id: assignmentId, status: "active" });

    fetchMock.mockResolvedValueOnce(
      response({
        assignment_process_id: processId,
        is_final_ready: false,
        blocking_count: 1,
        warning_count: 0,
        messages: [
          {
            severity: "blocking",
            code: "ASSIGNMENT_SLOT_UNASSIGNED",
            message: "One live slot has no teacher.",
            entity_type: "hour_requirement",
            entity_id: requirementId
          }
        ]
      })
    );
    await expect(assignments.validations(processId)).resolves.toMatchObject({
      blocking_count: 1,
      is_final_ready: false
    });
    expect(fetchMock.mock.calls.at(-1)?.[0]).toContain(
      `/assignment-processes/${processId}/assignments/validations`
    );

    fetchMock.mockResolvedValueOnce(response(assignmentBody));
    await expect(
      assignments.create(processId, {
        hour_requirement_id: requirementId,
        process_teacher_id: processTeacherId
      })
    ).resolves.toMatchObject({ teaching_activity_id: teachingActivityId });

    fetchMock.mockResolvedValueOnce(
      response({ ...assignmentBody, notes: "Swapped at the meeting" })
    );
    await expect(
      assignments.update(processId, assignmentId, {
        notes: "Swapped at the meeting"
      })
    ).resolves.toMatchObject({ notes: "Swapped at the meeting" });
    expect(fetchMock.mock.calls.at(-1)?.[0]).toContain(
      `/assignment-processes/${processId}/assignments/${assignmentId}`
    );
    expect((fetchMock.mock.calls.at(-1)?.[1] as RequestInit).method).toBe(
      "PATCH"
    );

    fetchMock.mockResolvedValueOnce(
      response({ ...assignmentBody, status: "cancelled" })
    );
    await expect(
      assignments.undo(processId, assignmentId, { reason: "Wrong teacher" })
    ).resolves.toMatchObject({ status: "cancelled" });
    expect(fetchMock.mock.calls.at(-1)?.[0]).toContain(
      `/assignments/${assignmentId}/undo`
    );
    expect((fetchMock.mock.calls.at(-1)?.[1] as RequestInit).method).toBe(
      "POST"
    );

    fetchMock.mockResolvedValueOnce(response(assignmentBody));
    await expect(
      assignments.reassign(processId, assignmentId, {
        process_teacher_id: processTeacherId,
        reason: "Teacher unavailable"
      })
    ).resolves.toMatchObject({ id: assignmentId });
    expect(fetchMock.mock.calls.at(-1)?.[0]).toContain(
      `/assignments/${assignmentId}/reassign`
    );

    // The hour, share and override inputs are gone from the contract: a slot is
    // indivisible, so a client can no longer even build those payloads.
    expect(() =>
      assignments.create(processId, {
        hour_requirement_id: requirementId,
        process_teacher_id: processTeacherId,
        assigned_hours: 4
      } as never)
    ).toThrow();
    expect(() =>
      assignments.update(processId, assignmentId, {
        assignment_type: "shared"
      } as never)
    ).toThrow();
    expect(() =>
      assignments.directChoice(processId, {
        meeting_session_id: meetingSessionId,
        hour_requirement_id: requirementId,
        assigned_hours: 4
      } as never)
    ).toThrow();
    // Undo and reassignment are reason-required actions, never reasonless
    // deletes — there is no `remove` wrapper to reach the compatibility alias.
    expect(assignments).not.toHaveProperty("remove");
    expect(() =>
      assignments.undo(processId, assignmentId, { reason: "" })
    ).toThrow();
    expect(() =>
      assignments.reassign(processId, assignmentId, {
        process_teacher_id: processTeacherId,
        reason: ""
      })
    ).toThrow();
  });

  it("allocation revisions list/current/create only", async () => {
    const revisionBody = {
      id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
      assignment_process_id: processId,
      revision_number: 1,
      allocated_group_weekly_hours: 120,
      reason: "Initial allocation",
      source: "manual_transcription",
      source_reference: null,
      received_at: null,
      created_by_user_id: userId,
      superseded_at: null,
      created_at: now,
      updated_at: now
    };

    fetchMock.mockResolvedValueOnce(response({ data: [revisionBody], count: 1 }));
    await expect(allocationRevisions.list(processId)).resolves.toMatchObject({
      count: 1
    });
    expect(fetchMock.mock.calls[0][0]).toContain(
      `/assignment-processes/${processId}/allocation-revisions/`
    );

    fetchMock.mockResolvedValueOnce(response(revisionBody));
    await expect(allocationRevisions.current(processId)).resolves.toMatchObject({
      allocated_group_weekly_hours: "120.00"
    });
    expect(fetchMock.mock.calls.at(-1)?.[0]).toContain(
      `/assignment-processes/${processId}/allocation-revisions/current`
    );

    fetchMock.mockResolvedValueOnce(response(revisionBody));
    await expect(
      allocationRevisions.create(processId, {
        allocated_group_weekly_hours: 120,
        reason: "Initial allocation"
      })
    ).resolves.toMatchObject({ revision_number: 1 });
    const sent = JSON.parse(
      (fetchMock.mock.calls.at(-1)?.[1] as RequestInit).body as string
    );
    expect(sent).toEqual({
      allocated_group_weekly_hours: "120.00",
      reason: "Initial allocation"
    });
    expect((fetchMock.mock.calls.at(-1)?.[1] as RequestInit).method).toBe("POST");

    expect(() =>
      allocationRevisions.create(processId, {
        allocated_group_weekly_hours: 0,
        reason: "Zero allocation"
      })
    ).toThrow();
    expect(() =>
      allocationRevisions.create(processId, {
        allocated_group_weekly_hours: 120,
        reason: ""
      })
    ).toThrow();

    // Revisions are immutable by contract: no update, no delete.
    expect(allocationRevisions).not.toHaveProperty("update");
    expect(allocationRevisions).not.toHaveProperty("remove");
  });

  it("audit events list only", async () => {
    fetchMock.mockResolvedValueOnce(response({ data: [auditBody], count: 1 }));
    await expect(auditEvents.list(processId)).resolves.toMatchObject({
      count: 1
    });
    expect(fetchMock.mock.calls[0][0]).toContain(
      `/assignment-processes/${processId}/audit-events/`
    );
    expect(auditEvents).not.toHaveProperty("create");
    expect(auditEvents).not.toHaveProperty("update");
    expect(auditEvents).not.toHaveProperty("remove");
  });
});

describe("teaching-plan and activity API wrappers", () => {
  const planId = "17171717-1717-4171-8171-171717171717";
  const activityId = "18181818-1818-4181-8181-181818181818";
  const subjectId = "19191919-1919-4191-8191-191919191919";
  const groupSubjectId = "20202020-2020-4020-8020-202020202020";

  const planBody = {
    id: planId,
    assignment_process_id: processId,
    allocation_revision_id: null,
    status: "draft",
    current_generation_number: 0,
    locked_at: null,
    locked_by_user_id: null,
    requirements_generated_at: null,
    stale_reason: null,
    feasibility_status: "not_evaluated",
    feasibility_generation: null,
    feasibility_checked_at: null,
    feasibility_input_fingerprint: null,
    feasibility_solver_version: null,
    feasibility_diagnostics_ref: null,
    created_at: now,
    updated_at: now
  };

  const activityBody = {
    id: activityId,
    teaching_plan_id: planId,
    subject_id: subjectId,
    allocation_category: "secondary",
    activity_type: "co_teaching",
    group_weekly_hours_per_group: 2,
    teacher_weekly_hours_per_position: 2.5,
    required_teacher_count: 2,
    notes: null,
    source: "secondary_manual",
    source_group_subject_id: null,
    sync_state: "in_sync",
    retired_at: null,
    group_subject_ids: [groupSubjectId],
    linked_group_count: 1,
    created_at: now,
    updated_at: now
  };

  it("wraps the complete teaching-plan read and action surface", async () => {
    fetchMock.mockResolvedValueOnce(response(planBody));
    await expect(teachingPlans.get(processId)).resolves.toMatchObject({
      id: planId,
      status: "draft"
    });
    expect(fetchMock.mock.calls.at(-1)?.[0]).toContain(
      `/assignment-processes/${processId}/teaching-plan`
    );

    fetchMock.mockResolvedValueOnce(response(planBody));
    await expect(teachingPlans.create(processId)).resolves.toMatchObject({
      id: planId
    });
    expect((fetchMock.mock.calls.at(-1)?.[1] as RequestInit).method).toBe("POST");

    fetchMock.mockResolvedValueOnce(
      response({
        teaching_plan_id: planId,
        assignment_process_id: processId,
        group: {
          total_group_load: "120.00",
          allocated_group_weekly_hours: "124.00",
          allocation_difference: "-4.00",
          is_balanced: false
        },
        teacher: {
          total_teacher_load: "124.00",
          participant_target_total: "124.00",
          teacher_load_difference: "0.00",
          is_balanced: true
        },
        is_exact: false
      })
    );
    await expect(teachingPlans.summary(processId)).resolves.toMatchObject({
      group: { allocation_difference: "-4.00" },
      teacher: { teacher_load_difference: "0.00" }
    });
    expect(fetchMock.mock.calls.at(-1)?.[0]).toContain(
      `/assignment-processes/${processId}/teaching-plan/summary`
    );

    fetchMock.mockResolvedValueOnce(
      response({
        teaching_plan_id: planId,
        assignment_process_id: processId,
        is_assignment_ready: false,
        blocking_count: 1,
        warning_count: 0,
        messages: [
          {
            severity: "blocking",
            code: "plan.missing_allocation",
            message: "No allocation has been recorded.",
            entity_type: "plan",
            entity_id: planId
          }
        ]
      })
    );
    await expect(teachingPlans.validations(processId)).resolves.toMatchObject({
      blocking_count: 1
    });
    expect(fetchMock.mock.calls.at(-1)?.[0]).toContain(
      `/assignment-processes/${processId}/teaching-plan/validations`
    );

    fetchMock.mockResolvedValueOnce(
      response({
        ...planBody,
        status: "locked",
        locked_at: now,
        locked_by_user_id: userId,
        feasibility_status: "feasible",
        feasibility_generation: 0,
        feasibility_checked_at: now,
        feasibility_input_fingerprint: "fingerprint",
        feasibility_solver_version: "solver-v1"
      })
    );
    await expect(teachingPlans.lock(processId)).resolves.toMatchObject({
      status: "locked",
      locked_by_user_id: userId
    });
    expect(fetchMock.mock.calls.at(-1)?.[0]).toContain(
      `/assignment-processes/${processId}/teaching-plan/lock`
    );
    expect((fetchMock.mock.calls.at(-1)?.[1] as RequestInit).method).toBe("POST");

    fetchMock.mockResolvedValueOnce(
      response({
        created: [activityBody],
        created_count: 1,
        skipped_source_ids: [],
        skipped_count: 0
      })
    );
    await expect(teachingPlans.materializeMain(processId)).resolves.toMatchObject(
      { created_count: 1 }
    );
    expect(fetchMock.mock.calls.at(-1)?.[0]).toContain(
      `/assignment-processes/${processId}/teaching-plan/materialize-main`
    );
    expect((fetchMock.mock.calls.at(-1)?.[1] as RequestInit).method).toBe("POST");

    const reconciliationAssignmentId =
      "24242424-2424-4424-8424-242424242424";
    const reconciliationTeacherId =
      "25252525-2525-4525-8525-252525252525";
    const reconciliationSlot = {
      id: requirementId,
      assignment_process_id: processId,
      teaching_activity_id: activityId,
      position_index: 0,
      required_teacher_hours: 3,
      status: "available",
      created_generation: 2,
      last_validated_generation: 2,
      retired_generation: null,
      superseded_by_requirement_id: null,
      created_at: now,
      updated_at: now
    };
    const conflict = {
      requirement_id: requirementId,
      teaching_activity_id: activityId,
      position_index: 0,
      resolution: "value_changed",
      current_required_teacher_hours: 2.9000000000000004,
      new_required_teacher_hours: 3,
      assignment_id: reconciliationAssignmentId,
      process_teacher_id: reconciliationTeacherId,
      superseded_by_requirement_id: null
    };
    fetchMock.mockResolvedValueOnce(
      response({
        next_generation_number: 2,
        conflicts: [conflict],
        conflict_count: 1,
        create_count: 0,
        preserve_count: 2,
        retire_count: 0,
        requires_reconciliation: true,
        is_noop: false
      })
    );
    await expect(
      hourRequirements.reconciliationPreview(processId)
    ).resolves.toMatchObject({
      conflict_count: 1,
      conflicts: [
        {
          current_required_teacher_hours: "2.90",
          new_required_teacher_hours: "3.00"
        }
      ]
    });
    expect(fetchMock.mock.calls.at(-1)?.[0]).toContain(
      `/assignment-processes/${processId}/requirements/reconciliation-preview`
    );

    fetchMock.mockResolvedValueOnce(
      response({
        generation_number: 2,
        resolved: [conflict],
        resolved_count: 1,
        released_assignment_ids: [reconciliationAssignmentId],
        created: [reconciliationSlot],
        created_count: 1,
        preserved_count: 2,
        retired_count: 0,
        data: [reconciliationSlot],
        count: 3
      })
    );
    await expect(
      hourRequirements.reconcile(processId, {
        reason: "  Allocation changed.  ",
        expected_conflict_count: 1
      })
    ).resolves.toMatchObject({ resolved_count: 1, count: 3 });
    const reconcileCall = fetchMock.mock.calls.at(-1);
    expect(reconcileCall?.[0]).toContain(
      `/assignment-processes/${processId}/requirements/reconcile`
    );
    expect(JSON.parse((reconcileCall?.[1] as RequestInit).body as string)).toEqual(
      {
        reason: "Allocation changed.",
        expected_conflict_count: 1
      }
    );
  });

  it("previews and applies deterministic requirement generation", async () => {
    const generatedSlot = {
      id: requirementId,
      assignment_process_id: processId,
      teaching_activity_id: activityId,
      position_index: 0,
      required_teacher_hours: 2.9000000000000004,
      status: "available",
      created_generation: 1,
      last_validated_generation: 1,
      retired_generation: null,
      superseded_by_requirement_id: null,
      created_at: now,
      updated_at: now
    };
    fetchMock.mockResolvedValueOnce(
      response({
        next_generation_number: 1,
        to_create: [
          {
            teaching_activity_id: activityId,
            position_index: 0,
            required_teacher_hours: 2.5
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
      })
    );
    await expect(
      hourRequirements.generationPreview(processId)
    ).resolves.toMatchObject({
      next_generation_number: 1,
      to_create: [{ required_teacher_hours: "2.50" }]
    });
    expect(fetchMock.mock.calls.at(-1)?.[0]).toContain(
      `/assignment-processes/${processId}/requirements/generation-preview`
    );
    expect((fetchMock.mock.calls.at(-1)?.[1] as RequestInit).method).toBe("POST");

    fetchMock.mockResolvedValueOnce(
      response({
        generation_number: 1,
        created: [generatedSlot],
        created_count: 1,
        preserved_count: 0,
        retired_count: 0,
        data: [generatedSlot],
        count: 1
      })
    );
    await expect(hourRequirements.generate(processId)).resolves.toMatchObject({
      generation_number: 1,
      count: 1,
      data: [{ required_teacher_hours: "2.90" }]
    });
    expect(fetchMock.mock.calls.at(-1)?.[0]).toContain(
      `/assignment-processes/${processId}/requirements/generate`
    );
    expect((fetchMock.mock.calls.at(-1)?.[1] as RequestInit).method).toBe("POST");
  });

  it("wraps activity CRUD and canonicalizes outgoing hours", async () => {
    fetchMock.mockResolvedValueOnce(
      response({ data: [activityBody], count: 1 })
    );
    await expect(teachingActivities.list(processId)).resolves.toMatchObject({
      count: 1
    });
    expect(fetchMock.mock.calls.at(-1)?.[0]).toContain(
      `/assignment-processes/${processId}/teaching-activities/`
    );

    fetchMock.mockResolvedValueOnce(response(activityBody));
    await expect(
      teachingActivities.get(processId, activityId)
    ).resolves.toMatchObject({ id: activityId });

    fetchMock.mockResolvedValueOnce(response(activityBody));
    await expect(
      teachingActivities.create(processId, {
        subject_id: subjectId,
        activity_type: "co_teaching",
        group_weekly_hours_per_group: 2,
        teacher_weekly_hours_per_position: "2.5",
        required_teacher_count: 2,
        group_subject_ids: [groupSubjectId]
      })
    ).resolves.toMatchObject({ id: activityId });
    const created = fetchMock.mock.calls.at(-1);
    expect((created?.[1] as RequestInit).method).toBe("POST");
    expect(JSON.parse((created?.[1] as RequestInit).body as string)).toEqual({
      subject_id: subjectId,
      activity_type: "co_teaching",
      group_weekly_hours_per_group: "2.00",
      teacher_weekly_hours_per_position: "2.50",
      required_teacher_count: 2,
      group_subject_ids: [groupSubjectId]
    });

    fetchMock.mockResolvedValueOnce(
      response({ ...activityBody, required_teacher_count: 1 })
    );
    await expect(
      teachingActivities.update(processId, activityId, {
        teacher_weekly_hours_per_position: 3,
        required_teacher_count: 1
      })
    ).resolves.toMatchObject({ required_teacher_count: 1 });
    const patched = fetchMock.mock.calls.at(-1);
    expect((patched?.[1] as RequestInit).method).toBe("PATCH");
    expect(JSON.parse((patched?.[1] as RequestInit).body as string)).toEqual({
      teacher_weekly_hours_per_position: "3.00",
      required_teacher_count: 1
    });

    fetchMock.mockResolvedValueOnce(response(activityBody));
    await expect(
      teachingActivities.remove(processId, activityId)
    ).resolves.toMatchObject({ id: activityId });
    expect((fetchMock.mock.calls.at(-1)?.[1] as RequestInit).method).toBe(
      "DELETE"
    );
  });

  it("rejects invalid activity payloads before fetch", () => {
    expect(() =>
      teachingActivities.create(processId, {
        subject_id: subjectId,
        group_weekly_hours_per_group: "1.001",
        teacher_weekly_hours_per_position: 1
      })
    ).toThrow();
    expect(() =>
      teachingActivities.create(processId, {
        subject_id: subjectId,
        group_weekly_hours_per_group: 1,
        teacher_weekly_hours_per_position: 1,
        source: "main_generated"
      } as never)
    ).toThrow();
    expect(() =>
      teachingActivities.update(processId, activityId, {
        subject_id: subjectId
      } as never)
    ).toThrow();
  });
});
