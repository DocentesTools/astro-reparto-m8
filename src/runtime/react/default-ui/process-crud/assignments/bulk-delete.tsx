import { formatRepartoMessage } from "../../../../i18n/index.js";
import type { AssignmentPublic } from "../../../../schemas.js";
import { useDeleteRepartoAssignment } from "../../../hooks.js";
import { repartoToast } from "../../../ui/toast-notification.js";
import { EntityDeleteDialog, useMappedError, type Dict } from "../shared.js";

export type AssignmentBulkDeleteProps = {
  dict: Dict;
  assignments: AssignmentPublic[];
  processId: string;
  onDone: () => void;
};

export function AssignmentBulkDelete({
  dict,
  assignments,
  processId,
  onDone
}: AssignmentBulkDeleteProps) {
  const deleteMutation = useDeleteRepartoAssignment();
  const [mapped, setError, clear] = useMappedError();
  const count = assignments.length;

  async function handleConfirm() {
    clear();
    try {
      await Promise.all(assignments.map((assignment) => deleteMutation.mutateAsync({
        processId,
        assignmentId: assignment.id
      })));
      repartoToast.success(formatRepartoMessage(dict.assignmentSelection.deleted, { count }));
      onDone();
    } catch (error) {
      setError(error);
      repartoToast.error(
        dict.assignmentSelection.deleteError,
        error instanceof Error ? error.message : undefined
      );
    }
  }

  return (
    <EntityDeleteDialog
      body={formatRepartoMessage(dict.assignmentSelection.deleteBody, { count })}
      cancelLabel={dict.confirm.cancel}
      isPending={deleteMutation.isPending}
      mapped={mapped}
      onClose={onDone}
      onConfirm={() => { void handleConfirm(); }}
      proceedLabel={dict.confirm.delete.proceed}
      title={dict.assignmentSelection.deleteTitle}
    />
  );
}
