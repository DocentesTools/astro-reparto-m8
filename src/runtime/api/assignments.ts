import { request } from "../client.js";
import {
  AssignmentCreateSchema,
  AssignmentDirectChoiceSchema,
  AssignmentPublicSchema,
  AssignmentsPublicSchema,
  AssignmentUpdateSchema,
  type AssignmentCreate,
  type AssignmentDirectChoice,
  type AssignmentPublic,
  type AssignmentUpdate,
  type AssignmentsPublic
} from "../schemas.js";

export const assignments = {
  list: (processId: string) =>
    request<AssignmentsPublic>({
      method: "GET",
      path: `/assignment-processes/${processId}/assignments/`,
      schema: AssignmentsPublicSchema,
      auth: true
    }),
  get: (processId: string, assignmentId: string) =>
    request<AssignmentPublic>({
      method: "GET",
      path: `/assignment-processes/${processId}/assignments/${assignmentId}`,
      schema: AssignmentPublicSchema,
      auth: true
    }),
  create: (processId: string, body: AssignmentCreate) =>
    request<AssignmentPublic>({
      method: "POST",
      path: `/assignment-processes/${processId}/assignments/`,
      body: AssignmentCreateSchema.parse(body),
      schema: AssignmentPublicSchema,
      auth: true
    }),
  update: (processId: string, assignmentId: string, body: AssignmentUpdate) =>
    request<AssignmentPublic>({
      method: "PATCH",
      path: `/assignment-processes/${processId}/assignments/${assignmentId}`,
      body: AssignmentUpdateSchema.parse(body),
      schema: AssignmentPublicSchema,
      auth: true
    }),
  remove: (processId: string, assignmentId: string) =>
    request<AssignmentPublic>({
      method: "DELETE",
      path: `/assignment-processes/${processId}/assignments/${assignmentId}`,
      schema: AssignmentPublicSchema,
      auth: true
    }),
  directChoice: (processId: string, body: AssignmentDirectChoice) =>
    request<AssignmentPublic>({
      method: "POST",
      path: `/assignment-processes/${processId}/assignments/direct-choice`,
      body: AssignmentDirectChoiceSchema.parse(body),
      schema: AssignmentPublicSchema,
      auth: true
    })
} as const;