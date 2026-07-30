import { z } from "zod";
import {
  HoursSchema,
  SignedHoursSchema,
  hoursToHundredths,
  hundredthsToHours
} from "./decimals.js";

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

/**
 * Whether a subject is a mandatory MAIN planning input or an optional
 * SECONDARY one (backend plan §3.5). An extensible enum, never a boolean
 * `is_main`.
 */
export const SubjectAllocationCategorySchema = z.enum(["main", "secondary"]);
export type SubjectAllocationCategory = z.infer<
  typeof SubjectAllocationCategorySchema
>;

/**
 * Descriptive teaching-activity category (backend plan §5.3, §5.6).
 *
 * Descriptive **only** (plan §20.17): no behaviour may branch on it. It drives
 * labels, filters, defaults and reports; the real behaviour comes from the hour,
 * count and linked-group fields.
 */
export const ActivityTypeSchema = z.enum([
  "ordinary",
  "tutoring",
  "co_teaching",
  "support",
  "department_level",
  "other"
]);
export type ActivityType = z.infer<typeof ActivityTypeSchema>;

const uuidSchema = z.uuid();
const dateTimeSchema = z.iso.datetime({
  offset: true,
  local: true,
});
const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be a YYYY-MM-DD string.");

/**
 * Build a schema for an hour value the UI *sends*, as opposed to one it reads.
 *
 * Strict on the way out (a third decimal place is rejected rather than rounded,
 * so a bad payload fails here instead of at the backend) and normalized to the
 * canonical `"120.00"` string of plan §3.9. A number is accepted too, which
 * keeps form code out of the representation question: the backend hour columns
 * are `float` today and `NUMERIC(8, 2)` after the §3.9 sweep, and a canonical
 * decimal string is exact for both.
 *
 * `minimum` mirrors the backend field constraint — `"positive"` for a `gt=0`
 * column such as an allocation, `"zero"` for the `ge=0` planning hours, where a
 * real zero is a legitimate value.
 */
function hoursRequestSchema(label: string, minimum: "zero" | "positive") {
  return z.union([z.string(), z.number()]).transform((value, ctx) => {
    let hundredths: number;
    try {
      hundredths = hoursToHundredths(value);
    } catch (error) {
      ctx.addIssue((error as Error).message);
      return z.NEVER;
    }
    const canonical = hundredthsToHours(hundredths);
    if (hundredths < 0 || (minimum === "positive" && hundredths === 0)) {
      ctx.addIssue(
        minimum === "positive"
          ? `${label} must be greater than zero: ${canonical}.`
          : `${label} must not be negative: ${canonical}.`
      );
      return z.NEVER;
    }
    return canonical;
  });
}

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

// ── Subjects (backend plan §5.3) ─────────────────────────────────────────────
//
// The two-stage `stage` column is gone. A subject now classifies itself
// (`allocation_category`, `activity_type`) and carries *suggested* planning
// defaults. The defaults only seed new rows: the actual per-group values live on
// `GroupSubject` and the actual planning values on `TeachingActivity`, and
// editing a default here never rewrites an already-materialized row (§20.14).

/** A suggested hour default: `null` means "no suggestion", not zero. */
const suggestedHoursRequestSchema = hoursRequestSchema("Hour default", "zero")
  .nullable()
  .optional();

export const SubjectPublicSchema = z
  .object({
    id: uuidSchema,
    assignment_process_id: uuidSchema,
    name: z.string().min(1).max(150),
    allocation_category: SubjectAllocationCategorySchema,
    activity_type: ActivityTypeSchema,
    // Tolerant on the way in: entity schemas still serialize a JSON number
    // until the backend `NUMERIC(8, 2)` sweep lands. `null` is "no default".
    default_group_weekly_hours: HoursSchema.nullable(),
    default_teacher_weekly_hours_per_position: HoursSchema.nullable(),
    default_required_teacher_count: z.number().int().positive(),
    allows_multiple_groups: z.boolean(),
    allows_zero_groups: z.boolean(),
    notes: z.string().nullable(),
    created_at: dateTimeSchema,
    updated_at: dateTimeSchema
  })
  .strict();
export type SubjectPublic = z.infer<typeof SubjectPublicSchema>;

/**
 * Create payload. Only `name` is required — every classification and planning
 * default has a backend default (`main` / `ordinary` / no hour suggestion /
 * one teacher position / neither group-count flag), so a field left out is a
 * deliberate "use the backend default" rather than a hole in the form.
 */
