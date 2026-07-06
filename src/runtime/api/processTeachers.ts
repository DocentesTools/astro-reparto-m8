import { request } from "../client.js";
import {
  ProcessTeacherCreateSchema,
  ProcessTeacherPublicSchema,
  ProcessTeachersPublicSchema,
  ProcessTeacherUpdateSchema,
  type ProcessTeacherCreateInput,
  type ProcessTeacherPublic,
  type ProcessTeachersPublic,
  type ProcessTeacherUpdate
} from "../schemas.js";

export const processTeachers = {
  list: (processId: string) =>
    request<ProcessTeachersPublic>({
      method: "GET",
      path: `/assignment-processes/${processId}/teachers/`,
      schema: ProcessTeachersPublicSchema,
      auth: true
    }),
  get: (processId: string, processTeacherId: string) =>
    request<ProcessTeacherPublic>({
      method: "GET",
      path: `/assignment-processes/${processId}/teachers/${processTeacherId}`,
      schema: ProcessTeacherPublicSchema,
      auth: true
    }),
  create: (processId: string, body: ProcessTeacherCreateInput) =>
    request<ProcessTeacherPublic>({
      method: "POST",
      path: `/assignment-processes/${processId}/teachers/`,
      body: ProcessTeacherCreateSchema.parse({
        ...body,
        assignment_process_id: processId
      }),
      schema: ProcessTeacherPublicSchema,
      auth: true
    }),
  update: (
    processId: string,
    processTeacherId: string,
    body: ProcessTeacherUpdate
  ) =>
    request<ProcessTeacherPublic>({
      method: "PATCH",
      path: `/assignment-processes/${processId}/teachers/${processTeacherId}`,
      body: ProcessTeacherUpdateSchema.parse(body),
      schema: ProcessTeacherPublicSchema,
      auth: true
    }),
  remove: (processId: string, processTeacherId: string) =>
    request<ProcessTeacherPublic>({
      method: "DELETE",
      path: `/assignment-processes/${processId}/teachers/${processTeacherId}`,
      schema: ProcessTeacherPublicSchema,
      auth: true
    })
} as const;
