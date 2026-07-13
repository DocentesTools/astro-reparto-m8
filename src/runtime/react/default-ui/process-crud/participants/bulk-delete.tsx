import { formatRepartoMessage } from "../../../../i18n/index.js";
import type { ProcessTeacherPublic } from "../../../../schemas.js";
import { useDeleteRepartoProcessTeacher } from "../../../hooks.js";
import { repartoToast } from "../../../ui/toast-notification.js";
import { EntityDeleteDialog, useMappedError, type Dict } from "../shared.js";

export type ParticipantBulkDeleteProps = {
  dict: Dict;
  participants: ProcessTeacherPublic[];
  processId: string;
  onDone: () => void;
};

export function ParticipantBulkDelete({
  dict,
  participants,
  processId,
  onDone
}: ParticipantBulkDeleteProps) {
  const deleteMutation = useDeleteRepartoProcessTeacher();
  const [mapped, setError, clear] = useMappedError();
  const count = participants.length;

  async function handleConfirm() {
    clear();
    try {
      await Promise.all(participants.map((participant) => deleteMutation.mutateAsync({
        processId,
        processTeacherId: participant.id
      })));
      repartoToast.success(formatRepartoMessage(dict.participantSelection.deleted, { count }));
      onDone();
    } catch (error) {
      setError(error);
      repartoToast.error(
        dict.participantSelection.deleteError,
        error instanceof Error ? error.message : undefined
      );
    }
  }

  return (
    <EntityDeleteDialog
      body={formatRepartoMessage(dict.participantSelection.deleteBody, { count })}
      cancelLabel={dict.confirm.cancel}
      isPending={deleteMutation.isPending}
      mapped={mapped}
      onClose={onDone}
      onConfirm={() => { void handleConfirm(); }}
      proceedLabel={dict.confirm.delete.proceed}
      title={dict.participantSelection.deleteTitle}
    />
  );
}