export const SubjectCreateSchema = z
  .object({
    assignment_process_id: uuidSchema,
    name: z.string().min(1).max(150),
    allocation_category: SubjectAllocationCategorySchema.optional(),
    activity_type: ActivityTypeSchema.optional(),
    default_group_weekly_hours: suggestedHoursRequestSchema,
    default_teacher_weekly_hours_per_position: suggestedHoursRequestSchema,
    default_required_teacher_count: z.number().int().positive().optional(),
    allows_multiple_groups: z.boolean().optional(),
    allows_zero_groups: z.boolean().optional(),
    notes: z.string().max(2000).nullable().optional()
  })
  .strict();
export type SubjectCreate = z.infer<typeof SubjectCreateSchema>;
export type SubjectCreateInput = Omit<
  z.input<typeof SubjectCreateSchema>,
  "assignment_process_id"
>;

/**
 * Partial update. `default_required_teacher_count` and the two group-link flags
 * are non-nullable columns, so they are optional but never `null`: the backend
 * applies whatever is present, and a `null` would violate the column.
 */
export const SubjectUpdateSchema = z
  .object({
    name: z.string().min(1).max(150).optional(),
    allocation_category: SubjectAllocationCategorySchema.optional(),
    activity_type: ActivityTypeSchema.optional(),
    default_group_weekly_hours: suggestedHoursRequestSchema,
    default_teacher_weekly_hours_per_position: suggestedHoursRequestSchema,
    default_required_teacher_count: z.number().int().positive().optional(),
    allows_multiple_groups: z.boolean().optional(),
    allows_zero_groups: z.boolean().optional(),
    notes: z.string().max(2000).nullable().optional()
  })
  .strict();
export type SubjectUpdate = z.infer<typeof SubjectUpdateSchema>;
export type SubjectUpdateInput = z.input<typeof SubjectUpdateSchema>;

export const SubjectsPublicSchema = z
  .object({
    data: z.array(SubjectPublicSchema),
    count: z.number().int().nonnegative()
  })
  .strict();
export type SubjectsPublic = z.infer<typeof SubjectsPublicSchema>;

// ── Group subjects (backend plan §5.5, §7.2) ─────────────────────────────────
//
// One cell of the intermediate group-subject matrix: "this subject applies to
// this group in this process, with these actual planning values". A `null` hour
// inherits the subject default (the backend stores `NULL`); a typed `0` is a
// real zero. No form may collapse the two — `parseHoursField` in `./decimals`
// exists for exactly that distinction.

/** Actual planning hours for one cell: `null` inherits the subject default. */
const cellHoursRequestSchema = hoursRequestSchema("Group-subject hours", "zero")
  .nullable()
  .optional();

export const GroupSubjectPublicSchema = z
  .object({
    id: uuidSchema,
    assignment_process_id: uuidSchema,
    teaching_group_id: uuidSchema,
    subject_id: uuidSchema,
    group_weekly_hours: HoursSchema.nullable(),
    teacher_weekly_hours_per_position: HoursSchema.nullable(),
    required_teacher_count: z.number().int().positive(),
    active: z.boolean(),
    notes: z.string().nullable(),
    created_at: dateTimeSchema,
    updated_at: dateTimeSchema
  })
  .strict();
export type GroupSubjectPublic = z.infer<typeof GroupSubjectPublicSchema>;

export const GroupSubjectCreateSchema = z
  .object({
    assignment_process_id: uuidSchema,
    teaching_group_id: uuidSchema,
    subject_id: uuidSchema,
    group_weekly_hours: cellHoursRequestSchema,
    teacher_weekly_hours_per_position: cellHoursRequestSchema,
    required_teacher_count: z.number().int().positive().optional(),
    active: z.boolean().optional(),
    notes: z.string().max(2000).nullable().optional()
  })
  .strict();
export type GroupSubjectCreate = z.infer<typeof GroupSubjectCreateSchema>;
export type GroupSubjectCreateInput = Omit<
  z.input<typeof GroupSubjectCreateSchema>,
  "assignment_process_id"
>;

/**
 * Partial update. `teaching_group_id` / `subject_id` are the immutable identity
 * of the cell and are rejected here by `.strict()`, matching the backend: a
 * mis-targeted cell is deleted and recreated, never re-pointed.
 */
