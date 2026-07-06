import { formatRepartoMessage } from "../../../../i18n/index.js";
import { ConfirmDelete, useMappedError, type Dict } from "../shared.js";
import { useDeleteRepartoAssignment } from "../../../hooks.js";
import type { AssignmentPublic } from "../../../../schemas.js";

export type AssignmentDeleteProps = {
  dict: Dict;
  processId: string;
  assignment: AssignmentPublic;
  requirementLabel: string;
  participantName: string;
  onDone: () => void;
};

export function AssignmentDelete({
  dict,
  processId,
  assignment,
  requirementLabel,
  participantName,
  onDone
}: AssignmentDeleteProps) {
  const deleteMutation = useDeleteRepartoAssignment();
  const [mapped, setError, clear] = useMappedError();
  const recordName = `${requirementLabel} · ${participantName}`;

  function handleConfirm() {
    clear();
    deleteMutation.mutate(
      { processId, assignmentId: assignment.id },
      { onSuccess: () => onDone(), onError: setError }
    );
  }

  const title = formatRepartoMessage(dict.confirm.delete.title, {
    entity: dict.entity.assignment.singular.toLowerCase()
  });
  const body = formatRepartoMessage(dict.confirm.delete.body, { name: recordName });

  return (
    <ConfirmDelete
      deleteFormAttr="assignment-delete-confirm"
      title={title}
      body={body}
      proceedLabel={dict.confirm.delete.proceed}
      cancelLabel={dict.confirm.cancel}
      isPending={deleteMutation.isPending}
      mapped={mapped}
      onConfirm={handleConfirm}
      onCancel={onDone}
    />
  );
}