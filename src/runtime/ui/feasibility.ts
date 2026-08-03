import type {
  FeasibilityDiagnosticCode,
  FeasibilityDiagnosticsReport,
  FeasibilityStatus,
  TeachingPlanPublic
} from "../schemas.js";

/**
 * Department-head feasibility diagnostics (backend plan §7.3, §20.20, §20.24).
 *
 * The solver's findings are administration-only: they name the concrete slots
 * or activities a remediation must touch, so they must never reach the teacher
 * or shared-screen tiers. This helper decides *what* the department-head panel
 * says — never how it is rendered — and it keeps three rules in one place:
 *
 * 1. diagnostics are only requested when the stored status says there could
 *    be any (`INFEASIBLE`/`UNKNOWN`; `FEASIBLE` persists an empty list and
 *    `NOT_EVALUATED` has no evaluation at all);
 * 2. what a finding's `related_ids` mean is decided by its stable code, never
 *    guessed from the payload;
 * 3. an identifier that cannot be resolved to a current entity is counted,
 *    never printed — a raw UUID is not a user-facing label.
 */

/** What one diagnostic's `related_ids` refer to. */
export type FeasibilityRelatedKind = "activity" | "slot" | "none";

/**
 * Map a stable diagnostic code to the kind of entity its `related_ids` carry.
 *
 * The wire format is one flat identifier list; only the code says whether the
 * identifiers are requirement slots (`slot_exceeds_every_target`) or teaching
 * activities (`distinct_teacher_shortfall`). Every other code ships no
 * identifiers, and any it unexpectedly does ship are treated as unresolvable
 * rather than reinterpreted.
 */
export function feasibilityRelatedKind(
  code: FeasibilityDiagnosticCode
): FeasibilityRelatedKind {
  switch (code) {
    case "slot_exceeds_every_target":
      return "slot";
    case "distinct_teacher_shortfall":
      return "activity";
    default:
      return "none";
  }
}

/** Display-label resolution the rendering layer supplies. */
export type FeasibilityDiagnosticsLookup = {
  /** Resolve a teaching-activity id to its display label, or `null`. */
  activityLabel: (activityId: string) => string | null;
  /** Resolve a requirement-slot id to its display label, or `null`. */
  slotLabel: (slotId: string) => string | null;
};

/** The fail-closed lookup: nothing resolves, so nothing leaks. */
export const EMPTY_FEASIBILITY_LOOKUP: FeasibilityDiagnosticsLookup = {
  activityLabel: () => null,
  slotLabel: () => null
};

/** One finding row, ready for the dictionary-driven rendering layer. */
export type FeasibilityDiagnosticRow = {
  /** Stable machine key; the dictionary carries the suggestion text per key. */
  code: FeasibilityDiagnosticCode;
  /** The service's own explanation, passed through untranslated. */
  message: string;
  /** Resolved display labels of the affected activities/slots, in order. */
  affected: readonly string[];
  /**
   * Related identifiers that could not be resolved to a current entity (for
   * example a prospective slot of an intended generation). They are counted
   * so the panel can say how much it could not show, never printed.
   */
  unresolvedCount: number;
};

/**
 * Build the finding rows for one diagnostics report.
 *
 * Pure and framework-neutral. A missing report is zero rows, not an error:
 * the query layer owns the failure states (409 = a fresh evaluation is
 * required) and the panel renders them from the query, not from here.
 */
export function buildFeasibilityDiagnosticRows(
  report: FeasibilityDiagnosticsReport | null | undefined,
  lookup: FeasibilityDiagnosticsLookup = EMPTY_FEASIBILITY_LOOKUP
): FeasibilityDiagnosticRow[] {
  return (report?.diagnostics ?? []).map((diagnostic) => {
    const kind = feasibilityRelatedKind(diagnostic.code);
    const resolve =
      kind === "activity"
        ? lookup.activityLabel
        : kind === "slot"
          ? lookup.slotLabel
          : null;
    const affected: string[] = [];
    let unresolvedCount = 0;
    for (const id of diagnostic.related_ids) {
      const label = resolve?.(id) ?? null;
      if (label === null) {
        unresolvedCount += 1;
      } else {
        affected.push(label);
      }
    }
    return {
      code: diagnostic.code,
      message: diagnostic.message,
      affected,
      unresolvedCount
    };
  });
}

/**
 * Whether the diagnostics endpoint could hold findings for this status.
 *
 * `FEASIBLE` persists an empty finding list by definition and `NOT_EVALUATED`
 * has no persisted evaluation at all, so only the two negative outcomes
 * justify the department-head-only request — and the endpoint fails closed
 * with 409 for everything stale, so a request is never fired to learn "no".
 */
export function isFeasibilityDiagnosticsExpected(
  status: FeasibilityStatus | null | undefined
): boolean {
  return status === "infeasible" || status === "unknown";
}

/** What the department-head diagnostics panel should show. */
export type FeasibilityPanelState =
  | { kind: "no_plan" }
  | { kind: "not_evaluated" }
  | {
      kind: "evaluated";
      /** The stored status; the panel never recomputes it. */
      status: "feasible" | "infeasible" | "unknown";
      /** Service provenance of the stored evaluation; both may be absent. */
      checkedAt: string | null;
      solverVersion: string | null;
      /** Whether a diagnostics request is justified for this status. */
      diagnosticsExpected: boolean;
      rows: readonly FeasibilityDiagnosticRow[];
    };

/**
 * Build the panel state from the plan the head already holds plus the
 * (optional) diagnostics report.
 *
 * Absent is not zero: a missing plan is its own state, and a plan whose
 * stored status is `not_evaluated` says "run an evaluation", not "no
 * findings". Staleness is never decided client-side — the endpoint's 409 is
 * the only authority, matching the witness contract (§20.24).
 */
export function buildFeasibilityPanelState(input: {
  plan: TeachingPlanPublic | null | undefined;
  report?: FeasibilityDiagnosticsReport | null;
  lookup?: FeasibilityDiagnosticsLookup;
}): FeasibilityPanelState {
  const plan = input.plan ?? null;
  if (plan === null) {
    return { kind: "no_plan" };
  }
  const status = plan.feasibility_status;
  if (status === "not_evaluated") {
    return { kind: "not_evaluated" };
  }
  return {
    kind: "evaluated",
    status,
    checkedAt: plan.feasibility_checked_at,
    solverVersion: plan.feasibility_solver_version,
    diagnosticsExpected: isFeasibilityDiagnosticsExpected(status),
    rows: buildFeasibilityDiagnosticRows(
      input.report ?? null,
      input.lookup ?? EMPTY_FEASIBILITY_LOOKUP
    )
  };
}
