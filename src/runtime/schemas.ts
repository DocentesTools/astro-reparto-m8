import { z } from "zod";

// Canonical decimal-hour schemas live with the arithmetic helpers they share a
// contract with (`./decimals.ts`) and are re-exported here so every contract
// schema stays reachable from the `./schemas` entry point.
export {
  CanonicalHoursSchema,
  CanonicalSignedHoursSchema,
  HoursSchema,
  SignedHoursSchema,
  type CanonicalHours,
  type CanonicalSignedHours,
  type Hours,
  type SignedHours
} from "./decimals.js";

export const AssignmentProcessStatusSchema = z.enum([
  "draft",
  "ready_for_meeting",
  "meeting_open",
  "assigning",
  "department_proposal",
  "sent_to_school_leadership",
  "returned_by_school_leadership",
  "internal_revision",
  "final",
  "reopened",
  "archived"
]);
export type AssignmentProcessStatus = z.infer<
  typeof AssignmentProcessStatusSchema
>;

export const SelectionOrderModeSchema = z.enum([
  "none",
  "informative",
  "strict"
]);
export type SelectionOrderMode = z.infer<typeof SelectionOrderModeSchema>;

export const MeetingSessionStatusSchema = z.enum([
  "prepared",
  "open",
  "selecting",
  "paused",
  "closed",
  "reopened"
]);
export type MeetingSessionStatus = z.infer<typeof MeetingSessionStatusSchema>;

export const SelectionTurnStatusSchema = z.enum([
  "pending",
  "active",
  "completed",
  "skipped",
  "overridden"
]);
export type SelectionTurnStatus = z.infer<typeof SelectionTurnStatusSchema>;

export const GlobalBalanceStateSchema = z.enum([
  "balanced",
  "pending",
  "exceeded",
  "warning"
]);
export type GlobalBalanceState = z.infer<typeof GlobalBalanceStateSchema>;

export const TeacherBalanceStateSchema = z.enum([
  "balanced",
  "pending",
  "overloaded",
  "inactive",
  "not_participating"
]);
export type TeacherBalanceState = z.infer<typeof TeacherBalanceStateSchema>;

export const ValidationSeveritySchema = z.enum([
  "info",
  "warning",
  "blocking"
]);
export type ValidationSeverity = z.infer<typeof ValidationSeveritySchema>;

export const RequirementTypeSchema = z.enum([
  "ordinary",
  "reinforcement",
  "split_group",
  "optional",
  "bilingual",
  "other"
]);
export type RequirementType = z.infer<typeof RequirementTypeSchema>;

export const ProcessTeacherStatusSchema = z.enum(["active", "inactive"]);
export type ProcessTeacherStatus = z.infer<typeof ProcessTeacherStatusSchema>;

export const AssignmentTypeSchema = z.enum([
  "main",
  "shared",
  "reinforcement",
  "split_group",
  "other"
]);
export type AssignmentType = z.infer<typeof AssignmentTypeSchema>;

export const AssignmentSourceSchema = z.enum([
  "department_head",
  "teacher_direct",
  "imported_from_previous_year",
  "system_copy"
]);
export type AssignmentSource = z.infer<typeof AssignmentSourceSchema>;

export const AssignmentStatusSchema = z.enum([
  "draft",
  "confirmed",
  "overridden",
  "cancelled"
]);
export type AssignmentStatus = z.infer<typeof AssignmentStatusSchema>;

const uuidSchema = z.uuid();
const dateTimeSchema = z.iso.datetime({
  offset: true,
  local: true,
});
const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be a YYYY-MM-DD string.");

export const AssignmentProcessPublicSchema = z
  .object({
    id: uuidSchema,
    academic_year_id: uuidSchema,
    school_id: uuidSchema,
    department_id: uuidSchema,
    status: AssignmentProcessStatusSchema,
    default_teacher_hours_reference: z.number().nonnegative().nullable(),
    selection_order_enabled: z.boolean(),
    selection_order_mode: SelectionOrderModeSchema,
    direct_teacher_selection_enabled: z.boolean(),
    lan_access_enabled: z.boolean(),
    created_from_process_id: uuidSchema.nullable(),
    closed_at: dateTimeSchema.nullable(),
    closed_by_user_id: uuidSchema.nullable(),
    created_by_user_id: uuidSchema,
    created_at: dateTimeSchema,
    updated_at: dateTimeSchema
  })
  .strict();
export type AssignmentProcessPublic = z.infer<
  typeof AssignmentProcessPublicSchema
>;

