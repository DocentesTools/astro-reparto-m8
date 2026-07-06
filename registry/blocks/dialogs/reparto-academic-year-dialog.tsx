"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useArchiveRepartoAcademicYear,
  useCreateRepartoAcademicYear,
  useUpdateRepartoAcademicYear
} from "@mano8/astro-reparto-m8/react";
import type {
  AcademicYearCreate,
  AcademicYearPublic
} from "@mano8/astro-reparto-m8/schemas";

export interface RepartoAcademicYearDialogLabels {
  title: string;
  editTitle: string;
  label: string;
  startDate: string;
  endDate: string;
  save: string;
  cancel: string;
  archive: string;
}

export interface RepartoAcademicYearDialogProps {
  open: boolean;
  labels: RepartoAcademicYearDialogLabels;
  year?: AcademicYearPublic | null;
  onOpenChange: (open: boolean) => void;
  onCreated?: (year: AcademicYearPublic) => void;
}

export function RepartoAcademicYearDialog({
  labels,
  onCreated,
  onOpenChange,
  open,
  year
}: RepartoAcademicYearDialogProps) {
  const editing = Boolean(year);
  const [labelValue, setLabelValue] = useState(year?.label ?? "");
  const [startDate, setStartDate] = useState(year?.start_date ?? "");
  const [endDate, setEndDate] = useState(year?.end_date ?? "");
  const [error, setError] = useState<string | null>(null);

  const createMutation = useCreateRepartoAcademicYear();
  const updateMutation = useUpdateRepartoAcademicYear();
  const archiveMutation = useArchiveRepartoAcademicYear();

  const canSave =
    labelValue.trim().length > 0 &&
    /^\d{4}-\d{2}-\d{2}$/.test(startDate) &&
    /^\d{4}-\d{2}-\d{2}$/.test(endDate) &&
    startDate <= endDate &&
    !createMutation.isPending &&
    !updateMutation.isPending;

  function handleSave() {
    if (!canSave) return;
    setError(null);
    const body: AcademicYearCreate = {
      label: labelValue.trim(),
      start_date: startDate,
      end_date: endDate
    };
    const handleErr = (err: unknown) => {
      setError(err instanceof Error ? err.message : "Error");
    };
    if (editing && year) {
      updateMutation.mutate(
        { yearId: year.id, body: { ...body } },
        {
          onSuccess: (updated) => {
            onOpenChange(false);
            onCreated?.(updated);
          },
          onError: handleErr
        }
      );
    } else {
      createMutation.mutate(body, {
        onSuccess: (created) => {
          onOpenChange(false);
          onCreated?.(created);
        },
        onError: handleErr
      });
    }
  }

  function handleArchive() {
    if (!year) return;
    setError(null);
    archiveMutation.mutate(year.id, {
      onSuccess: () => onOpenChange(false),
      onError: (err: unknown) => {
        setError(err instanceof Error ? err.message : "Error");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-reparto-dialog="academic-year">
        <DialogHeader>
          <DialogTitle>{editing ? labels.editTitle : labels.title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <Label className="grid gap-1.5">
            {labels.label}
            <Input
              data-reparto-field="label"
              maxLength={20}
              value={labelValue}
              onChange={(e) => setLabelValue(e.target.value)}
            />
          </Label>
          <div className="grid gap-3 md:grid-cols-2">
            <Label className="grid gap-1.5">
              {labels.startDate}
              <Input
                data-reparto-field="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Label>
            <Label className="grid gap-1.5">
              {labels.endDate}
              <Input
                data-reparto-field="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Label>
          </div>
          {error ? (
            <p className="text-sm text-destructive" data-reparto-slot="form-error">
              {error}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="ghost" type="button" data-reparto-action="cancel" onClick={() => onOpenChange(false)}>
            {labels.cancel}
          </Button>
          {editing && year ? (
            <Button
              variant="secondary"
              type="button"
              data-reparto-action="archive"
              disabled={archiveMutation.isPending || year.status === "archived"}
              onClick={handleArchive}
            >
              {labels.archive}
            </Button>
          ) : null}
          <Button type="button" data-reparto-action="save" disabled={!canSave} onClick={handleSave}>
            {labels.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