export const GroupSubjectUpdateSchema = z
  .object({
    group_weekly_hours: cellHoursRequestSchema,
    teacher_weekly_hours_per_position: cellHoursRequestSchema,
    required_teacher_count: z.number().int().positive().optional(),
    active: z.boolean().optional(),
    notes: z.string().max(2000).nullable().optional()
  })
  .strict();
export type GroupSubjectUpdate = z.infer<typeof GroupSubjectUpdateSchema>;
export type GroupSubjectUpdateInput = z.input<typeof GroupSubjectUpdateSchema>;

export const GroupSubjectsPublicSchema = z
  .object({
    data: z.array(GroupSubjectPublicSchema),
    count: z.number().int().nonnegative()
  })
  .strict();
export type GroupSubjectsPublic = z.infer<typeof GroupSubjectsPublicSchema>;

/**
 * How a bulk operation treats a matched group that already has a cell.
 *
 * `create_missing` only inserts; `update_existing` only patches and reports a
 * matched group with no cell as a conflict; `upsert` does both.
 */
export const GroupSubjectBulkModeSchema = z.enum([
  "create_missing",
  "update_existing",
  "upsert"
]);
export type GroupSubjectBulkMode = z.infer<typeof GroupSubjectBulkModeSchema>;

const groupSubjectBulkRequestShape = {
  subject_id: uuidSchema,
  mode: GroupSubjectBulkModeSchema,
  // Selection filters over the process's teaching groups. All three are
  // optional; omitting every one targets every group in the process.
  stage: z.string().min(1).max(100).nullable().optional(),
  minimum_grade: z.number().int().positive().nullable().optional(),
  maximum_grade: z.number().int().positive().nullable().optional(),
  // Set values. The backend applies exactly the fields that are *present*
  // (`model_fields_set`): omitting one leaves an existing cell untouched and
  // lets a created cell fall back to its default, while an explicit `null`
  // clears an hour override back to "inherit the subject default".
  group_weekly_hours: cellHoursRequestSchema,
  teacher_weekly_hours_per_position: cellHoursRequestSchema,
  // Not nullable, unlike the hours: the column is `NOT NULL`, and the backend
  // would apply an explicit `null` verbatim. Omit it to keep the existing count.
  required_teacher_count: z.number().int().positive().optional()
} as const;

export const GroupSubjectBulkRequestSchema = z
  .object(groupSubjectBulkRequestShape)
  .strict();
export type GroupSubjectBulkRequest = z.infer<
  typeof GroupSubjectBulkRequestSchema
>;
export type GroupSubjectBulkRequestInput = z.input<
  typeof GroupSubjectBulkRequestSchema
>;

/**
 * Apply payload. `expected_affected_count` is the count the matching preview
 * returned: the backend recomputes the plan and answers **409** when it no
 * longer matches, so a selection that changed under the user cannot be applied
 * blindly (plan §7.2). Re-preview and re-confirm on that conflict.
 */
export const GroupSubjectBulkApplyRequestSchema = z
  .object({
    ...groupSubjectBulkRequestShape,
    expected_affected_count: z.number().int().nonnegative()
  })
  .strict();
export type GroupSubjectBulkApplyRequest = z.infer<
  typeof GroupSubjectBulkApplyRequestSchema
>;
export type GroupSubjectBulkApplyRequestInput = z.input<
  typeof GroupSubjectBulkApplyRequestSchema
>;

/**
 * One row of a preview, carrying the cell state *after* the operation.
 * `group_subject_id` is `null` for a row that does not exist yet.
 */
export const GroupSubjectBulkChangeSchema = z
  .object({
    teaching_group_id: uuidSchema,
    group_subject_id: uuidSchema.nullable(),
    group_weekly_hours: HoursSchema.nullable(),
    teacher_weekly_hours_per_position: HoursSchema.nullable(),
    required_teacher_count: z.number().int().positive()
  })
  .strict();
export type GroupSubjectBulkChange = z.infer<
  typeof GroupSubjectBulkChangeSchema
>;

/** A matched group the requested mode cannot satisfy, with the reason why. */
export const GroupSubjectBulkConflictSchema = z
  .object({
    teaching_group_id: uuidSchema,
    reason: z.string()
  })
  .strict();
export type GroupSubjectBulkConflict = z.infer<
  typeof GroupSubjectBulkConflictSchema
