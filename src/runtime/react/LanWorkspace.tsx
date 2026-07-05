import { assignmentProcesses } from "../api/index.js";
import type {
  MeetingSessionPublic,
  ProcessSummary,
  TeacherLanSummary
} from "../schemas.js";
import { buildTeacherChoiceState, directChoiceConflictMessage } from "../ui/index.js";
import { CurrentTurnCard } from "./DepartmentHeadWorkspace.js";

function eventStreamUrl(processId?: string): string | undefined {
  return processId ? assignmentProcesses.eventsUrl(processId) : undefined;
}

const fallbackTeacherSummary: TeacherLanSummary = {
  process_id: "00000000-0000-4000-8000-000000000001",
  teacher_profile_id: "00000000-0000-4000-8000-000000000002",
  process_teacher_id: "00000000-0000-4000-8000-000000000003",
  generated_at: "2026-07-05T00:00:00Z",
  global_balance: {
    total_required_hours: 0,
    total_available_hours: 0,
    total_assigned_hours: 0,
    pending_required_hours: 0,
    availability_difference: 0,
    uncovered_requirements: 0,
    overloaded_teachers: 0,
    state: "pending"
  },
  teacher_balance: {
    process_teacher_id: "00000000-0000-4000-8000-000000000003",
    teacher_profile_id: "00000000-0000-4000-8000-000000000002",
    display_name: "Teacher",
    available_hours: 0,
    assigned_hours: 0,
    remaining_hours: 0,
    excess_hours: 0,
    assignment_count: 0,
    has_override: false,
    state: "pending"
  },
  current_turn: null,
  blocking_validation_count: 0
};

function TeacherDirectChoicePanel({
  meetingSession = null,
  requirementAssignedHours = 0,
  requirementRequiredHours = 0,
  summary
}: {
  meetingSession?: MeetingSessionPublic | null;
  requirementAssignedHours?: number;
  requirementRequiredHours?: number;
  summary: TeacherLanSummary;
}) {
  const choice = buildTeacherChoiceState({
    meetingSession,
    requirementAssignedHours,
    requirementRequiredHours,
    summary
  });
  const conflictMessage = directChoiceConflictMessage(
    choice.disabledReason ?? "Ready to choose."
  );
  return (
    <section
      className="reparto-panel"
      data-reparto-panel="direct-choice-workflow"
      data-reparto-choice-state={choice.canChoose ? "ready" : "blocked"}
    >
      <div className="reparto-panel-header">
        <h2>Choose group</h2>
        <span data-reparto-slot="choice-state">{conflictMessage}</span>
      </div>
      <div className="reparto-choice-layout">
        <div data-reparto-slot="available-requirements-table" />
        <aside className="reparto-confirmation" data-reparto-slot="choice-confirmation">
          <span>Confirmation</span>
          <strong>{choice.confirmationLabel}</strong>
          <p data-reparto-slot="choice-conflict">{conflictMessage}</p>
        </aside>
      </div>
      <div className="reparto-actions">
        <button
          data-reparto-action="direct-choice"
          data-reparto-impact-hours={choice.impactHours}
          disabled={!choice.canChoose}
          type="button"
        >
          choose
        </button>
        <button
          data-reparto-action="pass-turn"
          disabled={!choice.passTurnEnabled}
          type="button"
        >
          pass
        </button>
      </div>
      <div data-reparto-slot="choice-result" />
    </section>
  );
}

export function TeacherLanWorkspace({
  meetingSession = null,
  processId,
  requirementAssignedHours = 0,
  requirementRequiredHours = 0,
  summary = null
}: {
  meetingSession?: MeetingSessionPublic | null;
  processId?: string;
  requirementAssignedHours?: number;
  requirementRequiredHours?: number;
  summary?: TeacherLanSummary | null;
}) {
  const eventsUrl = eventStreamUrl(processId);
  const safeSummary = summary ?? fallbackTeacherSummary;
  return (
    <main
      className="reparto-shell"
      data-process-id={processId}
      data-reparto-control="lan-teacher"
      data-reparto-events-url={eventsUrl}
      data-reparto-route="my-view"
    >
      <header className="reparto-header">
        <p className="reparto-eyebrow">LAN meeting</p>
        <h1>My teaching load</h1>
      </header>
      <div className="reparto-grid reparto-grid-main">
        <section className="reparto-panel" data-reparto-panel="teacher-summary">
          <div className="reparto-panel-header">
            <h2>Summary</h2>
            <span data-reparto-slot="connection-state" />
          </div>
          <dl className="reparto-metrics">
            <div>
              <dt>Available</dt>
              <dd data-reparto-slot="teacher-available-hours" />
            </div>
            <div>
              <dt>Assigned</dt>
              <dd data-reparto-slot="teacher-assigned-hours" />
            </div>
            <div>
              <dt>Remaining</dt>
              <dd data-reparto-slot="teacher-remaining-hours" />
            </div>
          </dl>
          <div data-reparto-slot="teacher-balance" />
        </section>
        <section className="reparto-panel" data-reparto-panel="turn-and-balance">
          <div className="reparto-panel-header">
            <h2>Turn state</h2>
            <span data-reparto-slot="turn-status" />
          </div>
          <CurrentTurnCard currentTurn={summary?.current_turn ?? null} />
        </section>
        <TeacherDirectChoicePanel
          meetingSession={meetingSession}
          requirementAssignedHours={requirementAssignedHours}
          requirementRequiredHours={requirementRequiredHours}
          summary={safeSummary}
        />
      </div>
    </main>
  );
}

export function SharedScreenWorkspace({
  processId,
  summary = null
}: {
  processId?: string;
  summary?: ProcessSummary | null;
}) {
  const eventsUrl = eventStreamUrl(processId);
  return (
    <main
      className="reparto-shell reparto-shared-screen"
      data-process-id={processId}
      data-reparto-control="projected-summary"
      data-reparto-events-url={eventsUrl}
      data-reparto-route="shared-screen"
    >
      <header className="reparto-header">
        <p className="reparto-eyebrow">Department meeting</p>
        <h1>Reparto live state</h1>
      </header>
      <div className="reparto-grid reparto-grid-main">
        <section className="reparto-panel" data-reparto-panel="global-state">
          <div className="reparto-panel-header">
            <h2>Balance</h2>
            <span data-reparto-slot="connection-state" />
          </div>
          <dl className="reparto-metrics">
            <div>
              <dt>Required</dt>
              <dd data-reparto-slot="total-required-hours" />
            </div>
            <div>
              <dt>Assigned</dt>
              <dd data-reparto-slot="total-assigned-hours" />
            </div>
            <div>
              <dt>Pending</dt>
              <dd data-reparto-slot="pending-required-hours" />
            </div>
          </dl>
          <div data-reparto-slot="global-balance" />
        </section>
        <section className="reparto-panel" data-reparto-panel="turn-state">
          <div className="reparto-panel-header">
            <h2>Current turn</h2>
            <span data-reparto-slot="turn-status" />
          </div>
          <CurrentTurnCard currentTurn={summary?.current_turn ?? null} />
          <div data-reparto-slot="validations" />
        </section>
      </div>
    </main>
  );
}
