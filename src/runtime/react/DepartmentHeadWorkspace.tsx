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
  formatRepartoMessage,
  getRepartoDictionary,
  normalizeRepartoLocale,
  type RepartoLocale
} from "../i18n/index.js";
import {
  repartoActionRowClass,
  repartoButtonClass,
  repartoEyebrowClass,
  repartoGridClass,
  repartoHeaderClass,
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
  locale,
  mode = "admin",
  summary = null
}: {
  dashboard?: ProcessDashboard | null;
  locale?: RepartoLocale;
  mode?: "admin" | "readonly";
  summary?: ProcessSummary | null;
}) {
  const dict = getRepartoDictionary(locale ?? normalizeRepartoLocale());
  const activeSummary = summary ?? dashboard ?? null;
  const teacherBalances = dashboard?.teacher_balances ?? [];
  const requirementBalances = dashboard?.requirement_balances ?? [];
  const balance = activeSummary?.global_balance ?? null;
  const checklistSteps = [
    {
      key: "school",
      done: Boolean(activeSummary)
    },
    {
      key: "academicYear",
      done: Boolean(activeSummary)
    },
    {
      key: "department",
      done: Boolean(activeSummary)
    },
    {
      key: "process",
      done: Boolean(activeSummary)
    },
    {
      key: "subjects",
      done: new Set(requirementBalances.map((item) => item.subject_id)).size > 0
    },
    {
      key: "classrooms",
      done: new Set(requirementBalances.map((item) => item.teaching_group_id)).size > 0
    },
    {
      key: "teacherRoster",
      done: teacherBalances.length > 0
    },
    {
      key: "requirements",
      done: requirementBalances.length > 0
    },
    {
      key: "participants",
      done: teacherBalances.length > 0
    }
  ] as const;
  const checklistDoneCount = checklistSteps.filter((step) => step.done).length;
  const chartTotal = Math.max(
    1,
    balance?.total_required_hours ?? 0,
    balance?.total_available_hours ?? 0,
    balance?.total_assigned_hours ?? 0
  );
  const teacherMax = Math.max(
    1,
    ...teacherBalances.map((item) => Math.max(item.available_hours, item.assigned_hours))
  );
  const requirementMax = Math.max(
    1,
    ...requirementBalances.map((item) => item.required_hours)
  );
  const topTeachers = teacherBalances.slice(0, 5);
  const topRequirements = requirementBalances.slice(0, 5);
  const actions = [
    {
      key: "initialize-turns",
      label: dict.action.initializeTurns,
      disabled: Boolean(activeSummary?.current_turn),
      reason: activeSummary?.current_turn ? dict.disabled.processClosed.replace("{status}", "turn-active") : null
    },
    {
      key: "start-turn",
      label: dict.action.startTurn,
      disabled: !activeSummary,
      reason: !activeSummary ? dict.disabled.noData : null
    },
    {
      key: "complete-turn",
      label: dict.action.completeTurn,
      disabled: !activeSummary?.current_turn,
      reason: !activeSummary?.current_turn ? dict.disabled.noData : null
    },
    {
      key: "skip-turn",
      label: dict.action.skipTurn,
      disabled: !activeSummary?.current_turn,
      reason: !activeSummary?.current_turn ? dict.disabled.noData : null
    },
    {
      key: "override-turn",
      label: dict.action.overrideTurn,
      disabled: balance?.state === "balanced",
      reason: balance?.state === "balanced" ? dict.disabled.noData : null
    }
  ] as const;

  return (
    <main className={repartoShellClass} data-reparto-route="dashboard">
      <header className={repartoHeaderClass}>
        <p className={repartoEyebrowClass}>{dict.dashboard.mode[mode]}</p>
        <h1>{dict.dashboard.title}</h1>
        <p className="text-sm text-muted-foreground">
          {mode === "readonly"
            ? dict.dashboard.subtitleReadonly
            : dict.dashboard.subtitleAdmin}
        </p>
      </header>
      <div className={repartoGridClass}>
        <section className={repartoPanelClass} data-reparto-panel="current-turn">
          <div className={repartoPanelHeaderClass}>
            <h2>{dict.dashboard.section.meetingReadiness}</h2>
            <span
              className="text-sm text-muted-foreground"
              data-reparto-slot="turn-status"
            >
              {activeSummary?.current_turn
                ? buildCurrentTurnDisplay(activeSummary.current_turn).statusLabel
                : dict.dashboard.state.noDashboard}
            </span>
          </div>
          <CurrentTurnCard currentTurn={activeSummary?.current_turn ?? null} />
          {balance ? (
            <dl className={repartoMetricsClass}>
              <div className={repartoMetricItemClass}>
                <dt className={repartoMetricLabelClass}>{dict.dashboard.metric.required}</dt>
                <dd
                  className={repartoMetricValueLargeClass}
                  data-reparto-slot="total-required-hours"
                >
                  {balance.total_required_hours}
                </dd>
              </div>
              <div className={repartoMetricItemClass}>
                <dt className={repartoMetricLabelClass}>{dict.dashboard.metric.assigned}</dt>
                <dd
                  className={repartoMetricValueLargeClass}
                  data-reparto-slot="total-assigned-hours"
                >
                  {balance.total_assigned_hours}
                </dd>
              </div>
              <div className={repartoMetricItemClass}>
                <dt className={repartoMetricLabelClass}>{dict.dashboard.metric.blocking}</dt>
                <dd
                  className={repartoMetricValueLargeClass}
                  data-reparto-slot="blocking-count"
                >
                  {activeSummary?.blocking_validation_count ?? 0}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              {dict.dashboard.state.noDashboard}
            </p>
          )}
          {mode === "admin" ? (
            <div className={repartoActionRowClass}>
              {actions.map((action) => (
                <button
                  className={repartoButtonClass}
                  data-disabled-reason={action.reason ?? undefined}
                  data-reparto-action={action.key}
                  disabled={action.disabled}
                  key={action.key}
                  type="button"
                >
                  {action.label}
                </button>
              ))}
            </div>
          ) : null}
          <p className="mt-3 text-sm text-muted-foreground" data-reparto-slot="balance-summary">
            {balance
              ? formatRepartoMessage(dict.dashboard.summary.balance, {
                  assigned: balance.total_assigned_hours,
                  pending: balance.pending_required_hours,
                  required: balance.total_required_hours
                })
              : dict.dashboard.state.noDashboard}
          </p>
        </section>
        <section className={repartoPanelClass} data-reparto-panel="overview-chart">
          <div className={repartoPanelHeaderClass}>
            <h2>{dict.dashboard.section.overview}</h2>
            <span className="text-sm text-muted-foreground" data-reparto-slot="overview-state">
              {balance?.state ?? "pending"}
            </span>
          </div>
          <div className="mt-3 grid gap-3">
            {balance
              ? [
                  {
                    key: "required",
                    label: dict.dashboard.metric.required,
                    value: balance.total_required_hours
                  },
                  {
                    key: "assigned",
                    label: dict.dashboard.metric.assigned,
                    value: balance.total_assigned_hours
                  },
                  {
                    key: "available",
                    label: dict.dashboard.metric.available,
                    value: balance.total_available_hours
                  },
                  {
                    key: "pending",
                    label: dict.dashboard.metric.pending,
                    value: balance.pending_required_hours
                  }
                ].map((item) => (
                  <div key={item.key}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span>{item.label}</span>
                      <strong data-reparto-chart-value={item.key}>{item.value}</strong>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        data-reparto-chart-bar={item.key}
                        style={{
                          width: `${Math.max(
                            8,
                            Math.min(100, Math.round((item.value / chartTotal) * 100))
                          )}%`
                        }}
                      />
                    </div>
                  </div>
                ))
              : null}
          </div>
        </section>
        <section className={repartoPanelClass} data-reparto-panel="teacher-load-chart">
          <div className={repartoPanelHeaderClass}>
            <h2>{dict.dashboard.section.teacherLoad}</h2>
            <span className="text-sm text-muted-foreground" data-reparto-slot="teacher-count">
              {teacherBalances.length}
            </span>
          </div>
          {topTeachers.length > 0 ? (
            <div className="mt-3 grid gap-3">
              {topTeachers.map((teacher) => (
                <div key={teacher.process_teacher_id}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate">{teacher.display_name}</span>
                    <strong>
                      {teacher.assigned_hours}/{teacher.available_hours}
                    </strong>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      data-reparto-chart-bar="teacher-load"
                      style={{
                        width: `${Math.max(
                          8,
                          Math.min(
                            100,
                            Math.round(
                              (Math.max(teacher.assigned_hours, 1) / teacherMax) * 100
                            )
                          )
                        )}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              {dict.dashboard.state.noTeachers}
            </p>
          )}
          <p className="mt-3 text-sm text-muted-foreground" data-reparto-slot="teacher-summary">
            {formatRepartoMessage(dict.dashboard.summary.teacherLoad, {
              count: teacherBalances.length,
              overloaded: teacherBalances.filter((item) => item.state === "overloaded").length
            })}
          </p>
        </section>
        <section className={repartoPanelClass} data-reparto-panel="classroom-coverage-chart">
          <div className={repartoPanelHeaderClass}>
            <h2>{dict.dashboard.section.classroomCoverage}</h2>
            <span
              className="text-sm text-muted-foreground"
              data-reparto-slot="requirement-count"
            >
              {requirementBalances.length}
            </span>
          </div>
          {topRequirements.length > 0 ? (
            <div className="mt-3 grid gap-3">
              {topRequirements.map((requirement) => (
                <div key={requirement.hour_requirement_id}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate">
                      {requirement.teaching_group_label} · {requirement.subject_name}
                    </span>
                    <strong>
                      {requirement.assigned_hours}/{requirement.required_hours}
                    </strong>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      data-reparto-chart-bar="requirement-coverage"
                      style={{
                        width: `${Math.max(
                          8,
                          Math.min(
                            100,
                            Math.round(
                              (Math.max(requirement.assigned_hours, 1) / requirementMax) * 100
                            )
                          )
                        )}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              {dict.dashboard.state.noRequirements}
            </p>
          )}
          <p className="mt-3 text-sm text-muted-foreground" data-reparto-slot="coverage-summary">
            {formatRepartoMessage(dict.dashboard.summary.classroomCoverage, {
              count: requirementBalances.length,
              uncovered: balance?.uncovered_requirements ?? 0
            })}
          </p>
        </section>
        <section className={repartoPanelClass} data-reparto-panel="validation-summary">
          <div className={repartoPanelHeaderClass}>
            <h2>{dict.dashboard.section.validations}</h2>
            <span className="text-sm text-muted-foreground" data-reparto-slot="validation-count">
              {activeSummary?.validations.length ?? 0}
            </span>
          </div>
          {activeSummary?.validations.length ? (
            <ul className={repartoListClass} data-reparto-slot="validations">
              {activeSummary.validations.map((validation, index) => (
                <li
                  className={repartoListItemClass}
                  data-reparto-validation-severity={validation.severity}
                  key={`${validation.code}-${index}`}
                >
                  <strong className="block">{validation.code}</strong>
                  <span className="text-sm text-muted-foreground">
                    {validation.message}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              {dict.dashboard.state.noValidations}
            </p>
          )}
          <p className="mt-3 text-sm text-muted-foreground" data-reparto-slot="validation-summary">
            {formatRepartoMessage(dict.dashboard.summary.validations, {
              blocking: activeSummary?.blocking_validation_count ?? 0,
              total: activeSummary?.validations.length ?? 0
            })}
          </p>
        </section>
        <section className={repartoPanelClass} data-reparto-panel="setup-checklist">
          <div className={repartoPanelHeaderClass}>
            <h2>{dict.dashboard.section.checklist}</h2>
            <span className="text-sm text-muted-foreground" data-reparto-slot="checklist-progress">
              {checklistDoneCount}/{checklistSteps.length}
            </span>
          </div>
          <ol className="mt-3 grid gap-2">
            {checklistSteps.map((step) => (
              <li
                className="flex items-center justify-between gap-3 rounded-md border border-border/70 bg-muted/20 px-3 py-2 text-sm"
                data-reparto-checklist-step={step.key}
                data-reparto-checklist-state={step.done ? "done" : "pending"}
                key={step.key}
              >
                <span>{dict.flow.bootstrap.step[step.key]}</span>
                <strong className="text-xs text-primary">
                  {step.done ? dict.flow.bootstrap.done : dict.flow.bootstrap.open}
                </strong>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-sm text-muted-foreground" data-reparto-slot="checklist-summary">
            {formatRepartoMessage(dict.dashboard.summary.checklist, {
              done: checklistDoneCount,
              total: checklistSteps.length
            })}
          </p>
        </section>
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
