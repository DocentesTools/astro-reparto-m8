import { useState } from "react";

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
import { useReassignRepartoAssignment } from "../../../hooks.js";
import { repartoToast } from "../../../ui/toast-notification.js";
import type { AssignmentPublic } from "../../../../schemas.js";
import type { AssignmentTeacherOption } from "../../../../ui/assignments.js";

export type AssignmentReassignDialogProps = {
  dict: Dict;
  processId: string;
  assignment: AssignmentPublic;
  candidates: AssignmentTeacherOption[];
  requirementLabel: string;
  participantName: (id: string) => string;
  onDone: () => void;
};

/**
 * Move one live slot to another participant.
 *
 * Reassignment is a single atomic service action, not a cancel followed by an
 * assign, so the dialog offers the replacement and the reason together. The
 * candidate list already excludes the current holder and everyone the slot
 * cannot legally go to; the released row is not counted against the candidates'
 * own activity occupancy, because it is released in the same transaction.
 */
export function AssignmentReassignDialog({
  dict,
  processId,
  assignment,
  candidates,
  requirementLabel,
  participantName,
  onDone
}: AssignmentReassignDialogProps) {
  const reassignMutation = useReassignRepartoAssignment();
  const [mapped, setError, clearError] = useMappedError();
  const [processTeacherId, setProcessTeacherId] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const eligible = candidates.filter((candidate) => candidate.canAssign);
  const candidatesEmpty = eligible.length === 0;
  const trimmedReason = reason.trim();
  const canSave =
    processTeacherId !== "" &&
    trimmedReason.length > 0 &&
    !reassignMutation.isPending;

  function handleSubmit(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (!canSave) return;
    clearError();
    reassignMutation.mutate(
      {
        processId,
        assignmentId: assignment.id,
        body: {
          process_teacher_id: processTeacherId,
          reason: trimmedReason,
          notes: notes.trim() || null
        }
      },
      {
        onSuccess: () => {
          repartoToast.success(dict.assignments.reassigned);
          onDone();
        },
        onError: (error) => {
          setError(error);
          repartoToast.error(
            dict.assignments.reassignError,
            error instanceof Error ? error.message : undefined
          );
        }
      }
    );
  }

  return (
    <EntityDialogShell
      description={`${requirementLabel} · ${participantName(
        assignment.process_teacher_id
      )}`}
      dialogId="assignment-reassign"
      onClose={onDone}
      title={dict.assignments.reassignTitle}
    >
      <FormPanelShell
        formAttr="assignment-reassign"
        mode="edit"
        onSubmit={handleSubmit}
      >
        <FormGrid>
          <p data-reparto-slot="confirm-body">
            {formatRepartoMessage(dict.assignments.reassignBody, {
              slot: requirementLabel,
              teacher: participantName(assignment.process_teacher_id)
            })}
          </p>
          <SelectField
            disabled={candidatesEmpty}
            disabledReason={
              candidatesEmpty ? dict.assignments.noEligibleTeachers : null
            }
            field="process-teacher"
            fieldErrorKey="processParticipant"
            label={dict.assignments.replacement}
            mapped={mapped}
            onChange={setProcessTeacherId}
            options={eligible.map((candidate) => ({
              value: candidate.processTeacherId,
              label: participantName(candidate.processTeacherId)
            }))}
            placeholder={dict.assignments.replacement}
            value={processTeacherId}
          />
          <TextField
            field="reason"
            fieldErrorKey="reason"
            id="assignment-reassign-reason"
            label={dict.field.reason}
            mapped={mapped}
            maxLength={500}
            onChange={setReason}
            value={reason}
          />
          <TextField
            field="notes"
            id="assignment-reassign-notes"
            label={dict.field.notes}
            maxLength={1000}
            onChange={setNotes}
            value={notes}
          />
          <SaveCancelRow
            canSave={canSave}
            cancelLabel={dict.confirm.cancel}
            isPending={reassignMutation.isPending}
            mapped={mapped}
            onCancel={onDone}
            onSubmit={() => handleSubmit({ preventDefault: () => undefined })}
            saveLabel={dict.assignments.reassignConfirm}
          />
        </FormGrid>
      </FormPanelShell>
    </EntityDialogShell>
  );
}
