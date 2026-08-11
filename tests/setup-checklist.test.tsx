import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  repartoUser,
  resetRepartoAuthAdapter,
  signInReparto
} from "./support/session.js";
import { buildSetupChecklist } from "../src/runtime/ui/index.js";
import { DepartmentHeadWorkspace } from "../src/runtime/react/DepartmentHeadWorkspace.js";
import { en } from "../src/runtime/i18n/en.js";
import type { ProcessSummary } from "../src/runtime/schemas.js";

/**
 * Audit finding `S2-07` — the setup checklist described a workflow that no
 * longer existed.
 *
 * The two defects these cases exist to catch are both *label versus condition*:
 * the dashboard tested "a teaching plan exists" under **Add subjects** and "a
 * plan balance exists" under **Add classrooms**, and it tested the participant
 * count under two different labels. Neither is visible to a test that only
 * counts steps, so the cases below assert the condition each key answers to.
 */

const processId = "11111111-1111-4111-8111-111111111111";
const planId = "aaaa1111-aaaa-4aaa-8aaa-aaaaaaaa1111";

const balancedPlan = {
  teaching_plan_id: planId,
  assignment_process_id: processId,
  group: {
    total_group_load: "120.00",
    allocated_group_weekly_hours: "120.00",
    allocation_difference: "0.00",
    is_balanced: true
  },
  teacher: {
    total_teacher_load: "120.00",
    participant_target_total: "120.00",
    teacher_load_difference: "0.00",
    is_balanced: true
  },
  is_exact: true
};

function summaryFixture(overrides: Partial<ProcessSummary> = {}): ProcessSummary {
  return {
    process_id: processId,
    generated_at: "2026-08-11T10:00:00Z",
    readiness: "ready",
    plan_status: "balanced",
    plan_balance: balancedPlan,
    total_slots: 0,
    assigned_slots: 0,
    available_slots: 0,
    current_turn: null,
    blocking_validation_count: 0,
    ...overrides
  };
}

