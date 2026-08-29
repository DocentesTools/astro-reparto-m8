"use client";

import { useMemo } from "react";

import { RepartoApiError } from "../../../errors.js";
import {
  formatRepartoMessage,
  type RepartoDictionary
} from "../../../i18n/index.js";
import type {
  HourRequirementPublic,
  SubjectPublic,
  TeachingActivityPublic
} from "../../../schemas.js";
import {
  buildFeasibilityPanelState,
  isFeasibilityDiagnosticsExpected,
  type FeasibilityDiagnosticsLookup,
  type FeasibilityPanelState
} from "../../../ui/feasibility.js";
import {
  useEvaluateRepartoFeasibility,
  useRepartoFeasibilityDiagnostics,
  useRepartoHourRequirements,
  useRepartoSubjects,
  useRepartoTeachingActivities,
  useRepartoTeachingPlan
} from "../../hooks.js";
import {
  repartoFieldCaptionClass,
  repartoPanelClass
} from "../../styles.js";
import { repartoToast } from "../../ui/toast-notification.js";
import {
  ActionButton,
  RepartoFormError,
  RowActions,
  useDict,
  useMappedError
} from "../process-crud/shared.js";
import {
  PlanningPanelGate,
  type PlanningPanelProps
} from "./panel-gate.js";

/**
 * The department-head infeasibility panel (backend plan §20.20).
 *
 * It renders the latest bounded evaluation — status, findings and suggested
 * remediation — and offers the administrator-only evaluate action. Findings
 * name concrete activities/slots, so this panel belongs to the
 * department-head planning surface only: nothing here may reach the teacher
 * or shared-screen tiers (§20.24), and no vocabulary from it is reused there.
 */

/** Build the display-label lookup from the already-loaded planning data. */
export function buildFeasibilityDiagnosticsLookup(input: {
  activities: readonly TeachingActivityPublic[];
  dict: RepartoDictionary;
  requirements: readonly HourRequirementPublic[];
  subjects: readonly SubjectPublic[];
}): FeasibilityDiagnosticsLookup {
  const activityById = new Map(
    input.activities.map((activity) => [activity.id, activity])
  );
  const subjectById = new Map(
    input.subjects.map((subject) => [subject.id, subject])
  );
  const slotById = new Map(
    input.requirements.map((slot) => [slot.id, slot])
  );
  const activityLabel = (activityId: string): string | null => {
    const activity = activityById.get(activityId);
    if (!activity) return null;
    const subject = subjectById.get(activity.subject_id);
    return formatRepartoMessage(input.dict.requirements.activityLabel, {
      subject: subject?.name ?? input.dict.requirements.unknownSubject,
      type: input.dict.option.activityType[activity.activity_type]
    });
  };
  const slotLabel = (slotId: string): string | null => {
    const slot = slotById.get(slotId);
    if (!slot) return null;
    const activity = activityById.get(slot.teaching_activity_id);
    const activityText =
      (activity ? activityLabel(activity.id) : null) ??
      input.dict.requirements.unknownActivity;
    return formatRepartoMessage(input.dict.planning.feasibility.affectedSlot, {
      activity: activityText,
      position: formatRepartoMessage(input.dict.requirements.position, {
        position: slot.position_index + 1
      })
    });
  };
  return { activityLabel, slotLabel };
}

