import { describe, expect, it } from "vitest";
import {
  activeAssignments,
  buildAssignmentSlotOptions,
  buildAssignmentTeacherOptions,
  buildReassignmentTeacherOptions
} from "../src/runtime/ui/index.js";
import type {
  AssignmentPublic,
  HourRequirementPublic,
  ProcessTeacherPublic
} from "../src/runtime/schemas.js";

const processId = "11111111-1111-4111-8111-111111111111";
const mathsActivity = "22222222-2222-4222-8222-222222222222";
const tutoringActivity = "33333333-3333-4333-8333-333333333333";
const now = "2026-08-02T10:00:00Z";

function slot(
  id: string,
  overrides: Partial<HourRequirementPublic> = {}
): HourRequirementPublic {
  return {
    id,
    assignment_process_id: processId,
    teaching_activity_id: mathsActivity,
    position_index: 0,
    required_teacher_hours: "4.00",
    status: "available",
    created_generation: 1,
    last_validated_generation: 1,
    retired_generation: null,
    superseded_by_requirement_id: null,
    created_at: now,
    updated_at: now,
    ...overrides
  };
}

function participant(
  id: string,
  overrides: Partial<ProcessTeacherPublic> = {}
): ProcessTeacherPublic {
  return {
    id,
    assignment_process_id: processId,
    teacher_profile_id: id,
    base_weekly_hours: "18.00",
    extra_weekly_hours: "0.00",
    target_weekly_hours: "18.00",
    is_overloaded: false,
    extra_hours_reason: null,
    extra_hours_updated_by_user_id: null,
    extra_hours_updated_at: null,
    participates_in_selection: true,
    selection_position: null,
    selection_points: null,
    selection_criteria_label: null,
    selection_notes: null,
    order_locked: false,
    status: "active",
    created_at: now,
    updated_at: now,
    ...overrides
  };
}

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

describe("assignment slot options", () => {
  it("offers only free live slots and names why the others are closed", () => {
    const options = buildAssignmentSlotOptions(
      [
        slot("slot-1", { position_index: 1 }),
        slot("slot-2", { status: "assigned" }),
        slot("slot-3", { status: "stale", teaching_activity_id: tutoringActivity }),
        slot("slot-4", { status: "reconciliation_required" }),
        slot("slot-5", { retired_generation: 2 })
      ],
      [assignment("a-1", { hour_requirement_id: "slot-4" })]
    );

    // Retired slots are not part of the current generation and are dropped
    // entirely rather than shown as disabled.
    expect(options.map((option) => option.slotId)).not.toContain("slot-5");
    expect(options).toHaveLength(4);
    expect(options.find((option) => option.slotId === "slot-1")).toMatchObject({
      canAssign: true,
      disabledReason: null,
      teacherHours: "4.00",
      assignmentId: null
    });
    expect(
      options.find((option) => option.slotId === "slot-2")?.disabledReason
    ).toBe("slot_occupied");
    expect(
      options.find((option) => option.slotId === "slot-3")?.disabledReason
    ).toBe("slot_not_available");
    // A live assignment closes the slot even before its own status catches up.
    expect(options.find((option) => option.slotId === "slot-4")).toMatchObject({
      disabledReason: "slot_occupied",
      assignmentId: "a-1"
    });
  });

  it("orders by activity then position and ignores cancelled occupancy", () => {
    const options = buildAssignmentSlotOptions(
      [
        slot("slot-b", { teaching_activity_id: tutoringActivity, position_index: 0 }),
        slot("slot-a", { position_index: 1 }),
        slot("slot-c", { position_index: 0 })
      ],
      [
        assignment("a-1", {
          hour_requirement_id: "slot-c",
          status: "cancelled"
        })
      ]
    );

    expect(options.map((option) => option.slotId)).toEqual([
      "slot-c",
      "slot-a",
      "slot-b"
    ]);
    expect(options[0].canAssign).toBe(true);
    expect(activeAssignments([assignment("a-1", { status: "cancelled" })])).toEqual(
      []
    );
  });
});

