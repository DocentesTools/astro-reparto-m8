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
  useCreateRepartoDepartment,
  useRepartoSchools,
  useUpdateRepartoDepartment
} from "@mano8/astro-reparto-m8/react";
import type {
  DepartmentCreate,
  DepartmentPublic
} from "@mano8/astro-reparto-m8/schemas";
import { RepartoFkSelect } from "@/components/fa-reparto/reparto-fk-select";

export interface RepartoDepartmentDialogLabels {
  title: string;
  editTitle: string;
  school: string;
  name: string;
  slug: string;
  notes: string;
  save: string;
  cancel: string;
  createNew: string;
  fkPlaceholder: string;
  fkLoading: string;
  fkEmpty: string;
  missingSchool: string;
}

export interface RepartoDepartmentDialogProps {
  open: boolean;
  labels: RepartoDepartmentDialogLabels;
  department?: DepartmentPublic | null;
  schoolId?: string;
  onOpenChange: (open: boolean) => void;
  onCreated?: (department: DepartmentPublic) => void;
  onOpenSchoolCreate?: () => void;
}

export function RepartoDepartmentDialog({
  department,
  labels,
  onCreated,
  onOpenChange,
  onOpenSchoolCreate,
  open,
  schoolId
}: RepartoDepartmentDialogProps) {
  const editing = Boolean(department);
  const [selectedSchoolId, setSelectedSchoolId] = useState(
    department?.school_id ?? schoolId ?? ""
  );
  const [name, setName] = useState(department?.name ?? "");
  const [notes, setNotes] = useState(department?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  const schoolsQuery = useRepartoSchools({ limit: 100 });
  const createMutation = useCreateRepartoDepartment();
  const updateMutation = useUpdateRepartoDepartment();

  const schoolOptions = (schoolsQuery.data?.data ?? []).map((school) => ({
    value: school.id,
    label: school.name
  }));

  const canSave =
    selectedSchoolId !== "" &&
    name.trim().length > 0 &&
    !createMutation.isPending &&
    !updateMutation.isPending;

  function handleSave() {
    if (!canSave) return;
    setError(null);
    const body: DepartmentCreate = {
      school_id: selectedSchoolId,
      name: name.trim(),
      notes: notes.trim() || null
    };
    const handleErr = (err: unknown) => {
      setError(err instanceof Error ? err.message : "Error");
    };
    if (editing && department) {
      updateMutation.mutate(
        { departmentId: department.id, body: { name: body.name, notes: body.notes } },
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
      <DialogContent data-reparto-dialog="department">
        <DialogHeader>
          <DialogTitle>{editing ? labels.editTitle : labels.title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5">
            <span className="text-sm font-medium">{labels.school}</span>
            <RepartoFkSelect
              value={selectedSchoolId}
              options={schoolOptions}
              loading={schoolsQuery.isLoading}
              labels={{
                placeholder: labels.fkPlaceholder,
                createNew: labels.createNew,
                loading: labels.fkLoading,
                noResults: labels.fkEmpty
              }}
              onChange={setSelectedSchoolId}
              disabled={editing}
              disabledReason={editing ? undefined : undefined}
              renderInlineCreate={
                onOpenSchoolCreate
                  ? () => {
                      return (
                        <p className="text-sm text-muted-foreground" data-reparto-slot="missing-school">
                          {labels.missingSchool}
                          <Button
                            type="button"
                            variant="link"
                            className="px-1"
                            data-reparto-action="open-school-create"
                            onClick={() => {
                              onOpenChange(false);
                              onOpenSchoolCreate?.();
                            }}
                          >
                            {labels.createNew}
                          </Button>
                        </p>
                      );
                    }
                  : undefined
              }
            />
          </div>
          <Label className="grid gap-1.5">
            {labels.name}
            <Input
              data-reparto-field="name"
              maxLength={150}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Label>
          {editing && department ? (
            <Label className="grid gap-1.5">
              {labels.slug}
              <Input data-reparto-field="slug" readOnly value={department.slug} />
            </Label>
          ) : null}
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
