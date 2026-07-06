import { formatRepartoMessage } from "../../../../i18n/index.js";
import { ConfirmDelete, useMappedError, type Dict } from "../shared.js";
import { useDeleteRepartoTeachingGroup } from "../../../hooks.js";
import type { TeachingGroupPublic } from "../../../../schemas.js";

export type ClassroomDeleteProps = {
  dict: Dict;
  processId: string;
  group: TeachingGroupPublic;
  onDone: () => void;
};

export function ClassroomDelete({ dict, processId, group, onDone }: ClassroomDeleteProps) {
  const deleteMutation = useDeleteRepartoTeachingGroup();
  const [mapped, setError, clear] = useMappedError();

  function handleConfirm() {
    clear();
    deleteMutation.mutate(
      { processId, groupId: group.id },
      { onSuccess: () => onDone(), onError: setError }
    );
  }

  const title = formatRepartoMessage(dict.confirm.delete.title, {
    entity: dict.entity.classroom.singular.toLowerCase()
  });
  const body = formatRepartoMessage(dict.confirm.delete.body, {
    name: group.label
  });

  return (
    <ConfirmDelete
      deleteFormAttr="classroom-delete-confirm"
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