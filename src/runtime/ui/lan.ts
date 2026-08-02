import { compareHours, normalizeHours, type HourValue } from "../decimals.js";
import { mapRepartoError } from "../errorMapping.js";
import {
  RepartoApiError,
  RepartoUnauthenticatedError
} from "../errors.js";
import type {
  AssignmentPublic,
  CurrentTurnSummary,
  HourRequirementPublic,
  MeetingSessionPublic,
  PlanReadiness
} from "../schemas.js";
import {
  buildAssignmentSlotOptions,
  type AssignmentSlotOption
} from "./assignments.js";

export type LanConnectionState = "disconnected" | "live" | "stale";

export type CurrentTurnDisplayState = {
  statusLabel: string;
  turnLabel: string;
  positionLabel: string;
  startedLabel: string;
};

/**
 * Why a teacher cannot take a position right now — a stable code, never a
 * sentence. The panel translates it; nothing branches on display text.
 *
 * The first five are about the *meeting and the plan* and disable the whole
 * panel; the last four are about one slot and disable that row only.
 */
export type TeacherChoiceDisabledReason =
  | "meeting_not_open"
  | "direct_selection_disabled"
  | "plan_not_ready"
  | "reconciliation_required"
  | "selection_blocked"
  | "not_your_turn"
  | "no_slot_chosen"
  | "slot_occupied"
  | "slot_not_available"
  | "duplicate_activity_position"
  | "exceeds_remaining_target";

/** One offered position, with its own hours and its own verdict. */
export type TeacherSlotChoice = {
  slotId: string;
  activityId: string;
  positionIndex: number;
  teacherHours: string;
  canChoose: boolean;
  disabledReason: TeacherChoiceDisabledReason | null;
};

export type TeacherChoiceState = {
  canChoose: boolean;
  disabledReason: TeacherChoiceDisabledReason | null;
  slots: TeacherSlotChoice[];
  selectableCount: number;
  selectedSlot: TeacherSlotChoice | null;
  /** Hours the chosen position would assign, or `null` with nothing chosen. */
  impactHours: string | null;
  remainingTargetHours: string | null;
  passTurnEnabled: boolean;
};

export type TeacherChoiceInput = {
  /** The viewer's own participation row. */
  processTeacherId: string;
  currentTurn: CurrentTurnSummary | null;
  meetingSession: MeetingSessionPublic | null;
  /**
   * The service's coarse, role-safe plan projection (backend plan §20.25).
   * Absent means *not known*, which blocks: a teacher client never assumes the
   * assignment stage is open.
   */
  readiness?: PlanReadiness | null;
  /** The service's own "selections are blocked" flag; absent means unknown. */
  selectionBlocked?: boolean | null;
  /**
   * `target_weekly_hours − assigned`, from the service. `null`/absent leaves the
   * exact-fit rule to the service instead of guessing it.
   */
  remainingTargetHours?: HourValue | null;
  requirements: readonly HourRequirementPublic[];
  assignments: readonly AssignmentPublic[];
  selectedSlotId?: string | null;
};

/**
 * Teacher-side direct-selection state (backend plan §3.6, §3.7, §3.8, §20.25).
 *
 * The two-stage helper this replaces computed `required − assigned` and called
 * the remainder "hours that will be assigned to you". Under the three-stage
 * contract a position is indivisible: a teacher either takes the whole slot or
 * does not take it, so the questions are *may I select at all* and *which
 * positions may I take* — never *how many hours*.
 *
 * Every gate here mirrors one the service enforces, and each one fails closed:
 * an absent readiness, an absent blocked flag or an unknown slot blocks the
 * choice rather than letting a teacher press a button the backend will refuse
 * mid-meeting. The exact-fit rule is the single exception, because the target
 * is a *value* the client may legitimately not have been given: it is skipped
 * when unknown and enforced whenever the caller supplies it.
 */
export function buildTeacherChoiceState(
  input: TeacherChoiceInput
): TeacherChoiceState {
  const slotOptions = buildAssignmentSlotOptions(
    input.requirements,
    input.assignments
  );
  const remainingTargetHours =
    input.remainingTargetHours === null ||
    input.remainingTargetHours === undefined
      ? null
      : normalizeHours(input.remainingTargetHours);
  const heldActivityIds = new Set(
    input.assignments
      .filter(
        (assignment) =>
          assignment.status === "active" &&
          assignment.process_teacher_id === input.processTeacherId
      )
      .map((assignment) => assignment.teaching_activity_id)
  );
  const slots = slotOptions.map((slot) =>
    describeSlotChoice(slot, heldActivityIds, remainingTargetHours)
  );
  const selectable = slots.filter((slot) => slot.canChoose);
  const selectedSlot =
    slots.find((slot) => slot.slotId === input.selectedSlotId) ?? null;
  const sessionReason = sessionDisabledReason(input);
  const disabledReason =
    sessionReason ??
    (selectedSlot === null ? "no_slot_chosen" : selectedSlot.disabledReason);

  return {
    canChoose: disabledReason === null,
    disabledReason,
    slots,
    selectableCount: selectable.length,
    selectedSlot,
    impactHours: selectedSlot?.teacherHours ?? null,
    remainingTargetHours,
    passTurnEnabled: isOwnTurn(input)
  };
}

