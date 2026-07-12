import { assignmentProcesses } from "../api/assignmentProcesses.js";
import type {
  MeetingSessionPublic,
  ProcessDashboard,
  ProcessSummary,
  TeacherLanSummary
} from "../schemas.js";
import { buildTeacherChoiceState } from "../ui/index.js";
import {
  formatRepartoMessage,
  getRepartoDictionary,
  normalizeRepartoLocale,
  type RepartoLocale
} from "../i18n/index.js";
import { CurrentTurnCard } from "./DepartmentHeadWorkspace.js";
import {
  repartoActionRowClass,
  repartoButtonClass,
  repartoChoiceLayoutClass,
  repartoConfirmationClass,
  repartoEyebrowClass,
  repartoHeaderClass,
  repartoMainGridClass,
  repartoMetricItemClass,
  repartoMetricLabelClass,
  repartoMetricValueLargeClass,
  repartoMetricsClass,
  repartoPanelClass,
  repartoPanelHeaderClass,
  repartoShellClass
} from "./styles.js";

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
  locale,
  meetingSession = null,
  requirementAssignedHours = 0,
  requirementRequiredHours = 0,
  summary
}: {
  locale?: RepartoLocale;
  meetingSession?: MeetingSessionPublic | null;
  requirementAssignedHours?: number;
  requirementRequiredHours?: number;
  summary: TeacherLanSummary;
}) {
  const dict = getRepartoDictionary(locale ?? normalizeRepartoLocale());
  const choice = buildTeacherChoiceState({
    meetingSession,
    requirementAssignedHours,
    requirementRequiredHours,
    summary
  });
  const conflictMessage = choice.disabledReason === "Meeting is not open."
    ? dict.view.choice.meetingClosed
    : choice.disabledReason === "Direct selection is disabled."
      ? dict.view.choice.directDisabled
      : choice.disabledReason === "It is another teacher's turn."
        ? dict.view.choice.otherTurn
        : choice.disabledReason === "Requirement is already covered."
          ? dict.view.choice.covered
          : dict.view.choice.ready;
  const confirmationLabel = formatRepartoMessage(dict.view.choice.impact, {
    hours: choice.impactHours
  });
  return (
    <section
      className={repartoPanelClass}
      data-reparto-panel="direct-choice-workflow"
      data-reparto-choice-state={choice.canChoose ? "ready" : "blocked"}
    >
      <div className={repartoPanelHeaderClass}>
        <h2>{dict.view.choice.title}</h2>
        <span className="text-sm text-muted-foreground" data-reparto-slot="choice-state">
          {conflictMessage}
        </span>
      </div>
      <div className={repartoChoiceLayoutClass}>
        <div data-reparto-slot="available-requirements-table" />
        <aside className={repartoConfirmationClass} data-reparto-slot="choice-confirmation">
          <span className="block text-xs text-muted-foreground">{dict.view.choice.confirmation}</span>
          <strong className="mt-1 block text-sm font-semibold text-foreground">
            {confirmationLabel}
          </strong>
          <p className="mt-2 text-sm text-muted-foreground" data-reparto-slot="choice-conflict">
            {conflictMessage}
          </p>
        </aside>
      </div>
      <div className={repartoActionRowClass}>
        <button
          className={repartoButtonClass}
          data-reparto-action="direct-choice"
          data-reparto-impact-hours={choice.impactHours}
          disabled={!choice.canChoose}
          type="button"
        >
          {dict.view.choice.choose}
        </button>
        <button
          className={repartoButtonClass}
          data-reparto-action="pass-turn"
          disabled={!choice.passTurnEnabled}
          type="button"
        >
          {dict.view.choice.pass}
        </button>
      </div>
      <div data-reparto-slot="choice-result" />
    </section>
  );
}

