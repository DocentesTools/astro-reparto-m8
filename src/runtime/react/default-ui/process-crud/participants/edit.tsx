import { useState } from "react";

import {
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
  ProcessTeacherUpdate,
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
  const [availableHours, setAvailableHours] = useState(String(participant.available_hours));
  const [participatesInSelection, setParticipatesInSelection] = useState(
    participant.participates_in_selection
  );
  const [status, setStatus] = useState<ProcessTeacherStatus>(participant.status);
  const [notes, setNotes] = useState(participant.notes ?? "");

  const hoursNum = Number.parseFloat(availableHours);
  const hoursValid = Number.isFinite(hoursNum) && hoursNum >= 0;
  const dirty =
    hoursNum !== participant.available_hours ||
    participatesInSelection !== participant.participates_in_selection ||
    status !== participant.status ||
    notes !== (participant.notes ?? "");
  const canSave = dirty && hoursValid && !updateMutation.isPending;

  function handleSubmit(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (!canSave) return;
    clearError();
    const body: ProcessTeacherUpdate = {
      available_hours: hoursNum,
      participates_in_selection: participatesInSelection,
      status,
      notes: notes.trim() || null
    };
    updateMutation.mutate(
      { processId, processTeacherId: participant.id, body },
      { onSuccess: () => onDone(), onError: setError }
    );
  }

  return (
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
          field="available-hours"
          id="participant-edit-hours"
          label={dict.field.availableHours}
          onChange={setAvailableHours}
          value={availableHours}
          type="number"
          mapped={mapped}
          fieldErrorKey="availableHours"
        />
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
        <TextField
          field="notes"
          id="participant-edit-notes"
          label={dict.field.notes}
          maxLength={2000}
          onChange={setNotes}
          value={notes}
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
  );
}