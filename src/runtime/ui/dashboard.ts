import type { ParticipantBalance, ProcessDashboard, ProcessSummary } from "../schemas.js";

/**
 * Count participants by state, the same way the service's `/summary` endpoint
 * does (`DashboardController._participant_state_counts`): read off the
 * per-participant `state` the assignment summary already carries, never
 * re-derived from raw hours, so a client-side projection can never disagree
 * with the service's own count of the same rows.
 */
function countParticipantsByState(participants: readonly ParticipantBalance[]): {
  balanced: number;
  pending: number;
  overloaded: number;
} {
  let balanced = 0;
  let pending = 0;
  let overloaded = 0;
  for (const participant of participants) {
    if (participant.state === "balanced") balanced += 1;
    else if (participant.state === "pending") pending += 1;
    else if (participant.state === "overloaded_authorized") overloaded += 1;
  }
  return { balanced, pending, overloaded };
}

/**
 * Project the full dashboard onto the lightweight summary payload.
 *
 * A view that already holds a `ProcessDashboard` must not fetch `/summary` as
 * well — that is a second round trip whose answer can disagree with the first
 * on screen. The projection is a strict narrowing: every field comes from the
 * dashboard, the slot counts from its assignment section, and nothing is
 * recomputed. In particular `blocking_validation_count` is copied rather than
 * re-summed from the two reports, because the service's sum is the authority
 * and a client that adds them itself will drift the day a third stage appears.
 * The three participant-state counts are the one exception: the dashboard
 * carries the per-participant rows the summary endpoint does not, so they are
 * counted here from the same `state` field the service counts from.
 *
 * The projection deliberately drops the per-participant rows and both message
 * lists: what is left names no teacher, which is the same property that makes
 * `/summary` safe to project (backend plan §8.7, `RBAC-07`). It is *not* a
 * substitute for calling `/summary` on a screen that must never receive the
 * identifying rows in the first place — a redaction applied after the payload
 * arrived is not a redaction at all.
 */
export function summarizeProcessDashboard(
  dashboard: ProcessDashboard
): ProcessSummary {
  const counts = countParticipantsByState(dashboard.assignment.summary.participants);
  return {
    process_id: dashboard.process_id,
    generated_at: dashboard.generated_at,
    readiness: dashboard.readiness,
    plan_status: dashboard.planning.status,
    plan_balance: dashboard.planning.balance,
    total_slots: dashboard.assignment.summary.total_slots,
    assigned_slots: dashboard.assignment.summary.assigned_slots,
    available_slots: dashboard.assignment.summary.available_slots,
    balanced_participant_count: counts.balanced,
    pending_participant_count: counts.pending,
    overloaded_participant_count: counts.overloaded,
    current_turn: dashboard.current_turn,
    blocking_validation_count: dashboard.blocking_validation_count
  };
}
