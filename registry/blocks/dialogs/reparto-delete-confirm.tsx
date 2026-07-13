"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export interface RepartoDeleteConfirmLabels {
  title: string;
  body: string;
  cancel: string;
  proceed: string;
}

export interface RepartoDeleteConfirmProps {
  open: boolean;
  entityLabel: string;
  recordName: string;
  relationshipWarning?: string;
  labels: RepartoDeleteConfirmLabels;
  isPending?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function RepartoDeleteConfirm({
  entityLabel,
  isPending = false,
  onConfirm,
  onOpenChange,
  open,
  recordName,
  relationshipWarning,
  labels
}: RepartoDeleteConfirmProps) {
  const title = labels.title.replace("{entity}", entityLabel);
  const body = labels.body.replace("{name}", recordName);
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-reparto-confirm="delete">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {body}
            {relationshipWarning ? (
              <span className="block mt-2 text-destructive" data-reparto-confirm-warning="">
                {relationshipWarning}
              </span>
            ) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="ghost" data-reparto-action="cancel" disabled={isPending}>
              {labels.cancel}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="destructive" data-reparto-action="confirm" disabled={isPending} onClick={onConfirm}>
              {isPending ? labels.proceed + "…" : labels.proceed}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
