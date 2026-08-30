"use client";

import { useState } from "react";

import { parseHoursField } from "../../../../decimals.js";
import type {
  GroupSubjectCreateInput,
  GroupSubjectPublic,
  GroupSubjectUpdateInput,
  SubjectPublic,
  TeachingGroupPublic
} from "../../../../schemas.js";
import {
  useCreateRepartoGroupSubject,
  useUpdateRepartoGroupSubject
} from "../../../hooks.js";
import { repartoFieldCaptionClass } from "../../../styles.js";
import { repartoToast } from "../../../ui/toast-notification.js";
import {
  EntityDialogShell,
  FormGrid,
  FormPanelShell,
  SaveCancelRow,
  SelectField,
  TextField,
  useMappedError,
  type Dict
} from "../shared.js";
import { HoursField, LocalError } from "./bulk.js";

export type GroupSubjectCellValues = {
  teachingGroupId: string;
  subjectId: string;
  groupHours: string;
  teacherHours: string;
  teacherCount: string;
  notes: string;
};

export type GroupSubjectCellErrorKey =
  | "teachingGroup"
  | "subject"
  | "groupHours"
  | "teacherHours"
  | "teacherCount";

export type GroupSubjectCellFormResult =
  | { ok: true; create: GroupSubjectCreateInput; update: GroupSubjectUpdateInput }
  | { ok: false; errors: Partial<Record<GroupSubjectCellErrorKey, string>> };

/**
 * Turn the raw cell fields into the two payload shapes the endpoints take.
 *
 * Both are built at once because they are the same values seen from two sides:
 * `create` carries the cell's identity, `update` cannot — `teaching_group_id`
 * and `subject_id` are immutable, and the `PATCH` schema rejects them outright.
 *
 * A blank hour field is an explicit `null` ("inherit the subject default"), not
 * zero: a typed `0` becomes the canonical `"0.00"` and means a real zero. A
 * blank teacher count is omitted entirely so the backend default applies to a
 * created cell and an existing count survives a patch.
 */
