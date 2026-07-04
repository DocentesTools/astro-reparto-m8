import { request } from "../client.js";
import {
  AssignmentProcessesPublicSchema,
  AssignmentProcessPublicSchema,
  ProcessSummarySchema,
  TeacherLanSummarySchema,
  type AssignmentProcessesPublic,
  type AssignmentProcessPublic,
  type ProcessSummary,
  type TeacherLanSummary
} from "../schemas.js";
import { repartoUrl } from "../client.js";

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
    }),
  summary: (processId: string) =>
    request<ProcessSummary>({
      method: "GET",
      path: `/assignment-processes/${processId}/summary`,
      schema: ProcessSummarySchema,
      auth: true
    }),
  myLanSummary: (processId: string) =>
    request<TeacherLanSummary>({
      method: "GET",
      path: `/assignment-processes/${processId}/lan/me`,
      schema: TeacherLanSummarySchema,
      auth: true
    }),
  eventsUrl: (processId: string) =>
    repartoUrl("api", `/assignment-processes/${processId}/events`)
} as const;
