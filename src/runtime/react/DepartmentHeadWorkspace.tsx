import type {
  AssignmentProcessPublic,
  AssignmentProcessStatus,
  CurrentTurnSummary,
  ExportArtifactPublic,
  ProcessDashboard,
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
import {
  repartoActionRowClass,
  repartoButtonClass,
  repartoEyebrowClass,
  repartoFieldCaptionClass,
  repartoFieldGridClass,
  repartoFieldLabelClass,
  repartoGridClass,
  repartoHeaderClass,
  repartoInputClass,
  repartoListClass,
  repartoListItemClass,
  repartoMainGridClass,
  repartoMetricItemClass,
  repartoMetricLabelClass,
  repartoMetricValueClass,
  repartoMetricValueLargeClass,
  repartoMetricsClass,
  repartoPanelClass,
  repartoPanelHeaderClass,
  repartoShellClass,
  repartoTurnSummaryClass,
  repartoTurnSummaryItemClass
} from "./styles.js";

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
      className={repartoTurnSummaryClass}
      data-reparto-slot="current-turn"
      data-reparto-turn-status={currentTurn?.status ?? "none"}
    >
      <div className={repartoTurnSummaryItemClass}>
        <span className={repartoMetricLabelClass}>Status</span>
        <strong className={repartoMetricValueClass}>{display.statusLabel}</strong>
      </div>
      <div className={repartoTurnSummaryItemClass}>
        <span className={repartoMetricLabelClass}>Turn</span>
        <strong className={repartoMetricValueClass}>{display.positionLabel}</strong>
      </div>
      <div className={repartoTurnSummaryItemClass}>
        <span className={repartoMetricLabelClass}>Teacher</span>
        <strong className={repartoMetricValueClass}>{display.turnLabel}</strong>
      </div>
      <div className={repartoTurnSummaryItemClass}>
        <span className={repartoMetricLabelClass}>Started</span>
        <strong className={repartoMetricValueClass}>{display.startedLabel}</strong>
      </div>
    </div>
  );
}

