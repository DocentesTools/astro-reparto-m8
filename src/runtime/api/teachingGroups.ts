import { request } from "../client.js";
import {
  TeachingGroupCreateSchema,
  TeachingGroupPublicSchema,
  TeachingGroupsPublicSchema,
  TeachingGroupUpdateSchema,
  type TeachingGroupCreateInput,
  type TeachingGroupPublic,
  type TeachingGroupsPublic,
  type TeachingGroupUpdate
} from "../schemas.js";

export const teachingGroups = {
  list: (processId: string) =>
    request<TeachingGroupsPublic>({
      method: "GET",
      path: `/assignment-processes/${processId}/groups/`,
      schema: TeachingGroupsPublicSchema,
      auth: true
    }),
  get: (processId: string, groupId: string) =>
    request<TeachingGroupPublic>({
      method: "GET",
      path: `/assignment-processes/${processId}/groups/${groupId}`,
      schema: TeachingGroupPublicSchema,
      auth: true
    }),
  create: (processId: string, body: TeachingGroupCreateInput) =>
    request<TeachingGroupPublic>({
      method: "POST",
      path: `/assignment-processes/${processId}/groups/`,
      body: TeachingGroupCreateSchema.parse({
        ...body,
        assignment_process_id: processId
      }),
      schema: TeachingGroupPublicSchema,
      auth: true
    }),
  update: (processId: string, groupId: string, body: TeachingGroupUpdate) =>
    request<TeachingGroupPublic>({
      method: "PATCH",
      path: `/assignment-processes/${processId}/groups/${groupId}`,
      body: TeachingGroupUpdateSchema.parse(body),
      schema: TeachingGroupPublicSchema,
      auth: true
    }),
  remove: (processId: string, groupId: string) =>
    request<TeachingGroupPublic>({
      method: "DELETE",
      path: `/assignment-processes/${processId}/groups/${groupId}`,
      schema: TeachingGroupPublicSchema,
      auth: true
    })
} as const;
