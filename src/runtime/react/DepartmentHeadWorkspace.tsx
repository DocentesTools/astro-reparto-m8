import type {
  AssignmentProcessPublic,
  AssignmentProcessStatus,
  AssignmentValidationReport,
  CurrentTurnSummary,
  ExportArtifactPublic,
  ExportArtifactType,
  FeasibilityStatus,
  ParticipantBalance,
  PlanBalance,
  PlanReadiness,
  PlanValidationMessage,
  PlanValidationReport,
  PlanningExportArtifact,
  PlanningExportMode,
  PlanningImportResult,
  ProcessDashboard,
  ProcessSummary,
  ProcessVersionPublic,
  TeachingPlanPublic,
  TeachingPlanStatus,
  VersionComparison
} from "../schemas.js";
import {
  buildExportCenterState,
  buildPlanningImportDraftState,
  buildProcessInvariants,
  buildSetupChecklist,
  buildVersionComparisonView,
  buildVersionSelectionState,
  nextLeadershipWorkflowAction,
  summarizeProcessDashboard,
  versionSectionLabelKey,
  type ExportCenterState,
  type ProcessInvariant,
  type PlanningExportBlockedReason,
  type PlanningImportDraftError,
  type SetupChecklistObservations,
  type VersionComparisonDelta,
  type VersionComparisonView
} from "../ui/index.js";
import { SetupChecklistSteps } from "./SetupChecklist.js";
import {
  formatRepartoMessage,
  getRepartoDictionary,
  normalizeRepartoLocale,
  type RepartoDictionary,
  type RepartoLocale
} from "../i18n/index.js";
import {
  repartoActionRowClass,
  repartoButtonClass,
  repartoEyebrowClass,
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
import { useRepartoCanAct, useRepartoViewMode } from "./useRepartoRole.js";

/** Where the rendered comparison came from — two captures, or last year. */
export type VersionComparisonSource = "versions" | "previous_year";

export function CurrentTurnCard({
  currentTurn,
  locale
}: {
  currentTurn: CurrentTurnSummary | null;
  locale?: RepartoLocale;
}) {
  const dict = getRepartoDictionary(locale ?? normalizeRepartoLocale());
  const localizedDisplay = currentTurn
    ? {
        statusLabel: dict.entity.selectionTurn.status[currentTurn.status],
        turnLabel: formatRepartoMessage(dict.view.currentTurn.teacherValue, {
          teacher: currentTurn.process_teacher_id
        }),
        positionLabel: formatRepartoMessage(dict.view.currentTurn.position, {
          position: currentTurn.position + 1
        }),
        startedLabel: currentTurn.started_at ?? dict.view.currentTurn.notStarted
      }
    : {
        statusLabel: dict.view.currentTurn.waiting,
        turnLabel: dict.view.currentTurn.noActiveTurn,
        positionLabel: dict.view.currentTurn.noPosition,
        startedLabel: dict.view.currentTurn.notStarted
      };
  return (
    <div
      className={repartoTurnSummaryClass}
      data-reparto-slot="current-turn"
      data-reparto-turn-status={currentTurn?.status ?? "none"}
    >
      <div className={repartoTurnSummaryItemClass}>
        <span className={repartoMetricLabelClass}>{dict.view.currentTurn.status}</span>
        <strong className={repartoMetricValueClass}>{localizedDisplay.statusLabel}</strong>
      </div>
      <div className={repartoTurnSummaryItemClass}>
        <span className={repartoMetricLabelClass}>{dict.view.currentTurn.turn}</span>
        <strong className={repartoMetricValueClass}>{localizedDisplay.positionLabel}</strong>
      </div>
      <div className={repartoTurnSummaryItemClass}>
        <span className={repartoMetricLabelClass}>{dict.view.currentTurn.teacher}</span>
        <strong className={repartoMetricValueClass}>{localizedDisplay.turnLabel}</strong>
      </div>
      <div className={repartoTurnSummaryItemClass}>
        <span className={repartoMetricLabelClass}>{dict.view.currentTurn.started}</span>
        <strong className={repartoMetricValueClass}>{localizedDisplay.startedLabel}</strong>
      </div>
    </div>
  );
}

/**
 * An hour figure exactly as the service published it, or an explicit dash.
 *
 * Absent is not zero. A process with no allocation has no group target, and a
 * process with no plan has no balance at all; rendering either as `0` would
 * report a number the domain does not have. Nothing here parses or reformats
 * the string — canonical two-decimal hours are the service's own (§3.9).
 */
function displayHours(value: string | null | undefined): string {
  return value === null || value === undefined ? "—" : `${value} h`;
}

/**
 * Label and value for one invariant, in the caller's locale.
 *
 * The feasibility slot carries two vocabularies rather than one, because the two
 * sources are not the same statement: `plan` prints the service's own stored
 * status (`INFEASIBLE` is a fact about the partition, not a degree of
 * readiness), while `readiness` prints the coarse ready / not ready /
 * recalculation projection that §20.25 allows a teacher or a projected screen to
 * see. Labelling the projection "Assignment feasibility" would claim a precision
 * the payload does not carry, so it keeps its own label.
 */
function invariantDisplay(
  invariant: ProcessInvariant,
  dict: ReturnType<typeof getRepartoDictionary>
): { label: string; value: string } {
  if (invariant.key === "feasibility") {
    return invariant.source === "plan"
      ? {
          label: dict.dashboard.invariant.feasibility,
          value: dict.dashboard.feasibility[invariant.state]
        }
      : {
          label: dict.dashboard.invariant.readiness,
          value: dict.dashboard.readiness[invariant.state]
        };
  }
  return {
    label: dict.dashboard.invariant[invariant.key],
    value: dict.dashboard.balanceState[invariant.state]
  };
}

/**
 * The three invariants, side by side, never collapsed into one badge.
 *
 * Backend plan §20.20 is explicit: group balance, teacher-load balance and
 * assignment feasibility are independent, and a single "ready" pill — which is
 * what the retired `overview-state` slot was — hides which of the three is the
 * reason. §3.2's co-teaching example is 120 group hours against 124
 * teacher-load hours with *both* correct, so the two balances cannot even be
 * compared with each other, let alone summed; and §20.19 4/5.2 keeps
 * feasibility a separate field, so a balanced plan can still be infeasible.
 *
 * `feasibility` is the plan's stored status and is department-head-only
 * (§21.1): the LAN and shared-screen callers pass nothing, and the third slot
 * then reports the role-safe readiness projection instead. The distinction is on
 * the DOM as `data-reparto-invariant-source`, so nothing has to infer which one
 * it is looking at.
 */
export function ProcessInvariantRow({
  balance,
  dict,
  feasibility = null,
  readiness
}: {
  balance: PlanBalance | null;
  dict: ReturnType<typeof getRepartoDictionary>;
  feasibility?: FeasibilityStatus | null;
  readiness: PlanReadiness;
}) {
  const invariants = buildProcessInvariants({ balance, feasibility, readiness });
  return (
    <dl className={repartoMetricsClass} data-reparto-slot="process-invariants">
      {invariants.map((invariant) => {
        const display = invariantDisplay(invariant, dict);
        return (
          <div
            className={repartoMetricItemClass}
            data-reparto-invariant={invariant.key}
            data-reparto-invariant-source={invariant.source}
            data-reparto-invariant-state={invariant.state}
            key={invariant.key}
          >
            <dt className={repartoMetricLabelClass}>{display.label}</dt>
            <dd className={repartoMetricValueClass}>{display.value}</dd>
          </div>
        );
      })}
    </dl>
  );
}

/**
 * Both planning axes, as two labelled groups rather than one row of numbers.
 *
 * They are read from the payload the view already has: the dashboard is one
 * round trip by design, so re-querying the teaching-plan summary here would ask
 * the service the same question twice and let the two answers disagree on
 * screen. `PlanningBalanceHeader` remains the query-driven header for the
 * planning route, which has no dashboard payload to read from.
 */
export function PlanningBalancePanel({
  balance,
  dict,
  planStatus
}: {
  balance: PlanBalance | null;
  dict: ReturnType<typeof getRepartoDictionary>;
  planStatus: TeachingPlanStatus | null;
}) {
  const axes = [
    {
      key: "group",
      label: dict.planning.group,
      metrics: [
        {
          label: dict.planning.target,
          slot: "group-allocation",
          value: balance?.group.allocated_group_weekly_hours
        },
        {
          label: dict.planning.planned,
          slot: "group-load",
          value: balance?.group.total_group_load
        },
        {
          label: dict.planning.difference,
          slot: "group-difference",
          value: balance?.group.allocation_difference
        }
      ]
    },
    {
      key: "teacher",
      label: dict.planning.teacher,
      metrics: [
        {
          label: dict.planning.target,
          slot: "participant-target-total",
          value: balance?.teacher.participant_target_total
        },
        {
          label: dict.planning.planned,
          slot: "teacher-load",
          value: balance?.teacher.total_teacher_load
        },
        {
          label: dict.planning.difference,
          slot: "teacher-load-difference",
          value: balance?.teacher.teacher_load_difference
        }
      ]
    }
  ] as const;
  return (
    <section className={repartoPanelClass} data-reparto-panel="planning-balance">
      <div className={repartoPanelHeaderClass}>
        <h2>{dict.dashboard.section.planning}</h2>
        <span
          className="text-sm text-muted-foreground"
          data-reparto-plan-status={planStatus ?? "none"}
          data-reparto-slot="plan-status"
        >
          {planStatus ? dict.requirements.planStatus[planStatus] : dict.dashboard.state.noPlan}
        </span>
      </div>
      {balance ? (
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {axes.map((axis) => (
            <div
              className="rounded-md border border-border/70 bg-muted/20 p-3"
              data-reparto-balance-axis={axis.key}
              key={axis.key}
            >
              <h3 className="text-sm font-semibold text-foreground">{axis.label}</h3>
              <dl className="mt-2 grid grid-cols-3 gap-3">
                {axis.metrics.map((metric) => (
                  <div className="min-w-0" key={metric.slot}>
                    <dt className={repartoMetricLabelClass}>{metric.label}</dt>
                    <dd
                      className={repartoMetricValueClass}
                      data-reparto-slot={metric.slot}
                    >
                      {displayHours(metric.value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground" data-reparto-slot="planning-empty">
          {dict.dashboard.state.noPlan}
        </p>
      )}
    </section>
  );
}

/**
 * One stage's findings, printed as the service wrote them.
 *
 * What this replaces was a twelve-branch table that re-derived each sentence
 * from `requirement.over_assigned`, `teacher.overloaded` and their friends,
 * resolving `{available}` and `{pending}` out of the balance rows — a second
 * copy of the backend's validation vocabulary, kept in a client that cannot be
 * redeployed with it. The service now owns both the stable `code` and the human
 * `message`: the code is stamped on the DOM for tests and skins to key off, and
 * the sentence is printed untranslated rather than paraphrased.
 */
export function ProcessValidationList({
  dict,
  messages,
  stage
}: {
  dict: ReturnType<typeof getRepartoDictionary>;
  messages: PlanValidationMessage[];
  stage: "planning" | "assignment";
}) {
  if (messages.length === 0) {
    return (
      <p
        className="mt-3 text-sm text-muted-foreground"
        data-reparto-slot={`${stage}-validations-empty`}
      >
        {dict.dashboard.state.noValidations}
      </p>
    );
  }
  return (
    <ul className={repartoListClass} data-reparto-slot={`${stage}-validations`}>
      {messages.map((message, index) => (
        <li
          className={repartoListItemClass}
          data-reparto-validation-code={message.code}
          data-reparto-validation-entity={message.entity_type}
          data-reparto-validation-severity={message.severity}
          key={`${message.code}-${message.entity_id ?? "none"}-${index}`}
        >
          <strong className="block">{message.message}</strong>
          <span className="text-xs text-muted-foreground">{message.code}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Per-participant progress against an exact target.
 *
 * The chart this replaces drew `assigned / available` as a fill bar: a
 * progress bar towards a capacity ceiling, which §3.8 removed. A participant
 * has a target built from base plus authorized extra, and the honest figures
 * are the three the service computes. Authorized overload is shown as the flag
 * it is — `extra_weekly_hours > 0`, decided in advance — and never inferred
 * from assigned hours exceeding the target, which cannot happen.
 *
 * Every process teacher is listed, including the inactive and non-participating
 * ones, because a row that was filtered out is indistinguishable from a
 * participant nobody added.
 */
function ParticipantBalanceList({
  dict,
  participants
}: {
  dict: ReturnType<typeof getRepartoDictionary>;
  participants: ParticipantBalance[];
}) {
  if (participants.length === 0) {
    return (
      <p className="mt-3 text-sm text-muted-foreground">{dict.dashboard.state.noTeachers}</p>
    );
  }
  return (
    <ul className={repartoListClass} data-reparto-slot="participant-balances">
      {participants.map((participant) => (
        <li
          className={repartoListItemClass}
          data-process-teacher-id={participant.process_teacher_id}
          data-reparto-overloaded={participant.is_overloaded ? "true" : "false"}
          data-reparto-participant-state={participant.state}
          key={participant.process_teacher_id}
        >
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate">{participant.display_name}</span>
            <strong data-reparto-slot="participant-hours">
              {formatRepartoMessage(dict.dashboard.summary.participantHours, {
                assigned: participant.assigned_weekly_hours,
                remaining: participant.remaining_weekly_hours,
                target: participant.target_weekly_hours
              })}
            </strong>
          </div>
          <span className="text-xs text-muted-foreground">
            {participant.is_overloaded
              ? formatRepartoMessage(dict.dashboard.summary.authorizedExtra, {
                  hours: participant.extra_weekly_hours
                })
              : dict.dashboard.participantState[participant.state]}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * The department-head dashboard.
 *
 * Two stages side by side (backend plan §3.1): what the plan commits to, and
 * how far the meeting has got through it. The single `required / available /
 * assigned / pending` axis this replaces described a contract where a
 * requirement could be partly covered and a teacher could be assigned past
 * capacity — neither is expressible now.
 *
 * `summary` alone is enough to render the header, the invariants, the plan
 * balance and the slot counts; the per-participant rows and both message lists
 * need the full `dashboard`. That split is deliberate and is what lets the
 * meeting control and the projected screen mount this data from `/summary`
 * without ever receiving a teacher's name.
 */
export function DepartmentHeadWorkspace({
  dashboard,
  feasibility = null,
  locale,
  setup,
  summary = null
}: {
  dashboard?: ProcessDashboard | null;
  /**
   * The teaching plan's stored feasibility status (§20.20). Department-head
   * surfaces read it from the plan payload the dashboard does not carry; absent,
   * the invariant row falls back to the role-safe readiness projection.
   */
  feasibility?: FeasibilityStatus | null;
  locale?: RepartoLocale;
  /**
   * Stage 1 counts the dashboard payload does not carry (`S2-07`).
   *
   * The dashboard reports on a plan, not on the reference data behind it, so the
   * subject, teaching group, matrix and allocation conditions can only come from the
   * caller. A caller that has not read them passes nothing and those steps say
   * *not checked here* rather than claiming they are undone.
   */
  setup?: SetupChecklistObservations;
  summary?: ProcessSummary | null;
}) {
  // The turn controls below are department-head actions, so the mode comes from
  // the signed-in role and from nowhere else (`RBAC-05`). Until the adapter has
  // answered, the workspace is read-only: an affordance shown to a `READER` and
  // withdrawn a frame later is worse than one that arrives a frame late.
  const mode = useRepartoViewMode();
  const dict = getRepartoDictionary(locale ?? normalizeRepartoLocale());
  const activeSummary = summary ?? (dashboard ? summarizeProcessDashboard(dashboard) : null);
  const planning = dashboard?.planning ?? null;
  const assignment = dashboard?.assignment ?? null;
  const participants = assignment?.summary.participants ?? [];
  const balance = activeSummary?.plan_balance ?? null;
  const readiness = activeSummary?.readiness ?? "not_ready";
  const totalSlots = activeSummary?.total_slots ?? 0;
  const assignedSlots = activeSummary?.assigned_slots ?? 0;
  const availableSlots = activeSummary?.available_slots ?? 0;
  // One derivation, shared with the process picker (`S2-07`). The labels used to
  // be rewired conditions under unchanged words — *Add subjects* testing that a
  // teaching plan existed — so nothing is derived here beyond handing the helper
  // what this payload proves: the dashboard's participant rows are the
  // participant count, and the summary is the whole Stage 2/3 source.
  const checklist = buildSetupChecklist({
    ...setup,
    participantCount:
      setup?.participantCount ?? (dashboard ? participants.length : null),
    processId: setup?.processId ?? activeSummary?.process_id ?? null,
    summary: activeSummary
  });
  const actions = [
    {
      key: "initialize-turns",
      label: dict.action.initializeTurns,
      disabled: Boolean(activeSummary?.current_turn),
      reason: activeSummary?.current_turn
        ? dict.disabled.processClosed.replace("{status}", "turn-active")
        : null
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
      disabled: !activeSummary?.current_turn,
      reason: !activeSummary?.current_turn ? dict.disabled.noData : null
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
            <span className="text-sm text-muted-foreground" data-reparto-slot="turn-status">
              {activeSummary?.current_turn
                ? dict.entity.selectionTurn.status[activeSummary.current_turn.status]
                : dict.dashboard.state.noDashboard}
            </span>
          </div>
          <CurrentTurnCard currentTurn={activeSummary?.current_turn ?? null} locale={locale} />
          <ProcessInvariantRow
            balance={balance}
            dict={dict}
            feasibility={feasibility}
            readiness={readiness}
          />
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
        </section>
        <PlanningBalancePanel
          balance={balance}
          dict={dict}
          planStatus={activeSummary?.plan_status ?? null}
        />
        <section className={repartoPanelClass} data-reparto-panel="assignment-progress">
          <div className={repartoPanelHeaderClass}>
            <h2>{dict.dashboard.section.assignment}</h2>
            <span className="text-sm text-muted-foreground" data-reparto-slot="slot-progress">
              {formatRepartoMessage(dict.dashboard.summary.slotProgress, {
                assigned: assignedSlots,
                total: totalSlots
              })}
            </span>
          </div>
          <dl className={repartoMetricsClass}>
            <div className={repartoMetricItemClass}>
              <dt className={repartoMetricLabelClass}>{dict.dashboard.metric.totalSlots}</dt>
              <dd className={repartoMetricValueLargeClass} data-reparto-slot="total-slots">
                {totalSlots}
              </dd>
            </div>
            <div className={repartoMetricItemClass}>
              <dt className={repartoMetricLabelClass}>{dict.dashboard.metric.assignedSlots}</dt>
              <dd className={repartoMetricValueLargeClass} data-reparto-slot="assigned-slots">
                {assignedSlots}
              </dd>
            </div>
            <div className={repartoMetricItemClass}>
              <dt className={repartoMetricLabelClass}>{dict.dashboard.metric.availableSlots}</dt>
              <dd className={repartoMetricValueLargeClass} data-reparto-slot="available-slots">
                {availableSlots}
              </dd>
            </div>
          </dl>
          {assignment ? (
            <dl className={repartoMetricsClass}>
              <div className={repartoMetricItemClass}>
                <dt className={repartoMetricLabelClass}>{dict.dashboard.metric.targetHours}</dt>
                <dd className={repartoMetricValueClass} data-reparto-slot="total-target-hours">
                  {displayHours(assignment.summary.total_target_hours)}
                </dd>
              </div>
              <div className={repartoMetricItemClass}>
                <dt className={repartoMetricLabelClass}>{dict.dashboard.metric.assignedHours}</dt>
                <dd className={repartoMetricValueClass} data-reparto-slot="total-assigned-hours">
                  {displayHours(assignment.summary.total_assigned_hours)}
                </dd>
              </div>
              <div className={repartoMetricItemClass}>
                <dt className={repartoMetricLabelClass}>{dict.dashboard.metric.remainingHours}</dt>
                <dd className={repartoMetricValueClass} data-reparto-slot="total-remaining-hours">
                  {displayHours(assignment.summary.total_remaining_hours)}
                </dd>
              </div>
            </dl>
          ) : null}
        </section>
        <section className={repartoPanelClass} data-reparto-panel="participant-balances">
          <div className={repartoPanelHeaderClass}>
            <h2>{dict.dashboard.section.participants}</h2>
            <span className="text-sm text-muted-foreground" data-reparto-slot="participant-count">
              {participants.length}
            </span>
          </div>
          <ParticipantBalanceList dict={dict} participants={participants} />
          <p className="mt-3 text-sm text-muted-foreground" data-reparto-slot="participant-summary">
            {formatRepartoMessage(dict.dashboard.summary.participants, {
              count: participants.length,
              overloaded: participants.filter((item) => item.is_overloaded).length
            })}
          </p>
        </section>
        <section className={repartoPanelClass} data-reparto-panel="validation-summary">
          <div className={repartoPanelHeaderClass}>
            <h2>{dict.dashboard.section.validations}</h2>
            <span className="text-sm text-muted-foreground" data-reparto-slot="blocking-count">
              {activeSummary?.blocking_validation_count ?? 0}
            </span>
          </div>
          {dashboard ? (
            <>
              <h3 className="mt-3 text-sm font-semibold">{dict.dashboard.section.planning}</h3>
              <ProcessValidationList
                dict={dict}
                messages={planning?.validations?.messages ?? []}
                stage="planning"
              />
              <h3 className="mt-3 text-sm font-semibold">{dict.dashboard.section.assignment}</h3>
              <ProcessValidationList
                dict={dict}
                messages={assignment?.validations.messages ?? []}
                stage="assignment"
              />
            </>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground" data-reparto-slot="validations-summary-only">
              {dict.dashboard.state.summaryOnly}
            </p>
          )}
          <p className="mt-3 text-sm text-muted-foreground" data-reparto-slot="validation-summary">
            {formatRepartoMessage(dict.dashboard.summary.validations, {
              assignment: assignment?.validations.blocking_count ?? 0,
              planning: planning?.validations?.blocking_count ?? 0,
              total: activeSummary?.blocking_validation_count ?? 0
            })}
          </p>
        </section>
        <section className={repartoPanelClass} data-reparto-panel="setup-checklist">
          <div className={repartoPanelHeaderClass}>
            <h2>{dict.dashboard.section.checklist}</h2>
            <span className="text-sm text-muted-foreground" data-reparto-slot="checklist-progress">
              {checklist.doneCount}/{checklist.total}
            </span>
          </div>
          <SetupChecklistSteps checklist={checklist} locale={locale} />
          <p className="mt-3 text-sm text-muted-foreground" data-reparto-slot="checklist-summary">
            {formatRepartoMessage(dict.dashboard.summary.checklist, {
              done: checklist.doneCount,
              total: checklist.total
            })}
          </p>
        </section>
      </div>
    </main>
  );
}

export function ProcessListView({
  count = 0,
  locale,
  onCreate,
  processes = []
}: {
  count?: number;
  locale?: RepartoLocale;
  /**
   * Opens the caller's creation form. Without it the control is withheld
   * rather than rendered inert: this view has no create form of its own —
   * opening a process needs an academic year, school and department — so a
   * button with nowhere to go would be a dead end, not an affordance.
   */
  onCreate?: () => void;
  processes?: AssignmentProcessPublic[];
}) {
  const dict = getRepartoDictionary(locale ?? normalizeRepartoLocale());
  // Opening a process is `POST /assignment-processes` — department-head-only
  // (§21.3). The list itself is a `READER` read and stays.
  const canAct = useRepartoCanAct("processList");
  return (
    <main className={repartoShellClass} data-reparto-route="processes">
      <section className={repartoPanelClass} data-reparto-panel="process-list">
        <div className={repartoPanelHeaderClass}>
          <h2>{dict.entity.assignmentProcess.plural}</h2>
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
                  {dict.entity.assignmentProcess.status[process.status]}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {canAct && onCreate ? (
          <button
            className={repartoButtonClass}
            data-reparto-action="create-process"
            onClick={onCreate}
            type="button"
          >
            {dict.action.create} {dict.entity.assignmentProcess.singular.toLowerCase()}
          </button>
        ) : null}
      </section>
    </main>
  );
}

/**
 * How a signed difference reads on screen, from the sign the decimal helpers
 * computed rather than from the text.
 *
 * The service's canonical string already carries its own `-`; only a positive
 * difference gains a `+`. A `null` value is the single "not comparable" case
 * (§10.3: no allocation on one side of the diff) and is never rendered as a
 * zero — absent is not zero, here as everywhere else.
 */
function versionDeltaSignState(delta: VersionComparisonDelta): string {
  if (delta.sign === null) return "none";
  if (delta.sign > 0) return "positive";
  if (delta.sign < 0) return "negative";
  return "zero";
}

function versionDeltaText(
  delta: VersionComparisonDelta,
  dict: ReturnType<typeof getRepartoDictionary>
): string {
  if (delta.value === null) return dict.view.versions.notComparable;
  const sign = delta.sign === 1 ? "+" : "";
  return delta.unit === "hours"
    ? `${sign}${delta.value} h`
    : `${sign}${delta.value}`;
}

/**
 * The nine §10.3 dimensions, each with the deltas the service pairs with it.
 *
 * Every dimension is listed on every comparison, changed or not: a head
 * reading "did the allocation move?" needs the answer "no" to be present, not
 * absent. `changed` is the service's flag and is never inferred from a delta —
 * one activity added and one removed is a real change with a zero count — so
 * the state badge and the numbers beside it can legitimately disagree.
 */
function VersionComparisonDimensions({
  dict,
  view
}: {
  dict: ReturnType<typeof getRepartoDictionary>;
  view: VersionComparisonView;
}) {
  return (
    <ul className={repartoListClass} data-reparto-slot="comparison-dimensions">
      {view.dimensions.map((dimension) => (
        <li
          className={repartoListItemClass}
          data-reparto-dimension={dimension.key}
          data-reparto-dimension-changed={dimension.changed ? "true" : "false"}
          key={dimension.key}
        >
          <div className={repartoPanelHeaderClass}>
            <span className="font-medium">
              {dict.view.versions.dimension[dimension.key]}
            </span>
            <span
              className="text-sm text-muted-foreground"
              data-reparto-slot="dimension-state"
            >
              {dict.view.versions.state[dimension.changed ? "changed" : "unchanged"]}
            </span>
          </div>
          {dimension.deltas.length > 0 ? (
            <dl className={repartoMetricsClass}>
              {dimension.deltas.map((delta) => (
                <div
                  className={repartoMetricItemClass}
                  data-reparto-delta={delta.key}
                  key={delta.key}
                >
                  <dt className={repartoMetricLabelClass}>
                    {dict.view.versions.delta[delta.key]}
                  </dt>
                  <dd
                    className={repartoMetricValueClass}
                    data-reparto-delta-sign={versionDeltaSignState(delta)}
                    data-reparto-slot="delta-value"
                  >
                    {versionDeltaText(delta, dict)}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/**
 * The comparison panel: what differs between the two snapshots, and nothing
 * about how they were picked.
 *
 * Three states, kept apart on purpose. *No comparison* means none was asked
 * for — it is not "no changes". *Identical* means the service compared them
 * and found neither a dimension nor a section that differs. *Other changes
 * only* means every §10.3 dimension is unchanged while snapshot sections still
 * differ, which happens for a stored reason or a plan timestamp; saying "no
 * changes" there would be false.
 */
function VersionComparisonPanel({
  comparison,
  dict,
  source
}: {
  comparison: VersionComparison | null;
  dict: ReturnType<typeof getRepartoDictionary>;
  source: VersionComparisonSource;
}) {
  const view = comparison ? buildVersionComparisonView(comparison) : null;
  const state = !view
    ? "none"
    : view.identical
      ? "identical"
      : view.otherChangesOnly
        ? "sections_only"
        : "changed";
  return (
    <section
      className={repartoPanelClass}
      data-reparto-comparison-source={source}
      data-reparto-comparison-state={state}
      data-reparto-panel="comparison"
    >
      <div className={repartoPanelHeaderClass}>
        <h2>{dict.view.versions.comparison}</h2>
        <span className="text-sm text-muted-foreground" data-reparto-slot="comparison-source">
          {dict.view.versions.source[source]}
        </span>
      </div>
      {view ? (
        <>
          <p className="mt-3 text-sm text-muted-foreground" data-reparto-slot="comparison-state">
            {view.identical
              ? dict.view.versions.noChanges
              : formatRepartoMessage(dict.view.versions.changedSummary, {
                  changed: view.changedDimensionCount,
                  total: view.dimensions.length
                })}
          </p>
          <VersionComparisonDimensions dict={dict} view={view} />
          <div className={repartoPanelHeaderClass}>
            <h3 className="mt-3 text-sm font-semibold">
              {dict.view.versions.sectionsTitle}
            </h3>
            <span className="text-sm text-muted-foreground" data-reparto-slot="changed-section-count">
              {view.changedSections.length}
            </span>
          </div>
          {view.changedSections.length > 0 ? (
            <ul className={repartoListClass} data-reparto-slot="changed-sections">
              {view.changedSections.map((section) => {
                const labelKey = versionSectionLabelKey(section);
                return (
                  <li
                    className={repartoListItemClass}
                    data-reparto-section={section}
                    key={section}
                  >
                    {labelKey ? dict.view.versions.section[labelKey] : section}
                  </li>
                );
              })}
            </ul>
          ) : null}
          {view.otherChangesOnly ? (
            <p className="mt-3 text-sm text-muted-foreground" data-reparto-slot="other-changes">
              {formatRepartoMessage(dict.view.versions.otherChanges, {
                count: view.changedSections.length
              })}
            </p>
          ) : null}
        </>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground" data-reparto-slot="no-comparison">
          {dict.view.versions.noComparison}
        </p>
      )}
    </section>
  );
}

/**
 * Version history and the comparison between two captures.
 *
 * The panel used to show three float deltas — required hours, assigned hours
 * and a teacher count — against a `changed_sections` list rendered as a raw
 * comma-joined string. Two of those numbers no longer exist: there is no
 * aggregate "required" axis (§3.1 has two independent balances) and an
 * assignment carries no hours of its own (§5.10). What replaces them is the
 * §10.3 contract itself: nine named dimensions with the service's own signed
 * deltas beside them, every hour figure a canonical decimal string.
 *
 * The view is controlled. Which two versions are compared, and whether the
 * previous year is being diffed instead, are the caller's state — the same
 * split the planning panels use, so the query that fetches a comparison lives
 * next to the cache it invalidates rather than inside a render tree.
 */
export function VersionsView({
  comparison = null,
  comparisonSource = "versions",
  createPending = false,
  createReason = "",
  locale,
  onCompare,
  onCreateVersion,
  onPreviousYear,
  onReasonChange,
  onSelectVersion,
  previousYearAvailable = false,
  selection,
  versions = []
}: {
  comparison?: VersionComparison | null;
  comparisonSource?: VersionComparisonSource;
  createPending?: boolean;
  createReason?: string;
  locale?: RepartoLocale;
  onCompare?: () => void;
  onCreateVersion?: () => void;
  onPreviousYear?: () => void;
  onReasonChange?: (reason: string) => void;
  onSelectVersion?: (side: "left" | "right", versionId: string) => void;
  previousYearAvailable?: boolean;
  selection?: { left?: string | null; right?: string | null };
  versions?: ProcessVersionPublic[];
}) {
  const dict = getRepartoDictionary(locale ?? normalizeRepartoLocale());
  // Capturing a version writes (`POST /history/versions`, department-head-only
  // per §21.3); listing and comparing them are reads any `READER` may make, so
  // only the capture control and its reason field are withheld below `ADMIN`.
  const canAct = useRepartoCanAct("versions");
  const selectionState = buildVersionSelectionState(versions, selection ?? {});
  const sides = [
    {
      key: "left" as const,
      label: dict.view.versions.left,
      value: selectionState.leftVersionId
    },
    {
      key: "right" as const,
      label: dict.view.versions.right,
      value: selectionState.rightVersionId
    }
  ];
  return (
    <main className={repartoShellClass} data-reparto-route="versions">
      <div className={repartoMainGridClass}>
        <section className={repartoPanelClass} data-reparto-panel="version-list">
          <div className={repartoPanelHeaderClass}>
            <h2>{dict.view.versions.title}</h2>
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
                    <div className={repartoPanelHeaderClass}>
                      <span className="font-medium">
                        {formatRepartoMessage(dict.view.versions.item, {
                          number: version.version_number
                        })}
                      </span>
                      <span
                        className="text-sm text-muted-foreground"
                        data-reparto-slot="version-detail"
                      >
                        {formatRepartoMessage(dict.view.versions.itemDetail, {
                          created: version.created_at,
                          status: dict.entity.assignmentProcess.status[version.status]
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground" data-reparto-slot="version-reason">
                      {version.reason ?? dict.view.versions.noReason}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground" data-reparto-slot="no-versions">
                {dict.view.versions.empty}
              </p>
            )}
          </div>
          {canAct ? (
            <div className={repartoFieldGridClass}>
              <label className={repartoFieldLabelClass}>
                {dict.view.versions.createReason}
                <input
                  className={repartoInputClass}
                  data-reparto-field="version-reason"
                  maxLength={500}
                  onChange={(event: { target: { value: string } }) =>
                    onReasonChange?.(event.target.value)
                  }
                  type="text"
                  value={createReason}
                />
              </label>
            </div>
          ) : null}
          <div className={repartoActionRowClass}>
            {canAct ? (
              <button
                className={repartoButtonClass}
                data-reparto-action="create-version"
                disabled={createPending}
                onClick={() => onCreateVersion?.()}
                type="button"
              >
                {createPending ? dict.view.versions.createPending : dict.view.versions.create}
              </button>
            ) : null}
            <button
              className={repartoButtonClass}
              data-disabled-reason={previousYearAvailable ? undefined : "no_previous_year"}
              data-reparto-action="compare-previous-year"
              disabled={!previousYearAvailable}
              onClick={() => onPreviousYear?.()}
              type="button"
            >
              {dict.view.versions.previousYear}
            </button>
          </div>
          {previousYearAvailable ? null : (
            <p className="text-sm text-muted-foreground" data-reparto-slot="no-previous-year">
              {dict.view.versions.noPreviousYear}
            </p>
          )}
        </section>
        <section className={repartoPanelClass} data-reparto-panel="version-selection">
          <div className={repartoPanelHeaderClass}>
            <h2>{dict.view.versions.compare}</h2>
            <span
              className="text-sm text-muted-foreground"
              data-reparto-slot="comparison-availability"
            >
              {selectionState.reason
                ? dict.view.versions.blocked[selectionState.reason]
                : dict.view.versions.source.versions}
            </span>
          </div>
          <div className={repartoFieldGridClass}>
            {sides.map((side) => (
              <label className={repartoFieldLabelClass} key={side.key}>
                {side.label}
                <select
                  className={repartoInputClass}
                  data-reparto-field={`compare-${side.key}`}
                  onChange={(event: { target: { value: string } }) =>
                    onSelectVersion?.(side.key, event.target.value)
                  }
                  value={side.value ?? ""}
                >
                  {versions.map((version) => (
                    <option key={version.id} value={version.id}>
                      {formatRepartoMessage(dict.view.versions.item, {
                        number: version.version_number
                      })}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <div className={repartoActionRowClass}>
            <button
              className={repartoButtonClass}
              data-disabled-reason={selectionState.reason ?? undefined}
              data-reparto-action="compare-versions"
              disabled={!selectionState.canCompare}
              onClick={() => onCompare?.()}
              type="button"
            >
              {dict.view.versions.compare}
            </button>
          </div>
        </section>
        <VersionComparisonPanel
          comparison={comparison}
          dict={dict}
          source={comparisonSource}
        />
      </div>
    </main>
  );
}

/**
 * The export center, split into the three families plan §3.10/§20.25 keeps
 * apart: planning artifacts (draft and provisional never withheld), stored
 * process documents, and the strict final assignment export that archives the
 * process. Presentational only — every mutation is the container's.
 */
export function ExportCenterView({
  artifacts = [],
  assignmentValidations = null,
  finalConfirming = false,
  locale,
  onCancelFinalExport,
  onCreateDocumentExport,
  onCreateFinalExport,
  onCreatePlanningExport,
  onImportPlanning,
  onPlanningImportContentChange,
  onCancelRestore,
  onConfirmRestore,
  onReviewRestore,
  onRestoreAssignmentsChange,
  onReviewFinalExport,
  pendingDocumentType = null,
  pendingPlanningMode = null,
  pendingPlanningImport = false,
  pendingRestore = false,
  plan = null,
  planValidations = null,
  planningArtifact = null,
  planningImportContent = "",
  planningImportResult = null,
  processId,
  processStatus = "draft",
  restoreAssignments = true,
  restoreConfirming = false
}: {
  artifacts?: ExportArtifactPublic[];
  assignmentValidations?: AssignmentValidationReport | null;
  finalConfirming?: boolean;
  locale?: RepartoLocale;
  onCancelFinalExport?: () => void;
  onCreateDocumentExport?: (exportType: ExportArtifactType) => void;
  onCreateFinalExport?: () => void;
  onCreatePlanningExport?: (mode: PlanningExportMode) => void;
  onImportPlanning?: () => void;
  onPlanningImportContentChange?: (content: string) => void;
  onCancelRestore?: () => void;
  onConfirmRestore?: () => void;
  onReviewRestore?: () => void;
  onRestoreAssignmentsChange?: (restore: boolean) => void;
  onReviewFinalExport?: () => void;
  pendingDocumentType?: ExportArtifactType | null;
  pendingPlanningMode?: PlanningExportMode | null;
  pendingPlanningImport?: boolean;
  pendingRestore?: boolean;
  plan?: TeachingPlanPublic | null;
  planValidations?: PlanValidationReport | null;
  planningArtifact?: PlanningExportArtifact | null;
  planningImportContent?: string;
  planningImportResult?: PlanningImportResult | null;
  processId?: string;
  processStatus?: AssignmentProcessStatus;
  restoreAssignments?: boolean;
  restoreConfirming?: boolean;
}) {
  const dict = getRepartoDictionary(locale ?? normalizeRepartoLocale());
  // The three §7.8 planning exports sit at the read floor on the service, and
  // §21.4 keeps authentication and feasibility gating orthogonal — so a `READER`
  // keeps the planning-export panel and the stored-document list. What goes
  // below `ADMIN` is everything that writes: the planning import, creating a
  // document export, restoring a draft, the final export that archives the
  // process, and the leadership transitions.
  const canAct = useRepartoCanAct("exports");
  const state = buildExportCenterState({
    plan,
    planValidations,
    assignmentValidations,
    artifacts,
    processStatus
  });
  const workflowAction = nextLeadershipWorkflowAction(processStatus);
  return (
    <main
      className={repartoShellClass}
      data-process-id={processId}
      data-reparto-route="exports"
      data-reparto-workflow-action={workflowAction ?? "none"}
    >
      <div className={repartoMainGridClass}>
        <PlanningExportPanel
          artifact={planningArtifact}
          dict={dict}
          onExport={onCreatePlanningExport}
          pendingMode={pendingPlanningMode}
          state={state}
        />
        {canAct ? (
          <PlanningImportPanel
            content={planningImportContent}
            dict={dict}
            onChange={onPlanningImportContentChange}
            onImport={onImportPlanning}
            pending={pendingPlanningImport}
            planStatus={plan?.status ?? null}
            result={planningImportResult}
          />
        ) : null}
        <ProcessDocumentPanel
          artifacts={artifacts}
          canAct={canAct}
          dict={dict}
          onExport={onCreateDocumentExport}
          onCancelRestore={onCancelRestore}
          onConfirmRestore={onConfirmRestore}
          onRestoreAssignmentsChange={onRestoreAssignmentsChange}
          onReviewRestore={onReviewRestore}
          pendingType={pendingDocumentType}
          pendingRestore={pendingRestore}
          restoreAssignments={restoreAssignments}
          restoreConfirming={restoreConfirming}
          state={state}
        />
        {canAct ? (
          <FinalAssignmentExportPanel
            confirming={finalConfirming}
            dict={dict}
            onCancel={onCancelFinalExport}
            onConfirm={onCreateFinalExport}
            onReview={onReviewFinalExport}
            pending={pendingDocumentType === "final"}
            state={state}
          />
        ) : null}
        {canAct ? (
        <section className={repartoPanelClass} data-reparto-panel="leadership-workflow">
          <div className={repartoPanelHeaderClass}>
            <h2>{dict.view.exports.leadershipWorkflow}</h2>
            <span className="text-sm text-muted-foreground" data-reparto-slot="process-status">
              {dict.entity.assignmentProcess.status[processStatus]}
            </span>
          </div>
          <div className={repartoActionRowClass}>
            <button
              className={repartoButtonClass}
              data-reparto-action="mark-returned"
              data-reparto-active={workflowAction === "mark-returned"}
              type="button"
            >
              {dict.view.exports.markReturned}
            </button>
            <button
              className={repartoButtonClass}
              data-reparto-action="start-revision"
              data-reparto-active={workflowAction === "start-revision"}
              type="button"
            >
              {dict.view.exports.startRevision}
            </button>
            <button
              className={repartoButtonClass}
              data-reparto-action="reopen-final"
              data-reparto-active={workflowAction === "reopen-final"}
              type="button"
            >
              {dict.view.exports.reopenFinal}
            </button>
          </div>
          <div data-reparto-slot="workflow-result" />
        </section>
        ) : null}
      </div>
    </main>
  );
}

function PlanningImportPanel({
  content,
  dict,
  onChange,
  onImport,
  pending,
  planStatus,
  result
}: {
  content: string;
  dict: RepartoDictionary;
  onChange?: (content: string) => void;
  onImport?: () => void;
  pending: boolean;
  planStatus: TeachingPlanStatus | null;
  result: PlanningImportResult | null;
}) {
  const draft = buildPlanningImportDraftState(content);
  return (
    <section className={repartoPanelClass} data-reparto-panel="planning-import">
      <div className={repartoPanelHeaderClass}>
        <h2>{dict.view.exports.importPlanning.title}</h2>
        <span className="text-sm text-muted-foreground" data-reparto-slot="import-count">
          {result?.imported_count ?? 0}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        {dict.view.exports.importPlanning.description}
      </p>
      <label className={repartoFieldLabelClass}>
        <span>{dict.view.exports.importPlanning.content}</span>
        <textarea
          className={`${repartoInputClass} min-h-36 font-mono`}
          data-reparto-field="planning-import-content"
          onChange={(event: { target: { value: string } }) =>
            onChange?.(event.target.value)
          }
          placeholder={dict.view.exports.importPlanning.placeholder}
          value={content}
        />
      </label>
      {draft.error ? (
        <p className="text-sm text-destructive" data-planning-import-error={draft.error}>
          {dict.view.exports.importPlanning.error[draft.error as PlanningImportDraftError]}
        </p>
      ) : null}
      <div className={repartoActionRowClass}>
        <button
          className={repartoButtonClass}
          data-reparto-action="import-planning"
          disabled={draft.request === null || pending}
          onClick={() => onImport?.()}
          type="button"
        >
          {dict.view.exports.importPlanning.action}
        </button>
      </div>
      <p className="text-sm text-muted-foreground" data-reparto-slot="import-never-blocked">
        {dict.view.exports.importPlanning.neverBlocked}
      </p>
      {result ? (
        <section
          className="space-y-3 rounded-md border border-border/70 p-4"
          data-import-exact={result.balance.is_exact ? "true" : "false"}
          data-reparto-slot="planning-import-result"
          role="status"
        >
          <h3 className="font-semibold">{dict.view.exports.importPlanning.resultTitle}</h3>
          <p>
            {formatRepartoMessage(dict.view.exports.importPlanning.resultSummary, {
              count: result.imported_count
            })}
          </p>
          <PlanningBalancePanel balance={result.balance} dict={dict} planStatus={planStatus} />
          <h3 className="font-semibold">
            {dict.view.exports.importPlanning.reconciliationTitle}
          </h3>
          <p className="text-sm text-muted-foreground">
            {formatRepartoMessage(dict.view.exports.importPlanning.findings, {
              blocking: result.validations.blocking_count,
              warning: result.validations.warning_count
            })}
          </p>
          <ProcessValidationList
            dict={dict}
            messages={result.validations.messages}
            stage="planning"
          />
        </section>
      ) : null}
    </section>
  );
}

/**
 * The feasibility label §20.25 requires on a provisional document.
 *
 * Printed from the plan's own status, never inferred: a document that does not
 * say `NOT EVALUATED` where it applies is a document that presents itself as
 * validated. With no plan at all there is no status to print, and saying so is
 * not the same as printing `not_evaluated`.
 */
function FeasibilityLabel({
  dict,
  status
}: {
  dict: RepartoDictionary;
  status: FeasibilityStatus | null;
}) {
  return (
    <p
      className="text-sm text-muted-foreground"
      data-feasibility-status={status ?? "none"}
      data-reparto-slot="planning-feasibility"
    >
      {status === null
        ? dict.view.exports.planning.feasibilityMissing
        : formatRepartoMessage(dict.view.exports.planning.feasibilityLabel, {
            status: dict.view.exports.planning.feasibility[status]
          })}
    </p>
  );
}

function PlanningExportPanel({
  artifact,
  dict,
  onExport,
  pendingMode,
  state
}: {
  artifact: PlanningExportArtifact | null;
  dict: RepartoDictionary;
  onExport?: (mode: PlanningExportMode) => void;
  pendingMode: PlanningExportMode | null;
  state: ExportCenterState;
}) {
  return (
    <section className={repartoPanelClass} data-reparto-panel="planning-exports">
      <div className={repartoPanelHeaderClass}>
        <h2>{dict.view.exports.planning.title}</h2>
        <span className="text-sm text-muted-foreground" data-reparto-slot="plan-status">
          {state.planStatus
            ? dict.requirements.planStatus[state.planStatus]
            : dict.view.exports.planning.blocked.plan_missing}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        {dict.view.exports.planning.description}
      </p>
      <FeasibilityLabel dict={dict} status={state.feasibilityStatus} />
      <ul className={repartoListClass} data-reparto-slot="planning-export-modes">
        {state.planningExports.map((offer) => (
          <li
            className={repartoListItemClass}
            data-planning-export-blocked={offer.blocked ? "true" : "false"}
            data-planning-export-mode={offer.mode}
            key={offer.mode}
          >
            <p className="font-medium">{dict.view.exports.planning.mode[offer.mode]}</p>
            <p className="text-sm text-muted-foreground">
              {dict.view.exports.planning.modeDescription[offer.mode]}
            </p>
            {offer.printsFeasibility ? (
              <p className="text-sm text-muted-foreground" data-reparto-slot="not-validated">
                {dict.view.exports.planning.notValidated}
              </p>
            ) : null}
            <div className={repartoActionRowClass}>
              <button
                className={repartoButtonClass}
                data-disabled-reason={offer.reason ?? undefined}
                data-reparto-action="export-planning"
                data-reparto-export-mode={offer.mode}
                disabled={offer.blocked || pendingMode !== null}
                onClick={() => onExport?.(offer.mode)}
                type="button"
              >
                {dict.view.exports.planning.action}
              </button>
            </div>
            {offer.blocked ? (
              <p className="text-sm text-destructive" data-reparto-slot="planning-export-blocked">
                {dict.view.exports.planning.blocked[offer.reason as PlanningExportBlockedReason]}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {offer.mode === "final" ? "" : dict.view.exports.planning.neverBlocked}
              </p>
            )}
          </li>
        ))}
      </ul>
      {artifact ? (
        <section
          className="space-y-2 rounded-md border border-border/70 p-4"
          data-plan-exact={artifact.is_exact ? "true" : "false"}
          data-planning-artifact-mode={artifact.mode}
          data-reparto-slot="planning-artifact"
          role="status"
        >
          <h3 className="font-semibold">{dict.view.exports.planning.resultTitle}</h3>
          <p>
            {formatRepartoMessage(dict.view.exports.planning.resultSummary, {
              mode: dict.view.exports.planning.mode[artifact.mode],
              generated: artifact.generated_at
            })}
          </p>
          <p data-reparto-slot="planning-artifact-activities">
            {formatRepartoMessage(dict.view.exports.planning.activities, {
              count: artifact.activities.length
            })}
          </p>
          <p data-reparto-slot="planning-artifact-exactness">
            {artifact.is_exact
              ? dict.view.exports.planning.exact
              : dict.view.exports.planning.inexact}
          </p>
          <p data-reparto-slot="planning-artifact-findings">
            {formatRepartoMessage(dict.view.exports.planning.findings, {
              blocking: artifact.validations.blocking_count,
              warning: artifact.validations.warning_count
            })}
          </p>
        </section>
      ) : null}
    </section>
  );
}

function ProcessDocumentPanel({
  artifacts,
  canAct,
  dict,
  onExport,
  onCancelRestore,
  onConfirmRestore,
  onRestoreAssignmentsChange,
  onReviewRestore,
  pendingType,
  pendingRestore,
  restoreAssignments,
  restoreConfirming,
  state
}: {
  artifacts: ExportArtifactPublic[];
  /** Decided once by the export centre from the session; never by a route. */
  canAct: boolean;
  dict: RepartoDictionary;
  onExport?: (exportType: ExportArtifactType) => void;
  onCancelRestore?: () => void;
  onConfirmRestore?: () => void;
  onRestoreAssignmentsChange?: (restore: boolean) => void;
  onReviewRestore?: () => void;
  pendingType: ExportArtifactType | null;
  pendingRestore: boolean;
  restoreAssignments: boolean;
  restoreConfirming: boolean;
  state: ExportCenterState;
}) {
  return (
    <section className={repartoPanelClass} data-reparto-panel="export-center">
      <div className={repartoPanelHeaderClass}>
        <h2>{dict.view.exports.documents.title}</h2>
        <span className="text-sm text-muted-foreground" data-reparto-slot="backup-count">
          {state.backupCount}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        {dict.view.exports.documents.description}
      </p>
      {canAct ? (
        <div className={repartoActionRowClass}>
          {state.documentExportTypes.map((exportType) => (
            <button
              className={repartoButtonClass}
              data-reparto-action="create-export"
              data-reparto-export-type={exportType}
              disabled={pendingType !== null}
              key={exportType}
              onClick={() => onExport?.(exportType)}
              type="button"
            >
              {formatRepartoMessage(dict.view.exports.documents.action, {
                document: dict.view.exports.type[exportType]
              })}
            </button>
          ))}
        </div>
      ) : null}
      {canAct ? (
        <div className={repartoActionRowClass}>
          <button
            className={repartoButtonClass}
            data-disabled-reason={state.restore.reason ?? undefined}
            data-reparto-action="restore-draft"
            data-reparto-backup-id={state.latestBackupId ?? ""}
            disabled={!state.restore.allowed || pendingRestore}
            onClick={() => onReviewRestore?.()}
            type="button"
          >
            {dict.action.restore}
          </button>
        </div>
      ) : null}
      {canAct && state.restore.reason ? (
        <p className="text-sm text-destructive" data-restore-blocked-reason={state.restore.reason}>
          {dict.view.exports.restore.blocked[state.restore.reason]}
        </p>
      ) : null}
      {canAct && restoreConfirming && state.restore.allowed ? (
        <section
          aria-labelledby="restore-confirmation-title"
          className="space-y-3 rounded-lg border border-primary/40 bg-muted/30 p-4"
          data-reparto-dialog="restore-confirmation"
          role="alertdialog"
        >
          <h3 className="font-semibold" id="restore-confirmation-title">
            {dict.view.exports.restore.confirmTitle}
          </h3>
          <p>{dict.view.exports.restore.confirmBody}</p>
          <label className="flex items-center gap-2 text-sm">
            <input
              checked={restoreAssignments}
              data-reparto-field="restore-assignments"
              onChange={(event: { target: { checked: boolean } }) =>
                onRestoreAssignmentsChange?.(event.target.checked)
              }
              type="checkbox"
            />
            <span>{dict.view.exports.restore.restoreAssignments}</span>
          </label>
          <div className={repartoActionRowClass}>
            <button
              className={repartoButtonClass}
              data-reparto-action="confirm-restore"
              disabled={pendingRestore}
              onClick={() => onConfirmRestore?.()}
              type="button"
            >
              {dict.view.exports.restore.confirmAction}
            </button>
            <button
              className={repartoButtonClass}
              data-reparto-action="cancel"
              disabled={pendingRestore}
              onClick={() => onCancelRestore?.()}
              type="button"
            >
              {dict.action.cancel}
            </button>
          </div>
        </section>
      ) : null}
      <div data-reparto-slot="export-list">
        {artifacts.length > 0 ? (
          <ul className={repartoListClass}>
            {artifacts.map((artifact) => (
              <li
                className={repartoListItemClass}
                data-export-artifact-id={artifact.id}
                data-export-artifact-type={artifact.export_type}
                key={artifact.id}
              >
                {formatRepartoMessage(dict.view.exports.documents.item, {
                  document: dict.view.exports.type[artifact.export_type],
                  format: artifact.format.toUpperCase()
                })}
              </li>
            ))}
          </ul>
        ) : (
          <p data-reparto-state="empty">{dict.view.exports.documents.empty}</p>
        )}
      </div>
    </section>
  );
}

/**
 * The strict final export (plan §3.10, §20.25).
 *
 * Every refusal is listed, not just the first: a head who fixes the blocking
 * findings and then discovers feasibility was never confirmed has been told
 * half the truth twice. The confirmation exists because the service archives
 * the process as it writes the artifact.
 */
function FinalAssignmentExportPanel({
  confirming,
  dict,
  onCancel,
  onConfirm,
  onReview,
  pending,
  state
}: {
  confirming: boolean;
  dict: RepartoDictionary;
  onCancel?: () => void;
  onConfirm?: () => void;
  onReview?: () => void;
  pending: boolean;
  state: ExportCenterState;
}) {
  const { finalExport } = state;
  return (
    <section className={repartoPanelClass} data-reparto-panel="final-close">
      <div className={repartoPanelHeaderClass}>
        <h2>{dict.view.exports.final.title}</h2>
        <span className="text-sm text-muted-foreground" data-reparto-slot="blocking-count">
          {finalExport.blockingCount ?? "—"}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{dict.view.exports.final.description}</p>
      <div
        data-final-export-allowed={finalExport.allowed ? "true" : "false"}
        data-reparto-slot="final-export-state"
      >
        {finalExport.allowed ? (
          <p>{dict.view.exports.final.ready}</p>
        ) : (
          <ul className={repartoListClass}>
            {finalExport.reasons.map((reason) => (
              <li
                className={repartoListItemClass}
                data-final-blocked-reason={reason}
                key={reason}
              >
                {formatRepartoMessage(dict.view.exports.final.blocked[reason], {
                  count: finalExport.blockingCount ?? 0
                })}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className={repartoActionRowClass}>
        <button
          className={repartoButtonClass}
          data-disabled-reason={finalExport.reasons[0] ?? undefined}
          data-reparto-action="create-final-export"
          disabled={!finalExport.allowed || pending}
          onClick={() => onReview?.()}
          type="button"
        >
          {dict.view.exports.final.action}
        </button>
      </div>
      {confirming && finalExport.allowed ? (
        <section
          aria-labelledby="final-export-confirmation-title"
          className="space-y-3 rounded-lg border border-primary/40 bg-muted/30 p-4"
          data-reparto-dialog="final-export-confirmation"
          role="alertdialog"
        >
          <h3 className="font-semibold" id="final-export-confirmation-title">
            {dict.view.exports.final.confirmTitle}
          </h3>
          <p>{dict.view.exports.final.confirmBody}</p>
          <div className={repartoActionRowClass}>
            <button
              className={repartoButtonClass}
              data-reparto-action="confirm-final-export"
              disabled={pending}
              onClick={() => onConfirm?.()}
              type="button"
            >
              {dict.view.exports.final.confirmAction}
            </button>
            <button
              className={repartoButtonClass}
              data-reparto-action="cancel"
              disabled={pending}
              onClick={() => onCancel?.()}
              type="button"
            >
              {dict.action.cancel}
            </button>
          </div>
        </section>
      ) : null}
    </section>
  );
}
