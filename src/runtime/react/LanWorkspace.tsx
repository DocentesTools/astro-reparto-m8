import { assignmentProcesses } from "../api/assignmentProcesses.js";
import type {
  AssignmentPublic,
  HourRequirementPublic,
  MeetingSessionPublic,
  PlanReadiness,
  ProcessDashboard,
  ProcessSummary,
  TeacherLanSummary
} from "../schemas.js";
import {
  buildTeacherChoiceState,
  classifyDirectChoiceConflict
} from "../ui/index.js";
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

/**
 * Teacher direct-selection panel.
 *
 * Takes the live positions rather than a required/assigned hour pair: under the
 * three-stage contract a teacher picks a whole position, so the panel lists the
 * positions and shows, for each one, whether it can be taken and why not. The
 * verdicts come from the shared framework-neutral helper, so the LAN panel and
 * the department-head board refuse the same choice for the same reason.
 */
function TeacherDirectChoicePanel({
  assignments = [],
  conflict = null,
  locale,
  meetingSession = null,
  readiness = null,
  remainingTargetHours = null,
  requirements = [],
  selectedSlotId = null,
  selectionBlocked = null,
  slotLabel,
  summary
}: {
  assignments?: AssignmentPublic[];
  conflict?: unknown;
  locale?: RepartoLocale;
  meetingSession?: MeetingSessionPublic | null;
  readiness?: PlanReadiness | null;
  remainingTargetHours?: string | number | null;
  requirements?: HourRequirementPublic[];
  selectedSlotId?: string | null;
  selectionBlocked?: boolean | null;
  slotLabel?: (slotId: string) => string;
  summary: TeacherLanSummary;
}) {
  const dict = getRepartoDictionary(locale ?? normalizeRepartoLocale());
  const choice = buildTeacherChoiceState({
    assignments,
    currentTurn: summary.current_turn,
    meetingSession,
    processTeacherId: summary.process_teacher_id,
    readiness,
    remainingTargetHours,
    requirements,
    selectedSlotId,
    selectionBlocked
  });
  const stateLabel = choice.disabledReason
    ? dict.view.choice.disabled[choice.disabledReason]
    : dict.view.choice.ready;
  const confirmationLabel =
    choice.impactHours === null
      ? dict.view.choice.disabled.no_slot_chosen
      : formatRepartoMessage(dict.view.choice.impact, {
          hours: choice.impactHours
        });
  const conflictState = conflict ? classifyDirectChoiceConflict(conflict) : null;
  return (
    <section
      className={repartoPanelClass}
      data-reparto-panel="direct-choice-workflow"
      data-reparto-choice-state={choice.canChoose ? "ready" : "blocked"}
      data-reparto-choice-reason={choice.disabledReason ?? ""}
    >
      <div className={repartoPanelHeaderClass}>
        <h2>{dict.view.choice.title}</h2>
        <span className="text-sm text-muted-foreground" data-reparto-slot="choice-state">
          {stateLabel}
        </span>
      </div>
      <div className={repartoChoiceLayoutClass}>
        <ul data-reparto-slot="available-requirements-table">
          {choice.slots.length === 0 ? (
            <li data-reparto-state="no-slots">{dict.view.choice.noSlots}</li>
          ) : (
            choice.slots.map((slot) => (
              <li
                data-hour-requirement-id={slot.slotId}
                data-reparto-slot-choice={slot.canChoose ? "selectable" : "blocked"}
                data-slot-disabled-reason={slot.disabledReason ?? ""}
                key={slot.slotId}
              >
                <span data-reparto-slot="choice-slot-label">
                  {slotLabel
                    ? slotLabel(slot.slotId)
                    : formatRepartoMessage(dict.view.choice.position, {
                        position: slot.positionIndex + 1
                      })}
                </span>
                <span data-reparto-slot="choice-slot-hours">
                  {formatRepartoMessage(dict.view.choice.hours, {
                    hours: slot.teacherHours
                  })}
                </span>
                {slot.disabledReason ? (
                  <span data-reparto-slot="choice-slot-reason">
                    {dict.view.choice.disabled[slot.disabledReason]}
                  </span>
                ) : null}
              </li>
            ))
          )}
        </ul>
        <aside className={repartoConfirmationClass} data-reparto-slot="choice-confirmation">
          <span className="block text-xs text-muted-foreground">{dict.view.choice.confirmation}</span>
          <strong className="mt-1 block text-sm font-semibold text-foreground">
            {confirmationLabel}
          </strong>
          <p className="mt-2 text-sm text-muted-foreground" data-reparto-slot="choice-state-detail">
            {stateLabel}
          </p>
          {choice.remainingTargetHours !== null ? (
            <p
              className="mt-2 text-sm text-muted-foreground"
              data-reparto-slot="choice-remaining-target"
            >
              {formatRepartoMessage(dict.view.choice.remainingTarget, {
                hours: choice.remainingTargetHours
              })}
            </p>
          ) : null}
        </aside>
      </div>
      <div className={repartoActionRowClass}>
        <button
          className={repartoButtonClass}
          data-reparto-action="direct-choice"
          data-reparto-selectable-slots={choice.selectableCount}
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
      {conflictState ? (
        <div
          data-reparto-conflict-reason={conflictState.reason}
          data-reparto-slot="choice-conflict"
        >
          <p>{dict.view.choice.conflict[conflictState.reason]}</p>
          {conflictState.message ? (
            <p data-reparto-slot="choice-conflict-detail">{conflictState.message}</p>
          ) : null}
        </div>
      ) : null}
      <div data-reparto-slot="choice-result" />
    </section>
  );
}

export function TeacherLanWorkspace({
  assignments = [],
  conflict = null,
  locale,
  meetingSession = null,
  processId,
  readiness = null,
  remainingTargetHours = null,
  requirements = [],
  selectedSlotId = null,
  selectionBlocked = null,
  slotLabel,
  summary = null
}: {
  assignments?: AssignmentPublic[];
  conflict?: unknown;
  locale?: RepartoLocale;
  meetingSession?: MeetingSessionPublic | null;
  processId?: string;
  readiness?: PlanReadiness | null;
  remainingTargetHours?: string | number | null;
  requirements?: HourRequirementPublic[];
  selectedSlotId?: string | null;
  selectionBlocked?: boolean | null;
  slotLabel?: (slotId: string) => string;
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
          assignments={assignments}
          conflict={conflict}
          locale={locale}
          meetingSession={meetingSession}
          readiness={readiness}
          remainingTargetHours={
            remainingTargetHours ?? safeSummary.teacher_balance.remaining_hours
          }
          requirements={requirements}
          selectedSlotId={selectedSlotId}
          selectionBlocked={selectionBlocked}
          slotLabel={slotLabel}
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
