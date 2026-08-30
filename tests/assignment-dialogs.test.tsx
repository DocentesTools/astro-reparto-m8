// @vitest-environment jsdom
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getRepartoDictionary } from "../src/runtime/i18n/index.js";
import { RepartoApiError } from "../src/runtime/errors.js";
import type { AssignmentPublic } from "../src/runtime/schemas.js";
import type { AssignmentTeacherOption } from "../src/runtime/ui/assignments.js";

/**
 * Interaction coverage for the assignment board's dialogs (§13.2, plan §3.6 —
 * §3.8, §5.10).
 *
 * The eligibility rules themselves are proven against the framework-neutral
 * helpers in `assignment-eligibility.test.ts`. What is proven here is the part
 * only a rendered dialog can show: that the reason really is mandatory before
 * the service is called, that the request body carries exactly the fields the
 * contract allows, and that a refused row leaves the user with an accurate
 * account of what did and did not happen.
 */

const processId = "11111111-1111-4111-8111-111111111111";
const mathsActivity = "22222222-2222-4222-8222-222222222222";
const now = "2026-08-02T10:00:00Z";
const dict = getRepartoDictionary("en");

const mutations = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  undo: vi.fn(),
  undoAsync: vi.fn(),
  reassign: vi.fn(),
  pending: false
}));

const toasts = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn()
}));

vi.mock("../src/runtime/react/hooks.js", () => ({
  useCreateRepartoAssignment: () => ({
    mutate: mutations.create,
    isPending: mutations.pending
  }),
  useUpdateRepartoAssignment: () => ({
    mutate: mutations.update,
    isPending: mutations.pending
  }),
  useUndoRepartoAssignment: () => ({
    mutate: mutations.undo,
    mutateAsync: mutations.undoAsync,
    isPending: mutations.pending
  }),
  useReassignRepartoAssignment: () => ({
    mutate: mutations.reassign,
    isPending: mutations.pending
  })
}));

vi.mock("../src/runtime/react/ui/toast-notification.js", () => ({
  repartoToast: toasts,
  RepartoToastHost: () => null
}));

function assignment(
  id: string,
  overrides: Partial<AssignmentPublic> = {}
): AssignmentPublic {
  return {
    id,
    assignment_process_id: processId,
    hour_requirement_id: "slot-1",
    teaching_activity_id: mathsActivity,
    process_teacher_id: "teacher-1",
    source: "department_head",
    status: "active",
    chosen_by_user_id: null,
    confirmed_by_user_id: null,
    notes: null,
    created_at: now,
    updated_at: now,
    ...overrides
  };
}

function candidate(
  processTeacherId: string,
  overrides: Partial<AssignmentTeacherOption> = {}
): AssignmentTeacherOption {
  return {
    processTeacherId,
    assignedSlotCount: 0,
    assignedHours: "0.00",
    remainingTargetHours: "18.00",
    safeChoiceState: "not_checked",
    canAssign: true,
    disabledReason: null,
    ...overrides
  };
}

/** The dialogs render through a portal, so every query is document-rooted. */
function field(name: string): HTMLInputElement | HTMLSelectElement {
  const element = document.querySelector(`[data-reparto-field="${name}"]`);
  if (element === null) throw new Error(`no field ${name}`);
  return element as HTMLInputElement | HTMLSelectElement;
}

function action(name: string): HTMLButtonElement {
  const element = document.querySelector(`[data-reparto-action="${name}"]`);
  if (element === null) throw new Error(`no action ${name}`);
  return element as HTMLButtonElement;
}

function type(name: string, value: string) {
  fireEvent.change(field(name), { target: { value } });
}

const names: Record<string, string> = {
  "teacher-1": "Ada Lovelace",
  "teacher-2": "Grace Hopper",
  "teacher-3": "Alan Turing"
};
const participantName = (id: string) => names[id] ?? id;

beforeEach(() => {
  mutations.pending = false;
  vi.clearAllMocks();
});

afterEach(cleanup);

