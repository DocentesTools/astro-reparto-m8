import { request } from "../client.js";
import {
  DepartmentHourAllocationRevisionCreateSchema,
  DepartmentHourAllocationRevisionPublicSchema,
  DepartmentHourAllocationRevisionsPublicSchema,
  type DepartmentHourAllocationRevisionCreateInput,
  type DepartmentHourAllocationRevisionPublic,
  type DepartmentHourAllocationRevisionsPublic
} from "../schemas.js";

/**
 * School-leadership group-hour allocation revisions (backend plan §7.1).
 *
 * Append-only by contract: the backend exposes history, the single current
 * revision and an audited create — there is no update or delete route, so this
 * wrapper deliberately has no `update`/`remove`.
 *
 * `current` answers **404** when the process has no allocation yet, which is a
 * legitimate state for a freshly created process rather than an error; callers
 * render "no allocation communicated yet" from that.
 */
export const allocationRevisions = {
  /** Full revision history, oldest revision first. */
  list: (processId: string) =>
    request<DepartmentHourAllocationRevisionsPublic>({
      method: "GET",
      path: `/assignment-processes/${processId}/allocation-revisions/`,
      schema: DepartmentHourAllocationRevisionsPublicSchema,
      auth: true
    }),
  /** The single non-superseded revision; 404 when none has been recorded. */
  current: (processId: string) =>
    request<DepartmentHourAllocationRevisionPublic>({
      method: "GET",
      path: `/assignment-processes/${processId}/allocation-revisions/current`,
      schema: DepartmentHourAllocationRevisionPublicSchema,
      auth: true
    }),
  /**
   * Record a new allocation, superseding the current revision and emitting the
   * `allocation.revised` audit event. Requires a reason. A final or archived
   * process must be reopened first (the backend answers 400 otherwise).
   */
  create: (
    processId: string,
    body: DepartmentHourAllocationRevisionCreateInput
  ) =>
    request<DepartmentHourAllocationRevisionPublic>({
      method: "POST",
      path: `/assignment-processes/${processId}/allocation-revisions/`,
      body: DepartmentHourAllocationRevisionCreateSchema.parse(body),
      schema: DepartmentHourAllocationRevisionPublicSchema,
      auth: true
    })
} as const;
