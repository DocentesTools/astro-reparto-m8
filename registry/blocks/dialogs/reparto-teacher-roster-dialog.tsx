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
import { Switch } from "@/components/ui/switch";
import {
  useCreateRepartoTeacherProfile,
  useDeleteRepartoTeacherProfile,
  useUpdateRepartoTeacherProfile
} from "@mano8/astro-reparto-m8/react";
import type {
  TeacherProfileCreate,
  TeacherProfilePublic
} from "@mano8/astro-reparto-m8/schemas";
import { RepartoDeleteConfirm } from "@/components/fa-reparto/reparto-delete-confirm";

export interface RepartoTeacherRosterDialogLabels {
  title: string;
  editTitle: string;
  displayName: string;
  active: string;
  notes: string;
  save: string;
  cancel: string;
  delete: string;
  confirmDeleteTitle: string;
  confirmDeleteBody: string;
  confirmCancel: string;
  confirmProceed: string;
}

export interface RepartoTeacherRosterDialogProps {
  open: boolean;
  labels: RepartoTeacherRosterDialogLabels;
  profile?: TeacherProfilePublic | null;
  onOpenChange: (open: boolean) => void;
  onCreated?: (profile: TeacherProfilePublic) => void;
}

export function RepartoTeacherRosterDialog({
  labels,
  onCreated,
  onOpenChange,
  open,
  profile
}: RepartoTeacherRosterDialogProps) {
  const editing = Boolean(profile);
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [active, setActive] = useState(profile?.active ?? true);
  const [notes, setNotes] = useState(profile?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const createMutation = useCreateRepartoTeacherProfile();
  const updateMutation = useUpdateRepartoTeacherProfile();
  const deleteMutation = useDeleteRepartoTeacherProfile();

  const canSave =
    displayName.trim().length > 0 &&
    !createMutation.isPending &&
    !updateMutation.isPending;

  function handleSave() {
    if (!canSave) return;
    setError(null);
    const body: TeacherProfileCreate = {
      display_name: displayName.trim(),
      active,
      notes: notes.trim() || null
    };
    const handleErr = (err: unknown) => {
      setError(err instanceof Error ? err.message : "Error");
    };
    if (editing && profile) {
      updateMutation.mutate(
        { profileId: profile.id, body: { ...body } },
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

  function handleDelete() {
    if (!profile) return;
    setError(null);
    deleteMutation.mutate(profile.id, {
      onSuccess: () => {
        setConfirmOpen(false);
        onOpenChange(false);
      },
      onError: (err: unknown) => {
        setError(err instanceof Error ? err.message : "Error");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-reparto-dialog="teacher-roster">
        <DialogHeader>
          <DialogTitle>{editing ? labels.editTitle : labels.title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <Label className="grid gap-1.5">
            {labels.displayName}
            <Input
              data-reparto-field="display-name"
              maxLength={150}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </Label>
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium" htmlFor="teacher-active">
              {labels.active}
            </Label>
            <Switch
              id="teacher-active"
              data-reparto-field="active"
              checked={active}
              onCheckedChange={setActive}
            />
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
          {editing && profile ? (
            <Button
              variant="ghost"
              type="button"
              data-reparto-action="delete"
              className="text-destructive"
              disabled={deleteMutation.isPending}
              onClick={() => setConfirmOpen(true)}
            >
              {labels.delete}
            </Button>
          ) : null}
          <Button variant="ghost" type="button" data-reparto-action="cancel" onClick={() => onOpenChange(false)}>
            {labels.cancel}
          </Button>
          <Button type="button" data-reparto-action="save" disabled={!canSave} onClick={handleSave}>
            {labels.save}
          </Button>
        </DialogFooter>
      </DialogContent>
      {editing && profile ? (
        <RepartoDeleteConfirm
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          onConfirm={handleDelete}
          entityLabel={labels.title}
          recordName={profile.display_name}
          isPending={deleteMutation.isPending}
          labels={{
            title: labels.confirmDeleteTitle,
            body: labels.confirmDeleteBody,
            cancel: labels.confirmCancel,
            proceed: labels.confirmProceed
          }}
        />
      ) : null}
    </Dialog>
  );
}
