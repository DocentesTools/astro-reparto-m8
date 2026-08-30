import {
  compareHours,
  hoursToHundredths,
  subtractHours,
  sumHours,
  type HourHundredths,
  type HourValue
} from "../decimals.js";
import type {
  AssignmentPublic,
  FeasibilityWitnessReport,
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
 * Rule 3 needs the participant's target hours. `ProcessTeacherPublic` now
 * carries `target_weekly_hours` (the service's own `base + extra`), so the rule
 * is evaluated for every view by default — the board no longer has to report it
 * as unknown. {@link RemainingTargetLookup} survives as an explicit override for
 * a caller holding a fresher figure than the participant row; a lookup that
 * answers `null` falls back to the row, because the row does know. The service
 * remains the authority in every case; this is a pre-filter, never a substitute.
 */

/** Why a generated slot cannot be assigned right now. */
export type AssignmentSlotDisabledReason =
  | "slot_occupied"
  | "slot_not_available";

/** Why a participant cannot take the slot under consideration. */
export type AssignmentTeacherDisabledReason =
  | "participant_inactive"
  | "duplicate_activity_position"
  | "exceeds_remaining_target"
  | "strands_remaining_participants"
  | "witness_unavailable";

export type AssignmentSafeChoiceState =
  | "not_checked"
  | "safe"
  | "unsafe"
  | "unavailable";

/**
 * Restricted administrator-only safe-choice inputs.
 *
 * The witness comes from the department-head endpoint and is reduced to one
 * verdict per option. Teacher LAN code never receives this context and keeps
 * using the role-safe readiness/selection-blocked projection instead.
 */
export type AssignmentSafeChoiceContext = {
  required: boolean;
  witness: FeasibilityWitnessReport | null;
  /** Reassignment releases this currently occupied slot before testing it. */
  releasedSlotId?: string;
};

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
  /** `target − assigned`, signed; negative would mean already over target. */
  remainingTargetHours: string;
  safeChoiceState: AssignmentSafeChoiceState;
  canAssign: boolean;
  disabledReason: AssignmentTeacherDisabledReason | null;
};

/**
 * An override for one participant's target hours, or `null` to use the
 * participant row's own `target_weekly_hours`. Never derive this from a capacity
 * field: the target is `base_weekly_hours + extra_weekly_hours` (plan §3.8) and
 * nothing else.
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
    safeChoice?: AssignmentSafeChoiceContext;
  } = {}
): AssignmentTeacherOption[] {
  const live = activeAssignments(assignments);
  const hoursBySlot = new Map(
    requirements.map((slot) => [slot.id, slot.required_teacher_hours])
  );
  const slot = options.slot ?? null;
  const safeChoiceState =
    slot !== null && options.safeChoice?.required
      ? buildSafeChoiceState(
          participants,
          requirements,
          assignments,
          options.safeChoice.releasedSlotId
        )
      : null;
  return participants.map((participant) => {
    const held = live.filter(
      (assignment) => assignment.process_teacher_id === participant.id
    );
    const assignedHours = sumHours(
      held.map((assignment) => hoursBySlot.get(assignment.hour_requirement_id) ?? 0)
    );
    const remainingTargetHours = resolveRemainingTarget(
      participant,
      assignedHours,
      options.remainingTarget
    );
    const basicDisabledReason = teacherDisabledReason({
      participant,
      held,
      slot,
      remainingTargetHours
    });
    const choiceState =
      basicDisabledReason === null && slot !== null && options.safeChoice?.required
        && safeChoiceState !== null
        ? evaluateWitnessSafeChoice(
            safeChoiceState,
            options.safeChoice.witness,
            slot.slotId,
            participant.id
          )
        : "not_checked";
    const disabledReason =
      basicDisabledReason ?? safeChoiceDisabledReason(choiceState);
    return {
      processTeacherId: participant.id,
      assignedSlotCount: held.length,
      assignedHours,
      remainingTargetHours,
      safeChoiceState: choiceState,
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
  options: {
    remainingTarget?: RemainingTargetLookup;
    safeChoice?: AssignmentSafeChoiceContext;
  } = {}
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
    {
      slot: slotOption,
      remainingTarget: options.remainingTarget,
      safeChoice: options.safeChoice
        ? { ...options.safeChoice, releasedSlotId: slot?.id }
        : undefined
    }
  );
}

type SafeParticipant = {
  id: string;
  remaining: HourHundredths;
  occupiedActivities: ReadonlySet<string>;
};

type SafeSlot = {
  id: string;
  activityId: string;
  hours: HourHundredths;
};

type SafeChoiceState = {
  participants: readonly SafeParticipant[];
  slots: readonly SafeSlot[];
};

/**
 * Build a conservative subset of the service's cheap-guard inputs: exact
 * integer hundredths, active participants, live occupancies and free slots.
 * This is a UI prefilter only; the service repeats every guard while locked
 * and remains authoritative for alternatives that need witness repair.
 */
function buildSafeChoiceState(
  participants: readonly ProcessTeacherPublic[],
  requirements: readonly HourRequirementPublic[],
  assignments: readonly AssignmentPublic[],
  releasedSlotId?: string
): SafeChoiceState {
  const active = activeAssignments(assignments);
  const requirementById = new Map(requirements.map((slot) => [slot.id, slot]));
  const assignedSlotIds = new Set(
    active.map((assignment) => assignment.hour_requirement_id)
  );
  const participantState = participants
    .filter((participant) => participant.status === "active")
    .map((participant) => {
      const held = active.filter(
        (assignment) => assignment.process_teacher_id === participant.id
      );
      const assigned = held.reduce(
        (total, assignment) =>
          total +
          hoursToHundredths(
            requirementById.get(assignment.hour_requirement_id)
              ?.required_teacher_hours ?? 0
          ),
        0
      );
      return {
        id: participant.id,
        remaining: hoursToHundredths(participant.target_weekly_hours) - assigned,
        occupiedActivities: new Set(
          held.map((assignment) => assignment.teaching_activity_id)
        )
      };
    })
    .sort((left, right) => left.id.localeCompare(right.id));
  const slots = requirements
    .filter(
      (slot) =>
        slot.retired_generation === null &&
        !assignedSlotIds.has(slot.id) &&
        (slot.status === "available" || slot.id === releasedSlotId)
    )
    .map((slot) => ({
      id: slot.id,
      activityId: slot.teaching_activity_id,
      hours: hoursToHundredths(slot.required_teacher_hours)
    }));
  return { participants: participantState, slots };
}

function evaluateWitnessSafeChoice(
  state: SafeChoiceState,
  witness: FeasibilityWitnessReport | null,
  proposedSlotId: string,
  proposedParticipantId: string
): AssignmentSafeChoiceState {
  if (witness === null) return "unavailable";
  const participant = state.participants.find(
    (candidate) => candidate.id === proposedParticipantId
  ) as SafeParticipant;
  const slot = state.slots.find((candidate) => candidate.id === proposedSlotId);
  if (!slot) return "unavailable";

  const prospective = applySafeChoice(state, participant, slot);
  if (!prospectivePassesCheapGuards(prospective)) return "unsafe";
  const witnessedChoice = witness.witness.find(
    (entry) => entry.slot_id === proposedSlotId
  );
  if (witnessedChoice === undefined) return "unavailable";
  return witnessedChoice.process_teacher_id === proposedParticipantId
    ? "safe"
    : "not_checked";
}

function safeChoiceDisabledReason(
  state: AssignmentSafeChoiceState
): AssignmentTeacherDisabledReason | null {
  if (state === "unsafe") return "strands_remaining_participants";
  if (state === "unavailable") return "witness_unavailable";
  return null;
}

function applySafeChoice(
  state: SafeChoiceState,
  participant: SafeParticipant,
  slot: SafeSlot
): SafeChoiceState {
  const updated: SafeParticipant = {
    id: participant.id,
    remaining: Math.max(0, participant.remaining - slot.hours),
    occupiedActivities: new Set([
      ...participant.occupiedActivities,
      slot.activityId
    ])
  };
  return {
    participants: state.participants.map((candidate) =>
      candidate.id === updated.id ? updated : candidate
    ),
    slots: state.slots.filter((candidate) => candidate.id !== slot.id)
  };
}

function prospectivePassesCheapGuards(state: SafeChoiceState): boolean {
  const targetTotal = state.participants.reduce(
    (total, participant) => total + participant.remaining,
    0
  );
  const slotTotal = state.slots.reduce((total, slot) => total + slot.hours, 0);
  if (targetTotal !== slotTotal) return false;
  if (state.slots.length > 0) {
    const largestSlot = Math.max(...state.slots.map((slot) => slot.hours));
    const largestTarget = Math.max(
      ...state.participants.map((participant) => participant.remaining),
      -1
    );
    if (largestSlot > largestTarget) return false;
  }
  return true;
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
  participant: ProcessTeacherPublic,
  assignedHours: string,
  lookup: RemainingTargetLookup | undefined
): string {
  const target =
    lookup?.(participant.id) ?? participant.target_weekly_hours;
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
  remainingTargetHours: string;
}): AssignmentTeacherDisabledReason | null {
  if (participant.status !== "active") return "participant_inactive";
  if (slot === null) return null;
  if (held.some((assignment) => assignment.teaching_activity_id === slot.activityId)) {
    return "duplicate_activity_position";
  }
  if (compareHours(slot.teacherHours, remainingTargetHours) > 0) {
    return "exceeds_remaining_target";
  }
  return null;
}