>;

/**
 * Dry run of a bulk operation. `validation_errors` are selection-level problems
 * (an inverted grade range) that block apply with a 400; `conflicts` are
 * per-group and do not block the rest of the selection.
 */
export const GroupSubjectBulkPreviewSchema = z
  .object({
    mode: GroupSubjectBulkModeSchema,
    subject_id: uuidSchema,
    matched_group_ids: z.array(uuidSchema),
    to_create: z.array(GroupSubjectBulkChangeSchema),
    to_update: z.array(GroupSubjectBulkChangeSchema),
    unchanged: z.array(GroupSubjectBulkChangeSchema),
    conflicts: z.array(GroupSubjectBulkConflictSchema),
    validation_errors: z.array(z.string()),
    // `to_create.length + to_update.length`; echoed back to apply.
    expected_affected_count: z.number().int().nonnegative()
  })
  .strict();
export type GroupSubjectBulkPreview = z.infer<
  typeof GroupSubjectBulkPreviewSchema
>;

/** Outcome of a committed bulk apply: one transaction, one audit event. */
export const GroupSubjectBulkResultSchema = z
  .object({
    created_count: z.number().int().nonnegative(),
    updated_count: z.number().int().nonnegative(),
    data: z.array(GroupSubjectPublicSchema),
    count: z.number().int().nonnegative()
  })
  .strict();
export type GroupSubjectBulkResult = z.infer<
  typeof GroupSubjectBulkResultSchema
>;

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

// ── Department hour allocation revisions (backend plan §5.1, §3.11, §7.1) ────
//
// School leadership communicates a weekly group-hour allocation to the
// department; that figure is never overwritten. Every value is an immutable
// revision, exactly one of which is current (`superseded_at === null`), and a
// new revision supersedes the previous one transactionally. There is
// deliberately no update or delete schema: the backend exposes list, current
// and create only.

/** How an allocation revision entered the system (backend plan §20.16). */
export const DepartmentHourAllocationSourceSchema = z.enum([
  "manual_transcription",
  "file_import",
  "copied_draft",
  "other"
]);
export type DepartmentHourAllocationSource = z.infer<
  typeof DepartmentHourAllocationSourceSchema
>;

const positiveHoursRequestSchema = hoursRequestSchema(
  "Allocated group weekly hours",
  "positive"
);

export const DepartmentHourAllocationRevisionPublicSchema = z
  .object({
    id: uuidSchema,
    assignment_process_id: uuidSchema,
    revision_number: z.number().int().positive(),
    // Tolerant on the way in: entity schemas still serialize a JSON number
    // until the backend's `NUMERIC(8, 2)` column sweep lands.
    allocated_group_weekly_hours: HoursSchema,
    reason: z.string(),
    source: DepartmentHourAllocationSourceSchema,
    source_reference: z.string().nullable(),
    received_at: dateTimeSchema.nullable(),
    created_by_user_id: uuidSchema,
    // NULL while this revision is the current one.
    superseded_at: dateTimeSchema.nullable(),
    created_at: dateTimeSchema,
    updated_at: dateTimeSchema
  })
  .strict();
export type DepartmentHourAllocationRevisionPublic = z.infer<
  typeof DepartmentHourAllocationRevisionPublicSchema
>;

/**
 * Create payload. `assignment_process_id`, `revision_number`,
 * `created_by_user_id` and `superseded_at` are server-owned and are never sent:
 * a client cannot forge a revision number or resurrect a superseded revision.
 * `reason` is mandatory — every allocation change is audited (plan §3.11).
 */
export const DepartmentHourAllocationRevisionCreateSchema = z
  .object({
    allocated_group_weekly_hours: positiveHoursRequestSchema,
    reason: z.string().min(1).max(500),
    source: DepartmentHourAllocationSourceSchema.optional(),
    source_reference: z.string().max(500).nullable().optional(),
    received_at: dateTimeSchema.nullable().optional()
  })
  .strict();
export type DepartmentHourAllocationRevisionCreate = z.infer<
  typeof DepartmentHourAllocationRevisionCreateSchema
>;
export type DepartmentHourAllocationRevisionCreateInput = z.input<
  typeof DepartmentHourAllocationRevisionCreateSchema
>;

export const DepartmentHourAllocationRevisionsPublicSchema = z
  .object({
    data: z.array(DepartmentHourAllocationRevisionPublicSchema),
    count: z.number().int().nonnegative()
  })
  .strict();
