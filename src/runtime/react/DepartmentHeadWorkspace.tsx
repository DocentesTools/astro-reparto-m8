import type {
  AssignmentProcessPublic,
  AssignmentProcessStatus,
  CurrentTurnSummary,
  ExportArtifactPublic,
  ParticipantBalance,
  PlanBalance,
  PlanReadiness,
  PlanValidationMessage,
  ProcessDashboard,
  ProcessSummary,
  ProcessVersionPublic,
  TeachingPlanStatus,
  VersionComparison
} from "../schemas.js";
import {
  buildExportCenterState,
  buildVersionComparisonLabel,
  canCompareVersions,
  nextLeadershipWorkflowAction,
  summarizeProcessDashboard
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

/**
 * What a summary-driven view shows before the service has answered.
 *
 * Nothing here asserts progress: readiness is `not_ready`, there is no plan and
 * every count is zero. The placeholder must never let a head read "0 blocking
 * findings" as "nothing blocks" — it means "the service has not been asked".
 */
const fallbackSummary: ProcessSummary = {
  process_id: "00000000-0000-4000-8000-000000000001",
  generated_at: "2026-07-05T00:00:00Z",
  readiness: "not_ready",
  plan_status: null,
  plan_balance: null,
  total_slots: 0,
  assigned_slots: 0,
  available_slots: 0,
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
 * The three invariants, side by side, never collapsed into one badge.
 *
 * Backend plan §20.20 is explicit: group balance, teacher-load balance and
 * readiness are independent, and a single "ready" pill — which is what the
 * retired `overview-state` slot was — hides which of the three is the reason.
 * §3.2's co-teaching example is 120 group hours against 124 teacher-load hours
 * with *both* correct, so the two balances cannot even be compared with each
 * other, let alone summed.
 *
 * The third invariant is reported as `readiness`, the coarse role-safe
 * projection the service publishes; the raw feasibility status is planning-stage
 * detail and is not on this payload by design.
 */
export function ProcessInvariantRow({
  balance,
  dict,
  readiness
}: {
  balance: PlanBalance | null;
  dict: ReturnType<typeof getRepartoDictionary>;
  readiness: PlanReadiness;
}) {
  const invariants = [
    {
      key: "group",
      label: dict.dashboard.invariant.group,
      state: balance ? (balance.group.is_balanced ? "balanced" : "unbalanced") : "unknown",
      value: balance
        ? dict.dashboard.balanceState[balance.group.is_balanced ? "balanced" : "unbalanced"]
        : dict.dashboard.balanceState.unknown
    },
    {
      key: "teacher",
      label: dict.dashboard.invariant.teacher,
      state: balance
        ? balance.teacher.is_balanced
          ? "balanced"
          : "unbalanced"
        : "unknown",
      value: balance
        ? dict.dashboard.balanceState[balance.teacher.is_balanced ? "balanced" : "unbalanced"]
        : dict.dashboard.balanceState.unknown
    },
    {
      key: "readiness",
      label: dict.dashboard.invariant.readiness,
      state: readiness,
      value: dict.dashboard.readiness[readiness]
    }
  ] as const;
  return (
    <dl className={repartoMetricsClass} data-reparto-slot="process-invariants">
      {invariants.map((invariant) => (
        <div
          className={repartoMetricItemClass}
          data-reparto-invariant={invariant.key}
          data-reparto-invariant-state={invariant.state}
          key={invariant.key}
        >
          <dt className={repartoMetricLabelClass}>{invariant.label}</dt>
          <dd className={repartoMetricValueClass}>{invariant.value}</dd>
        </div>
      ))}
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
  const activeSummary = summary ?? (dashboard ? summarizeProcessDashboard(dashboard) : null);
  const planning = dashboard?.planning ?? null;
  const assignment = dashboard?.assignment ?? null;
  const participants = assignment?.summary.participants ?? [];
  const balance = activeSummary?.plan_balance ?? null;
  const readiness = activeSummary?.readiness ?? "not_ready";
  const totalSlots = activeSummary?.total_slots ?? 0;
  const assignedSlots = activeSummary?.assigned_slots ?? 0;
  const availableSlots = activeSummary?.available_slots ?? 0;
  const checklistSteps = [
    { key: "school", done: Boolean(activeSummary) },
    { key: "academicYear", done: Boolean(activeSummary) },
    { key: "department", done: Boolean(activeSummary) },
    { key: "process", done: Boolean(activeSummary) },
    // The plan replaces the subject and classroom counts the old checklist
    // derived from `requirement_balances`: a plan exists once its inputs do,
    // and the plan status is the service's own statement about them.
    { key: "subjects", done: planning?.teaching_plan_id !== null && planning !== null },
    { key: "classrooms", done: Boolean(balance) },
    { key: "teacherRoster", done: participants.length > 0 },
    { key: "requirements", done: totalSlots > 0 },
    { key: "participants", done: participants.length > 0 }
  ] as const;
  const checklistDoneCount = checklistSteps.filter((step) => step.done).length;
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
          <ProcessInvariantRow balance={balance} dict={dict} readiness={readiness} />
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
              {checklistDoneCount}/{checklistSteps.length}
            </span>
          </div>
          <ol className="mt-3 grid gap-2">
            {checklistSteps.map((step) => (
              <li
                className="flex items-center justify-between gap-3 rounded-md border border-border/70 bg-muted/20 px-3 py-2 text-sm"
                data-reparto-checklist-state={step.done ? "done" : "pending"}
                data-reparto-checklist-step={step.key}
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
  locale,
  processes = []
}: {
  count?: number;
  locale?: RepartoLocale;
  processes?: AssignmentProcessPublic[];
}) {
  const dict = getRepartoDictionary(locale ?? normalizeRepartoLocale());
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
        <button className={repartoButtonClass} type="button" data-reparto-action="create-process">
          {dict.action.create} {dict.entity.assignmentProcess.singular.toLowerCase()}
        </button>
      </section>
    </main>
  );
}

export function VersionsView({
  comparison = fallbackComparison,
  locale,
  versions = []
}: {
  comparison?: VersionComparison;
  locale?: RepartoLocale;
  versions?: ProcessVersionPublic[];
}) {
  const dict = getRepartoDictionary(locale ?? normalizeRepartoLocale());
  const comparisonEnabled = canCompareVersions(versions);
  const comparisonLabel = comparison.changed_sections.length === 0
    ? dict.view.versions.noChanges
    : buildVersionComparisonLabel(comparison);
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
                    {formatRepartoMessage(dict.view.versions.item, { number: version.version_number })}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className={repartoActionRowClass}>
            <button className={repartoButtonClass} type="button" data-reparto-action="create-version">
              {dict.view.versions.create}
            </button>
            <button
              className={repartoButtonClass}
              data-reparto-action="compare-versions"
              disabled={!comparisonEnabled}
              type="button"
            >
              {dict.view.versions.compare}
            </button>
          </div>
        </section>
        <section className={repartoPanelClass} data-reparto-panel="comparison">
          <div className={repartoPanelHeaderClass}>
            <h2>{dict.view.versions.comparison}</h2>
            <span className="text-sm text-muted-foreground" data-reparto-slot="comparison-state">
              {comparisonLabel}
            </span>
          </div>
          <dl className={repartoMetricsClass}>
            <div className={repartoMetricItemClass}>
              <dt className={repartoMetricLabelClass}>{dict.view.versions.requiredDelta}</dt>
              <dd className={repartoMetricValueLargeClass} data-reparto-slot="required-hours-delta">
                {comparison.required_hours_delta}
              </dd>
            </div>
            <div className={repartoMetricItemClass}>
              <dt className={repartoMetricLabelClass}>{dict.view.versions.assignedDelta}</dt>
              <dd className={repartoMetricValueLargeClass} data-reparto-slot="assigned-hours-delta">
                {comparison.assigned_hours_delta}
              </dd>
            </div>
            <div className={repartoMetricItemClass}>
              <dt className={repartoMetricLabelClass}>{dict.view.versions.teacherDelta}</dt>
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
  locale,
  processId,
  processStatus = "draft",
  summary = fallbackSummary
}: {
  exports?: ExportArtifactPublic[];
  locale?: RepartoLocale;
  processId?: string;
  processStatus?: AssignmentProcessStatus;
  summary?: ProcessSummary;
}) {
  const dict = getRepartoDictionary(locale ?? normalizeRepartoLocale());
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
            <h2>{dict.view.exports.title}</h2>
            <span className="text-sm text-muted-foreground" data-reparto-slot="export-state">
              {state.finalBlocked ? dict.view.exports.finalBlocked : dict.view.exports.finalReady}
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
                {dict.view.exports.type[exportType as keyof typeof dict.view.exports.type]}
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
                    {dict.view.exports.type[artifact.export_type]} {artifact.format.toUpperCase()}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
        <section className={repartoPanelClass} data-reparto-panel="final-close">
          <div className={repartoPanelHeaderClass}>
            <h2>{dict.view.exports.closeout}</h2>
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
              {dict.view.exports.finalExport}
            </button>
            <button
              className={repartoButtonClass}
              data-reparto-action="restore-draft"
              data-reparto-backup-id={state.latestBackupId ?? ""}
              disabled={!state.restoreDraftEnabled}
              type="button"
            >
              {dict.action.restore}
            </button>
          </div>
          <div data-reparto-slot="restore-result" />
        </section>
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
      </div>
    </main>
  );
}
