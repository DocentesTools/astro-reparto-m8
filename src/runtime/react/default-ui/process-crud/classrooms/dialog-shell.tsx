import type { ReactNode } from "react";

import { repartoButtonClass } from "../../../styles.js";

export type ClassroomDialogShellProps = {
  children: ReactNode;
  description?: string;
  dialogId: string;
  hideHeader?: boolean;
  onClose: () => void;
  title: string;
  variant?: "dialog" | "alertdialog";
};

export function ClassroomDialogShell({
  children,
  description,
  dialogId,
  hideHeader = false,
  onClose,
  title,
  variant = "dialog"
}: ClassroomDialogShellProps) {
  const titleId = `${dialogId}-title`;
  const descriptionId = description ? `${dialogId}-description` : undefined;

  return (
    <div
      aria-describedby={descriptionId}
      aria-label={hideHeader ? title : undefined}
      aria-labelledby={hideHeader ? undefined : titleId}
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6"
      data-reparto-dialog={dialogId}
      role={variant}
    >
      <button
        aria-label={title}
        className="fixed inset-0 cursor-default bg-black/70 backdrop-blur-sm"
        data-reparto-dialog-dismiss="backdrop"
        onClick={onClose}
        type="button"
      />
      <section className="relative z-10 my-auto w-full max-w-2xl rounded-lg border bg-card p-5 text-card-foreground shadow-2xl sm:p-6">
        {hideHeader ? null : (
          <header className="mb-4 space-y-1 pr-12">
            <h2 className="text-lg font-semibold" id={titleId}>{title}</h2>
            {description ? (
              <p className="text-sm text-muted-foreground" id={descriptionId}>{description}</p>
            ) : null}
          </header>
        )}
        <button
          aria-label={title}
          className={`${repartoButtonClass} absolute right-4 top-4 size-8 px-0`}
          data-reparto-dialog-dismiss="close"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
        <div className="max-h-[calc(100dvh-8rem)] overflow-y-auto pr-1">
          {children}
        </div>
      </section>
    </div>
  );
}