export type DepartmentHourAllocationRevisionsPublic = z.infer<
  typeof DepartmentHourAllocationRevisionsPublicSchema
>;

// ── Teaching plans and activities (backend plan §5.2, §5.6, §5.7, §7.3, §7.4) ──

/** Operational stage of the intermediate department teaching plan. */
export const TeachingPlanStatusSchema = z.enum([
  "draft",
  "unbalanced",
  "balanced",
  "locked",
  "requirements_generated",
  "stale",
  "reconciliation_required"
]);
export type TeachingPlanStatus = z.infer<typeof TeachingPlanStatusSchema>;

/** Assignment-partition feasibility, stored independently from plan status. */
export const FeasibilityStatusSchema = z.enum([
  "not_evaluated",
  "feasible",
  "infeasible",
  "unknown"
]);
export type FeasibilityStatus = z.infer<typeof FeasibilityStatusSchema>;

/** Origin of one concrete teaching-plan activity. */
export const TeachingActivitySourceSchema = z.enum([
  "main_generated",
  "secondary_manual",
  "copied_from_previous_year",
  "imported"
]);
export type TeachingActivitySource = z.infer<
  typeof TeachingActivitySourceSchema
>;

/** Whether a materialized main activity still matches its source matrix cell. */
export const TeachingActivitySyncStateSchema = z.enum([
  "in_sync",
  "out_of_sync"
]);
export type TeachingActivitySyncState = z.infer<
  typeof TeachingActivitySyncStateSchema
>;

export const TeachingPlanPublicSchema = z
  .object({
    id: uuidSchema,
    assignment_process_id: uuidSchema,
    allocation_revision_id: uuidSchema.nullable(),
    status: TeachingPlanStatusSchema,
    current_generation_number: z.number().int().nonnegative(),
    locked_at: dateTimeSchema.nullable(),
    locked_by_user_id: uuidSchema.nullable(),
    requirements_generated_at: dateTimeSchema.nullable(),
    stale_reason: z.string().max(500).nullable(),
    feasibility_status: FeasibilityStatusSchema,
    feasibility_generation: z.number().int().nonnegative().nullable(),
    feasibility_checked_at: dateTimeSchema.nullable(),
    feasibility_input_fingerprint: z.string().max(128).nullable(),
    feasibility_solver_version: z.string().max(64).nullable(),
    feasibility_diagnostics_ref: z.string().max(256).nullable(),
    created_at: dateTimeSchema,
    updated_at: dateTimeSchema
  })
  .strict();
export type TeachingPlanPublic = z.infer<typeof TeachingPlanPublicSchema>;

export const TeachingPlansPublicSchema = z
  .object({
    data: z.array(TeachingPlanPublicSchema),
    count: z.number().int().nonnegative()
  })
  .strict();
export type TeachingPlansPublic = z.infer<typeof TeachingPlansPublicSchema>;

/**
 * Group-hour planning balance. The allocation target and signed difference are
 * both absent until leadership has communicated an allocation.
 */
export const GroupBalanceSchema = z
  .object({
    total_group_load: HoursSchema,
    allocated_group_weekly_hours: HoursSchema.nullable(),
    allocation_difference: SignedHoursSchema.nullable(),
    is_balanced: z.boolean()
  })
  .strict();
export type GroupBalance = z.infer<typeof GroupBalanceSchema>;

/** Teacher workload generated by activities versus participant targets. */
export const TeacherLoadBalanceSchema = z
  .object({
    total_teacher_load: HoursSchema,
    participant_target_total: HoursSchema,
    teacher_load_difference: SignedHoursSchema,
    is_balanced: z.boolean()
  })
  .strict();
export type TeacherLoadBalance = z.infer<typeof TeacherLoadBalanceSchema>;

/** Both independent planning axes; they are never collapsed into one total. */
export const PlanBalanceSchema = z
  .object({
    teaching_plan_id: uuidSchema,
    assignment_process_id: uuidSchema,
    group: GroupBalanceSchema,
    teacher: TeacherLoadBalanceSchema,
    is_exact: z.boolean()
  })
  .strict();
export type PlanBalance = z.infer<typeof PlanBalanceSchema>;

