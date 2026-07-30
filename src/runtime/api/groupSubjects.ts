import { request } from "../client.js";
import {
  GroupSubjectBulkApplyRequestSchema,
  GroupSubjectBulkPreviewSchema,
  GroupSubjectBulkResultSchema,
  GroupSubjectBulkRequestSchema,
  GroupSubjectCreateSchema,
  GroupSubjectPublicSchema,
  GroupSubjectsPublicSchema,
  GroupSubjectUpdateSchema,
  type GroupSubjectBulkApplyRequestInput,
  type GroupSubjectBulkPreview,
  type GroupSubjectBulkRequestInput,
  type GroupSubjectBulkResult,
  type GroupSubjectCreateInput,
  type GroupSubjectPublic,
  type GroupSubjectsPublic,
  type GroupSubjectUpdateInput
} from "../schemas.js";

/**
 * The intermediate group-subject matrix (backend plan §5.5, §7.2).
 *
 * One cell declares that a subject applies to a teaching group inside one
 * process, with the actual planning values the teaching plan materializes from.
 * `teaching_group_id` / `subject_id` are the immutable identity of a cell: to
 * re-target one, delete it and create another.
 *
 * `bulkPreview` and `bulkApply` are a **pair**. Preview is a dry run that
 * returns the create/update/unchanged split plus `expected_affected_count`;
 * apply sends that count back and the backend answers **409** when the
 * underlying selection changed in between, so a stale confirmation can never be
 * committed. Re-preview on that conflict rather than retrying the apply.
 */
export const groupSubjects = {
  list: (processId: string) =>
    request<GroupSubjectsPublic>({
      method: "GET",
      path: `/assignment-processes/${processId}/group-subjects/`,
      schema: GroupSubjectsPublicSchema,
      auth: true
    }),
  get: (processId: string, groupSubjectId: string) =>
    request<GroupSubjectPublic>({
      method: "GET",
      path: `/assignment-processes/${processId}/group-subjects/${groupSubjectId}`,
      schema: GroupSubjectPublicSchema,
      auth: true
    }),
  create: (processId: string, body: GroupSubjectCreateInput) =>
    request<GroupSubjectPublic>({
      method: "POST",
      path: `/assignment-processes/${processId}/group-subjects/`,
      body: GroupSubjectCreateSchema.parse({
        ...body,
        assignment_process_id: processId
      }),
      schema: GroupSubjectPublicSchema,
      auth: true
    }),
  update: (
    processId: string,
    groupSubjectId: string,
    body: GroupSubjectUpdateInput
  ) =>
    request<GroupSubjectPublic>({
      method: "PATCH",
      path: `/assignment-processes/${processId}/group-subjects/${groupSubjectId}`,
      body: GroupSubjectUpdateSchema.parse(body),
      schema: GroupSubjectPublicSchema,
      auth: true
    }),
  remove: (processId: string, groupSubjectId: string) =>
    request<GroupSubjectPublic>({
      method: "DELETE",
      path: `/assignment-processes/${processId}/group-subjects/${groupSubjectId}`,
      schema: GroupSubjectPublicSchema,
      auth: true
    }),
  /** Dry-run one subject across the matched groups; changes nothing. */
  bulkPreview: (processId: string, body: GroupSubjectBulkRequestInput) =>
    request<GroupSubjectBulkPreview>({
      method: "POST",
      path: `/assignment-processes/${processId}/group-subjects/bulk-preview`,
      body: GroupSubjectBulkRequestSchema.parse(body),
      schema: GroupSubjectBulkPreviewSchema,
      auth: true
    }),
  /** Commit a previewed operation; 409 when the previewed count is stale. */
  bulkApply: (processId: string, body: GroupSubjectBulkApplyRequestInput) =>
    request<GroupSubjectBulkResult>({
      method: "POST",
      path: `/assignment-processes/${processId}/group-subjects/bulk-apply`,
      body: GroupSubjectBulkApplyRequestSchema.parse(body),
      schema: GroupSubjectBulkResultSchema,
      auth: true
    })
} as const;
