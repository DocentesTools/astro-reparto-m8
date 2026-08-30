"use client";

import { useMemo, useState } from "react";

import { compareHours, parseHoursField } from "../../../decimals.js";
import { RepartoApiError } from "../../../errors.js";
import {
  formatRepartoMessage,
  type RepartoDictionary,
  type RepartoLocale
} from "../../../i18n/index.js";
import type {
  DepartmentHourAllocationRevisionCreateInput,
  DepartmentHourAllocationRevisionPublic,
  DepartmentHourAllocationSource,
  RequirementReconciliationPreview,
  RequirementReconciliationResult,
  SubjectPublic,
  TeachingActivityPublic,
  TeachingPlanPublic
} from "../../../schemas.js";
import {
  useCreateRepartoAllocationRevision,
  usePreviewRepartoRequirementReconciliation,
  useReconcileRepartoRequirements,
  useRepartoAllocationRevisions,
  useRepartoSubjects,
  useRepartoTeachingActivities,
  useRepartoTeachingPlan
} from "../../hooks.js";
import {
  repartoFieldCaptionClass,
  repartoFieldLabelClass,
  repartoInputClass,
  repartoMetricLabelClass,
  repartoMetricValueLargeClass,
  repartoPanelClass
} from "../../styles.js";
import { repartoToast } from "../../ui/toast-notification.js";
import {
  ActionButton,
  RepartoFormError,
  RowActions,
  useDict,
  useMappedError,
  useRepartoCanAct
} from "../process-crud/shared.js";
import {
  PlanningPanelGate,
  type PlanningPanelProps
} from "./panel-gate.js";

export type AllocationRevisionFormValues = {
  allocatedHours: string;
  reason: string;
  source: DepartmentHourAllocationSource;
  sourceReference: string;
};

type AllocationRevisionFormErrorKey =
  | "allocatedHours"
  | "reason"
  | "sourceReference";

export type AllocationRevisionFormResult =
  | { ok: true; request: DepartmentHourAllocationRevisionCreateInput }
  | {
      ok: false;
      errors: Partial<Record<AllocationRevisionFormErrorKey, string>>;
    };

const EMPTY_ALLOCATION_FORM: AllocationRevisionFormValues = {
  allocatedHours: "",
  reason: "",
  source: "manual_transcription",
  sourceReference: ""
};

const RECONCILABLE_STATUSES = new Set(["stale", "reconciliation_required"]);

export function isAllocationReconciliationAvailable(
  plan: TeachingPlanPublic | null
): boolean {
  return plan !== null && RECONCILABLE_STATUSES.has(plan.status);
}

export function isStaleRequirementReconciliationError(
  error: unknown
): boolean {
  return error instanceof RepartoApiError && error.status === 409;
}

export function buildAllocationRevisionRequest(
  values: AllocationRevisionFormValues,
  dict: RepartoDictionary
): AllocationRevisionFormResult {
  const errors: Partial<Record<AllocationRevisionFormErrorKey, string>> = {};
  const hours = parseHoursField(values.allocatedHours);
  const reason = values.reason.trim();
  const sourceReference = values.sourceReference.trim();

  if (hours.state !== "valid") {
    errors.allocatedHours =
      hours.state === "unset"
        ? dict.error.required
        : dict.planning.reconciliation.hoursError[hours.reason];
  } else if (compareHours(hours.hours, "0.00") <= 0) {
    errors.allocatedHours = dict.planning.reconciliation.positiveHoursError;
  }
  if (!reason) errors.reason = dict.error.required;
  if (reason.length > 500) {
    errors.reason = dict.planning.reconciliation.allocationReasonError;
  }
  if (sourceReference.length > 500) {
    errors.sourceReference =
      dict.planning.reconciliation.sourceReferenceError;
  }
  if (Object.keys(errors).length > 0 || hours.state !== "valid") {
    return { ok: false, errors };
  }

  return {
    ok: true,
    request: {
      allocated_group_weekly_hours: hours.hours,
      reason,
      source: values.source,
      source_reference: sourceReference || null
    }
  };
}

