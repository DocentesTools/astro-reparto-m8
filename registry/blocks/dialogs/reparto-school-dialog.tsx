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
  useCreateRepartoSchool,
  useUpdateRepartoSchool
} from "@mano8/astro-reparto-m8/react";
import type { SchoolCreate, SchoolPublic } from "@mano8/astro-reparto-m8/schemas";

export interface RepartoSchoolDialogLabels {
  title: string;
  editTitle: string;
  name: string;
  locality: string;
  province: string;
  region: string;
  address: string;
  notes: string;
  save: string;
  cancel: string;
}

export interface RepartoSchoolDialogProps {
  open: boolean;
  labels: RepartoSchoolDialogLabels;
  school?: SchoolPublic | null;
  onOpenChange: (open: boolean) => void;
  onCreated?: (school: SchoolPublic) => void;
}

export function RepartoSchoolDialog({
  labels,
  onOpenChange,
  onCreated,
  open,
  school
}: RepartoSchoolDialogProps) {
  const editing = Boolean(school);
  const [name, setName] = useState(school?.name ?? "");
  const [locality, setLocality] = useState(school?.locality ?? "");
  const [province, setProvince] = useState(school?.province ?? "");
  const [region, setRegion] = useState(school?.region ?? "");
  const [address, setAddress] = useState(school?.address ?? "");
  const [notes, setNotes] = useState(school?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  const createMutation = useCreateRepartoSchool();
  const updateMutation = useUpdateRepartoSchool();

  const canSave = name.trim().length > 0 && !createMutation.isPending && !updateMutation.isPending;

  function handleSave() {
    if (!canSave) return;
    setError(null);
    const body: SchoolCreate = {
      name: name.trim(),
      locality: locality.trim() || null,
      province: province.trim() || null,
      // `region` is the one optional school field the service schema declares
      // non-nullable, so an empty input is absent rather than explicitly null.
      region: region.trim() || undefined,
      address: address.trim() || null,
      notes: notes.trim() || null
    };
    const handleErr = (err: unknown) => {
      setError(err instanceof Error ? err.message : "Error");
    };
    if (editing && school) {
      updateMutation.mutate(
        { schoolId: school.id, body: { ...body } },
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-reparto-dialog="school">
        <DialogHeader>
          <DialogTitle>{editing ? labels.editTitle : labels.title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <Label className="grid gap-1.5">
            {labels.name}
            <Input
              data-reparto-field="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Label>
          <div className="grid gap-3 md:grid-cols-2">
            <Label className="grid gap-1.5">
              {labels.locality}
              <Input
                data-reparto-field="locality"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
              />
            </Label>
            <Label className="grid gap-1.5">
              {labels.province}
              <Input
                data-reparto-field="province"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
              />
            </Label>
            <Label className="grid gap-1.5">
              {labels.region}
              <Input
                data-reparto-field="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              />
            </Label>
            <Label className="grid gap-1.5">
              {labels.address}
              <Input
                data-reparto-field="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </Label>
          </div>
          <Label className="grid gap-1.5">
            {labels.notes}
            <Textarea
              data-reparto-field="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Label>
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
          <Button type="button" data-reparto-action="save" disabled={!canSave} onClick={handleSave}>
            {labels.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
