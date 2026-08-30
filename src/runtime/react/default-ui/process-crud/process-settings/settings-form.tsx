"use client";

import { useEffect, useState } from "react";

import type { RepartoLocale } from "../../../../i18n/index.js";
import type { SelectionOrderMode } from "../../../../schemas.js";
import type { HoursFieldError } from "../../../../decimals.js";
import {
  buildProcessSettingsRequest,
  buildProcessSettingsValues,
  isSelectionOrderModeEffective,
  type ProcessSettingsValues
} from "../../../../ui/processSettings.js";
import {
  useRepartoProcess,
  useUpdateRepartoProcess
} from "../../../hooks.js";
import {
  repartoFieldCaptionClass,
  repartoFieldGridClass,
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

const SELECTION_ORDER_MODES = ["none", "informative", "strict"] as const;

function SettingsCheckbox({
  caption,
  checked,
  field,
  label,
  onChange
}: {
  caption: string;
  checked: boolean;
  field: string;
  label: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <div>
      <label className={repartoFieldLabelClass}>
        <input
          checked={checked}
          data-reparto-field={field}
          onChange={(event: { target: { checked: boolean } }) =>
            onChange(event.target.checked)
          }
          type="checkbox"
        />
        {label}
      </label>
      <p className={repartoFieldCaptionClass}>{caption}</p>
    </div>
  );
}

/**
 * The §8.2 step 7 settings form (audit finding `S2-03`).
 *
 * Every field the served `update_process` accepts, and no more: `status` is
 * refused there with an HTTP 400 naming the transition endpoint, so it is shown
 * by the view as state and never offered here as a control.
 *
 * The `admin` floor comes from `useRepartoCanAct` inside the component rather
 * than from a prop (§21.5), so a headless host mounting this panel directly
 * still gets it; below the floor the refusal is stated and the form withheld
 * rather than rendered disabled.
 */
export function ProcessSettingsForm({
  locale,
  processId
}: {
  locale?: RepartoLocale;
  processId?: string;
}) {
  const dict = useDict(locale);
  const canAct = useRepartoCanAct("processSettings");
  const processQuery = useRepartoProcess(processId);
  const updateMutation = useUpdateRepartoProcess();
  const [mapped, setError, clearError] = useMappedError();
  const process = processQuery.data ?? null;
  const [values, setValues] = useState<ProcessSettingsValues>(() =>
    buildProcessSettingsValues(process)
  );
  const [hoursError, setHoursError] = useState<HoursFieldError | null>(null);
  // The form is seeded from the row and re-seeded whenever the row itself
  // changes identity or is written: a stale draft over a refreshed process
  // would silently re-submit values the operator can no longer see.
  const [seededFrom, setSeededFrom] = useState<string | null>(
    process ? process.updated_at : null
  );
  useEffect(() => {
    if (!process) return;
    if (seededFrom === process.updated_at) return;
    setValues(buildProcessSettingsValues(process));
    setSeededFrom(process.updated_at);
  }, [process, seededFrom]);

  if (!canAct) {
    return (
      <p className={repartoFieldCaptionClass} data-reparto-state="read-only">
        {dict.processSettings.readOnly}
      </p>
    );
  }

  const built = buildProcessSettingsRequest(values, process);
  const isUnchanged = built.ok && !built.changed;

  function handleSubmit(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (!processId || updateMutation.isPending) return;
    const request = buildProcessSettingsRequest(values, process);
    if (!request.ok) {
      setHoursError(request.errors.defaultTeacherHoursReference ?? null);
      return;
    }
    setHoursError(null);
    if (!request.changed) return;
    clearError();
    updateMutation.mutate(
      { processId, body: request.request },
      {
        onSuccess: () => {
          repartoToast.success(dict.processSettings.saved);
        },
        onError: (error) => {
          setError(error);
          repartoToast.error(
            dict.processSettings.saveError,
            error instanceof Error ? error.message : undefined
          );
        }
      }
    );
  }

  return (
    <section
      className={`${repartoPanelClass} space-y-4`}
      data-reparto-component="process-settings-form"
    >
      <h2 className="font-semibold">{dict.processSettings.formTitle}</h2>
      <form
        className="space-y-4"
        data-reparto-form="process-settings"
        onSubmit={handleSubmit}
      >
        <div className={repartoFieldGridClass}>
          <label className={repartoFieldLabelClass}>
            {dict.processSettings.field.defaultTeacherHoursReference}
            <input
              aria-invalid={hoursError ? true : undefined}
              className={repartoInputClass}
              data-reparto-field="default_teacher_hours_reference"
              inputMode="decimal"
              onChange={(event: { target: { value: string } }) =>
                setValues({
                  ...values,
                  defaultTeacherHoursReference: event.target.value
                })
              }
              value={values.defaultTeacherHoursReference}
            />
            <span className={repartoFieldCaptionClass}>
              {dict.processSettings.hint.defaultTeacherHoursReference}
            </span>
            {hoursError ? (
              <span
                className="text-xs text-destructive"
                data-reparto-slot="field-error"
                role="alert"
              >
                {dict.processSettings.hoursError[hoursError]}
              </span>
            ) : null}
          </label>
          <label className={repartoFieldLabelClass}>
            {dict.processSettings.field.selectionOrderMode}
            <select
              className={repartoInputClass}
              data-reparto-field="selection_order_mode"
              onChange={(event: { target: { value: string } }) =>
                setValues({
                  ...values,
                  selectionOrderMode: event.target.value as SelectionOrderMode
                })
              }
              value={values.selectionOrderMode}
            >
              {SELECTION_ORDER_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {dict.processSettings.mode[mode]}
                </option>
              ))}
            </select>
            <span className={repartoFieldCaptionClass}>
              {dict.processSettings.hint.selectionOrderMode}
            </span>
          </label>
        </div>
        <SettingsCheckbox
          caption={dict.processSettings.hint.selectionOrderEnabled}
          checked={values.selectionOrderEnabled}
          field="selection_order_enabled"
          label={dict.processSettings.field.selectionOrderEnabled}
          onChange={(next) =>
            setValues({ ...values, selectionOrderEnabled: next })
          }
        />
        {/*
          The two columns are independent on the row, so a stored `strict` mode
          with the order disabled is inert rather than invalid. Saying so is
          better than forcing one field from the other: the stored value stays
          the operator's, and re-enabling the order does not look like the mode
          was lost.
        */}
        {!isSelectionOrderModeEffective(values) &&
        values.selectionOrderMode !== "none" ? (
          <p
            className={repartoFieldCaptionClass}
            data-reparto-slot="selection-order-mode-inert"
            role="status"
          >
            {dict.processSettings.hint.modeInert}
          </p>
        ) : null}
        <SettingsCheckbox
          caption={dict.processSettings.hint.directTeacherSelectionEnabled}
          checked={values.directTeacherSelectionEnabled}
          field="direct_teacher_selection_enabled"
          label={dict.processSettings.field.directTeacherSelectionEnabled}
          onChange={(next) =>
            setValues({ ...values, directTeacherSelectionEnabled: next })
          }
        />
        <SettingsCheckbox
          caption={dict.processSettings.hint.lanAccessEnabled}
          checked={values.lanAccessEnabled}
          field="lan_access_enabled"
          label={dict.processSettings.field.lanAccessEnabled}
          onChange={(next) => setValues({ ...values, lanAccessEnabled: next })}
        />
        <RepartoFormError mapped={mapped} />
        {isUnchanged ? (
          <p
            className={repartoFieldCaptionClass}
            data-reparto-state="unchanged"
            role="status"
          >
            {dict.processSettings.unchanged}
          </p>
        ) : null}
        <RowActions>
          <ActionButton
            action="save-process-settings"
            disabled={updateMutation.isPending || isUnchanged}
            label={dict.action.save}
            type="submit"
          />
        </RowActions>
      </form>
    </section>
  );
}