/** Pure presentational half: everything decided by {@link buildFeasibilityPanelState}. */
export function FeasibilityDiagnosticsView({
  dict,
  diagnosticsError,
  diagnosticsLoading = false,
  evaluateDisabled = false,
  evaluateDisabledReason = null,
  evaluatePending = false,
  onEvaluate,
  state
}: {
  dict: RepartoDictionary;
  diagnosticsError?: unknown;
  diagnosticsLoading?: boolean;
  evaluateDisabled?: boolean;
  evaluateDisabledReason?: string | null;
  evaluatePending?: boolean;
  onEvaluate?: () => void;
  state: FeasibilityPanelState;
}) {
  const labels = dict.planning.feasibility;
  return (
    <section
      className={`${repartoPanelClass} space-y-4`}
      data-reparto-component="feasibility-diagnostics"
      data-reparto-tier="department-head"
    >
      <header>
        <h2 className="font-semibold">{labels.title}</h2>
        <p className={repartoFieldCaptionClass}>{labels.description}</p>
      </header>
      {state.kind === "no_plan" ? (
        <p data-reparto-state="no-plan">{labels.noPlan}</p>
      ) : null}
      {state.kind === "not_evaluated" ? (
        <p data-reparto-state="not-evaluated">{labels.notEvaluated}</p>
      ) : null}
      {state.kind === "evaluated" ? (
        <div className="space-y-2">
          <p
            data-feasibility-status={state.status}
            data-reparto-slot="feasibility-evaluation-status"
          >
            <span className="font-medium">{labels.statusTitle}: </span>
            {dict.dashboard.feasibility[state.status]}
          </p>
          {state.checkedAt ? (
            <p className={repartoFieldCaptionClass}>
              {formatRepartoMessage(labels.evaluatedAt, {
                timestamp: state.checkedAt
              })}
            </p>
          ) : null}
          {state.solverVersion ? (
            <p className={repartoFieldCaptionClass}>
              {formatRepartoMessage(labels.solverVersion, {
                version: state.solverVersion
              })}
            </p>
          ) : null}
        </div>
      ) : null}
      {state.kind === "evaluated" && state.diagnosticsExpected ? (
        <div className="space-y-2">
          <h3 className="font-medium">{labels.findingsTitle}</h3>
          {diagnosticsLoading ? (
            <p data-reparto-state="loading" role="status">
              {labels.diagnosticsLoading}
            </p>
          ) : null}
          {diagnosticsError ? (
            <p className="text-sm text-destructive" data-reparto-state="error">
              {diagnosticsError instanceof Error
                ? diagnosticsError.message
                : labels.diagnosticsUnavailable}
            </p>
          ) : null}
          {!diagnosticsLoading && !diagnosticsError && state.rows.length === 0 ? (
            <p data-reparto-state="no-findings">{labels.evaluatedNone}</p>
          ) : null}
          {state.rows.length > 0 ? (
            <ul className="space-y-2" data-reparto-list="feasibility-diagnostics">
              {state.rows.map((row) => (
                <li
                  className="space-y-1 rounded-md border border-border/70 p-3"
                  data-feasibility-diagnostic-code={row.code}
                  key={`${row.code}-${row.message}`}
                >
                  <p className="font-medium">{row.message}</p>
                  <p className={repartoFieldCaptionClass}>{row.code}</p>
                  {row.affected.length > 0 ? (
                    <p className="text-sm">
                      <span className="font-medium">{labels.affectedTitle}: </span>
                      {row.affected.join(" · ")}
                    </p>
                  ) : null}
                  {row.unresolvedCount > 0 ? (
                    <p
                      className={repartoFieldCaptionClass}
                      data-feasibility-unresolved-count={row.unresolvedCount}
                    >
                      {formatRepartoMessage(labels.unresolvedReferences, {
                        count: row.unresolvedCount
                      })}
                    </p>
                  ) : null}
                  <p className="text-sm">
                    <span className="font-medium">{labels.suggestionTitle}: </span>
                    {labels.suggestion[row.code]}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      {state.kind === "evaluated" && !state.diagnosticsExpected ? (
        <p data-reparto-state="no-findings">{labels.evaluatedNone}</p>
      ) : null}
      <RowActions>
        <ActionButton
          action="evaluate-feasibility"
          disabled={evaluateDisabled || evaluatePending}
          disabledReason={evaluateDisabledReason}
          label={labels.evaluateAction}
          onClick={onEvaluate}
        />
      </RowActions>
    </section>
  );
}

/** The connected department-head panel: queries, lookup and the evaluate action. */
/** The connected department-head panel: queries, lookup and the evaluate action. */
export function FeasibilityDiagnosticsPanel(props: PlanningPanelProps) {
  return (
    <PlanningPanelGate>
      <FeasibilityDiagnosticsPanelBody {...props} />
    </PlanningPanelGate>
  );
}

function FeasibilityDiagnosticsPanelBody({ locale, processId }: PlanningPanelProps) {
  const dict = useDict(locale);
  const planQuery = useRepartoTeachingPlan(processId);
  // A 404 here is the documented "no plan yet" answer, not a failure; every
  // other error is surfaced instead of being misread as "no plan".
  const planNotFound =
    planQuery.error instanceof RepartoApiError && planQuery.error.status === 404;
  const plan = planQuery.data ?? null;
  const diagnosticsExpected = isFeasibilityDiagnosticsExpected(
    plan?.feasibility_status
  );
  const diagnosticsQuery = useRepartoFeasibilityDiagnostics(
    processId,
    diagnosticsExpected
  );
  const activitiesQuery = useRepartoTeachingActivities(processId);
  const subjectsQuery = useRepartoSubjects(processId);
  const requirementsQuery = useRepartoHourRequirements(processId);
  const evaluateMutation = useEvaluateRepartoFeasibility();
  const [mapped, setError, clearError] = useMappedError();

  const lookup = useMemo(
    () =>
      buildFeasibilityDiagnosticsLookup({
        activities: activitiesQuery.data?.data ?? [],
        dict,
        requirements: requirementsQuery.data?.data ?? [],
        subjects: subjectsQuery.data?.data ?? []
      }),
    [activitiesQuery.data, requirementsQuery.data, subjectsQuery.data, dict]
  );
  const state = buildFeasibilityPanelState({
    plan,
    report: diagnosticsQuery.data ?? null,
    lookup
  });

  function handleEvaluate() {
    if (!processId || plan === null || evaluateMutation.isPending) return;
    clearError();
    evaluateMutation.mutate(processId, {
      onSuccess: (evaluation) => {
        repartoToast.success(
          formatRepartoMessage(dict.planning.feasibility.evaluateSuccess, {
            status: dict.dashboard.feasibility[evaluation.status]
          })
        );
      },
      onError: (error) => {
        setError(error);
        repartoToast.error(
          dict.planning.feasibility.evaluateError,
          error instanceof Error ? error.message : undefined
        );
      }
    });
  }

  if (planQuery.isLoading) {
    return (
      <section
        className={`${repartoPanelClass} space-y-4`}
        data-reparto-component="feasibility-diagnostics"
        data-reparto-tier="department-head"
      >
        <p data-reparto-state="loading" role="status">
          {dict.planning.feasibility.planLoading}
        </p>
      </section>
    );
  }
  if (planQuery.isError && !planNotFound) {
    return (
      <section
        className={`${repartoPanelClass} space-y-4`}
        data-reparto-component="feasibility-diagnostics"
        data-reparto-tier="department-head"
      >
        <p className="text-sm text-destructive" data-reparto-state="error">
          {planQuery.error instanceof Error
            ? planQuery.error.message
            : dict.planning.feasibility.planUnavailable}
        </p>
      </section>
    );
  }

  return (
    <>
      <FeasibilityDiagnosticsView
        dict={dict}
        diagnosticsError={
          diagnosticsQuery.isError ? diagnosticsQuery.error : undefined
        }
        diagnosticsLoading={diagnosticsQuery.isLoading && diagnosticsExpected}
        evaluateDisabled={plan === null || !processId}
        evaluateDisabledReason={
          plan === null ? dict.planning.feasibility.evaluateDisabledNoPlan : null
        }
        evaluatePending={evaluateMutation.isPending}
        onEvaluate={handleEvaluate}
        state={state}
      />
      <RepartoFormError mapped={mapped} />
    </>
  );
}
