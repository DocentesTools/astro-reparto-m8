import { describe, expect, it } from "vitest";

import {
  blockingFindingsAgainstLock,
  isPlanLockAvailable
} from "../src/runtime/react/default-ui/planning/plan-generation.js";
import type {
  PlanValidationMessage,
  PlanValidationReport,
  TeachingPlanPublic
} from "../src/runtime/schemas.js";

/**
 * §13.6 walk-through finding: the lock button was disabled on every plan that
 * had actually become lockable.
 *
 * The predicate required `blocking_count === 0`, and a balanced, feasible,
 * pre-generation plan always carries exactly one blocking finding —
 * `plan.requirements_not_generated` — because generation runs *on a locked
 * plan*. Lock and generation were each other's precondition, and Stage 2 could
 * not be finished on the live stack. The service's own lock gate never had that
 * condition, so the client was refusing what the service would have allowed.
 */

const PLAN = {
  status: "balanced",
  feasibility_status: "feasible",
  current_generation_number: 0
} as unknown as TeachingPlanPublic;

function message(
  code: string,
  severity: PlanValidationMessage["severity"] = "blocking"
): PlanValidationMessage {
  return {
    severity,
    code,
    message: code,
    entity_type: "teaching_plan",
    entity_id: null
  };
}

function report(messages: PlanValidationMessage[]): PlanValidationReport {
  return {
    teaching_plan_id: "11111111-1111-4111-8111-111111111111",
    assignment_process_id: "22222222-2222-4222-8222-222222222222",
    is_assignment_ready: false,
    blocking_count: messages.filter((m) => m.severity === "blocking").length,
    warning_count: messages.filter((m) => m.severity === "warning").length,
    messages
  };
}

describe("isPlanLockAvailable", () => {
  it("allows the lock when the only blocking finding is the ungenerated slots", () => {
    const r = report([message("plan.requirements_not_generated")]);
    expect(r.blocking_count).toBe(1);
    expect(blockingFindingsAgainstLock(r)).toBe(0);
    expect(isPlanLockAvailable(PLAN, r)).toBe(true);
  });

  it("still refuses the lock for any other blocking finding", () => {
    const r = report([
      message("plan.requirements_not_generated"),
      message("plan.group_hours_not_exact")
    ]);
    expect(blockingFindingsAgainstLock(r)).toBe(1);
    expect(isPlanLockAvailable(PLAN, r)).toBe(false);
  });

  it("ignores warnings, which never blocked the lock", () => {
    const r = report([message("participant.overloaded", "warning")]);
    expect(isPlanLockAvailable(PLAN, r)).toBe(true);
  });

  it("refuses an unbalanced or unevaluated plan whatever the findings say", () => {
    const clean = report([]);
    expect(
      isPlanLockAvailable({ ...PLAN, status: "unbalanced" }, clean)
    ).toBe(false);
    expect(
      isPlanLockAvailable({ ...PLAN, feasibility_status: "infeasible" }, clean)
    ).toBe(false);
  });

  it("refuses when no report has been read yet", () => {
    expect(isPlanLockAvailable(PLAN, null)).toBe(false);
    expect(blockingFindingsAgainstLock(null)).toBe(0);
  });
});
