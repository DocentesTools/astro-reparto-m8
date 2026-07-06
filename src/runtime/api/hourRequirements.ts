import { request } from "../client.js";
import {
  HourRequirementCreateSchema,
  HourRequirementPublicSchema,
  HourRequirementsPublicSchema,
  HourRequirementUpdateSchema,
  type HourRequirementCreate,
  type HourRequirementPublic,
  type HourRequirementsPublic,
  type HourRequirementUpdate
} from "../schemas.js";

export const hourRequirements = {
  list: (processId: string) =>
    request<HourRequirementsPublic>({
      method: "GET",
      path: `/assignment-processes/${processId}/requirements/`,
      schema: HourRequirementsPublicSchema,
      auth: true
    }),
  get: (processId: string, requirementId: string) =>
    request<HourRequirementPublic>({
      method: "GET",
      path: `/assignment-processes/${processId}/requirements/${requirementId}`,
      schema: HourRequirementPublicSchema,
      auth: true
    }),
  create: (processId: string, body: HourRequirementCreate) =>
    request<HourRequirementPublic>({
      method: "POST",
      path: `/assignment-processes/${processId}/requirements/`,
      body: HourRequirementCreateSchema.parse(body),
      schema: HourRequirementPublicSchema,
      auth: true
    }),
  update: (
    processId: string,
    requirementId: string,
    body: HourRequirementUpdate
  ) =>
    request<HourRequirementPublic>({
      method: "PATCH",
      path: `/assignment-processes/${processId}/requirements/${requirementId}`,
      body: HourRequirementUpdateSchema.parse(body),
      schema: HourRequirementPublicSchema,
      auth: true
    }),
  remove: (processId: string, requirementId: string) =>
    request<HourRequirementPublic>({
      method: "DELETE",
      path: `/assignment-processes/${processId}/requirements/${requirementId}`,
      schema: HourRequirementPublicSchema,
      auth: true
    })
} as const;