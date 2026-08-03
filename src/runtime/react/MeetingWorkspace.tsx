import type {
  FeasibilityStatus,
  ParticipantBalance,
  ProcessDashboard,
  ProcessSummary
} from "../schemas.js";
import { buildMeetingControlState, summarizeProcessDashboard } from "../ui/index.js";
import {
  formatRepartoMessage,
  getRepartoDictionary,
  normalizeRepartoLocale,
  type RepartoLocale
} from "../i18n/index.js";
import {
  CurrentTurnCard,
  PlanningBalancePanel,
  ProcessInvariantRow
} from "./DepartmentHeadWorkspace.js";
import {
  repartoActionRowClass,
  repartoButtonClass,
  repartoEyebrowClass,
  repartoHeaderClass,
  repartoListClass,
  repartoListItemClass,
  repartoMainGridClass,
  repartoMetricItemClass,
  repartoMetricLabelClass,
  repartoMetricValueLargeClass,
  repartoMetricsClass,
  repartoPanelClass,
  repartoPanelHeaderClass,
  repartoShellClass
} from "./styles.js";

/**
 * The participants whose target was raised in advance.
 *
 * A head running a meeting needs this list for one reason: an authorized
 * overload is the only way a participant's target exceeds their contractual
 * base, and it was a decision someone made and recorded. Listing it during the
 * meeting keeps that decision visible while its consequences are being handed
 * out. It is never inferred — `is_overloaded` means `extra_weekly_hours > 0`,
 * not "assigned beyond target", which the assignment gates prevent.
 */
