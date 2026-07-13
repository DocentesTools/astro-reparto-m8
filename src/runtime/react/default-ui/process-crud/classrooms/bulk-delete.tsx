import { formatRepartoMessage } from "../../../../i18n/index.js";
import type { TeachingGroupPublic } from "../../../../schemas.js";
import { useDeleteRepartoTeachingGroup } from "../../../hooks.js";
import { repartoToast } from "../../../ui/toast-notification.js";
import { EntityDeleteDialog, useMappedError, type Dict } from "../shared.js";

export type ClassroomBulkDeleteProps = {
  dict: Dict;
  groups: TeachingGroupPublic[];
  processId: string;
  onDone: () => void;
};

export function ClassroomBulkDelete({
  dict,
  groups,
  processId,
  onDone
}: ClassroomBulkDeleteProps) {
  const deleteMutation = useDeleteRepartoTeachingGroup();
  const [mapped, setError, clear] = useMappedError();
  const count = groups.length;

  async function handleConfirm() {
    clear();
    try {
      await Promise.all(groups.map((group) => deleteMutation.mutateAsync({
        processId,
        groupId: group.id
      })));
      repartoToast.success(formatRepartoMessage(dict.classroomSelection.deleted, { count }));
      onDone();
    } catch (error) {
      setError(error);
      repartoToast.error(
        dict.classroomSelection.deleteError,
        error instanceof Error ? error.message : undefined
      );
    }
  }

  return (
    <EntityDeleteDialog
      body={formatRepartoMessage(dict.classroomSelection.deleteBody, { count })}
      cancelLabel={dict.confirm.cancel}
      isPending={deleteMutation.isPending}
      mapped={mapped}
      onClose={onDone}
      onConfirm={() => { void handleConfirm(); }}
      proceedLabel={dict.confirm.delete.proceed}
      title={dict.classroomSelection.deleteTitle}
    />
  );
}
