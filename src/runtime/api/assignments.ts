import { request } from "../client.js";
import {
  AssignmentCreateSchema,
  AssignmentDirectChoiceSchema,
  AssignmentPublicSchema,
  AssignmentReassignSchema,
  AssignmentUndoSchema,
  AssignmentsPublicSchema,
  AssignmentUpdateSchema,
  AssignmentValidationReportSchema,
  type AssignmentCreate,
  type AssignmentDirectChoice,
  type AssignmentPublic,
  type AssignmentReassign,
  type AssignmentUndo,
  type AssignmentUpdate,
  type AssignmentsPublic,
  type AssignmentValidationReport
} from "../schemas.js";

/**
 * Assignment operations for one process.
 *
 * Cancelling an assignment is `undo`, not `remove`: the backend keeps a
 * `DELETE` route only as a hidden, reason-required compatibility alias, so a
 * wrapper named after it would suggest a reasonless cancellation path that does
 * not exist. Moving a slot to another participant is `reassign` — an atomic
 * release-and-occupy, never a delete followed by a create.
 */
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
  validations: (processId: string) =>
    request<AssignmentValidationReport>({
      method: "GET",
      path: `/assignment-processes/${processId}/assignments/validations`,
      schema: AssignmentValidationReportSchema,
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
  undo: (processId: string, assignmentId: string, body: AssignmentUndo) =>
    request<AssignmentPublic>({
      method: "POST",
      path: `/assignment-processes/${processId}/assignments/${assignmentId}/undo`,
      body: AssignmentUndoSchema.parse(body),
      schema: AssignmentPublicSchema,
      auth: true
    }),
  reassign: (
    processId: string,
    assignmentId: string,
    body: AssignmentReassign
  ) =>
    request<AssignmentPublic>({
      method: "POST",
      path: `/assignment-processes/${processId}/assignments/${assignmentId}/reassign`,
      body: AssignmentReassignSchema.parse(body),
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
