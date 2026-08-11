"use client";

import { useMemo, useState } from "react";

import {
  formatHoursField,
  multiplyHours,
  parseHoursField
} from "../../../decimals.js";
import { formatRepartoMessage, type RepartoLocale } from "../../../i18n/index.js";
import type {
  ActivityType,
  GroupSubjectPublic,
  SubjectPublic,
  TeachingActivityCreateInput,
  TeachingActivityPublic,
  TeachingActivityUpdateInput,
  TeachingGroupPublic
} from "../../../schemas.js";
import {
  useCreateRepartoTeachingActivity,
  useRetireRepartoTeachingActivity,
  useRepartoGroupSubjects,
  useRepartoSubjects,
  useRepartoTeachingActivities,
  useRepartoTeachingGroups,
  useUpdateRepartoTeachingActivity
} from "../../hooks.js";
import {
  repartoFieldCaptionClass,
  repartoFieldLabelClass,
  repartoInputClass,
  repartoListClass,
  repartoListItemClass,
  repartoMetricLabelClass,
  repartoMetricValueClass,
  repartoPanelClass,
  repartoPanelHeaderClass
} from "../../styles.js";
import { repartoToast } from "../../ui/toast-notification.js";
import {
  ActionButton,
  EntityDeleteDialog,
  EntityDialogShell,
  RepartoFieldError,
  RowActions,
  SaveCancelRow,
  SelectField,
  useDict,
  useMappedError,
  type Dict
} from "../process-crud/shared.js";

const ACTIVITY_TYPES: readonly ActivityType[] = [
  "ordinary",
  "tutoring",
  "co_teaching",
  "support",
  "department_level",
  "other"
];

export type SecondaryActivityFormValues = {
  subjectId: string;
  activityType: ActivityType | "";
  groupHours: string;
  teacherHours: string;
  teacherCount: string;
  groupSubjectIds: string[];
  notes: string;
};

type SecondaryActivityFormErrorKey =
  | "subject"
  | "activityType"
  | "groupHours"
  | "teacherHours"
  | "teacherCount"
  | "groupSubjects"
  | "notes";

export type SecondaryActivityFormResult =
  | {
      ok: true;
      create: TeachingActivityCreateInput;
      update: TeachingActivityUpdateInput;
    }
  | {
      ok: false;
      errors: Partial<Record<SecondaryActivityFormErrorKey, string>>;
    };

export type SecondaryActivityRow = {
  activity: TeachingActivityPublic;
  subjectName: string;
  groupLabels: string[];
  groupImpact: string;
  teacherImpact: string;
};

