import { describe, expect, it } from "vitest";
import {
  INITIAL_REPARTO_SSE_CURSOR,
  advanceRepartoSseCursor,
  parseRepartoSseEvent,
  repartoSseInvalidationKeys
} from "../src/runtime/sse.js";
import { SseEventTypeSchema } from "../src/runtime/schemas.js";

const processId = "11111111-1111-4111-8111-111111111111";
const participantId = "22222222-2222-4222-8222-222222222222";
const occurredAt = "2026-08-02T10:00:00Z";

function departmentHeadData(eventType: string, sequence = 7) {
  return JSON.stringify({
    event_type: eventType,
    process_id: processId,
    sequence,
    occurred_at: occurredAt,
    readiness: "ready",
    selection_blocked: false,
    payload: { generation_number: 2 },
    subject_process_teacher_id: null
  });
}

describe("reparto SSE contract", () => {
  it("parses department-head, teacher, shared-screen and gap projections", () => {
    expect(
      parseRepartoSseEvent(
        "requirements.generated",
        departmentHeadData("requirements.generated"),
        "department_head"
      )
    ).toMatchObject({ eventType: "requirements.generated", sequence: 7 });

    expect(
      parseRepartoSseEvent(
        "participant.extra_hours_updated",
        JSON.stringify({
          event_type: "participant.extra_hours_updated",
          process_id: processId,
          sequence: 8,
          occurred_at: occurredAt,
          readiness: "ready",
          selection_blocked: false,
          process_teacher_id: participantId,
          payload: { target_weekly_hours: "20.00" }
        }),
        "teacher"
      )
    ).toMatchObject({
      eventType: "participant.extra_hours_updated",
      sequence: 8,
      data: { process_teacher_id: participantId }
    });

    expect(
      parseRepartoSseEvent(
        "teaching_plan.stale",
        JSON.stringify({ readiness: "recalculation_required" }),
        "shared_screen"
      )
    ).toEqual({
      eventType: "teaching_plan.stale",
      sequence: null,
      data: { readiness: "recalculation_required" }
    });

    expect(
      parseRepartoSseEvent(
        "stream.gap",
        JSON.stringify({ dropped: 3, detail: "refetch" }),
        "teacher"
      )
    ).toEqual({
      eventType: "stream.gap",
      sequence: null,
      data: { dropped: 3, detail: "refetch" }
    });
  });

  it("fails closed on unknown, malformed, mismatched or over-broad frames", () => {
    expect(() =>
      parseRepartoSseEvent("unknown", "{}", "teacher")
    ).toThrow();
    expect(() =>
      parseRepartoSseEvent("stream.gap", "not-json", "teacher")
    ).toThrow();
    expect(() =>
      parseRepartoSseEvent(
        "teaching_plan.locked",
        departmentHeadData("teaching_plan.stale"),
        "department_head"
      )
    ).toThrow(/does not match/);
    expect(() =>
      parseRepartoSseEvent(
        "teaching_plan.updated",
        JSON.stringify({ readiness: "ready", process_id: processId }),
        "shared_screen"
      )
    ).toThrow();
  });

  it("detects reconnects, explicit gaps and non-increasing broker sequences", () => {
    const opened = parseRepartoSseEvent(
      "stream.opened",
      departmentHeadData("stream.opened", 0),
      "department_head"
    );
    const first = parseRepartoSseEvent(
      "allocation.revised",
      departmentHeadData("allocation.revised", 10),
      "department_head"
    );
    const next = parseRepartoSseEvent(
      "teaching_plan.stale",
      departmentHeadData("teaching_plan.stale", 11),
      "department_head"
    );
    const forwardJump = parseRepartoSseEvent(
      "requirements.reconciliation_required",
      departmentHeadData("requirements.reconciliation_required", 13),
      "department_head"
    );
    const repeated = parseRepartoSseEvent(
      "requirements.generated",
      departmentHeadData("requirements.generated", 10),
      "department_head"
    );
    const gap = parseRepartoSseEvent(
      "stream.gap",
      JSON.stringify({ dropped: 1, detail: "refetch" }),
      "shared_screen"
    );

    const baseline = advanceRepartoSseCursor(
      INITIAL_REPARTO_SSE_CURSOR,
      opened,
      100
    );
    expect(baseline).toEqual({
      cursor: { lastEventAtMs: 100, lastSequence: null },
      requiresFullRefetch: true
    });
    const established = advanceRepartoSseCursor(baseline.cursor, first, 110);
    expect(established.requiresFullRefetch).toBe(false);
    expect(advanceRepartoSseCursor(established.cursor, next, 120)).toMatchObject({
      cursor: { lastSequence: 11 },
      requiresFullRefetch: false
    });
    expect(advanceRepartoSseCursor(established.cursor, forwardJump, 130)).toMatchObject({
      cursor: { lastSequence: 13 },
      requiresFullRefetch: false
    });
    expect(advanceRepartoSseCursor(established.cursor, repeated, 135)).toMatchObject({
      cursor: { lastSequence: 10 },
      requiresFullRefetch: true
    });
    expect(advanceRepartoSseCursor(established.cursor, gap, 140)).toEqual({
      cursor: { lastEventAtMs: 140, lastSequence: 10 },
      requiresFullRefetch: true
    });
  });

  it("maps every registered event to process-scoped cache projections", () => {
    const keysByType = Object.fromEntries(
      SseEventTypeSchema.options.map((eventType) => [
        eventType,
        repartoSseInvalidationKeys(processId, eventType)
      ])
    );

    for (const keys of Object.values(keysByType)) {
      expect(keys.length).toBeGreaterThan(0);
      expect(keys.every((key) => key[0] === "reparto")).toBe(true);
    }
    expect(keysByType["stream.opened"]).toEqual([
      ["reparto", "processes", "detail", processId]
    ]);
    expect(keysByType["allocation.revised"]).toContainEqual([
      "reparto",
      "processes",
      "detail",
      processId,
      "allocation-revisions"
    ]);
    expect(keysByType["participant.extra_hours_updated"]).toContainEqual([
      "reparto",
      "processes",
      "detail",
      processId,
      "teachers"
    ]);
  });

  it("drops the plan projection on either feasibility transition", () => {
    // The diagnostics and witness projections are nested under the plan prefix,
    // so one key is what stops a stale department-head verdict from surviving a
    // transition — and the LAN/summary payloads carry the coarse readiness the
    // lower tiers show, so they go with it.
    for (const eventType of [
      "teaching_plan.feasibility_updated",
      "teaching_plan.feasibility_invalidated"
    ] as const) {
      const keys = repartoSseInvalidationKeys(processId, eventType);
      expect(keys).toEqual([
        ["reparto", "processes", "detail", processId, "teaching-plan"],
        ["reparto", "processes", "detail", processId, "dashboard"],
        ["reparto", "processes", "detail", processId, "summary"],
        ["reparto", "processes", "detail", processId, "teacher-lan"]
      ]);
    }
  });

  it("projects a feasibility frame per tier without leaking the head payload", () => {
    // The backend sends each tier its own body; the client must accept the
    // teacher and shared-screen shapes for these event names too, and must not
    // require the department-head fields to be present (plan §20.25).
    const teacherFrame = JSON.stringify({
      event_type: "teaching_plan.feasibility_invalidated",
      process_id: processId,
      sequence: 12,
      occurred_at: occurredAt,
      readiness: "not_ready",
      selection_blocked: true
    });
    expect(
      parseRepartoSseEvent(
        "teaching_plan.feasibility_invalidated",
        teacherFrame,
        "teacher"
      )
    ).toEqual({
      eventType: "teaching_plan.feasibility_invalidated",
      data: {
        event_type: "teaching_plan.feasibility_invalidated",
        process_id: processId,
        sequence: 12,
        occurred_at: occurredAt,
        readiness: "not_ready",
        selection_blocked: true
      },
      sequence: 12
    });
    expect(
      parseRepartoSseEvent(
        "teaching_plan.feasibility_updated",
        JSON.stringify({ readiness: "recalculation_required" }),
        "shared_screen"
      )
    ).toEqual({
      eventType: "teaching_plan.feasibility_updated",
      data: { readiness: "recalculation_required" },
      sequence: null
    });
    // A head payload offered to a teacher subscription is still refused: the
    // strict teacher schema has no `payload` for an event about nobody.
    expect(() =>
      parseRepartoSseEvent(
        "teaching_plan.feasibility_updated",
        departmentHeadData("teaching_plan.feasibility_updated"),
        "teacher"
      )
    ).toThrow();
  });
});
