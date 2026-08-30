import { formatRepartoMessage } from "../../../../i18n/index.js";
import { EntityDeleteDialog, useMappedError, type Dict } from "../shared.js";
import { useDeleteRepartoTeachingGroup } from "../../../hooks.js";
import type { TeachingGroupPublic } from "../../../../schemas.js";

export type TeachingGroupDeleteProps = {
  dict: Dict;
  processId: string;
  group: TeachingGroupPublic;
  onDone: () => void;
};

export function TeachingGroupDelete({ dict, processId, group, onDone }: TeachingGroupDeleteProps) {
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
    entity: dict.entity.teachingGroup.singular.toLowerCase()
  });
  const body = formatRepartoMessage(dict.confirm.delete.body, {
    name: group.label
  });

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
