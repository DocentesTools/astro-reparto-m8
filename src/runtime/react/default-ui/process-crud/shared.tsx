import { useState, type ReactNode } from "react";

import {
  formatRepartoMessage,
  getRepartoDictionary,
  normalizeRepartoLocale,
  type RepartoLocale
} from "../../../i18n/index.js";
import {
  EMPTY_REPARTO_MAPPED_ERROR,
  mapRepartoError,
  type RepartoMappedError
} from "../../../errorMapping.js";
import {
  RepartoDisabledReason,
  RepartoFieldError,
  RepartoFormError
} from "../feedback.js";
import {
  repartoActionRowClass,
  repartoButtonClass,
  repartoButtonDeleteClass,
  repartoFieldCaptionClass,
  repartoFieldGridClass,
  repartoFieldLabelClass,
  repartoInputClass,
  repartoListClass,
  repartoListItemClass,
  repartoPanelClass,
  repartoPanelHeaderClass,
  repartoShellClass
} from "../../styles.js";
import { resolveProcessId } from "../../../queryKeys.js";
import {
  Shell,
  ViewConfig,
  WithSelectedProcess
} from "../process-context.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "../../ui/dialog.js";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "../../ui/alert-dialog.js";
import { RepartoLoadingState } from "../loading-state.js";
import { RepartoRouteGuard } from "../route-guard.js";
import { useRepartoCanAct } from "../../useRepartoRole.js";

export { RepartoRouteGuard, Shell, useRepartoCanAct, WithSelectedProcess };
export type { ViewConfig };
export type Dict = ReturnType<typeof getRepartoDictionary>;
export type EntityViewProps = {
  config?: ViewConfig;
  locale?: RepartoLocale;
  processId?: string;
};

export function useDict(locale?: RepartoLocale): Dict {
  return getRepartoDictionary(locale ?? normalizeRepartoLocale());
}

export function useMappedError(): [
  RepartoMappedError,
  (error: unknown) => void,
  () => void
] {
  const [mapped, setMapped] = useState<RepartoMappedError>(
    EMPTY_REPARTO_MAPPED_ERROR
  );
  const setError = (error: unknown) => setMapped(mapRepartoError(error));
  const clear = () => setMapped(EMPTY_REPARTO_MAPPED_ERROR);
  return [mapped, setError, clear];
}

export function RowActions({ children }: { children: ReactNode }) {
  return <div className={repartoActionRowClass}>{children}</div>;
}

export function ActionButton({
  action,
  disabled,
  disabledReason,
  label,
  onClick,
  row,
  type = "button"
}: {
  action: string;
  disabled?: boolean;
  disabledReason?: string | null;
  label: string;
  onClick?: () => void;
  row?: boolean;
  type?: "button" | "submit";
}) {
  // Guarded retirement (§20.12) takes a row out of the plan without removing
  // it, so it reads as destructive here even though nothing is deleted.
  const isDestructive =
    action === "delete" || action === "delete-selected" || action === "retire";
  return (
    <button
      className={isDestructive ? repartoButtonDeleteClass : repartoButtonClass}
      data-reparto-action={action}
      data-reparto-row-action={row ? action : undefined}
      data-disabled-reason={disabledReason ?? undefined}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {label}
    </button>
  );
}

export function CrudHeader({
  entityLabel,
  createLabel,
  canCreate,
  createReason,
  onCreate,
  readOnly = false
}: {
  entityLabel: string;
  createLabel: string;
  canCreate: boolean;
  createReason?: string | null;
  onCreate: () => void;
  readOnly?: boolean;
}) {
  return (
    <div className={repartoPanelHeaderClass}>
      <h2>{entityLabel}</h2>
      {readOnly ? (
        <span
          className={repartoFieldCaptionClass}
          data-reparto-slot="read-only"
        >
          {entityLabel}
        </span>
      ) : (
        <RowActions>
          <ActionButton
            action="create"
            disabled={!canCreate}
            disabledReason={createReason ?? undefined}
            label={createLabel}
            onClick={onCreate}
          />
          <RepartoDisabledReason reason={createReason} />
        </RowActions>
      )}
    </div>
  );
}

export type QueryStateProps = {
  dict: Dict;
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  label: string;
};

export function QueryState({ dict, error, isError, isLoading, label }: QueryStateProps) {
  if (isLoading) {
    return (
      <RepartoLoadingState
        description={formatRepartoMessage(dict.view.loading, { entity: label })}
        title={formatRepartoMessage(dict.view.loading, { entity: label })}
      />
    );
  }
  if (!isError) return null;
  const mapped = mapRepartoError(error);
  const message = mapped.formError?.message ?? formatRepartoMessage(dict.view.unavailable, { entity: label });
  return (
    <section
      className={repartoPanelClass}
      data-reparto-state="error"
      data-reparto-error-key={mapped.formError?.errorKey ?? "server"}
    >
      {message}
    </section>
  );
}