function LocalError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <span
      className="text-xs text-destructive"
      data-reparto-slot="field-error"
      role="alert"
    >
      {message}
    </span>
  );
}

function AllocationRevisionForm({
  dict,
  errors,
  isPending,
  onCancel,
  onChange,
  onSubmit,
  values
}: {
  dict: RepartoDictionary;
  errors: Partial<Record<AllocationRevisionFormErrorKey, string>>;
  isPending: boolean;
  onCancel: () => void;
  onChange: (values: AllocationRevisionFormValues) => void;
  onSubmit: (event: { preventDefault: () => void }) => void;
  values: AllocationRevisionFormValues;
}) {
  return (
    <form
      className="space-y-4 rounded-md border border-border/70 p-4"
      data-reparto-form="allocation-revision"
      onSubmit={onSubmit}
    >
      <h3 className="font-semibold">
        {dict.planning.reconciliation.allocationFormTitle}
      </h3>
      <p className={repartoFieldCaptionClass}>
        {dict.planning.reconciliation.allocationFormDescription}
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <label className={repartoFieldLabelClass}>
          {dict.planning.reconciliation.allocatedHours}
          <input
            aria-invalid={errors.allocatedHours ? true : undefined}
            className={repartoInputClass}
            data-reparto-field="allocated_group_weekly_hours"
            inputMode="decimal"
            onChange={(event: { target: { value: string } }) =>
              onChange({ ...values, allocatedHours: event.target.value })
            }
            value={values.allocatedHours}
          />
          <LocalError message={errors.allocatedHours} />
        </label>
        <label className={repartoFieldLabelClass}>
          {dict.planning.reconciliation.source}
          <select
            className={repartoInputClass}
            data-reparto-field="source"
            onChange={(event: { target: { value: string } }) =>
              onChange({
                ...values,
                source: event.target.value as DepartmentHourAllocationSource
              })
            }
            value={values.source}
          >
            {(
              [
                "manual_transcription",
                "file_import",
                "copied_draft",
                "other"
              ] as const
            ).map((source) => (
              <option key={source} value={source}>
                {dict.planning.reconciliation.sourceOption[source]}
              </option>
            ))}
          </select>
        </label>
        <label className={repartoFieldLabelClass}>
          {dict.planning.reconciliation.sourceReference}
          <input
            aria-invalid={errors.sourceReference ? true : undefined}
            className={repartoInputClass}
            data-reparto-field="source_reference"
            maxLength={500}
            onChange={(event: { target: { value: string } }) =>
              onChange({ ...values, sourceReference: event.target.value })
            }
            value={values.sourceReference}
          />
          <LocalError message={errors.sourceReference} />
        </label>
        <label className={repartoFieldLabelClass}>
          {dict.planning.reconciliation.allocationReason}
          <textarea
            aria-invalid={errors.reason ? true : undefined}
            className={repartoInputClass}
            data-reparto-field="reason"
            maxLength={500}
            onChange={(event: { target: { value: string } }) =>
              onChange({ ...values, reason: event.target.value })
            }
            rows={3}
            value={values.reason}
          />
          <LocalError message={errors.reason} />
        </label>
      </div>
      <RowActions>
        <ActionButton
          action="create-allocation-revision"
          disabled={isPending}
          label={dict.planning.reconciliation.recordAllocationAction}
          type="submit"
        />
        <ActionButton
          action="cancel"
          disabled={isPending}
          label={dict.action.cancel}
          onClick={onCancel}
        />
      </RowActions>
    </form>
  );
}