export const AssignmentProcessCreateSchema = z
  .object({
    academic_year_id: uuidSchema,
    school_id: uuidSchema,
    department_id: uuidSchema,
    status: AssignmentProcessStatusSchema.optional(),
    default_teacher_hours_reference: z.number().nonnegative().nullable().optional(),
    selection_order_enabled: z.boolean().optional(),
    selection_order_mode: SelectionOrderModeSchema.optional(),
    direct_teacher_selection_enabled: z.boolean().optional(),
    lan_access_enabled: z.boolean().optional(),
    created_from_process_id: uuidSchema.nullable().optional()
  })
  .strict();
export type AssignmentProcessCreate = z.infer<
  typeof AssignmentProcessCreateSchema
>;

export const AssignmentProcessUpdateSchema = z
  .object({
    status: AssignmentProcessStatusSchema.optional(),
    default_teacher_hours_reference: z.number().nonnegative().nullable().optional(),
    selection_order_enabled: z.boolean().optional(),
    selection_order_mode: SelectionOrderModeSchema.optional(),
    direct_teacher_selection_enabled: z.boolean().optional(),
    lan_access_enabled: z.boolean().optional()
  })
  .strict();
export type AssignmentProcessUpdate = z.infer<
  typeof AssignmentProcessUpdateSchema
>;

export const ProcessTransitionSchema = z
  .object({
    target_status: AssignmentProcessStatusSchema
  })
  .strict();
export type ProcessTransition = z.infer<typeof ProcessTransitionSchema>;

export const ProcessReopenSchema = z
  .object({
    reason: z.string().min(1).max(500)
  })
  .strict();
export type ProcessReopen = z.infer<typeof ProcessReopenSchema>;

export const AssignmentProcessesPublicSchema = z
  .object({
    data: z.array(AssignmentProcessPublicSchema),
    count: z.number().int().nonnegative()
  })
  .strict();
export type AssignmentProcessesPublic = z.infer<
  typeof AssignmentProcessesPublicSchema
>;

export const GlobalBalanceSchema = z
  .object({
    total_required_hours: z.number().nonnegative(),
    total_available_hours: z.number().nonnegative(),
    total_assigned_hours: z.number().nonnegative(),
    pending_required_hours: z.number(),
    availability_difference: z.number(),
    uncovered_requirements: z.number().int().nonnegative(),
    overloaded_teachers: z.number().int().nonnegative(),
    state: GlobalBalanceStateSchema
  })
  .strict();
export type GlobalBalance = z.infer<typeof GlobalBalanceSchema>;

export const TeacherBalanceSchema = z
  .object({
    process_teacher_id: uuidSchema,
    teacher_profile_id: uuidSchema,
    display_name: z.string(),
    available_hours: z.number().nonnegative(),
    assigned_hours: z.number().nonnegative(),
    remaining_hours: z.number(),
    excess_hours: z.number().nonnegative(),
    assignment_count: z.number().int().nonnegative(),
    has_override: z.boolean(),
    state: TeacherBalanceStateSchema
  })
  .strict();
export type TeacherBalance = z.infer<typeof TeacherBalanceSchema>;

export const RequirementBalanceSchema = z
  .object({
    hour_requirement_id: uuidSchema,
    teaching_group_id: uuidSchema,
    teaching_group_label: z.string(),
    subject_id: uuidSchema,
    subject_name: z.string(),
    required_hours: z.number().nonnegative(),
    assigned_hours: z.number().nonnegative(),
    pending_hours: z.number(),
    assignment_count: z.number().int().nonnegative(),
    has_override: z.boolean(),
    state: z.enum([
      "uncovered",
      "partial",
      "covered",
      "over_assigned",
      "explicitly_shared"
    ])
  })
  .strict();
export type RequirementBalance = z.infer<typeof RequirementBalanceSchema>;

export const ValidationMessageSchema = z
  .object({
    severity: ValidationSeveritySchema,
    code: z.string(),
    message: z.string(),
    entity_type: z.string(),
    entity_id: uuidSchema.nullable()
  })
  .strict();
export type ValidationMessage = z.infer<typeof ValidationMessageSchema>;

export const CurrentTurnSummarySchema = z
  .object({
    meeting_session_id: uuidSchema,
    selection_turn_id: uuidSchema,
    process_teacher_id: uuidSchema,
    position: z.number().int().nonnegative(),
    status: SelectionTurnStatusSchema,
    started_at: dateTimeSchema.nullable()
  })
  .strict();
export type CurrentTurnSummary = z.infer<typeof CurrentTurnSummarySchema>;

export const ProcessSummarySchema = z
  .object({
    process_id: uuidSchema,
    global_balance: GlobalBalanceSchema,
    validations: z.array(ValidationMessageSchema),
    current_turn: CurrentTurnSummarySchema.nullable(),
    blocking_validation_count: z.number().int().nonnegative()
  })
  .strict();
