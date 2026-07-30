import { request } from "../client.js";
import {
  SubjectCreateSchema,
  SubjectPublicSchema,
  SubjectsPublicSchema,
  SubjectUpdateSchema,
  type SubjectCreateInput,
  type SubjectPublic,
  type SubjectsPublic,
  type SubjectUpdateInput
} from "../schemas.js";

export const subjects = {
  list: (processId: string) =>
    request<SubjectsPublic>({
      method: "GET",
      path: `/assignment-processes/${processId}/subjects/`,
      schema: SubjectsPublicSchema,
      auth: true
    }),
  get: (processId: string, subjectId: string) =>
    request<SubjectPublic>({
      method: "GET",
      path: `/assignment-processes/${processId}/subjects/${subjectId}`,
      schema: SubjectPublicSchema,
      auth: true
    }),
  create: (processId: string, body: SubjectCreateInput) =>
    request<SubjectPublic>({
      method: "POST",
      path: `/assignment-processes/${processId}/subjects/`,
      body: SubjectCreateSchema.parse({
        ...body,
        assignment_process_id: processId
      }),
      schema: SubjectPublicSchema,
      auth: true
    }),
  update: (processId: string, subjectId: string, body: SubjectUpdateInput) =>
    request<SubjectPublic>({
      method: "PATCH",
      path: `/assignment-processes/${processId}/subjects/${subjectId}`,
      body: SubjectUpdateSchema.parse(body),
      schema: SubjectPublicSchema,
      auth: true
    }),
  remove: (processId: string, subjectId: string) =>
    request<SubjectPublic>({
      method: "DELETE",
      path: `/assignment-processes/${processId}/subjects/${subjectId}`,
      schema: SubjectPublicSchema,
      auth: true
    })
} as const;