/** A dashboard whose plan exists — the payload the old checklist misread. */
function dashboardFixture() {
  return {
    process_id: processId,
    generated_at: "2026-08-11T10:00:00Z",
    readiness: "ready",
    planning: {
      teaching_plan_id: planId,
      status: "balanced",
      balance: balancedPlan,
      validations: null
    },
    assignment: {
      summary: {
        assignment_process_id: processId,
        total_target_hours: "20.00",
        total_assigned_hours: "0.00",
        total_remaining_hours: "20.00",
        total_slots: 0,
        assigned_slots: 0,
        available_slots: 0,
        participants: [
          {
            process_teacher_id: "44444444-4444-4444-8444-444444444444",
            teacher_profile_id: "55555555-5555-4555-8555-555555555555",
            display_name: "Ada Lovelace",
            base_weekly_hours: "20.00",
            extra_weekly_hours: "0.00",
            target_weekly_hours: "20.00",
            assigned_weekly_hours: "0.00",
            remaining_weekly_hours: "20.00",
            is_overloaded: false,
            assignment_count: 0,
            state: "pending"
          }
        ]
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
  } as const;
}

function stepOf(
  checklist: ReturnType<typeof buildSetupChecklist>,
  key: string
) {
  const step = checklist.steps.find((entry) => entry.key === key);
  expect(step, `no such step: ${key}`).toBeDefined();
  return step!;
}

describe("setup checklist — the one derivation (S2-07)", () => {
  it("names a step for every §8.2 act the old checklist skipped", () => {
    const keys = buildSetupChecklist().steps.map((step) => step.key);
    for (const key of [
      "allocation",
      "groupSubjects",
      "teachingPlan",
      "planBalance",
      "planLock",
      "requirements"
    ]) {
      expect(keys, `missing step: ${key}`).toContain(key);
    }
    // The retired duplicate: `teacherRoster` tested `participants.length > 0`,
    // exactly what `participants` tested one row below it.
    expect(keys).not.toContain("teacherRoster");
    expect(keys.filter((key) => key === "participants")).toHaveLength(1);
  });

  it("groups the steps by the three stages, in stage order", () => {
    const stages = buildSetupChecklist().steps.map((step) => step.stage);
    expect(new Set(stages)).toEqual(
      new Set(["configuration", "planning", "assignment"])
    );
    expect(stages.indexOf("planning")).toBeGreaterThan(
      stages.lastIndexOf("configuration")
    );
    expect(stages.indexOf("assignment")).toBeGreaterThan(
      stages.lastIndexOf("planning")
    );
  });

  it("every step key has a label in all three locales", async () => {
    const { fr } = await import("../src/runtime/i18n/fr.js");
    const { es } = await import("../src/runtime/i18n/es.js");
    for (const step of buildSetupChecklist().steps) {
      for (const [name, dict] of [["en", en], ["fr", fr], ["es", es]] as const) {
        expect(
          dict.flow.bootstrap.step[step.key],
          `${name} is missing ${step.key}`
        ).toBeTruthy();
      }
    }
  });

  it("reads an unobserved count as unknown, never as zero", () => {
    const nothing = buildSetupChecklist();
    expect(nothing.steps.every((step) => step.status === "unknown")).toBe(true);
    expect(nothing.doneCount).toBe(0);
    expect(nothing.pendingCount).toBe(0);
    expect(nothing.unknownCount).toBe(nothing.total);

    // A read that came back empty is a different statement, and the only one
    // that asks the operator to act.
    const observed = buildSetupChecklist({ subjectCount: 0, processId });
    expect(stepOf(observed, "subjects").status).toBe("pending");
    expect(stepOf(observed, "subjects").blockedReason).toBeNull();
  });

  it("says why a step could not be tested", () => {
    const noProcess = buildSetupChecklist({ schoolCount: 1 });
    expect(stepOf(noProcess, "subjects").blockedReason).toBe("no-process");

    const withProcess = buildSetupChecklist({ summary: summaryFixture() });
    expect(stepOf(withProcess, "subjects").status).toBe("unknown");
    expect(stepOf(withProcess, "subjects").blockedReason).toBe("not-observed");
  });

  it("does not test the teaching plan under the subjects or classrooms label", () => {
    // The exact shape of the defect: a process with a plan *and* a balance, and
    // no subject or classroom read at all.
    const checklist = buildSetupChecklist({ summary: summaryFixture() });
    expect(stepOf(checklist, "teachingPlan").status).toBe("done");
    expect(stepOf(checklist, "planBalance").status).toBe("done");
    expect(stepOf(checklist, "subjects").status).toBe("unknown");
    expect(stepOf(checklist, "classrooms").status).toBe("unknown");
  });

  it("takes a selected process as proof of its school, year and department", () => {
    const checklist = buildSetupChecklist({ processId });
    for (const key of ["school", "academicYear", "department", "process"]) {
      expect(stepOf(checklist, key).status, key).toBe("done");
    }
  });

  it("tests the allocation from the revision list, falling back to the balance", () => {
    expect(
      stepOf(buildSetupChecklist({ allocationRevisionCount: 1 }), "allocation").status
    ).toBe("done");
    expect(
      stepOf(buildSetupChecklist({ allocationRevisionCount: 0 }), "allocation").status
    ).toBe("pending");

    const communicated = buildSetupChecklist({ summary: summaryFixture() });
    expect(stepOf(communicated, "allocation").status).toBe("done");

    const notCommunicated = buildSetupChecklist({
      summary: summaryFixture({
        plan_balance: {
          ...balancedPlan,
          group: {
            ...balancedPlan.group,
            allocated_group_weekly_hours: null,
            allocation_difference: null,
            is_balanced: false
          }
        }
      })
    });
    expect(stepOf(notCommunicated, "allocation").status).toBe("pending");
  });

  it("counts the four Stage 1 resources from their own reads", () => {
    const checklist = buildSetupChecklist({
      classroomCount: 12,
      groupSubjectCount: 0,
      participantCount: 7,
      processId,
      subjectCount: 3
    });
    expect(stepOf(checklist, "participants").status).toBe("done");
    expect(stepOf(checklist, "subjects").status).toBe("done");
    expect(stepOf(checklist, "classrooms").status).toBe("done");
    expect(stepOf(checklist, "groupSubjects").status).toBe("pending");
  });

  it("closes the configuration review only when every step above it is done", () => {
    const incomplete = buildSetupChecklist({
      allocationRevisionCount: 1,
      classroomCount: 1,
      groupSubjectCount: 0,
      participantCount: 1,
      processId,
      subjectCount: 1
    });
    expect(stepOf(incomplete, "configurationReview").status).toBe("pending");

    const complete = buildSetupChecklist({
      allocationRevisionCount: 1,
      classroomCount: 1,
      groupSubjectCount: 4,
      participantCount: 1,
      processId,
      subjectCount: 1
    });
    expect(stepOf(complete, "configurationReview").status).toBe("done");

    // An untested step above it leaves the review untested too — it cannot
    // claim a configuration is complete on evidence it never saw.
    const partial = buildSetupChecklist({ processId });
    expect(stepOf(partial, "configurationReview").status).toBe("unknown");
  });

  it("reads the lock from the service's mutable-status set, not the word 'locked'", () => {
    for (const status of ["draft", "unbalanced", "balanced"] as const) {
      const checklist = buildSetupChecklist({
        summary: summaryFixture({ plan_status: status })
      });
      expect(stepOf(checklist, "planLock").status, status).toBe("pending");
    }
    for (const status of [
      "locked",
      "requirements_generated",
      "stale",
      "reconciliation_required"
    ] as const) {
      const checklist = buildSetupChecklist({
        summary: summaryFixture({ plan_status: status })
      });
      expect(stepOf(checklist, "planLock").status, status).toBe("done");
    }
  });

  it("tests the plan, its balance, generation and the meeting from the summary", () => {
    const empty = buildSetupChecklist({
      summary: summaryFixture({ plan_status: null, plan_balance: null })
    });
    expect(stepOf(empty, "teachingPlan").status).toBe("pending");
    expect(stepOf(empty, "planBalance").status).toBe("pending");
    expect(stepOf(empty, "requirements").status).toBe("pending");
    expect(stepOf(empty, "meeting").status).toBe("pending");

    const unbalanced = buildSetupChecklist({
      summary: summaryFixture({
        plan_balance: {
          ...balancedPlan,
          teacher: { ...balancedPlan.teacher, is_balanced: false }
        }
      })
    });
    expect(stepOf(unbalanced, "planBalance").status).toBe("pending");

    const running = buildSetupChecklist({
      summary: summaryFixture({
        plan_status: "requirements_generated",
        total_slots: 6,
        assigned_slots: 2
      })
    });
    expect(stepOf(running, "requirements").status).toBe("done");
    expect(stepOf(running, "meeting").status).toBe("done");
  });
});

describe("setup checklist — the dashboard surface", () => {
  beforeEach(() => {
    signInReparto(repartoUser("admin"));
  });

  afterEach(() => {
    resetRepartoAuthAdapter();
  });

  it("renders the three stage groups and the new steps", () => {
    const html = renderToStaticMarkup(
      <DepartmentHeadWorkspace locale="en" summary={summaryFixture()} />
    );
    expect(html).toContain('data-reparto-panel="setup-checklist"');
    expect(html).toContain('data-reparto-checklist-group="configuration"');
    expect(html).toContain('data-reparto-checklist-group="planning"');
    expect(html).toContain('data-reparto-checklist-group="assignment"');
    expect(html).toContain('data-reparto-checklist-step="allocation"');
    expect(html).toContain('data-reparto-checklist-step="groupSubjects"');
    expect(html).toContain('data-reparto-checklist-step="planLock"');
    expect(html).not.toContain('data-reparto-checklist-step="teacherRoster"');
  });

  it("tests subjects against subjects, and classrooms against classrooms", () => {
    // The exact defect: a dashboard whose teaching plan exists and whose plan
    // balance exists, with **no** subject and **no** classroom. The old
    // conditions read the plan and the balance and turned both rows green.
    const html = renderToStaticMarkup(
      <DepartmentHeadWorkspace
        dashboard={dashboardFixture()}
        locale="en"
        setup={{ classroomCount: 0, subjectCount: 0 }}
        summary={summaryFixture()}
      />
    );
    expect(html).toMatch(
      /data-reparto-checklist-state="pending"[^>]*data-reparto-checklist-step="subjects"/
    );
    expect(html).toMatch(
      /data-reparto-checklist-state="pending"[^>]*data-reparto-checklist-step="classrooms"/
    );
    expect(html).toContain(en.flow.bootstrap.step.subjects);

    // And the other way round: a real subject read turns exactly that row.
    const stocked = renderToStaticMarkup(
      <DepartmentHeadWorkspace
        dashboard={dashboardFixture()}
        locale="en"
        setup={{ classroomCount: 0, subjectCount: 5 }}
        summary={summaryFixture()}
      />
    );
    expect(stocked).toMatch(
      /data-reparto-checklist-state="done"[^>]*data-reparto-checklist-step="subjects"/
    );
    expect(stocked).toMatch(
      /data-reparto-checklist-state="pending"[^>]*data-reparto-checklist-step="classrooms"/
    );
  });

  it("marks a Stage 1 step the caller did not read as unknown, with its reason", () => {
    const html = renderToStaticMarkup(
      <DepartmentHeadWorkspace locale="en" summary={summaryFixture()} />
    );
    expect(html).toMatch(
      /data-reparto-checklist-state="unknown"[^>]*data-reparto-checklist-step="subjects"/
    );
    expect(html).toContain('data-reparto-checklist-blocked="not-observed"');
    expect(html).toContain(en.flow.bootstrap.reason["not-observed"]);
    // Nothing to press: the condition was not tested, so there is no claim that
    // the work is outstanding.
    expect(html).not.toContain('data-reparto-action="open-subjects"');
  });

  it("counts the participants once, from the dashboard's own rows", () => {
    const summary = summaryFixture();
    const html = renderToStaticMarkup(
      <DepartmentHeadWorkspace
        dashboard={dashboardFixture()}
        locale="en"
        summary={summary}
      />
    );
    expect(html).toMatch(
      /data-reparto-checklist-state="done"[^>]*data-reparto-checklist-step="participants"/
    );
    const participantSteps = (
      html.match(/data-reparto-checklist-step="participants"/g) ?? []
    ).length;
    expect(participantSteps).toBe(1);
  });
});

const pickerState = vi.hoisted(() => ({
  schools: [] as { id: string; name: string }[],
  years: [] as { id: string; label: string }[],
  departments: [] as { id: string; name: string }[],
  processes: [] as { id: string; status: string }[]
}));

vi.mock("@tanstack/react-query", () => ({
  QueryClient: class QueryClient {},
  QueryClientProvider: ({ children }: { children: ReactNode }) => children,
  useQuery: ({ queryKey }: { queryKey: readonly unknown[] }) => {
    const scope = queryKey[1];
    const source =
      scope === "schools"
        ? pickerState.schools
        : scope === "academic-years"
          ? pickerState.years
          : scope === "departments"
            ? pickerState.departments
            : scope === "processes"
              ? pickerState.processes
              : null;
    if (source === null) {
      return { data: undefined, error: null, isError: false, isLoading: false };
    }
    return {
      data: { data: source, count: source.length },
      error: null,
      isError: false,
      isLoading: false
    };
  },
  useMutation: () => ({ isPending: false, isError: false, mutate: () => undefined }),
  useQueryClient: () => ({ invalidateQueries: () => undefined })
}));

describe("setup checklist — the process-picker surface", () => {
  beforeEach(() => {
    signInReparto(repartoUser("admin"));
    pickerState.schools = [];
    pickerState.years = [];
    pickerState.departments = [];
    pickerState.processes = [];
  });

  afterEach(() => {
    resetRepartoAuthAdapter();
  });

  async function renderPicker() {
    const { ProcessPicker } = await import(
      "../src/runtime/react/default-ui/process-context.js"
    );
    return renderToStaticMarkup(
      <ProcessPicker locale="en" onSelect={() => undefined} />
    );
  }

  it("renders the same steps the dashboard does, in the same order", async () => {
    const html = await renderPicker();
    const rendered = [
      ...html.matchAll(/data-reparto-checklist-step="([a-zA-Z]+)"/g)
    ].map((match) => match[1]);
    expect(rendered).toEqual(buildSetupChecklist().steps.map((step) => step.key));
  });

  it("offers the inline create only for what it can actually open", async () => {
    const html = await renderPicker();
    expect(html).toContain('data-reparto-action="open-school"');
    expect(html).toContain('data-reparto-action="open-academicYear"');
    expect(html).toContain('data-reparto-action="open-department"');
    // The picker cannot create a subject: no process is selected there by
    // construction, which is the reason it now states.
    expect(html).not.toContain('data-reparto-action="open-subjects"');
    expect(html).toContain('data-reparto-checklist-blocked="no-process"');
    expect(html).toContain(en.flow.bootstrap.reason["no-process"]);
  });

  it("counts progress against the real total, not a hard-coded nine", async () => {
    pickerState.schools = [{ id: "s1", name: "IES" }];
    pickerState.years = [{ id: "y1", label: "2025-2026" }];
    const html = await renderPicker();
    const total = buildSetupChecklist().total;
    expect(html).toContain(`2/${total}`);
    expect(html).not.toContain("2/9");
  });
});
