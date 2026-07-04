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
