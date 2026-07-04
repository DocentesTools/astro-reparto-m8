import { z } from "zod";

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

const uuidSchema = z.string().uuid();
const dateTimeSchema = z.string().datetime({ offset: true });

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
    assignment_type: z
      .enum(["main", "shared", "reinforcement", "split_group", "other"])
      .optional(),
    source: z
      .enum([
        "department_head",
        "teacher_direct",
        "imported_from_previous_year",
        "system_copy"
      ])
      .optional(),
    status: z.enum(["draft", "confirmed", "overridden", "cancelled"]).optional(),
    chosen_by_user_id: uuidSchema.nullable().optional(),
    confirmed_by_user_id: uuidSchema.nullable().optional(),
    override_reason: z.string().max(500).nullable().optional(),
    overridden_by_user_id: uuidSchema.nullable().optional(),
    notes: z.string().nullable().optional()
  })
  .strict();
export type AssignmentCreate = z.infer<typeof AssignmentCreateSchema>;

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
