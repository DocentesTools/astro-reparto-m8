import { formatRepartoMessage } from "../../../../i18n/index.js";
import { ConfirmDelete, useMappedError, type Dict } from "../shared.js";
import { useDeleteRepartoHourRequirement } from "../../../hooks.js";
import type { HourRequirementPublic } from "../../../../schemas.js";

export type RequirementDeleteProps = {
  dict: Dict;
  processId: string;
  requirement: HourRequirementPublic;
  classroomLabel: string;
  subjectName: string;
  onDone: () => void;
};

export function RequirementDelete({
  dict,
  processId,
  requirement,
  classroomLabel,
  subjectName,
  onDone
}: RequirementDeleteProps) {
  const deleteMutation = useDeleteRepartoHourRequirement();
  const [mapped, setError, clear] = useMappedError();
  const recordName = `${classroomLabel} · ${subjectName}`;

  function handleConfirm() {
    clear();
    deleteMutation.mutate(
      { processId, requirementId: requirement.id },
      { onSuccess: () => onDone(), onError: setError }
    );
  }

  const title = formatRepartoMessage(dict.confirm.delete.title, {
    entity: dict.entity.hourRequirement.singular.toLowerCase()
  });
  const body = formatRepartoMessage(dict.confirm.delete.body, { name: recordName });

  return (
    <ConfirmDelete
      deleteFormAttr="requirement-delete-confirm"
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