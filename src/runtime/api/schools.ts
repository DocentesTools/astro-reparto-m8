import { request } from "../client.js";
import {
  SchoolCreateSchema,
  SchoolPublicSchema,
  SchoolsPublicSchema,
  SchoolUpdateSchema,
  type SchoolCreate,
  type SchoolPublic,
  type SchoolsPublic,
  type SchoolUpdate
} from "../schemas.js";

export const schools = {
  list: (params: { skip?: number; limit?: number } = {}) =>
    request<SchoolsPublic>({
      method: "GET",
      path: "/schools/",
      query: params,
      schema: SchoolsPublicSchema,
      auth: true
    }),
  get: (schoolId: string) =>
    request<SchoolPublic>({
      method: "GET",
      path: `/schools/${schoolId}`,
      schema: SchoolPublicSchema,
      auth: true
    }),
  create: (body: SchoolCreate) =>
    request<SchoolPublic>({
      method: "POST",
      path: "/schools/",
      body: SchoolCreateSchema.parse(body),
      schema: SchoolPublicSchema,
      auth: true
    }),
  update: (schoolId: string, body: SchoolUpdate) =>
    request<SchoolPublic>({
      method: "PATCH",
      path: `/schools/${schoolId}`,
      body: SchoolUpdateSchema.parse(body),
      schema: SchoolPublicSchema,
      auth: true
    })
} as const;