/** One stable, entity-addressable planning validation finding. */
export const PlanValidationMessageSchema = z
  .object({
    severity: ValidationSeveritySchema,
    code: z.string().min(1).max(80),
    message: z.string().min(1),
    entity_type: z.string().min(1).max(50),
    entity_id: uuidSchema.nullable()
  })
  .strict();
export type PlanValidationMessage = z.infer<
  typeof PlanValidationMessageSchema
>;

export const PlanValidationReportSchema = z
  .object({
    teaching_plan_id: uuidSchema,
    assignment_process_id: uuidSchema,
    is_assignment_ready: z.boolean(),
    blocking_count: z.number().int().nonnegative(),
    warning_count: z.number().int().nonnegative(),
    messages: z.array(PlanValidationMessageSchema)
  })
  .strict();
export type PlanValidationReport = z.infer<
  typeof PlanValidationReportSchema
>;

// ── Requirement generation (backend plan §7.5, §20.8) ──────────────────────
//
// The package's legacy HourRequirementPublic contract is replaced by the
// dedicated generated-slot contract in the requirements-view adaptation. Keep
// this workflow schema self-contained until that breaking rewrite lands so the
// generation response is still fully validated instead of accepting unknown
// rows or reviving manual requirement writes.

export const RequirementGenerationSlotStatusSchema = z.enum([
  "available",
  "assigned",
  "stale",
  "reconciliation_required"
]);
export type RequirementGenerationSlotStatus = z.infer<
  typeof RequirementGenerationSlotStatusSchema
>;

export const RequirementGenerationSlotSchema = z
  .object({
    id: uuidSchema,
    assignment_process_id: uuidSchema,
    teaching_activity_id: uuidSchema,
    position_index: z.number().int().nonnegative(),
    required_teacher_hours: HoursSchema,
    status: RequirementGenerationSlotStatusSchema,
    created_generation: z.number().int().nonnegative(),
    last_validated_generation: z.number().int().nonnegative(),
    retired_generation: z.number().int().nonnegative().nullable(),
    superseded_by_requirement_id: uuidSchema.nullable(),
    created_at: dateTimeSchema,
    updated_at: dateTimeSchema
  })
  .strict();
export type RequirementGenerationSlot = z.infer<
  typeof RequirementGenerationSlotSchema
>;

export const RequirementSlotPlanSchema = z
  .object({
    teaching_activity_id: uuidSchema,
    position_index: z.number().int().nonnegative(),
    required_teacher_hours: HoursSchema
  })
  .strict();
export type RequirementSlotPlan = z.infer<typeof RequirementSlotPlanSchema>;

export const RequirementGenerationPreviewSchema = z
  .object({
    next_generation_number: z.number().int().positive(),
    to_create: z.array(RequirementSlotPlanSchema),
    create_count: z.number().int().nonnegative(),
    preserve_ids: z.array(uuidSchema),
    preserve_count: z.number().int().nonnegative(),
    retire_ids: z.array(uuidSchema),
    retire_count: z.number().int().nonnegative(),
    conflict_ids: z.array(uuidSchema),
    conflict_count: z.number().int().nonnegative(),
    requires_reconciliation: z.boolean(),
    is_noop: z.boolean()
  })
  .strict();
export type RequirementGenerationPreview = z.infer<
  typeof RequirementGenerationPreviewSchema
>;

export const RequirementGenerationResultSchema = z
  .object({
    generation_number: z.number().int().positive(),
    created: z.array(RequirementGenerationSlotSchema),
    created_count: z.number().int().nonnegative(),
    preserved_count: z.number().int().nonnegative(),
    retired_count: z.number().int().nonnegative(),
    data: z.array(RequirementGenerationSlotSchema),
    count: z.number().int().nonnegative()
  })
  .strict();
export type RequirementGenerationResult = z.infer<
  typeof RequirementGenerationResultSchema
>;

const activityHoursRequestSchema = hoursRequestSchema(
  "Teaching-activity hours",
  "zero"
);

const uniqueGroupSubjectIdsSchema = z
  .array(uuidSchema)
  .refine((ids) => new Set(ids).size === ids.length, {
    message: "An activity cannot link the same group-subject more than once."
  });

/** Public representation of one persisted activity-to-group-subject link. */
export const TeachingActivityGroupPublicSchema = z
  .object({
    id: uuidSchema,
    teaching_activity_id: uuidSchema,
    group_subject_id: uuidSchema
  })
  .strict();
