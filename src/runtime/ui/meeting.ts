import type { ProcessSummary } from "../schemas.js";

/**
 * Why the meeting control cannot act, as a stable code.
 *
 * Codes, not sentences: the dictionary translates them and nothing branches on
 * display text. They are the department-head twin of the teacher panel's
 * `TeacherChoiceDisabledReason`, and they answer the same question from the
 * other side of the room — the head must not be offered a turn control the
 * service would refuse.
 */
export type MeetingControlBlockedReason =
  | "no_process_data"
  | "plan_not_ready"
  | "reconciliation_required";

/** One turn control and whether it can be pressed. */
export type MeetingTurnAction = {
  key: "initialize-turns" | "start-turn" | "complete-turn" | "skip-turn" | "override-turn";
  disabled: boolean;
  /** Stable reason code, or `null` when the action is available. */
  reason: MeetingControlBlockedReason | "turn_active" | "no_active_turn" | null;
};

export type MeetingControlState = {
  selectionBlocked: boolean;
  blockedReason: MeetingControlBlockedReason | null;
  /** The plan changed after generation and the service has said so. */
  planStale: boolean;
  /** An allocation change must be reconciled before selection continues. */
  reconciliationRequired: boolean;
  totalSlots: number;
  assignedSlots: number;
  /** Live slots still unassigned — what is left for the meeting to hand out. */
  pendingSlots: number;
  turnActive: boolean;
  actions: readonly MeetingTurnAction[];
};

/**
 * What the meeting control may do, derived from the service's own gate state.
 *
 * Fail closed twice over. With no summary at all every control is disabled and
 * the reason is `no_process_data`: a control room must never imply the meeting
 * can proceed because a request has not answered yet. And the blocked reason is
 * taken from `readiness` **and** `plan_status` together — `readiness` is the
 * coarse projection the service publishes for the LAN and shared tiers, while a
 * `stale` or `reconciliation_required` plan is the head's own detail. Either one
 * blocks; neither is inferred from the other.
 *
 * Nothing here decides *whether the service will accept* a turn action — that is
 * the backend's lifecycle gate and it stays there. This decides only what the
 * control room is offered, so a head is not handed a button whose refusal is
 * already known.
 */
export function buildMeetingControlState(
  summary: ProcessSummary | null | undefined
): MeetingControlState {
  const planStale = summary?.plan_status === "stale";
  const reconciliationRequired =
    summary?.readiness === "recalculation_required" ||
    summary?.plan_status === "reconciliation_required";
  const blockedReason: MeetingControlBlockedReason | null = !summary
    ? "no_process_data"
    : reconciliationRequired
      ? "reconciliation_required"
      : summary.readiness === "not_ready"
        ? "plan_not_ready"
        : null;
  const turnActive = Boolean(summary?.current_turn);
  const actions: readonly MeetingTurnAction[] = [
    {
      key: "initialize-turns",
      disabled: blockedReason !== null || turnActive,
      reason: blockedReason ?? (turnActive ? "turn_active" : null)
    },
    {
      key: "start-turn",
      disabled: blockedReason !== null,
      reason: blockedReason
    },
    {
      key: "complete-turn",
      disabled: blockedReason !== null || !turnActive,
      reason: blockedReason ?? (turnActive ? null : "no_active_turn")
    },
    {
      key: "skip-turn",
      disabled: blockedReason !== null || !turnActive,
      reason: blockedReason ?? (turnActive ? null : "no_active_turn")
    },
    {
      key: "override-turn",
      disabled: blockedReason !== null || !turnActive,
      reason: blockedReason ?? (turnActive ? null : "no_active_turn")
    }
  ];
  return {
    selectionBlocked: blockedReason !== null,
    blockedReason,
    planStale,
    reconciliationRequired,
    totalSlots: summary?.total_slots ?? 0,
    assignedSlots: summary?.assigned_slots ?? 0,
    pendingSlots: summary?.available_slots ?? 0,
    turnActive,
    actions
  };
}
