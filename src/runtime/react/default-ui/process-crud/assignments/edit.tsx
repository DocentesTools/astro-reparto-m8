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
import { useUpdateRepartoAssignment } from "../../../hooks.js";
import type {
  AssignmentPublic,
  AssignmentStatus,
  AssignmentType,
  AssignmentUpdate
} from "../../../../schemas.js";

const ASSIGNMENT_TYPES: AssignmentType[] = [
  "main",
  "shared",
  "reinforcement",
  "split_group",
  "other"
];
const ASSIGNMENT_STATUSES: AssignmentStatus[] = ["draft", "confirmed", "overridden", "cancelled"];

export type AssignmentEditProps = {
  dict: Dict;
  processId: string;
  assignment: AssignmentPublic;
  requirementLabel: string;
  participantName: string;
  onDone: () => void;
};

export function AssignmentEdit({
  dict,
  processId,
  assignment,
  requirementLabel,
  participantName,
  onDone
}: AssignmentEditProps) {
  const updateMutation = useUpdateRepartoAssignment();
  const [mapped, setError, clearError] = useMappedError();
  const [assignedHours, setAssignedHours] = useState(String(assignment.assigned_hours));
  const [assignmentType, setAssignmentType] = useState<AssignmentType | "">(assignment.assignment_type ?? "");
  const [status, setStatus] = useState<AssignmentStatus>(assignment.status ?? "draft");
  const [overrideReason, setOverrideReason] = useState(assignment.override_reason ?? "");
  const [notes, setNotes] = useState(assignment.notes ?? "");

  const hoursNum = Number.parseFloat(assignedHours);
  const hoursValid = Number.isFinite(hoursNum) && hoursNum > 0;
  const dirty =
    hoursNum !== assignment.assigned_hours ||
    assignmentType !== (assignment.assignment_type ?? "") ||
    status !== assignment.status ||
    overrideReason !== (assignment.override_reason ?? "") ||
    notes !== (assignment.notes ?? "");
  const canSave = dirty && hoursValid && !updateMutation.isPending;

  function handleSubmit(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (!canSave) return;
    clearError();
    const body: AssignmentUpdate = {
      assigned_hours: hoursNum,
      assignment_type: assignmentType || undefined,
      status,
      override_reason: overrideReason.trim() || null,
      notes: notes.trim() || null
    };
    updateMutation.mutate(
      { processId, assignmentId: assignment.id, body },
      { onSuccess: () => onDone(), onError: setError }
    );
  }

  return (
    <EntityDialogShell
      description={`${requirementLabel} · ${participantName}`}
      dialogId="assignment-edit"
      onClose={onDone}
      title={`${dict.action.edit} ${dict.entity.assignment.singular.toLowerCase()}`}
    >
    <FormPanelShell formAttr="assignment" mode="edit" onSubmit={handleSubmit}>
      <FormGrid>
        <SelectField
          field="hour-requirement"
          label={dict.field.hourRequirement}
          value={assignment.hour_requirement_id}
          options={[{ value: assignment.hour_requirement_id, label: requirementLabel || dict.field.hourRequirement }]}
          disabled
          onChange={() => undefined}
        />
        <SelectField
          field="process-teacher"
          label={dict.field.processParticipant}
          value={assignment.process_teacher_id}
          options={[{ value: assignment.process_teacher_id, label: participantName || dict.field.processParticipant }]}
          disabled
          onChange={() => undefined}
        />
        <TextField
          field="assigned-hours"
          id="assignment-edit-hours"
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
        <SelectField
          field="status"
          label={dict.field.status}
          value={status}
          options={ASSIGNMENT_STATUSES.map((value) => ({ value, label: dict.entity.assignment.status[value] }))}
          onChange={(value) => setStatus(value as AssignmentStatus)}
        />
        <TextField
          field="override-reason"
          id="assignment-edit-override"
          label={dict.field.overrideReason}
          maxLength={500}
          onChange={setOverrideReason}
          value={overrideReason}
          fieldErrorKey="overrideReason"
          mapped={mapped}
        />
        <TextField
          field="notes"
          id="assignment-edit-notes"
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
    </EntityDialogShell>
  );
}
