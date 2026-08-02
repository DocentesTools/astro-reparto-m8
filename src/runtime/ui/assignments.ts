import {
  compareHours,
  subtractHours,
  sumHours,
  type HourValue
} from "../decimals.js";
import type {
  AssignmentPublic,
  HourRequirementPublic,
  ProcessTeacherPublic
} from "../schemas.js";

/**
 * Framework-neutral state for the assignment board and the teacher LAN
 * direct-choice panel (backend plan §3.6, §3.7, §3.8).
 *
 * One teacher takes one complete, indivisible slot: there are no hours to
 * enter, no share to pick and no override to justify, so the only question a
 * view has to answer is *which slots can still be taken* and *which
 * participants may take them*. That question has exactly three parts, all
 * enforced by the service and all mirrored here so a user is not offered a
 * choice the backend will refuse:
 *
 * 1. the slot is live and still free (plan §5.10 — one active assignment per
 *    slot);
 * 2. the participant is active and does not already hold a **sibling position
 *    of the same activity** (plan §3.7 — distinct teachers per activity);
 * 3. the whole slot fits the participant's remaining target, because a slot
 *    cannot be split (plan §3.8 — an overload is authorized in advance as
 *    extra hours or not at all).
 *
 * Rule 3 needs the participant's target hours, which the process-teacher read
 * schema does not carry yet (that field set lands with the participant/LAN
 * bullets). It is therefore evaluated through an explicit
 * {@link RemainingTargetLookup} the caller supplies: return `null` and the rule
 * is reported as unknown rather than silently assumed to pass, so the board
 * stays honest today and the LAN panel — which does know the remaining target —
 * enforces it in full. The service remains the authority in every case; this is
 * a pre-filter, never a substitute.
 */

/** Why a generated slot cannot be assigned right now. */
export type AssignmentSlotDisabledReason =
  | "slot_occupied"
  | "slot_not_available";

/** Why a participant cannot take the slot under consideration. */
export type AssignmentTeacherDisabledReason =
  | "participant_inactive"
  | "duplicate_activity_position"
  | "exceeds_remaining_target";

export type AssignmentSlotOption = {
  slotId: string;
  activityId: string;
  positionIndex: number;
  teacherHours: string;
  status: HourRequirementPublic["status"];
  assignmentId: string | null;
  canAssign: boolean;
  disabledReason: AssignmentSlotDisabledReason | null;
};

export type AssignmentTeacherOption = {
  processTeacherId: string;
  assignedSlotCount: number;
  assignedHours: string;
  /**
   * `target − assigned` when the caller can supply the participant's target,
   * `null` when that axis is not available to this view.
   */
  remainingTargetHours: string | null;
  canAssign: boolean;
  disabledReason: AssignmentTeacherDisabledReason | null;
};

/**
 * Remaining target hours for one participant, or `null` when the caller cannot
 * know them. Never derive this from a capacity field: the target is
 * `base_weekly_hours + extra_weekly_hours` (plan §3.8) and nothing else.
 */
export type RemainingTargetLookup = (
  processTeacherId: string
) => HourValue | null | undefined;

/** The live occupancies; cancelled rows are history and bind nothing. */
export function activeAssignments(
  assignments: readonly AssignmentPublic[]
): AssignmentPublic[] {
  return assignments.filter((assignment) => assignment.status === "active");
}

/**
 * Live slots with their occupancy state, ordered by activity then position.
 *
 * Retired slots are dropped rather than disabled: they are not part of the
 * current generation, so offering them — even greyed out — would suggest the
 * generation could still be worked on from this board.
 */
export function buildAssignmentSlotOptions(
  requirements: readonly HourRequirementPublic[],
  assignments: readonly AssignmentPublic[]
): AssignmentSlotOption[] {
  const occupancyBySlot = new Map(
    activeAssignments(assignments).map((assignment) => [
      assignment.hour_requirement_id,
      assignment
    ])
  );
  return requirements
    .filter((slot) => slot.retired_generation === null)
    .map((slot) => {
      const occupancy = occupancyBySlot.get(slot.id) ?? null;
      const disabledReason = slotDisabledReason(slot, occupancy);
      return {
        slotId: slot.id,
        activityId: slot.teaching_activity_id,
        positionIndex: slot.position_index,
        teacherHours: slot.required_teacher_hours,
        status: slot.status,
        assignmentId: occupancy?.id ?? null,
        canAssign: disabledReason === null,
        disabledReason
      };
    })
    .sort(
      (left, right) =>
        left.activityId.localeCompare(right.activityId) ||
        left.positionIndex - right.positionIndex
    );
}