function positiveInteger(raw: string): number | null {
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function hoursError(
  raw: string,
  dict: Dict
): { value: string | null; message?: string } {
  const parsed = parseHoursField(raw);
  if (parsed.state === "valid") return { value: parsed.hours };
  if (parsed.state === "unset") {
    return { value: null, message: dict.error.required };
  }
  return {
    value: null,
    message: dict.planning.secondary.hoursError[parsed.reason]
  };
}

/**
 * Build both request shapes from one editor state. Activity identity is present
 * only on create; updates deliberately omit `subject_id` and `source`.
 */
export function buildSecondaryActivityRequests({
  availableGroupSubjectIds,
  dict,
  subject,
  values
}: {
  availableGroupSubjectIds: readonly string[];
  dict: Dict;
  subject: SubjectPublic | null;
  values: SecondaryActivityFormValues;
}): SecondaryActivityFormResult {
  const errors: Partial<Record<SecondaryActivityFormErrorKey, string>> = {};
  const groupHours = hoursError(values.groupHours, dict);
  const teacherHours = hoursError(values.teacherHours, dict);
  const teacherCount = positiveInteger(values.teacherCount);
  const uniqueGroupIds = [...new Set(values.groupSubjectIds)];
  const availableIds = new Set(availableGroupSubjectIds);

  if (!subject || values.subjectId !== subject.id) {
    errors.subject = dict.error.required;
  }
  if (!values.activityType) {
    errors.activityType = dict.error.required;
  }
  if (groupHours.message) errors.groupHours = groupHours.message;
  if (teacherHours.message) errors.teacherHours = teacherHours.message;
  if (teacherCount === null) {
    errors.teacherCount = dict.planning.secondary.teacherCountError;
  }
  if (uniqueGroupIds.length !== values.groupSubjectIds.length) {
    errors.groupSubjects = dict.planning.secondary.duplicateGroupsError;
  } else if (uniqueGroupIds.some((id) => !availableIds.has(id))) {
    errors.groupSubjects = dict.planning.secondary.invalidGroupsError;
  } else if (subject && uniqueGroupIds.length === 0 && !subject.allows_zero_groups) {
    errors.groupSubjects = dict.planning.secondary.groupRequiredError;
  } else if (
    subject &&
    uniqueGroupIds.length > 1 &&
    !subject.allows_multiple_groups
  ) {
    errors.groupSubjects = dict.planning.secondary.multipleGroupsError;
  }
  if (values.notes.length > 2000) {
    errors.notes = dict.planning.secondary.notesError;
  }

  if (
    Object.keys(errors).length > 0 ||
    !subject ||
    !values.activityType ||
    groupHours.value === null ||
    teacherHours.value === null ||
    teacherCount === null
  ) {
    return { ok: false, errors };
  }

  const shared = {
    allocation_category: "secondary" as const,
    activity_type: values.activityType,
    group_weekly_hours_per_group: groupHours.value,
    teacher_weekly_hours_per_position: teacherHours.value,
    required_teacher_count: teacherCount,
    notes: values.notes.trim() || null,
    group_subject_ids: uniqueGroupIds
  };

  return {
    ok: true,
    create: {
      subject_id: subject.id,
      source: "secondary_manual",
      ...shared
    },
    update: shared
  };
}

export function secondaryActivityFormValues(
  subject: SubjectPublic | null,
  activity?: TeachingActivityPublic
): SecondaryActivityFormValues {
  if (activity) {
    return {
      subjectId: activity.subject_id,
      activityType: activity.activity_type,
      groupHours: formatHoursField(activity.group_weekly_hours_per_group),
      teacherHours: formatHoursField(
        activity.teacher_weekly_hours_per_position
      ),
      teacherCount: String(activity.required_teacher_count),
      groupSubjectIds: [...activity.group_subject_ids],
      notes: activity.notes ?? ""
    };
  }

  return {
    subjectId: subject?.id ?? "",
    activityType: subject?.activity_type ?? "",
    groupHours: formatHoursField(subject?.default_group_weekly_hours),
    teacherHours: formatHoursField(
      subject?.default_teacher_weekly_hours_per_position
    ),
    teacherCount: String(subject?.default_required_teacher_count ?? 1),
    groupSubjectIds: [],
    notes: ""
  };
}

export function buildSecondaryActivityRows({
  activities,
  groupSubjects,
  subjects,
  teachingGroups
}: {
  activities: TeachingActivityPublic[];
  groupSubjects: GroupSubjectPublic[];
  subjects: SubjectPublic[];
  teachingGroups: TeachingGroupPublic[];
}): SecondaryActivityRow[] {
  const subjectsById = new Map(
    subjects.map((subject) => [subject.id, subject.name])
  );
  const groupsById = new Map(
    teachingGroups.map((group) => [group.id, group.label])
  );
  const groupSubjectsById = new Map(
    groupSubjects.map((cell) => [cell.id, cell])
  );

  return activities
    .filter(
      (activity) =>
        activity.allocation_category === "secondary" &&
        activity.retired_at === null
    )
    .map((activity) => {
      const groupLabels = activity.group_subject_ids.map((cellId) => {
        const cell = groupSubjectsById.get(cellId);
        return cell
          ? (groupsById.get(cell.teaching_group_id) ?? cell.teaching_group_id)
          : cellId;
      });
      return {
        activity,
        subjectName:
          subjectsById.get(activity.subject_id) ?? activity.subject_id,
        groupLabels,
        groupImpact: multiplyHours(
          activity.group_weekly_hours_per_group,
          activity.linked_group_count
        ),
        teacherImpact: multiplyHours(
          activity.teacher_weekly_hours_per_position,
          activity.required_teacher_count
        )
      };
    })
    .sort(
      (left, right) =>
        left.subjectName.localeCompare(right.subjectName) ||
        left.activity.id.localeCompare(right.activity.id)
    );
}

function LocalError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <span className="text-xs text-destructive" role="alert">
      {message}
    </span>
  );
}

