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
import { useUpdateRepartoHourRequirement } from "../../../hooks.js";
import type {
  HourRequirementPublic,
  HourRequirementUpdate,
  RequirementType
} from "../../../../schemas.js";

const REQUIREMENT_TYPES: RequirementType[] = [
  "ordinary",
  "reinforcement",
  "split_group",
  "optional",
  "bilingual",
  "other"
];

export type RequirementEditProps = {
  dict: Dict;
  processId: string;
  requirement: HourRequirementPublic;
  classroomLabel: string;
  subjectName: string;
  onDone: () => void;
};

export function RequirementEdit({
  dict,
  processId,
  requirement,
  classroomLabel,
  subjectName,
  onDone
}: RequirementEditProps) {
  const updateMutation = useUpdateRepartoHourRequirement();
  const [mapped, setError, clearError] = useMappedError();
  const [requiredHours, setRequiredHours] = useState(String(requirement.required_hours));
  const [requirementType, setRequirementType] = useState<RequirementType>(requirement.requirement_type);
  const [flags, setFlags] = useState(requirement.flags ?? "");
  const [notes, setNotes] = useState(requirement.notes ?? "");

  const hoursNum = Number.parseFloat(requiredHours);
  const hoursValid = Number.isFinite(hoursNum) && hoursNum > 0;
  const dirty =
    hoursNum !== requirement.required_hours ||
    requirementType !== requirement.requirement_type ||
    flags !== (requirement.flags ?? "") ||
    notes !== (requirement.notes ?? "");
  const canSave = dirty && hoursValid && !updateMutation.isPending;

  function handleSubmit(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (!canSave) return;
    clearError();
    const body: HourRequirementUpdate = {
      required_hours: hoursNum,
      requirement_type: requirementType,
      flags: flags.trim() || null,
      notes: notes.trim() || null
    };
    updateMutation.mutate(
      { processId, requirementId: requirement.id, body },
      { onSuccess: () => onDone(), onError: setError }
    );
  }

  return (
    <FormPanelShell formAttr="requirement" mode="edit" onSubmit={handleSubmit}>
      <FormGrid>
        <SelectField
          field="teaching-group"
          label={dict.field.classroom}
          value={requirement.teaching_group_id}
          options={[
            { value: requirement.teaching_group_id, label: classroomLabel || dict.field.classroom }
          ]}
          disabled
          onChange={() => undefined}
        />
        <SelectField
          field="subject"
          label={dict.field.subject}
          value={requirement.subject_id}
          options={[
            { value: requirement.subject_id, label: subjectName || dict.field.subject }
          ]}
          disabled
          onChange={() => undefined}
        />
        <TextField
          field="required-hours"
          id="requirement-edit-hours"
          label={dict.field.requiredHours}
          onChange={setRequiredHours}
          value={requiredHours}
          type="number"
          mapped={mapped}
          fieldErrorKey="requiredHours"
        />
        <SelectField
          field="requirement-type"
          label={dict.field.requirementType}
          value={requirementType}
          placeholder={dict.field.requirementType}
          options={REQUIREMENT_TYPES.map((value) => ({ value, label: value }))}
          onChange={(value) => setRequirementType(value as RequirementType)}
        />
        <TextField
          field="flags"
          id="requirement-edit-flags"
          label={dict.field.flags}
          maxLength={500}
          onChange={setFlags}
          value={flags}
        />
        <TextField
          field="notes"
          id="requirement-edit-notes"
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