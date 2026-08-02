import { request } from "../client.js";
import {
  ProcessTeacherCreateSchema,
  ProcessTeacherExtraHoursSchema,
  ProcessTeacherPublicSchema,
  ProcessTeachersPublicSchema,
  ProcessTeacherUpdateSchema,
  type ProcessTeacherCreateInput,
  type ProcessTeacherExtraHoursInput,
  type ProcessTeacherPublic,
  type ProcessTeachersPublic,
  type ProcessTeacherUpdateInput
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
    body: ProcessTeacherUpdateInput
  ) =>
    request<ProcessTeacherPublic>({
      method: "PATCH",
      path: `/assignment-processes/${processId}/teachers/${processTeacherId}`,
      body: ProcessTeacherUpdateSchema.parse(body),
      schema: ProcessTeacherPublicSchema,
      auth: true
    }),
  /**
   * Authorize (or withdraw) extra weekly hours — the only path that changes
   * `extra_weekly_hours`, and it cannot be taken without a reason. The generic
   * `update` above has no such field, so there is no reasonless alternative.
   */
  extraHours: (
    processId: string,
    processTeacherId: string,
    body: ProcessTeacherExtraHoursInput
  ) =>
    request<ProcessTeacherPublic>({
      method: "POST",
      path: `/assignment-processes/${processId}/teachers/${processTeacherId}/extra-hours`,
      body: ProcessTeacherExtraHoursSchema.parse(body),
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
