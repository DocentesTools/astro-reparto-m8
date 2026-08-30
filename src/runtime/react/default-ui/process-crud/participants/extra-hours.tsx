import { useState } from "react";

import { formatHoursField, hoursEqual, parseHoursField } from "../../../../decimals.js";
import { formatRepartoMessage } from "../../../../i18n/index.js";
import {
  EntityDialogShell,
  FormGrid,
  FormPanelShell,
  SaveCancelRow,
  TextField,
  useMappedError,
  type Dict
} from "../shared.js";
import { useUpdateRepartoProcessTeacherExtraHours } from "../../../hooks.js";
import { repartoToast } from "../../../ui/toast-notification.js";
import type { ProcessTeacherPublic } from "../../../../schemas.js";

export type ParticipantExtraHoursProps = {
  dict: Dict;
  processId: string;
  participant: ProcessTeacherPublic;
  teacherName: string;
  onDone: () => void;
};

/**
 * Authorize (or withdraw) a participant's extra weekly hours.
 *
 * This is the only path that moves `extra_weekly_hours`, and it cannot be taken
 * without a reason — the generic participant PATCH has no such field, on the
 * backend and in the update schema alike. Authorized overload is not a
 * tolerance applied after the fact: it raises the participant's target *before*
 * any assignment, which is what makes an over-target assignment impossible
 * rather than merely discouraged (backend plan §3.8, §7.6).
 *
 * Withdrawing is the same action with `0`, not a delete, so both directions
 * land in the audit trail with the head's own justification.
 */
export function ParticipantExtraHours({
  dict,
  processId,
  participant,
  teacherName,
  onDone
}: ParticipantExtraHoursProps) {
  const extraHoursMutation = useUpdateRepartoProcessTeacherExtraHours();
  const [mapped, setError, clearError] = useMappedError();
  const [extraHours, setExtraHours] = useState(
    formatHoursField(participant.extra_weekly_hours)
  );
  const [reason, setReason] = useState("");

  const parsedExtra = parseHoursField(extraHours);
  const extraError =
    parsedExtra.state === "invalid"
      ? dict.participants.hoursError[parsedExtra.reason]
      : null;
  const trimmedReason = reason.trim();
  // An unchanged value is not a change to justify: the service would record an
  // audit event saying nothing happened.
  const changed =
    parsedExtra.state === "valid" &&
    !hoursEqual(parsedExtra.hours, participant.extra_weekly_hours);
  const canSave =
    changed && trimmedReason.length > 0 && !extraHoursMutation.isPending;

  function handleSubmit(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (!canSave || parsedExtra.state !== "valid") return;
    clearError();
    extraHoursMutation.mutate(
      {
        processId,
        processTeacherId: participant.id,
        body: {
          extra_weekly_hours: parsedExtra.hours,
          reason: trimmedReason
        }
      },
      {
        onSuccess: () => {
          repartoToast.success(dict.participants.extraHoursSaved);
          onDone();
        },
        onError: (error) => {
          setError(error);
          repartoToast.error(
            dict.participants.extraHoursError,
            error instanceof Error ? error.message : undefined
          );
        }
      }
    );
  }

  return (
    <EntityDialogShell
      description={teacherName}
      dialogId="participant-extra-hours"
      onClose={onDone}
      title={dict.participants.extraHoursTitle}
    >
      <FormPanelShell
        formAttr="participant-extra-hours"
        mode="edit"
        onSubmit={handleSubmit}
      >
        <FormGrid>
          <p data-reparto-slot="confirm-body">
            {formatRepartoMessage(dict.participants.extraHoursBody, {
              base: participant.base_weekly_hours,
              extra: participant.extra_weekly_hours,
              target: participant.target_weekly_hours,
              teacher: teacherName
            })}
          </p>
          <TextField
            field="extra-weekly-hours"
            fieldErrorKey="extraWeeklyHours"
            id="participant-extra-hours-value"
            label={dict.field.extraWeeklyHours}
            mapped={mapped}
            onChange={setExtraHours}
            value={extraHours}
          />
          {extraError ? (
            <p data-reparto-field-error="extra-weekly-hours" role="alert">
              {extraError}
            </p>
          ) : null}
          <p data-reparto-slot="extra-hours-hint">
            {dict.participants.extraHoursHint}
          </p>
          <TextField
            field="reason"
            fieldErrorKey="reason"
            id="participant-extra-hours-reason"
            label={dict.field.reason}
            mapped={mapped}
            maxLength={500}
            onChange={setReason}
            value={reason}
          />
          <SaveCancelRow
            canSave={canSave}
            cancelLabel={dict.confirm.cancel}
            isPending={extraHoursMutation.isPending}
            mapped={mapped}
            onCancel={onDone}
            onSubmit={() => handleSubmit({ preventDefault: () => undefined })}
            saveLabel={dict.participants.extraHoursConfirm}
          />
        </FormGrid>
      </FormPanelShell>
    </EntityDialogShell>
  );
}