describe("assignment undo dialog", () => {
  async function renderUndo(onDone = vi.fn()) {
    const { AssignmentUndoDialog } = await import(
      "../src/runtime/react/default-ui/process-crud/assignments/undo.js"
    );
    render(
      <AssignmentUndoDialog
        assignment={assignment("a-1")}
        dict={dict}
        onDone={onDone}
        participantName="Ada Lovelace"
        processId={processId}
        requirementLabel="Maths · position 1"
      />
    );
    return onDone;
  }

  it("keeps the undo behind a non-empty reason", async () => {
    await renderUndo();

    // The whole point of the action is that the audit trail explains it, so an
    // empty — or whitespace-only — reason must not reach the service.
    expect(action("save").disabled).toBe(true);
    type("reason", "   ");
    expect(action("save").disabled).toBe(true);

    type("reason", "Timetable clash");
    expect(action("save").disabled).toBe(false);
    expect(mutations.undo).not.toHaveBeenCalled();
  });

  it("sends the trimmed reason and reports success once", async () => {
    const onDone = await renderUndo();
    type("reason", "  Timetable clash  ");
    fireEvent.click(action("save"));

    expect(mutations.undo).toHaveBeenCalledTimes(1);
    const [variables] = mutations.undo.mock.calls[0];
    expect(variables).toEqual({
      processId,
      assignmentId: "a-1",
      body: { reason: "Timetable clash" }
    });

    // Nothing is confirmed until the service confirms it.
    expect(onDone).not.toHaveBeenCalled();
    mutations.undo.mock.calls[0][1].onSuccess();
    expect(toasts.success).toHaveBeenCalledWith(dict.assignments.undone);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("keeps the dialog open and shows the service's own refusal", async () => {
    const onDone = await renderUndo();
    type("reason", "Timetable clash");
    fireEvent.click(action("save"));

    mutations.undo.mock.calls[0][1].onError(
      new RepartoApiError(409, "The turn has already moved on.")
    );

    expect(onDone).not.toHaveBeenCalled();
    expect(toasts.error).toHaveBeenCalledWith(
      dict.assignments.undoError,
      "The turn has already moved on."
    );
    await waitFor(() => {
      expect(document.body.textContent).toContain(
        "The turn has already moved on."
      );
    });
  });

  it("blocks a second submit while the first is in flight", async () => {
    mutations.pending = true;
    await renderUndo();
    type("reason", "Timetable clash");

    expect(action("save").disabled).toBe(true);
    fireEvent.submit(document.querySelector("form")!);
    expect(mutations.undo).not.toHaveBeenCalled();
  });
});

describe("assignment reassign dialog", () => {
  async function renderReassign(
    candidates: AssignmentTeacherOption[],
    onDone = vi.fn()
  ) {
    const { AssignmentReassignDialog } = await import(
      "../src/runtime/react/default-ui/process-crud/assignments/reassign.js"
    );
    render(
      <AssignmentReassignDialog
        assignment={assignment("a-1")}
        candidates={candidates}
        dict={dict}
        onDone={onDone}
        participantName={participantName}
        processId={processId}
        requirementLabel="Maths · position 1"
      />
    );
    return onDone;
  }

  it("offers only eligible replacements and requires a replacement and a reason", async () => {
    await renderReassign([
      candidate("teacher-2"),
      candidate("teacher-3", {
        canAssign: false,
        disabledReason: "duplicate_activity_position"
      })
    ]);

    const select = field("process-teacher") as HTMLSelectElement;
    const offered = [...select.options].map((option) => option.value);
    expect(offered).toEqual(["", "teacher-2"]);
    expect(document.body.textContent).toContain("Alan Turing");
    expect(document.body.textContent).toContain(
      dict.assignments.teacherDisabled.duplicate_activity_position
    );

    expect(action("save").disabled).toBe(true);
    fireEvent.change(select, { target: { value: "teacher-2" } });
    // A replacement alone is not enough: moving a slot is reason-required too.
    expect(action("save").disabled).toBe(true);
    type("reason", "Balancing the load");
    expect(action("save").disabled).toBe(false);
  });

  it("disables the picker with a stated reason when nobody is eligible", async () => {
    await renderReassign([
      candidate("teacher-2", {
        canAssign: false,
        disabledReason: "exceeds_remaining_target"
      })
    ]);

    expect((field("process-teacher") as HTMLSelectElement).disabled).toBe(true);
    expect(document.body.textContent).toContain(
      dict.assignments.noEligibleTeachers
    );
  });

  it("sends the replacement, the reason and normalizes blank notes to null", async () => {
    await renderReassign([candidate("teacher-2")]);
    fireEvent.change(field("process-teacher"), {
      target: { value: "teacher-2" }
    });
    type("reason", "  Balancing the load  ");
    type("notes", "   ");
    fireEvent.click(action("save"));

    expect(mutations.reassign.mock.calls[0][0]).toEqual({
      processId,
      assignmentId: "a-1",
      body: {
        process_teacher_id: "teacher-2",
        reason: "Balancing the load",
        notes: null
      }
    });
  });

  it("passes trimmed notes through when they carry text", async () => {
    await renderReassign([candidate("teacher-2")]);
    fireEvent.change(field("process-teacher"), {
      target: { value: "teacher-2" }
    });
    type("reason", "Balancing the load");
    type("notes", "  agreed in the meeting  ");
    fireEvent.click(action("save"));

    expect(mutations.reassign.mock.calls[0][0].body.notes).toBe(
      "agreed in the meeting"
    );
  });
});

describe("assignment bulk undo", () => {
  async function renderBulk(rows: AssignmentPublic[], onDone = vi.fn()) {
    const { AssignmentBulkUndo } = await import(
      "../src/runtime/react/default-ui/process-crud/assignments/bulk-undo.js"
    );
    render(
      <AssignmentBulkUndo
        assignments={rows}
        dict={dict}
        onDone={onDone}
        processId={processId}
        requirementLabel={(id) => `slot ${id}`}
      />
    );
    return onDone;
  }

  const rows = [
    assignment("a-1", { hour_requirement_id: "slot-1" }),
    assignment("a-2", { hour_requirement_id: "slot-2" }),
    assignment("a-3", { hour_requirement_id: "slot-3" })
  ];

  it("records the one shared reason on every row, in order", async () => {
    mutations.undoAsync.mockResolvedValue(undefined);
    const onDone = await renderBulk(rows);

    type("reason", "  Department restructure  ");
    fireEvent.click(action("save"));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(mutations.undoAsync).toHaveBeenCalledTimes(3);
    expect(
      mutations.undoAsync.mock.calls.map((call) => call[0].assignmentId)
    ).toEqual(["a-1", "a-2", "a-3"]);
    for (const call of mutations.undoAsync.mock.calls) {
      expect(call[0].body).toEqual({ reason: "Department restructure" });
    }
    expect(onDone).toHaveBeenCalledWith(["a-1", "a-2", "a-3"]);
  });

  it("stops at the first refusal and reports only what was undone", async () => {
    mutations.undoAsync
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new RepartoApiError(409, "Slot already released."))
      .mockResolvedValue(undefined);
    const onDone = await renderBulk(rows);

    type("reason", "Department restructure");
    fireEvent.click(action("save"));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    // Fail-stop: the third row is never attempted.
    expect(mutations.undoAsync).toHaveBeenCalledTimes(2);
    // The first row really was cancelled, so it is reported as done and drops
    // out of the selection rather than being retried into a 409.
    expect(onDone).toHaveBeenCalledWith(["a-1"]);
    expect(toasts.success).not.toHaveBeenCalled();
    expect(toasts.error).toHaveBeenCalledTimes(1);
  });

  it("cancels without undoing anything", async () => {
    const onDone = await renderBulk(rows);
    fireEvent.click(action("cancel"));

    expect(mutations.undoAsync).not.toHaveBeenCalled();
    expect(onDone).toHaveBeenCalledWith([]);
  });

  it("keeps the shared undo behind a reason", async () => {
    await renderBulk(rows);
    expect(action("save").disabled).toBe(true);
    type("reason", " ");
    expect(action("save").disabled).toBe(true);
  });
});

describe("assignment create dialog", () => {
  async function renderAdd(
    slots: { slotId: string; canAssign: boolean; teacherHours?: string }[],
    teacherOptions: Record<string, AssignmentTeacherOption[]>,
    onDone = vi.fn()
  ) {
    const { AssignmentAdd } = await import(
      "../src/runtime/react/default-ui/process-crud/assignments/add.js"
    );
    render(
      <AssignmentAdd
        dict={dict}
        onDone={onDone}
        participantName={participantName}
        participantsHref="/participants"
        processId={processId}
        requirementLabel={(id) => `Maths · ${id}`}
        requirementsHref="/requirements"
        slots={slots.map((slot) => ({
          slotId: slot.slotId,
          activityId: mathsActivity,
          positionIndex: 0,
          teacherHours: slot.teacherHours ?? "4.00",
          status: "available" as const,
          assignmentId: null,
          canAssign: slot.canAssign,
          disabledReason: null
        }))}
        teacherOptionsForSlot={(slotId) => teacherOptions[slotId] ?? []}
      />
    );
    return onDone;
  }

  it("preselects a single free slot so the real decision is visible at once", async () => {
    await renderAdd([{ slotId: "slot-1", canAssign: true }], {
      "slot-1": [candidate("teacher-2")]
    });

    expect((field("hour-requirement") as HTMLSelectElement).value).toBe("slot-1");
    const teachers = [...(field("process-teacher") as HTMLSelectElement).options];
    expect(teachers.map((option) => option.value)).toEqual(["", "teacher-2"]);
  });

  it("leaves the slot unchosen when there is more than one", async () => {
    await renderAdd(
      [
        { slotId: "slot-1", canAssign: true },
        { slotId: "slot-2", canAssign: true }
      ],
      {}
    );

    expect((field("hour-requirement") as HTMLSelectElement).value).toBe("");
    // Until a slot is picked the participant picker has nothing to filter by.
    const teacherSelect = field("process-teacher") as HTMLSelectElement;
    expect(teacherSelect.disabled).toBe(true);
    expect(document.body.textContent).toContain(dict.assignments.selectSlotFirst);
  });

  it("names why each ineligible participant cannot take the selected slot", async () => {
    await renderAdd([{ slotId: "slot-1", canAssign: true }], {
      "slot-1": [
        candidate("teacher-2"),
        candidate("teacher-1", {
          canAssign: false,
          disabledReason: "duplicate_activity_position"
        }),
        candidate("teacher-3", {
          canAssign: false,
          disabledReason: "exceeds_remaining_target"
        })
      ]
    });

    const blocked = [
      ...document.querySelectorAll(
        '[data-reparto-slot="ineligible-participants"] li'
      )
    ].map((row) => ({
      id: row.getAttribute("data-process-teacher-id"),
      reason: row.getAttribute("data-participant-disabled-reason")
    }));
    // Listed with the rule, not silently dropped.
    expect(blocked).toEqual([
      { id: "teacher-1", reason: "duplicate_activity_position" },
      { id: "teacher-3", reason: "exceeds_remaining_target" }
    ]);
    expect(document.body.textContent).toContain(
      dict.assignments.teacherDisabled.duplicate_activity_position
    );
  });

  it("clears the chosen participant when the slot changes", async () => {
    await renderAdd(
      [
        { slotId: "slot-1", canAssign: true },
        { slotId: "slot-2", canAssign: true }
      ],
      {
        "slot-1": [candidate("teacher-2")],
        "slot-2": [candidate("teacher-3")]
      }
    );

    fireEvent.change(field("hour-requirement"), { target: { value: "slot-1" } });
    fireEvent.change(field("process-teacher"), { target: { value: "teacher-2" } });
    expect(action("save").disabled).toBe(false);

    // teacher-2 may not be eligible for the new slot, so the choice cannot ride
    // along with it.
    fireEvent.change(field("hour-requirement"), { target: { value: "slot-2" } });
    expect((field("process-teacher") as HTMLSelectElement).value).toBe("");
    expect(action("save").disabled).toBe(true);
  });

  it("points at the requirements view when no slot is assignable", async () => {
    await renderAdd([{ slotId: "slot-1", canAssign: false }], {});

    expect((field("hour-requirement") as HTMLSelectElement).disabled).toBe(true);
    expect(document.body.textContent).toContain(
      dict.assignments.noAssignableSlots
    );
    expect(
      document
        .querySelector('[data-reparto-action="create-missing-prerequisite"]')
        ?.getAttribute("href")
    ).toBe("/requirements");
  });

  it("posts exactly the slot, the participant and the notes", async () => {
    await renderAdd([{ slotId: "slot-1", canAssign: true }], {
      "slot-1": [candidate("teacher-2")]
    });
    fireEvent.change(field("process-teacher"), { target: { value: "teacher-2" } });
    type("notes", "  agreed  ");
    fireEvent.click(action("save"));

    // No hours, no share and no override: the slot is indivisible (plan §3.6).
    expect(mutations.create.mock.calls[0][0]).toEqual({
      processId,
      body: {
        hour_requirement_id: "slot-1",
        process_teacher_id: "teacher-2",
        notes: "agreed"
      }
    });
  });
});

describe("assignment edit dialog", () => {
  async function renderEdit(row: AssignmentPublic, onDone = vi.fn()) {
    const { AssignmentEdit } = await import(
      "../src/runtime/react/default-ui/process-crud/assignments/edit.js"
    );
    render(
      <AssignmentEdit
        assignment={row}
        dict={dict}
        onDone={onDone}
        participantName="Ada Lovelace"
        processId={processId}
        requirementLabel="Maths · position 1"
      />
    );
    return onDone;
  }

  it("shows the slot and participant as read-only context", async () => {
    await renderEdit(assignment("a-1", { notes: "agreed" }));

    const context = document.querySelector(
      '[data-reparto-slot="assignment-context"]'
    );
    expect(context?.textContent).toContain("Maths · position 1");
    expect(context?.textContent).toContain("Ada Lovelace");
    // Neither is editable here: the teacher moves only through reassignment.
    expect(document.querySelectorAll("select")).toHaveLength(0);
    expect((field("notes") as HTMLInputElement).value).toBe("agreed");
  });

  it("stays disabled until the notes actually change", async () => {
    await renderEdit(assignment("a-1", { notes: "agreed" }));

    expect(action("save").disabled).toBe(true);
    type("notes", "agreed");
    expect(action("save").disabled).toBe(true);
    type("notes", "agreed with the head");
    expect(action("save").disabled).toBe(false);
  });

  it("sends notes only, and clears them to null when emptied", async () => {
    await renderEdit(assignment("a-1", { notes: "agreed" }));
    type("notes", "   ");
    fireEvent.click(action("save"));

    expect(mutations.update.mock.calls[0][0]).toEqual({
      processId,
      assignmentId: "a-1",
      body: { notes: null }
    });
  });
});
