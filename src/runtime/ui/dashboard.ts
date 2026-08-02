import type { ProcessDashboard, ProcessSummary } from "../schemas.js";

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
  return {
    process_id: dashboard.process_id,
    generated_at: dashboard.generated_at,
    readiness: dashboard.readiness,
    plan_status: dashboard.planning.status,
    plan_balance: dashboard.planning.balance,
    total_slots: dashboard.assignment.summary.total_slots,
    assigned_slots: dashboard.assignment.summary.assigned_slots,
    available_slots: dashboard.assignment.summary.available_slots,
    current_turn: dashboard.current_turn,
    blocking_validation_count: dashboard.blocking_validation_count
  };
}
