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
  MainActivitySyncApplyRequestSchema,
  MainActivitySyncPreviewSchema,
  MainActivitySyncResultSchema,
  type GroupSubjectBulkApplyRequestInput,
  type GroupSubjectBulkPreview,
  type GroupSubjectBulkRequestInput,
  type GroupSubjectBulkResult,
  type GroupSubjectCreateInput,
  type GroupSubjectPublic,
  type GroupSubjectsPublic,
  type GroupSubjectUpdateInput,
  type MainActivitySyncApplyRequestInput,
  type MainActivitySyncPreview,
  type MainActivitySyncResult
} from "../schemas.js";

/**
 * The intermediate group-subject matrix (backend plan §5.5, §7.2).
 *
 * One cell declares that a subject applies to a teaching group inside one
 * process, with the actual planning values the teaching plan materializes from.
 * `teaching_group_id` / `subject_id` are the immutable identity of a cell: to
 * re-target one, retire it and create another.
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
  /**
   * Guarded retirement (§20.12); there is no `DELETE` on this path.
   *
   * The cell is never removed: the backend clears `active`, which is also why
   * `update` refuses an `active: false` patch — a boolean would be a second,
   * quieter way out of the plan. **409** when the process is not draft, when
   * the cell is already retired, or while a live downstream activity still
   * points at it; retire that activity through its own flow first.
   */
  retire: (processId: string, groupSubjectId: string) =>
    request<GroupSubjectPublic>({
      method: "POST",
      path: `/assignment-processes/${processId}/group-subjects/${groupSubjectId}/retire`,
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
    }),
  /**
   * Compare one materialized main activity against its source cell.
   *
   * A POST because the service resolves and fingerprints live state rather
   * than returning a cacheable document; it changes nothing. **409** when the
   * cell has no live `main_generated` activity to sync.
   */
  syncPreview: (processId: string, groupSubjectId: string) =>
    request<MainActivitySyncPreview>({
      method: "POST",
      path: `/assignment-processes/${processId}/group-subjects/${groupSubjectId}/sync-preview`,
      schema: MainActivitySyncPreviewSchema,
      auth: true
    }),
  /**
   * Copy the previewed source values onto the activity.
   *
   * The counterpart of `syncPreview`, and only ever driven by one: the request
   * echoes `preview_fingerprint`, and the backend answers **409** both when
   * that token is stale and when the source cell has been retired — the latter
   * belongs to the guarded activity-retirement flow instead. Re-preview on a
   * conflict rather than retrying the apply.
   */
  syncApply: (
    processId: string,
    groupSubjectId: string,
    body: MainActivitySyncApplyRequestInput
  ) =>
    request<MainActivitySyncResult>({
      method: "POST",
      path: `/assignment-processes/${processId}/group-subjects/${groupSubjectId}/sync-apply`,
      body: MainActivitySyncApplyRequestSchema.parse(body),
      schema: MainActivitySyncResultSchema,
      auth: true
    })
} as const;
