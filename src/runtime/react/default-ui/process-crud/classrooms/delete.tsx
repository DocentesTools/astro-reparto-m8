import { formatRepartoMessage } from "../../../../i18n/index.js";
import { RepartoFormError, useMappedError, type Dict } from "../shared.js";
import { useDeleteRepartoTeachingGroup } from "../../../hooks.js";
import type { TeachingGroupPublic } from "../../../../schemas.js";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "../../../ui/alert-dialog.js";

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
    <AlertDialog onOpenChange={(open) => { if (!open) onDone(); }} open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{body}</AlertDialogDescription>
        </AlertDialogHeader>
        <RepartoFormError mapped={mapped} />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>{dict.confirm.cancel}</AlertDialogCancel>
          <AlertDialogAction disabled={deleteMutation.isPending} onClick={handleConfirm}>{dict.confirm.delete.proceed}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
