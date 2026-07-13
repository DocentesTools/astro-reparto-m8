import {
  findFieldError,
  type RepartoFieldKey,
  type RepartoMappedError
} from "../../errorMapping.js";
import { repartoFieldCaptionClass } from "../styles.js";

export function RepartoFormError({
  mapped
}: {
  mapped: RepartoMappedError;
}) {
  if (!mapped.formError) return null;
  return (
    <p
      className="text-sm text-destructive"
      data-reparto-slot="form-error"
      data-reparto-error-key={mapped.formError.errorKey ?? "server"}
    >
      {mapped.formError.message}
    </p>
  );
}

export function RepartoFieldError({
  field,
  id,
  mapped
}: {
  field: RepartoFieldKey;
  id?: string;
  mapped: RepartoMappedError;
}) {
  const err = findFieldError(mapped, field);
  if (!err) return null;
  return (
    <p
      className="text-xs text-destructive"
      data-reparto-slot="field-error"
      data-reparto-field={field}
      data-reparto-error-key={err.errorKey ?? "server"}
      id={id}
      role="alert"
    >
      {err.message}
    </p>
  );
}

export function RepartoDisabledReason({
  reason
}: {
  reason: string | null | undefined;
}) {
  if (!reason) return null;
  return (
    <span
      className={repartoFieldCaptionClass}
      data-reparto-disabled-reason=""
    >
      {reason}
    </span>
  );
}