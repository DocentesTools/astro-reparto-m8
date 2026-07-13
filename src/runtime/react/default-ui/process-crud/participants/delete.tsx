import { formatRepartoMessage } from "../../../../i18n/index.js";
import { EntityDeleteDialog, useMappedError, type Dict } from "../shared.js";
import { useDeleteRepartoProcessTeacher } from "../../../hooks.js";
import type { ProcessTeacherPublic } from "../../../../schemas.js";

export type ParticipantDeleteProps = {
  dict: Dict;
  processId: string;
  participant: ProcessTeacherPublic;
  teacherName: string;
  onDone: () => void;
};

export function ParticipantDelete({
  dict,
  processId,
  participant,
  teacherName,
  onDone
}: ParticipantDeleteProps) {
  const deleteMutation = useDeleteRepartoProcessTeacher();
  const [mapped, setError, clear] = useMappedError();

  function handleConfirm() {
    clear();
    deleteMutation.mutate(
      { processId, processTeacherId: participant.id },
      { onSuccess: () => onDone(), onError: setError }
    );
  }

  const title = formatRepartoMessage(dict.confirm.delete.title, {
    entity: dict.entity.processParticipant.singular.toLowerCase()
  });
  const body = formatRepartoMessage(dict.confirm.delete.body, { name: teacherName });

  return (
    <EntityDeleteDialog
      title={title}
      body={body}
      proceedLabel={dict.confirm.delete.proceed}
      cancelLabel={dict.confirm.cancel}
      isPending={deleteMutation.isPending}
      mapped={mapped}
      onConfirm={handleConfirm}
      onClose={onDone}
    />
  );
}