describe("assignment teacher options", () => {
  const participants = [
    participant("teacher-1"),
    participant("teacher-2"),
    participant("teacher-3", { status: "inactive" })
  ];
  const requirements = [
    slot("slot-1", { position_index: 0 }),
    slot("slot-2", { position_index: 1 }),
    slot("slot-3", {
      teaching_activity_id: tutoringActivity,
      required_teacher_hours: "2.50"
    })
  ];
  const live = [
    assignment("a-1", {
      hour_requirement_id: "slot-1",
      process_teacher_id: "teacher-1"
    })
  ];
  const slots = buildAssignmentSlotOptions(requirements, live);
  const secondPosition = slots.find((option) => option.slotId === "slot-2");

  it("reports live workload without a slot in view", () => {
    const options = buildAssignmentTeacherOptions(participants, requirements, live);
    expect(options[0]).toMatchObject({
      processTeacherId: "teacher-1",
      assignedSlotCount: 1,
      assignedHours: "4.00",
      // 18.00 target − 4.00 already taken, read from the participant row.
      remainingTargetHours: "14.00",
      canAssign: true
    });
    expect(options[1].assignedHours).toBe("0.00");
    // Participation is the one rule that applies with no slot selected.
    expect(options[2]).toMatchObject({
      canAssign: false,
      disabledReason: "participant_inactive"
    });
  });

  it("refuses a second position of the same activity", () => {
    const options = buildAssignmentTeacherOptions(participants, requirements, live, {
      slot: secondPosition
    });
    expect(
      options.find((option) => option.processTeacherId === "teacher-1")
    ).toMatchObject({
      canAssign: false,
      disabledReason: "duplicate_activity_position"
    });
    expect(
      options.find((option) => option.processTeacherId === "teacher-2")?.canAssign
    ).toBe(true);
  });

  it("refuses a slot that does not fit the remaining target, exactly", () => {
    const options = buildAssignmentTeacherOptions(participants, requirements, live, {
      slot: secondPosition,
      // teacher-1 holds 4.00 of an 8.00 target, teacher-2 has 4.00 left, and
      // teacher-3's target is unknown to the caller.
      remainingTarget: (id) =>
        id === "teacher-1" ? "8.00" : id === "teacher-2" ? "4.00" : null
    });
    expect(
      options.find((option) => option.processTeacherId === "teacher-1")
        ?.remainingTargetHours
    ).toBe("4.00");
    // Exactly on the target still fits: the guard is "greater than", as the
    // service's own exact-fit check is.
    expect(
      options.find((option) => option.processTeacherId === "teacher-2")
    ).toMatchObject({ remainingTargetHours: "4.00", canAssign: true });

    const tight = buildAssignmentTeacherOptions(participants, requirements, live, {
      slot: secondPosition,
      remainingTarget: () => "3.99"
    });
    expect(
      tight.find((option) => option.processTeacherId === "teacher-2")
    ).toMatchObject({
      canAssign: false,
      disabledReason: "exceeds_remaining_target"
    });
    // A lookup that cannot answer falls back to the participant row, which
    // carries the service's own `base + extra` target.
    const fallback = buildAssignmentTeacherOptions(
      participants,
      requirements,
      live,
      { slot: secondPosition, remainingTarget: () => undefined }
    );
    expect(
      fallback.find((option) => option.processTeacherId === "teacher-2")
    ).toMatchObject({ remainingTargetHours: "18.00", canAssign: true });

    // An authorized overload raises the target, and with it what fits.
    const overloaded = buildAssignmentTeacherOptions(
      [
        participant("teacher-2", {
          extra_weekly_hours: "2.00",
          target_weekly_hours: "20.00",
          is_overloaded: true
        })
      ],
      requirements,
      live,
      { slot: secondPosition }
    );
    expect(overloaded[0]).toMatchObject({
      remainingTargetHours: "20.00",
      canAssign: true
    });
  });

  it("sums the slot hours of every position a participant holds", () => {
    const options = buildAssignmentTeacherOptions(
      participants,
      requirements,
      [
        ...live,
        assignment("a-2", {
          hour_requirement_id: "slot-3",
          teaching_activity_id: tutoringActivity,
          process_teacher_id: "teacher-1"
        }),
        // A slot the requirement list does not carry contributes nothing rather
        // than breaking the sum.
        assignment("a-3", {
          hour_requirement_id: "unknown-slot",
          process_teacher_id: "teacher-1"
        })
      ],
      { remainingTarget: () => "10.00" }
    );
    expect(options[0]).toMatchObject({
      assignedSlotCount: 3,
      assignedHours: "6.50",
      remainingTargetHours: "3.50"
    });
  });
});

describe("reassignment candidates", () => {
  const requirements = [
    slot("slot-1", { position_index: 0 }),
    slot("slot-2", { position_index: 1 })
  ];
  const held = assignment("a-1", {
    hour_requirement_id: "slot-1",
    process_teacher_id: "teacher-1"
  });

  it("excludes the current holder and does not count the released row", () => {
    const candidates = buildReassignmentTeacherOptions(
      held,
      [participant("teacher-1"), participant("teacher-2")],
      requirements,
      [held]
    );
    expect(candidates.map((candidate) => candidate.processTeacherId)).toEqual([
      "teacher-2"
    ]);
    expect(candidates[0].canAssign).toBe(true);
  });

  it("still refuses a candidate holding another position of the same activity", () => {
    const sibling = assignment("a-2", {
      hour_requirement_id: "slot-2",
      process_teacher_id: "teacher-2"
    });
    const candidates = buildReassignmentTeacherOptions(
      held,
      [participant("teacher-2"), participant("teacher-3")],
      requirements,
      [held, sibling]
    );
    expect(
      candidates.find((candidate) => candidate.processTeacherId === "teacher-2")
    ).toMatchObject({
      canAssign: false,
      disabledReason: "duplicate_activity_position"
    });
    expect(
      candidates.find((candidate) => candidate.processTeacherId === "teacher-3")
        ?.canAssign
    ).toBe(true);
  });

  it("falls back to the plain participation view when the slot is unknown", () => {
    const candidates = buildReassignmentTeacherOptions(
      assignment("a-9", {
        hour_requirement_id: "missing-slot",
        process_teacher_id: "teacher-1"
      }),
      [participant("teacher-2"), participant("teacher-4", { status: "inactive" })],
      requirements,
      [held],
      { remainingTarget: () => "1.00" }
    );
    expect(candidates[0]).toMatchObject({
      processTeacherId: "teacher-2",
      canAssign: true
    });
    expect(candidates[1].disabledReason).toBe("participant_inactive");
  });
});
