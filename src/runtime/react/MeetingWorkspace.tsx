import { useState } from "react";
import { mapRepartoError } from "../errorMapping.js";
import type {
  FeasibilityStatus,
  MeetingSessionPublic,
  ParticipantBalance,
  ProcessDashboard,
  ProcessSummary
} from "../schemas.js";
import {
  buildMeetingControlState,
  summarizeProcessDashboard,
  type MeetingTurnAction,
  type MeetingTurnActionKey
} from "../ui/index.js";
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
import { useRepartoCanAct } from "./useRepartoRole.js";
import {
  repartoActionRowClass,
  repartoButtonClass,
  repartoEyebrowClass,
  repartoFieldCaptionClass,
  repartoFieldGridClass,
  repartoFieldLabelClass,
  repartoHeaderClass,
  repartoInputClass,
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
 * How the control room opens and closes the meeting session itself.
 *
 * `src/runtime/api/meetingSessions.ts` has always had `list`, `create`,
 * `update` and `close`; nothing called them, so a head could run turns only
 * against a session created some other way. `session` is whichever one the
 * host currently treats as current — the same "latest known session" reading
 * `useMeetingTurnControls` already uses to find a session id for
 * `initialize-turns` — so this panel and the turn controls beneath it never
 * disagree about which session is live.
 */
export type MeetingSessionControls = {
  session: MeetingSessionPublic | null;
  onOpen: () => void;
  onClose: () => void;
  /** The last refusal, mapped and shown rather than swallowed. */
  error?: unknown;
  /** Which of the two actions is in flight; both buttons wait for it. */
  pendingAction?: "open" | "close" | null;
};

/**
 * Open or close the meeting session, above the turn controls that need one.
 *
 * Closing asks first — it ends the session teachers see on the LAN, so
 * pressing it once must not be enough. Opening does not: creating a session
 * is reversible (close it, open another), and gating it behind a second press
 * only slows down the one action a head takes at the very start of the
 * meeting.
 */
function MeetingSessionPanel({
  controls,
  dict
}: {
  controls?: MeetingSessionControls;
  dict: ReturnType<typeof getRepartoDictionary>;
}) {
  const [confirmingClose, setConfirmingClose] = useState(false);
  const session = controls?.session ?? null;
  const sessionOpen = session !== null && session.status !== "closed";
  const pending = controls?.pendingAction ?? null;
  const mappedError = controls?.error
    ? mapRepartoError(controls.error).formError?.message ?? dict.meeting.session.actionFailed
    : null;
  return (
    <section className={repartoPanelClass} data-reparto-panel="meeting-session">
      <div className={repartoPanelHeaderClass}>
        <h2>{dict.meeting.session.title}</h2>
        <span className="text-sm text-muted-foreground" data-reparto-slot="session-status">
          {session ? dict.entity.meetingSession.status[session.status] : dict.meeting.session.none}
        </span>
      </div>
      <div className={repartoActionRowClass}>
        <button
          className={repartoButtonClass}
          data-reparto-action="open-session"
          disabled={sessionOpen || pending !== null}
          onClick={() => controls?.onOpen()}
          type="button"
        >
          {pending === "open" ? dict.meeting.actionPending : dict.action.openSession}
        </button>
        <button
          className={repartoButtonClass}
          data-reparto-action="close-session"
          disabled={!sessionOpen || pending !== null}
          onClick={() => setConfirmingClose(true)}
          type="button"
        >
          {dict.action.closeSession}
        </button>
      </div>
      {confirmingClose && sessionOpen ? (
        <section
          aria-labelledby="meeting-session-close-confirmation-title"
          className="space-y-3 rounded-lg border border-primary/40 bg-muted/30 p-4"
          data-reparto-dialog="close-session-confirmation"
          role="alertdialog"
        >
          <h3 className="font-semibold" id="meeting-session-close-confirmation-title">
            {dict.meeting.session.closeConfirmTitle}
          </h3>
          <p>{dict.meeting.session.closeConfirmBody}</p>
          <div className={repartoActionRowClass}>
            <button
              className={repartoButtonClass}
              data-reparto-action="confirm-close-session"
              disabled={pending !== null}
              onClick={() => {
                setConfirmingClose(false);
                controls?.onClose();
              }}
              type="button"
            >
              {pending === "close" ? dict.meeting.actionPending : dict.meeting.session.closeConfirmAction}
            </button>
            <button
              className={repartoButtonClass}
              data-reparto-action="cancel"
              disabled={pending !== null}
              onClick={() => setConfirmingClose(false)}
              type="button"
            >
              {dict.action.cancel}
            </button>
          </div>
        </section>
      ) : null}
      {mappedError ? (
        <p className={repartoFieldCaptionClass} data-reparto-slot="session-error" role="alert">
          {mappedError}
        </p>
      ) : null}
    </section>
  );
}

/**
 * How the control room reaches the selection-turn API.
 *
 * The room does not call the service itself, for the same reason no other
 * workspace in this package does: it is a view a host may mount on its own, and
 * a view that fetches cannot be rendered without a query client. What it owns is
 * the *press* - which control, and the reason typed next to it - while
 * `useSelectionTurns` owns the five calls behind it.
 *
 * With no controls supplied the buttons still render, still closed by the same
 * lifecycle gate, and simply do nothing when pressed: an unwired room is the
 * state this replaces, and it must not become a crash.
 */
export type MeetingTurnControls = {
  onAction: (action: MeetingTurnActionKey, input: { reason: string }) => void;
  /** The last refusal, mapped and shown rather than swallowed. */
  error?: unknown;
  /** The control whose request is in flight; every button waits for it. */
  pendingAction?: MeetingTurnActionKey | null;
};

/** Skipping and overriding are audited, so neither goes without a reason. */
function turnActionNeedsReason(action: MeetingTurnActionKey): boolean {
  return action === "skip-turn" || action === "override-turn";
}

function turnActionLabelKey(
  action: MeetingTurnActionKey
): "initializeTurns" | "startTurn" | "completeTurn" | "skipTurn" | "overrideTurn" {
  switch (action) {
    case "initialize-turns":
      return "initializeTurns";
    case "start-turn":
      return "startTurn";
    case "complete-turn":
      return "completeTurn";
    case "skip-turn":
      return "skipTurn";
    default:
      return "overrideTurn";
  }
}

/**
 * The five turn controls, bound.
 *
 * Every button already carried a `data-reparto-action`, a label and a
 * `disabled` flag; what none of them carried was an `onClick`, so the room
 * offered a meeting it could not run. Two things change beyond the binding.
 * The reason is collected *before* the press rather than after the refusal:
 * the service requires one to skip or override, so those two stay closed with
 * `reason_required` until it is typed - the same "never offer a control the
 * service would refuse" rule the state helper exists to enforce, applied to the
 * one gate the summary cannot see. And every `data-disabled-reason` is said out
 * loud beside its button: the attribute told the e2e suite why a control was
 * shut and told the head nothing.
 */
function TurnControlRow({
  actions,
  controls,
  dict
}: {
  actions: readonly MeetingTurnAction[];
  controls?: MeetingTurnControls;
  dict: ReturnType<typeof getRepartoDictionary>;
}) {
  const [reason, setReason] = useState("");
  const pendingAction = controls?.pendingAction ?? null;
  const mappedError = controls?.error
    ? mapRepartoError(controls.error).formError?.message ?? dict.meeting.actionFailed
    : null;
  return (
    <div data-reparto-slot="turn-controls">
      <div className={repartoFieldGridClass}>
        <label className={repartoFieldLabelClass}>
          {dict.meeting.reasonLabel}
          <input
            className={repartoInputClass}
            data-reparto-field="turn-reason"
            onChange={(event: { target: { value: string } }) =>
              setReason(event.target.value)
            }
            placeholder={dict.meeting.reasonPlaceholder}
            type="text"
            value={reason}
          />
        </label>
        <p className={repartoFieldCaptionClass} data-reparto-slot="turn-reason-hint">
          {dict.meeting.reasonHint}
        </p>
      </div>
      <div className={repartoActionRowClass}>
        {actions.map((action) => {
          const reasonMissing =
            turnActionNeedsReason(action.key) && reason.trim().length === 0;
          const disabledReason =
            action.reason ?? (reasonMissing ? "reason_required" : null);
          const pending = pendingAction === action.key;
          return (
            <span data-reparto-slot="turn-control" key={action.key}>
              <button
                className={repartoButtonClass}
                data-disabled-reason={disabledReason ?? undefined}
                data-reparto-action={action.key}
                data-reparto-pending={pending ? "true" : undefined}
                disabled={action.disabled || reasonMissing || pendingAction !== null}
                onClick={() =>
                  controls?.onAction(action.key, { reason: reason.trim() })
                }
                type="button"
              >
                {pending
                  ? dict.meeting.actionPending
                  : dict.action[turnActionLabelKey(action.key)]}
              </button>
              {disabledReason ? (
                <span
                  className={repartoFieldCaptionClass}
                  data-reparto-slot="turn-disabled-hint"
                >
                  {dict.meeting.actionDisabled[disabledReason]}
                </span>
              ) : null}
            </span>
          );
        })}
      </div>
      {mappedError ? (
        <p
          className={repartoFieldCaptionClass}
          data-reparto-slot="turn-error"
          role="alert"
        >
          {mappedError}
        </p>
      ) : null}
    </div>
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
  sessionControls,
  summary = null,
  turnControls
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
  /** The bound meeting-session open/close API; without it the panel renders inert. */
  sessionControls?: MeetingSessionControls;
  summary?: ProcessSummary | null;
  /** The bound selection-turn API; without it the controls render inert. */
  turnControls?: MeetingTurnControls;
}) {
  const dict = getRepartoDictionary(locale ?? normalizeRepartoLocale());
  // The control room runs other participants' turns — initialize, start,
  // complete, skip and override — which is department-head authority and
  // nothing less (§21.2/§21.3). Below `ADMIN` the room is still readable: the
  // balances, the lifecycle state and the authorized overloads are what a
  // `READER` is entitled to, and only the controls go.
  const canAct = useRepartoCanAct("meeting");
  const activeSummary =
    summary ?? (dashboard ? summarizeProcessDashboard(dashboard) : null);
  const session = sessionControls?.session ?? null;
  const sessionOpen = session !== null && session.status !== "closed";
  const control = buildMeetingControlState(activeSummary, sessionOpen);
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
      {canAct ? <MeetingSessionPanel controls={sessionControls} dict={dict} /> : null}
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
          {canAct ? (
            <TurnControlRow
              actions={control.actions}
              controls={turnControls}
              dict={dict}
            />
          ) : null}
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
              {activeSummary?.overloaded_participant_count ?? 0}
            </span>
          </div>
          <AuthorizedOverloadList dict={dict} participants={participants} />
        </section>
      </div>
    </main>
  );
}