export type ProcessSummary = z.infer<typeof ProcessSummarySchema>;

export const ProcessDashboardSchema = z
  .object({
    process_id: uuidSchema,
    generated_at: dateTimeSchema,
    global_balance: GlobalBalanceSchema,
    teacher_balances: z.array(TeacherBalanceSchema),
    requirement_balances: z.array(RequirementBalanceSchema),
    validations: z.array(ValidationMessageSchema),
    current_turn: CurrentTurnSummarySchema.nullable(),
    blocking_validation_count: z.number().int().nonnegative()
  })
  .strict();
export type ProcessDashboard = z.infer<typeof ProcessDashboardSchema>;

export const TeacherLanSummarySchema = z
  .object({
    process_id: uuidSchema,
    teacher_profile_id: uuidSchema,
    process_teacher_id: uuidSchema,
    generated_at: dateTimeSchema,
    global_balance: GlobalBalanceSchema,
    teacher_balance: TeacherBalanceSchema,
    current_turn: CurrentTurnSummarySchema.nullable(),
    blocking_validation_count: z.number().int().nonnegative()
  })
  .strict();
export type TeacherLanSummary = z.infer<typeof TeacherLanSummarySchema>;

export const MeetingSessionPublicSchema = z
  .object({
    id: uuidSchema,
    assignment_process_id: uuidSchema,
    status: MeetingSessionStatusSchema,
    lan_access_enabled: z.boolean(),
    direct_teacher_selection_enabled: z.boolean(),
    selection_mode: SelectionOrderModeSchema,
    notes: z.string().nullable(),
    started_at: dateTimeSchema.nullable(),
    started_by_user_id: uuidSchema.nullable(),
    paused_at: dateTimeSchema.nullable(),
    closed_at: dateTimeSchema.nullable(),
    created_at: dateTimeSchema,
    updated_at: dateTimeSchema
  })
  .strict();
export type MeetingSessionPublic = z.infer<typeof MeetingSessionPublicSchema>;

export const MeetingSessionsPublicSchema = z
  .object({
    data: z.array(MeetingSessionPublicSchema),
    count: z.number().int().nonnegative()
  })
  .strict();
export type MeetingSessionsPublic = z.infer<
  typeof MeetingSessionsPublicSchema
>;

const MeetingSessionPayloadSchema = z
  .object({
    assignment_process_id: uuidSchema,
    status: MeetingSessionStatusSchema.optional(),
    lan_access_enabled: z.boolean().optional(),
    direct_teacher_selection_enabled: z.boolean().optional(),
    selection_mode: SelectionOrderModeSchema.optional(),
    notes: z.string().max(1000).nullable().optional()
  })
  .strict();

export const MeetingSessionCreateSchema = MeetingSessionPayloadSchema.refine(
  (value) =>
    !value.direct_teacher_selection_enabled || value.lan_access_enabled !== false,
  "Direct teacher selection requires LAN access."
);
export type MeetingSessionCreate = z.infer<typeof MeetingSessionCreateSchema>;

export const MeetingSessionUpdateSchema = MeetingSessionPayloadSchema.omit({
  assignment_process_id: true
})
  .partial()
  .refine(
    (value) =>
      !value.direct_teacher_selection_enabled ||
      value.lan_access_enabled !== false,
    "Direct teacher selection requires LAN access."
  );
export type MeetingSessionUpdate = z.infer<typeof MeetingSessionUpdateSchema>;

export const AssignmentCreateSchema = z
  .object({
    assignment_process_id: uuidSchema,
    hour_requirement_id: uuidSchema,
    process_teacher_id: uuidSchema,
    assigned_hours: z.number().positive(),
    assignment_type: AssignmentTypeSchema.optional(),
    source: AssignmentSourceSchema.optional(),
    status: AssignmentStatusSchema.optional(),
    chosen_by_user_id: uuidSchema.nullable().optional(),
    confirmed_by_user_id: uuidSchema.nullable().optional(),
    override_reason: z.string().max(500).nullable().optional(),
    overridden_by_user_id: uuidSchema.nullable().optional(),
    notes: z.string().nullable().optional()
  })
  .strict();
export type AssignmentCreate = z.infer<typeof AssignmentCreateSchema>;

export const AssignmentUpdateSchema = z
  .object({
    assigned_hours: z.number().positive().optional(),
    assignment_type: AssignmentTypeSchema.optional(),
    source: AssignmentSourceSchema.optional(),
    status: AssignmentStatusSchema.optional(),
    confirmed_by_user_id: uuidSchema.nullable().optional(),
    override_reason: z.string().max(500).nullable().optional(),
    overridden_by_user_id: uuidSchema.nullable().optional(),
    notes: z.string().nullable().optional()
  })
  .strict();