/**
 * Participants with their live workload and their eligibility for one slot.
 *
 * `slot` is optional: without it the per-slot rules cannot apply and the result
 * is the plain participation view (used by the board before a slot is picked).
 */
export function buildAssignmentTeacherOptions(
  participants: readonly ProcessTeacherPublic[],
  requirements: readonly HourRequirementPublic[],
  assignments: readonly AssignmentPublic[],
  options: {
    slot?: AssignmentSlotOption | null;
    remainingTarget?: RemainingTargetLookup;
  } = {}
): AssignmentTeacherOption[] {
  const live = activeAssignments(assignments);
  const hoursBySlot = new Map(
    requirements.map((slot) => [slot.id, slot.required_teacher_hours])
  );
  const slot = options.slot ?? null;
  return participants.map((participant) => {
    const held = live.filter(
      (assignment) => assignment.process_teacher_id === participant.id
    );
    const assignedHours = sumHours(
      held.map((assignment) => hoursBySlot.get(assignment.hour_requirement_id) ?? 0)
    );
    const remainingTargetHours = resolveRemainingTarget(
      participant.id,
      assignedHours,
      options.remainingTarget
    );
    const disabledReason = teacherDisabledReason({
      participant,
      held,
      slot,
      remainingTargetHours
    });
    return {
      processTeacherId: participant.id,
      assignedSlotCount: held.length,
      assignedHours,
      remainingTargetHours,
      canAssign: disabledReason === null,
      disabledReason
    };
  });
}

/**
 * Replacement candidates for a live assignment: every eligible participant
 * except the one already holding the slot.
 */
export function buildReassignmentTeacherOptions(
  assignment: AssignmentPublic,
  participants: readonly ProcessTeacherPublic[],
  requirements: readonly HourRequirementPublic[],
  assignments: readonly AssignmentPublic[],
  options: { remainingTarget?: RemainingTargetLookup } = {}
): AssignmentTeacherOption[] {
  const slot = requirements.find(
    (candidate) => candidate.id === assignment.hour_requirement_id
  );
  const slotOption: AssignmentSlotOption | null = slot
    ? {
        slotId: slot.id,
        activityId: slot.teaching_activity_id,
        positionIndex: slot.position_index,
        teacherHours: slot.required_teacher_hours,
        status: slot.status,
        assignmentId: assignment.id,
        canAssign: false,
        disabledReason: "slot_occupied"
      }
    : null;
  // The row being replaced is released in the same atomic operation, so it must
  // not make its own activity look occupied for the candidates.
  const others = assignments.filter(
    (candidate) => candidate.id !== assignment.id
  );
  return buildAssignmentTeacherOptions(
    participants.filter(
      (participant) => participant.id !== assignment.process_teacher_id
    ),
    requirements,
    others,
    { slot: slotOption, remainingTarget: options.remainingTarget }
  );
}

function slotDisabledReason(
  slot: HourRequirementPublic,
  occupancy: AssignmentPublic | null
): AssignmentSlotDisabledReason | null {
  if (occupancy !== null || slot.status === "assigned") return "slot_occupied";
  if (slot.status !== "available") return "slot_not_available";
  return null;
}

function resolveRemainingTarget(
  processTeacherId: string,
  assignedHours: string,
  lookup: RemainingTargetLookup | undefined
): string | null {
  const target = lookup?.(processTeacherId);
  if (target === null || target === undefined) return null;
  return subtractHours(target, assignedHours);
}

function teacherDisabledReason({
  participant,
  held,
  slot,
  remainingTargetHours
}: {
  participant: ProcessTeacherPublic;
  held: readonly AssignmentPublic[];
  slot: AssignmentSlotOption | null;
  remainingTargetHours: string | null;
}): AssignmentTeacherDisabledReason | null {
  if (participant.status !== "active") return "participant_inactive";
  if (slot === null) return null;
  if (held.some((assignment) => assignment.teaching_activity_id === slot.activityId)) {
    return "duplicate_activity_position";
  }
  if (
    remainingTargetHours !== null &&
    compareHours(slot.teacherHours, remainingTargetHours) > 0
  ) {
    return "exceeds_remaining_target";
  }
  return null;
}
