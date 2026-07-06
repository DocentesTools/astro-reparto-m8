import { formatRepartoMessage } from "../../../../i18n/index.js";
import { ConfirmDelete, useMappedError, type Dict } from "../shared.js";
import { useDeleteRepartoSubject } from "../../../hooks.js";
import type { SubjectPublic } from "../../../../schemas.js";

export type SubjectDeleteProps = {
  dict: Dict;
  processId: string;
  subject: SubjectPublic;
  onDone: () => void;
};

export function SubjectDelete({ dict, processId, subject, onDone }: SubjectDeleteProps) {
  const deleteMutation = useDeleteRepartoSubject();
  const [mapped, setError, clear] = useMappedError();

  function handleConfirm() {
    clear();
    deleteMutation.mutate(
      { processId, subjectId: subject.id },
      { onSuccess: () => onDone(), onError: setError }
    );
  }

  const title = formatRepartoMessage(dict.confirm.delete.title, {
    entity: dict.entity.subject.singular.toLowerCase()
  });
  const body = formatRepartoMessage(dict.confirm.delete.body, {
    name: subject.name
  });

  return (
    <ConfirmDelete
      deleteFormAttr="subject-delete-confirm"
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