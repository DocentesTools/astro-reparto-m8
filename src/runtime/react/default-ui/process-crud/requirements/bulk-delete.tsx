import { formatRepartoMessage } from "../../../../i18n/index.js";
import type { HourRequirementPublic } from "../../../../schemas.js";
import { useDeleteRepartoHourRequirement } from "../../../hooks.js";
import { repartoToast } from "../../../ui/toast-notification.js";
import { EntityDeleteDialog, useMappedError, type Dict } from "../shared.js";

export type RequirementBulkDeleteProps = {
  dict: Dict;
  requirements: HourRequirementPublic[];
  processId: string;
  onDone: () => void;
};

export function RequirementBulkDelete({
  dict,
  requirements,
  processId,
  onDone
}: RequirementBulkDeleteProps) {
  const deleteMutation = useDeleteRepartoHourRequirement();
  const [mapped, setError, clear] = useMappedError();
  const count = requirements.length;

  async function handleConfirm() {
    clear();
    try {
      await Promise.all(requirements.map((requirement) => deleteMutation.mutateAsync({
        processId,
        requirementId: requirement.id
      })));
      repartoToast.success(formatRepartoMessage(dict.requirementSelection.deleted, { count }));
      onDone();
    } catch (error) {
      setError(error);
      repartoToast.error(
        dict.requirementSelection.deleteError,
        error instanceof Error ? error.message : undefined
      );
    }
  }

  return (
    <EntityDeleteDialog
      body={formatRepartoMessage(dict.requirementSelection.deleteBody, { count })}
      cancelLabel={dict.confirm.cancel}
      isPending={deleteMutation.isPending}
      mapped={mapped}
      onClose={onDone}
      onConfirm={() => { void handleConfirm(); }}
      proceedLabel={dict.confirm.delete.proceed}
      title={dict.requirementSelection.deleteTitle}
    />
  );
}
