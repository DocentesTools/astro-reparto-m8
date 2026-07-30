import { describe, expect, it } from "vitest";
import {
  AcademicYearCreateSchema,
  AcademicYearPublicSchema,
  AcademicYearsPublicSchema,
  ActivityTypeSchema,
  AssignmentCreateSchema,
  AssignmentDirectChoiceSchema,
  AssignmentProcessCreateSchema,
  AssignmentProcessPublicSchema,
  AssignmentPublicSchema,
  AssignmentUpdateSchema,
  AuditEventPublicSchema,
  AuditEventsPublicSchema,
  ClassroomStageCreateSchema,
  ClassroomStagePublicSchema,
  DepartmentCreateSchema,
  DepartmentHourAllocationRevisionCreateSchema,
  DepartmentHourAllocationRevisionPublicSchema,
  DepartmentHourAllocationRevisionsPublicSchema,
  DepartmentHourAllocationSourceSchema,
  DepartmentPublicSchema,
  DepartmentsPublicSchema,
  ExportArtifactPublicSchema,
  FeasibilityStatusSchema,
  GroupBalanceSchema,
  GroupSubjectBulkApplyRequestSchema,
  GroupSubjectBulkChangeSchema,
  GroupSubjectBulkConflictSchema,
  GroupSubjectBulkModeSchema,
  GroupSubjectBulkPreviewSchema,
  GroupSubjectBulkRequestSchema,
  GroupSubjectBulkResultSchema,
  GroupSubjectCreateSchema,
  GroupSubjectPublicSchema,
  GroupSubjectsPublicSchema,
  GroupSubjectUpdateSchema,
  HourRequirementCreateSchema,
  HourRequirementPublicSchema,
  HourRequirementsPublicSchema,
  HourRequirementUpdateSchema,
  MeetingSessionCreateSchema,
  MainMaterializationResultSchema,
  PlanBalanceSchema,
  PlanValidationReportSchema,
  ProcessDashboardSchema,
  ProcessTeacherCreateSchema,
  ProcessTeacherPublicSchema,
  ProcessTeachersPublicSchema,
  ProcessTeacherUpdateSchema,
  SchoolCreateSchema,
  SchoolPublicSchema,
  SchoolsPublicSchema,
  SubjectAllocationCategorySchema,
  SubjectCreateSchema,
  SubjectPublicSchema,
  SubjectsPublicSchema,
  SubjectUpdateSchema,
  TeacherLanSummarySchema,
  TeacherProfileCreateSchema,
  TeacherProfileLinkUserSchema,
  TeacherProfilePublicSchema,
  TeacherProfilesPublicSchema,
  TeacherLoadBalanceSchema,
  TeachingActivitiesPublicSchema,
  TeachingActivityCreateSchema,
  TeachingActivityGroupPublicSchema,
  TeachingActivityPublicSchema,
  TeachingActivitySourceSchema,
  TeachingActivitySyncStateSchema,
  TeachingActivityUpdateSchema,
  TeachingGroupCreateSchema,
  TeachingGroupPublicSchema,
  TeachingGroupsPublicSchema,
  TeachingGroupUpdateSchema,
  TeachingPlanPublicSchema,
  TeachingPlansPublicSchema,
  TeachingPlanStatusSchema
} from "../src/runtime/schemas.js";

const processId = "11111111-1111-4111-8111-111111111111";
const teacherId = "22222222-2222-4222-8222-222222222222";
const requirementId = "33333333-3333-4333-8333-333333333333";
const userId = "44444444-4444-4444-8444-444444444444";
const now = "2026-07-04T10:00:00Z";

describe("classroom stage schemas", () => {
  it("validates required text and ascending grade ranges", () => {
    expect(ClassroomStagePublicSchema.parse({ id: processId, stage: "Secundaria", min_grade: 1, max_grade: 4, label: "ESO", created_at: now, updated_at: now }).label).toBe("ESO");
    expect(() => ClassroomStageCreateSchema.parse({ stage: "", min_grade: 1, max_grade: 4, label: "ESO" })).toThrow();
    expect(() => ClassroomStageCreateSchema.parse({ stage: "Secundaria", min_grade: 5, max_grade: 4, label: "ESO" })).toThrow();
  });
});

const processBody = {
  id: processId,
  academic_year_id: "55555555-5555-4555-8555-555555555555",
  school_id: "66666666-6666-4666-8666-666666666666",
  department_id: "77777777-7777-4777-8777-777777777777",
  status: "meeting_open",
  default_teacher_hours_reference: null,
  selection_order_enabled: true,
  selection_order_mode: "strict",
  direct_teacher_selection_enabled: true,
  lan_access_enabled: true,
  created_from_process_id: null,
  closed_at: null,
  closed_by_user_id: null,
  created_by_user_id: userId,
  created_at: now,
  updated_at: now
};

const globalBalance = {
  total_required_hours: 4,
  total_available_hours: 4,
  total_assigned_hours: 1,
  pending_required_hours: 3,
  availability_difference: 0,
  uncovered_requirements: 1,
  overloaded_teachers: 0,
  state: "pending"
};

const teacherBalance = {
  process_teacher_id: teacherId,
  teacher_profile_id: "88888888-8888-4888-8888-888888888888",
  display_name: "Teacher",
  available_hours: 4,
  assigned_hours: 1,
  remaining_hours: 3,
  excess_hours: 0,
  assignment_count: 1,
  has_override: false,
  state: "pending"
};

