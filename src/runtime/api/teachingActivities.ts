import { request } from "../client.js";
import {
  TeachingActivitiesPublicSchema,
  TeachingActivityCreateSchema,
  TeachingActivityPublicSchema,
  TeachingActivityUpdateSchema,
  type TeachingActivitiesPublic,
  type TeachingActivityCreateInput,
  type TeachingActivityPublic,
  type TeachingActivityUpdateInput
} from "../schemas.js";

/**
 * Concrete items in the intermediate department teaching plan.
 *
 * Each activity owns its actual group hours, teacher hours and required teacher
 * count. `group_subject_ids` is the complete link set: every id must belong to
 * the process and the activity subject, while zero/multiple-group policy stays
 * backend-authoritative because it depends on the selected subject.
 */
export const teachingActivities = {
  list: (processId: string) =>
    request<TeachingActivitiesPublic>({
      method: "GET",
      path: `/assignment-processes/${processId}/teaching-activities/`,
      schema: TeachingActivitiesPublicSchema,
      auth: true
    }),
  get: (processId: string, activityId: string) =>
    request<TeachingActivityPublic>({
      method: "GET",
      path: `/assignment-processes/${processId}/teaching-activities/${activityId}`,
      schema: TeachingActivityPublicSchema,
      auth: true
    }),
  create: (processId: string, body: TeachingActivityCreateInput) =>
    request<TeachingActivityPublic>({
      method: "POST",
      path: `/assignment-processes/${processId}/teaching-activities/`,
      body: TeachingActivityCreateSchema.parse(body),
      schema: TeachingActivityPublicSchema,
      auth: true
    }),
  update: (
    processId: string,
    activityId: string,
    body: TeachingActivityUpdateInput
  ) =>
    request<TeachingActivityPublic>({
      method: "PATCH",
      path: `/assignment-processes/${processId}/teaching-activities/${activityId}`,
      body: TeachingActivityUpdateSchema.parse(body),
      schema: TeachingActivityPublicSchema,
      auth: true
    }),
  /**
   * Guarded retirement (§20.12); there is no `DELETE` on this path.
   *
   * The row is never removed: the backend stamps `retired_at` (§20.18) and
   * routes any live requirement through regeneration or, once assigned,
   * explicit reconciliation. **409** when the activity is already retired, or
   * when it has no requirements and its plan is locked — unlock it first.
   */
  retire: (processId: string, activityId: string) =>
    request<TeachingActivityPublic>({
      method: "POST",
      path: `/assignment-processes/${processId}/teaching-activities/${activityId}/retire`,
      schema: TeachingActivityPublicSchema,
      auth: true
    })
} as const;
