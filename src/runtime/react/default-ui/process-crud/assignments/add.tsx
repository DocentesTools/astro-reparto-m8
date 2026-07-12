import { useState } from "react";

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
import {
  useCreateRepartoAssignment,
  useRepartoHourRequirements,
  useRepartoProcessTeachers
} from "../../../hooks.js";
import type {
  AssignmentCreate,
  AssignmentType
} from "../../../../schemas.js";

const ASSIGNMENT_TYPES: AssignmentType[] = [
  "main",
  "shared",
  "reinforcement",
  "split_group",
  "other"
];

export type AssignmentAddProps = {
  dict: Dict;
  processId: string;
  requirementsHref: string;
  participantsHref: string;
  requirementLabel: (id: string) => string;
  participantName: (id: string) => string;
  onDone: () => void;
};

export function AssignmentAdd({
  dict,
  processId,
  requirementsHref,
  participantsHref,
  requirementLabel,
  participantName,
  onDone
}: AssignmentAddProps) {
  const createMutation = useCreateRepartoAssignment();
  const requirementsQuery = useRepartoHourRequirements(processId);
  const participantsQuery = useRepartoProcessTeachers(processId);
  const requirements = requirementsQuery.data?.data ?? [];
  const participants = participantsQuery.data?.data ?? [];

  const [mapped, setError, clearError] = useMappedError();
  const [hourRequirementId, setHourRequirementId] = useState("");
  const [processTeacherId, setProcessTeacherId] = useState("");
  const [assignedHours, setAssignedHours] = useState("");
  const [assignmentType, setAssignmentType] = useState<AssignmentType | "">("");
  const [overrideReason, setOverrideReason] = useState("");
  const [notes, setNotes] = useState("");

  const hoursNum = Number.parseFloat(assignedHours);
  const hoursValid = Number.isFinite(hoursNum) && hoursNum > 0;
  const canSave =
    hourRequirementId.trim() !== "" &&
    processTeacherId.trim() !== "" &&
    hoursValid &&
    !createMutation.isPending;

  function handleSubmit(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (!canSave) return;
    clearError();
    const body: AssignmentCreate = {
      assignment_process_id: processId,
      hour_requirement_id: hourRequirementId,
      process_teacher_id: processTeacherId,
      assigned_hours: hoursNum,
      assignment_type: assignmentType || undefined,
      source: "department_head",
      status: "draft",
      override_reason: overrideReason.trim() || null,
      notes: notes.trim() || null
    };
    createMutation.mutate(
      { processId, body },
      { onSuccess: () => onDone(), onError: setError }
    );
  }

  const requirementsEmpty = requirements.length === 0;
  const participantsEmpty = participants.length === 0;

  return (
    <EntityDialogShell
      description={dict.entity.assignment.plural}
      dialogId="assignment-create"
      onClose={onDone}
      title={`${dict.action.create} ${dict.entity.assignment.singular.toLowerCase()}`}
    >
    <FormPanelShell formAttr="assignment" mode="create" onSubmit={handleSubmit}>
      <FormGrid>
        <SelectField
          field="hour-requirement"
          fieldErrorKey="hourRequirement"
          label={dict.field.hourRequirement}
          value={hourRequirementId}
          placeholder={dict.field.hourRequirement}
          options={requirements.map((r) => ({
            value: r.id,
            label: requirementLabel(r.id)
          }))}
          disabled={requirementsEmpty}
          disabledReason={requirementsEmpty ? dict.disabled.noData : null}
          missingPrereqHref={requirementsEmpty ? requirementsHref : undefined}
          missingPrereqLabel={requirementsEmpty ? dict.picker.createMissingPrerequisite : undefined}
          onChange={setHourRequirementId}
          mapped={mapped}
        />
        <SelectField
          field="process-teacher"
          fieldErrorKey="processParticipant"
          label={dict.field.processParticipant}
          value={processTeacherId}
          placeholder={dict.field.processParticipant}
          options={participants.map((p) => ({
            value: p.id,
            label: participantName(p.id)
          }))}
          disabled={participantsEmpty}
          disabledReason={participantsEmpty ? dict.disabled.noData : null}
          missingPrereqHref={participantsEmpty ? participantsHref : undefined}
          missingPrereqLabel={participantsEmpty ? dict.picker.createMissingPrerequisite : undefined}
          onChange={setProcessTeacherId}
          mapped={mapped}
        />
        <TextField
          field="assigned-hours"
          id="assignment-add-hours"
          label={dict.field.assignedHours}
          onChange={setAssignedHours}
          value={assignedHours}
          type="number"
          mapped={mapped}
          fieldErrorKey="assignedHours"
        />
        <SelectField
          field="assignment-type"
          label={dict.field.assignmentType}
          value={assignmentType}
          placeholder={dict.field.assignmentType}
          options={ASSIGNMENT_TYPES.map((value) => ({ value, label: dict.option.assignmentType[value] }))}
          onChange={(value) => setAssignmentType(value as AssignmentType)}
        />
        <TextField
          field="override-reason"
          id="assignment-add-override"
          label={dict.field.overrideReason}
          maxLength={500}
          onChange={setOverrideReason}
          value={overrideReason}
          fieldErrorKey="overrideReason"
          mapped={mapped}
        />
        <TextField
          field="notes"
          id="assignment-add-notes"
          label={dict.field.notes}
          maxLength={2000}
          onChange={setNotes}
          value={notes}
        />
        <SaveCancelRow
          canSave={canSave}
          isPending={createMutation.isPending}
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
