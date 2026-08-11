"use client";

import { useState } from "react";

import {
  formatRepartoMessage,
  type RepartoDictionary,
  type RepartoLocale
} from "../../../i18n/index.js";
import type {
  PlanValidationReport,
  RequirementGenerationPreview,
  RequirementGenerationResult,
  TeachingPlanPublic
} from "../../../schemas.js";
import { buildTeachingPlanUnlockState } from "../../../ui/teachingPlan.js";
import {
  useGenerateRepartoRequirements,
  useLockRepartoTeachingPlan,
  usePreviewRepartoRequirementGeneration,
  useRepartoTeachingPlan,
  useRepartoTeachingPlanValidations,
  useUnlockRepartoTeachingPlan
} from "../../hooks.js";
import {
  repartoFieldCaptionClass,
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

const GENERATABLE_STATUSES = new Set(["locked", "stale"]);

export function isRequirementGenerationAvailable(
  plan: TeachingPlanPublic | null
): boolean {
  return plan !== null && GENERATABLE_STATUSES.has(plan.status);
}

export function isPlanLockAvailable(
  plan: TeachingPlanPublic | null,
  report: PlanValidationReport | null
): boolean {
  return (
    plan?.status === "balanced" &&
    plan.feasibility_status === "feasible" &&
    report !== null &&
    report.blocking_count === 0
  );
}

export function PlanValidationSummary({
  dict,
  error,
  isLoading,
  report
}: {
  dict: RepartoDictionary;
  error: unknown;
  isLoading: boolean;
  report: PlanValidationReport | null;
}) {
  return (
    <section
      className="space-y-3 rounded-md border border-border/70 p-4"
      data-reparto-slot="plan-lock-validations"
    >
      <header>
        <h3 className="font-semibold">{dict.planning.generation.validationsTitle}</h3>
        <p className={repartoFieldCaptionClass}>
          {dict.planning.generation.validationsDescription}
        </p>
      </header>
      {isLoading ? (
        <p data-reparto-state="loading" role="status">
          {dict.planning.generation.validationsLoading}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" data-reparto-state="error">
          {error instanceof Error
            ? error.message
            : dict.planning.generation.validationsUnavailable}
        </p>
      ) : null}
      {report ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-border/70 p-3">
              <p className={repartoMetricLabelClass}>
                {dict.planning.generation.blocking}
              </p>
              <p
                className={repartoMetricValueLargeClass}
                data-plan-validation-count="blocking"
              >
                {report.blocking_count}
              </p>
            </div>
            <div className="rounded-md border border-border/70 p-3">
              <p className={repartoMetricLabelClass}>
                {dict.planning.generation.warnings}
              </p>
              <p
                className={repartoMetricValueLargeClass}
                data-plan-validation-count="warning"
              >
                {report.warning_count}
              </p>
            </div>
          </div>
          {report.messages.length === 0 ? (
            <p data-reparto-state="valid">
              {dict.planning.generation.noValidations}
            </p>
          ) : (
            <ul className="space-y-2" data-reparto-list="plan-validations">
              {report.messages.map((message, index) => (
                <li
                  className="rounded-md border border-border/70 p-3"
                  data-plan-validation-code={message.code}
                  data-plan-validation-severity={message.severity}
                  key={`${message.code}-${message.entity_id ?? "none"}-${index}`}
                >
                  <p className="font-medium">{message.message}</p>
                  <p className={repartoFieldCaptionClass}>{message.code}</p>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </section>
  );
}

export function PlanLockConfirmation({
  dict,
  isConfirming = false,
  isPending = false,
  onCancel,
  onConfirm,
  onReview,
  plan,
  report
}: {
  dict: RepartoDictionary;
  isConfirming?: boolean;
  isPending?: boolean;
  onCancel?: () => void;
  onConfirm?: () => void;
  onReview?: () => void;
  plan: TeachingPlanPublic | null;
  report?: PlanValidationReport | null;
}) {
  const lockConfirmed =
    plan !== null &&
    ["locked", "requirements_generated", "stale", "reconciliation_required"].includes(
      plan.status
    );

  return (
    <section
      className="space-y-2 rounded-md border border-border/70 p-4"
      data-plan-lock-confirmed={lockConfirmed ? "true" : "false"}
      data-reparto-slot="plan-lock-confirmation"
    >
      <h3 className="font-semibold">{dict.planning.generation.lockTitle}</h3>
      <p>
        {lockConfirmed
          ? dict.planning.generation.lockConfirmed
          : plan?.status === "balanced"
            ? dict.planning.generation.lockReady
            : dict.planning.generation.lockUnavailable}
      </p>
      {plan ? (
        <p
          className={repartoFieldCaptionClass}
          data-teaching-plan-status={plan.status}
        >
          {formatRepartoMessage(dict.planning.generation.planStatus, {
            status: plan.status,
            generation: plan.current_generation_number
          })}
        </p>
      ) : null}
      {!lockConfirmed && plan ? (
        <RowActions>
          <ActionButton
            action="review-plan-lock"
            disabled={!isPlanLockAvailable(plan, report ?? null) || isPending}
            disabledReason={
              report === null || report === undefined
                ? dict.planning.generation.lockDisabledValidations
                : report.blocking_count > 0
                  ? dict.planning.generation.lockDisabledBlocking
                  : plan.feasibility_status !== "feasible"
                    ? dict.planning.generation.lockDisabledFeasibility
                    : plan.status !== "balanced"
                      ? dict.planning.generation.lockDisabledStatus
                      : null
            }
            label={dict.planning.generation.lockAction}
            onClick={onReview}
          />
        </RowActions>
      ) : null}
      {isConfirming && isPlanLockAvailable(plan, report ?? null) ? (
        <section
          aria-labelledby="plan-lock-confirmation-title"
          className="space-y-3 rounded-lg border border-primary/40 bg-muted/30 p-4"
          data-reparto-dialog="plan-lock-confirmation"
          role="alertdialog"
        >
          <h4 className="font-semibold" id="plan-lock-confirmation-title">
            {dict.planning.generation.lockConfirmationTitle}
          </h4>
          <p>{dict.planning.generation.lockConfirmationDescription}</p>
          <RowActions>
            <ActionButton
              action="lock-plan"
              disabled={isPending}
              label={dict.planning.generation.lockConfirmAction}
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
      ) : null}
    </section>
  );
}

/**
 * The way back out of a locked plan (audit finding `S2-04`).
 *
 * Without it locking is a one-way door: every planning mutation refuses a plan
 * outside `draft`/`unbalanced`/`balanced`, and nothing on screen could return
 * it there. The card is not permanent — it appears exactly while the plan says
 * an unlock is required, which is every non-mutable status, and says so even
 * for the statuses the served endpoint refuses. In those the operator is told
 * where the real way forward is instead of being handed a button that answers
 * 409.
 */
export function PlanUnlockControl({
  dict,
  isPending = false,
  onUnlock,
  plan
}: {
  dict: RepartoDictionary;
  isPending?: boolean;
  onUnlock?: () => void;
  plan: TeachingPlanPublic | null;
}) {
  // Read from the signed-in session, never from a prop (§21.5): a capability a
  // caller can pass in is a capability disconnected from the session holding it.
  const canAct = useRepartoCanAct("planning");
  const state = buildTeachingPlanUnlockState({ canAct, plan });
  if (!state.requiresUnlock) return null;

  return (
    <section
      className="space-y-2 rounded-md border border-border/70 p-4"
      data-reparto-slot="plan-unlock"
      data-teaching-plan-status={plan?.status}
    >
      <h3 className="font-semibold">{dict.planning.generation.unlockTitle}</h3>
      {/* §20.14 states the requirement; it is not an error that anything went
          wrong, so it announces itself as status. */}
      <p data-reparto-state="unlock-required" role="status">
        {dict.planning.generation.unlockRequired}
      </p>
      {state.blockedReason === "generation-owned" ? (
        <p
          className={repartoFieldCaptionClass}
          data-reparto-state="generation-owned"
        >
          {dict.planning.generation.unlockBlockedGeneration}
        </p>
      ) : null}
      {state.blockedReason === "read-only" ? (
        <p className={repartoFieldCaptionClass} data-reparto-state="read-only">
          {dict.planning.generation.unlockReadOnly}
        </p>
      ) : null}
      {state.canUnlock ? (
        <>
          <p
            className={repartoFieldCaptionClass}
            data-reparto-slot="plan-unlock-consequence"
          >
            {dict.planning.generation.unlockConsequence}
          </p>
          <RowActions>
            <ActionButton
              action="unlock-plan"
              disabled={isPending}
              label={dict.planning.generation.unlockAction}
              onClick={onUnlock}
            />
          </RowActions>
        </>
      ) : null}
      {isPending ? (
        <p data-reparto-state="unlock-pending" role="status">
          {dict.planning.generation.unlockPending}
        </p>
      ) : null}
    </section>
  );
}

export function RequirementGenerationPreviewCard({
  dict,
  isPending,
  onCancel,
  onConfirm,
  preview
}: {
  dict: RepartoDictionary;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  preview: RequirementGenerationPreview;
}) {
  return (
    <section
      aria-labelledby="requirement-generation-confirmation-title"
      className="space-y-3 rounded-lg border border-primary/40 bg-muted/30 p-4"
      data-reparto-dialog="requirement-generation-confirmation"
      role="alertdialog"
    >
      <h3
        className="font-semibold"
        id="requirement-generation-confirmation-title"
      >
        {dict.planning.generation.previewTitle}
      </h3>
      <p>
        {formatRepartoMessage(dict.planning.generation.previewSummary, {
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
              {dict.planning.generation.previewMetric[kind]}
            </p>
            <p
              className={repartoMetricValueLargeClass}
              data-generation-preview-count={kind}
            >
              {count}
            </p>
          </div>
        ))}
      </div>
      {preview.requires_reconciliation ? (
        <p
          className="text-sm text-destructive"
          data-reparto-state="reconciliation-required"
        >
          {dict.planning.generation.reconciliationRequired}
        </p>
      ) : null}
      {preview.is_noop ? (
        <p data-reparto-state="noop">{dict.planning.generation.noChanges}</p>
      ) : null}
      <RowActions>
        <ActionButton
          action="generate-requirements"
          disabled={isPending || preview.requires_reconciliation}
          disabledReason={
            preview.requires_reconciliation
              ? dict.planning.generation.reconciliationRequired
              : null
          }
          label={dict.planning.generation.confirmAction}
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

export function RequirementGenerationResultCard({
  dict,
  result
}: {
  dict: RepartoDictionary;
  result: RequirementGenerationResult;
}) {
  return (
    <section
      className="space-y-3 rounded-md border border-emerald-400/50 bg-emerald-50/40 p-4"
      data-generation-number={result.generation_number}
      data-reparto-slot="requirement-generation-result"
      role="status"
    >
      <h3 className="font-semibold">{dict.planning.generation.resultTitle}</h3>
      <p>
        {formatRepartoMessage(dict.planning.generation.resultSummary, {
          generation: result.generation_number,
          created: result.created_count,
          preserved: result.preserved_count,
          retired: result.retired_count,
          count: result.count
        })}
      </p>
      <p
        className={repartoMetricValueLargeClass}
        data-generated-slot-count={result.count}
      >
        {result.count}
      </p>
      <p className={repartoMetricLabelClass}>
        {dict.planning.generation.totalSlots}
      </p>
    </section>
  );
}

export function PlanLockAndRequirementGeneration({
  locale,
  processId
}: {
  locale?: RepartoLocale;
  processId?: string;
}) {
  const dict = useDict(locale);
  const canAct = useRepartoCanAct("planning");
  const planQuery = useRepartoTeachingPlan(processId);
  const validationsQuery = useRepartoTeachingPlanValidations(processId);
  const lockMutation = useLockRepartoTeachingPlan();
  const unlockMutation = useUnlockRepartoTeachingPlan();
  const previewMutation = usePreviewRepartoRequirementGeneration();
  const generateMutation = useGenerateRepartoRequirements();
  const [mapped, setError, clearError] = useMappedError();
  const [preview, setPreview] = useState<RequirementGenerationPreview | null>(
    null
  );
  const [result, setResult] = useState<RequirementGenerationResult | null>(null);
  const [isLockConfirming, setIsLockConfirming] = useState(false);
  const [lockedPlan, setLockedPlan] = useState<TeachingPlanPublic | null>(null);
  const observedPlan = planQuery.data ?? null;
  const plan =
    lockedPlan && (!observedPlan || observedPlan.status === "balanced")
      ? lockedPlan
      : observedPlan;
  const canPreview = isRequirementGenerationAvailable(plan);

  function handleLock() {
    if (
      !processId ||
      !isPlanLockAvailable(plan, validationsQuery.data ?? null) ||
      lockMutation.isPending
    ) {
      return;
    }
    clearError();
    lockMutation.mutate(processId, {
      onSuccess: (nextPlan) => {
        setLockedPlan(nextPlan);
        setIsLockConfirming(false);
        repartoToast.success(dict.planning.generation.lockSuccess);
      },
      onError: (error) => {
        setError(error);
        repartoToast.error(
          dict.planning.generation.lockError,
          error instanceof Error ? error.message : undefined
        );
      }
    });
  }

  function handleUnlock() {
    if (!processId || !canAct || unlockMutation.isPending) return;
    clearError();
    unlockMutation.mutate(processId, {
      onSuccess: () => {
        // The locally remembered lock is what the panel shows while the plan
        // read catches up; keeping it after an unlock would leave the card
        // claiming a lock the service has just cleared.
        setLockedPlan(null);
        setIsLockConfirming(false);
        repartoToast.success(dict.planning.generation.unlockSuccess);
      },
      onError: (error) => {
        setError(error);
        repartoToast.error(
          dict.planning.generation.unlockError,
          error instanceof Error ? error.message : undefined
        );
      }
    });
  }

  function handlePreview() {
    if (!processId || !canPreview || previewMutation.isPending) return;
    clearError();
    setResult(null);
    previewMutation.mutate(processId, {
      onSuccess: setPreview,
      onError: (error) => {
        setError(error);
        repartoToast.error(
          dict.planning.generation.previewError,
          error instanceof Error ? error.message : undefined
        );
      }
    });
  }

  function handleGenerate() {
    if (
      !processId ||
      !preview ||
      preview.requires_reconciliation ||
      generateMutation.isPending
    ) {
      return;
    }
    clearError();
    generateMutation.mutate(processId, {
      onSuccess: (nextResult) => {
        setResult(nextResult);
        setPreview(null);
        repartoToast.success(
          formatRepartoMessage(dict.planning.generation.success, {
            count: nextResult.count
          })
        );
      },
      onError: (error) => {
        setError(error);
        repartoToast.error(
          dict.planning.generation.generateError,
          error instanceof Error ? error.message : undefined
        );
      }
    });
  }

  return (
    <section
      className={`${repartoPanelClass} space-y-4`}
      data-reparto-component="plan-lock-requirement-generation"
    >
      <header>
        <h2 className="font-semibold">{dict.planning.generation.title}</h2>
        <p className={repartoFieldCaptionClass}>
          {dict.planning.generation.description}
        </p>
      </header>
      {planQuery.isLoading ? (
        <p data-reparto-state="loading" role="status">
          {dict.planning.generation.planLoading}
        </p>
      ) : null}
      {planQuery.isError ? (
        <p className="text-sm text-destructive" data-reparto-state="error">
          {planQuery.error instanceof Error
            ? planQuery.error.message
            : dict.planning.generation.planUnavailable}
        </p>
      ) : null}
      <PlanValidationSummary
        dict={dict}
        error={validationsQuery.isError ? validationsQuery.error : null}
        isLoading={validationsQuery.isLoading}
        report={validationsQuery.data ?? null}
      />
      <PlanLockConfirmation
        dict={dict}
        isConfirming={isLockConfirming}
        isPending={lockMutation.isPending}
        onCancel={() => setIsLockConfirming(false)}
        onConfirm={handleLock}
        onReview={() => setIsLockConfirming(true)}
        plan={plan}
        report={validationsQuery.data ?? null}
      />
      <PlanUnlockControl
        dict={dict}
        isPending={unlockMutation.isPending}
        onUnlock={handleUnlock}
        plan={plan}
      />
      <RepartoFormError mapped={mapped} />
      {result ? (
        <RequirementGenerationResultCard dict={dict} result={result} />
      ) : null}
      <RowActions>
        <ActionButton
          action="preview-requirement-generation"
          disabled={
            planQuery.isLoading ||
            planQuery.isError ||
            previewMutation.isPending ||
            !canPreview
          }
          disabledReason={
            !canPreview ? dict.planning.generation.previewDisabled : null
          }
          label={dict.planning.generation.previewAction}
          onClick={handlePreview}
        />
      </RowActions>
      {preview ? (
        <RequirementGenerationPreviewCard
          dict={dict}
          isPending={generateMutation.isPending}
          onCancel={() => setPreview(null)}
          onConfirm={handleGenerate}
          preview={preview}
        />
      ) : null}
    </section>
  );
}
