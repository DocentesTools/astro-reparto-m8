"use client";

import type { RepartoLocale } from "../../../i18n/index.js";
import {
  buildTeachingPlanCreationState,
  isDuplicateTeachingPlanError
} from "../../../ui/teachingPlan.js";
import {
  useCreateRepartoTeachingPlan,
  useRepartoTeachingPlan
} from "../../hooks.js";
import { repartoFieldCaptionClass, repartoPanelClass } from "../../styles.js";
import { repartoToast } from "../../ui/toast-notification.js";
import {
  ActionButton,
  RepartoFormError,
  RowActions,
  useDict,
  useMappedError,
  useRepartoCanAct
} from "../process-crud/shared.js";

/**
 * The Stage 1 → Stage 2 handoff: create the process's teaching plan.
 *
 * Without this row `/planning` is a dead end — the balance, the validations,
 * the feasibility diagnostics and every activity mutation answer 404, and the
 * page has no control that changes that. The panel therefore appears only
 * while the plan is genuinely absent and disappears once it exists; it is not
 * a permanent header.
 */
export function TeachingPlanCreation({
  locale,
  processId
}: {
  locale?: RepartoLocale;
  processId?: string;
}) {
  const dict = useDict(locale);
  const canAct = useRepartoCanAct("planning");
  const planQuery = useRepartoTeachingPlan(processId);
  const createMutation = useCreateRepartoTeachingPlan();
  const [mapped, setError, clearError] = useMappedError();
  const state = buildTeachingPlanCreationState({
    canAct,
    error: planQuery.isError ? planQuery.error : null,
    isLoading: planQuery.isLoading,
    plan: planQuery.data ?? null
  });

  // Present and pending are both "nothing to say here": the plan exists, or
  // the read has not settled and an empty-state claim would be a guess.
  if (state.presence === "present" || state.presence === "unknown") return null;

  function handleCreate() {
    if (!processId || !state.canCreate || createMutation.isPending) return;
    clearError();
    createMutation.mutate(processId, {
      onSuccess: () => {
        repartoToast.success(dict.planning.creation.success);
      },
      onError: (error) => {
        setError(error);
        // A 409 says the plan already exists — a concurrent operator or a
        // double press. The service's own words are more use than a generic
        // failure, and the refreshed read removes the panel.
        if (isDuplicateTeachingPlanError(error)) {
          repartoToast.error(
            dict.planning.creation.duplicateError,
            error instanceof Error ? error.message : undefined
          );
          void planQuery.refetch?.();
          return;
        }
        repartoToast.error(
          dict.planning.creation.error,
          error instanceof Error ? error.message : undefined
        );
      }
    });
  }

  return (
    <section
      className={`${repartoPanelClass} space-y-3`}
      data-reparto-component="teaching-plan-creation"
      data-teaching-plan-presence={state.presence}
    >
      <header>
        <h2 className="font-semibold">{dict.planning.creation.title}</h2>
        <p className={repartoFieldCaptionClass}>
          {dict.planning.creation.description}
        </p>
      </header>
      {state.presence === "absent" ? (
        <p data-reparto-state="absent" role="status">
          {dict.planning.creation.absent}
        </p>
      ) : (
        <p
          className="text-sm text-destructive"
          data-reparto-state="unavailable"
          role="alert"
        >
          {planQuery.error instanceof Error
            ? planQuery.error.message
            : dict.planning.creation.unavailable}
        </p>
      )}
      {state.blockedReason === "read-only" ? (
        <p className={repartoFieldCaptionClass} data-reparto-state="read-only">
          {dict.planning.creation.readOnly}
        </p>
      ) : null}
      <RepartoFormError mapped={mapped} />
      {state.canCreate ? (
        <RowActions>
          <ActionButton
            action="create-teaching-plan"
            disabled={createMutation.isPending}
            label={dict.planning.creation.action}
            onClick={handleCreate}
          />
        </RowActions>
      ) : null}
      {createMutation.isPending ? (
        <p data-reparto-state="pending" role="status">
          {dict.planning.creation.pending}
        </p>
      ) : null}
    </section>
  );
}
