import { useState } from "react";

import {
  EntityDialogShell,
  FormGrid,
  FormPanelShell,
  SaveCancelRow,
  TextField,
  useMappedError,
  type Dict
} from "../shared.js";
import { useUpdateRepartoAssignment } from "../../../hooks.js";
import type { AssignmentPublic, AssignmentUpdate } from "../../../../schemas.js";

export type AssignmentEditProps = {
  dict: Dict;
  processId: string;
  assignment: AssignmentPublic;
  requirementLabel: string;
  participantName: string;
  onDone: () => void;
};

/**
 * Edit an assignment's notes.
 *
 * Everything else about a live assignment is a decision, not a value: the slot
 * and its hours come from generation, the teacher changes only through the
 * reason-required reassignment action, and cancelling is the undo action. So
 * this dialog carries one field, and the slot/participant are shown as
 * read-only context rather than as disabled selects that suggest they could be
 * changed here.
 */
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
  const [notes, setNotes] = useState(assignment.notes ?? "");

  const dirty = notes !== (assignment.notes ?? "");
  const canSave = dirty && !updateMutation.isPending;

  function handleSubmit(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (!canSave) return;
    clearError();
    const body: AssignmentUpdate = { notes: notes.trim() || null };
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
      title={dict.assignments.notesTitle}
    >
      <FormPanelShell formAttr="assignment" mode="edit" onSubmit={handleSubmit}>
        <FormGrid>
          <dl data-reparto-slot="assignment-context">
            <dt>{dict.field.hourRequirement}</dt>
            <dd data-hour-requirement-id={assignment.hour_requirement_id}>
              {requirementLabel}
            </dd>
            <dt>{dict.field.processParticipant}</dt>
            <dd data-process-teacher-id={assignment.process_teacher_id}>
              {participantName}
            </dd>
          </dl>
          <TextField
            field="notes"
            id="assignment-edit-notes"
            label={dict.field.notes}
            maxLength={1000}
            onChange={setNotes}
            value={notes}
          />
          <SaveCancelRow
            canSave={canSave}
            cancelLabel={dict.action.cancel}
            isPending={updateMutation.isPending}
            mapped={mapped}
            onCancel={onDone}
            onSubmit={() => handleSubmit({ preventDefault: () => undefined })}
            saveLabel={dict.action.save}
          />
        </FormGrid>
      </FormPanelShell>
    </EntityDialogShell>
  );
}
