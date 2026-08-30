import { useState } from "react";

import { formatHoursField, hoursEqual, parseHoursField } from "../../../../decimals.js";
import { formatRepartoMessage } from "../../../../i18n/index.js";
import {
  EntityDialogShell,
  FormGrid,
  FormPanelShell,
  SaveCancelRow,
  SelectField,
  TextField,
  useMappedError,
  type Dict
} from "../shared.js";
import { useUpdateRepartoProcessTeacher } from "../../../hooks.js";
import type {
  ProcessTeacherPublic,
  ProcessTeacherUpdateInput,
  ProcessTeacherStatus
} from "../../../../schemas.js";

export type ParticipantEditProps = {
  dict: Dict;
  processId: string;
  participant: ProcessTeacherPublic;
  teacherName: string;
  onDone: () => void;
};

export function ParticipantEdit({
  dict,
  processId,
  participant,
  teacherName,
  onDone
}: ParticipantEditProps) {
  const updateMutation = useUpdateRepartoProcessTeacher();
  const [mapped, setError, clearError] = useMappedError();
  const [baseHours, setBaseHours] = useState(
    formatHoursField(participant.base_weekly_hours)
  );
  const [participatesInSelection, setParticipatesInSelection] = useState(
    participant.participates_in_selection
  );
  const [status, setStatus] = useState<ProcessTeacherStatus>(participant.status);

  const parsedBase = parseHoursField(baseHours);
  const baseError =
    parsedBase.state === "invalid"
      ? dict.participants.hoursError[parsedBase.reason]
      : null;
  // Compared through the decimal helper, never as two floats: `"18.00"` and
  // `18` are the same number of hours and must not read as a pending edit.
  const dirty =
    (parsedBase.state === "valid" &&
      !hoursEqual(parsedBase.hours, participant.base_weekly_hours)) ||
    participatesInSelection !== participant.participates_in_selection ||
    status !== participant.status;
  const canSave =
    dirty && parsedBase.state === "valid" && !updateMutation.isPending;

  function handleSubmit(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (!canSave || parsedBase.state !== "valid") return;
    clearError();
    const body: ProcessTeacherUpdateInput = {
      base_weekly_hours: parsedBase.hours,
      participates_in_selection: participatesInSelection,
      status
    };
    updateMutation.mutate(
      { processId, processTeacherId: participant.id, body },
      { onSuccess: () => onDone(), onError: setError }
    );
  }

  return (
    <EntityDialogShell
      description={teacherName}
      dialogId="participant-edit"
      onClose={onDone}
      title={`${dict.action.edit} ${dict.entity.processParticipant.singular.toLowerCase()}`}
    >
    <FormPanelShell formAttr="participant" mode="edit" onSubmit={handleSubmit}>
      <FormGrid>
        <SelectField
          field="teacher-profile"
          label={dict.field.teacher}
          value={participant.teacher_profile_id}
          options={[{ value: participant.teacher_profile_id, label: teacherName || dict.field.teacher }]}
          disabled
          onChange={() => undefined}
        />
        <TextField
          field="base-weekly-hours"
          id="participant-edit-base-hours"
          label={dict.field.baseWeeklyHours}
          onChange={setBaseHours}
          value={baseHours}
          mapped={mapped}
          fieldErrorKey="baseWeeklyHours"
        />
        {baseError ? (
          <p data-reparto-field-error="base-weekly-hours" role="alert">
            {baseError}
          </p>
        ) : null}
        {/*
          Authorized extra hours are read-only here on purpose: the backend
          removed them from the generic PATCH so no change can arrive without a
          reason. The figures are shown because they are what makes the target
          the number it is, and the target is shown because it, not the base,
          is what the participant's slots must add up to.
        */}
        <dl data-reparto-slot="participant-target">
          <div>
            <dt>{dict.field.extraWeeklyHours}</dt>
            <dd data-reparto-slot="participant-extra-hours">
              {participant.extra_weekly_hours}
            </dd>
          </div>
          <div>
            <dt>{dict.field.targetWeeklyHours}</dt>
            <dd data-reparto-slot="participant-target-hours">
              {participant.target_weekly_hours}
            </dd>
          </div>
          <div>
            <dt>{dict.field.overloaded}</dt>
            <dd
              data-reparto-overloaded={participant.is_overloaded ? "true" : "false"}
              data-reparto-slot="participant-overloaded"
            >
              {participant.is_overloaded
                ? dict.participants.overloadedYes
                : dict.participants.overloadedNo}
            </dd>
          </div>
        </dl>
        <p data-reparto-slot="participant-target-hint">{dict.participants.targetHint}</p>
        <p data-reparto-slot="participant-extra-hours-reason">
          {participant.extra_hours_reason
            ? formatRepartoMessage(dict.participants.lastExtraHoursReason, {
                reason: participant.extra_hours_reason
              })
            : dict.participants.noExtraHoursReason}
        </p>
        <label className="grid gap-1.5 text-sm font-medium">
          <span>{dict.field.participatesInSelection}</span>
          <input
            checked={participatesInSelection}
            data-reparto-field="participates-in-selection"
            onChange={(event: { target: { checked: boolean } }) =>
              setParticipatesInSelection(event.target.checked)
            }
            type="checkbox"
          />
        </label>
        <SelectField
          field="status"
          label={dict.field.status}
          value={status}
          options={[
            { value: "active", label: dict.entity.processParticipant.status.active },
            { value: "inactive", label: dict.entity.processParticipant.status.inactive }
          ]}
          onChange={(value) => setStatus(value as ProcessTeacherStatus)}
        />
        <SaveCancelRow
          canSave={canSave}
          isPending={updateMutation.isPending}
          saveLabel={dict.action.save}
          cancelLabel={dict.action.cancel}
          onSubmit={() => handleSubmit({ preventDefault: () => undefined })}
          onCancel={onDone}
          mapped={mapped}
        />
      </FormGrid>
    </FormPanelShell>
    </EntityDialogShell>
  );
}