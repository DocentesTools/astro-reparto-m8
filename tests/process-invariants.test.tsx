import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { buildProcessInvariants } from "../src/runtime/ui/index.js";
import { ProcessInvariantRow } from "../src/runtime/react/DepartmentHeadWorkspace.js";
import { getRepartoDictionary } from "../src/runtime/i18n/index.js";
import type { FeasibilityStatus, PlanBalance } from "../src/runtime/schemas.js";

const processId = "11111111-1111-4111-8111-111111111111";
const planId = "22222222-2222-4222-8222-222222222222";

/** §3.2's co-teaching case: 120 group hours, 124 teacher-load hours, both true. */
const balance: PlanBalance = {
  teaching_plan_id: planId,
  assignment_process_id: processId,
  group: {
    total_group_load: "120.00",
    allocated_group_weekly_hours: "120.00",
    allocation_difference: "0.00",
    is_balanced: true
  },
  teacher: {
    total_teacher_load: "124.00",
    participant_target_total: "120.00",
    teacher_load_difference: "4.00",
    is_balanced: false
  },
  is_exact: false
};

const dict = getRepartoDictionary("en");

describe("buildProcessInvariants", () => {
  it("always returns the three independent invariants, in a stable order", () => {
    const invariants = buildProcessInvariants({ balance, readiness: "ready" });
    expect(invariants).toHaveLength(3);
    expect(invariants.map((invariant) => invariant.key)).toEqual([
      "group",
      "teacher",
      "feasibility"
    ]);
  });

  it("reads each balance axis on its own, never one from the other", () => {
    const [group, teacher] = buildProcessInvariants({ balance, readiness: "ready" });
    expect(group.state).toBe("balanced");
    expect(teacher.state).toBe("unbalanced");
    expect(group.source).toBe("balance");
    expect(teacher.source).toBe("balance");
  });

  it("reports an absent balance as unknown rather than as unbalanced", () => {
    // A process with no plan has no balance to be on either side of; calling it
    // unbalanced would state a fact the service has not.
    for (const input of [{ balance: null }, { balance: undefined }]) {
      const [group, teacher] = buildProcessInvariants({
        ...input,
        readiness: "not_ready"
      });
      expect(group.state).toBe("unknown");
      expect(teacher.state).toBe("unknown");
    }
  });

  it("takes the stored plan status as the feasibility invariant when it has one", () => {
    const statuses: FeasibilityStatus[] = [
      "not_evaluated",
      "feasible",
      "infeasible",
      "unknown"
    ];
    for (const status of statuses) {
      const [, , feasibility] = buildProcessInvariants({
        balance,
        feasibility: status,
        readiness: "ready"
      });
      expect(feasibility).toEqual({
        key: "feasibility",
        source: "plan",
        state: status
      });
    }
  });

  it("falls back to the role-safe readiness projection with no plan status", () => {
    // §20.25: a teacher or a projected screen sees ready / not ready /
    // recalculation required and nothing finer, so the fallback is not a
    // degraded department-head view — it is the whole entitlement of that tier.
    for (const input of [{}, { feasibility: null }, { feasibility: undefined }]) {
      const [, , feasibility] = buildProcessInvariants({
        balance,
        readiness: "recalculation_required",
        ...input
      });
      expect(feasibility).toEqual({
        key: "feasibility",
        source: "readiness",
        state: "recalculation_required"
      });
    }
  });

  it("keeps feasibility independent of both balances", () => {
    // §20.19 4/5.2: feasibility is a separate field, not a plan status. An exact
    // plan on both axes can still be INFEASIBLE, and the row must be able to say
    // so — which a single collapsed verdict could not.
    const [group, teacher, feasibility] = buildProcessInvariants({
      balance: {
        ...balance,
        teacher: { ...balance.teacher, is_balanced: true },
        is_exact: true
      },
      feasibility: "infeasible",
      readiness: "ready"
    });
    expect(group.state).toBe("balanced");
    expect(teacher.state).toBe("balanced");
    expect(feasibility.state).toBe("infeasible");
  });
});

describe("ProcessInvariantRow", () => {
  it("renders three slots and no collapsed verdict", () => {
    const html = renderToStaticMarkup(
      <ProcessInvariantRow balance={balance} dict={dict} feasibility="feasible" readiness="ready" />
    );
    expect(html.match(/data-reparto-invariant="/g)).toHaveLength(3);
    expect(html).toContain('data-reparto-invariant="group"');
    expect(html).toContain('data-reparto-invariant="teacher"');
    expect(html).toContain('data-reparto-invariant="feasibility"');

    // The retired one-badge slot does not come back under any name.
    expect(html).not.toContain('data-reparto-slot="overview-state"');
    expect(html).not.toContain('data-reparto-invariant="ready"');
  });

  it("prints the plan's own feasibility vocabulary to a department head", () => {
    for (const [status, label] of [
      ["not_evaluated", "Not evaluated"],
      ["feasible", "Feasible"],
      ["infeasible", "Infeasible"],
      ["unknown", "Undetermined"]
    ] as const) {
      const html = renderToStaticMarkup(
        <ProcessInvariantRow
          balance={balance}
          dict={dict}
          feasibility={status}
          readiness="ready"
        />
      );
      expect(html).toContain(`data-reparto-invariant-state="${status}"`);
      expect(html).toContain('data-reparto-invariant-source="plan"');
      expect(html).toContain("Assignment feasibility");
      expect(html).toContain(label);
    }
  });

  it("labels the projection as readiness rather than claiming a feasibility result", () => {
    const html = renderToStaticMarkup(
      <ProcessInvariantRow balance={balance} dict={dict} readiness="not_ready" />
    );
    expect(html).toContain('data-reparto-invariant-source="readiness"');
    expect(html).toContain('data-reparto-invariant-state="not_ready"');
    expect(html).toContain("Readiness");
    expect(html).toContain("Not ready");
    expect(html).not.toContain("Assignment feasibility");
  });

  it("shows both balance axes separately and never sums them", () => {
    const html = renderToStaticMarkup(
      <ProcessInvariantRow balance={balance} dict={dict} readiness="ready" />
    );
    expect(html).toContain("Group hours");
    expect(html).toContain("Teacher load");
    expect(html).toContain("Balanced");
    expect(html).toContain("Not balanced");
    expect(html).not.toContain("244");
  });

  it("says unknown for both axes when the process has no plan", () => {
    const html = renderToStaticMarkup(
      <ProcessInvariantRow balance={null} dict={dict} readiness="not_ready" />
    );
    expect(html.match(/data-reparto-invariant-state="unknown"/g)).toHaveLength(2);
  });
});