export type EntityShellProps = {
  children: ReactNode;
  route: string;
  tableAttr: string;
  panelAttr: string;
};

export function EntityShell({
  children,
  panelAttr,
  route,
  tableAttr
}: EntityShellProps) {
  return (
    <main
      className={repartoShellClass}
      data-reparto-route={route}
      data-reparto-group="process"
    >
      <section className={repartoPanelClass} data-reparto-panel={panelAttr}>
        <ul className={repartoListClass} data-reparto-table={tableAttr}>
          {children}
        </ul>
      </section>
    </main>
  );
}

export function EmptyRow({ label }: { label: string }) {
  return (
    <li className={repartoListItemClass} data-reparto-state="empty">
      {label}
    </li>
  );
}

export type RowShellProps = {
  children: ReactNode;
  rowAttr: string;
  idAttr: string;
  idValue: string;
  extras?: Record<string, string>;
  key?: string;
};

export function RowShell({
  children,
  rowAttr,
  idAttr,
  idValue,
  extras
}: RowShellProps) {
  const attribute: Record<string, string> = { [idAttr]: idValue };
  return (
    <li
      className={repartoListItemClass}
      data-reparto-row={rowAttr}
      {...attribute}
      {...(extras ?? {})}
    >
      {children}
    </li>
  );
}

export function RowHeader({
  label,
  labelAttr,
  caption
}: {
  label: string;
  labelAttr: string;
  caption?: string;
}) {
  return (
    <div className={repartoPanelHeaderClass}>
      <span data-reparto-slot={labelAttr}>{label}</span>
      {caption ? (
        <span className={repartoFieldCaptionClass} data-reparto-slot="caption">
          {caption}
        </span>
      ) : null}
    </div>
  );
}

export function FormPanel({
  children,
  formAttr,
  mode
}: {
  children: ReactNode;
  formAttr: string;
  mode?: "create" | "edit";
}) {
  return (
    <section className={repartoPanelClass} data-reparto-form={formAttr} data-reparto-mode={mode}>
      {children}
    </section>
  );
}

export function FieldLabel({
  children
}: {
  children: ReactNode;
}) {
  return <label className={repartoFieldLabelClass}>{children}</label>;
}

export type TextFieldProps = {
  field: string;
  id?: string;
  label: string;
  value: string;
  maxLength?: number;
  type?: "text" | "number";
  placeholder?: string;
  onChange: (value: string) => void;
  mapped?: RepartoMappedError;
  fieldErrorKey?: import("../../../errorMapping.js").RepartoFieldKey;
};