function AuthorizedOverloadList({
  dict,
  participants
}: {
  dict: ReturnType<typeof getRepartoDictionary>;
  participants: ParticipantBalance[];
}) {
  const overloaded = participants.filter((participant) => participant.is_overloaded);
  if (overloaded.length === 0) {
    return (
      <p className="mt-3 text-sm text-muted-foreground" data-reparto-slot="no-authorized-overloads">
        {dict.meeting.noOverloads}
      </p>
    );
  }
  return (
    <ul className={repartoListClass} data-reparto-slot="authorized-overloads">
      {overloaded.map((participant) => (
        <li
          className={repartoListItemClass}
          data-process-teacher-id={participant.process_teacher_id}
          data-reparto-overloaded="true"
          key={participant.process_teacher_id}
        >
          <span className="truncate">{participant.display_name}</span>
          <span className="text-sm text-muted-foreground" data-reparto-slot="overload-hours">
            {formatRepartoMessage(dict.meeting.overloadDetail, {
              base: participant.base_weekly_hours,
              extra: participant.extra_weekly_hours,
              target: participant.target_weekly_hours
            })}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * The meeting control room.
 *
 * It used to be the dashboard rendered a second time with a different route
 * name, which meant the live session was run against a screen built to review
 * a process, not to conduct one. What a head needs mid-meeting is narrower and
 * sharper: both balances (they are what the plan promised), whether the plan has
 * gone stale or needs reconciling (that stops selection), how many complete
 * positions are still to hand out, who is carrying authorized extra hours, and
 * the turn controls.
 *
 * The turn controls are gated by the same lifecycle state the service consults,
 * through the shared helper — a control offered and then refused teaches a head
 * to distrust the screen. With no payload at all every control is closed and
 * says why, rather than open and empty.
 *
 * Participants come from the full dashboard, which the meeting control may read
 * because it is the head's own admin surface. The projected screen may not, and
 * does not: that view takes `/summary`, which carries no name at all.
 */
export function MeetingControlWorkspace({
  dashboard,
  feasibility = null,
  locale,
  processId,
  summary = null
}: {
  dashboard?: ProcessDashboard | null;
  /**
   * The plan's stored feasibility status, department-head-only (§20.20, §21.1).
   * The control room is the head's own surface, so it shows the real status;
   * the projected screen next door passes nothing and keeps the readiness
   * projection.
   */
  feasibility?: FeasibilityStatus | null;
  locale?: RepartoLocale;
  processId?: string;
  summary?: ProcessSummary | null;
}) {
  const dict = getRepartoDictionary(locale ?? normalizeRepartoLocale());
  const activeSummary =
    summary ?? (dashboard ? summarizeProcessDashboard(dashboard) : null);
  const control = buildMeetingControlState(activeSummary);
  const participants = dashboard?.assignment.summary.participants ?? [];
  const lifecycleState = control.reconciliationRequired
    ? "reconciliation_required"
    : control.planStale
      ? "stale"
      : control.selectionBlocked
        ? "blocked"
        : "open";
  return (
    <main
      className={repartoShellClass}
      data-process-id={processId}
      data-reparto-control="meeting"
      data-reparto-lifecycle-state={lifecycleState}
      data-reparto-route="meeting"
      data-reparto-selection-blocked={control.selectionBlocked ? "true" : "false"}
    >
      <header className={repartoHeaderClass}>
        <p className={repartoEyebrowClass}>{dict.nav.item.meeting}</p>
        <h1>{dict.meeting.title}</h1>
        <p className="text-sm text-muted-foreground" data-reparto-slot="meeting-state">
          {control.blockedReason
            ? dict.meeting.blocked[control.blockedReason]
            : dict.meeting.open}
        </p>
      </header>
      <div className={repartoMainGridClass}>
        <section className={repartoPanelClass} data-reparto-panel="meeting-turn-control">
          <div className={repartoPanelHeaderClass}>
            <h2>{dict.dashboard.section.meetingReadiness}</h2>
            <span className="text-sm text-muted-foreground" data-reparto-slot="turn-status">
              {activeSummary?.current_turn
                ? dict.entity.selectionTurn.status[activeSummary.current_turn.status]
                : dict.view.currentTurn.noActiveTurn}
            </span>
          </div>
          <CurrentTurnCard currentTurn={activeSummary?.current_turn ?? null} locale={locale} />
          <ProcessInvariantRow
            balance={activeSummary?.plan_balance ?? null}
            dict={dict}
            feasibility={feasibility}
            readiness={activeSummary?.readiness ?? "not_ready"}
          />
          <div className={repartoActionRowClass}>
            {control.actions.map((action) => (
              <button
                className={repartoButtonClass}
                data-disabled-reason={action.reason ?? undefined}
                data-reparto-action={action.key}
                disabled={action.disabled}
                key={action.key}
                type="button"
              >
                {dict.action[
                  action.key === "initialize-turns"
                    ? "initializeTurns"
                    : action.key === "start-turn"
                      ? "startTurn"
                      : action.key === "complete-turn"
                        ? "completeTurn"
                        : action.key === "skip-turn"
                          ? "skipTurn"
                          : "overrideTurn"
                ]}
              </button>
            ))}
          </div>
        </section>
        <PlanningBalancePanel
          balance={activeSummary?.plan_balance ?? null}
          dict={dict}
          planStatus={activeSummary?.plan_status ?? null}
        />
        <section className={repartoPanelClass} data-reparto-panel="pending-slots">
          <div className={repartoPanelHeaderClass}>
            <h2>{dict.meeting.pendingTitle}</h2>
            <span className="text-sm text-muted-foreground" data-reparto-slot="slot-progress">
              {formatRepartoMessage(dict.dashboard.summary.slotProgress, {
                assigned: control.assignedSlots,
                total: control.totalSlots
              })}
            </span>
          </div>
          <dl className={repartoMetricsClass}>
            <div className={repartoMetricItemClass}>
              <dt className={repartoMetricLabelClass}>{dict.dashboard.metric.totalSlots}</dt>
              <dd className={repartoMetricValueLargeClass} data-reparto-slot="total-slots">
                {control.totalSlots}
              </dd>
            </div>
            <div className={repartoMetricItemClass}>
              <dt className={repartoMetricLabelClass}>{dict.dashboard.metric.assignedSlots}</dt>
              <dd className={repartoMetricValueLargeClass} data-reparto-slot="assigned-slots">
                {control.assignedSlots}
              </dd>
            </div>
            <div className={repartoMetricItemClass}>
              <dt className={repartoMetricLabelClass}>{dict.dashboard.metric.availableSlots}</dt>
              <dd className={repartoMetricValueLargeClass} data-reparto-slot="pending-slots">
                {control.pendingSlots}
              </dd>
            </div>
          </dl>
        </section>
        <section
          className={repartoPanelClass}
          data-reparto-panel="reconciliation-state"
          data-reparto-plan-stale={control.planStale ? "true" : "false"}
          data-reparto-reconciliation-required={control.reconciliationRequired ? "true" : "false"}
        >
          <div className={repartoPanelHeaderClass}>
            <h2>{dict.meeting.lifecycleTitle}</h2>
            <span className="text-sm text-muted-foreground" data-reparto-slot="lifecycle-state">
              {dict.meeting.lifecycle[lifecycleState]}
            </span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground" data-reparto-slot="lifecycle-detail">
            {control.reconciliationRequired
              ? dict.meeting.reconciliationDetail
              : control.planStale
                ? dict.meeting.staleDetail
                : control.selectionBlocked
                  ? dict.meeting.blocked[control.blockedReason ?? "no_process_data"]
                  : dict.meeting.openDetail}
          </p>
        </section>
        <section className={repartoPanelClass} data-reparto-panel="authorized-overloads">
          <div className={repartoPanelHeaderClass}>
            <h2>{dict.meeting.overloadTitle}</h2>
            <span className="text-sm text-muted-foreground" data-reparto-slot="overload-count">
              {participants.filter((participant) => participant.is_overloaded).length}
            </span>
          </div>
          <AuthorizedOverloadList dict={dict} participants={participants} />
        </section>
      </div>
    </main>
  );
}