export type AssignmentUpdate = z.infer<typeof AssignmentUpdateSchema>;

export const AssignmentDirectChoiceSchema = z
  .object({
    meeting_session_id: uuidSchema,
    hour_requirement_id: uuidSchema,
    assigned_hours: z.number().positive(),
    assignment_type: AssignmentTypeSchema.optional(),
    notes: z.string().max(1000).nullable().optional()
  })
  .strict();
export type AssignmentDirectChoice = z.infer<
  typeof AssignmentDirectChoiceSchema
>;

export const AssignmentPublicSchema = AssignmentCreateSchema.extend({
  id: uuidSchema,
  created_at: dateTimeSchema,
  updated_at: dateTimeSchema
}).strict();
export type AssignmentPublic = z.infer<typeof AssignmentPublicSchema>;

export const AssignmentsPublicSchema = z
  .object({
    data: z.array(AssignmentPublicSchema),
    count: z.number().int().nonnegative()
  })
  .strict();
export type AssignmentsPublic = z.infer<typeof AssignmentsPublicSchema>;

export const SelectionTurnPublicSchema = z
  .object({
    id: uuidSchema,
    meeting_session_id: uuidSchema,
    process_teacher_id: uuidSchema,
    position: z.number().int().nonnegative(),
    status: SelectionTurnStatusSchema,
    skip_reason: z.string().nullable(),
    forced_by_user_id: uuidSchema.nullable(),
    notes: z.string().nullable(),
    started_at: dateTimeSchema.nullable(),
    completed_at: dateTimeSchema.nullable(),
    skipped_at: dateTimeSchema.nullable(),
    created_at: dateTimeSchema,
    updated_at: dateTimeSchema
  })
  .strict();
export type SelectionTurnPublic = z.infer<typeof SelectionTurnPublicSchema>;

export const SelectionTurnsPublicSchema = z
  .object({
    data: z.array(SelectionTurnPublicSchema),
    count: z.number().int().nonnegative()
  })
  .strict();
export type SelectionTurnsPublic = z.infer<typeof SelectionTurnsPublicSchema>;

export const SelectionTurnActionSchema = z
  .object({
    reason: z.string().min(1).max(500),
    notes: z.string().max(1000).nullable().optional()
  })
  .strict();
export type SelectionTurnAction = z.infer<typeof SelectionTurnActionSchema>;

export const SelectionTurnCompleteSchema = z
  .object({
    assignment: AssignmentCreateSchema.optional(),
    notes: z.string().max(1000).nullable().optional()
  })
  .strict();
export type SelectionTurnComplete = z.infer<typeof SelectionTurnCompleteSchema>;

export const ExportArtifactTypeSchema = z.enum([
  "internal_draft",
  "school_leadership",
  "final",
  "teacher_summary",
  "backup"
]);
export type ExportArtifactType = z.infer<typeof ExportArtifactTypeSchema>;

export const ExportArtifactFormatSchema = z.enum(["pdf", "csv", "json"]);
export type ExportArtifactFormat = z.infer<typeof ExportArtifactFormatSchema>;

export const ProcessVersionCreateSchema = z
  .object({
    reason: z.string().max(500).nullable().optional()
  })
  .strict();
export type ProcessVersionCreate = z.infer<typeof ProcessVersionCreateSchema>;

export const ProcessVersionPublicSchema = z
  .object({
    id: uuidSchema,
    assignment_process_id: uuidSchema,
    version_number: z.number().int().positive(),
    status: AssignmentProcessStatusSchema,
    reason: z.string().nullable(),
    created_by_user_id: uuidSchema,
    snapshot_json: z.record(z.string(), z.unknown()),
    created_at: dateTimeSchema,
    updated_at: dateTimeSchema
  })
  .strict();
export type ProcessVersionPublic = z.infer<typeof ProcessVersionPublicSchema>;

export const ProcessVersionsPublicSchema = z
  .object({
    data: z.array(ProcessVersionPublicSchema),
    count: z.number().int().nonnegative()
  })
  .strict();
export type ProcessVersionsPublic = z.infer<typeof ProcessVersionsPublicSchema>;

export const VersionComparisonSchema = z
  .object({
    left_version_id: uuidSchema,
    right_version_id: uuidSchema,
    changed_sections: z.array(z.string()),
    required_hours_delta: z.number(),
    assigned_hours_delta: z.number(),
    teacher_count_delta: z.number().int(),
    requirement_count_delta: z.number().int(),
    assignment_count_delta: z.number().int()
  })
  .strict();
export type VersionComparison = z.infer<typeof VersionComparisonSchema>;

