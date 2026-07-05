import { assignmentProcesses } from "../api/index.js";
import type { ProcessSummary, TeacherLanSummary } from "../schemas.js";
import { CurrentTurnCard } from "./DepartmentHeadWorkspace.js";

function eventStreamUrl(processId?: string): string | undefined {
  return processId ? assignmentProcesses.eventsUrl(processId) : undefined;
}

export function TeacherLanWorkspace({
  processId,
  summary = null
}: {
  processId?: string;
  summary?: TeacherLanSummary | null;
}) {
  const eventsUrl = eventStreamUrl(processId);
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
        <section className="reparto-panel" data-reparto-panel="available-requirements">
          <div className="reparto-panel-header">
            <h2>Available groups</h2>
            <span data-reparto-slot="turn-status" />
          </div>
          <CurrentTurnCard currentTurn={summary?.current_turn ?? null} />
          <div data-reparto-slot="available-requirements-table" />
          <div className="reparto-actions">
            <button data-reparto-action="direct-choice" type="button">
              choose
            </button>
            <button data-reparto-action="pass-turn" type="button">
              pass
            </button>
          </div>
          <div data-reparto-slot="choice-result" />
        </section>
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
