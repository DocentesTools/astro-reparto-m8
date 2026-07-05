import { request } from "../client.js";
import {
  AssignmentProcessCreateSchema,
  AssignmentProcessesPublicSchema,
  AssignmentProcessPublicSchema,
  AssignmentProcessUpdateSchema,
  ProcessSummarySchema,
  ProcessDashboardSchema,
  ProcessTransitionSchema,
  ProcessReopenSchema,
  TeacherLanSummarySchema,
  type AssignmentProcessCreate,
  type AssignmentProcessesPublic,
  type AssignmentProcessPublic,
  type AssignmentProcessUpdate,
  type ProcessSummary,
  type ProcessDashboard,
  type ProcessTransition,
  type ProcessReopen,
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
  create: (body: AssignmentProcessCreate) =>
    request<AssignmentProcessPublic>({
      method: "POST",
      path: "/assignment-processes/",
      body: AssignmentProcessCreateSchema.parse(body),
      schema: AssignmentProcessPublicSchema,
      auth: true
    }),
  update: (processId: string, body: AssignmentProcessUpdate) =>
    request<AssignmentProcessPublic>({
      method: "PATCH",
      path: `/assignment-processes/${processId}`,
      body: AssignmentProcessUpdateSchema.parse(body),
      schema: AssignmentProcessPublicSchema,
      auth: true
    }),
  transition: (processId: string, body: ProcessTransition) =>
    request<AssignmentProcessPublic>({
      method: "POST",
      path: `/assignment-processes/${processId}/transition`,
      body: ProcessTransitionSchema.parse(body),
      schema: AssignmentProcessPublicSchema,
      auth: true
    }),
  reopen: (processId: string, body: ProcessReopen) =>
    request<AssignmentProcessPublic>({
      method: "POST",
      path: `/assignment-processes/${processId}/reopen`,
      body: ProcessReopenSchema.parse(body),
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
  dashboard: (processId: string) =>
    request<ProcessDashboard>({
      method: "GET",
      path: `/assignment-processes/${processId}/dashboard`,
      schema: ProcessDashboardSchema,
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
