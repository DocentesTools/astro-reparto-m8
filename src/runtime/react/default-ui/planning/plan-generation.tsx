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
import {
  useGenerateRepartoRequirements,
  usePreviewRepartoRequirementGeneration,
  useRepartoTeachingPlan,
  useRepartoTeachingPlanValidations
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
  useMappedError
} from "../process-crud/shared.js";

const GENERATABLE_STATUSES = new Set(["locked", "stale"]);

export function isRequirementGenerationAvailable(
  plan: TeachingPlanPublic | null
): boolean {
  return plan !== null && GENERATABLE_STATUSES.has(plan.status);
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
  plan
}: {
  dict: RepartoDictionary;
  plan: TeachingPlanPublic | null;
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
  const planQuery = useRepartoTeachingPlan(processId);
  const validationsQuery = useRepartoTeachingPlanValidations(processId);
  const previewMutation = usePreviewRepartoRequirementGeneration();
  const generateMutation = useGenerateRepartoRequirements();
  const [mapped, setError, clearError] = useMappedError();
  const [preview, setPreview] = useState<RequirementGenerationPreview | null>(
    null
  );
  const [result, setResult] = useState<RequirementGenerationResult | null>(null);
  const plan = planQuery.data ?? null;
  const canPreview = isRequirementGenerationAvailable(plan);

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
      <PlanLockConfirmation dict={dict} plan={plan} />
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
