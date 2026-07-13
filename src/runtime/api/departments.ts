import { request } from "../client.js";
import {
  DepartmentCreateSchema,
  DepartmentPublicSchema,
  DepartmentsPublicSchema,
  DepartmentUpdateSchema,
  type DepartmentCreate,
  type DepartmentPublic,
  type DepartmentsPublic,
  type DepartmentUpdate
} from "../schemas.js";

export const departments = {
  list: (params: { schoolId?: string | null; skip?: number; limit?: number } = {}) => {
    const { schoolId, ...rest } = params;
    return request<DepartmentsPublic>({
      method: "GET",
      path: "/departments/",
      query: schoolId ? { school_id: schoolId, ...rest } : rest,
      schema: DepartmentsPublicSchema,
      auth: true
    });
  },
  get: (departmentId: string) =>
    request<DepartmentPublic>({
      method: "GET",
      path: `/departments/${departmentId}`,
      schema: DepartmentPublicSchema,
      auth: true
    }),
  create: (body: DepartmentCreate) =>
    request<DepartmentPublic>({
      method: "POST",
      path: "/departments/",
      body: DepartmentCreateSchema.parse(body),
      schema: DepartmentPublicSchema,
      auth: true
    }),
  update: (departmentId: string, body: DepartmentUpdate) =>
    request<DepartmentPublic>({
      method: "PATCH",
      path: `/departments/${departmentId}`,
      body: DepartmentUpdateSchema.parse(body),
      schema: DepartmentPublicSchema,
      auth: true
    })
} as const;
