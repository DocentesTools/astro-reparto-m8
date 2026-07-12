"use client";

import type { ReactNode } from "react";
import { AlertDialog as AlertDialogPrimitive } from "radix-ui";

export function AlertDialog({
  children,
  onOpenChange,
  open
}: {
  children: ReactNode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  return <AlertDialogPrimitive.Root onOpenChange={onOpenChange} open={open}>{children}</AlertDialogPrimitive.Root>;
}

export function AlertDialogContent({ children }: { children: ReactNode }) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay
        className="fixed inset-0 z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        data-slot="alert-dialog-overlay"
      />
      <AlertDialogPrimitive.Content
        className="fixed left-1/2 top-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none sm:max-w-md data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
        data-slot="alert-dialog-content"
      >
        {children}
      </AlertDialogPrimitive.Content>
    </AlertDialogPrimitive.Portal>
  );
}

export function AlertDialogTitle({ children }: { children: ReactNode }) {
  return <AlertDialogPrimitive.Title className="sr-only" data-slot="alert-dialog-title">{children}</AlertDialogPrimitive.Title>;
}

export function AlertDialogDescription({ children }: { children: ReactNode }) {
  return <AlertDialogPrimitive.Description className="text-sm text-muted-foreground" data-slot="alert-dialog-description">{children}</AlertDialogPrimitive.Description>;
}

export function AlertDialogHeader({ children }: { children: ReactNode }) {
  return <div className="grid gap-2 text-left" data-slot="alert-dialog-header">{children}</div>;
}

export function AlertDialogFooter({ children }: { children: ReactNode }) {
  return <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end" data-slot="alert-dialog-footer">{children}</div>;
}

export function AlertDialogCancel({
  children,
  disabled = false
}: {
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <AlertDialogPrimitive.Cancel asChild>
      <button className="inline-flex min-h-9 items-center justify-center rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50" disabled={disabled} type="button">
        {children}
      </button>
    </AlertDialogPrimitive.Cancel>
  );
}

export function AlertDialogAction({
  children,
  disabled = false,
  onClick
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <AlertDialogPrimitive.Action asChild>
      <button className="inline-flex min-h-9 items-center justify-center rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50" disabled={disabled} onClick={onClick} type="button">
        {children}
      </button>
    </AlertDialogPrimitive.Action>
  );
}
