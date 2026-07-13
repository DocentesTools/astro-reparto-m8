import { formatRepartoMessage } from "../../../../i18n/index.js";
import type { SubjectPublic } from "../../../../schemas.js";
import { useDeleteRepartoSubject } from "../../../hooks.js";
import { repartoToast } from "../../../ui/toast-notification.js";
import { EntityDeleteDialog, useMappedError, type Dict } from "../shared.js";

export type SubjectBulkDeleteProps = {
  dict: Dict;
  subjects: SubjectPublic[];
  processId: string;
  onDone: () => void;
};

export function SubjectBulkDelete({
  dict,
  subjects,
  processId,
  onDone
}: SubjectBulkDeleteProps) {
  const deleteMutation = useDeleteRepartoSubject();
  const [mapped, setError, clear] = useMappedError();
  const count = subjects.length;

  async function handleConfirm() {
    clear();
    try {
      await Promise.all(subjects.map((subject) => deleteMutation.mutateAsync({
        processId,
        subjectId: subject.id
      })));
      repartoToast.success(formatRepartoMessage(dict.subjectSelection.deleted, { count }));
      onDone();
    } catch (error) {
      setError(error);
      repartoToast.error(
        dict.subjectSelection.deleteError,
        error instanceof Error ? error.message : undefined
      );
    }
  }

  return (
    <EntityDeleteDialog
      body={formatRepartoMessage(dict.subjectSelection.deleteBody, { count })}
      cancelLabel={dict.confirm.cancel}
      isPending={deleteMutation.isPending}
      mapped={mapped}
      onClose={onDone}
      onConfirm={() => { void handleConfirm(); }}
      proceedLabel={dict.confirm.delete.proceed}
      title={dict.subjectSelection.deleteTitle}
    />
  );
}
