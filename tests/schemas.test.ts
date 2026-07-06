import { describe, expect, it } from "vitest";
import {
  AcademicYearCreateSchema,
  AcademicYearPublicSchema,
  AcademicYearsPublicSchema,
  AssignmentDirectChoiceSchema,
  AssignmentProcessCreateSchema,
  AssignmentProcessPublicSchema,
  DepartmentCreateSchema,
  DepartmentPublicSchema,
  DepartmentsPublicSchema,
  ExportArtifactPublicSchema,
  MeetingSessionCreateSchema,
  ProcessDashboardSchema,
  SchoolCreateSchema,
  SchoolPublicSchema,
  SchoolsPublicSchema,
  TeacherLanSummarySchema,
  TeacherProfileCreateSchema,
  TeacherProfileLinkUserSchema,
  TeacherProfilePublicSchema,
  TeacherProfilesPublicSchema
} from "../src/runtime/schemas.js";

const processId = "11111111-1111-4111-8111-111111111111";
const teacherId = "22222222-2222-4222-8222-222222222222";
const requirementId = "33333333-3333-4333-8333-333333333333";
const userId = "44444444-4444-4444-8444-444444444444";
const now = "2026-07-04T10:00:00Z";

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
            state: "pending"
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
