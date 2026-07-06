import { request } from "../client.js";
import {
  TeacherProfileCreateSchema,
  TeacherProfileLinkUserSchema,
  TeacherProfilePublicSchema,
  TeacherProfilesPublicSchema,
  TeacherProfileUpdateSchema,
  type TeacherProfileCreate,
  type TeacherProfileLinkUser,
  type TeacherProfilePublic,
  type TeacherProfilesPublic,
  type TeacherProfileUpdate
} from "../schemas.js";

export const teacherProfiles = {
  list: (params: { active?: boolean | null; skip?: number; limit?: number } = {}) =>
    request<TeacherProfilesPublic>({
      method: "GET",
      path: "/teacher-profiles/",
      query: params,
      schema: TeacherProfilesPublicSchema,
      auth: true
    }),
  get: (profileId: string) =>
    request<TeacherProfilePublic>({
      method: "GET",
      path: `/teacher-profiles/${profileId}`,
      schema: TeacherProfilePublicSchema,
      auth: true
    }),
  create: (body: TeacherProfileCreate) =>
    request<TeacherProfilePublic>({
      method: "POST",
      path: "/teacher-profiles/",
      body: TeacherProfileCreateSchema.parse(body),
      schema: TeacherProfilePublicSchema,
      auth: true
    }),
  update: (profileId: string, body: TeacherProfileUpdate) =>
    request<TeacherProfilePublic>({
      method: "PATCH",
      path: `/teacher-profiles/${profileId}`,
      body: TeacherProfileUpdateSchema.parse(body),
      schema: TeacherProfilePublicSchema,
      auth: true
    }),
  linkUser: (profileId: string, body: TeacherProfileLinkUser) =>
    request<TeacherProfilePublic>({
      method: "POST",
      path: `/teacher-profiles/${profileId}/link-user`,
      body: TeacherProfileLinkUserSchema.parse(body),
      schema: TeacherProfilePublicSchema,
      auth: true
    }),
  remove: (profileId: string) =>
    request<TeacherProfilePublic>({
      method: "DELETE",
      path: `/teacher-profiles/${profileId}`,
      schema: TeacherProfilePublicSchema,
      auth: true
    })
} as const;
