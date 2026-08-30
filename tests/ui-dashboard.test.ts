import { describe, expect, it } from "vitest";

import { summarizeProcessDashboard } from "../src/runtime/ui/dashboard.js";
import type { ParticipantBalance, ProcessDashboard } from "../src/runtime/schemas.js";

const processId = "11111111-1111-4111-8111-111111111111";
const now = "2026-08-29T10:00:00Z";

function participant(
  overrides: Partial<ParticipantBalance> & Pick<ParticipantBalance, "process_teacher_id" | "state">
): ParticipantBalance {
  return {
    teacher_profile_id: "22222222-2222-4222-8222-222222222222",
    display_name: "Someone",
    base_weekly_hours: "18.00",
    extra_weekly_hours: "0.00",
    target_weekly_hours: "18.00",
    assigned_weekly_hours: "0.00",
    remaining_weekly_hours: "18.00",
    is_overloaded: false,
    assignment_count: 0,
    ...overrides
  };
}

function dashboardWith(participants: ParticipantBalance[]): ProcessDashboard {
  return {
    process_id: processId,
    generated_at: now,
    readiness: "ready",
    planning: { teaching_plan_id: null, status: null, balance: null, validations: null },
    assignment: {
      summary: {
        assignment_process_id: processId,
        total_target_hours: "0.00",
        total_assigned_hours: "0.00",
        total_remaining_hours: "0.00",
        total_slots: 0,
        assigned_slots: 0,
        available_slots: 0,
        participants
      },
      validations: {
        assignment_process_id: processId,
        is_final_ready: false,
        blocking_count: 0,
        warning_count: 0,
        messages: []
      }
    },
    current_turn: null,
    blocking_validation_count: 0
  };
}

describe("summarizeProcessDashboard", () => {
  it("counts every participant state exactly once, off the same `state` field the service counts from", () => {
    const dashboard = dashboardWith([
      participant({ process_teacher_id: "a", state: "balanced" }),
      participant({ process_teacher_id: "b", state: "pending" }),
      participant({ process_teacher_id: "c", state: "pending" }),
      participant({ process_teacher_id: "d", state: "overloaded_authorized" }),
      // INACTIVE and NOT_PARTICIPATING land in none of the three counts —
      // proving they are excluded rather than silently folded into one.
      participant({ process_teacher_id: "e", state: "inactive" }),
      participant({ process_teacher_id: "f", state: "not_participating" })
    ]);

    const summary = summarizeProcessDashboard(dashboard);

    expect(summary.balanced_participant_count).toBe(1);
    expect(summary.pending_participant_count).toBe(2);
    expect(summary.overloaded_participant_count).toBe(1);
  });

  it("returns all-zero counts for a process with no participants", () => {
    const summary = summarizeProcessDashboard(dashboardWith([]));

    expect(summary.balanced_participant_count).toBe(0);
    expect(summary.pending_participant_count).toBe(0);
    expect(summary.overloaded_participant_count).toBe(0);
  });
});