export const ExportArtifactCreateSchema = z
  .object({
    export_type: ExportArtifactTypeSchema,
    format: ExportArtifactFormatSchema,
    process_version_id: uuidSchema.nullable().optional()
  })
  .strict();
export type ExportArtifactCreate = z.infer<typeof ExportArtifactCreateSchema>;

export const ExportBackupRestoreSchema = z
  .object({
    content: z.string().min(2),
    restore_assignments: z.boolean().optional()
  })
  .strict();
export type ExportBackupRestore = z.infer<typeof ExportBackupRestoreSchema>;

export const ExportArtifactPublicSchema = ExportArtifactCreateSchema.extend({
  id: uuidSchema,
  assignment_process_id: uuidSchema,
  process_version_id: uuidSchema.nullable(),
  file_path: z.string(),
  created_by_user_id: uuidSchema,
  checksum: z.string().length(64),
  content: z.string(),
  created_at: dateTimeSchema,
  updated_at: dateTimeSchema
}).strict();
export type ExportArtifactPublic = z.infer<typeof ExportArtifactPublicSchema>;

export const ExportArtifactsPublicSchema = z
  .object({
    data: z.array(ExportArtifactPublicSchema),
    count: z.number().int().nonnegative()
  })
  .strict();
export type ExportArtifactsPublic = z.infer<typeof ExportArtifactsPublicSchema>;

export const AcademicYearStatusSchema = z.enum(["active", "archived"]);
export type AcademicYearStatus = z.infer<typeof AcademicYearStatusSchema>;

export const SchoolPublicSchema = z
  .object({
    id: uuidSchema,
    name: z.string().min(1).max(200),
    locality: z.string().nullable(),
    province: z.string().nullable(),
    region: z.string().max(100),
    address: z.string().nullable(),
    notes: z.string().nullable(),
    created_at: dateTimeSchema,
    updated_at: dateTimeSchema
  })
  .strict();
export type SchoolPublic = z.infer<typeof SchoolPublicSchema>;

export const SchoolCreateSchema = z
  .object({
    name: z.string().min(1).max(200),
    locality: z.string().max(100).nullable().optional(),
    province: z.string().max(100).nullable().optional(),
    region: z.string().max(100).optional(),
    address: z.string().max(300).nullable().optional(),
    notes: z.string().nullable().optional()
  })
  .strict();
export type SchoolCreate = z.infer<typeof SchoolCreateSchema>;

export const SchoolUpdateSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    locality: z.string().max(100).nullable().optional(),
    province: z.string().max(100).nullable().optional(),
    region: z.string().max(100).nullable().optional(),
    address: z.string().max(300).nullable().optional(),
    notes: z.string().nullable().optional()
  })
  .strict();
export type SchoolUpdate = z.infer<typeof SchoolUpdateSchema>;

export const SchoolsPublicSchema = z
  .object({
    data: z.array(SchoolPublicSchema),
    count: z.number().int().nonnegative()
  })
  .strict();
export type SchoolsPublic = z.infer<typeof SchoolsPublicSchema>;

export const AcademicYearPublicSchema = z
  .object({
    id: uuidSchema,
    label: z.string().min(1).max(20),
    start_date: dateOnlySchema,
    end_date: dateOnlySchema,
    status: AcademicYearStatusSchema,
    previous_academic_year_id: uuidSchema.nullable(),
    school_id: uuidSchema.nullable(),
    created_by_user_id: uuidSchema,
    created_at: dateTimeSchema,
    updated_at: dateTimeSchema
  })
  .strict();
export type AcademicYearPublic = z.infer<typeof AcademicYearPublicSchema>;

export const AcademicYearCreateSchema = z
  .object({
    label: z.string().min(1).max(20),
    start_date: dateOnlySchema,
    end_date: dateOnlySchema,
    previous_academic_year_id: uuidSchema.nullable().optional(),
    school_id: uuidSchema.nullable().optional()
  })
  .strict()
  .refine(
    (value) => value.start_date <= value.end_date,
    "Start date must be on or before end date."
  );
export type AcademicYearCreate = z.infer<typeof AcademicYearCreateSchema>;

export const AcademicYearUpdateSchema = z
  .object({
    label: z.string().min(1).max(20).optional(),
    start_date: dateOnlySchema.optional(),
    end_date: dateOnlySchema.optional(),
    status: AcademicYearStatusSchema.optional(),
    previous_academic_year_id: uuidSchema.nullable().optional(),
    school_id: uuidSchema.nullable().optional()
  })
  .strict();
export type AcademicYearUpdate = z.infer<typeof AcademicYearUpdateSchema>;

