import { request } from "../client.js";
import {
  MeetingSessionCreateSchema,
  MeetingSessionPublicSchema,
  MeetingSessionsPublicSchema,
  MeetingSessionUpdateSchema,
  type MeetingSessionCreate,
  type MeetingSessionPublic,
  type MeetingSessionsPublic,
  type MeetingSessionUpdate
} from "../schemas.js";

export const meetingSessions = {
  list: (processId: string) =>
    request<MeetingSessionsPublic>({
      method: "GET",
      path: `/assignment-processes/${processId}/meeting-sessions/`,
      schema: MeetingSessionsPublicSchema,
      auth: true
    }),
  create: (processId: string, body: MeetingSessionCreate) =>
    request<MeetingSessionPublic>({
      method: "POST",
      path: `/assignment-processes/${processId}/meeting-sessions/`,
      body: MeetingSessionCreateSchema.parse(body),
      schema: MeetingSessionPublicSchema,
      auth: true
    }),
  update: (
    processId: string,
    meetingSessionId: string,
    body: MeetingSessionUpdate
  ) =>
    request<MeetingSessionPublic>({
      method: "PATCH",
      path: `/assignment-processes/${processId}/meeting-sessions/${meetingSessionId}`,
      body: MeetingSessionUpdateSchema.parse(body),
      schema: MeetingSessionPublicSchema,
      auth: true
    }),
  close: (processId: string, meetingSessionId: string) =>
    request<MeetingSessionPublic>({
      method: "POST",
      path: `/assignment-processes/${processId}/meeting-sessions/${meetingSessionId}/close`,
      schema: MeetingSessionPublicSchema,
      auth: true
    })
} as const;