export type TeachingActivityGroupPublic = z.infer<
  typeof TeachingActivityGroupPublicSchema
>;

export const TeachingActivityPublicSchema = z
  .object({
    id: uuidSchema,
    teaching_plan_id: uuidSchema,
    subject_id: uuidSchema,
    allocation_category: SubjectAllocationCategorySchema,
    activity_type: ActivityTypeSchema,
    // Activity entity columns are still JSON numbers until the backend decimal
    // sweep; normalize both current numbers and future strings on read.
    group_weekly_hours_per_group: HoursSchema,
    teacher_weekly_hours_per_position: HoursSchema,
    required_teacher_count: z.number().int().positive(),
    notes: z.string().nullable(),
    source: TeachingActivitySourceSchema,
    source_group_subject_id: uuidSchema.nullable(),
    sync_state: TeachingActivitySyncStateSchema,
    retired_at: dateTimeSchema.nullable(),
    group_subject_ids: uniqueGroupSubjectIdsSchema,
    linked_group_count: z.number().int().nonnegative(),
    created_at: dateTimeSchema,
    updated_at: dateTimeSchema
  })
  .strict()
  .refine(
    (activity) =>
      activity.linked_group_count === activity.group_subject_ids.length,
    {
      message: "Linked-group count must match group_subject_ids.",
      path: ["linked_group_count"]
    }
  );
export type TeachingActivityPublic = z.infer<
  typeof TeachingActivityPublicSchema
>;

/**
 * Manual activity payload. The public create endpoint accepts only
 * `secondary_manual`; main activities come from `materialize-main`.
 */
export const TeachingActivityCreateSchema = z
  .object({
    subject_id: uuidSchema,
    allocation_category: SubjectAllocationCategorySchema.optional(),
    activity_type: ActivityTypeSchema.optional(),
    group_weekly_hours_per_group: activityHoursRequestSchema,
    teacher_weekly_hours_per_position: activityHoursRequestSchema,
    required_teacher_count: z.number().int().positive().optional(),
    notes: z.string().nullable().optional(),
    source: z.literal("secondary_manual").optional(),
    group_subject_ids: uniqueGroupSubjectIdsSchema.optional()
  })
  .strict();
export type TeachingActivityCreate = z.infer<
  typeof TeachingActivityCreateSchema
>;
export type TeachingActivityCreateInput = z.input<
  typeof TeachingActivityCreateSchema
>;

/**
 * Partial activity update. Subject/source identity and materialization lineage
 * are intentionally absent and therefore rejected by `.strict()`.
 */
export const TeachingActivityUpdateSchema = z
  .object({
    allocation_category: SubjectAllocationCategorySchema.optional(),
    activity_type: ActivityTypeSchema.optional(),
    group_weekly_hours_per_group: activityHoursRequestSchema.optional(),
    teacher_weekly_hours_per_position: activityHoursRequestSchema.optional(),
    required_teacher_count: z.number().int().positive().optional(),
    notes: z.string().nullable().optional(),
    group_subject_ids: uniqueGroupSubjectIdsSchema.optional()
  })
  .strict();
export type TeachingActivityUpdate = z.infer<
  typeof TeachingActivityUpdateSchema
>;
export type TeachingActivityUpdateInput = z.input<
  typeof TeachingActivityUpdateSchema
>;

export const TeachingActivitiesPublicSchema = z
  .object({
    data: z.array(TeachingActivityPublicSchema),
    count: z.number().int().nonnegative()
  })
  .strict();
export type TeachingActivitiesPublic = z.infer<
  typeof TeachingActivitiesPublicSchema
>;

/** Idempotent result of materializing missing main-subject activities. */
export const MainMaterializationResultSchema = z
  .object({
    created: z.array(TeachingActivityPublicSchema),
    created_count: z.number().int().nonnegative(),
    skipped_source_ids: uniqueGroupSubjectIdsSchema,
    skipped_count: z.number().int().nonnegative()
  })
  .strict()
  .refine((result) => result.created_count === result.created.length, {
    message: "Created count must match created activities.",
    path: ["created_count"]
  })
  .refine(
    (result) => result.skipped_count === result.skipped_source_ids.length,
    {
      message: "Skipped count must match skipped source ids.",
      path: ["skipped_count"]
    }
  );
export type MainMaterializationResult = z.infer<
  typeof MainMaterializationResultSchema
>;
