import { request } from "../client.js";
import {
  SelectionTurnActionSchema,
  SelectionTurnCompleteSchema,
  SelectionTurnPublicSchema,
  SelectionTurnsPublicSchema,
  type SelectionTurnAction,
  type SelectionTurnComplete,
  type SelectionTurnPublic,
  type SelectionTurnsPublic
} from "../schemas.js";

const turnsPath = (processId: string, meetingSessionId: string) =>
  `/assignment-processes/${processId}/meeting-sessions/${meetingSessionId}/turns`;

export const selectionTurns = {
  list: (processId: string, meetingSessionId: string) =>
    request<SelectionTurnsPublic>({
      method: "GET",
      path: `${turnsPath(processId, meetingSessionId)}/`,
      schema: SelectionTurnsPublicSchema,
      auth: true
    }),
  initialize: (processId: string, meetingSessionId: string) =>
    request<SelectionTurnsPublic>({
      method: "POST",
      path: `${turnsPath(processId, meetingSessionId)}/initialize`,
      schema: SelectionTurnsPublicSchema,
      auth: true
    }),
  start: (processId: string, meetingSessionId: string, turnId: string) =>
    request<SelectionTurnPublic>({
      method: "POST",
      path: `${turnsPath(processId, meetingSessionId)}/${turnId}/start`,
      schema: SelectionTurnPublicSchema,
      auth: true
    }),
  complete: (
    processId: string,
    meetingSessionId: string,
    turnId: string,
    body: SelectionTurnComplete = {}
  ) =>
    request<SelectionTurnPublic>({
      method: "POST",
      path: `${turnsPath(processId, meetingSessionId)}/${turnId}/complete`,
      body: SelectionTurnCompleteSchema.parse(body),
      schema: SelectionTurnPublicSchema,
      auth: true
    }),
  skip: (
    processId: string,
    meetingSessionId: string,
    turnId: string,
    body: SelectionTurnAction
  ) =>
    request<SelectionTurnPublic>({
      method: "POST",
      path: `${turnsPath(processId, meetingSessionId)}/${turnId}/skip`,
      body: SelectionTurnActionSchema.parse(body),
      schema: SelectionTurnPublicSchema,
      auth: true
    }),
  override: (
    processId: string,
    meetingSessionId: string,
    turnId: string,
    body: SelectionTurnAction
  ) =>
    request<SelectionTurnPublic>({
      method: "POST",
      path: `${turnsPath(processId, meetingSessionId)}/${turnId}/override`,
      body: SelectionTurnActionSchema.parse(body),
      schema: SelectionTurnPublicSchema,
      auth: true
    })
} as const;
