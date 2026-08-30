import type { FeasibilityStatus, PlanBalance, PlanReadiness } from "../schemas.js";

/**
 * The three independent invariants of a process (backend plan §20.19 8/8.7).
 *
 * Group balance, teacher-load balance and assignment feasibility. They are
 * three, they are independent, and none of them is derivable from the others:
 * §3.2's co-teaching example is 120 group hours against 124 teacher-load hours
 * with *both* balanced, and §20.19 4/5.2 makes feasibility a separate field
 * rather than a plan status, so a balanced plan may still be INFEASIBLE. A view
 * that collapses them into one "ready" pill hides which of the three is the
 * reason — that pill was the retired `overview-state` slot and it does not come
 * back.
 */
export type ProcessInvariantKey = "group" | "teacher" | "feasibility";

/** State of one balance axis; `unknown` when the process has no plan at all. */
export type BalanceInvariantState = "balanced" | "unbalanced" | "unknown";

/**
 * Where the feasibility invariant's value came from, and therefore how precise
 * it is.
 *
 * `plan` is the stored `feasibility_status` of the teaching plan, which §20.20
 * and §21.1 expose to a department head only. `readiness` is the coarse
 * role-safe projection every tier already receives (§20.25: a shared screen sees
 * exactly ready / not ready / recalculation required). The source is reported
 * rather than inferred so a skin or a test can tell the authoritative status
 * from the projection instead of guessing from the value.
 */
export type FeasibilityInvariantSource = "plan" | "readiness";

export type ProcessInvariant =
  | {
      key: "group" | "teacher";
      source: "balance";
      state: BalanceInvariantState;
    }
  | { key: "feasibility"; source: "plan"; state: FeasibilityStatus }
  | { key: "feasibility"; source: "readiness"; state: PlanReadiness };

export type ProcessInvariantInput = {
  balance: PlanBalance | null | undefined;
  /**
   * The plan's stored feasibility status, on a department-head surface that
   * holds the teaching-plan payload. Absent — including while the plan request
   * has not answered, and on every teacher or shared-screen surface, which must
   * never receive it — falls back to the role-safe readiness projection.
   */
  feasibility?: FeasibilityStatus | null;
  readiness: PlanReadiness;
};

function balanceState(isBalanced: boolean | undefined): BalanceInvariantState {
  // Absent is not "unbalanced". A process with no plan has no balance to be on
  // either side of, and reporting it as unbalanced would state a fact the
  // service has not.
  return isBalanced === undefined ? "unknown" : isBalanced ? "balanced" : "unbalanced";
}

/**
 * Build the three invariants for one process, in a stable order.
 *
 * Pure and framework-neutral: it decides *what* the three slots say, never how
 * they are rendered, and it always returns three — there is no input under
 * which the row degrades to a single verdict.
 */
export function buildProcessInvariants(
  input: ProcessInvariantInput
): readonly [ProcessInvariant, ProcessInvariant, ProcessInvariant] {
  const balance = input.balance ?? null;
  const feasibility = input.feasibility ?? null;
  return [
    {
      key: "group",
      source: "balance",
      state: balanceState(balance?.group.is_balanced)
    },
    {
      key: "teacher",
      source: "balance",
      state: balanceState(balance?.teacher.is_balanced)
    },
    feasibility === null
      ? { key: "feasibility", source: "readiness", state: input.readiness }
      : { key: "feasibility", source: "plan", state: feasibility }
  ];
}
