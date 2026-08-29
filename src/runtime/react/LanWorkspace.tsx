import { useState } from "react";
import { assignmentProcesses } from "../api/assignmentProcesses.js";
import type {
  AssignmentPublic,
  HourRequirementPublic,
  MeetingSessionPublic,
  PlanReadiness,
  ProcessSummary,
  SseEventType,
  TeacherLanSummary
} from "../schemas.js";
import {
  buildMeetingControlState,
  buildTeacherChoiceState,
  classifyDirectChoiceConflict,
  type LanConnectionState
} from "../ui/index.js";
import {
  formatRepartoMessage,
  getRepartoDictionary,
  normalizeRepartoLocale,
  type RepartoLocale
} from "../i18n/index.js";
import { CurrentTurnCard, ProcessInvariantRow } from "./DepartmentHeadWorkspace.js";
import { useRepartoCanAct } from "./useRepartoRole.js";
import {
  repartoActionRowClass,
  repartoButtonClass,
  repartoChoiceLayoutClass,
  repartoConfirmationClass,
  repartoEyebrowClass,
  repartoFieldCaptionClass,
  repartoFieldGridClass,
  repartoFieldLabelClass,
  repartoHeaderClass,
  repartoInputClass,
  repartoMainGridClass,
  repartoMetricItemClass,
  repartoMetricLabelClass,
  repartoMetricValueLargeClass,
  repartoMetricsClass,
  repartoPanelClass,
  repartoPanelHeaderClass,
  repartoShellClass
} from "./styles.js";

function eventStreamUrl(
  processId: string | undefined,
  audience: "teacher" | "shared_screen"
): string | undefined {
  return processId
    ? assignmentProcesses.eventsUrl(processId, audience)
    : undefined;
}

/**
 * What the teacher view shows before the service has answered.
 *
 * Every gate is closed and every figure is zero: a teacher client must never
 * imply that selection is open, or that hours are available to take, on the
 * strength of a placeholder. `readiness`/`selection_blocked` mirror what the
 * choice helper treats as blocking, so the panel that renders this is disabled
 * for the same reasons it would be disabled by the service.
 */
const fallbackTeacherSummary: TeacherLanSummary = {
  process_id: "00000000-0000-4000-8000-000000000001",
  teacher_profile_id: "00000000-0000-4000-8000-000000000002",
  process_teacher_id: "00000000-0000-4000-8000-000000000003",
  generated_at: "2026-07-05T00:00:00Z",
  readiness: "not_ready",
  selection_blocked: true,
  plan_balance: null,
  participant: {
    process_teacher_id: "00000000-0000-4000-8000-000000000003",
    teacher_profile_id: "00000000-0000-4000-8000-000000000002",
    display_name: "Teacher",
    base_weekly_hours: "0.00",
    extra_weekly_hours: "0.00",
    target_weekly_hours: "0.00",
    assigned_weekly_hours: "0.00",
    remaining_weekly_hours: "0.00",
    is_overloaded: false,
    assignment_count: 0,
    state: "pending"
  },
  available_slots: 0,
  current_turn: null
};

/**
 * How the teacher panel reaches the service.
 *
 * The same shape as the control room's turn controls, and for the same reason:
 * the panel decides *whether* a position may be taken - that is
 * `buildTeacherChoiceState`, shared with the head's board - and the host decides
 * what taking it calls. Passing a turn is a skip on the caller's own turn and is
 * audited like any other, so it carries a reason and stays closed until one is
 * typed.
 *
 * A refusal comes back through `conflict`, which the panel already classifies
 * and shows; nothing is swallowed.
 */