describe("reparto schemas", () => {
  it("parses public process and dashboard payloads strictly", () => {
    expect(AssignmentProcessPublicSchema.parse(processBody)).toMatchObject({
      id: processId,
      selection_order_mode: "strict"
    });

    expect(() =>
      AssignmentProcessPublicSchema.parse({ ...processBody, unexpected: true })
    ).toThrow();

    expect(
      ProcessDashboardSchema.parse({
        process_id: processId,
        generated_at: now,
        global_balance: globalBalance,
        teacher_balances: [teacherBalance],
        requirement_balances: [
          {
            hour_requirement_id: requirementId,
            teaching_group_id: "99999999-9999-4999-8999-999999999999",
            teaching_group_label: "1 ESO A",
            subject_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            subject_name: "Mathematics",
            required_hours: 4,
            assigned_hours: 1,
            pending_hours: 3,
            assignment_count: 1,
            has_override: false,
            state: "partial"
          }
        ],
        validations: [
          {
            severity: "blocking",
            code: "hours.pending",
            message: "Pending hours remain.",
            entity_type: "requirement",
            entity_id: requirementId
          }
        ],
        current_turn: {
          meeting_session_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          selection_turn_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
          process_teacher_id: teacherId,
          position: 0,
          status: "active",
          started_at: now
        },
        blocking_validation_count: 1
      }).blocking_validation_count
    ).toBe(1);
  });

  it("validates create, meeting, LAN, direct-choice, and export contracts", () => {
    expect(
      AssignmentProcessCreateSchema.parse({
        academic_year_id: processBody.academic_year_id,
        school_id: processBody.school_id,
        department_id: processBody.department_id,
        default_teacher_hours_reference: 18
      }).default_teacher_hours_reference
    ).toBe(18);

    expect(() =>
      MeetingSessionCreateSchema.parse({
        assignment_process_id: processId,
        lan_access_enabled: false,
        direct_teacher_selection_enabled: true
      })
    ).toThrow("Direct teacher selection requires LAN access.");

    expect(() =>
      AssignmentDirectChoiceSchema.parse({
        meeting_session_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        hour_requirement_id: requirementId,
        assigned_hours: -1
      })
    ).toThrow();

    expect(
      TeacherLanSummarySchema.parse({
        process_id: processId,
        teacher_profile_id: teacherBalance.teacher_profile_id,
        process_teacher_id: teacherId,
        generated_at: now,
        global_balance: globalBalance,
        teacher_balance: teacherBalance,
        current_turn: null,
        blocking_validation_count: 0
      }).teacher_balance.display_name
    ).toBe("Teacher");

    expect(() =>
      ExportArtifactPublicSchema.parse({
        id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        assignment_process_id: processId,
        process_version_id: null,
        export_type: "backup",
        format: "json",
        file_path: "backup.json",
        created_by_user_id: userId,
        checksum: "short",
        content: "{}",
        created_at: now,
        updated_at: now
      })
    ).toThrow();
  });
});

