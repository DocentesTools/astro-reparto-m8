import { request } from "../client.js";
import {
  TeacherProfileClaimCodeSchema,
  TeacherProfileClaimSchema,
  TeacherProfileCreateSchema,
  TeacherProfileLinkUserSchema,
  TeacherProfilePublicSchema,
  TeacherProfilesPublicSchema,
  TeacherProfileUpdateSchema,
  type TeacherProfileClaim,
  type TeacherProfileClaimCode,
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
  // Minting is a department-head act; claiming is the teacher's own, and the
  // service reads the account to bind from the token — which is why `claim`
  // takes a code and nothing else.
  issueClaimCode: (profileId: string) =>
    request<TeacherProfileClaimCode>({
      method: "POST",
      path: `/teacher-profiles/${profileId}/claim-code`,
      schema: TeacherProfileClaimCodeSchema,
      auth: true
    }),
  claim: (body: TeacherProfileClaim) =>
    request<TeacherProfilePublic>({
      method: "POST",
      path: "/teacher-profiles/claim",
      body: TeacherProfileClaimSchema.parse(body),
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
