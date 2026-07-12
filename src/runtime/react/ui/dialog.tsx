"use client";

import type { ReactNode } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";

export function Dialog({
  children,
  onOpenChange,
  open
}: {
  children: ReactNode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  return <DialogPrimitive.Root onOpenChange={onOpenChange} open={open}>{children}</DialogPrimitive.Root>;
}

export function DialogContent({ children, closeLabel }: { children: ReactNode; closeLabel: string }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className="fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        data-slot="dialog-overlay"
      />
      <DialogPrimitive.Content
        className="fixed left-1/2 top-1/2 z-50 grid max-h-[calc(100dvh-2rem)] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none sm:max-w-2xl data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
        data-slot="dialog-content"
      >
        {children}
        <DialogPrimitive.Close asChild>
          <button
            aria-label={closeLabel}
            className="absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-md border bg-background text-foreground hover:bg-accent"
            data-reparto-dialog-dismiss="close"
            type="button"
          >
            ×
          </button>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-2 pr-12">{children}</div>;
}

export function DialogTitle({ children }: { children: ReactNode }) {
  return <DialogPrimitive.Title className="font-heading text-base font-medium leading-none" data-slot="dialog-title">{children}</DialogPrimitive.Title>;
}

export function DialogDescription({ children }: { children: ReactNode }) {
  return <DialogPrimitive.Description className="text-sm text-muted-foreground" data-slot="dialog-description">{children}</DialogPrimitive.Description>;
}
