import { formatRepartoMessage } from "../../../../i18n/index.js";
import type { TeachingGroupPublic } from "../../../../schemas.js";
import { useDeleteRepartoTeachingGroup } from "../../../hooks.js";
import { repartoToast } from "../../../ui/toast-notification.js";
import { EntityDeleteDialog, useMappedError, type Dict } from "../shared.js";

export type TeachingGroupBulkDeleteProps = {
  dict: Dict;
  groups: TeachingGroupPublic[];
  processId: string;
  onDone: () => void;
};

export function TeachingGroupBulkDelete({
  dict,
  groups,
  processId,
  onDone
}: TeachingGroupBulkDeleteProps) {
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
      repartoToast.success(formatRepartoMessage(dict.teachingGroupSelection.deleted, { count }));
      onDone();
    } catch (error) {
      setError(error);
      repartoToast.error(
        dict.teachingGroupSelection.deleteError,
        error instanceof Error ? error.message : undefined
      );
    }
  }

  return (
    <EntityDeleteDialog
      body={formatRepartoMessage(dict.teachingGroupSelection.deleteBody, { count })}
      cancelLabel={dict.confirm.cancel}
      isPending={deleteMutation.isPending}
      mapped={mapped}
      onClose={onDone}
      onConfirm={() => { void handleConfirm(); }}
      proceedLabel={dict.confirm.delete.proceed}
      title={dict.teachingGroupSelection.deleteTitle}
    />
  );
}