export function buildGroupSubjectCellRequest(
  values: GroupSubjectCellValues,
  dict: Dict,
  { requireIdentity }: { requireIdentity: boolean }
): GroupSubjectCellFormResult {
  const errors: Partial<Record<GroupSubjectCellErrorKey, string>> = {};
  const groupHours = parseHoursField(values.groupHours);
  const teacherHours = parseHoursField(values.teacherHours);
  const rawCount = values.teacherCount.trim();
  const teacherCount = rawCount ? Number(rawCount) : null;

  if (requireIdentity && !values.teachingGroupId) {
    errors.teachingGroup = dict.error.required;
  }
  if (requireIdentity && !values.subjectId) errors.subject = dict.error.required;
  if (groupHours.state === "invalid") {
    errors.groupHours = dict.groupSubjectBulk.hoursError[groupHours.reason];
  }
  if (teacherHours.state === "invalid") {
    errors.teacherHours = dict.groupSubjectBulk.hoursError[teacherHours.reason];
  }
  if (
    teacherCount !== null &&
    !(Number.isInteger(teacherCount) && teacherCount > 0)
  ) {
    errors.teacherCount = dict.groupSubjectBulk.teacherCountError;
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const shared = {
    group_weekly_hours: groupHours.state === "valid" ? groupHours.hours : null,
    teacher_weekly_hours_per_position:
      teacherHours.state === "valid" ? teacherHours.hours : null,
    ...(teacherCount === null ? {} : { required_teacher_count: teacherCount }),
    notes: values.notes.trim() || null
  };

  return {
    ok: true,
    create: {
      teaching_group_id: values.teachingGroupId,
      subject_id: values.subjectId,
      ...shared
    },
    update: shared
  };
}

export type GroupSubjectCellFormProps = {
  cell?: GroupSubjectPublic | null;
  dict: Dict;
  onDone: () => void;
  processId: string;
  subjects: SubjectPublic[];
  teachingGroups: TeachingGroupPublic[];
};

/**
 * Add or edit one matrix cell.
 *
 * The bulk editor fills the matrix a subject at a time across a filtered range
 * of groups; this is the single-cell exception that range cannot express — one
 * group that takes a subject nothing else takes, or one cell whose hours differ
 * from everything the filter would match.
 *
 * There is deliberately no *deactivate* control: §20.12 retires a cell through
 * its own action, and a boolean toggle here would be a second, quieter way to
 * take a cell out of the plan.
 */
export function GroupSubjectCellForm({
  cell,
  dict,
  onDone,
  processId,
  subjects,
  teachingGroups
}: GroupSubjectCellFormProps) {
  const editing = Boolean(cell);
  const createMutation = useCreateRepartoGroupSubject();
  const updateMutation = useUpdateRepartoGroupSubject();
  const [mapped, setError, clearError] = useMappedError();
  const [teachingGroupId, setTeachingGroupId] = useState(
    cell?.teaching_group_id ?? ""
  );
  const [subjectId, setSubjectId] = useState(cell?.subject_id ?? "");
  const [groupHours, setGroupHours] = useState(cell?.group_weekly_hours ?? "");
  const [teacherHours, setTeacherHours] = useState(
    cell?.teacher_weekly_hours_per_position ?? ""
  );
  const [teacherCount, setTeacherCount] = useState(
    cell ? String(cell.required_teacher_count) : ""
  );
  const [notes, setNotes] = useState(cell?.notes ?? "");
  const [localErrors, setLocalErrors] = useState<
    Partial<Record<GroupSubjectCellErrorKey, string>>
  >({});

  const mutation = editing ? updateMutation : createMutation;
  const groupLabel =
    teachingGroups.find((group) => group.id === cell?.teaching_group_id)?.label ??
    cell?.teaching_group_id;
  const subjectName =
    subjects.find((subject) => subject.id === cell?.subject_id)?.name ??
    cell?.subject_id;

  function update(setter: (value: string) => void, value: string) {
    setter(value);
    setLocalErrors({});
  }

  function handleSubmit(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (mutation.isPending) return;
    const built = buildGroupSubjectCellRequest(
      { teachingGroupId, subjectId, groupHours, teacherHours, teacherCount, notes },
      dict,
      { requireIdentity: !editing }
    );
    if (!built.ok) {
      setLocalErrors(built.errors);
      return;
    }
    setLocalErrors({});
    clearError();
    if (cell) {
      updateMutation.mutate(
        { processId, groupSubjectId: cell.id, body: built.update },
        {
          onSuccess: () => {
            repartoToast.success(dict.groupSubjectMatrix.updated);
            onDone();
          },
          onError: (error) => {
            setError(error);
            repartoToast.error(
              dict.groupSubjectMatrix.updateError,
              error instanceof Error ? error.message : undefined
            );
          }
        }
      );
      return;
    }
    createMutation.mutate(
      { processId, body: built.create },
      {
        onSuccess: () => {
          repartoToast.success(dict.groupSubjectMatrix.created);
          onDone();
        },
        onError: (error) => {
          setError(error);
          repartoToast.error(
            dict.groupSubjectMatrix.createError,
            error instanceof Error ? error.message : undefined
          );
        }
      }
    );
  }

  return (
    <EntityDialogShell
      description={
        editing ? `${groupLabel} · ${subjectName}` : dict.groupSubjectMatrix.description
      }
      dialogId="group-subject-cell"
      onClose={onDone}
      title={
        editing
          ? dict.groupSubjectMatrix.editTitle
          : dict.groupSubjectMatrix.createTitle
      }
    >
      <FormPanelShell
        formAttr="group-subject-cell"
        mode={editing ? "edit" : "create"}
        onSubmit={handleSubmit}
      >
        <FormGrid>
          {editing ? (
            // The identity is shown, not offered: re-pointing a cell is a
            // delete and a create, both here and on the service.
            <p
              className={repartoFieldCaptionClass}
              data-reparto-slot="group-subject-identity"
            >
              {`${groupLabel} · ${subjectName}`} — {dict.groupSubjectMatrix.identityHint}
            </p>
          ) : (
            <>
              <SelectField
                field="group-subject-cell-teaching-group"
                fieldErrorKey="teachingGroup"
                label={dict.field.teachingGroup}
                mapped={mapped}
                onChange={(value) => update(setTeachingGroupId, value)}
                options={teachingGroups.map((group) => ({
                  value: group.id,
                  label: group.label
                }))}
                placeholder={dict.groupSubjectMatrix.selectTeachingGroup}
                value={teachingGroupId}
              />
              <LocalError message={localErrors.teachingGroup} />
              <SelectField
                field="group-subject-cell-subject"
                fieldErrorKey="subject"
                label={dict.field.subject}
                mapped={mapped}
                onChange={(value) => update(setSubjectId, value)}
                options={subjects.map((subject) => ({
                  value: subject.id,
                  label: subject.name
                }))}
                placeholder={dict.groupSubjectMatrix.selectSubject}
                value={subjectId}
              />
              <LocalError message={localErrors.subject} />
            </>
          )}
          <HoursField
            error={localErrors.groupHours}
            field="group-subject-cell-group-hours"
            label={dict.groupSubjectBulk.groupHours}
            onChange={(value) => update(setGroupHours, value)}
            value={groupHours}
          />
          <HoursField
            error={localErrors.teacherHours}
            field="group-subject-cell-teacher-hours"
            label={dict.groupSubjectBulk.teacherHours}
            onChange={(value) => update(setTeacherHours, value)}
            value={teacherHours}
          />
          <div>
            <TextField
              field="group-subject-cell-teacher-count"
              label={dict.groupSubjectBulk.teacherCount}
              onChange={(value) => update(setTeacherCount, value)}
              type="number"
              value={teacherCount}
            />
            <LocalError message={localErrors.teacherCount} />
          </div>
          <TextField
            field="group-subject-cell-notes"
            label={dict.field.notes}
            maxLength={2000}
            onChange={(value) => update(setNotes, value)}
            value={notes}
          />
          <p className={repartoFieldCaptionClass}>
            {dict.groupSubjectBulk.inheritHint}
          </p>
          <SaveCancelRow
            canSave={!mutation.isPending}
            isPending={mutation.isPending}
            saveLabel={dict.action.save}
            cancelLabel={dict.action.cancel}
            mapped={mapped}
            onCancel={onDone}
            onSubmit={() => handleSubmit({ preventDefault: () => undefined })}
          />
        </FormGrid>
      </FormPanelShell>
    </EntityDialogShell>
  );
}
