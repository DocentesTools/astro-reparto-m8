import { request } from "../client.js";
import {
  AcademicYearCreateSchema,
  AcademicYearPublicSchema,
  AcademicYearsPublicSchema,
  AcademicYearUpdateSchema,
  type AcademicYearCreate,
  type AcademicYearPublic,
  type AcademicYearsPublic,
  type AcademicYearUpdate
} from "../schemas.js";

export const academicYears = {
  list: (params: { skip?: number; limit?: number } = {}) =>
    request<AcademicYearsPublic>({
      method: "GET",
      path: "/academic-years/",
      query: params,
      schema: AcademicYearsPublicSchema,
      auth: true
    }),
  get: (yearId: string) =>
    request<AcademicYearPublic>({
      method: "GET",
      path: `/academic-years/${yearId}`,
      schema: AcademicYearPublicSchema,
      auth: true
    }),
  create: (body: AcademicYearCreate) =>
    request<AcademicYearPublic>({
      method: "POST",
      path: "/academic-years/",
      body: AcademicYearCreateSchema.parse(body),
      schema: AcademicYearPublicSchema,
      auth: true
    }),
  update: (yearId: string, body: AcademicYearUpdate) =>
    request<AcademicYearPublic>({
      method: "PATCH",
      path: `/academic-years/${yearId}`,
      body: AcademicYearUpdateSchema.parse(body),
      schema: AcademicYearPublicSchema,
      auth: true
    }),
  archive: (yearId: string) =>
    request<AcademicYearPublic>({
      method: "POST",
      path: `/academic-years/${yearId}/archive`,
      schema: AcademicYearPublicSchema,
      auth: true
    })
} as const;
