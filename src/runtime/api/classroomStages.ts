import { request } from "../client.js";
import {
  ClassroomStageCreateSchema,
  ClassroomStagePublicSchema,
  ClassroomStagesPublicSchema,
  ClassroomStageUpdateSchema,
  type ClassroomStageCreate,
  type ClassroomStagePublic,
  type ClassroomStagesPublic,
  type ClassroomStageUpdate
} from "../schemas.js";

export const classroomStages = {
  list: () => request<ClassroomStagesPublic>({ method: "GET", path: "/classroom-stages/", schema: ClassroomStagesPublicSchema, auth: true }),
  get: (stageId: string) => request<ClassroomStagePublic>({ method: "GET", path: `/classroom-stages/${stageId}`, schema: ClassroomStagePublicSchema, auth: true }),
  create: (body: ClassroomStageCreate) => request<ClassroomStagePublic>({ method: "POST", path: "/classroom-stages/", body: ClassroomStageCreateSchema.parse(body), schema: ClassroomStagePublicSchema, auth: true }),
  update: (stageId: string, body: ClassroomStageUpdate) => request<ClassroomStagePublic>({ method: "PATCH", path: `/classroom-stages/${stageId}`, body: ClassroomStageUpdateSchema.parse(body), schema: ClassroomStagePublicSchema, auth: true }),
  remove: (stageId: string) => request<ClassroomStagePublic>({ method: "DELETE", path: `/classroom-stages/${stageId}`, schema: ClassroomStagePublicSchema, auth: true })
} as const;
