import type { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "../../../ui/dialog.js";

export type ClassroomDialogShellProps = {
  children: ReactNode;
  description?: string;
  dialogId: string;
  onClose: () => void;
  title: string;
};

export function ClassroomDialogShell({
  children,
  description,
  dialogId,
  onClose,
  title
}: ClassroomDialogShellProps) {
  return (
    <Dialog onOpenChange={(open) => { if (!open) onClose(); }} open>
      <DialogContent closeLabel={title}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div data-reparto-dialog={dialogId}>{children}</div>
      </DialogContent>
    </Dialog>
  );
}
