"use client";

import { useState } from "react";

import type { RepartoLocale } from "../../../../i18n/index.js";
import {
  buildProcessReopenRequest,
  buildProcessReopenState,
  PROCESS_REOPEN_REASON_MAX_LENGTH,
  type ProcessReopenReasonError
} from "../../../../ui/processSettings.js";
import {
  useReopenRepartoProcess,
  useRepartoProcess
} from "../../../hooks.js";
import {
  repartoFieldCaptionClass,
  repartoFieldLabelClass,
  repartoInputClass,
  repartoPanelClass
} from "../../../styles.js";
import { repartoToast } from "../../../ui/toast-notification.js";
import {
  ActionButton,
  RepartoFormError,
  RowActions,
  useDict,
  useMappedError,
  useRepartoCanAct
} from "../shared.js";

const REASON_ERROR_KEYS = {
  required: "reasonRequired",
  too_long: "reasonTooLong"
} as const satisfies Record<ProcessReopenReasonError, string>;

/**
 * The `final` → `reopened` edge, with the reason the service records (`S2-05`).
 *
 * `ensure_process_mutable` answers *"Cannot mutate a process in status
 * {status}; reopen it first."* on every child write of a closed process, and
 * the plugin had no way to comply: `assignmentProcesses.reopen` was a wrapper
 * with no hook and no control.
 *
 * The panel renders exactly while the process is frozen and vanishes once it
 * accepts writes again — it is not a permanent footer. Being frozen is a
 * `role="status"` statement, never an alert: nothing has gone wrong, the
 * process is simply closed. An `archived` process is frozen and *not*
 * reopenable, so it gets the explanation without the control rather than a
 * button that would answer 400.
 */
export function ProcessReopenControl({
  locale,
  processId
}: {
  locale?: RepartoLocale;
  processId?: string;
}) {
  const dict = useDict(locale);
  const canAct = useRepartoCanAct("processSettings");
  const processQuery = useRepartoProcess(processId);
  const reopenMutation = useReopenRepartoProcess();
  const [mapped, setError, clearError] = useMappedError();
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] =
    useState<ProcessReopenReasonError | null>(null);
  const process = processQuery.data ?? null;
  const state = buildProcessReopenState({ canAct, process });

  // A process that still accepts writes has nothing to say here.
  if (!state.isFrozen) return null;

  function handleReopen() {
    if (!processId || !state.canReopen || reopenMutation.isPending) return;
    const built = buildProcessReopenRequest(reason);
    if (!built.ok) {
      setReasonError(built.error);
      return;
    }
    setReasonError(null);
    clearError();
    reopenMutation.mutate(
      { processId, body: built.request },
      {
        onSuccess: () => {
          setReason("");
          repartoToast.success(dict.processSettings.reopen.reopened);
        },
        onError: (error) => {
          setError(error);
          repartoToast.error(
            dict.processSettings.reopen.error,
            error instanceof Error ? error.message : undefined
          );
        }
      }
    );
  }

  return (
    <section
      className={`${repartoPanelClass} space-y-3`}
      data-process-reopen-blocked-reason={state.blockedReason ?? undefined}
      data-reparto-component="process-reopen"
    >
      <h2 className="font-semibold">{dict.processSettings.reopen.title}</h2>
      <p data-reparto-state="process-frozen" role="status">
        {dict.processSettings.reopen.frozen}
      </p>
      {state.blockedReason === "terminal" ? (
        <p className={repartoFieldCaptionClass} data-reparto-state="terminal">
          {dict.processSettings.reopen.terminal}
        </p>
      ) : null}
      {state.blockedReason === "read-only" ? (
        <p className={repartoFieldCaptionClass} data-reparto-state="read-only">
          {dict.processSettings.reopen.readOnly}
        </p>
      ) : null}
      {state.canReopen ? (
        <>
          <p
            className={repartoFieldCaptionClass}
            data-reparto-slot="process-reopen-consequence"
          >
            {dict.processSettings.reopen.consequence}
          </p>
          <label className={repartoFieldLabelClass}>
            {dict.processSettings.reopen.reasonLabel}
            <textarea
              aria-invalid={reasonError ? true : undefined}
              className={repartoInputClass}
              data-reparto-field="reopen_reason"
              maxLength={PROCESS_REOPEN_REASON_MAX_LENGTH}
              onChange={(event: { target: { value: string } }) =>
                setReason(event.target.value)
              }
              rows={3}
              value={reason}
            />
            {reasonError ? (
              <span
                className="text-xs text-destructive"
                data-reparto-slot="field-error"
                role="alert"
              >
                {dict.processSettings.reopen[REASON_ERROR_KEYS[reasonError]]}
              </span>
            ) : null}
          </label>
          <RepartoFormError mapped={mapped} />
          <RowActions>
            <ActionButton
              action="reopen-process"
              disabled={reopenMutation.isPending}
              label={dict.processSettings.reopen.action}
              onClick={handleReopen}
            />
          </RowActions>
        </>
      ) : null}
    </section>
  );
}