export function DepartmentHeadWorkspace({
  dashboard,
  summary = null
}: {
  dashboard?: ProcessDashboard | null;
  summary?: ProcessSummary | null;
}) {
  const activeSummary = summary ?? dashboard ?? null;
  return (
    <main className={repartoShellClass} data-reparto-route="dashboard">
      <header className={repartoHeaderClass}>
        <p className={repartoEyebrowClass}>Department head</p>
        <h1>Reparto docente</h1>
      </header>
      <div className={repartoGridClass}>
        <section className={repartoPanelClass} data-reparto-panel="current-turn">
          <div className={repartoPanelHeaderClass}>
            <h2>Current turn</h2>
            <span className="text-sm text-muted-foreground" data-reparto-slot="turn-status" />
          </div>
          <CurrentTurnCard currentTurn={activeSummary?.current_turn ?? null} />
          {activeSummary ? (
            <dl className={repartoMetricsClass}>
              <div className={repartoMetricItemClass}>
                <dt className={repartoMetricLabelClass}>Required</dt>
                <dd className={repartoMetricValueLargeClass} data-reparto-slot="total-required-hours">
                  {activeSummary.global_balance.total_required_hours}
                </dd>
              </div>
              <div className={repartoMetricItemClass}>
                <dt className={repartoMetricLabelClass}>Assigned</dt>
                <dd className={repartoMetricValueLargeClass} data-reparto-slot="total-assigned-hours">
                  {activeSummary.global_balance.total_assigned_hours}
                </dd>
              </div>
              <div className={repartoMetricItemClass}>
                <dt className={repartoMetricLabelClass}>Blocking</dt>
                <dd className={repartoMetricValueLargeClass} data-reparto-slot="blocking-count">
                  {activeSummary.blocking_validation_count}
                </dd>
              </div>
            </dl>
          ) : null}
          <div className={repartoActionRowClass}>
            <button className={repartoButtonClass} data-reparto-action="initialize-turns" type="button">
              initialize turns
            </button>
            <button className={repartoButtonClass} data-reparto-action="start-turn" type="button">
              start turn
            </button>
            <button className={repartoButtonClass} data-reparto-action="complete-turn" type="button">
              complete turn
            </button>
            <button className={repartoButtonClass} data-reparto-action="skip-turn" type="button">
              skip turn
            </button>
            <button className={repartoButtonClass} data-reparto-action="override-turn" type="button">
              override turn
            </button>
          </div>
        </section>
        {sections.map((section) => (
          <section
            className={repartoPanelClass}
            data-reparto-panel={section.id}
            key={section.id}
          >
            <div className={repartoPanelHeaderClass}>
              <h2>{section.title}</h2>
              <span
                className="text-sm text-muted-foreground"
                data-reparto-slot={`${section.id}-status`}
              />
            </div>
            <div className={repartoFieldGridClass}>
              {section.fields.map((field) => (
                <label className={repartoFieldLabelClass} data-reparto-field={field} key={field}>
                  <span className={repartoFieldCaptionClass}>{field.replaceAll("-", " ")}</span>
                  <input className={repartoInputClass} name={field} />
                </label>
              ))}
            </div>
            <div className={repartoActionRowClass}>
              {section.actions.map((action) => (
                <button
                  className={repartoButtonClass}
                  data-reparto-action={action}
                  key={action}
                  type="button"
                >
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

export function ProcessListView({
  count = 0,
  processes = []
}: {
  count?: number;
  processes?: AssignmentProcessPublic[];
}) {
  return (
    <main className={repartoShellClass} data-reparto-route="processes">
      <section className={repartoPanelClass} data-reparto-panel="process-list">
        <div className={repartoPanelHeaderClass}>
          <h2>Processes</h2>
          <span className="text-sm text-muted-foreground" data-reparto-slot="process-count">
            {count}
          </span>
        </div>
        <div data-reparto-slot="process-table">
          {processes.length > 0 ? (
            <ul className={repartoListClass}>
              {processes.map((process) => (
                <li
                  className={repartoListItemClass}
                  data-process-id={process.id}
                  data-process-status={process.status}
                  key={process.id}
                >
                  {process.status}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <button className={repartoButtonClass} type="button" data-reparto-action="create-process">
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
    <main className={repartoShellClass} data-reparto-route="versions">
      <div className={repartoMainGridClass}>
        <section className={repartoPanelClass} data-reparto-panel="version-list">
          <div className={repartoPanelHeaderClass}>
            <h2>Versions</h2>
            <span className="text-sm text-muted-foreground" data-reparto-slot="version-count">
              {versions.length}
            </span>
          </div>
          <div data-reparto-slot="versions">
            {versions.length > 0 ? (
              <ul className={repartoListClass}>
                {versions.map((version) => (
                  <li
                    className={repartoListItemClass}
                    data-process-version-id={version.id}
                    data-process-version-status={version.status}
                    key={version.id}
                  >
                    Version {version.version_number}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className={repartoActionRowClass}>
            <button className={repartoButtonClass} type="button" data-reparto-action="create-version">
              create version
            </button>
            <button
              className={repartoButtonClass}
              data-reparto-action="compare-versions"
              disabled={!comparisonEnabled}
              type="button"
            >
              compare versions
            </button>
          </div>
        </section>
        <section className={repartoPanelClass} data-reparto-panel="comparison">
          <div className={repartoPanelHeaderClass}>
            <h2>Comparison</h2>
            <span className="text-sm text-muted-foreground" data-reparto-slot="comparison-state">
              {comparisonLabel}
            </span>
          </div>
          <dl className={repartoMetricsClass}>
            <div className={repartoMetricItemClass}>
              <dt className={repartoMetricLabelClass}>Required delta</dt>
              <dd className={repartoMetricValueLargeClass} data-reparto-slot="required-hours-delta">
                {comparison.required_hours_delta}
              </dd>
            </div>
            <div className={repartoMetricItemClass}>
              <dt className={repartoMetricLabelClass}>Assigned delta</dt>
              <dd className={repartoMetricValueLargeClass} data-reparto-slot="assigned-hours-delta">
                {comparison.assigned_hours_delta}
              </dd>
            </div>
            <div className={repartoMetricItemClass}>
              <dt className={repartoMetricLabelClass}>Teachers</dt>
              <dd className={repartoMetricValueLargeClass} data-reparto-slot="teacher-count-delta">
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
      className={repartoShellClass}
      data-process-id={processId}
      data-reparto-route="exports"
      data-reparto-workflow-action={workflowAction ?? "none"}
    >
      <div className={repartoMainGridClass}>
        <section className={repartoPanelClass} data-reparto-panel="export-center">
          <div className={repartoPanelHeaderClass}>
            <h2>Export center</h2>
            <span className="text-sm text-muted-foreground" data-reparto-slot="export-state">
              {state.finalBlocked ? "Final blocked" : "Final ready"}
            </span>
          </div>
          <div className={repartoActionRowClass}>
            {state.availableExportTypes.map((exportType) => (
              <button
                className={repartoButtonClass}
                data-reparto-action="create-export"
                data-reparto-export-type={exportType}
                key={exportType}
                type="button"
              >
                {exportType.replaceAll("_", " ")}
              </button>
            ))}
          </div>
          <div data-reparto-slot="export-list">
            {exports.length > 0 ? (
              <ul className={repartoListClass}>
                {exports.map((artifact) => (
                  <li
                    className={repartoListItemClass}
                    data-export-artifact-id={artifact.id}
                    data-export-artifact-type={artifact.export_type}
                    key={artifact.id}
                  >
                    {artifact.export_type} {artifact.format}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
        <section className={repartoPanelClass} data-reparto-panel="final-close">
          <div className={repartoPanelHeaderClass}>
            <h2>Closeout</h2>
            <span className="text-sm text-muted-foreground" data-reparto-slot="blocking-count">
              {summary.blocking_validation_count}
            </span>
          </div>
          <div className={repartoActionRowClass}>
            <button
              className={repartoButtonClass}
              data-reparto-action="create-final-export"
              disabled={state.finalBlocked}
              type="button"
            >
              final export
            </button>
            <button
              className={repartoButtonClass}
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
        <section className={repartoPanelClass} data-reparto-panel="leadership-workflow">
          <div className={repartoPanelHeaderClass}>
            <h2>Leadership workflow</h2>
            <span className="text-sm text-muted-foreground" data-reparto-slot="process-status">
              {processStatus}
            </span>
          </div>
          <div className={repartoActionRowClass}>
            <button
              className={repartoButtonClass}
              data-reparto-action="mark-returned"
              data-reparto-active={workflowAction === "mark-returned"}
              type="button"
            >
              mark returned
            </button>
            <button
              className={repartoButtonClass}
              data-reparto-action="start-revision"
              data-reparto-active={workflowAction === "start-revision"}
              type="button"
            >
              start revision
            </button>
            <button
              className={repartoButtonClass}
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