export type TeacherChoiceControls = {
  /** Take the selected position. */
  onChoose: (input: { slotId: string }) => void;
  /** Pass the caller's own turn, with the audited reason. */
  onPassTurn: (input: { reason: string }) => void;
  /** Pick a position. Absent leaves the list read-only, as it was. */
  onSelectSlot?: (slotId: string) => void;
  /** The action in flight; both controls wait for it. */
  pendingAction?: "direct-choice" | "pass-turn" | null;
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
  controls,
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
  controls?: TeacherChoiceControls;
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
  const [passReason, setPassReason] = useState("");
  // Direct selection and passing a turn are the caller's own-data actions, and
  // `WRITER` is the floor the service puts on both (§21.3). A `READER` reads
  // this page — their hours, the live positions, whose turn it is — and is
  // offered neither control: hidden, not disabled, because the action does not
  // exist for them rather than being momentarily unavailable.
  const canChoose = useRepartoCanAct("teacherView");
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
                {controls?.onSelectSlot ? (
                  <button
                    className={repartoButtonClass}
                    data-reparto-action="select-slot"
                    disabled={!slot.canChoose || controls.pendingAction != null}
                    onClick={() => controls.onSelectSlot?.(slot.slotId)}
                    type="button"
                  >
                    {slot.slotId === selectedSlotId
                      ? dict.view.choice.selected
                      : dict.view.choice.select}
                  </button>
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
      {canChoose ? (
        <>
          <div className={repartoFieldGridClass}>
            <label className={repartoFieldLabelClass}>
              {dict.view.choice.passReasonLabel}
              <input
                className={repartoInputClass}
                data-reparto-field="pass-reason"
                onChange={(event: { target: { value: string } }) =>
              setPassReason(event.target.value)
            }
                placeholder={dict.view.choice.passReasonPlaceholder}
                type="text"
                value={passReason}
              />
            </label>
            <p className={repartoFieldCaptionClass} data-reparto-slot="pass-reason-hint">
              {dict.view.choice.passReasonHint}
            </p>
          </div>
          <div className={repartoActionRowClass}>
            <button
              className={repartoButtonClass}
              data-reparto-action="direct-choice"
              data-reparto-pending={
                controls?.pendingAction === "direct-choice" ? "true" : undefined
              }
              data-reparto-selectable-slots={choice.selectableCount}
              disabled={!choice.canChoose || controls?.pendingAction != null}
              onClick={() => {
                if (choice.selectedSlot) {
                  controls?.onChoose({ slotId: choice.selectedSlot.slotId });
                }
              }}
              type="button"
            >
              {controls?.pendingAction === "direct-choice"
                ? dict.view.choice.pending
                : dict.view.choice.choose}
            </button>
            <button
              className={repartoButtonClass}
              data-reparto-action="pass-turn"
              data-reparto-pending={
                controls?.pendingAction === "pass-turn" ? "true" : undefined
              }
              disabled={!choice.passTurnEnabled || controls?.pendingAction != null}
              onClick={() =>
                controls?.onPassTurn({
                  // The service audits every skip and will not take a blank
                  // reason, so an unfilled field records the default rather
                  // than closing a control the teacher's own turn has opened.
                  reason: passReason.trim() || dict.view.choice.passReasonDefault
                })
              }
              type="button"
            >
              {controls?.pendingAction === "pass-turn"
                ? dict.view.choice.pending
                : dict.view.choice.pass}
            </button>
          </div>
        </>
      ) : null}
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

/**
 * The teacher's own hours, as the service reports them.
 *
 * The panel this replaces showed *available / assigned / remaining* — capacity
 * to fill up to, which under §3.8 no longer exists. What a participant has is
 * an exact target, and the only honest way to show it is to show how it was
 * built: contractual `base`, department-head authorized `extra`, their sum as
 * the `target`, what the taken positions already come to, and what is left.
 * Every figure is the service's own canonical decimal string, rendered as
 * given: nothing here recomputes a total the backend already published.
 *
 * The process-wide line is `available_slots` — how many complete positions are
 * still free — because that is the only process-level quantity a teacher acts
 * on. `plan_balance` is aggregate and names nobody, which is what makes it
 * LAN-safe; it is shown when the process has a plan and stated as absent when
 * it does not, never quietly rendered as zero.
 */
function TeacherHoursPanel({
  connectionState,
  locale,
  summary
}: {
  connectionState: LanConnectionState;
  locale?: RepartoLocale;
  summary: TeacherLanSummary;
}) {
  const dict = getRepartoDictionary(locale ?? normalizeRepartoLocale());
  const participant = summary.participant;
  const metrics: {
    hours: string;
    label: string;
    slot: string;
  }[] = [
    {
      hours: participant.base_weekly_hours,
      label: dict.view.lan.metric.base,
      slot: "teacher-base-hours"
    },
    {
      hours: participant.extra_weekly_hours,
      label: dict.view.lan.metric.extra,
      slot: "teacher-extra-hours"
    },
    {
      hours: participant.target_weekly_hours,
      label: dict.view.lan.metric.target,
      slot: "teacher-target-hours"
    },
    {
      hours: participant.assigned_weekly_hours,
      label: dict.view.lan.metric.assigned,
      slot: "teacher-assigned-hours"
    },
    {
      hours: participant.remaining_weekly_hours,
      label: dict.view.lan.metric.remaining,
      slot: "teacher-remaining-hours"
    }
  ];
  const balance = summary.plan_balance;
  return (
    <section
      className={repartoPanelClass}
      data-reparto-panel="teacher-summary"
      data-reparto-participant-state={participant.state}
    >
      <div className={repartoPanelHeaderClass}>
        <h2>{dict.view.lan.title}</h2>
        <span
          className="text-sm text-muted-foreground"
          data-reparto-connection-state={connectionState}
          data-reparto-slot="connection-state"
        >
          {dict.view.lan.connection[connectionState]}
        </span>
      </div>
      <dl className={repartoMetricsClass}>
        {metrics.map((metric) => (
          <div className={repartoMetricItemClass} key={metric.slot}>
            <dt className={repartoMetricLabelClass}>{metric.label}</dt>
            <dd className={repartoMetricValueLargeClass} data-reparto-slot={metric.slot}>
              {metric.hours}
            </dd>
          </div>
        ))}
      </dl>
      <p
        className="text-sm text-muted-foreground"
        data-reparto-overloaded={participant.is_overloaded ? "true" : "false"}
        data-reparto-slot="teacher-overload"
      >
        {participant.is_overloaded
          ? formatRepartoMessage(dict.view.lan.overloaded, {
              hours: participant.extra_weekly_hours
            })
          : dict.view.lan.notOverloaded}
      </p>
      <p className="text-sm text-muted-foreground" data-reparto-slot="teacher-state">
        {dict.view.lan.state[participant.state]}
      </p>
      <p
        className="text-sm text-muted-foreground"
        data-reparto-available-slots={summary.available_slots}
        data-reparto-slot="available-slots"
      >
        {formatRepartoMessage(dict.view.lan.availableSlots, {
          count: summary.available_slots
        })}
      </p>
      <p
        className="text-sm text-muted-foreground"
        data-feasibility-status={summary.readiness}
        data-reparto-slot="teacher-feasibility-status"
      >
        {`${dict.dashboard.invariant.readiness}: ${
          dict.dashboard.readiness[summary.readiness]
        }`}
      </p>
      <p className="text-sm text-muted-foreground" data-reparto-slot="lan-plan-balance">
        {balance
          ? formatRepartoMessage(dict.view.lan.planBalance, {
              group: balance.group.total_group_load,
              allocation:
                balance.group.allocated_group_weekly_hours ??
                dict.view.lan.noAllocation,
              teacher: balance.teacher.total_teacher_load,
              target: balance.teacher.participant_target_total
            })
          : dict.view.lan.noPlanBalance}
      </p>
    </section>
  );
}

export function TeacherLanWorkspace({
  assignments = [],
  choiceControls,
  connectionState = "disconnected",
  conflict = null,
  lastEventType = null,
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
  /** The bound direct-selection API; without it both controls render inert. */
  choiceControls?: TeacherChoiceControls;
  connectionState?: LanConnectionState;
  conflict?: unknown;
  lastEventType?: SseEventType | null;
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
  const eventsUrl = eventStreamUrl(processId, "teacher");
  const safeSummary = summary ?? fallbackTeacherSummary;
  return (
    <main
      className={repartoShellClass}
      data-process-id={processId}
      data-reparto-control="lan-teacher"
      data-reparto-connection-state={connectionState}
      data-reparto-events-url={eventsUrl}
      data-reparto-last-event={lastEventType ?? ""}
      data-reparto-route="my-view"
    >
      <header className={repartoHeaderClass}>
        <p className={repartoEyebrowClass}>{dict.nav.item.meeting}</p>
        <h1>{dict.nav.item.myView}</h1>
      </header>
      <div className={repartoMainGridClass}>
        <TeacherHoursPanel
          connectionState={connectionState}
          locale={locale}
          summary={safeSummary}
        />
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
          controls={choiceControls}
          locale={locale}
          meetingSession={meetingSession}
          // The LAN payload carries the authoritative gate state and the
          // caller's own remaining target, so the props are overrides for a
          // host that already has fresher values — not the primary source they
          // used to be, back when the summary could not answer any of the three.
          readiness={readiness ?? safeSummary.readiness}
          remainingTargetHours={
            remainingTargetHours ?? safeSummary.participant.remaining_weekly_hours
          }
          requirements={requirements}
          selectedSlotId={selectedSlotId}
          selectionBlocked={selectionBlocked ?? safeSummary.selection_blocked}
          slotLabel={slotLabel}
          summary={safeSummary}
        />
      </div>
    </main>
  );
}

/**
 * The projected screen.
 *
 * It takes a `ProcessSummary` and nothing else, on purpose. The version this
 * replaces called the dashboard query — the full payload, every participant's
 * display name and hours — to render a screen pointed at a room, which is
 * `RBAC-07` verbatim. Aggregate-at-the-endpoint is not the same as aggregate
 * after arrival: a redaction the client has to remember to apply is one refactor
 * away from not being applied. `plan_balance` is the one balance that names
 * nobody, which is exactly why plan §8.7 puts it on this screen.
 *
 * What it shows is what a room needs: both balances and the three invariants,
 * how many complete positions are left, how many participants are balanced,
 * pending or carrying an authorized overload, whether an allocation change has
 * stopped selection, and whose turn it is — by position, because the aggregate
 * carries no name to display and this screen must not learn one. The three
 * participant counts are exactly that: counts, never a name attached to one.
 */
export function SharedScreenWorkspace({
  connectionState = "disconnected",
  lastEventType = null,
  locale,
  processId,
  summary = null
}: {
  connectionState?: LanConnectionState;
  lastEventType?: SseEventType | null;
  locale?: RepartoLocale;
  processId?: string;
  summary?: ProcessSummary | null;
}) {
  const dict = getRepartoDictionary(locale ?? normalizeRepartoLocale());
  const eventsUrl = eventStreamUrl(processId, "shared_screen");
  const control = buildMeetingControlState(summary);
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
      data-reparto-control="projected-summary"
      data-reparto-connection-state={connectionState}
      data-reparto-events-url={eventsUrl}
      data-reparto-last-event={lastEventType ?? ""}
      data-reparto-lifecycle-state={lifecycleState}
      data-reparto-route="shared-screen"
      data-reparto-selection-blocked={control.selectionBlocked ? "true" : "false"}
    >
      <header className={repartoHeaderClass}>
        <p className={repartoEyebrowClass}>{dict.dashboard.mode.readonly}</p>
        <h1>{dict.nav.item.shared}</h1>
        <p className="text-sm text-muted-foreground" data-reparto-slot="shared-state">
          {control.blockedReason
            ? dict.meeting.blocked[control.blockedReason]
            : dict.meeting.open}
        </p>
      </header>
      <div className={repartoMainGridClass}>
        <section className={repartoPanelClass} data-reparto-panel="shared-balance">
          <div className={repartoPanelHeaderClass}>
            <h2>{dict.dashboard.section.planning}</h2>
            <span
              className="text-sm text-muted-foreground"
              data-reparto-connection-state={connectionState}
              data-reparto-slot="connection-state"
            >
              {dict.view.lan.connection[connectionState]}
            </span>
          </div>
          <ProcessInvariantRow
            balance={summary?.plan_balance ?? null}
            dict={dict}
            readiness={summary?.readiness ?? "not_ready"}
          />
          <p className="text-sm text-muted-foreground" data-reparto-slot="shared-plan-balance">
            {summary?.plan_balance
              ? formatRepartoMessage(dict.view.lan.planBalance, {
                  group: summary.plan_balance.group.total_group_load,
                  allocation:
                    summary.plan_balance.group.allocated_group_weekly_hours ??
                    dict.view.lan.noAllocation,
                  teacher: summary.plan_balance.teacher.total_teacher_load,
                  target: summary.plan_balance.teacher.participant_target_total
                })
              : dict.dashboard.state.noPlan}
          </p>
        </section>
        <section className={repartoPanelClass} data-reparto-panel="shared-slots">
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
        <section className={repartoPanelClass} data-reparto-panel="shared-participants">
          <div className={repartoPanelHeaderClass}>
            <h2>{dict.dashboard.section.participants}</h2>
          </div>
          <dl className={repartoMetricsClass}>
            <div className={repartoMetricItemClass}>
              <dt className={repartoMetricLabelClass}>
                {dict.dashboard.metric.balancedParticipants}
              </dt>
              <dd className={repartoMetricValueLargeClass} data-reparto-slot="balanced-participants">
                {summary?.balanced_participant_count ?? 0}
              </dd>
            </div>
            <div className={repartoMetricItemClass}>
              <dt className={repartoMetricLabelClass}>
                {dict.dashboard.metric.pendingParticipants}
              </dt>
              <dd className={repartoMetricValueLargeClass} data-reparto-slot="pending-participants">
                {summary?.pending_participant_count ?? 0}
              </dd>
            </div>
            <div className={repartoMetricItemClass}>
              <dt className={repartoMetricLabelClass}>
                {dict.dashboard.metric.overloadedParticipants}
              </dt>
              <dd className={repartoMetricValueLargeClass} data-reparto-slot="overloaded-participants">
                {summary?.overloaded_participant_count ?? 0}
              </dd>
            </div>
          </dl>
        </section>
        <section
          className={repartoPanelClass}
          data-reparto-panel="turn-state"
          data-reparto-plan-stale={control.planStale ? "true" : "false"}
          data-reparto-reconciliation-required={control.reconciliationRequired ? "true" : "false"}
        >
          <div className={repartoPanelHeaderClass}>
            <h2>{dict.dashboard.section.meetingReadiness}</h2>
            <span className="text-sm text-muted-foreground" data-reparto-slot="lifecycle-state">
              {dict.meeting.lifecycle[lifecycleState]}
            </span>
          </div>
          <CurrentTurnCard currentTurn={summary?.current_turn ?? null} locale={locale} />
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
      </div>
    </main>
  );
}