describe("global entity schemas (Phase 1)", () => {
  const schoolId = "11111111-1111-4111-8111-111111111111";
  const yearId = "22222222-2222-4222-8222-222222222222";
  const departmentId = "33333333-3333-4333-8333-333333333333";
  const profileId = "44444444-4444-4444-8444-444444444444";
  const userId = "55555555-5555-4555-8555-555555555555";
  const now = "2026-07-04T10:00:00Z";

  const schoolBody = {
    id: schoolId,
    name: "IES Almería Centro",
    locality: "Almería",
    province: "Almería",
    region: "Andalucía",
    address: "C/ Real 1",
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

  it("parses school payloads and rejects drift", () => {
    expect(SchoolPublicSchema.parse(schoolBody).name).toBe("IES Almería Centro");
    expect(() => SchoolPublicSchema.parse({ ...schoolBody, extra: true })).toThrow();
    expect(SchoolCreateSchema.parse({ name: "S" }).name).toBe("S");
    expect(() => SchoolCreateSchema.parse({})).toThrow();
  });

  it("parses academic-year payloads and validates date order", () => {
    expect(AcademicYearPublicSchema.parse(yearBody).status).toBe("active");
    expect(() =>
      AcademicYearPublicSchema.parse({ ...yearBody, start_date: "2025/09/01" })
    ).toThrow();
    expect(
      AcademicYearCreateSchema.parse({
        label: "2025-2026",
        start_date: "2025-09-01",
        end_date: "2026-06-30"
      }).start_date
    ).toBe("2025-09-01");
    expect(() =>
      AcademicYearCreateSchema.parse({
        label: "2025-2026",
        start_date: "2026-06-30",
        end_date: "2025-09-01"
      })
    ).toThrow("Start date must be on or before end date.");
    expect(
      AcademicYearsPublicSchema.parse({ data: [yearBody], count: 1 }).count
    ).toBe(1);
  });

  it("parses department payloads", () => {
    expect(DepartmentPublicSchema.parse(departmentBody).slug).toBe("matematicas");
    expect(
      DepartmentCreateSchema.parse({ school_id: schoolId, name: "Matemáticas" })
        .school_id
    ).toBe(schoolId);
    expect(
      DepartmentsPublicSchema.parse({ data: [], count: 0 }).count
    ).toBe(0);
  });

  it("parses teacher-profile payloads and link-user body", () => {
    expect(TeacherProfilePublicSchema.parse(profileBody).active).toBe(true);
    expect(
      TeacherProfileCreateSchema.parse({ display_name: "Ana" }).display_name
    ).toBe("Ana");
    expect(
      TeacherProfilesPublicSchema.parse({ data: [profileBody], count: 1 }).count
    ).toBe(1);
    expect(
      TeacherProfileLinkUserSchema.parse({ user_id: userId }).user_id
    ).toBe(userId);
    expect(() => TeacherProfileLinkUserSchema.parse({ user_id: "nope" })).toThrow();
  });

  it("schools and academic-year response shapes are strict", () => {
    expect(() =>
      SchoolsPublicSchema.parse({ data: [schoolBody], count: 1, extra: true })
    ).toThrow();
    expect(() =>
      AcademicYearsPublicSchema.parse({ data: [yearBody], count: 1, extra: true })
    ).toThrow();
  });
});

describe("process-scoped entity schemas (Phase 3 step 1)", () => {
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
    teaching_group_id: groupId,
    subject_id: subjectId,
    required_hours: 4,
    requirement_type: "ordinary",
    flags: null,
    notes: null,
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
    process_teacher_id: processTeacherId,
    assigned_hours: 4,
    assignment_type: "main",
    source: "department_head",
    status: "confirmed",
    chosen_by_user_id: userId,
    confirmed_by_user_id: userId,
    override_reason: null,
    overridden_by_user_id: null,
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

  it("parses subject payloads strictly and validates create/update", () => {
    expect(SubjectPublicSchema.parse(subjectBody).name).toBe("Mathematics");
    expect(() =>
      SubjectPublicSchema.parse({ ...subjectBody, extra: true })
    ).toThrow();
    expect(
      SubjectCreateSchema.parse({
        assignment_process_id: processId,
        name: "Maths"
      }).name
    ).toBe("Maths");
    expect(() => SubjectCreateSchema.parse({})).toThrow();
    expect(SubjectUpdateSchema.parse({}).notes).toBeUndefined();
    expect(SubjectUpdateSchema.parse({ notes: null }).notes).toBeNull();
    expect(() => SubjectUpdateSchema.parse({ name: "" })).toThrow();
    // The two-stage `stage` field is gone from the contract; sending it is a
    // bad payload, not a tolerated leftover.
    expect(() => SubjectUpdateSchema.parse({ stage: "ESO" })).toThrow();
    expect(() =>
      SubjectCreateSchema.parse({
        assignment_process_id: processId,
        name: "Maths",
        stage: "ESO"
      })
    ).toThrow();
    expect(SubjectsPublicSchema.parse({ data: [subjectBody], count: 1 }).count).toBe(1);
    expect(() =>
      SubjectsPublicSchema.parse({ data: [subjectBody], count: 1, extra: 1 })
    ).toThrow();
  });

  it("parses teaching-group payloads and validates create/update", () => {
    expect(TeachingGroupPublicSchema.parse(groupBody).label).toBe("1 ESO A");
    expect(() =>
      TeachingGroupPublicSchema.parse({ ...groupBody, extra: true })
    ).toThrow();
    expect(
      TeachingGroupCreateSchema.parse({
        assignment_process_id: processId,
        classroom_stage_id: stageId,
        grade: 1,
        group_code: "A",
        label: "1 ESO A"
      }).grade
    ).toBe(1);
    expect(() =>
      TeachingGroupCreateSchema.parse({
        assignment_process_id: processId,
        classroom_stage_id: stageId,
        grade: 0,
        group_code: "A",
        label: "1 ESO A"
      })
    ).toThrow();
    expect(TeachingGroupUpdateSchema.parse({ label: "Renamed" }).label).toBe(
      "Renamed"
    );
    expect(() => TeachingGroupUpdateSchema.parse({ group_code: "" })).toThrow();
    expect(
      TeachingGroupsPublicSchema.parse({ data: [], count: 0 }).count
    ).toBe(0);
  });

  it("parses hour-requirement payloads and validates create/update", () => {
    expect(HourRequirementPublicSchema.parse(requirementBody).required_hours).toBe(4);
    expect(() =>
      HourRequirementPublicSchema.parse({ ...requirementBody, extra: 1 })
    ).toThrow();
    expect(
      HourRequirementCreateSchema.parse({
        assignment_process_id: processId,
        teaching_group_id: groupId,
        subject_id: subjectId,
        required_hours: 3
      }).requirement_type
    ).toBeUndefined();
    expect(() =>
      HourRequirementCreateSchema.parse({
        assignment_process_id: processId,
        teaching_group_id: groupId,
        subject_id: subjectId,
        required_hours: 0
      })
    ).toThrow();
    expect(
      HourRequirementUpdateSchema.parse({ required_hours: 6, flags: "bilingual" })
        .flags
    ).toBe("bilingual");
    expect(() =>
      HourRequirementUpdateSchema.parse({ required_hours: -1 })
    ).toThrow();
    expect(
      HourRequirementsPublicSchema.parse({ data: [requirementBody], count: 1 })
        .count
    ).toBe(1);
  });

  it("parses process-teacher payloads and validates create/update", () => {
    expect(ProcessTeacherPublicSchema.parse(processTeacherBody).status).toBe(
      "active"
    );
    expect(() =>
      ProcessTeacherPublicSchema.parse({ ...processTeacherBody, extra: 1 })
    ).toThrow();
    expect(
      ProcessTeacherCreateSchema.parse({
        assignment_process_id: processId,
        teacher_profile_id: teacherProfileId,
        available_hours: 0
      }).available_hours
    ).toBe(0);
    expect(() =>
      ProcessTeacherCreateSchema.parse({
        assignment_process_id: processId,
        teacher_profile_id: teacherProfileId,
        available_hours: -1
      })
    ).toThrow();
    expect(
      ProcessTeacherUpdateSchema.parse({ status: "inactive" }).status
    ).toBe("inactive");
    expect(() =>
      ProcessTeacherUpdateSchema.parse({ status: "removed" })
    ).toThrow();
    expect(() =>
      ProcessTeacherUpdateSchema.parse({ notes: "Unsupported by the service model" })
    ).toThrow();
    expect(
      ProcessTeachersPublicSchema.parse({ data: [processTeacherBody], count: 1 })
        .count
    ).toBe(1);
  });

  it("parses assignment update schema and validates update shapes", () => {
    const parsed = AssignmentPublicSchema.parse(assignmentBody);
    expect(parsed.assignment_type).toBe("main");
    expect(() =>
      AssignmentPublicSchema.parse({ ...assignmentBody, surprise: 1 })
    ).toThrow();
    expect(
      AssignmentCreateSchema.parse({
        assignment_process_id: processId,
        hour_requirement_id: requirementId,
        process_teacher_id: processTeacherId,
        assigned_hours: 2
      }).assigned_hours
    ).toBe(2);
    expect(
      AssignmentUpdateSchema.parse({ assigned_hours: 5 }).assigned_hours
    ).toBe(5);
    expect(() =>
      AssignmentUpdateSchema.parse({ assigned_hours: 0 })
    ).toThrow();
    expect(() =>
      AssignmentUpdateSchema.parse({ status: "removed" })
    ).toThrow();
    expect(
      AssignmentDirectChoiceSchema.parse({
        meeting_session_id: groupId,
        hour_requirement_id: requirementId,
        assigned_hours: 1
      }).assigned_hours
    ).toBe(1);
  });

  it("parses audit-event payloads strictly and rejects drift", () => {
    expect(AuditEventPublicSchema.parse(auditBody).event_type).toBe(
      "assignment.created"
    );
    expect(() =>
      AuditEventPublicSchema.parse({ ...auditBody, secret: 1 })
    ).toThrow();
    expect(
      AuditEventPublicSchema.parse({
        ...auditBody,
        actor_user_id: null,
        entity_id: null,
        before_json: { prior: true },
        after_json: null
      }).actor_user_id
    ).toBeNull();
    expect(
      AuditEventsPublicSchema.parse({ data: [auditBody], count: 1 }).count
    ).toBe(1);
    expect(() =>
      AuditEventsPublicSchema.parse({ data: [], count: -1 })
    ).toThrow();
  });
});

describe("allocation revision schemas", () => {
  const revisionId = "88888888-8888-4888-8888-888888888888";
  const revisionBody = {
    id: revisionId,
    assignment_process_id: processId,
    revision_number: 2,
    allocated_group_weekly_hours: 120,
    reason: "Leadership raised the allocation",
    source: "manual_transcription",
    source_reference: "Email 2026-07-30",
    received_at: now,
    created_by_user_id: userId,
    superseded_at: null,
    created_at: now,
    updated_at: now
  };

  it("normalizes read hours to canonical strings and rejects drift", () => {
    const parsed = DepartmentHourAllocationRevisionPublicSchema.parse(revisionBody);
    expect(parsed.allocated_group_weekly_hours).toBe("120.00");
    expect(parsed.superseded_at).toBeNull();
    // The entity schema still serializes a JSON float today, so a binary
    // artifact must round rather than blank the view.
    expect(
      DepartmentHourAllocationRevisionPublicSchema.parse({
        ...revisionBody,
        allocated_group_weekly_hours: 119.99999999
      }).allocated_group_weekly_hours
    ).toBe("120.00");
    // …and once the NUMERIC(8, 2) sweep lands, the string form parses too.
    expect(
      DepartmentHourAllocationRevisionPublicSchema.parse({
        ...revisionBody,
        allocated_group_weekly_hours: "120.50"
      }).allocated_group_weekly_hours
    ).toBe("120.50");
    expect(
      DepartmentHourAllocationRevisionPublicSchema.parse({
        ...revisionBody,
        source: "file_import",
        source_reference: null,
        received_at: null,
        superseded_at: now
      }).source
    ).toBe("file_import");
    expect(() =>
      DepartmentHourAllocationRevisionPublicSchema.parse({
        ...revisionBody,
        surprise: 1
      })
    ).toThrow();
    expect(() =>
      DepartmentHourAllocationRevisionPublicSchema.parse({
        ...revisionBody,
        source: "leadership_meeting"
      })
    ).toThrow();
    expect(() =>
      DepartmentHourAllocationRevisionPublicSchema.parse({
        ...revisionBody,
        revision_number: 0
      })
    ).toThrow();
    expect(() =>
      DepartmentHourAllocationRevisionPublicSchema.parse({
        ...revisionBody,
        allocated_group_weekly_hours: -1
      })
    ).toThrow();
  });

  it("builds an audited create payload with canonical hours", () => {
    expect(
      DepartmentHourAllocationRevisionCreateSchema.parse({
        allocated_group_weekly_hours: 120,
        reason: "Initial allocation"
      })
    ).toEqual({
      allocated_group_weekly_hours: "120.00",
      reason: "Initial allocation"
    });
    expect(
      DepartmentHourAllocationRevisionCreateSchema.parse({
        allocated_group_weekly_hours: "120.5",
        reason: "Half hour added",
        source: "copied_draft",
        source_reference: null,
        received_at: null
      }).allocated_group_weekly_hours
    ).toBe("120.50");
    // Strict on the way out: a third decimal place is a bad payload, not
    // something to round silently.
    expect(() =>
      DepartmentHourAllocationRevisionCreateSchema.parse({
        allocated_group_weekly_hours: "120.005",
        reason: "Too precise"
      })
    ).toThrow();
    expect(() =>
      DepartmentHourAllocationRevisionCreateSchema.parse({
        allocated_group_weekly_hours: "not-a-number",
        reason: "Nonsense"
      })
    ).toThrow();
    // The backend requires a strictly positive allocation (plan §5.1).
    expect(() =>
      DepartmentHourAllocationRevisionCreateSchema.parse({
        allocated_group_weekly_hours: 0,
        reason: "Zero"
      })
    ).toThrow();
    expect(() =>
      DepartmentHourAllocationRevisionCreateSchema.parse({
        allocated_group_weekly_hours: -5,
        reason: "Negative"
      })
    ).toThrow();
    // The reason is mandatory: every allocation change is audited (plan §3.11).
    expect(() =>
      DepartmentHourAllocationRevisionCreateSchema.parse({
        allocated_group_weekly_hours: 120,
        reason: ""
      })
    ).toThrow();
    expect(() =>
      DepartmentHourAllocationRevisionCreateSchema.parse({
        allocated_group_weekly_hours: 120,
        reason: "x".repeat(501)
      })
    ).toThrow();
    // Server-owned fields are never sent.
    expect(() =>
      DepartmentHourAllocationRevisionCreateSchema.parse({
        allocated_group_weekly_hours: 120,
        reason: "Forged",
        revision_number: 9
      })
    ).toThrow();
  });

  it("parses the revision history wrapper", () => {
    expect(
      DepartmentHourAllocationRevisionsPublicSchema.parse({
        data: [revisionBody],
        count: 1
      }).count
    ).toBe(1);
    expect(
      DepartmentHourAllocationRevisionsPublicSchema.parse({ data: [], count: 0 })
        .data
    ).toEqual([]);
    expect(() =>
      DepartmentHourAllocationRevisionsPublicSchema.parse({
        data: [revisionBody],
        count: -1
      })
    ).toThrow();
  });

  it("freezes the allocation source enum", () => {
    expect(DepartmentHourAllocationSourceSchema.options).toEqual([
      "manual_transcription",
      "file_import",
      "copied_draft",
      "other"
    ]);
  });
});

describe("subject planning schemas", () => {
  const subjectId = "12121212-1212-4121-8121-121212121212";
  const subjectBody = {
    id: subjectId,
    assignment_process_id: processId,
    name: "Tutoring",
    allocation_category: "secondary",
    activity_type: "tutoring",
    default_group_weekly_hours: 1,
    default_teacher_weekly_hours_per_position: 2,
    default_required_teacher_count: 1,
    allows_multiple_groups: false,
    allows_zero_groups: true,
    notes: null,
    created_at: now,
    updated_at: now
  };

  it("freezes the classification enums", () => {
    expect(SubjectAllocationCategorySchema.options).toEqual([
      "main",
      "secondary"
    ]);
    expect(ActivityTypeSchema.options).toEqual([
      "ordinary",
      "tutoring",
      "co_teaching",
      "support",
      "department_level",
      "other"
    ]);
  });

  it("reads planning defaults tolerantly and keeps null distinct from zero", () => {
    const parsed = SubjectPublicSchema.parse(subjectBody);
    expect(parsed.default_group_weekly_hours).toBe("1.00");
    expect(parsed.default_teacher_weekly_hours_per_position).toBe("2.00");
    expect(parsed.allows_zero_groups).toBe(true);
    // A `null` default is "no suggestion", never `"0.00"`.
    expect(
      SubjectPublicSchema.parse({
        ...subjectBody,
        default_group_weekly_hours: null,
        default_teacher_weekly_hours_per_position: null
      }).default_group_weekly_hours
    ).toBeNull();
    // …and a typed zero stays a real zero.
    expect(
      SubjectPublicSchema.parse({
        ...subjectBody,
        default_group_weekly_hours: 0
      }).default_group_weekly_hours
    ).toBe("0.00");
    // Entity schemas still serialize a JSON float, so a binary artifact must
    // round rather than blank the view; the post-sweep string parses too.
    expect(
      SubjectPublicSchema.parse({
        ...subjectBody,
        default_group_weekly_hours: 2.9000000000000004
      }).default_group_weekly_hours
    ).toBe("2.90");
    expect(
      SubjectPublicSchema.parse({
        ...subjectBody,
        default_teacher_weekly_hours_per_position: "2.50"
      }).default_teacher_weekly_hours_per_position
    ).toBe("2.50");
    expect(() =>
      SubjectPublicSchema.parse({
        ...subjectBody,
        allocation_category: "tertiary"
      })
    ).toThrow();
    expect(() =>
      SubjectPublicSchema.parse({ ...subjectBody, activity_type: "detention" })
    ).toThrow();
    expect(() =>
      SubjectPublicSchema.parse({
        ...subjectBody,
        default_required_teacher_count: 0
      })
    ).toThrow();
    expect(() =>
      SubjectPublicSchema.parse({
        ...subjectBody,
        default_group_weekly_hours: -1
      })
    ).toThrow();
  });

  it("sends canonical hour defaults and omits what it does not set", () => {
    // Only the name is required; every classification and default has a
    // backend default, so an omitted field means "use it".
    expect(
      SubjectCreateSchema.parse({
        assignment_process_id: processId,
        name: "Maths"
      })
    ).toEqual({ assignment_process_id: processId, name: "Maths" });
    expect(
      SubjectCreateSchema.parse({
        assignment_process_id: processId,
        name: "Co-teaching",
        allocation_category: "secondary",
        activity_type: "co_teaching",
        default_group_weekly_hours: 2,
        default_teacher_weekly_hours_per_position: "2.5",
        default_required_teacher_count: 2,
        allows_multiple_groups: true,
        allows_zero_groups: false,
        notes: null
      })
    ).toEqual({
      assignment_process_id: processId,
      name: "Co-teaching",
      allocation_category: "secondary",
      activity_type: "co_teaching",
      default_group_weekly_hours: "2.00",
      default_teacher_weekly_hours_per_position: "2.50",
      default_required_teacher_count: 2,
      allows_multiple_groups: true,
      allows_zero_groups: false,
      notes: null
    });
    // `null` clears the suggestion; zero is a legitimate default value.
    expect(
      SubjectUpdateSchema.parse({ default_group_weekly_hours: null })
        .default_group_weekly_hours
    ).toBeNull();
    expect(
      SubjectUpdateSchema.parse({ default_group_weekly_hours: 0 })
        .default_group_weekly_hours
    ).toBe("0.00");
    // Strict on the way out: rounding a third decimal place silently would
    // send a value the user never typed.
    expect(() =>
      SubjectUpdateSchema.parse({ default_group_weekly_hours: "2.005" })
    ).toThrow();
    expect(() =>
      SubjectUpdateSchema.parse({ default_group_weekly_hours: "not-a-number" })
    ).toThrow();
    expect(() =>
      SubjectUpdateSchema.parse({ default_group_weekly_hours: -1 })
    ).toThrow();
    expect(() =>
      SubjectUpdateSchema.parse({ default_required_teacher_count: 0 })
    ).toThrow();
    // The count column is NOT NULL, so `null` is never a valid payload.
    expect(() =>
      SubjectUpdateSchema.parse({ default_required_teacher_count: null })
    ).toThrow();
  });
});

describe("group-subject schemas", () => {
  const groupSubjectId = "13131313-1313-4131-8131-131313131313";
  const teachingGroupId = "14141414-1414-4141-8141-141414141414";
  const subjectId = "15151515-1515-4151-8151-151515151515";
  const otherGroupId = "16161616-1616-4161-8161-161616161616";

  const cellBody = {
    id: groupSubjectId,
    assignment_process_id: processId,
    teaching_group_id: teachingGroupId,
    subject_id: subjectId,
    group_weekly_hours: 4,
    teacher_weekly_hours_per_position: 4,
    required_teacher_count: 1,
    active: true,
    notes: null,
    created_at: now,
    updated_at: now
  };

  it("parses a matrix cell and keeps 'inherit' distinct from zero", () => {
    const parsed = GroupSubjectPublicSchema.parse(cellBody);
    expect(parsed.group_weekly_hours).toBe("4.00");
    expect(parsed.active).toBe(true);
    // NULL means "inherit the subject default", not zero hours.
    expect(
      GroupSubjectPublicSchema.parse({
        ...cellBody,
        group_weekly_hours: null,
        teacher_weekly_hours_per_position: null
      })
    ).toMatchObject({
      group_weekly_hours: null,
      teacher_weekly_hours_per_position: null
    });
    expect(
      GroupSubjectPublicSchema.parse({ ...cellBody, group_weekly_hours: 0 })
        .group_weekly_hours
    ).toBe("0.00");
    expect(() =>
      GroupSubjectPublicSchema.parse({ ...cellBody, required_teacher_count: 0 })
    ).toThrow();
    expect(() =>
      GroupSubjectPublicSchema.parse({ ...cellBody, surprise: 1 })
    ).toThrow();
    expect(
      GroupSubjectsPublicSchema.parse({ data: [cellBody], count: 1 }).count
    ).toBe(1);
    expect(() =>
      GroupSubjectsPublicSchema.parse({ data: [cellBody], count: -1 })
    ).toThrow();
  });

  it("builds create and update payloads, with identity immutable on update", () => {
    expect(
      GroupSubjectCreateSchema.parse({
        assignment_process_id: processId,
        teaching_group_id: teachingGroupId,
        subject_id: subjectId
      })
    ).toEqual({
      assignment_process_id: processId,
      teaching_group_id: teachingGroupId,
      subject_id: subjectId
    });
    expect(
      GroupSubjectCreateSchema.parse({
        assignment_process_id: processId,
        teaching_group_id: teachingGroupId,
        subject_id: subjectId,
        group_weekly_hours: "3.5",
        teacher_weekly_hours_per_position: null,
        required_teacher_count: 2,
        active: false,
        notes: "Split group"
      })
    ).toEqual({
      assignment_process_id: processId,
      teaching_group_id: teachingGroupId,
      subject_id: subjectId,
      group_weekly_hours: "3.50",
      teacher_weekly_hours_per_position: null,
      required_teacher_count: 2,
      active: false,
      notes: "Split group"
    });
    expect(() =>
      GroupSubjectCreateSchema.parse({
        assignment_process_id: processId,
        teaching_group_id: teachingGroupId
      })
    ).toThrow();
    expect(GroupSubjectUpdateSchema.parse({}).active).toBeUndefined();
    expect(
      GroupSubjectUpdateSchema.parse({ group_weekly_hours: null })
        .group_weekly_hours
    ).toBeNull();
    // Re-pointing a cell at another group or subject is not an update: the
    // backend treats both as immutable identity.
    expect(() =>
      GroupSubjectUpdateSchema.parse({ teaching_group_id: otherGroupId })
    ).toThrow();
    expect(() =>
      GroupSubjectUpdateSchema.parse({ subject_id: subjectId })
    ).toThrow();
    expect(() =>
      GroupSubjectUpdateSchema.parse({ required_teacher_count: 0 })
    ).toThrow();
  });

  it("freezes the bulk mode enum", () => {
    expect(GroupSubjectBulkModeSchema.options).toEqual([
      "create_missing",
      "update_existing",
      "upsert"
    ]);
  });

  it("keeps bulk set values absent unless the caller set them", () => {
    // Absent ≠ null: an omitted field is not applied at all, while an explicit
    // null clears an hour override back to "inherit the subject default".
    expect(
      GroupSubjectBulkRequestSchema.parse({
        subject_id: subjectId,
        mode: "upsert"
      })
    ).toEqual({ subject_id: subjectId, mode: "upsert" });
    expect(
      GroupSubjectBulkRequestSchema.parse({
        subject_id: subjectId,
        mode: "update_existing",
        stage: "ESO",
        minimum_grade: 1,
        maximum_grade: 4,
        group_weekly_hours: null,
        teacher_weekly_hours_per_position: 3,
        required_teacher_count: 2
      })
    ).toEqual({
      subject_id: subjectId,
      mode: "update_existing",
      stage: "ESO",
      minimum_grade: 1,
      maximum_grade: 4,
      group_weekly_hours: null,
      teacher_weekly_hours_per_position: "3.00",
      required_teacher_count: 2
    });
    expect(() =>
      GroupSubjectBulkRequestSchema.parse({
        subject_id: subjectId,
        mode: "replace_all"
      })
    ).toThrow();
    expect(() =>
      GroupSubjectBulkRequestSchema.parse({ mode: "upsert" })
    ).toThrow();
    expect(() =>
      GroupSubjectBulkRequestSchema.parse({
        subject_id: subjectId,
        mode: "upsert",
        minimum_grade: 0
      })
    ).toThrow();
    // The count column is NOT NULL and the backend applies whatever is
    // present, so an explicit null must never leave the client.
    expect(() =>
      GroupSubjectBulkRequestSchema.parse({
        subject_id: subjectId,
        mode: "upsert",
        required_teacher_count: null
      })
    ).toThrow();
    expect(() =>
      GroupSubjectBulkRequestSchema.parse({
        subject_id: subjectId,
        mode: "upsert",
        expected_affected_count: 3
      })
    ).toThrow();
  });

  it("requires the previewed count on apply", () => {
    expect(
      GroupSubjectBulkApplyRequestSchema.parse({
        subject_id: subjectId,
        mode: "create_missing",
        expected_affected_count: 0
      }).expected_affected_count
    ).toBe(0);
    expect(() =>
      GroupSubjectBulkApplyRequestSchema.parse({
        subject_id: subjectId,
        mode: "create_missing"
      })
    ).toThrow();
    expect(() =>
      GroupSubjectBulkApplyRequestSchema.parse({
        subject_id: subjectId,
        mode: "create_missing",
        expected_affected_count: -1
      })
    ).toThrow();
  });

  it("parses the preview split, conflicts and apply result", () => {
    const toCreate = {
      teaching_group_id: teachingGroupId,
      group_subject_id: null,
      group_weekly_hours: 4,
      teacher_weekly_hours_per_position: null,
      required_teacher_count: 1
    };
    const toUpdate = {
      ...toCreate,
      teaching_group_id: otherGroupId,
      group_subject_id: groupSubjectId
    };

    const parsedChange = GroupSubjectBulkChangeSchema.parse(toCreate);
    // A row that does not exist yet has no id — that is what makes it a
    // create rather than an update.
    expect(parsedChange.group_subject_id).toBeNull();
    expect(parsedChange.group_weekly_hours).toBe("4.00");
    expect(parsedChange.teacher_weekly_hours_per_position).toBeNull();
    expect(() =>
      GroupSubjectBulkChangeSchema.parse({ ...toCreate, extra: 1 })
    ).toThrow();

    expect(
      GroupSubjectBulkConflictSchema.parse({
        teaching_group_id: teachingGroupId,
        reason: "No existing group-subject row to update."
      }).reason
    ).toContain("No existing");

    const preview = GroupSubjectBulkPreviewSchema.parse({
      mode: "upsert",
      subject_id: subjectId,
      matched_group_ids: [teachingGroupId, otherGroupId],
      to_create: [toCreate],
      to_update: [toUpdate],
      unchanged: [],
      conflicts: [
        {
          teaching_group_id: otherGroupId,
          reason: "No existing group-subject row to update."
        }
      ],
      validation_errors: [],
      expected_affected_count: 2
    });
    expect(preview.expected_affected_count).toBe(2);
    expect(preview.to_create).toHaveLength(1);
    expect(
      GroupSubjectBulkPreviewSchema.parse({
        mode: "update_existing",
        subject_id: subjectId,
        matched_group_ids: [],
        to_create: [],
        to_update: [],
        unchanged: [],
        conflicts: [],
        validation_errors: [
          "minimum_grade must be less than or equal to maximum_grade."
        ],
        expected_affected_count: 0
      }).validation_errors
    ).toHaveLength(1);
    expect(() =>
      GroupSubjectBulkPreviewSchema.parse({
        mode: "upsert",
        subject_id: subjectId,
        matched_group_ids: [],
        to_create: [],
        to_update: [],
        unchanged: [],
        conflicts: [],
        validation_errors: []
      })
    ).toThrow();

    expect(
      GroupSubjectBulkResultSchema.parse({
        created_count: 1,
        updated_count: 1,
        data: [cellBody],
        count: 1
      })
    ).toMatchObject({ created_count: 1, updated_count: 1, count: 1 });
    expect(() =>
      GroupSubjectBulkResultSchema.parse({
        created_count: -1,
        updated_count: 0,
        data: [],
        count: 0
      })
    ).toThrow();
  });
});

describe("teaching-plan and activity schemas", () => {
  const planId = "17171717-1717-4171-8171-171717171717";
  const activityId = "18181818-1818-4181-8181-181818181818";
  const subjectId = "19191919-1919-4191-8191-191919191919";
  const groupSubjectId = "20202020-2020-4020-8020-202020202020";
  const linkId = "21212121-2121-4121-8121-212121212121";
  const allocationRevisionId = "23232323-2323-4323-8323-232323232323";

  const planBody = {
    id: planId,
    assignment_process_id: processId,
    allocation_revision_id: allocationRevisionId,
    status: "balanced",
    current_generation_number: 2,
    locked_at: null,
    locked_by_user_id: null,
    requirements_generated_at: null,
    stale_reason: null,
    feasibility_status: "feasible",
    feasibility_generation: 2,
    feasibility_checked_at: now,
    feasibility_input_fingerprint: "abc123",
    feasibility_solver_version: "solver-v1",
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
    group_weekly_hours_per_group: 2.9000000000000004,
    teacher_weekly_hours_per_position: "2.50",
    required_teacher_count: 2,
    notes: "Two-teacher support",
    source: "secondary_manual",
    source_group_subject_id: null,
    sync_state: "in_sync",
    retired_at: null,
    group_subject_ids: [groupSubjectId],
    linked_group_count: 1,
    created_at: now,
    updated_at: now
  };

  it("freezes plan, feasibility, source and sync statuses", () => {
    expect(TeachingPlanStatusSchema.options).toEqual([
      "draft",
      "unbalanced",
      "balanced",
      "locked",
      "requirements_generated",
      "stale",
      "reconciliation_required"
    ]);
    expect(FeasibilityStatusSchema.options).toEqual([
      "not_evaluated",
      "feasible",
      "infeasible",
      "unknown"
    ]);
    expect(TeachingActivitySourceSchema.options).toEqual([
      "main_generated",
      "secondary_manual",
      "copied_from_previous_year",
      "imported"
    ]);
    expect(TeachingActivitySyncStateSchema.options).toEqual([
      "in_sync",
      "out_of_sync"
    ]);
  });

  it("parses the complete teaching plan and one-item wrapper", () => {
    expect(TeachingPlanPublicSchema.parse(planBody)).toMatchObject({
      status: "balanced",
      feasibility_status: "feasible",
      current_generation_number: 2
    });
    expect(
      TeachingPlansPublicSchema.parse({ data: [planBody], count: 1 }).count
    ).toBe(1);
    expect(() =>
      TeachingPlanPublicSchema.parse({ ...planBody, status: "ready" })
    ).toThrow();
    expect(() =>
      TeachingPlanPublicSchema.parse({
        ...planBody,
        current_generation_number: -1
      })
    ).toThrow();
    expect(() =>
      TeachingPlanPublicSchema.parse({ ...planBody, witness: "secret" })
    ).toThrow();
    expect(() =>
      TeachingPlansPublicSchema.parse({ data: [planBody], count: -1 })
    ).toThrow();
  });

  it("validates both independent planning balances and signed differences", () => {
    const group = {
      total_group_load: "120.00",
      allocated_group_weekly_hours: "124.00",
      allocation_difference: "-4.00",
      is_balanced: false
    };
    const teacher = {
      total_teacher_load: "124.00",
      participant_target_total: "124.00",
      teacher_load_difference: "0.00",
      is_balanced: true
    };
    expect(GroupBalanceSchema.parse(group).allocation_difference).toBe("-4.00");
    expect(TeacherLoadBalanceSchema.parse(teacher).total_teacher_load).toBe(
      "124.00"
    );
    expect(
      PlanBalanceSchema.parse({
        teaching_plan_id: planId,
        assignment_process_id: processId,
        group,
        teacher,
        is_exact: false
      }).group.total_group_load
    ).toBe("120.00");
    expect(
      GroupBalanceSchema.parse({
        total_group_load: "0.00",
        allocated_group_weekly_hours: null,
        allocation_difference: null,
        is_balanced: false
      }).allocated_group_weekly_hours
    ).toBeNull();
    expect(() =>
      GroupBalanceSchema.parse({ ...group, allocation_difference: "not-hours" })
    ).toThrow();
    expect(() =>
      TeacherLoadBalanceSchema.parse({
        ...teacher,
        participant_target_total: -1
      })
    ).toThrow();
  });

  it("parses structured planning validations", () => {
    const report = PlanValidationReportSchema.parse({
      teaching_plan_id: planId,
      assignment_process_id: processId,
      is_assignment_ready: false,
      blocking_count: 1,
      warning_count: 1,
      messages: [
        {
          severity: "blocking",
          code: "activity.missing_groups",
          message: "The activity requires at least one group.",
          entity_type: "teaching_activity",
          entity_id: activityId
        },
        {
          severity: "warning",
          code: "participant.extra_hours_authorized",
          message: "Extra hours are authorized.",
          entity_type: "process_teacher",
          entity_id: null
        }
      ]
    });
    expect(report.messages).toHaveLength(2);
    expect(report.messages[0]?.entity_id).toBe(activityId);
    expect(() =>
      PlanValidationReportSchema.parse({
        ...report,
        blocking_count: -1
      })
    ).toThrow();
    expect(() =>
      PlanValidationReportSchema.parse({
        ...report,
        messages: [{ ...report.messages[0], code: "" }]
      })
    ).toThrow();
  });

  it("reads every activity field and enforces linked-group integrity", () => {
    const parsed = TeachingActivityPublicSchema.parse(activityBody);
    expect(parsed.group_weekly_hours_per_group).toBe("2.90");
    expect(parsed.teacher_weekly_hours_per_position).toBe("2.50");
    expect(parsed.group_subject_ids).toEqual([groupSubjectId]);
    expect(
      TeachingActivitiesPublicSchema.parse({
        data: [activityBody],
        count: 1
      }).count
    ).toBe(1);
    expect(
      TeachingActivityGroupPublicSchema.parse({
        id: linkId,
        teaching_activity_id: activityId,
        group_subject_id: groupSubjectId
      }).group_subject_id
    ).toBe(groupSubjectId);
    expect(() =>
      TeachingActivityPublicSchema.parse({
        ...activityBody,
        linked_group_count: 2
      })
    ).toThrow();
    expect(() =>
      TeachingActivityPublicSchema.parse({
        ...activityBody,
        group_subject_ids: [groupSubjectId, groupSubjectId],
        linked_group_count: 2
      })
    ).toThrow();
    expect(() =>
      TeachingActivityPublicSchema.parse({
        ...activityBody,
        required_teacher_count: 0
      })
    ).toThrow();
    expect(() =>
      TeachingActivityPublicSchema.parse({ ...activityBody, extra: true })
    ).toThrow();
  });

  it("builds canonical manual create and partial update payloads", () => {
    expect(
      TeachingActivityCreateSchema.parse({
        subject_id: subjectId,
        group_weekly_hours_per_group: 3,
        teacher_weekly_hours_per_position: "2.5",
        required_teacher_count: 2,
        group_subject_ids: [groupSubjectId]
      })
    ).toEqual({
      subject_id: subjectId,
      group_weekly_hours_per_group: "3.00",
      teacher_weekly_hours_per_position: "2.50",
      required_teacher_count: 2,
      group_subject_ids: [groupSubjectId]
    });
    expect(
      TeachingActivityCreateSchema.parse({
        subject_id: subjectId,
        group_weekly_hours_per_group: 0,
        teacher_weekly_hours_per_position: 0
      })
    ).toMatchObject({
      group_weekly_hours_per_group: "0.00",
      teacher_weekly_hours_per_position: "0.00"
    });
    expect(
      TeachingActivityUpdateSchema.parse({
        notes: null,
        group_subject_ids: []
      })
    ).toEqual({ notes: null, group_subject_ids: [] });
    expect(() =>
      TeachingActivityCreateSchema.parse({
        subject_id: subjectId,
        group_weekly_hours_per_group: "1.005",
        teacher_weekly_hours_per_position: 1
      })
    ).toThrow();
    expect(() =>
      TeachingActivityCreateSchema.parse({
        subject_id: subjectId,
        group_weekly_hours_per_group: 1,
        teacher_weekly_hours_per_position: 1,
        source: "main_generated"
      })
    ).toThrow();
    expect(() =>
      TeachingActivityUpdateSchema.parse({ subject_id: subjectId })
    ).toThrow();
    expect(() =>
      TeachingActivityUpdateSchema.parse({
        group_subject_ids: [groupSubjectId, groupSubjectId]
      })
    ).toThrow();
  });

  it("validates idempotent main-materialization counts", () => {
    expect(
      MainMaterializationResultSchema.parse({
        created: [activityBody],
        created_count: 1,
        skipped_source_ids: [groupSubjectId],
        skipped_count: 1
      }).created_count
    ).toBe(1);
    expect(() =>
      MainMaterializationResultSchema.parse({
        created: [activityBody],
        created_count: 0,
        skipped_source_ids: [],
        skipped_count: 0
      })
    ).toThrow();
    expect(() =>
      MainMaterializationResultSchema.parse({
        created: [],
        created_count: 0,
        skipped_source_ids: [groupSubjectId],
        skipped_count: 0
      })
    ).toThrow();
  });
});
