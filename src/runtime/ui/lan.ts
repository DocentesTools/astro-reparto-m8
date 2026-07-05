import type {
  CurrentTurnSummary,
  MeetingSessionPublic,
  TeacherLanSummary
} from "../schemas.js";

export type LanConnectionState = "disconnected" | "live" | "stale";

export type CurrentTurnDisplayState = {
  statusLabel: string;
  turnLabel: string;
  positionLabel: string;
  startedLabel: string;
};

export type TeacherChoiceState = {
  canChoose: boolean;
  disabledReason: string | null;
  impactHours: number;
  confirmationLabel: string;
  passTurnEnabled: boolean;
};

type TeacherChoiceInput = {
  summary: TeacherLanSummary;
  meetingSession: MeetingSessionPublic | null;
  requirementRequiredHours: number;
  requirementAssignedHours: number;
};

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

export function buildTeacherChoiceState(
  input: TeacherChoiceInput
): TeacherChoiceState {
  const pendingHours = Math.max(
    0,
    input.requirementRequiredHours - input.requirementAssignedHours
  );
  const passTurnEnabled = isOwnTurn(input.summary);
  const disabledReason = teacherChoiceDisabledReason(input, pendingHours);
  return {
    canChoose: disabledReason === null,
    disabledReason,
    impactHours: pendingHours,
    confirmationLabel: `${pendingHours} hours will be assigned to you.`,
    passTurnEnabled
  };
}

export function directChoiceConflictMessage(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes("covered") || normalized.includes("duplicate")) {
    return "This requirement was already covered.";
  }
  if (normalized.includes("turn")) {
    return "The active turn changed. Refresh the meeting state.";
  }
  return message;
}

function teacherChoiceDisabledReason(
  input: TeacherChoiceInput,
  pendingHours: number
): string | null {
  const session = input.meetingSession;
  if (session === null || !["open", "selecting"].includes(session.status)) {
    return "Meeting is not open.";
  }
  if (!session.direct_teacher_selection_enabled) {
    return "Direct selection is disabled.";
  }
  if (input.summary.current_turn !== null && !isOwnTurn(input.summary)) {
    return "It is another teacher's turn.";
  }
  if (pendingHours <= 0) return "Requirement is already covered.";
  return null;
}

function isOwnTurn(summary: TeacherLanSummary): boolean {
  return summary.current_turn?.process_teacher_id === summary.process_teacher_id;
}

function labelFromStatus(status: CurrentTurnSummary["status"]): string {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
