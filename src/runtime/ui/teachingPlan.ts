import { RepartoApiError } from "../errors.js";
import type { TeachingPlanPublic, TeachingPlanStatus } from "../schemas.js";

/**
 * What the teaching-plan read proves, and whether creation may be offered
 * (backend plan §8.3, audit finding `S2-01`).
 *
 * An assignment process owns at most one teaching plan and the row is not
 * created with the process, so `GET …/teaching-plan` answers **404 until an
 * operator creates it**. That 404 is the documented empty state, not a failed
 * request: every Stage 2 read (summary, validations, feasibility) answers the
 * same way, and `materialize_main` / `create_activity` / `update_activity`
 * refuse through `_require_mutable_plan`. Presenting it as a transport failure
 * tells the operator something is broken when the only thing missing is a
 * button press.
 *
 * The distinction lives here, once, so that the panel, the balance header and
 * any future surface agree on it without each re-deriving a status check.
 */

/** A 404 on a plan read means "no plan yet", never "the read failed". */
export function isMissingTeachingPlanError(error: unknown): boolean {
  return error instanceof RepartoApiError && error.status === 404;
}

/**
 * A 409 on `POST …/teaching-plan` means the plan already exists — a second
 * attempt, or a concurrent operator, not a rejected request.
 */
export function isDuplicateTeachingPlanError(error: unknown): boolean {
  return error instanceof RepartoApiError && error.status === 409;
}

/** What the plan read currently proves about the plan's existence. */
export type TeachingPlanPresence =
  /** The read has not settled, or there is no process to read for. */
  | "unknown"
  /** The read settled with a 404: no plan has been created yet. */
  | "absent"
  /** The plan exists. */
  | "present"
  /** The read failed for a reason other than absence. */
  | "unavailable";

/** Why the create affordance is withheld, when it is. */
export type TeachingPlanCreationBlockedReason =
  | "pending"
  | "already-exists"
  | "unavailable"
  | "read-only";

export type TeachingPlanCreationState = {
  presence: TeachingPlanPresence;
  canCreate: boolean;
  blockedReason: TeachingPlanCreationBlockedReason | null;
};

/**
 * Decide what the plan-creation surface says.
 *
 * `canAct` is the caller's `admin` write floor for the `planning` route and is
 * never inferred here; an unwired control is a dead end, not an affordance, so
 * `canCreate` is false whenever the press could not succeed.
 */
export function buildTeachingPlanCreationState({
  canAct,
  error,
  isLoading,
  plan
}: {
  canAct: boolean;
  error: unknown;
  isLoading: boolean;
  plan: TeachingPlanPublic | null;
}): TeachingPlanCreationState {
  if (plan !== null) {
    return {
      presence: "present",
      canCreate: false,
      blockedReason: "already-exists"
    };
  }
  if (isLoading) {
    return { presence: "unknown", canCreate: false, blockedReason: "pending" };
  }
  if (isMissingTeachingPlanError(error)) {
    return {
      presence: "absent",
      canCreate: canAct,
      blockedReason: canAct ? null : "read-only"
    };
  }
  if (error) {
    return {
      presence: "unavailable",
      canCreate: false,
      blockedReason: "unavailable"
    };
  }
  return { presence: "unknown", canCreate: false, blockedReason: "pending" };
}

/**
 * The plan statuses in which the backend still accepts planning mutations.
 *
 * Mirrors `_MUTABLE_PLAN_STATUSES` on the service: outside these three,
 * `_require_mutable_plan` refuses every activity write with *"Teaching plan is
 * {status}; unlock it before mutating activities"*. It is the one honest source
 * for "does an operator need an unlock here?" — a hard-coded list of "locked"
 * elsewhere would drift the moment a status is added.
 */
const MUTABLE_PLAN_STATUSES = new Set(["draft", "unbalanced", "balanced"]);

/**
 * Does the backend still accept planning mutations in this status?
 *
 * Exported so the setup checklist can ask *"has the plan been locked?"* without
 * re-listing the statuses: a locked plan is exactly a plan that is no longer
 * mutable, and one list is the only way that stays true when a status is added.
 */
export function isMutablePlanStatus(status: TeachingPlanStatus): boolean {
  return MUTABLE_PLAN_STATUSES.has(status);
}

/** Why the unlock affordance is withheld, when it is. */
export type TeachingPlanUnlockBlockedReason =
  /** No plan has been read, so there is nothing to unlock. */
  | "absent"
  /** The plan already accepts planning edits. */
  | "already-mutable"
  /**
   * Requirement generation owns the plan (`requirements_generated`, `stale`,
   * `reconciliation_required`). The served endpoint accepts a `locked`
   * pre-generation plan only and answers 409 here, so the way forward is
   * regeneration or reconciliation.
   */
  | "generation-owned"
  /** The session is below the `admin` write floor for `planning`. */
  | "read-only";

export type TeachingPlanUnlockState = {
  /**
   * Planning edits are refused until the plan leaves its current status —
   * §20.14's *"require unlock"*, stated whether or not this surface can grant
   * it.
   */
  requiresUnlock: boolean;
  canUnlock: boolean;
  blockedReason: TeachingPlanUnlockBlockedReason | null;
};

/**
 * Decide what the plan-unlock surface says (audit finding `S2-04`).
 *
 * Two questions, deliberately separate. *Does this plan require an unlock?* is
 * the plan's §20.14/§20.15 statement about itself and is true for every
 * non-mutable status. *May this operator unlock it?* is what the served
 * `POST …/teaching-plan/unlock` will actually accept, which is `locked` alone.
 * They disagree for `stale` and `reconciliation_required`, and collapsing them
 * would either hide the requirement or offer a control that answers 409.
 */
export function buildTeachingPlanUnlockState({
  canAct,
  plan
}: {
  canAct: boolean;
  plan: TeachingPlanPublic | null;
}): TeachingPlanUnlockState {
  if (plan === null) {
    return { requiresUnlock: false, canUnlock: false, blockedReason: "absent" };
  }
  if (MUTABLE_PLAN_STATUSES.has(plan.status)) {
    return {
      requiresUnlock: false,
      canUnlock: false,
      blockedReason: "already-mutable"
    };
  }
  if (plan.status !== "locked") {
    return {
      requiresUnlock: true,
      canUnlock: false,
      blockedReason: "generation-owned"
    };
  }
  return {
    requiresUnlock: true,
    canUnlock: canAct,
    blockedReason: canAct ? null : "read-only"
  };
}