export function TeacherLanWorkspace({
  locale,
  meetingSession = null,
  processId,
  requirementAssignedHours = 0,
  requirementRequiredHours = 0,
  summary = null
}: {
  locale?: RepartoLocale;
  meetingSession?: MeetingSessionPublic | null;
  processId?: string;
  requirementAssignedHours?: number;
  requirementRequiredHours?: number;
  summary?: TeacherLanSummary | null;
}) {
  const dict = getRepartoDictionary(locale ?? normalizeRepartoLocale());
  const eventsUrl = eventStreamUrl(processId);
  const safeSummary = summary ?? fallbackTeacherSummary;
  return (
    <main
      className={repartoShellClass}
      data-process-id={processId}
      data-reparto-control="lan-teacher"
      data-reparto-events-url={eventsUrl}
      data-reparto-route="my-view"
    >
      <header className={repartoHeaderClass}>
        <p className={repartoEyebrowClass}>{dict.nav.item.meeting}</p>
        <h1>{dict.nav.item.myView}</h1>
      </header>
      <div className={repartoMainGridClass}>
        <section className={repartoPanelClass} data-reparto-panel="teacher-summary">
          <div className={repartoPanelHeaderClass}>
            <h2>{dict.dashboard.section.overview}</h2>
            <span className="text-sm text-muted-foreground" data-reparto-slot="connection-state" />
          </div>
          <dl className={repartoMetricsClass}>
            <div className={repartoMetricItemClass}>
              <dt className={repartoMetricLabelClass}>{dict.dashboard.metric.available}</dt>
              <dd className={repartoMetricValueLargeClass} data-reparto-slot="teacher-available-hours">
                {safeSummary.teacher_balance.available_hours}
              </dd>
            </div>
            <div className={repartoMetricItemClass}>
              <dt className={repartoMetricLabelClass}>{dict.dashboard.metric.assigned}</dt>
              <dd className={repartoMetricValueLargeClass} data-reparto-slot="teacher-assigned-hours">
                {safeSummary.teacher_balance.assigned_hours}
              </dd>
            </div>
            <div className={repartoMetricItemClass}>
              <dt className={repartoMetricLabelClass}>{dict.dashboard.metric.pending}</dt>
              <dd className={repartoMetricValueLargeClass} data-reparto-slot="teacher-remaining-hours">
                {safeSummary.teacher_balance.remaining_hours}
              </dd>
            </div>
          </dl>
          <p className="text-sm text-muted-foreground" data-reparto-slot="teacher-balance">
            {formatRepartoMessage(dict.dashboard.summary.balance, {
              assigned: safeSummary.global_balance.total_assigned_hours,
              pending: safeSummary.global_balance.pending_required_hours,
              required: safeSummary.global_balance.total_required_hours
            })}
          </p>
        </section>
        <section className={repartoPanelClass} data-reparto-panel="turn-and-balance">
          <div className={repartoPanelHeaderClass}>
            <h2>{dict.dashboard.section.meetingReadiness}</h2>
            <span className="text-sm text-muted-foreground" data-reparto-slot="turn-status" />
          </div>
          <CurrentTurnCard currentTurn={safeSummary.current_turn ?? null} locale={locale} />
        </section>
        <TeacherDirectChoicePanel
          locale={locale}
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
  dashboard,
  locale,
  processId,
  summary = null
}: {
  dashboard?: ProcessDashboard | null;
  locale?: RepartoLocale;
  processId?: string;
  summary?: ProcessSummary | null;
}) {
  const dict = getRepartoDictionary(locale ?? normalizeRepartoLocale());
  const eventsUrl = eventStreamUrl(processId);
  const activeSummary = summary ?? dashboard ?? null;
  const balance = activeSummary?.global_balance ?? null;
  const teacherCount = dashboard?.teacher_balances.length ?? 0;
  const requirementCount = dashboard?.requirement_balances.length ?? 0;
  return (
    <main
      className={repartoShellClass}
      data-process-id={processId}
      data-reparto-control="projected-summary"
      data-reparto-events-url={eventsUrl}
      data-reparto-route="shared-screen"
    >
      <header className={repartoHeaderClass}>
        <p className={repartoEyebrowClass}>{dict.dashboard.mode.readonly}</p>
        <h1>{dict.nav.item.shared}</h1>
        <p className="text-sm text-muted-foreground">{dict.dashboard.subtitleReadonly}</p>
      </header>
      <div className={repartoMainGridClass}>
        <section className={repartoPanelClass} data-reparto-panel="global-state">
          <div className={repartoPanelHeaderClass}>
            <h2>{dict.dashboard.section.overview}</h2>
            <span className="text-sm text-muted-foreground" data-reparto-slot="connection-state" />
          </div>
          <dl className={repartoMetricsClass}>
            <div className={repartoMetricItemClass}>
              <dt className={repartoMetricLabelClass}>{dict.dashboard.metric.required}</dt>
              <dd className={repartoMetricValueLargeClass} data-reparto-slot="total-required-hours">
                {balance?.total_required_hours ?? 0}
              </dd>
            </div>
            <div className={repartoMetricItemClass}>
              <dt className={repartoMetricLabelClass}>{dict.dashboard.metric.assigned}</dt>
              <dd className={repartoMetricValueLargeClass} data-reparto-slot="total-assigned-hours">
                {balance?.total_assigned_hours ?? 0}
              </dd>
            </div>
            <div className={repartoMetricItemClass}>
              <dt className={repartoMetricLabelClass}>{dict.dashboard.metric.pending}</dt>
              <dd className={repartoMetricValueLargeClass} data-reparto-slot="pending-required-hours">
                {balance?.pending_required_hours ?? 0}
              </dd>
            </div>
          </dl>
          <p className="text-sm text-muted-foreground" data-reparto-slot="global-balance">
            {balance
              ? formatRepartoMessage(dict.dashboard.summary.balance, {
                  assigned: balance.total_assigned_hours,
                  pending: balance.pending_required_hours,
                  required: balance.total_required_hours
                })
              : dict.dashboard.state.noDashboard}
          </p>
        </section>
        <section className={repartoPanelClass} data-reparto-panel="turn-state">
          <div className={repartoPanelHeaderClass}>
            <h2>{dict.dashboard.section.validations}</h2>
            <span className="text-sm text-muted-foreground" data-reparto-slot="turn-status">
              {activeSummary?.blocking_validation_count ?? 0}
            </span>
          </div>
          <CurrentTurnCard currentTurn={summary?.current_turn ?? null} locale={locale} />
          <div className="mt-3 grid gap-2 text-sm" data-reparto-slot="validations">
            <div className="rounded-md border border-border/70 bg-muted/20 px-3 py-2">
              {formatRepartoMessage(dict.dashboard.summary.teacherLoad, {
                count: teacherCount,
                overloaded: activeSummary?.global_balance.overloaded_teachers ?? 0
              })}
            </div>
            <div className="rounded-md border border-border/70 bg-muted/20 px-3 py-2">
              {formatRepartoMessage(dict.dashboard.summary.classroomCoverage, {
                count: requirementCount,
                uncovered: activeSummary?.global_balance.uncovered_requirements ?? 0
              })}
            </div>
            <div className="rounded-md border border-border/70 bg-muted/20 px-3 py-2">
              {formatRepartoMessage(dict.dashboard.summary.validations, {
                blocking: activeSummary?.blocking_validation_count ?? 0,
                total: activeSummary?.validations.length ?? 0
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