export const AcademicYearsPublicSchema = z
  .object({
    data: z.array(AcademicYearPublicSchema),
    count: z.number().int().nonnegative()
  })
  .strict();
export type AcademicYearsPublic = z.infer<typeof AcademicYearsPublicSchema>;

export const DepartmentPublicSchema = z
  .object({
    id: uuidSchema,
    school_id: uuidSchema,
    name: z.string().min(1).max(150),
    slug: z.string(),
    department_head_user_id: uuidSchema.nullable(),
    notes: z.string().nullable(),
    created_at: dateTimeSchema,
    updated_at: dateTimeSchema
  })
  .strict();
export type DepartmentPublic = z.infer<typeof DepartmentPublicSchema>;

export const DepartmentCreateSchema = z
  .object({
    school_id: uuidSchema,
    name: z.string().min(1).max(150),
    slug: z.string().max(150).optional(),
    department_head_user_id: uuidSchema.nullable().optional(),
    notes: z.string().max(2000).nullable().optional()
  })
  .strict();
export type DepartmentCreate = z.infer<typeof DepartmentCreateSchema>;

export const DepartmentUpdateSchema = z
  .object({
    name: z.string().min(1).max(150).optional(),
    slug: z.string().max(150).optional(),
    department_head_user_id: uuidSchema.nullable().optional(),
    notes: z.string().max(2000).nullable().optional()
  })
  .strict();
export type DepartmentUpdate = z.infer<typeof DepartmentUpdateSchema>;

export const DepartmentsPublicSchema = z
  .object({
    data: z.array(DepartmentPublicSchema),
    count: z.number().int().nonnegative()
  })
  .strict();
export type DepartmentsPublic = z.infer<typeof DepartmentsPublicSchema>;

export const TeacherProfilePublicSchema = z
  .object({
    id: uuidSchema,
    display_name: z.string().min(1).max(150),
    user_id: uuidSchema.nullable(),
    active: z.boolean(),
    notes: z.string().nullable(),
    created_at: dateTimeSchema,
    updated_at: dateTimeSchema
  })
  .strict();
export type TeacherProfilePublic = z.infer<typeof TeacherProfilePublicSchema>;

export const TeacherProfileCreateSchema = z
  .object({
    display_name: z.string().min(1).max(150),
    user_id: uuidSchema.nullable().optional(),
    active: z.boolean().optional(),
    notes: z.string().max(2000).nullable().optional()
  })
  .strict();
export type TeacherProfileCreate = z.infer<typeof TeacherProfileCreateSchema>;

export const TeacherProfileUpdateSchema = z
  .object({
    display_name: z.string().min(1).max(150).optional(),
    user_id: uuidSchema.nullable().optional(),
    active: z.boolean().optional(),
    notes: z.string().max(2000).nullable().optional()
  })
  .strict();
export type TeacherProfileUpdate = z.infer<typeof TeacherProfileUpdateSchema>;

export const TeacherProfilesPublicSchema = z
  .object({
    data: z.array(TeacherProfilePublicSchema),
    count: z.number().int().nonnegative()
  })
  .strict();
export type TeacherProfilesPublic = z.infer<
  typeof TeacherProfilesPublicSchema
>;

export const TeacherProfileLinkUserSchema = z
  .object({
    user_id: uuidSchema
  })
  .strict();
export type TeacherProfileLinkUser = z.infer<
  typeof TeacherProfileLinkUserSchema
>;

export const SubjectPublicSchema = z
  .object({
    id: uuidSchema,
    assignment_process_id: uuidSchema,
    name: z.string().min(1).max(150),
    stage: z.string().max(50).nullable(),
    notes: z.string().nullable(),
    created_at: dateTimeSchema,
    updated_at: dateTimeSchema
  })
  .strict();
export type SubjectPublic = z.infer<typeof SubjectPublicSchema>;

export const SubjectCreateSchema = z
  .object({
    assignment_process_id: uuidSchema,
    name: z.string().min(1).max(150),
    stage: z.string().max(50).nullable().optional(),
    notes: z.string().max(2000).nullable().optional()
  })
  .strict();
export type SubjectCreate = z.infer<typeof SubjectCreateSchema>;
export type SubjectCreateInput = Omit<SubjectCreate, "assignment_process_id">;

export const SubjectUpdateSchema = z
  .object({
    name: z.string().min(1).max(150).optional(),
    stage: z.string().max(50).nullable().optional(),
    notes: z.string().max(2000).nullable().optional()
  })
  .strict();
export type SubjectUpdate = z.infer<typeof SubjectUpdateSchema>;

export const SubjectsPublicSchema = z
  .object({
    data: z.array(SubjectPublicSchema),
    count: z.number().int().nonnegative()
  })
  .strict();
