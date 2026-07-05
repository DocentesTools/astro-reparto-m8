import type { CurrentTurnSummary, ProcessSummary } from "../schemas.js";
import { buildCurrentTurnDisplay } from "../ui/index.js";

const sections = [
  {
    id: "process-flow",
    title: "Processes",
    actions: ["create-process", "copy-from-previous-year", "open-process"],
    fields: ["academic-year", "school", "department"]
  },
  {
    id: "setup-wizard",
    title: "Setup",
    actions: ["save-setup", "continue-to-teachers"],
    fields: ["default-hours", "selection-mode", "lan-access"]
  },
  {
    id: "lan-meeting-settings",
    title: "LAN Meeting",
    actions: ["create-session", "update-session", "close-session"],
    fields: ["lan-access", "direct-selection", "selection-mode", "session-notes"]
  },
  {
    id: "teachers-view",
    title: "Teachers",
    actions: ["add-teacher", "link-auth-user", "save-teacher-hours"],
    fields: ["teacher-name", "available-hours", "selection-position"]
  },
  {
    id: "required-hours",
    title: "Required Hours",
    actions: ["add-subject", "add-group", "add-requirement"],
    fields: ["subject", "teaching-group", "required-hours"]
  },
  {
    id: "manual-assignment-board",
    title: "Assignments",
    actions: ["assign-requirement", "record-override", "validate-process"],
    fields: ["requirement", "process-teacher", "assigned-hours"]
  },
  {
    id: "validation-summary",
    title: "Validation",
    actions: ["refresh-summary", "transition-process"],
    fields: [
      "blocking-count",
      "global-balance",
      "teacher-balance",
      "process-summary-stream"
    ]
  },
  {
    id: "version-list",
    title: "Versions",
    actions: ["create-version", "compare-versions"],
    fields: ["version-reason", "left-version", "right-version"]
  }
] as const;

export function CurrentTurnCard({
  currentTurn
}: {
  currentTurn: CurrentTurnSummary | null;
}) {
  const display = buildCurrentTurnDisplay(currentTurn);
  return (
    <div
      className="reparto-turn-summary"
      data-reparto-slot="current-turn"
      data-reparto-turn-status={currentTurn?.status ?? "none"}
    >
      <div>
        <span>Status</span>
        <strong>{display.statusLabel}</strong>
      </div>
      <div>
        <span>Turn</span>
        <strong>{display.positionLabel}</strong>
      </div>
      <div>
        <span>Teacher</span>
        <strong>{display.turnLabel}</strong>
      </div>
      <div>
        <span>Started</span>
        <strong>{display.startedLabel}</strong>
      </div>
    </div>
  );
}

export function DepartmentHeadWorkspace({
  summary = null
}: {
  summary?: ProcessSummary | null;
}) {
  return (
    <main className="reparto-shell" data-reparto-route="dashboard">
      <header className="reparto-header">
        <p className="reparto-eyebrow">Department head</p>
        <h1>Reparto docente</h1>
      </header>
      <div className="reparto-grid">
        <section className="reparto-panel" data-reparto-panel="current-turn">
          <div className="reparto-panel-header">
            <h2>Current turn</h2>
            <span data-reparto-slot="turn-status" />
          </div>
          <CurrentTurnCard currentTurn={summary?.current_turn ?? null} />
          <div className="reparto-actions">
            <button data-reparto-action="initialize-turns" type="button">
              initialize turns
            </button>
            <button data-reparto-action="start-turn" type="button">
              start turn
            </button>
            <button data-reparto-action="complete-turn" type="button">
              complete turn
            </button>
            <button data-reparto-action="skip-turn" type="button">
              skip turn
            </button>
            <button data-reparto-action="override-turn" type="button">
              override turn
            </button>
          </div>
        </section>
        {sections.map((section) => (
          <section
            className="reparto-panel"
            data-reparto-panel={section.id}
            key={section.id}
          >
            <div className="reparto-panel-header">
              <h2>{section.title}</h2>
              <span data-reparto-slot={`${section.id}-status`} />
            </div>
            <div className="reparto-fields">
              {section.fields.map((field) => (
                <label data-reparto-field={field} key={field}>
                  <span>{field.replaceAll("-", " ")}</span>
                  <input name={field} />
                </label>
              ))}
            </div>
            <div className="reparto-actions">
              {section.actions.map((action) => (
                <button data-reparto-action={action} key={action} type="button">
                  {action.replaceAll("-", " ")}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

export function ProcessListView() {
  return (
    <main className="reparto-shell" data-reparto-route="processes">
      <section className="reparto-panel" data-reparto-panel="process-list">
        <div data-reparto-slot="process-table" />
        <button type="button" data-reparto-action="create-process">
          create process
        </button>
      </section>
    </main>
  );
}

export function VersionsView() {
  return (
    <main className="reparto-shell" data-reparto-route="versions">
      <section className="reparto-panel" data-reparto-panel="version-list">
        <div data-reparto-slot="versions" />
        <button type="button" data-reparto-action="create-version">
          create version
        </button>
        <button type="button" data-reparto-action="compare-versions">
          compare versions
        </button>
      </section>
    </main>
  );
}
