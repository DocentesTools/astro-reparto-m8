import {
  DepartmentHeadSseEventDataSchema,
  SharedScreenSseEventDataSchema,
  SseEventTypeSchema,
  SseGapDataSchema,
  TeacherSseEventDataSchema,
  type DepartmentHeadSseEventData,
  type SharedScreenSseEventData,
  type SseAudience,
  type SseEventType,
  type SseGapData,
  type TeacherSseEventData
} from "./schemas.js";
import { repartoKeys } from "./queryKeys.js";

export type RepartoSseEvent = {
  eventType: SseEventType;
  data:
    | DepartmentHeadSseEventData
    | TeacherSseEventData
    | SharedScreenSseEventData
    | SseGapData;
  sequence: number | null;
};

/**
 * Parse one named SSE frame through the exact role projection requested by the
 * client. Event names and body event types must agree; display code never
 * branches on unvalidated JSON or on payload prose.
 */
export function parseRepartoSseEvent(
  eventName: string,
  jsonData: string,
  audience: SseAudience
): RepartoSseEvent {
  const eventType = SseEventTypeSchema.parse(eventName);
  const value: unknown = JSON.parse(jsonData);
  if (eventType === "stream.gap") {
    return {
      eventType,
      data: SseGapDataSchema.parse(value),
      sequence: null
    };
  }

  const schema =
    audience === "department_head"
      ? DepartmentHeadSseEventDataSchema
      : audience === "teacher"
        ? TeacherSseEventDataSchema
        : SharedScreenSseEventDataSchema;
  const data = schema.parse(value);
  const payloadEventType =
    "event_type" in data && typeof data.event_type === "string"
      ? data.event_type
      : null;
  if (payloadEventType !== null && payloadEventType !== eventType) {
    throw new Error(
      `SSE event name ${eventType} does not match payload ${payloadEventType}.`
    );
  }
  return {
    eventType,
    data,
    sequence:
      "sequence" in data && typeof data.sequence === "number"
        ? data.sequence
        : null
  };
}

export type RepartoSseCursor = {
  lastEventAtMs: number | null;
  lastSequence: number | null;
};

export type RepartoSseCursorUpdate = {
  cursor: RepartoSseCursor;
  requiresFullRefetch: boolean;
};

export const INITIAL_REPARTO_SSE_CURSOR: RepartoSseCursor = {
  lastEventAtMs: null,
  lastSequence: null
};

/**
 * Advance continuity state for one validated frame.
 *
 * `stream.opened` always refetches because this transport is best effort and
 * does not replay changes missed while disconnected. The first domain sequence
 * after an opening establishes a new baseline. The broker sequence is global
 * across process topics, so forward jumps are valid; only a non-increasing
 * value proves stale/out-of-order data. Explicit gap frames force another full
 * process refetch.
 */
export function advanceRepartoSseCursor(
  cursor: RepartoSseCursor,
  event: RepartoSseEvent,
  receivedAtMs: number
): RepartoSseCursorUpdate {
  if (event.eventType === "stream.opened") {
    return {
      cursor: { lastEventAtMs: receivedAtMs, lastSequence: null },
      requiresFullRefetch: true
    };
  }
  if (event.eventType === "stream.gap") {
    return {
      cursor: { ...cursor, lastEventAtMs: receivedAtMs },
      requiresFullRefetch: true
    };
  }

  const sequence = event.sequence;
  const requiresFullRefetch =
    cursor.lastSequence !== null &&
    sequence !== null &&
    sequence <= cursor.lastSequence;
  return {
    cursor: { lastEventAtMs: receivedAtMs, lastSequence: sequence },
    requiresFullRefetch
  };
}

export type RepartoQueryKey = readonly unknown[];

/** Query projections made stale by one process event. */
export function repartoSseInvalidationKeys(
  processId: string,
  eventType: SseEventType
): readonly RepartoQueryKey[] {
  switch (eventType) {
    case "stream.opened":
    case "stream.gap":
      return [repartoKeys.process(processId)];
    case "allocation.revised":
      return [
        repartoKeys.allocationRevisions(processId),
        repartoKeys.teachingPlan(processId),
        repartoKeys.dashboard(processId),
        repartoKeys.summary(processId),
        repartoKeys.teacherLan(processId),
        repartoKeys.auditEvents(processId)
      ];
    case "teaching_plan.updated":
    case "teaching_plan.balanced":
    case "teaching_plan.locked":
    case "teaching_plan.stale":
      return [
        repartoKeys.teachingPlan(processId),
        repartoKeys.dashboard(processId),
        repartoKeys.summary(processId),
        repartoKeys.teacherLan(processId),
        repartoKeys.auditEvents(processId)
      ];
    case "requirements.generated":
    case "requirements.reconciled":
    case "requirements.reconciliation_required":
      return [
        repartoKeys.hourRequirements(processId),
        repartoKeys.teachingPlan(processId),
        repartoKeys.assignments(processId),
        repartoKeys.dashboard(processId),
        repartoKeys.summary(processId),
        repartoKeys.teacherLan(processId),
        repartoKeys.auditEvents(processId)
      ];
    case "participant.extra_hours_updated":
      return [
        repartoKeys.processTeachers(processId),
        repartoKeys.teachingPlan(processId),
        repartoKeys.assignments(processId),
        repartoKeys.dashboard(processId),
        repartoKeys.summary(processId),
        repartoKeys.teacherLan(processId),
        repartoKeys.auditEvents(processId)
      ];
  }
}