export type SubjectsPublic = z.infer<typeof SubjectsPublicSchema>;

const ClassroomStageBaseSchema = z.object({
  id: uuidSchema,
  stage: z.string().min(1).max(100),
  min_grade: z.number().int().positive(),
  max_grade: z.number().int().positive(),
  label: z.string().min(1).max(30)
}).strict();
const validStageRange = (value: { min_grade: number; max_grade: number }) =>
  value.min_grade <= value.max_grade;
export const ClassroomStageSchema = ClassroomStageBaseSchema.refine(validStageRange, {
  message: "Minimum grade must not exceed maximum grade",
  path: ["max_grade"]
});
export const ClassroomStagePublicSchema = ClassroomStageBaseSchema.extend({
  created_at: dateTimeSchema,
  updated_at: dateTimeSchema
}).strict().refine(validStageRange, { message: "Minimum grade must not exceed maximum grade", path: ["max_grade"] });
export type ClassroomStagePublic = z.infer<typeof ClassroomStagePublicSchema>;
export const ClassroomStageCreateSchema = ClassroomStageBaseSchema.omit({ id: true }).refine(validStageRange, { message: "Minimum grade must not exceed maximum grade", path: ["max_grade"] });
export type ClassroomStageCreate = z.infer<typeof ClassroomStageCreateSchema>;
export const ClassroomStageUpdateSchema = ClassroomStageBaseSchema.omit({ id: true }).partial();
export type ClassroomStageUpdate = z.infer<typeof ClassroomStageUpdateSchema>;
export const ClassroomStagesPublicSchema = z.object({
  data: z.array(ClassroomStagePublicSchema), count: z.number().int().nonnegative()
}).strict();
export type ClassroomStagesPublic = z.infer<typeof ClassroomStagesPublicSchema>;

export const TeachingGroupPublicSchema = z
  .object({
    id: uuidSchema,
    assignment_process_id: uuidSchema,
    classroom_stage_id: uuidSchema,
    classroom_stage: ClassroomStageSchema,
    grade: z.number().int().positive(),
    group_code: z.string().min(1).max(10),
    label: z.string().min(1).max(100),
    notes: z.string().nullable(),
    created_at: dateTimeSchema,
    updated_at: dateTimeSchema
  })
  .strict();
export type TeachingGroupPublic = z.infer<typeof TeachingGroupPublicSchema>;

export const TeachingGroupCreateSchema = z
  .object({
    assignment_process_id: uuidSchema,
    classroom_stage_id: uuidSchema,
    grade: z.number().int().positive(),
    group_code: z.string().min(1).max(10),
    label: z.string().max(100).nullable().optional(),
    notes: z.string().max(2000).nullable().optional()
  })
  .strict();
export type TeachingGroupCreate = z.infer<typeof TeachingGroupCreateSchema>;
export type TeachingGroupCreateInput = Omit<
  TeachingGroupCreate,
  "assignment_process_id"
>;

export const TeachingGroupUpdateSchema = z
  .object({
    classroom_stage_id: uuidSchema.optional(),
    grade: z.number().int().positive().optional(),
    group_code: z.string().min(1).max(10).optional(),
    label: z.string().max(100).nullable().optional(),
    notes: z.string().max(2000).nullable().optional()
  })
  .strict();
export type TeachingGroupUpdate = z.infer<typeof TeachingGroupUpdateSchema>;

export const TeachingGroupsPublicSchema = z
  .object({
    data: z.array(TeachingGroupPublicSchema),
    count: z.number().int().nonnegative()
  })
  .strict();
export type TeachingGroupsPublic = z.infer<typeof TeachingGroupsPublicSchema>;

export const TeachingGroupBulkCreateSchema = z.object({
  classroom_stage_id: uuidSchema,
  grade: z.number().int().positive(),
  group_start: z.string().length(1).regex(/^[A-Za-z]$/),
  group_end: z.string().length(1).regex(/^[A-Za-z]$/)
}).strict();
export type TeachingGroupBulkCreate = z.infer<typeof TeachingGroupBulkCreateSchema>;

export const HourRequirementPublicSchema = z
  .object({
    id: uuidSchema,
    assignment_process_id: uuidSchema,
    teaching_group_id: uuidSchema,
    subject_id: uuidSchema,
    required_hours: z.number().positive(),
    requirement_type: RequirementTypeSchema,
    flags: z.string().nullable(),
    notes: z.string().nullable(),
    created_at: dateTimeSchema,
    updated_at: dateTimeSchema
  })
  .strict();
export type HourRequirementPublic = z.infer<typeof HourRequirementPublicSchema>;

