import type {
  AssignmentProcessStatus,
  CurrentTurnSummary,
  ExportArtifactPublic,
  ProcessSummary,
  ProcessVersionPublic,
  VersionComparison
} from "../schemas.js";
import {
  buildCurrentTurnDisplay,
  buildExportCenterState,
  buildVersionComparisonLabel,
  canCompareVersions,
  nextLeadershipWorkflowAction
} from "../ui/index.js";

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

const fallbackSummary: ProcessSummary = {
  process_id: "00000000-0000-4000-8000-000000000001",
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
  validations: [],
  current_turn: null,
  blocking_validation_count: 0
};

const fallbackComparison: VersionComparison = {
  left_version_id: "00000000-0000-4000-8000-000000000011",
  right_version_id: "00000000-0000-4000-8000-000000000012",
  changed_sections: [],
  required_hours_delta: 0,
  assigned_hours_delta: 0,
  teacher_count_delta: 0,
  requirement_count_delta: 0,
  assignment_count_delta: 0
};

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

export function VersionsView({
  comparison = fallbackComparison,
  versions = []
}: {
  comparison?: VersionComparison;
  versions?: ProcessVersionPublic[];
}) {
  const comparisonEnabled = canCompareVersions(versions);
  const comparisonLabel = buildVersionComparisonLabel(comparison);
  return (
    <main className="reparto-shell" data-reparto-route="versions">
      <div className="reparto-grid reparto-grid-main">
        <section className="reparto-panel" data-reparto-panel="version-list">
          <div className="reparto-panel-header">
            <h2>Versions</h2>
            <span data-reparto-slot="version-count">{versions.length}</span>
          </div>
          <div data-reparto-slot="versions" />
          <div className="reparto-actions">
            <button type="button" data-reparto-action="create-version">
              create version
            </button>
            <button
              data-reparto-action="compare-versions"
              disabled={!comparisonEnabled}
              type="button"
            >
              compare versions
            </button>
          </div>
        </section>
        <section className="reparto-panel" data-reparto-panel="comparison">
          <div className="reparto-panel-header">
            <h2>Comparison</h2>
            <span data-reparto-slot="comparison-state">{comparisonLabel}</span>
          </div>
          <dl className="reparto-metrics">
            <div>
              <dt>Required delta</dt>
              <dd data-reparto-slot="required-hours-delta">
                {comparison.required_hours_delta}
              </dd>
            </div>
            <div>
              <dt>Assigned delta</dt>
              <dd data-reparto-slot="assigned-hours-delta">
                {comparison.assigned_hours_delta}
              </dd>
            </div>
            <div>
              <dt>Teachers</dt>
              <dd data-reparto-slot="teacher-count-delta">
                {comparison.teacher_count_delta}
              </dd>
            </div>
          </dl>
          <div data-reparto-slot="comparison-detail" />
        </section>
      </div>
    </main>
  );
}

export function ExportCenterView({
  exports = [],
  processId,
  processStatus = "draft",
  summary = fallbackSummary
}: {
  exports?: ExportArtifactPublic[];
  processId?: string;
  processStatus?: AssignmentProcessStatus;
  summary?: ProcessSummary;
}) {
  const state = buildExportCenterState(summary, exports);
  const workflowAction = nextLeadershipWorkflowAction(processStatus);
  return (
    <main
      className="reparto-shell"
      data-process-id={processId}
      data-reparto-route="exports"
      data-reparto-workflow-action={workflowAction ?? "none"}
    >
      <div className="reparto-grid reparto-grid-main">
        <section className="reparto-panel" data-reparto-panel="export-center">
          <div className="reparto-panel-header">
            <h2>Export center</h2>
            <span data-reparto-slot="export-state">
              {state.finalBlocked ? "Final blocked" : "Final ready"}
            </span>
          </div>
          <div className="reparto-export-types">
            {state.availableExportTypes.map((exportType) => (
              <button
                data-reparto-action="create-export"
                data-reparto-export-type={exportType}
                key={exportType}
                type="button"
              >
                {exportType.replaceAll("_", " ")}
              </button>
            ))}
          </div>
          <div data-reparto-slot="export-list" />
        </section>
        <section className="reparto-panel" data-reparto-panel="final-close">
          <div className="reparto-panel-header">
            <h2>Closeout</h2>
            <span data-reparto-slot="blocking-count">
              {summary.blocking_validation_count}
            </span>
          </div>
          <div className="reparto-actions">
            <button
              data-reparto-action="create-final-export"
              disabled={state.finalBlocked}
              type="button"
            >
              final export
            </button>
            <button
              data-reparto-action="restore-draft"
              data-reparto-backup-id={state.latestBackupId ?? ""}
              disabled={!state.restoreDraftEnabled}
              type="button"
            >
              restore draft
            </button>
          </div>
          <div data-reparto-slot="restore-result" />
        </section>
        <section className="reparto-panel" data-reparto-panel="leadership-workflow">
          <div className="reparto-panel-header">
            <h2>Leadership workflow</h2>
            <span data-reparto-slot="process-status">{processStatus}</span>
          </div>
          <div className="reparto-actions">
            <button
              data-reparto-action="mark-returned"
              data-reparto-active={workflowAction === "mark-returned"}
              type="button"
            >
              mark returned
            </button>
            <button
              data-reparto-action="start-revision"
              data-reparto-active={workflowAction === "start-revision"}
              type="button"
            >
              start revision
            </button>
            <button
              data-reparto-action="reopen-final"
              data-reparto-active={workflowAction === "reopen-final"}
              type="button"
            >
              reopen final
            </button>
          </div>
          <div data-reparto-slot="workflow-result" />
        </section>
      </div>
    </main>
  );
}
