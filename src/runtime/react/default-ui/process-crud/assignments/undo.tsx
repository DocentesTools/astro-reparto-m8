import { useState } from "react";

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
import { useUndoRepartoAssignment } from "../../../hooks.js";
import { repartoToast } from "../../../ui/toast-notification.js";
import type { AssignmentPublic } from "../../../../schemas.js";

export type AssignmentUndoDialogProps = {
  dict: Dict;
  processId: string;
  assignment: AssignmentPublic;
  requirementLabel: string;
  participantName: string;
  onDone: () => void;
};

/**
 * Undo a live assignment.
 *
 * This is the only cancellation path the board offers, and it cannot be taken
 * without a reason: the service records the undo, releases the slot and
 * re-enters the teacher's completed meeting turn, so a reasonless "delete"
 * would leave an unexplained change in the audit trail and in the turn queue.
 * The confirmation names both consequences rather than asking "are you sure?".
 */
export function AssignmentUndoDialog({
  dict,
  processId,
  assignment,
  requirementLabel,
  participantName,
  onDone
}: AssignmentUndoDialogProps) {
  const undoMutation = useUndoRepartoAssignment();
  const [mapped, setError, clearError] = useMappedError();
  const [reason, setReason] = useState("");

  const trimmedReason = reason.trim();
  const canSave = trimmedReason.length > 0 && !undoMutation.isPending;

  function handleSubmit(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (!canSave) return;
    clearError();
    undoMutation.mutate(
      { processId, assignmentId: assignment.id, body: { reason: trimmedReason } },
      {
        onSuccess: () => {
          repartoToast.success(dict.assignments.undone);
          onDone();
        },
        onError: (error) => {
          setError(error);
          repartoToast.error(
            dict.assignments.undoError,
            error instanceof Error ? error.message : undefined
          );
        }
      }
    );
  }

  return (
    <EntityDialogShell
      description={`${requirementLabel} · ${participantName}`}
      dialogId="assignment-undo"
      onClose={onDone}
      title={dict.assignments.undoTitle}
    >
      <FormPanelShell formAttr="assignment-undo" mode="edit" onSubmit={handleSubmit}>
        <FormGrid>
          <p data-reparto-slot="confirm-body">
            {formatRepartoMessage(dict.assignments.undoBody, {
              slot: requirementLabel,
              teacher: participantName
            })}
          </p>
          <TextField
            field="reason"
            fieldErrorKey="reason"
            id="assignment-undo-reason"
            label={dict.field.reason}
            mapped={mapped}
            maxLength={500}
            onChange={setReason}
            value={reason}
          />
          <SaveCancelRow
            canSave={canSave}
            cancelLabel={dict.confirm.cancel}
            isPending={undoMutation.isPending}
            mapped={mapped}
            onCancel={onDone}
            onSubmit={() => handleSubmit({ preventDefault: () => undefined })}
            saveLabel={dict.assignments.undoConfirm}
          />
        </FormGrid>
      </FormPanelShell>
    </EntityDialogShell>
  );
}