export const HourRequirementCreateSchema = z
  .object({
    assignment_process_id: uuidSchema,
    teaching_group_id: uuidSchema,
    subject_id: uuidSchema,
    required_hours: z.number().positive(),
    requirement_type: RequirementTypeSchema.optional(),
    flags: z.string().max(500).nullable().optional(),
    notes: z.string().max(2000).nullable().optional()
  })
  .strict();
export type HourRequirementCreate = z.infer<
  typeof HourRequirementCreateSchema
>;
export type HourRequirementCreateInput = Omit<
  HourRequirementCreate,
  "assignment_process_id"
>;

export const HourRequirementUpdateSchema = z
  .object({
    required_hours: z.number().positive().optional(),
    requirement_type: RequirementTypeSchema.optional(),
    flags: z.string().max(500).nullable().optional(),
    notes: z.string().max(2000).nullable().optional()
  })
  .strict();
export type HourRequirementUpdate = z.infer<
  typeof HourRequirementUpdateSchema
>;

export const HourRequirementsPublicSchema = z
  .object({
    data: z.array(HourRequirementPublicSchema),
    count: z.number().int().nonnegative()
  })
  .strict();
export type HourRequirementsPublic = z.infer<
  typeof HourRequirementsPublicSchema
>;

export const ProcessTeacherPublicSchema = z
  .object({
    id: uuidSchema,
    assignment_process_id: uuidSchema,
    teacher_profile_id: uuidSchema,
    available_hours: z.number().nonnegative(),
    participates_in_selection: z.boolean(),
    selection_position: z.number().int().nonnegative().nullable(),
    selection_points: z.number().nonnegative().nullable(),
    selection_criteria_label: z.string().nullable(),
    selection_notes: z.string().nullable(),
    order_locked: z.boolean(),
    status: ProcessTeacherStatusSchema,
    created_at: dateTimeSchema,
    updated_at: dateTimeSchema
  })
  .strict();
export type ProcessTeacherPublic = z.infer<typeof ProcessTeacherPublicSchema>;

export const ProcessTeacherCreateSchema = z
  .object({
    assignment_process_id: uuidSchema,
    teacher_profile_id: uuidSchema,
    available_hours: z.number().nonnegative(),
    participates_in_selection: z.boolean().optional(),
    selection_position: z.number().int().nonnegative().nullable().optional(),
    selection_points: z.number().nonnegative().nullable().optional(),
    selection_criteria_label: z.string().max(150).nullable().optional(),
    selection_notes: z.string().max(2000).nullable().optional(),
    order_locked: z.boolean().optional(),
    status: ProcessTeacherStatusSchema.optional(),
  })
  .strict();
export type ProcessTeacherCreate = z.infer<typeof ProcessTeacherCreateSchema>;
export type ProcessTeacherCreateInput = Omit<
  ProcessTeacherCreate,
  "assignment_process_id"
>;

export const ProcessTeacherUpdateSchema = z
  .object({
    available_hours: z.number().nonnegative().optional(),
    participates_in_selection: z.boolean().optional(),
    selection_position: z.number().int().nonnegative().nullable().optional(),
    selection_points: z.number().nonnegative().nullable().optional(),
    selection_criteria_label: z.string().max(150).nullable().optional(),
    selection_notes: z.string().max(2000).nullable().optional(),
    order_locked: z.boolean().optional(),
    status: ProcessTeacherStatusSchema.optional(),
  })
  .strict();
export type ProcessTeacherUpdate = z.infer<typeof ProcessTeacherUpdateSchema>;

export const ProcessTeachersPublicSchema = z
  .object({
    data: z.array(ProcessTeacherPublicSchema),
    count: z.number().int().nonnegative()
  })
  .strict();
export type ProcessTeachersPublic = z.infer<
  typeof ProcessTeachersPublicSchema
>;

export const AuditEventPublicSchema = z
  .object({
    id: uuidSchema,
    assignment_process_id: uuidSchema,
    actor_user_id: uuidSchema.nullable(),
    actor_role: z.string().nullable(),
    event_type: z.string(),
    entity_type: z.string().nullable(),
    entity_id: uuidSchema.nullable(),
    before_json: z.unknown().nullable(),
    after_json: z.unknown().nullable(),
    reason: z.string().nullable(),
    created_at: dateTimeSchema,
    updated_at: dateTimeSchema
  })
  .strict();
export type AuditEventPublic = z.infer<typeof AuditEventPublicSchema>;

export const AuditEventsPublicSchema = z
  .object({
    data: z.array(AuditEventPublicSchema),
    count: z.number().int().nonnegative()
  })
  .strict();
export type AuditEventsPublic = z.infer<typeof AuditEventsPublicSchema>;