function HoursField({
  error,
  field,
  fieldErrorKey,
  label,
  mapped,
  onChange,
  value
}: {
  error?: string;
  field: string;
  fieldErrorKey: "groupWeeklyHours" | "teacherWeeklyHoursPerPosition";
  label: string;
  mapped: ReturnType<typeof useMappedError>[0];
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className={repartoFieldLabelClass}>
      {label}
      <input
        aria-invalid={
          error || mapped.fieldErrors.some((entry) => entry.field === fieldErrorKey)
            ? true
            : undefined
        }
        className={repartoInputClass}
        data-reparto-field={field}
        inputMode="decimal"
        onChange={(event: { target: { value: string } }) =>
          onChange(event.target.value)
        }
        value={value}
      />
      <LocalError message={error} />
      <RepartoFieldError field={fieldErrorKey} mapped={mapped} />
    </label>
  );
}

export function SecondaryActivityForm({
  availableGroupSubjects,
  dict,
  errors,
  isPending,
  mapped,
  mode,
  onCancel,
  onChange,
  onSubmit,
  selectedSubject,
  subjects,
  teachingGroups,
  values
}: {
  availableGroupSubjects: GroupSubjectPublic[];
  dict: Dict;
  errors: Partial<Record<SecondaryActivityFormErrorKey, string>>;
  isPending: boolean;
  mapped: ReturnType<typeof useMappedError>[0];
  mode: "create" | "edit";
  onCancel: () => void;
  onChange: (values: SecondaryActivityFormValues) => void;
  onSubmit: () => void;
  selectedSubject: SubjectPublic | null;
  subjects: SubjectPublic[];
  teachingGroups: TeachingGroupPublic[];
  values: SecondaryActivityFormValues;
}) {
  const groupLabels = new Map(
    teachingGroups.map((group) => [group.id, group.label])
  );

  const setGroupSelected = (groupSubjectId: string, selected: boolean) => {
    const existing = values.groupSubjectIds.filter(
      (id) => id !== groupSubjectId
    );
    const nextIds = selected
      ? selectedSubject?.allows_multiple_groups
        ? [...existing, groupSubjectId]
        : [groupSubjectId]
      : existing;
    onChange({ ...values, groupSubjectIds: nextIds });
  };

  return (
    <form
      className="grid gap-4"
      data-reparto-form="secondary-activity"
      data-reparto-mode={mode}
      onSubmit={(event: { preventDefault: () => void }) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <SelectField
        disabled={mode === "edit"}
        field="secondary-activity-subject"
        fieldErrorKey="subject"
        label={dict.planning.secondary.subject}
        mapped={mapped}
        onChange={(subjectId) => {
          const subject =
            subjects.find((candidate) => candidate.id === subjectId) ?? null;
          onChange(secondaryActivityFormValues(subject));
        }}
        options={subjects.map((subject) => ({
          value: subject.id,
          label: subject.name
        }))}
        value={values.subjectId}
      />
      <LocalError message={errors.subject} />
      <SelectField
        field="secondary-activity-type"
        fieldErrorKey="activityType"
        label={dict.planning.secondary.activityType}
        mapped={mapped}
        onChange={(activityType) =>
          onChange({
            ...values,
            activityType: activityType as ActivityType
          })
        }
        options={ACTIVITY_TYPES.map((activityType) => ({
          value: activityType,
          label: dict.planning.secondary.type[activityType]
        }))}
        value={values.activityType}
      />
      <LocalError message={errors.activityType} />
      <div className="grid gap-3 md:grid-cols-3">
        <HoursField
          error={errors.groupHours}
          field="secondary-activity-group-hours"
          fieldErrorKey="groupWeeklyHours"
          label={dict.planning.secondary.groupHours}
          mapped={mapped}
          onChange={(groupHours) => onChange({ ...values, groupHours })}
          value={values.groupHours}
        />
        <HoursField
          error={errors.teacherHours}
          field="secondary-activity-teacher-hours"
          fieldErrorKey="teacherWeeklyHoursPerPosition"
          label={dict.planning.secondary.teacherHours}
          mapped={mapped}
          onChange={(teacherHours) => onChange({ ...values, teacherHours })}
          value={values.teacherHours}
        />
        <label className={repartoFieldLabelClass}>
          {dict.planning.secondary.teacherCount}
          <input
            aria-invalid={
              errors.teacherCount ||
              mapped.fieldErrors.some(
                (entry) => entry.field === "requiredTeacherCount"
              )
                ? true
                : undefined
            }
            className={repartoInputClass}
            data-reparto-field="secondary-activity-teacher-count"
            min={1}
            onChange={(event: { target: { value: string } }) =>
              onChange({ ...values, teacherCount: event.target.value })
            }
            step={1}
            type="number"
            value={values.teacherCount}
          />
          <LocalError message={errors.teacherCount} />
          <RepartoFieldError field="requiredTeacherCount" mapped={mapped} />
        </label>
      </div>
      <p className={repartoFieldCaptionClass}>
        {dict.planning.secondary.balanceHint}
      </p>
      <fieldset
        className="grid gap-2 rounded-md border border-border/70 p-3"
        data-reparto-field="secondary-activity-groups"
      >
        <legend className="px-1 text-sm font-medium">
          {dict.planning.secondary.groups}
        </legend>
        <p className={repartoFieldCaptionClass}>
          {selectedSubject?.allows_multiple_groups
            ? dict.planning.secondary.multipleGroupsHint
            : selectedSubject?.allows_zero_groups
              ? dict.planning.secondary.optionalGroupHint
              : dict.planning.secondary.singleGroupHint}
        </p>
        {availableGroupSubjects.length === 0 ? (
          <p data-reparto-state="empty">
            {dict.planning.secondary.noGroups}
          </p>
        ) : (
          availableGroupSubjects.map((cell) => (
            <label
              className="flex items-center gap-2 text-sm"
              key={cell.id}
            >
              <input
                checked={values.groupSubjectIds.includes(cell.id)}
                data-group-subject-id={cell.id}
                onChange={(event: { target: { checked: boolean } }) =>
                  setGroupSelected(cell.id, event.target.checked)
                }
                type="checkbox"
              />
              {groupLabels.get(cell.teaching_group_id) ??
                cell.teaching_group_id}
            </label>
          ))
        )}
        <LocalError message={errors.groupSubjects} />
        <RepartoFieldError field="groupSubjects" mapped={mapped} />
      </fieldset>
      <label className={repartoFieldLabelClass}>
        {dict.planning.secondary.notes}
        <textarea
          aria-invalid={
            errors.notes ||
            mapped.fieldErrors.some((entry) => entry.field === "notes")
              ? true
              : undefined
          }
          className={repartoInputClass}
          data-reparto-field="secondary-activity-notes"
          maxLength={2000}
          onChange={(event: { target: { value: string } }) =>
            onChange({ ...values, notes: event.target.value })
          }
          rows={3}
          value={values.notes}
        />
        <LocalError message={errors.notes} />
        <RepartoFieldError field="notes" mapped={mapped} />
      </label>
      <SaveCancelRow
        canSave
        cancelLabel={dict.action.cancel}
        isPending={isPending}
        mapped={mapped}
        onCancel={onCancel}
        onSubmit={onSubmit}
        saveLabel={dict.action.save}
      />
    </form>
  );
}

export function SecondaryActivityTable({
  dict,
  onEdit,
  onRetire,
  rows
}: {
  dict: Dict;
  onEdit: (activity: TeachingActivityPublic) => void;
  onRetire: (activity: TeachingActivityPublic) => void;
  rows: SecondaryActivityRow[];
}) {
  if (rows.length === 0) {
    return (
      <p data-reparto-state="empty">{dict.planning.secondary.empty}</p>
    );
  }

  return (
    <ul
      className={repartoListClass}
      data-reparto-table="secondary-activities"
    >
      {rows.map((row) => (
        <li
          className={`${repartoListItemClass} space-y-3`}
          data-activity-type={row.activity.activity_type}
          data-reparto-row="secondary-activity"
          data-teaching-activity-id={row.activity.id}
          key={row.activity.id}
        >
          <div className={repartoPanelHeaderClass}>
            <div>
              <strong>{row.subjectName}</strong>
              <p className={repartoFieldCaptionClass}>
                {dict.planning.secondary.type[row.activity.activity_type]}
              </p>
            </div>
            <RowActions>
              <ActionButton
                action="edit"
                label={dict.action.edit}
                onClick={() => onEdit(row.activity)}
                row
              />
              <ActionButton
                action="retire"
                label={dict.action.retire}
                onClick={() => onRetire(row.activity)}
                row
              />
            </RowActions>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <span className={repartoMetricLabelClass}>
                {dict.planning.secondary.groups}
              </span>
              <span className={repartoMetricValueClass}>
                {row.groupLabels.length > 0
                  ? row.groupLabels.join(", ")
                  : dict.planning.secondary.noLinkedGroups}
              </span>
            </div>
            <div>
              <span className={repartoMetricLabelClass}>
                {dict.planning.secondary.groupHours}
              </span>
              <span className={repartoMetricValueClass}>
                {row.activity.group_weekly_hours_per_group} h ×{" "}
                {row.activity.linked_group_count} = {row.groupImpact} h
              </span>
            </div>
            <div>
              <span className={repartoMetricLabelClass}>
                {dict.planning.secondary.teacherHours}
              </span>
              <span className={repartoMetricValueClass}>
                {row.activity.teacher_weekly_hours_per_position} h ×{" "}
                {row.activity.required_teacher_count} = {row.teacherImpact} h
              </span>
            </div>
            <div>
              <span className={repartoMetricLabelClass}>
                {dict.planning.secondary.teacherCount}
              </span>
              <span className={repartoMetricValueClass}>
                {row.activity.required_teacher_count}
              </span>
            </div>
          </div>
          {row.activity.notes ? (
            <p className={repartoFieldCaptionClass}>{row.activity.notes}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

type EditorState =
  | { mode: "create"; activity: null }
  | { mode: "edit"; activity: TeachingActivityPublic };

export function SecondaryActivityEditor({
  locale,
  processId
}: {
  locale?: RepartoLocale;
  processId?: string;
}) {
  const dict = useDict(locale);
  const subjectsQuery = useRepartoSubjects(processId);
  const groupSubjectsQuery = useRepartoGroupSubjects(processId);
  const groupsQuery = useRepartoTeachingGroups(processId);
  const activitiesQuery = useRepartoTeachingActivities(processId);
  const createMutation = useCreateRepartoTeachingActivity();
  const updateMutation = useUpdateRepartoTeachingActivity();
  const retireMutation = useRetireRepartoTeachingActivity();
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [retiring, setRetiring] = useState<TeachingActivityPublic | null>(null);
  const [values, setValues] = useState<SecondaryActivityFormValues>(
    secondaryActivityFormValues(null)
  );
  const [errors, setErrors] = useState<
    Partial<Record<SecondaryActivityFormErrorKey, string>>
  >({});
  const [mapped, setMappedError, clearMappedError] = useMappedError();

  const subjects = subjectsQuery.data?.data ?? [];
  const groupSubjects = groupSubjectsQuery.data?.data ?? [];
  const teachingGroups = groupsQuery.data?.data ?? [];
  const activities = activitiesQuery.data?.data ?? [];
  const secondarySubjects = useMemo(
    () =>
      subjects.filter(
        (subject) => subject.allocation_category === "secondary"
      ),
    [subjects]
  );
  const selectedSubject =
    secondarySubjects.find((subject) => subject.id === values.subjectId) ??
    null;
  const availableGroupSubjects = groupSubjects.filter(
    (cell) =>
      cell.subject_id === values.subjectId &&
      (cell.active || values.groupSubjectIds.includes(cell.id))
  );
  const rows = useMemo(
    () =>
      buildSecondaryActivityRows({
        activities,
        groupSubjects,
        subjects,
        teachingGroups
      }),
    [activities, groupSubjects, subjects, teachingGroups]
  );
  const queryError =
    subjectsQuery.error ??
    groupSubjectsQuery.error ??
    groupsQuery.error ??
    activitiesQuery.error;
  const isLoading =
    subjectsQuery.isLoading ||
    groupSubjectsQuery.isLoading ||
    groupsQuery.isLoading ||
    activitiesQuery.isLoading;

  const openCreate = () => {
    const firstSubject = secondarySubjects[0] ?? null;
    setValues(secondaryActivityFormValues(firstSubject));
    setErrors({});
    clearMappedError();
    setEditor({ mode: "create", activity: null });
  };

  const openEdit = (activity: TeachingActivityPublic) => {
    setValues(secondaryActivityFormValues(null, activity));
    setErrors({});
    clearMappedError();
    setEditor({ mode: "edit", activity });
  };

  const closeEditor = () => {
    setEditor(null);
    setErrors({});
    clearMappedError();
  };

  const submit = () => {
    if (!editor || !processId) return;
    const result = buildSecondaryActivityRequests({
      availableGroupSubjectIds: availableGroupSubjects.map((cell) => cell.id),
      dict,
      subject: selectedSubject,
      values
    });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    clearMappedError();

    if (editor.mode === "create") {
      createMutation.mutate(
        { processId, body: result.create },
        {
          onSuccess: () => {
            repartoToast.success(dict.planning.secondary.created);
            closeEditor();
          },
          onError: (error) => {
            setMappedError(error);
            repartoToast.error(dict.planning.secondary.saveError);
          }
        }
      );
      return;
    }

    updateMutation.mutate(
      {
        processId,
        activityId: editor.activity.id,
        body: result.update
      },
      {
        onSuccess: () => {
          repartoToast.success(dict.planning.secondary.updated);
          closeEditor();
        },
        onError: (error) => {
          setMappedError(error);
          repartoToast.error(dict.planning.secondary.saveError);
        }
      }
    );
  };

  const confirmRetire = () => {
    if (!retiring || !processId) return;
    clearMappedError();
    retireMutation.mutate(
      { processId, activityId: retiring.id },
      {
        onSuccess: () => {
          repartoToast.success(dict.planning.secondary.retired);
          setRetiring(null);
        },
        onError: (error) => {
          setMappedError(error);
          repartoToast.error(dict.planning.secondary.retireError);
        }
      }
    );
  };

  return (
    <section
      className={`${repartoPanelClass} space-y-4`}
      data-reparto-component="secondary-activity-editor"
    >
      <header className={repartoPanelHeaderClass}>
        <div>
          <h2 className="font-semibold">{dict.planning.secondary.title}</h2>
          <p className={repartoFieldCaptionClass}>
            {dict.planning.secondary.description}
          </p>
        </div>
        <ActionButton
          action="create-secondary-activity"
          disabled={
            !processId || secondarySubjects.length === 0 || isLoading
          }
          disabledReason={
            secondarySubjects.length === 0
              ? dict.planning.secondary.noSubjects
              : null
          }
          label={dict.planning.secondary.createAction}
          onClick={openCreate}
        />
      </header>
      {isLoading ? (
        <p data-reparto-state="loading" role="status">
          {dict.planning.secondary.loading}
        </p>
      ) : null}
      {queryError ? (
        <p className="text-sm text-destructive" data-reparto-state="error">
          {queryError instanceof Error
            ? queryError.message
            : dict.planning.secondary.unavailable}
        </p>
      ) : null}
      {!isLoading && !queryError ? (
        <SecondaryActivityTable
          dict={dict}
          onEdit={openEdit}
          onRetire={setRetiring}
          rows={rows}
        />
      ) : null}
      {editor ? (
        <EntityDialogShell
          description={dict.planning.secondary.formDescription}
          dialogId="secondary-activity-editor"
          onClose={closeEditor}
          title={
            editor.mode === "create"
              ? dict.planning.secondary.createTitle
              : dict.planning.secondary.editTitle
          }
        >
          <SecondaryActivityForm
            availableGroupSubjects={availableGroupSubjects}
            dict={dict}
            errors={errors}
            isPending={
              createMutation.isPending || updateMutation.isPending
            }
            mapped={mapped}
            mode={editor.mode}
            onCancel={closeEditor}
            onChange={setValues}
            onSubmit={submit}
            selectedSubject={selectedSubject}
            subjects={secondarySubjects}
            teachingGroups={teachingGroups}
            values={values}
          />
        </EntityDialogShell>
      ) : null}
      {retiring ? (
        <EntityDeleteDialog
          body={formatRepartoMessage(dict.planning.secondary.retireBody, {
            subject:
              subjects.find((subject) => subject.id === retiring.subject_id)
                ?.name ?? retiring.subject_id
          })}
          cancelLabel={dict.action.cancel}
          confirmWarning={
            <p data-reparto-slot="secondary-activity-retire-consequence">
              {dict.planning.secondary.retireConsequence}
            </p>
          }
          isPending={retireMutation.isPending}
          mapped={mapped}
          onClose={() => setRetiring(null)}
          onConfirm={confirmRetire}
          proceedLabel={dict.action.retire}
          title={dict.planning.secondary.retireTitle}
        />
      ) : null}
    </section>
  );
}
