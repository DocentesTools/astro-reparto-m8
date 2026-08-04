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
  AssignmentReassignSchema,
  AssignmentUndoSchema,
  AssignmentUpdateSchema,
  AssignmentValidationReportSchema,
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
  VersionComparisonSchema,
  FeasibilityDiagnosticCodeSchema,
  FeasibilityDiagnosticSchema,
  FeasibilityDiagnosticsReportSchema,
  FeasibilityEvaluationSchema,
  FeasibilityWitnessReportSchema,
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
  HourRequirementPublicSchema,
  HourRequirementsPublicSchema,
  MeetingSessionCreateSchema,
  MainMaterializationResultSchema,
  ParticipantBalanceSchema,
  PlanBalanceSchema,
  PlanValidationReportSchema,
  PlanningImportRequestSchema,
  PlanningImportResultSchema,
  ProcessDashboardSchema,
  ProcessSummarySchema,
  ProcessTeacherCreateSchema,
  ProcessTeacherExtraHoursSchema,
  ProcessTeacherPublicSchema,
  ProcessTeachersPublicSchema,
  ProcessTeacherUpdateSchema,
  RequirementGenerationPreviewSchema,
  RequirementGenerationResultSchema,
  RequirementGenerationSlotSchema,
  RequirementGenerationSlotStatusSchema,
  RequirementConflictResolutionSchema,
  RequirementReconcileRequestSchema,
  RequirementReconciliationPreviewSchema,
  RequirementReconciliationResultSchema,
  RequirementSlotPlanSchema,
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

