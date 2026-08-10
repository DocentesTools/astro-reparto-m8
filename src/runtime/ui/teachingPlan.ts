import { RepartoApiError } from "../errors.js";
import type { TeachingPlanPublic } from "../schemas.js";

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
