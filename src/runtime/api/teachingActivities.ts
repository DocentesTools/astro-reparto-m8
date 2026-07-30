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
  remove: (processId: string, activityId: string) =>
    request<TeachingActivityPublic>({
      method: "DELETE",
      path: `/assignment-processes/${processId}/teaching-activities/${activityId}`,
      schema: TeachingActivityPublicSchema,
      auth: true
    })
} as const;