/** Why a direct choice was refused, keyed off the status, never the wording. */
export type DirectChoiceConflictReason =
  | "state_changed"
  | "refused"
  | "not_found"
  | "not_allowed"
  | "signed_out"
  | "network"
  | "server";

export type DirectChoiceConflict = {
  reason: DirectChoiceConflictReason;
  /** The service's own explanation, passed through untranslated. */
  message: string;
};

/**
 * Classify a refused direct choice.
 *
 * The previous helper searched the response text for `"covered"` and `"turn"`,
 * which breaks the moment the service rewords a message or answers in another
 * language. The service emits no machine code on this path, but it does emit a
 * status, and the status alone separates the two cases a teacher must tell
 * apart mid-meeting: **409** means the reparto moved under them (a position was
 * taken, the turn changed, the remaining state could not be repaired) and the
 * answer is to refresh and choose again; **400/422** means this choice breaks a
 * rule and choosing again will not help. The service's own sentence is passed
 * through untranslated as supporting detail, never parsed.
 */
export function classifyDirectChoiceConflict(
  error: unknown
): DirectChoiceConflict {
  // The message is the service's own; a field-level rejection carries no form
  // message at all, and the panel then shows only the localized reason.
  const message = mapRepartoError(error).formError?.message ?? "";
  if (error instanceof RepartoApiError) {
    return { reason: reasonFromStatus(error.status), message };
  }
  // Not an HTTP answer at all.
  if (error instanceof RepartoUnauthenticatedError) {
    return { reason: "signed_out", message };
  }
  if (error instanceof TypeError) return { reason: "network", message };
  return { reason: "server", message };
}

function reasonFromStatus(status: number): DirectChoiceConflictReason {
  if (status === 409) return "state_changed";
  if (status === 400 || status === 422) return "refused";
  if (status === 404) return "not_found";
  if (status === 403) return "not_allowed";
  if (status === 401) return "signed_out";
  return "server";
}

export function getLanConnectionState(
  lastEventAtMs: number | null,
  nowMs: number,
  staleAfterMs = 15000
): LanConnectionState {
  if (lastEventAtMs === null) return "disconnected";
  return nowMs - lastEventAtMs > staleAfterMs ? "stale" : "live";
}

export function buildCurrentTurnDisplay(
  currentTurn: CurrentTurnSummary | null
): CurrentTurnDisplayState {
  if (currentTurn === null) {
    return {
      statusLabel: "Waiting",
      turnLabel: "No active turn",
      positionLabel: "No position",
      startedLabel: "Not started"
    };
  }
  return {
    statusLabel: labelFromStatus(currentTurn.status),
    turnLabel: `Teacher ${currentTurn.process_teacher_id}`,
    positionLabel: `Turn ${currentTurn.position + 1}`,
    startedLabel: currentTurn.started_at ?? "Not started"
  };
}

function describeSlotChoice(
  slot: AssignmentSlotOption,
  heldActivityIds: ReadonlySet<string>,
  remainingTargetHours: string | null
): TeacherSlotChoice {
  const base = {
    slotId: slot.slotId,
    activityId: slot.activityId,
    positionIndex: slot.positionIndex,
    teacherHours: slot.teacherHours
  };
  if (slot.disabledReason !== null) {
    return { ...base, canChoose: false, disabledReason: slot.disabledReason };
  }
  // Plan §3.7: two positions of one activity are two teachers, always.
  if (heldActivityIds.has(slot.activityId)) {
    return {
      ...base,
      canChoose: false,
      disabledReason: "duplicate_activity_position"
    };
  }
  // Plan §3.8: the position is indivisible, so it fits only whole. There is no
  // override — extra hours are authorized by the department head beforehand.
  if (
    remainingTargetHours !== null &&
    compareHours(slot.teacherHours, remainingTargetHours) > 0
  ) {
    return {
      ...base,
      canChoose: false,
      disabledReason: "exceeds_remaining_target"
    };
  }
  return { ...base, canChoose: true, disabledReason: null };
}

function sessionDisabledReason(
  input: TeacherChoiceInput
): TeacherChoiceDisabledReason | null {
  const session = input.meetingSession;
  if (session === null || !["open", "selecting"].includes(session.status)) {
    return "meeting_not_open";
  }
  if (!session.direct_teacher_selection_enabled) {
    return "direct_selection_disabled";
  }
  if (input.readiness === "recalculation_required") {
    return "reconciliation_required";
  }
  if (input.readiness !== "ready") return "plan_not_ready";
  if (input.selectionBlocked !== false) return "selection_blocked";
  if (input.currentTurn !== null && !isOwnTurn(input)) return "not_your_turn";
  return null;
}

function isOwnTurn(input: TeacherChoiceInput): boolean {
  return input.currentTurn?.process_teacher_id === input.processTeacherId;
}

function labelFromStatus(status: CurrentTurnSummary["status"]): string {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
