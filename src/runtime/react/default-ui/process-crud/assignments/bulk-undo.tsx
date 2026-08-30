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

export type AssignmentBulkUndoProps = {
  dict: Dict;
  processId: string;
  assignments: AssignmentPublic[];
  requirementLabel: (id: string) => string;
  onDone: (undoneIds: string[]) => void;
};

/**
 * Undo several assignments that share one reason.
 *
 * The reason is mandatory per assignment, but typing the same sentence a dozen
 * times is not what that rule is for: one reason is collected here and recorded
 * on every row, so the audit trail still explains each cancellation.
 *
 * Deliberately **sequential and fail-stop**, unlike the parallel bulk delete it
 * replaces. Each undo releases a slot and re-enters a meeting turn, so the rows
 * are not independent: firing them together would race the turn recomputation,
 * and continuing past a refusal would leave a half-applied change nobody asked
 * for. The dialog reports how many were undone before it stopped, and the rows
 * already undone stay undone — they are recorded, not rolled back.
 */
export function AssignmentBulkUndo({
  dict,
  processId,
  assignments,
  requirementLabel,
  onDone
}: AssignmentBulkUndoProps) {
  const undoMutation = useUndoRepartoAssignment();
  const [mapped, setError, clearError] = useMappedError();
  const [reason, setReason] = useState("");
  const [running, setRunning] = useState(false);

  const count = assignments.length;
  const trimmedReason = reason.trim();
  const canSave = trimmedReason.length > 0 && count > 0 && !running;

  async function handleSubmit(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (!canSave) return;
    clearError();
    setRunning(true);
    const undone: string[] = [];
    try {
      for (const assignment of assignments) {
        await undoMutation.mutateAsync({
          processId,
          assignmentId: assignment.id,
          body: { reason: trimmedReason }
        });
        undone.push(assignment.id);
      }
      repartoToast.success(
        formatRepartoMessage(dict.assignments.bulkUndone, { count: undone.length })
      );
      onDone(undone);
    } catch (error) {
      setError(error);
      repartoToast.error(
        formatRepartoMessage(dict.assignments.bulkUndoError, {
          done: undone.length,
          total: count
        }),
        error instanceof Error ? error.message : undefined
      );
      // Keep the rows that did go through out of the selection: they are
      // cancelled now, and retrying them would answer 409.
      onDone(undone);
    } finally {
      setRunning(false);
    }
  }

  return (
    <EntityDialogShell
      description={assignments
        .map((assignment) => requirementLabel(assignment.hour_requirement_id))
        .join(" · ")}
      dialogId="assignment-bulk-undo"
      onClose={() => onDone([])}
      title={dict.assignments.bulkUndoTitle}
    >
      <FormPanelShell
        formAttr="assignment-bulk-undo"
        mode="edit"
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
      >
        <FormGrid>
          <p data-reparto-slot="confirm-body">
            {formatRepartoMessage(dict.assignments.bulkUndoBody, { count })}
          </p>
          <TextField
            field="reason"
            fieldErrorKey="reason"
            id="assignment-bulk-undo-reason"
            label={dict.field.reason}
            mapped={mapped}
            maxLength={500}
            onChange={setReason}
            value={reason}
          />
          <SaveCancelRow
            canSave={canSave}
            cancelLabel={dict.confirm.cancel}
            isPending={running}
            mapped={mapped}
            onCancel={() => onDone([])}
            onSubmit={() => {
              void handleSubmit({ preventDefault: () => undefined });
            }}
            saveLabel={formatRepartoMessage(dict.assignments.bulkUndoConfirm, {
              count
            })}
          />
        </FormGrid>
      </FormPanelShell>
    </EntityDialogShell>
  );
}
