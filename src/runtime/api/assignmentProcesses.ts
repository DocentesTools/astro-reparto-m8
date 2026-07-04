import { request } from "../client.js";
import {
  AssignmentProcessesPublicSchema,
  AssignmentProcessPublicSchema,
  type AssignmentProcessesPublic,
  type AssignmentProcessPublic
} from "../schemas.js";

export const assignmentProcesses = {
  list: (params: { skip?: number; limit?: number } = {}) =>
    request<AssignmentProcessesPublic>({
      method: "GET",
      path: "/assignment-processes/",
      query: params,
      schema: AssignmentProcessesPublicSchema,
      auth: true
    }),
  get: (processId: string) =>
    request<AssignmentProcessPublic>({
      method: "GET",
      path: `/assignment-processes/${processId}`,
      schema: AssignmentProcessPublicSchema,
      auth: true
    })
} as const;