export function AllocationRevisionHistory({
  dict,
  isLoading,
  revisions
}: {
  dict: RepartoDictionary;
  isLoading: boolean;
  revisions: DepartmentHourAllocationRevisionPublic[];
}) {
  const current = revisions.find((revision) => revision.superseded_at === null);

  return (
    <section
      className="space-y-3 rounded-md border border-border/70 p-4"
      data-reparto-slot="allocation-revision-history"
    >
      <h3 className="font-semibold">
        {dict.planning.reconciliation.allocationHistoryTitle}
      </h3>
      {isLoading ? (
        <p data-reparto-state="loading" role="status">
          {dict.planning.reconciliation.allocationLoading}
        </p>
      ) : revisions.length === 0 ? (
        <p data-reparto-state="empty">
          {dict.planning.reconciliation.noAllocation}
        </p>
      ) : (
        <>
          {current ? (
            <p
              data-allocation-revision={current.revision_number}
              data-reparto-state="current-allocation"
            >
              {formatRepartoMessage(
                dict.planning.reconciliation.currentAllocation,
                {
                  revision: current.revision_number,
                  hours: current.allocated_group_weekly_hours
                }
              )}
            </p>
          ) : null}
          <div className="overflow-x-auto">
            <table
              className="w-full border-collapse text-left text-sm"
              data-reparto-table="allocation-revisions"
            >
              <thead>
                <tr>
                  <th className="border-b p-2">
                    {dict.planning.reconciliation.revision}
                  </th>
                  <th className="border-b p-2">
                    {dict.planning.reconciliation.allocatedHours}
                  </th>
                  <th className="border-b p-2">
                    {dict.planning.reconciliation.allocationReason}
                  </th>
                  <th className="border-b p-2">
                    {dict.planning.reconciliation.state}
                  </th>
                </tr>
              </thead>
              <tbody>
                {revisions.map((revision) => (
                  <tr
                    data-allocation-revision={revision.revision_number}
                    data-reparto-row="allocation-revision"
                    key={revision.id}
                  >
                    <td className="border-b p-2">{revision.revision_number}</td>
                    <td className="border-b p-2">
                      {revision.allocated_group_weekly_hours}
                    </td>
                    <td className="border-b p-2">{revision.reason}</td>
                    <td className="border-b p-2">
                      {revision.superseded_at
                        ? dict.planning.reconciliation.superseded
                        : dict.planning.reconciliation.current}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={repartoFieldCaptionClass}>
            {dict.planning.reconciliation.historyPreserved}
          </p>
        </>
      )}
    </section>
  );
}

export function ReconciliationStatusCard({
  dict,
  plan
}: {
  dict: RepartoDictionary;
  plan: TeachingPlanPublic | null;
}) {
  const stale = isAllocationReconciliationAvailable(plan);
  return (
    <section
      className="space-y-2 rounded-md border border-border/70 p-4"
      data-reparto-slot="allocation-reconciliation-status"
      data-reparto-state={stale ? "stale" : "current"}
    >
      <h3 className="font-semibold">
        {dict.planning.reconciliation.statusTitle}
      </h3>
      <p>
        {stale
          ? dict.planning.reconciliation.staleState
          : dict.planning.reconciliation.currentState}
      </p>
      {plan ? (
        <p className={repartoFieldCaptionClass} data-teaching-plan-status={plan.status}>
          {formatRepartoMessage(dict.planning.reconciliation.planStatus, {
            status: plan.status,
            generation: plan.current_generation_number
          })}
        </p>
      ) : null}
      {stale ? (
        <p data-reparto-state="assignments-preserved">
          {dict.planning.reconciliation.assignmentsPreserved}
        </p>
      ) : null}
    </section>
  );
}

export type ReconciliationConflictRow = {
  requirementId: string;
  activityLabel: string;
  position: number;
  currentHours: string;
  newHours: string | null;
  resolution: "value_changed" | "removed";
};

export function buildReconciliationConflictRows(
  preview: RequirementReconciliationPreview,
  activities: TeachingActivityPublic[],
  subjects: SubjectPublic[],
  unknownActivity: string
): ReconciliationConflictRow[] {
  const subjectNames = new Map(
    subjects.map((subject) => [subject.id, subject.name])
  );
  const activityNames = new Map(
    activities.map((activity) => [
      activity.id,
      subjectNames.get(activity.subject_id) ?? unknownActivity
    ])
  );
  return preview.conflicts.map((conflict) => ({
    requirementId: conflict.requirement_id,
    activityLabel:
      activityNames.get(conflict.teaching_activity_id) ?? unknownActivity,
    position: conflict.position_index + 1,
    currentHours: conflict.current_required_teacher_hours,
    newHours: conflict.new_required_teacher_hours,
    resolution: conflict.resolution
  }));
}

export function RequirementReconciliationPreviewCard({
  activities,
  dict,
  isPending,
  onCancel,
  onConfirm,
  onReasonChange,
  preview,
  reason,
  subjects
}: {
  activities: TeachingActivityPublic[];
  dict: RepartoDictionary;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  onReasonChange: (reason: string) => void;
  preview: RequirementReconciliationPreview;
  reason: string;
  subjects: SubjectPublic[];
}) {
  const rows = buildReconciliationConflictRows(
    preview,
    activities,
    subjects,
    dict.planning.reconciliation.unknownActivity
  );
  const missingReason = !reason.trim();

  return (
    <section
      aria-labelledby="requirement-reconciliation-confirmation-title"
      className="space-y-4 rounded-lg border border-primary/40 bg-muted/30 p-4"
      data-reparto-dialog="requirement-reconciliation-confirmation"
      role="alertdialog"
    >
      <h3
        className="font-semibold"
        id="requirement-reconciliation-confirmation-title"
      >
        {dict.planning.reconciliation.previewTitle}
      </h3>
      <p>
        {formatRepartoMessage(dict.planning.reconciliation.previewSummary, {
          generation: preview.next_generation_number,
          create: preview.create_count,
          preserve: preview.preserve_count,
          retire: preview.retire_count,
          conflicts: preview.conflict_count
        })}
      </p>
      <div className="grid gap-3 sm:grid-cols-4">
        {(
          [
            ["create", preview.create_count],
            ["preserve", preview.preserve_count],
            ["retire", preview.retire_count],
            ["conflict", preview.conflict_count]
          ] as const
        ).map(([kind, count]) => (
          <div className="rounded-md border border-border/70 p-3" key={kind}>
            <p className={repartoMetricLabelClass}>
              {dict.planning.reconciliation.previewMetric[kind]}
            </p>
            <p
              className={repartoMetricValueLargeClass}
              data-reconciliation-preview-count={kind}
            >
              {count}
            </p>
          </div>
        ))}
      </div>
      <p data-reparto-state="assignments-preserved">
        {formatRepartoMessage(
          dict.planning.reconciliation.preservedRequirements,
          { count: preview.preserve_count }
        )}
      </p>
      {rows.length > 0 ? (
        <div className="overflow-x-auto">
          <table
            className="w-full border-collapse text-left text-sm"
            data-reparto-table="reconciliation-conflicts"
          >
            <thead>
              <tr>
                <th className="border-b p-2">
                  {dict.planning.reconciliation.activity}
                </th>
                <th className="border-b p-2">
                  {dict.planning.reconciliation.position}
                </th>
                <th className="border-b p-2">
                  {dict.planning.reconciliation.hoursChange}
                </th>
                <th className="border-b p-2">
                  {dict.planning.reconciliation.manualAction}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  data-reparto-requirement-id={row.requirementId}
                  data-reparto-resolution={row.resolution}
                  data-reparto-row="reconciliation-conflict"
                  key={row.requirementId}
                >
                  <td className="border-b p-2">{row.activityLabel}</td>
                  <td className="border-b p-2">{row.position}</td>
                  <td className="border-b p-2">
                    {row.newHours === null
                      ? formatRepartoMessage(
                          dict.planning.reconciliation.hoursRemoved,
                          { current: row.currentHours }
                        )
                      : formatRepartoMessage(
                          dict.planning.reconciliation.hoursChanged,
                          { current: row.currentHours, next: row.newHours }
                        )}
                  </td>
                  <td
                    className="border-b p-2"
                    data-reparto-manual-action={
                      row.resolution === "value_changed"
                        ? "release-and-replace"
                        : "release-and-retire"
                    }
                  >
                    {dict.planning.reconciliation.resolution[row.resolution]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p data-reparto-state="no-conflicts">
          {dict.planning.reconciliation.noConflicts}
        </p>
      )}
      {preview.is_noop ? (
        <p data-reparto-state="noop">
          {dict.planning.reconciliation.noChanges}
        </p>
      ) : null}
      <label className={repartoFieldLabelClass}>
        {dict.planning.reconciliation.reconciliationReason}
        <textarea
          aria-invalid={missingReason ? true : undefined}
          className={repartoInputClass}
          data-reparto-field="reconciliation_reason"
          maxLength={1000}
          onChange={(event: { target: { value: string } }) =>
            onReasonChange(event.target.value)
          }
          rows={3}
          value={reason}
        />
        {missingReason ? <LocalError message={dict.error.required} /> : null}
      </label>
      <p className={repartoFieldCaptionClass}>
        {dict.planning.reconciliation.confirmationWarning}
      </p>
      <RowActions>
        <ActionButton
          action="reconcile-requirements"
          disabled={isPending || missingReason}
          disabledReason={missingReason ? dict.error.required : null}
          label={dict.planning.reconciliation.confirmAction}
          onClick={onConfirm}
        />
        <ActionButton
          action="cancel"
          disabled={isPending}
          label={dict.action.cancel}
          onClick={onCancel}
        />
      </RowActions>
    </section>
  );
}

export function RequirementReconciliationResultCard({
  dict,
  result
}: {
  dict: RepartoDictionary;
  result: RequirementReconciliationResult;
}) {
  return (
    <section
      className="space-y-3 rounded-md border border-emerald-400/50 bg-emerald-50/40 p-4"
      data-generation-number={result.generation_number}
      data-reparto-slot="requirement-reconciliation-result"
      role="status"
    >
      <h3 className="font-semibold">
        {dict.planning.reconciliation.resultTitle}
      </h3>
      <p>
        {formatRepartoMessage(dict.planning.reconciliation.resultSummary, {
          generation: result.generation_number,
          resolved: result.resolved_count,
          released: result.released_assignment_ids.length,
          created: result.created_count,
          preserved: result.preserved_count,
          retired: result.retired_count,
          count: result.count
        })}
      </p>
      <p
        className={repartoMetricValueLargeClass}
        data-reconciled-live-slot-count={result.count}
      >
        {result.count}
      </p>
      <p className={repartoMetricLabelClass}>
        {dict.planning.reconciliation.liveSlots}
      </p>
    </section>
  );
}

/**
 * The leadership allocation itself: its immutable history and the form that
 * records the next revision (audit finding `S2-06`).
 *
 * Recording the **first** revision is §8.2 step 2 — a Stage 1 act — and it lived
 * only inside `AllocationChangeReconciliation` on `/planning`, titled and framed
 * as reconciling a *change*. The form always worked; an operator finishing
 * Stage 1 simply had no reason to open a Stage 2 page to enter the number Stage
 * 2 balances against. So the panel moved here and is mounted twice, with one
 * implementation: `/allocation` frames it as Stage 1, and the reconciliation
 * panel keeps it in place as the first step of resolving a change.
 *
 * The `admin` floor is read from the `allocation` route inside the component
 * (§21.5) rather than taken as a prop, so a headless host mounting it directly
 * still gets it. Both mount points carry the same floor, and recording a
 * revision is the same act on either.
 */
export function LeadershipAllocationPanel({
  locale,
  onRecorded,
  processId,
  variant = "route"
}: {
  locale?: RepartoLocale;
  /** Lets the reconciliation panel drop a preview the new revision invalidated. */
  onRecorded?: () => void;
  processId?: string;
  variant?: "route" | "embedded";
}) {
  const dict = useDict(locale);
  const canAct = useRepartoCanAct("allocation");
  const revisionsQuery = useRepartoAllocationRevisions(processId);
  const createRevision = useCreateRepartoAllocationRevision();
  const [mapped, setError, clearError] = useMappedError();
  const [isAllocationFormOpen, setIsAllocationFormOpen] = useState(false);
  const [allocationValues, setAllocationValues] = useState(
    EMPTY_ALLOCATION_FORM
  );
  const [allocationErrors, setAllocationErrors] = useState<
    Partial<Record<AllocationRevisionFormErrorKey, string>>
  >({});
  const revisions = useMemo(
    () => revisionsQuery.data?.data ?? [],
    [revisionsQuery.data]
  );

  function handleAllocationSubmit(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (!processId || createRevision.isPending) return;
    const built = buildAllocationRevisionRequest(allocationValues, dict);
    if (!built.ok) {
      setAllocationErrors(built.errors);
      return;
    }
    clearError();
    setAllocationErrors({});
    createRevision.mutate(
      { processId, body: built.request },
      {
        onSuccess: () => {
          setAllocationValues(EMPTY_ALLOCATION_FORM);
          setIsAllocationFormOpen(false);
          onRecorded?.();
          repartoToast.success(
            dict.planning.reconciliation.allocationRecorded
          );
        },
        onError: (error) => {
          setError(error);
          repartoToast.error(
            dict.planning.reconciliation.allocationError,
            error instanceof Error ? error.message : undefined
          );
        }
      }
    );
  }

  const body = (
    <>
      <AllocationRevisionHistory
        dict={dict}
        isLoading={revisionsQuery.isLoading}
        revisions={revisions}
      />
      {revisionsQuery.isError ? (
        <p className="text-sm text-destructive" data-reparto-state="error">
          {revisionsQuery.error instanceof Error
            ? revisionsQuery.error.message
            : dict.planning.reconciliation.allocationUnavailable}
        </p>
      ) : null}
      {canAct ? (
        <RowActions>
          <ActionButton
            action="record-allocation-revision"
            disabled={createRevision.isPending}
            label={dict.planning.reconciliation.recordAllocationAction}
            onClick={() => setIsAllocationFormOpen(true)}
          />
        </RowActions>
      ) : (
        <p className={repartoFieldCaptionClass} data-reparto-state="read-only">
          {dict.allocation.readOnly}
        </p>
      )}
      {canAct && isAllocationFormOpen ? (
        <AllocationRevisionForm
          dict={dict}
          errors={allocationErrors}
          isPending={createRevision.isPending}
          onCancel={() => {
            setIsAllocationFormOpen(false);
            setAllocationErrors({});
          }}
          onChange={setAllocationValues}
          onSubmit={handleAllocationSubmit}
          values={allocationValues}
        />
      ) : null}
      <RepartoFormError mapped={mapped} />
    </>
  );

  if (variant === "embedded") return body;

  return (
    <section
      className={`${repartoPanelClass} space-y-4`}
      data-reparto-component="leadership-allocation"
    >
      <header>
        <h2 className="font-semibold">{dict.allocation.panelTitle}</h2>
        <p className={repartoFieldCaptionClass}>
          {dict.allocation.panelDescription}
        </p>
      </header>
      {body}
    </section>
  );
}

/** Record an allocation revision and reconcile the requirements it staled. */
export function AllocationChangeReconciliation(props: PlanningPanelProps) {
  return (
    <PlanningPanelGate>
      <AllocationChangeReconciliationBody {...props} />
    </PlanningPanelGate>
  );
}

function AllocationChangeReconciliationBody({ locale, processId }: PlanningPanelProps) {
  const dict = useDict(locale);
  const planQuery = useRepartoTeachingPlan(processId);
  const activitiesQuery = useRepartoTeachingActivities(processId);
  const subjectsQuery = useRepartoSubjects(processId);
  const previewReconciliation = usePreviewRepartoRequirementReconciliation();
  const reconcileRequirements = useReconcileRepartoRequirements();
  const [mapped, setError, clearError] = useMappedError();
  const [preview, setPreview] =
    useState<RequirementReconciliationPreview | null>(null);
  const [reason, setReason] = useState("");
  const [result, setResult] =
    useState<RequirementReconciliationResult | null>(null);
  const plan = planQuery.data ?? null;
  const canReconcile = isAllocationReconciliationAvailable(plan);

  function handlePreview() {
    if (!processId || !canReconcile || previewReconciliation.isPending) return;
    clearError();
    setResult(null);
    previewReconciliation.mutate(processId, {
      onSuccess: (nextPreview) => {
        setPreview(nextPreview);
        setReason("");
      },
      onError: (error) => {
        setError(error);
        repartoToast.error(
          dict.planning.reconciliation.previewError,
          error instanceof Error ? error.message : undefined
        );
      }
    });
  }

  function handleReconcile() {
    if (
      !processId ||
      !preview ||
      !reason.trim() ||
      reconcileRequirements.isPending
    ) {
      return;
    }
    clearError();
    reconcileRequirements.mutate(
      {
        processId,
        body: {
          reason,
          expected_conflict_count: preview.conflict_count
        }
      },
      {
        onSuccess: (nextResult) => {
          setResult(nextResult);
          setPreview(null);
          setReason("");
          repartoToast.success(
            formatRepartoMessage(dict.planning.reconciliation.success, {
              count: nextResult.resolved_count
            })
          );
        },
        onError: (error) => {
          if (isStaleRequirementReconciliationError(error)) {
            setPreview(null);
            setReason("");
            repartoToast.error(
              dict.planning.reconciliation.stalePreviewError
            );
          } else {
            repartoToast.error(
              dict.planning.reconciliation.reconcileError,
              error instanceof Error ? error.message : undefined
            );
          }
          setError(error);
        }
      }
    );
  }

  return (
    <section
      className={`${repartoPanelClass} space-y-4`}
      data-reparto-component="allocation-change-reconciliation"
    >
      <header>
        <h2 className="font-semibold">
          {dict.planning.reconciliation.title}
        </h2>
        <p className={repartoFieldCaptionClass}>
          {dict.planning.reconciliation.description}
        </p>
      </header>
      <ReconciliationStatusCard dict={dict} plan={plan} />
      {/*
        The same panel the `/allocation` route mounts, embedded: recording a
        revision is the first step of resolving a change as much as it is §8.2
        step 2, and two implementations of one form would drift.
      */}
      <LeadershipAllocationPanel
        locale={locale}
        onRecorded={() => {
          setPreview(null);
          setResult(null);
        }}
        processId={processId}
        variant="embedded"
      />
      <RepartoFormError mapped={mapped} />
      {result ? (
        <RequirementReconciliationResultCard dict={dict} result={result} />
      ) : null}
      <RowActions>
        <ActionButton
          action="preview-requirement-reconciliation"
          disabled={
            planQuery.isLoading ||
            planQuery.isError ||
            previewReconciliation.isPending ||
            !canReconcile
          }
          disabledReason={
            !canReconcile
              ? dict.planning.reconciliation.previewDisabled
              : null
          }
          label={dict.planning.reconciliation.previewAction}
          onClick={handlePreview}
        />
      </RowActions>
      {preview ? (
        <RequirementReconciliationPreviewCard
          activities={activitiesQuery.data?.data ?? []}
          dict={dict}
          isPending={reconcileRequirements.isPending}
          onCancel={() => {
            setPreview(null);
            setReason("");
          }}
          onConfirm={handleReconcile}
          onReasonChange={setReason}
          preview={preview}
          reason={reason}
          subjects={subjectsQuery.data?.data ?? []}
        />
      ) : null}
    </section>
  );
}