export function TextField({
  field,
  id,
  label,
  value,
  maxLength,
  type = "text",
  placeholder,
  onChange,
  mapped,
  fieldErrorKey
}: TextFieldProps) {
  return (
    <FieldLabel>
      {label}
      <input
        aria-invalid={
          fieldErrorKey && mapped && mapped.fieldErrors.some((e) => e.field === fieldErrorKey)
            ? true
            : undefined
        }
        className={repartoInputClass}
        data-reparto-field={field}
        id={id}
        maxLength={maxLength}
        onChange={(event: { target: { value: string } }) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
      {fieldErrorKey ? (
        <RepartoFieldError field={fieldErrorKey} id={id ? `${id}-error` : undefined} mapped={mapped ?? EMPTY_REPARTO_MAPPED_ERROR} />
      ) : null}
    </FieldLabel>
  );
}

export type SelectFieldProps = {
  field: string;
  label: string;
  value: string;
  placeholder?: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
  disabledReason?: string | null;
  createNewLabel?: string;
  onCreateNew?: () => void;
  missingPrereqHref?: string;
  missingPrereqLabel?: string;
  onChange: (value: string) => void;
  mapped?: RepartoMappedError;
  fieldErrorKey?: import("../../../errorMapping.js").RepartoFieldKey;
};

export function SelectField({
  field,
  label,
  value,
  placeholder,
  options,
  disabled,
  disabledReason,
  createNewLabel,
  onCreateNew,
  missingPrereqHref,
  missingPrereqLabel,
  onChange,
  mapped,
  fieldErrorKey
}: SelectFieldProps) {
  return (
    <FieldLabel>
      {label}
      <select
        className={repartoInputClass}
        data-reparto-field={field}
        disabled={disabled}
        onChange={(event: { target: { value: string } }) => {
          if (event.target.value === "__create_new__") {
            onCreateNew?.();
            return;
          }
          onChange(event.target.value);
        }}
        value={value}
      >
        <option value="">{placeholder ?? label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
        {createNewLabel && onCreateNew ? (
          <option value="__create_new__" data-reparto-fk-action="create-new">
            {createNewLabel}
          </option>
        ) : null}
      </select>
      {fieldErrorKey ? (
        <RepartoFieldError field={fieldErrorKey} mapped={mapped ?? EMPTY_REPARTO_MAPPED_ERROR} />
      ) : null}
      {disabled && disabledReason ? (
        <RepartoDisabledReason reason={disabledReason} />
      ) : null}
      {missingPrereqHref && missingPrereqLabel ? (
        <a
          className={repartoFieldCaptionClass}
          data-reparto-action="create-missing-prerequisite"
          href={missingPrereqHref}
        >
          {missingPrereqLabel}
        </a>
      ) : null}
    </FieldLabel>
  );
}

export interface ConfirmDeleteProps {
  deleteFormAttr: string;
  title: string;
  body: string;
  proceedLabel: string;
  cancelLabel: string;
  confirmWarning?: ReactNode;
  isPending: boolean;
  mapped: RepartoMappedError;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDelete({
  deleteFormAttr,
  title,
  body,
  proceedLabel,
  cancelLabel,
  confirmWarning,
  isPending,
  mapped,
  onConfirm,
  onCancel
}: ConfirmDeleteProps) {
  return (
    <section className={repartoPanelClass} data-reparto-form={deleteFormAttr}>
      <h3>{title}</h3>
      <p data-reparto-slot="confirm-body">{body}</p>
      {confirmWarning ? (
        <div data-reparto-confirm-warning="">{confirmWarning}</div>
      ) : null}
      <RepartoFormError mapped={mapped} />
      <RowActions>
        <ActionButton
          action="delete"
          disabled={isPending}
          label={proceedLabel}
          onClick={onConfirm}
        />
        <ActionButton
          action="cancel"
          label={cancelLabel}
          onClick={onCancel}
        />
      </RowActions>
    </section>
  );
}

export type SaveCancelRowProps = {
  canSave: boolean;
  isPending: boolean;
  saveLabel: string;
  cancelLabel: string;
  onSubmit: () => void;
  onCancel: () => void;
  mapped: RepartoMappedError;
};

export function SaveCancelRow({
  canSave,
  isPending,
  saveLabel,
  cancelLabel,
  onSubmit,
  onCancel,
  mapped
}: SaveCancelRowProps) {
  return (
    <>
      <RepartoFormError mapped={mapped} />
      <RowActions>
        <ActionButton
          action="save"
          disabled={!canSave || isPending}
          label={saveLabel}
          onClick={onSubmit}
        />
        <ActionButton
          action="cancel"
          label={cancelLabel}
          onClick={onCancel}
        />
      </RowActions>
    </>
  );
}

export function FormGrid({ children }: { children: ReactNode }) {
  return <div className={repartoFieldGridClass}>{children}</div>;
}

export function FormPanelShell({
  children,
  formAttr,
  mode,
  onSubmit
}: {
  children: ReactNode;
  formAttr: string;
  mode?: "create" | "edit";
  onSubmit: (event: { preventDefault: () => void }) => void;
}) {
  return (
    <form
      className={repartoFieldGridClass}
      data-reparto-form={formAttr}
      data-reparto-mode={mode}
      onSubmit={onSubmit}
    >
      {children}
    </form>
  );
}

export function EntityDialogShell({
  children,
  description,
  dialogId,
  onClose,
  title
}: {
  children: ReactNode;
  description?: string;
  dialogId: string;
  onClose: () => void;
  title: string;
}) {
  return (
    <Dialog onOpenChange={(open) => { if (!open) onClose(); }} open>
      <DialogContent closeLabel={title}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div data-reparto-dialog={dialogId}>{children}</div>
      </DialogContent>
    </Dialog>
  );
}

export function EntityDeleteDialog({
  title,
  body,
  proceedLabel,
  cancelLabel,
  confirmWarning,
  isPending,
  mapped,
  onConfirm,
  onClose
}: {
  title: string;
  body: string;
  proceedLabel: string;
  cancelLabel: string;
  confirmWarning?: ReactNode;
  isPending: boolean;
  mapped: RepartoMappedError;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <AlertDialog onOpenChange={(open) => { if (!open) onClose(); }} open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{body}</AlertDialogDescription>
        </AlertDialogHeader>
        {confirmWarning ? (
          <div data-reparto-confirm-warning="">{confirmWarning}</div>
        ) : null}
        <RepartoFormError mapped={mapped} />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction disabled={isPending} onClick={onConfirm}>{proceedLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export {
  EMPTY_REPARTO_MAPPED_ERROR,
  mapRepartoError,
  RepartoDisabledReason,
  RepartoFieldError,
  RepartoFormError,
  resolveProcessId
};