describe("planning import schemas", () => {
  const processId = "11111111-1111-4111-8111-111111111111";
  const planId = "22222222-2222-4222-8222-222222222222";
  const subjectId = "33333333-3333-4333-8333-333333333333";

  it("applies import defaults while preserving canonical decimal strings", () => {
    expect(
      PlanningImportRequestSchema.parse({
        activities: [
          {
            subject_id: subjectId,
            group_weekly_hours_per_group: "2.50",
            teacher_weekly_hours_per_position: "3.00"
          }
        ]
      })
    ).toEqual({
      activities: [
        {
          subject_id: subjectId,
          allocation_category: "secondary",
          activity_type: "ordinary",
          group_weekly_hours_per_group: "2.50",
          teacher_weekly_hours_per_position: "3.00",
          required_teacher_count: 1,
          group_subject_ids: []
        }
      ]
    });
    expect(PlanningImportRequestSchema.parse({})).toEqual({ activities: [] });
    expect(() =>
      PlanningImportRequestSchema.parse({
        activities: [
          {
            subject_id: subjectId,
            group_weekly_hours_per_group: 2.5,
            teacher_weekly_hours_per_position: "3.00"
          }
        ]
      })
    ).toThrow();
  });

  it("validates the authoritative post-import balance and findings", () => {
    expect(
      PlanningImportResultSchema.parse({
        imported_count: 1,
        imported_activity_ids: [subjectId],
        balance: {
          teaching_plan_id: planId,
          assignment_process_id: processId,
          group: {
            total_group_load: "2.50",
            allocated_group_weekly_hours: "4.00",
            allocation_difference: "-1.50",
            is_balanced: false
          },
          teacher: {
            total_teacher_load: "3.00",
            participant_target_total: "4.00",
            teacher_load_difference: "-1.00",
            is_balanced: false
          },
          is_exact: false
        },
        validations: {
          teaching_plan_id: planId,
          assignment_process_id: processId,
          is_assignment_ready: false,
          blocking_count: 1,
          warning_count: 0,
          messages: [{ severity: "blocking", code: "plan.reconcile", message: "Reconcile the imported plan.", entity_type: "teaching_plan", entity_id: planId }]
        }
      }).validations.messages[0]?.code
    ).toBe("plan.reconcile");
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

const planBalance = {
  teaching_plan_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  assignment_process_id: processId,
  group: {
    total_group_load: "120.00",
    allocated_group_weekly_hours: "120.00",
    allocation_difference: "0.00",
    is_balanced: true
  },
  teacher: {
    total_teacher_load: "124.00",
    participant_target_total: "120.00",
    teacher_load_difference: "4.00",
    is_balanced: false
  },
  is_exact: false
};

const participantBalance = {
  process_teacher_id: teacherId,
  teacher_profile_id: "88888888-8888-4888-8888-888888888888",
  display_name: "Teacher",
  base_weekly_hours: "18.00",
  extra_weekly_hours: "2.00",
  target_weekly_hours: "20.00",
  assigned_weekly_hours: "4.00",
  remaining_weekly_hours: "16.00",
  is_overloaded: true,
  assignment_count: 1,
  state: "overloaded_authorized"
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

    const dashboard = ProcessDashboardSchema.parse({
      process_id: processId,
      generated_at: now,
      readiness: "recalculation_required",
      planning: {
        teaching_plan_id: planBalance.teaching_plan_id,
        status: "stale",
        balance: planBalance,
        validations: {
          teaching_plan_id: planBalance.teaching_plan_id,
          assignment_process_id: processId,
          is_assignment_ready: false,
          blocking_count: 1,
          warning_count: 0,
          messages: [
            {
              severity: "blocking",
              code: "plan.stale",
              message: "The plan changed after generation.",
              entity_type: "plan",
              entity_id: planBalance.teaching_plan_id
            }
          ]
        }
      },
      assignment: {
        summary: {
          assignment_process_id: processId,
          total_target_hours: "120.00",
          total_assigned_hours: "4.00",
          total_remaining_hours: "116.00",
          total_slots: 10,
          assigned_slots: 1,
          available_slots: 9,
          participants: [participantBalance]
        },
        validations: {
          assignment_process_id: processId,
          is_final_ready: false,
          blocking_count: 1,
          warning_count: 0,
          messages: [
            {
              severity: "blocking",
              code: "requirement.unassigned",
              message: "Nine positions are still unassigned.",
              entity_type: "assignment_process",
              entity_id: processId
            }
          ]
        }
      },
      current_turn: {
        meeting_session_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        selection_turn_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        process_teacher_id: teacherId,
        position: 0,
        status: "active",
        started_at: now
      },
      blocking_validation_count: 2
    });
    // Both stages are reported side by side and are never summed: §3.2's
    // co-teaching example is 120 group hours and 124 teacher-load hours with
    // both figures correct.
    expect(dashboard.planning.balance?.group.total_group_load).toBe("120.00");
    expect(dashboard.planning.balance?.teacher.total_teacher_load).toBe("124.00");
    expect(dashboard.assignment.summary.available_slots).toBe(9);
    expect(dashboard.blocking_validation_count).toBe(2);

    // A process still in setup has no plan at all, and the planning section says
    // so rather than reporting a balance of zero.
    expect(
      ProcessDashboardSchema.parse({
        process_id: processId,
        generated_at: now,
        readiness: "not_ready",
        planning: {
          teaching_plan_id: null,
          status: null,
          balance: null,
          validations: null
        },
        assignment: {
          summary: {
            assignment_process_id: processId,
            total_target_hours: "0.00",
            total_assigned_hours: "0.00",
            total_remaining_hours: "0.00",
            total_slots: 0,
            assigned_slots: 0,
            available_slots: 0,
            participants: []
          },
          validations: {
            assignment_process_id: processId,
            is_final_ready: false,
            blocking_count: 0,
            warning_count: 0,
            messages: []
          }
        },
        current_turn: null,
        blocking_validation_count: 0
      }).planning.status
    ).toBeNull();

    // The obsolete single-balance dashboard no longer parses at all. With
    // `.strict()` that is the point: a stale service fails loudly instead of
    // half-rendering a coverage bar for a contract that has none.
    expect(() =>
      ProcessDashboardSchema.parse({
        process_id: processId,
        generated_at: now,
        global_balance: {
          total_required_hours: 4,
          total_available_hours: 4,
          total_assigned_hours: 1,
          pending_required_hours: 3,
          availability_difference: 0,
          uncovered_requirements: 1,
          overloaded_teachers: 0,
          state: "pending"
        },
        teacher_balances: [],
        requirement_balances: [],
        validations: [],
        current_turn: null,
        blocking_validation_count: 0
      })
    ).toThrow();

    const summary = ProcessSummarySchema.parse({
      process_id: processId,
      generated_at: now,
      readiness: "ready",
      plan_status: "requirements_generated",
      plan_balance: planBalance,
      total_slots: 10,
      assigned_slots: 1,
      available_slots: 9,
      current_turn: null,
      blocking_validation_count: 0
    });
    // The summary names no teacher: the aggregate the shared screen projects is
    // aggregate at the endpoint, not by a redaction the client must remember.
    expect(JSON.stringify(summary)).not.toContain("display_name");
    expect(summary.available_slots).toBe(9);
    expect(() =>
      ProcessSummarySchema.parse({
        process_id: processId,
        generated_at: now,
        readiness: "ready",
        plan_status: null,
        plan_balance: null,
        total_slots: 0,
        assigned_slots: 0,
        available_slots: 0,
        current_turn: null,
        blocking_validation_count: 0,
        participants: []
      })
    ).toThrow();
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
        assigned_hours: 1
      })
    ).toThrow();

    // The LAN payload carries the caller's own participation and the aggregate
    // balance, and nothing that names another teacher.
    const lanSummary = TeacherLanSummarySchema.parse({
      process_id: processId,
      teacher_profile_id: participantBalance.teacher_profile_id,
      process_teacher_id: teacherId,
      generated_at: now,
      readiness: "ready",
      selection_blocked: false,
      plan_balance: null,
      participant: participantBalance,
      available_slots: 3,
      current_turn: null
    });
    expect(lanSummary.participant).toMatchObject({
      base_weekly_hours: "18.00",
      extra_weekly_hours: "2.00",
      target_weekly_hours: "20.00",
      assigned_weekly_hours: "4.00",
      remaining_weekly_hours: "16.00",
      is_overloaded: true,
      state: "overloaded_authorized"
    });
    expect(lanSummary.available_slots).toBe(3);
    // The obsolete single-balance payload no longer parses at all, which is the
    // point of `.strict()`: a stale service would fail loudly, not half-render.
    expect(() =>
      TeacherLanSummarySchema.parse({
        process_id: processId,
        teacher_profile_id: participantBalance.teacher_profile_id,
        process_teacher_id: teacherId,
        generated_at: now,
        global_balance: {},
        teacher_balance: {},
        current_turn: null,
        blocking_validation_count: 0
      })
    ).toThrow();
    // Readiness and the blocked flag are required: a client that could not read
    // them would have to guess whether selection is open.
    expect(() =>
      TeacherLanSummarySchema.parse({
        process_id: processId,
        teacher_profile_id: participantBalance.teacher_profile_id,
        process_teacher_id: teacherId,
        generated_at: now,
        plan_balance: null,
        participant: participantBalance,
        available_slots: 0,
        current_turn: null
      })
    ).toThrow();
    expect(
      ParticipantBalanceSchema.parse({
        ...participantBalance,
        remaining_weekly_hours: -2,
        state: "pending"
      }).remaining_weekly_hours
    ).toBe("-2.00");
    expect(() =>
      ParticipantBalanceSchema.parse({ ...participantBalance, state: "overloaded" })
    ).toThrow();

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

    // §10.3 comparison. The retired float pair (`required_hours_delta` /
    // `assigned_hours_delta`) described a single aggregate axis and a partial
    // assignment, neither of which exists; `.strict()` is what makes that a
    // parse failure rather than a silently ignored field.
    const comparisonBody = {
      left_version_id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
      right_version_id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
      changed_sections: ["teaching_plan", "teachers"],
      allocation_changed: true,
      group_hours_changed: false,
      teacher_load_changed: false,
      subject_category_changed: false,
      activity_added_or_removed: false,
      group_link_added_or_removed: false,
      teacher_position_count_changed: false,
      participant_target_changed: true,
      requirement_generation_changed: false,
      allocation_delta: "-4.00",
      group_load_delta: "0.00",
      teacher_load_delta: "0.00",
      participant_target_total_delta: "2.50",
      generation_number_delta: 0,
      teacher_count_delta: 1,
      activity_count_delta: 0,
      requirement_count_delta: 0
    };
    expect(VersionComparisonSchema.parse(comparisonBody)).toMatchObject({
      allocation_delta: "-4.00",
      participant_target_total_delta: "2.50"
    });
    // Absent is not zero: no allocation on one side is a null delta, and it
    // must survive the parse as null.
    expect(
      VersionComparisonSchema.parse({ ...comparisonBody, allocation_delta: null })
        .allocation_delta
    ).toBeNull();
    // A float artifact from the service is rounded to the canonical string
    // rather than breaking the whole comparison view.
    expect(
      VersionComparisonSchema.parse({
        ...comparisonBody,
        teacher_load_delta: -8.8e-16
      }).teacher_load_delta
    ).toBe("0.00");
    expect(() =>
      VersionComparisonSchema.parse({
        left_version_id: comparisonBody.left_version_id,
        right_version_id: comparisonBody.right_version_id,
        changed_sections: ["assignments"],
        required_hours_delta: 0,
        assigned_hours_delta: 4,
        teacher_count_delta: 0,
        requirement_count_delta: 0,
        assignment_count_delta: 1
      })
    ).toThrow();
    expect(() =>
      VersionComparisonSchema.parse({
        ...comparisonBody,
        generation_number_delta: 1.5
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
  const teachingActivityId = "45454545-4545-4545-8545-454545454545";
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
    base_weekly_hours: 18,
    extra_weekly_hours: 2,
    target_weekly_hours: 20,
    is_overloaded: true,
    extra_hours_reason: "Covering a vacancy",
    extra_hours_updated_by_user_id: userId,
    extra_hours_updated_at: now,
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

  it("parses generated, read-only requirement slots", () => {
    expect(
      HourRequirementPublicSchema.parse(requirementBody).required_teacher_hours
    ).toBe("4.00");
    expect(() =>
      HourRequirementPublicSchema.parse({ ...requirementBody, extra: 1 })
    ).toThrow();
    expect(() =>
      HourRequirementPublicSchema.parse({ ...requirementBody, position_index: -1 })
    ).toThrow();
    expect(() =>
      HourRequirementPublicSchema.parse({ ...requirementBody, status: "partial" })
    ).toThrow();
    expect(
      HourRequirementsPublicSchema.parse({ data: [requirementBody], count: 1 })
        .count
    ).toBe(1);
    expect(() =>
      HourRequirementsPublicSchema.parse({ data: [requirementBody], count: 2 })
    ).toThrow();
  });

  it("parses process-teacher payloads and validates create/update", () => {
    expect(ProcessTeacherPublicSchema.parse(processTeacherBody).status).toBe(
      "active"
    );
    expect(() =>
      ProcessTeacherPublicSchema.parse({ ...processTeacherBody, extra: 1 })
    ).toThrow();
    // The three-stage participant: a target built from base plus authorized
    // extra, both read as canonical hour strings, never a single capacity.
    expect(ProcessTeacherPublicSchema.parse(processTeacherBody)).toMatchObject({
      base_weekly_hours: "18.00",
      extra_weekly_hours: "2.00",
      target_weekly_hours: "20.00",
      is_overloaded: true
    });
    expect(() =>
      ProcessTeacherPublicSchema.parse({
        ...processTeacherBody,
        available_hours: 18
      })
    ).toThrow();
    expect(
      ProcessTeacherCreateSchema.parse({
        assignment_process_id: processId,
        teacher_profile_id: teacherProfileId,
        base_weekly_hours: 0
      }).base_weekly_hours
    ).toBe("0.00");
    expect(() =>
      ProcessTeacherCreateSchema.parse({
        assignment_process_id: processId,
        teacher_profile_id: teacherProfileId,
        base_weekly_hours: -1
      })
    ).toThrow();
    expect(
      ProcessTeacherUpdateSchema.parse({ status: "inactive" }).status
    ).toBe("inactive");
    expect(
      ProcessTeacherUpdateSchema.parse({ base_weekly_hours: "17.5" })
        .base_weekly_hours
    ).toBe("17.50");
    // Authorized overload never rides in on a generic PATCH: the field is not
    // in the schema, so the payload cannot be built at all (plan §3.8, §7.6).
    expect(() =>
      ProcessTeacherUpdateSchema.parse({ extra_weekly_hours: 2 })
    ).toThrow();
    expect(
      ProcessTeacherExtraHoursSchema.parse({
        extra_weekly_hours: 3,
        reason: "Covering a vacancy"
      })
    ).toEqual({ extra_weekly_hours: "3.00", reason: "Covering a vacancy" });
    // Withdrawing an authorization is the same action with zero, and it still
    // needs the reason.
    expect(
      ProcessTeacherExtraHoursSchema.parse({
        extra_weekly_hours: 0,
        reason: "Vacancy filled"
      }).extra_weekly_hours
    ).toBe("0.00");
    expect(() =>
      ProcessTeacherExtraHoursSchema.parse({ extra_weekly_hours: 3, reason: "" })
    ).toThrow();
    expect(() =>
      ProcessTeacherExtraHoursSchema.parse({ extra_weekly_hours: -1, reason: "x" })
    ).toThrow();
    expect(() =>
      ProcessTeacherExtraHoursSchema.parse({ extra_weekly_hours: "3.005", reason: "x" })
    ).toThrow();
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

  it("parses the complete-slot assignment family and rejects two-stage fields", () => {
    const parsed = AssignmentPublicSchema.parse(assignmentBody);
    expect(parsed.status).toBe("active");
    // Denormalised from the requirement by the service so the board can detect
    // a sibling position without a second lookup.
    expect(parsed.teaching_activity_id).toBe(teachingActivityId);
    expect(() =>
      AssignmentPublicSchema.parse({ ...assignmentBody, surprise: 1 })
    ).toThrow();
    expect(() =>
      AssignmentPublicSchema.parse({ ...assignmentBody, status: "confirmed" })
    ).toThrow();

    // Create carries the slot and the teacher, and nothing else: the hours are
    // the slot's own, and the activity is never trusted from the client.
    expect(
      AssignmentCreateSchema.parse({
        hour_requirement_id: requirementId,
        process_teacher_id: processTeacherId
      })
    ).toEqual({
      hour_requirement_id: requirementId,
      process_teacher_id: processTeacherId
    });
    for (const rejected of [
      { assigned_hours: 2 },
      { assignment_type: "shared" },
      { override_reason: "Head decision" },
      { teaching_activity_id: teachingActivityId },
      { assignment_process_id: processId }
    ]) {
      expect(() =>
        AssignmentCreateSchema.parse({
          hour_requirement_id: requirementId,
          process_teacher_id: processTeacherId,
          ...rejected
        })
      ).toThrow();
    }

    expect(AssignmentUpdateSchema.parse({ notes: "Agreed" }).notes).toBe(
      "Agreed"
    );
    expect(() => AssignmentUpdateSchema.parse({ assigned_hours: 5 })).toThrow();
    expect(() => AssignmentUpdateSchema.parse({ status: "cancelled" })).toThrow();

    expect(
      AssignmentDirectChoiceSchema.parse({
        meeting_session_id: groupId,
        hour_requirement_id: requirementId
      })
    ).toEqual({
      meeting_session_id: groupId,
      hour_requirement_id: requirementId
    });
    expect(() =>
      AssignmentDirectChoiceSchema.parse({
        meeting_session_id: groupId,
        hour_requirement_id: requirementId,
        assigned_hours: 1
      })
    ).toThrow();

    // Undo and reassignment are audited actions: a reasonless payload cannot
    // leave the client.
    expect(AssignmentUndoSchema.parse({ reason: "Wrong teacher" }).reason).toBe(
      "Wrong teacher"
    );
    expect(() => AssignmentUndoSchema.parse({ reason: "" })).toThrow();
    expect(() =>
      AssignmentUndoSchema.parse({ reason: "x".repeat(501) })
    ).toThrow();
    expect(
      AssignmentReassignSchema.parse({
        process_teacher_id: processTeacherId,
        reason: "Teacher unavailable"
      }).process_teacher_id
    ).toBe(processTeacherId);
    expect(() =>
      AssignmentReassignSchema.parse({ process_teacher_id: processTeacherId })
    ).toThrow();

    expect(
      AssignmentValidationReportSchema.parse({
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
      }).blocking_count
    ).toBe(1);
    expect(() =>
      AssignmentValidationReportSchema.parse({
        assignment_process_id: processId,
        is_final_ready: true,
        blocking_count: 0,
        warning_count: 0,
        messages: [],
        teaching_plan_id: processId
      })
    ).toThrow();
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

  it("validates feasibility evaluation and diagnostics payloads (§20.20)", () => {
    expect(FeasibilityDiagnosticCodeSchema.options).toEqual([
      "incompatible_residual_totals",
      "slot_exceeds_every_target",
      "distinct_teacher_shortfall",
      "unsatisfiable_targets",
      "instance_size_limit",
      "step_limit",
      "time_limit"
    ]);

    const diagnostic = {
      code: "distinct_teacher_shortfall",
      message: "An activity has too few distinct participants for its positions.",
      related_ids: [activityId]
    };
    expect(FeasibilityDiagnosticSchema.parse(diagnostic)).toMatchObject({
      code: "distinct_teacher_shortfall"
    });
    // The vocabulary is closed on purpose: a code the package does not know
    // fails loudly rather than half-rendering a finding the head will act on.
    expect(() =>
      FeasibilityDiagnosticSchema.parse({ ...diagnostic, code: "new_code" })
    ).toThrow();
    // And the witness never travels here — an unexpected field is rejected.
    expect(() =>
      FeasibilityDiagnosticSchema.parse({ ...diagnostic, witness: [] })
    ).toThrow();

    const reportBody = {
      teaching_plan_id: planId,
      assignment_process_id: processId,
      status: "infeasible",
      checked_at: now,
      diagnostics: [diagnostic]
    };
    expect(
      FeasibilityDiagnosticsReportSchema.parse(reportBody)
    ).toMatchObject({ status: "infeasible" });
    expect(() =>
      FeasibilityDiagnosticsReportSchema.parse({
        ...reportBody,
        status: "ready"
      })
    ).toThrow();

    const evaluationBody = {
      teaching_plan_id: planId,
      assignment_process_id: processId,
      status: "feasible",
      input_fingerprint: "fingerprint",
      solver_version: "bounded-dfs-v1",
      checked_at: now,
      cache_reused: true,
      witness_available: true,
      states_explored: 42,
      memoization_hits: 7
    };
    expect(FeasibilityEvaluationSchema.parse(evaluationBody)).toMatchObject({
      status: "feasible",
      witness_available: true
    });
    expect(() =>
      FeasibilityEvaluationSchema.parse({
        ...evaluationBody,
        states_explored: -1
      })
    ).toThrow();
    expect(() =>
      FeasibilityEvaluationSchema.parse({ ...evaluationBody, witness: [] })
    ).toThrow();

    const witnessBody = {
      teaching_plan_id: planId,
      assignment_process_id: processId,
      input_fingerprint: "fingerprint",
      solver_version: "bounded-dfs-v1",
      checked_at: now,
      witness: [
        {
          slot_id: requirementId,
          process_teacher_id: "25252525-2525-4525-8525-252525252525"
        }
      ]
    };
    expect(FeasibilityWitnessReportSchema.parse(witnessBody).witness).toHaveLength(
      1
    );
    expect(() =>
      FeasibilityWitnessReportSchema.parse({
        ...witnessBody,
        witness: [{ ...witnessBody.witness[0], participant_hours: "18.00" }]
      })
    ).toThrow();
  });

  it("validates requirement-generation previews and applied slot results", () => {
    const slot = {
      id: requirementId,
      assignment_process_id: processId,
      teaching_activity_id: activityId,
      position_index: 0,
      required_teacher_hours: 2.9000000000000004,
      status: "available",
      created_generation: 3,
      last_validated_generation: 3,
      retired_generation: null,
      superseded_by_requirement_id: null,
      created_at: now,
      updated_at: now
    };
    const planned = {
      teaching_activity_id: activityId,
      position_index: 1,
      required_teacher_hours: "2.50"
    };

    expect(RequirementGenerationSlotStatusSchema.options).toEqual([
      "available",
      "assigned",
      "stale",
      "reconciliation_required"
    ]);
    expect(
      RequirementGenerationSlotSchema.parse(slot).required_teacher_hours
    ).toBe("2.90");
    expect(
      RequirementSlotPlanSchema.parse(planned).required_teacher_hours
    ).toBe("2.50");

    const preview = RequirementGenerationPreviewSchema.parse({
      next_generation_number: 3,
      to_create: [planned],
      create_count: 1,
      preserve_ids: [requirementId],
      preserve_count: 1,
      retire_ids: [],
      retire_count: 0,
      conflict_ids: [],
      conflict_count: 0,
      requires_reconciliation: false,
      is_noop: false
    });
    expect(preview).toMatchObject({
      next_generation_number: 3,
      create_count: 1,
      preserve_count: 1
    });

    const result = RequirementGenerationResultSchema.parse({
      generation_number: 3,
      created: [slot],
      created_count: 1,
      preserved_count: 1,
      retired_count: 0,
      data: [slot],
      count: 1
    });
    expect(result.created[0]?.required_teacher_hours).toBe("2.90");
    expect(() =>
      RequirementGenerationPreviewSchema.parse({
        ...preview,
        conflict_count: -1
      })
    ).toThrow();
    expect(() =>
      RequirementGenerationResultSchema.parse({
        ...result,
        generation_number: 0
      })
    ).toThrow();
    expect(() =>
      RequirementGenerationSlotSchema.parse({ ...slot, private_witness: "x" })
    ).toThrow();
  });

  it("validates explicit reconciliation conflicts, confirmation and results", () => {
    const assignmentId = "24242424-2424-4424-8424-242424242424";
    const processTeacherId = "25252525-2525-4525-8525-252525252525";
    const replacementId = "26262626-2626-4626-8626-262626262626";
    const conflict = {
      requirement_id: requirementId,
      teaching_activity_id: activityId,
      position_index: 0,
      resolution: "value_changed",
      current_required_teacher_hours: 2.9000000000000004,
      new_required_teacher_hours: "3.00",
      assignment_id: assignmentId,
      process_teacher_id: processTeacherId,
      superseded_by_requirement_id: null
    };
    const slot = {
      id: replacementId,
      assignment_process_id: processId,
      teaching_activity_id: activityId,
      position_index: 0,
      required_teacher_hours: "3.00",
      status: "available",
      created_generation: 3,
      last_validated_generation: 3,
      retired_generation: null,
      superseded_by_requirement_id: null,
      created_at: now,
      updated_at: now
    };

    expect(RequirementConflictResolutionSchema.options).toEqual([
      "value_changed",
      "removed"
    ]);
    const preview = RequirementReconciliationPreviewSchema.parse({
      next_generation_number: 3,
      conflicts: [conflict],
      conflict_count: 1,
      create_count: 0,
      preserve_count: 4,
      retire_count: 0,
      requires_reconciliation: true,
      is_noop: false
    });
    expect(preview.conflicts[0]).toMatchObject({
      current_required_teacher_hours: "2.90",
      new_required_teacher_hours: "3.00"
    });
    expect(
      RequirementReconcileRequestSchema.parse({
        reason: "  Leadership changed the allocation.  ",
        expected_conflict_count: 1
      })
    ).toEqual({
      reason: "Leadership changed the allocation.",
      expected_conflict_count: 1
    });
    const result = RequirementReconciliationResultSchema.parse({
      generation_number: 3,
      resolved: [{ ...conflict, superseded_by_requirement_id: replacementId }],
      resolved_count: 1,
      released_assignment_ids: [assignmentId],
      created: [slot],
      created_count: 1,
      preserved_count: 4,
      retired_count: 0,
      data: [slot],
      count: 5
    });
    expect(result).toMatchObject({ resolved_count: 1, count: 5 });

    expect(() =>
      RequirementReconciliationPreviewSchema.parse({
        ...preview,
        conflict_count: 2
      })
    ).toThrow();
    expect(() =>
      RequirementReconcileRequestSchema.parse({
        reason: "   ",
        expected_conflict_count: 1
      })
    ).toThrow();
    expect(() =>
      RequirementReconciliationResultSchema.parse({
        ...result,
        released_assignment_ids: []
      })
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
