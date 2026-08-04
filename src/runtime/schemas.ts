import { z } from "zod";
import {
  CanonicalHoursSchema,
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

// `GlobalBalanceStateSchema` and `TeacherBalanceStateSchema` used to sit here.
// Both described the two-stage single balance — one `required vs available`
// axis with an `exceeded` state, and a per-teacher `overloaded` state that meant
// "assigned past capacity, possibly overridden". Neither concept survives §3.1
// (two independent balances) or §3.8 (an over-target assignment cannot happen,
// only authorized extra hours can). `ParticipantBalanceStateSchema` replaces the
// second; the first has no successor because a state is no longer a single axis.

/**
 * The coarse, role-safe projection of the teaching-plan status (backend plan
 * §20.25). Shared screens and teacher clients see this three-value axis instead
 * of the full plan lifecycle, which would leak planning detail to viewers who
 * must not act on it.
 */
export const PlanReadinessSchema = z.enum([
  "ready",
  "not_ready",
  "recalculation_required"
]);
export type PlanReadiness = z.infer<typeof PlanReadinessSchema>;

/** Viewer tier requested from the role-projected process event stream. */
export const SseAudienceSchema = z.enum([
  "department_head",
  "teacher",
  "shared_screen"
]);
export type SseAudience = z.infer<typeof SseAudienceSchema>;

/** Complete process-event vocabulary published by reparto-docente-m8. */
export const SseEventTypeSchema = z.enum([
  "stream.opened",
  "stream.gap",
  "allocation.revised",
  "teaching_plan.updated",
  "teaching_plan.balanced",
  "teaching_plan.locked",
  "teaching_plan.stale",
  // A bounded solve persisted a new feasibility result, or a planning input
  // dropped the stored one (backend plan §20.25). Both carry the department
  // head's status and provenance in the payload the head tier receives; the
  // teacher and shared-screen tiers see only the coarse readiness their
  // projection derives, which is why the payload is never read for a verdict.
  "teaching_plan.feasibility_updated",
  "teaching_plan.feasibility_invalidated",
  "requirements.generated",
  "requirements.reconciled",
  "requirements.reconciliation_required",
  "participant.extra_hours_updated"
]);
export type SseEventType = z.infer<typeof SseEventTypeSchema>;

export const ValidationSeveritySchema = z.enum([
  "info",
  "warning",
  "blocking"
]);
export type ValidationSeverity = z.infer<typeof ValidationSeveritySchema>;

export const ProcessTeacherStatusSchema = z.enum(["active", "inactive"]);
export type ProcessTeacherStatus = z.infer<typeof ProcessTeacherStatusSchema>;

export const AssignmentSourceSchema = z.enum([
  "department_head",
  "teacher_direct",
  "imported_from_previous_year",
  "system_copy"
]);
export type AssignmentSource = z.infer<typeof AssignmentSourceSchema>;

/**
 * Lifecycle of one slot occupancy (backend plan §5.10, §20.9).
 *
 * An assignment is one teacher holding one complete, indivisible slot: it is
 * either the live occupancy or a cancelled row kept for audit. The two-stage
 * `draft`/`confirmed`/`overridden` states modelled partial coverage and
 * over-assignment overrides, neither of which exists any more.
 */
export const AssignmentStatusSchema = z.enum(["active", "cancelled"]);
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

/** Full event shape available only to a department head. */
export const DepartmentHeadSseEventDataSchema = z
  .object({
    event_type: SseEventTypeSchema.exclude(["stream.gap"]),
    process_id: uuidSchema,
    sequence: z.number().int().nonnegative(),
    occurred_at: dateTimeSchema,
    readiness: PlanReadinessSchema,
    selection_blocked: z.boolean(),
    payload: z.record(z.string(), z.unknown()),
    subject_process_teacher_id: uuidSchema.nullable()
  })
  .strict();
export type DepartmentHeadSseEventData = z.infer<
  typeof DepartmentHeadSseEventDataSchema
>;

/** Teacher projection: only the viewer's own participant event carries a payload. */
export const TeacherSseEventDataSchema = z
  .object({
    event_type: SseEventTypeSchema.exclude(["stream.gap"]),
    process_id: uuidSchema,
    sequence: z.number().int().nonnegative(),
    occurred_at: dateTimeSchema,
    readiness: PlanReadinessSchema,
    selection_blocked: z.boolean(),
    process_teacher_id: uuidSchema.optional(),
    payload: z.record(z.string(), z.unknown()).optional()
  })
  .strict();
export type TeacherSseEventData = z.infer<typeof TeacherSseEventDataSchema>;

/** Identifier-free projection consumed by a room-facing shared screen. */
export const SharedScreenSseEventDataSchema = z
  .object({ readiness: PlanReadinessSchema })
  .strict();
export type SharedScreenSseEventData = z.infer<
  typeof SharedScreenSseEventDataSchema
>;

/** Control frame emitted when the server-side subscriber buffer overflowed. */
export const SseGapDataSchema = z
  .object({
    dropped: z.number().int().positive(),
    detail: z.string().min(1)
  })
  .strict();
export type SseGapData = z.infer<typeof SseGapDataSchema>;

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

// `GlobalBalanceSchema`, `TeacherBalanceSchema`, `RequirementBalanceSchema` and
// `ValidationMessageSchema` used to sit here. They were the single-balance
// payload family: one aggregate `required vs available vs assigned` axis, a
// per-requirement *partial coverage* row and a per-teacher *override* row. All
// three describe a contract that no longer exists (§3.6, §5.10) — a slot is
// indivisible, an assignment carries no hours of its own, and an over-target
// assignment is impossible rather than overridable.
//
// Their successors are `PlanBalance` (both independent axes),
// `ParticipantBalance` / `AssignmentSummary` (per-participant slot occupancy)
// and the two `PlanValidationMessage`-based reports, all declared with the
// planning schemas further down. `ProcessSummarySchema`, `ProcessDashboardSchema`
// and `TeacherLanSummarySchema` moved down with them for the same reason: a
// `z.object` literal evaluates its shape eagerly, so a payload embedding them
// cannot be declared before them.

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

/**
 * Department-head manual assignment payload (backend plan §7.7).
 *
 * The slot and the teacher, and nothing else. A slot is indivisible, so the
 * assignment always covers `required_teacher_hours` in full — there is no hour
 * input to send. The activity is derived from the requirement server-side and
 * is never trusted from the client, so it is deliberately absent here too;
 * `.strict()` turns an attempt to send one into a client-side parse failure.
 */
export const AssignmentCreateSchema = z
  .object({
    hour_requirement_id: uuidSchema,
    process_teacher_id: uuidSchema,
    notes: z.string().max(1000).nullable().optional()
  })
  .strict();
export type AssignmentCreate = z.infer<typeof AssignmentCreateSchema>;

/**
 * In-place edit of a live assignment. Only free-form notes remain editable:
 * cancelling and moving a slot are their own reason-required actions.
 */
export const AssignmentUpdateSchema = z
  .object({
    notes: z.string().max(1000).nullable().optional()
  })
  .strict();
export type AssignmentUpdate = z.infer<typeof AssignmentUpdateSchema>;

/** Teacher LAN direct choice: the meeting, the slot, and optional notes. */
export const AssignmentDirectChoiceSchema = z
  .object({
    meeting_session_id: uuidSchema,
    hour_requirement_id: uuidSchema,
    notes: z.string().max(1000).nullable().optional()
  })
  .strict();
export type AssignmentDirectChoice = z.infer<
  typeof AssignmentDirectChoiceSchema
>;

/**
 * Undo a live assignment (backend plan §20.13). The reason is mandatory: every
 * cancellation is audited, so the client cannot build a reasonless payload.
 */
export const AssignmentUndoSchema = z
  .object({
    reason: z.string().min(1).max(500)
  })
  .strict();
export type AssignmentUndo = z.infer<typeof AssignmentUndoSchema>;

/** Move one live slot to another participant, with a mandatory reason. */
export const AssignmentReassignSchema = z
  .object({
    process_teacher_id: uuidSchema,
    reason: z.string().min(1).max(500),
    notes: z.string().max(1000).nullable().optional()
  })
  .strict();
export type AssignmentReassign = z.infer<typeof AssignmentReassignSchema>;

/**
 * One slot occupancy as the service reports it. `teaching_activity_id` is the
 * requirement's own activity, denormalised by the backend so the
 * distinct-teacher rule is database-enforced; the UI reads it to group and to
 * detect a sibling position without a second lookup.
 */
export const AssignmentPublicSchema = z
  .object({
    id: uuidSchema,
    assignment_process_id: uuidSchema,
    hour_requirement_id: uuidSchema,
    teaching_activity_id: uuidSchema,
    process_teacher_id: uuidSchema,
    source: AssignmentSourceSchema,
    status: AssignmentStatusSchema,
    chosen_by_user_id: uuidSchema.nullable(),
    confirmed_by_user_id: uuidSchema.nullable(),
    notes: z.string().nullable(),
    created_at: dateTimeSchema,
    updated_at: dateTimeSchema
  })
  .strict();
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

/**
 * Snapshot sections the service diffs by name (backend `_COMPARED_SECTIONS`).
 *
 * Kept as a documented list rather than a closed enum: `changed_sections` stays
 * `string[]` so a section added to a later snapshot version still renders — as
 * its own raw code — instead of failing the whole comparison parse. The nine
 * §10.3 flags below are the contract the UI branches on; a section name is
 * reported, never interpreted.
 */
export const VERSION_COMPARISON_SECTIONS = [
  "allocation_revisions",
  "teaching_plan",
  "subjects",
  "group_subjects",
  "teaching_activities",
  "requirements",
  "teachers"
] as const;
export type VersionComparisonSection =
  (typeof VERSION_COMPARISON_SECTIONS)[number];

/**
 * The plan §10.3 diff between two three-stage snapshots.
 *
 * Nine change flags and eight signed deltas, all computed as `right − left` by
 * the service. Two rules the UI must not break:
 *
 * * a *flag* is a set/identity comparison and a *delta* is arithmetic on
 *   totals, so a dimension can be `changed` with a zero delta (one activity
 *   added and one removed) — the flag is the authority, never the delta;
 * * `allocation_delta` is `null` when either side has no current allocation.
 *   That is "not comparable", not "no change": absent is not zero (§3.9).
 *
 * Every hour delta is a canonical signed two-place string; nothing here is a
 * JSON number, which is why the retired float `*_hours_delta` pair is gone.
 */
export const VersionComparisonSchema = z
  .object({
    left_version_id: uuidSchema,
    right_version_id: uuidSchema,
    changed_sections: z.array(z.string()),
    allocation_changed: z.boolean(),
    group_hours_changed: z.boolean(),
    teacher_load_changed: z.boolean(),
    subject_category_changed: z.boolean(),
    activity_added_or_removed: z.boolean(),
    group_link_added_or_removed: z.boolean(),
    teacher_position_count_changed: z.boolean(),
    participant_target_changed: z.boolean(),
    requirement_generation_changed: z.boolean(),
    allocation_delta: SignedHoursSchema.nullable(),
    group_load_delta: SignedHoursSchema,
    teacher_load_delta: SignedHoursSchema,
    participant_target_total_delta: SignedHoursSchema,
    generation_number_delta: z.number().int(),
    teacher_count_delta: z.number().int(),
    activity_count_delta: z.number().int(),
    requirement_count_delta: z.number().int()
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

export const RequirementGenerationSlotStatusSchema = z.enum([
  "available",
  "assigned",
  "stale",
  "reconciliation_required"
]);
export type RequirementGenerationSlotStatus = z.infer<
  typeof RequirementGenerationSlotStatusSchema
>;

/**
 * One generated, indivisible teacher-position slot. Requirements are read-only:
 * their identity, hours and lifecycle are owned by generation/reconciliation.
 */
export const HourRequirementPublicSchema = z
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
export type HourRequirementPublic = z.infer<typeof HourRequirementPublicSchema>;

export const HourRequirementsPublicSchema = z
  .object({
    data: z.array(HourRequirementPublicSchema),
    count: z.number().int().nonnegative()
  })
  .strict()
  .refine((result) => result.count === result.data.length, {
    message: "Requirement count must match generated slots.",
    path: ["count"]
  });
export type HourRequirementsPublic = z.infer<
  typeof HourRequirementsPublicSchema
>;

// ── Process participants (backend plan §3.8, §5.8, §7.6) ────────────────────
//
// A participant no longer has an *available capacity* to fill up to. They have
// an exact **target**, `base_weekly_hours + extra_weekly_hours`, which the sum
// of their slots must equal before final close. `target_weekly_hours` and
// `is_overloaded` are computed by the backend and serialized on the public
// schema, so they are read here and never recomputed from the two parts: the
// service is the authority on its own arithmetic.
//
// `extra_weekly_hours` is department-head *authorized overload*, not a
// tolerance for over-assignment: there is no override left anywhere in the
// contract (§3.8). Every change to it carries a reason and an audit event,
// which is why it is absent from the update schema below and reachable only
// through {@link ProcessTeacherExtraHoursSchema}.

/** Participant hours the UI sends; `ge=0` columns, so a real zero is legal. */
const participantHoursRequestSchema = hoursRequestSchema(
  "Participant hours",
  "zero"
);

export const ProcessTeacherPublicSchema = z
  .object({
    id: uuidSchema,
    assignment_process_id: uuidSchema,
    teacher_profile_id: uuidSchema,
    base_weekly_hours: HoursSchema,
    extra_weekly_hours: HoursSchema,
    target_weekly_hours: HoursSchema,
    is_overloaded: z.boolean(),
    extra_hours_reason: z.string().nullable(),
    extra_hours_updated_by_user_id: uuidSchema.nullable(),
    extra_hours_updated_at: dateTimeSchema.nullable(),
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

/**
 * `extra_weekly_hours` is accepted here because the backend accepts it here:
 * `ProcessTeacherCreate` carries the whole base field set. The default UI does
 * not offer it, so a participant is created at their contractual base and any
 * overload is authorized afterwards with a reason — but a host that has its own
 * import path can still express what the service accepts.
 */
export const ProcessTeacherCreateSchema = z
  .object({
    assignment_process_id: uuidSchema,
    teacher_profile_id: uuidSchema,
    base_weekly_hours: participantHoursRequestSchema,
    extra_weekly_hours: participantHoursRequestSchema.optional(),
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
  z.input<typeof ProcessTeacherCreateSchema>,
  "assignment_process_id"
>;

/**
 * `extra_weekly_hours` is deliberately absent, mirroring the backend schema:
 * authorized overload changes only through the audited `/extra-hours` action,
 * so a generic `PATCH` can never bypass the mandatory reason. With `.strict()`
 * the payload cannot even be built here.
 */
export const ProcessTeacherUpdateSchema = z
  .object({
    base_weekly_hours: participantHoursRequestSchema.optional(),
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
export type ProcessTeacherUpdateInput = z.input<
  typeof ProcessTeacherUpdateSchema
>;

/** The audited authorized-overload action (backend plan §3.8, §7.6). */
export const ProcessTeacherExtraHoursSchema = z
  .object({
    extra_weekly_hours: participantHoursRequestSchema,
    reason: z.string().min(1).max(500)
  })
  .strict();
export type ProcessTeacherExtraHours = z.infer<
  typeof ProcessTeacherExtraHoursSchema
>;
export type ProcessTeacherExtraHoursInput = z.input<
  typeof ProcessTeacherExtraHoursSchema
>;

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

/**
 * Per-participant assignment state (backend plan §6.2).
 *
 * `overloaded_authorized` replaces the old `overloaded`, and the difference is
 * the whole point of §3.8: it means `extra_weekly_hours > 0` — hours a
 * department head authorized *in advance* — and never "assigned beyond the
 * target", which the contract no longer allows to happen.
 */
export const ParticipantBalanceStateSchema = z.enum([
  "pending",
  "balanced",
  "overloaded_authorized",
  "inactive",
  "not_participating"
]);
export type ParticipantBalanceState = z.infer<
  typeof ParticipantBalanceStateSchema
>;

/**
 * One participant's assignment progress against their exact target.
 *
 * `remaining_weekly_hours` is signed because the service computes
 * `target − assigned` without clamping; a negative value would mean the
 * participant is over their target, which the assignment gates prevent, so it
 * is read as reported rather than floored to zero and hidden.
 */
export const ParticipantBalanceSchema = z
  .object({
    process_teacher_id: uuidSchema,
    teacher_profile_id: uuidSchema,
    display_name: z.string(),
    base_weekly_hours: HoursSchema,
    extra_weekly_hours: HoursSchema,
    target_weekly_hours: HoursSchema,
    assigned_weekly_hours: HoursSchema,
    remaining_weekly_hours: SignedHoursSchema,
    is_overloaded: z.boolean(),
    assignment_count: z.number().int().nonnegative(),
    state: ParticipantBalanceStateSchema
  })
  .strict();
export type ParticipantBalance = z.infer<typeof ParticipantBalanceSchema>;

/**
 * The aggregate assignment view for one process (backend plan §6.2).
 *
 * The hour totals and the slot counts answer two different questions and are
 * both kept: hours say how far the participants are from their targets, slots
 * say how much of the meeting is left to run. They are not derivable from each
 * other — two slots of unequal teacher hours are one count and two totals — so
 * neither is computed here from the other.
 *
 * `participants` lists **every** process teacher, including the inactive and
 * non-participating ones, while only active participants feed the totals. A row
 * that is present but excluded is visible as such; a row that was filtered out
 * would be indistinguishable from a missing participant.
 */
export const AssignmentSummarySchema = z
  .object({
    assignment_process_id: uuidSchema,
    total_target_hours: HoursSchema,
    total_assigned_hours: HoursSchema,
    total_remaining_hours: SignedHoursSchema,
    total_slots: z.number().int().nonnegative(),
    assigned_slots: z.number().int().nonnegative(),
    available_slots: z.number().int().nonnegative(),
    participants: z.array(ParticipantBalanceSchema)
  })
  .strict();
export type AssignmentSummary = z.infer<typeof AssignmentSummarySchema>;

/**
 * The authenticated teacher's own LAN payload (backend plan §8.6, §20.25).
 *
 * Everything identifying here is the caller's own: `participant` is their row
 * and nobody else's, exactly as the SSE teacher tier redacts other people's
 * hours. `plan_balance` is aggregate and names no teacher, which is why it is
 * LAN-safe and why the shared screen shows the same two figures (§8.7).
 *
 * `readiness` and `selection_blocked` come from the same lifecycle-gate status
 * sets the write path consults, so this payload — not a client guess — is what
 * decides whether the direct-selection panel is open.
 */
export const TeacherLanSummarySchema = z
  .object({
    process_id: uuidSchema,
    teacher_profile_id: uuidSchema,
    process_teacher_id: uuidSchema,
    generated_at: dateTimeSchema,
    readiness: PlanReadinessSchema,
    selection_blocked: z.boolean(),
    plan_balance: PlanBalanceSchema.nullable(),
    participant: ParticipantBalanceSchema,
    available_slots: z.number().int().nonnegative(),
    current_turn: CurrentTurnSummarySchema.nullable()
  })
  .strict();
export type TeacherLanSummary = z.infer<typeof TeacherLanSummarySchema>;

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

/**
 * The stable solver diagnostic vocabulary (backend plan §20.20).
 *
 * Closed on purpose, like every other service vocabulary in this package: a
 * code outside this set is a newer backend the package does not understand
 * yet, and failing loudly beats half-rendering a finding the department head
 * is about to act on.
 */
export const FeasibilityDiagnosticCodeSchema = z.enum([
  "incompatible_residual_totals",
  "slot_exceeds_every_target",
  "distinct_teacher_shortfall",
  "unsatisfiable_targets",
  "instance_size_limit",
  "step_limit",
  "time_limit"
]);
export type FeasibilityDiagnosticCode = z.infer<
  typeof FeasibilityDiagnosticCodeSchema
>;

/**
 * One administration-only solver finding. `code` is the stable machine key;
 * `related_ids` carries the affected slot or activity identifiers when the
 * code has any — never the witness, which stays server-side (§20.24).
 */
export const FeasibilityDiagnosticSchema = z
  .object({
    code: FeasibilityDiagnosticCodeSchema,
    message: z.string().min(1),
    related_ids: z.array(uuidSchema)
  })
  .strict();
export type FeasibilityDiagnostic = z.infer<typeof FeasibilityDiagnosticSchema>;

/**
 * The latest current evaluation's findings (department-head/admin only).
 *
 * The endpoint fails closed with 409 whenever no current fingerprint- and
 * generation-matching evaluation exists, so a parsed report always describes
 * the state the head is looking at — never a stale one.
 */
export const FeasibilityDiagnosticsReportSchema = z
  .object({
    teaching_plan_id: uuidSchema,
    assignment_process_id: uuidSchema,
    status: FeasibilityStatusSchema,
    checked_at: dateTimeSchema,
    diagnostics: z.array(FeasibilityDiagnosticSchema)
  })
  .strict();
export type FeasibilityDiagnosticsReport = z.infer<
  typeof FeasibilityDiagnosticsReportSchema
>;

/** One administration-only entry in the current deterministic witness. */
export const FeasibilityWitnessEntrySchema = z
  .object({
    slot_id: uuidSchema,
    process_teacher_id: uuidSchema
  })
  .strict();
export type FeasibilityWitnessEntry = z.infer<
  typeof FeasibilityWitnessEntrySchema
>;

/**
 * Current deterministic witness for department-head safe-choice filtering.
 *
 * This restricted response is never embedded in a plan, teacher LAN, shared
 * screen, SSE, audit or export payload. The assignment board may read it only
 * through the administrator-gated endpoint and reduces it to local verdicts;
 * no default UI renders the provisional mapping itself (plan §20.24).
 */
export const FeasibilityWitnessReportSchema = z
  .object({
    teaching_plan_id: uuidSchema,
    assignment_process_id: uuidSchema,
    input_fingerprint: z.string().min(1),
    solver_version: z.string().min(1),
    checked_at: dateTimeSchema,
    witness: z.array(FeasibilityWitnessEntrySchema)
  })
  .strict();
export type FeasibilityWitnessReport = z.infer<
  typeof FeasibilityWitnessReportSchema
>;

/**
 * Result of the administrator-only bounded evaluation action (§20.23): the
 * endpoint runs or reuses the serialized solver for the exact current
 * fingerprint and reports provenance and telemetry, never the witness.
 */
export const FeasibilityEvaluationSchema = z
  .object({
    teaching_plan_id: uuidSchema,
    assignment_process_id: uuidSchema,
    status: FeasibilityStatusSchema,
    input_fingerprint: z.string(),
    solver_version: z.string(),
    checked_at: dateTimeSchema,
    cache_reused: z.boolean(),
    witness_available: z.boolean(),
    states_explored: z.number().int().nonnegative(),
    memoization_hits: z.number().int().nonnegative()
  })
  .strict();
export type FeasibilityEvaluation = z.infer<typeof FeasibilityEvaluationSchema>;

/**
 * Assignment-stage findings for one process (backend plan §6.3, §6.4).
 *
 * The assignment twin of {@link PlanValidationReportSchema}: it reuses the same
 * stable-code message shape and reports unassigned slots plus participants who
 * are not sitting exactly on their target. `is_final_ready` mirrors the plan
 * §3.10 gate for final closure and the final assignment export; it is true only
 * when no blocking finding is present. Like the planning report it is
 * solver-free — reading it never triggers a feasibility evaluation.
 */
export const AssignmentValidationReportSchema = z
  .object({
    assignment_process_id: uuidSchema,
    is_final_ready: z.boolean(),
    blocking_count: z.number().int().nonnegative(),
    warning_count: z.number().int().nonnegative(),
    messages: z.array(PlanValidationMessageSchema)
  })
  .strict();
export type AssignmentValidationReport = z.infer<
  typeof AssignmentValidationReportSchema
>;

/**
 * The planning half of the dashboard (backend plan §3.1, §6.1, §6.3).
 *
 * Every field is nullable together: a process that has not entered the planning
 * stage has no plan, no balance and no findings, and that is a legitimate state
 * for a process still in setup rather than an error. A client renders the
 * section as "not started"; it must not read an absent balance as zero, which is
 * exactly what the payload this replaces forced it to do.
 */
export const PlanningSectionSchema = z
  .object({
    teaching_plan_id: uuidSchema.nullable(),
    status: TeachingPlanStatusSchema.nullable(),
    balance: PlanBalanceSchema.nullable(),
    validations: PlanValidationReportSchema.nullable()
  })
  .strict();
export type PlanningSection = z.infer<typeof PlanningSectionSchema>;

/**
 * The assignment half of the dashboard (backend plan §3.6, §6.2, §6.3).
 *
 * Always present, unlike the planning section: the participant rows and the slot
 * counts are meaningful before any requirement is generated, when every count is
 * simply zero.
 */
export const AssignmentSectionSchema = z
  .object({
    summary: AssignmentSummarySchema,
    validations: AssignmentValidationReportSchema
  })
  .strict();
export type AssignmentSection = z.infer<typeof AssignmentSectionSchema>;

/**
 * The full department-head dashboard for one process (backend plan §3.1, §6.3).
 *
 * Two sections side by side, never summed: §3.2's co-teaching example is 120
 * group hours and 124 teacher-load hours and *both are correct*, so a client
 * that adds them reports a number the domain does not have.
 * `blocking_validation_count` is the one figure that spans both, and it is the
 * service's own sum — the head can tell whether anything blocks without walking
 * either message list.
 */
export const ProcessDashboardSchema = z
  .object({
    process_id: uuidSchema,
    generated_at: dateTimeSchema,
    readiness: PlanReadinessSchema,
    planning: PlanningSectionSchema,
    assignment: AssignmentSectionSchema,
    current_turn: CurrentTurnSummarySchema.nullable(),
    blocking_validation_count: z.number().int().nonnegative()
  })
  .strict();
export type ProcessDashboard = z.infer<typeof ProcessDashboardSchema>;

/**
 * The dashboard without the message lists and the per-participant rows.
 *
 * Suited to a header, a poll and — decisively — the projected shared screen,
 * which must show the meeting state without naming a single teacher. It carries
 * no `display_name` and no per-participant hours at all, so the aggregate is not
 * a redaction a client has to remember to apply: the endpoint simply never
 * returns the identifying rows.
 */
export const ProcessSummarySchema = z
  .object({
    process_id: uuidSchema,
    generated_at: dateTimeSchema,
    readiness: PlanReadinessSchema,
    plan_status: TeachingPlanStatusSchema.nullable(),
    plan_balance: PlanBalanceSchema.nullable(),
    total_slots: z.number().int().nonnegative(),
    assigned_slots: z.number().int().nonnegative(),
    available_slots: z.number().int().nonnegative(),
    current_turn: CurrentTurnSummarySchema.nullable(),
    blocking_validation_count: z.number().int().nonnegative()
  })
  .strict();
export type ProcessSummary = z.infer<typeof ProcessSummarySchema>;

// ── Requirement generation (backend plan §7.5, §20.8) ──────────────────────
//
// Generation and reconciliation return the same canonical public slot shape.
// Keep the workflow name as a public alias for existing consumers.
export const RequirementGenerationSlotSchema = HourRequirementPublicSchema;
export type RequirementGenerationSlot = HourRequirementPublic;

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

// ── Requirement reconciliation (backend plan §7.5, §9, §20.8) ─────────────

export const RequirementConflictResolutionSchema = z.enum([
  "value_changed",
  "removed"
]);
export type RequirementConflictResolution = z.infer<
  typeof RequirementConflictResolutionSchema
>;

/**
 * One assigned slot that a regeneration would disturb. The active assignment
 * remains present during preview; only an explicit, reasoned reconciliation
 * may release it and retire or supersede the old slot.
 */
export const RequirementConflictDetailSchema = z
  .object({
    requirement_id: uuidSchema,
    teaching_activity_id: uuidSchema,
    position_index: z.number().int().nonnegative(),
    resolution: RequirementConflictResolutionSchema,
    current_required_teacher_hours: HoursSchema,
    new_required_teacher_hours: HoursSchema.nullable(),
    assignment_id: uuidSchema,
    process_teacher_id: uuidSchema,
    superseded_by_requirement_id: uuidSchema.nullable()
  })
  .strict();
export type RequirementConflictDetail = z.infer<
  typeof RequirementConflictDetailSchema
>;

export const RequirementReconciliationPreviewSchema = z
  .object({
    next_generation_number: z.number().int().positive(),
    conflicts: z.array(RequirementConflictDetailSchema),
    conflict_count: z.number().int().nonnegative(),
    create_count: z.number().int().nonnegative(),
    preserve_count: z.number().int().nonnegative(),
    retire_count: z.number().int().nonnegative(),
    requires_reconciliation: z.boolean(),
    is_noop: z.boolean()
  })
  .strict()
  .refine((preview) => preview.conflict_count === preview.conflicts.length, {
    message: "Conflict count must match reconciliation conflicts.",
    path: ["conflict_count"]
  });
export type RequirementReconciliationPreview = z.infer<
  typeof RequirementReconciliationPreviewSchema
>;

export const RequirementReconcileRequestSchema = z
  .object({
    reason: z.string().trim().min(1).max(1000),
    expected_conflict_count: z.number().int().nonnegative()
  })
  .strict();
export type RequirementReconcileRequest = z.infer<
  typeof RequirementReconcileRequestSchema
>;
export type RequirementReconcileRequestInput = z.input<
  typeof RequirementReconcileRequestSchema
>;

export const RequirementReconciliationResultSchema = z
  .object({
    generation_number: z.number().int().positive(),
    resolved: z.array(RequirementConflictDetailSchema),
    resolved_count: z.number().int().nonnegative(),
    released_assignment_ids: z.array(uuidSchema),
    created: z.array(RequirementGenerationSlotSchema),
    created_count: z.number().int().nonnegative(),
    preserved_count: z.number().int().nonnegative(),
    retired_count: z.number().int().nonnegative(),
    data: z.array(RequirementGenerationSlotSchema),
    count: z.number().int().nonnegative()
  })
  .strict()
  .refine((result) => result.resolved_count === result.resolved.length, {
    message: "Resolved count must match reconciliation details.",
    path: ["resolved_count"]
  })
  .refine(
    (result) =>
      result.released_assignment_ids.length === result.resolved_count,
    {
      message: "Released assignment count must match resolved conflicts.",
      path: ["released_assignment_ids"]
    }
  );
export type RequirementReconciliationResult = z.infer<
  typeof RequirementReconciliationResultSchema
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

// ── Main-activity source sync (backend plan §20.10) ─────────────────────────
//
// Editing a source `GroupSubject` never silently overwrites the activity it
// materialized: the activity becomes `out_of_sync`, and the values are only
// copied across by an explicit apply that echoes the preview's fingerprint. So
// the preview is not a convenience — it is the only way to learn what an apply
// would change, and the only token that authorizes it.

/** The three planning values the sync flow compares, on both sides. */
export const MainActivitySyncValuesSchema = z
  .object({
    group_weekly_hours_per_group: HoursSchema,
    teacher_weekly_hours_per_position: HoursSchema,
    required_teacher_count: z.number().int().nonnegative()
  })
  .strict();
export type MainActivitySyncValues = z.infer<
  typeof MainActivitySyncValuesSchema
>;

/** Which of the three values differs, and the exact pair of values. */
export const MainActivitySyncFieldSchema = z.enum([
  "group_weekly_hours_per_group",
  "teacher_weekly_hours_per_position",
  "required_teacher_count"
]);
export type MainActivitySyncField = z.infer<typeof MainActivitySyncFieldSchema>;

export const MainActivitySyncDifferenceSchema = z
  .object({
    field: MainActivitySyncFieldSchema,
    // Two of the three fields are hours and one is a count; both arrive as JSON
    // numbers today, so the canonical hour schema normalizes them either way and
    // no difference is ever compared in binary floating point.
    current_value: HoursSchema,
    source_value: HoursSchema
  })
  .strict();
export type MainActivitySyncDifference = z.infer<
  typeof MainActivitySyncDifferenceSchema
>;

/** Live assignments an apply would disturb; the head decides with this, not a guess. */
export const MainActivityAssignmentImpactSchema = z
  .object({
    active_assignment_count: z.number().int().nonnegative(),
    affected_assignment_count: z.number().int().nonnegative(),
    affected_requirement_ids: z.array(uuidSchema),
    requires_reconciliation: z.boolean()
  })
  .strict();
export type MainActivityAssignmentImpact = z.infer<
  typeof MainActivityAssignmentImpactSchema
>;

export const MainActivitySyncPreviewSchema = z
  .object({
    group_subject_id: uuidSchema,
    teaching_activity_id: uuidSchema,
    sync_state: TeachingActivitySyncStateSchema,
    source_active: z.boolean(),
    source_values: MainActivitySyncValuesSchema,
    current_values: MainActivitySyncValuesSchema,
    differences: z.array(MainActivitySyncDifferenceSchema),
    assignment_impact: MainActivityAssignmentImpactSchema,
    /** The source cell is retired: the guarded retirement flow owns it, not sync. */
    retirement_required: z.boolean(),
    is_noop: z.boolean(),
    /** Staleness token an apply must echo unchanged; the backend 409s otherwise. */
    preview_fingerprint: z.string().length(64)
  })
  .strict();
export type MainActivitySyncPreview = z.infer<
  typeof MainActivitySyncPreviewSchema
>;

export const MainActivitySyncApplyRequestSchema = z
  .object({ expected_preview_fingerprint: z.string().length(64) })
  .strict();
export type MainActivitySyncApplyRequest = z.infer<
  typeof MainActivitySyncApplyRequestSchema
>;
export type MainActivitySyncApplyRequestInput = z.input<
  typeof MainActivitySyncApplyRequestSchema
>;

export const MainActivitySyncResultSchema = z
  .object({
    activity: TeachingActivityPublicSchema,
    applied_differences: z.array(MainActivitySyncDifferenceSchema),
    assignment_impact: MainActivityAssignmentImpactSchema,
    teaching_plan_status: TeachingPlanStatusSchema,
    was_noop: z.boolean()
  })
  .strict();
export type MainActivitySyncResult = z.infer<
  typeof MainActivitySyncResultSchema
>;

// ── Planning import/export exchange (backend plan §3.10, §7.8, §20.25) ───────
//
// The planning artifact is the intermediate stage's own export. It is a
// different document from the `ExportArtifact` family above: an artifact row is
// a stored, checksummed process document, while a planning artifact is computed
// on demand and returned in the response body.

/**
 * Strictness of one planning artifact.
 *
 * `draft` and `provisional` are **never blocked** by an inexact, unbalanced or
 * stale plan (plan §3.10) and carry the findings that make the imbalance
 * visible; `final` retains blocking validation (plan §7.8).
 */
export const PlanningExportModeSchema = z.enum([
  "draft",
  "provisional",
  "final"
]);
export type PlanningExportMode = z.infer<typeof PlanningExportModeSchema>;

/** One live activity as a planning artifact reports it. */
export const PlanningExportActivitySchema = z
  .object({
    id: uuidSchema,
    subject_id: uuidSchema,
    source: TeachingActivitySourceSchema,
    allocation_category: SubjectAllocationCategorySchema,
    activity_type: ActivityTypeSchema,
    group_weekly_hours_per_group: HoursSchema,
    teacher_weekly_hours_per_position: HoursSchema,
    required_teacher_count: z.number().int().positive(),
    linked_group_count: z.number().int().nonnegative(),
    group_subject_ids: uniqueGroupSubjectIdsSchema,
    group_load: HoursSchema,
    teacher_load: HoursSchema
  })
  .strict();
export type PlanningExportActivity = z.infer<
  typeof PlanningExportActivitySchema
>;

/**
 * A draft, provisional or final planning artifact (plan §7.8).
 *
 * `balance` and `validations` are always present, whatever the mode: the
 * artifact "clearly reports both balance states", so a provisional document
 * shows the imbalance instead of hiding it behind a refusal to export.
 * `is_final_exportable` is the service's own answer to "would the final mode
 * succeed?" and is read as reported — the UI never recomputes it from the
 * finding list.
 */
export const PlanningExportArtifactSchema = z
  .object({
    mode: PlanningExportModeSchema,
    generated_at: dateTimeSchema,
    assignment_process_id: uuidSchema,
    teaching_plan_id: uuidSchema,
    plan_status: TeachingPlanStatusSchema,
    is_exact: z.boolean(),
    is_final_exportable: z.boolean(),
    balance: PlanBalanceSchema,
    validations: PlanValidationReportSchema,
    activities: z.array(PlanningExportActivitySchema)
  })
  .strict();
export type PlanningExportArtifact = z.infer<
  typeof PlanningExportArtifactSchema
>;

/** One activity accepted by the planning exchange import (plan §7.8). */
export const PlanningImportActivitySchema = z
  .object({
    subject_id: uuidSchema,
    allocation_category: SubjectAllocationCategorySchema.default("secondary"),
    activity_type: ActivityTypeSchema.default("ordinary"),
    group_weekly_hours_per_group: CanonicalHoursSchema,
    teacher_weekly_hours_per_position: CanonicalHoursSchema,
    required_teacher_count: z.number().int().positive().default(1),
    group_subject_ids: uniqueGroupSubjectIdsSchema.default([]),
    notes: z.string().nullable().optional()
  })
  .strict();
export type PlanningImportActivity = z.infer<
  typeof PlanningImportActivitySchema
>;

/** Validated planning import body. An empty import is a legal no-op. */
export const PlanningImportRequestSchema = z
  .object({
    activities: z.array(PlanningImportActivitySchema).default([])
  })
  .strict();
export type PlanningImportRequest = z.infer<typeof PlanningImportRequestSchema>;

/** Authoritative post-import state returned even when the plan is inexact. */
export const PlanningImportResultSchema = z
  .object({
    imported_count: z.number().int().nonnegative(),
    imported_activity_ids: z.array(uuidSchema),
    balance: PlanBalanceSchema,
    validations: PlanValidationReportSchema
  })
  .strict();
export type PlanningImportResult = z.infer<typeof PlanningImportResultSchema>;
