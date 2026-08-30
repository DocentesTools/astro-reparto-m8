"use client";

import { useMemo, useState } from "react";

import { parseHoursField } from "../../../../decimals.js";
import { RepartoApiError } from "../../../../errors.js";
import { formatRepartoMessage } from "../../../../i18n/index.js";
import type {
  GroupSubjectBulkMode,
  GroupSubjectBulkPreview,
  GroupSubjectBulkRequestInput,
  SubjectPublic,
  TeachingGroupPublic
} from "../../../../schemas.js";
import {
  useApplyRepartoGroupSubjects,
  usePreviewRepartoGroupSubjects,
  useRepartoSubjects,
  useRepartoTeachingGroups
} from "../../../hooks.js";
import {
  repartoFieldCaptionClass,
  repartoInputClass,
  repartoPanelClass
} from "../../../styles.js";
import { repartoToast } from "../../../ui/toast-notification.js";
import {
  ActionButton,
  FieldLabel,
  FormGrid,
  RepartoFormError,
  RowActions,
  SelectField,
  TextField,
  useDict,
  useMappedError,
  type Dict
} from "../shared.js";

type BulkFormValues = {
  subjectId: string;
  mode: GroupSubjectBulkMode;
  stage: string;
  minimumGrade: string;
  maximumGrade: string;
  groupHours: string;
  teacherHours: string;
  teacherCount: string;
};

type BulkFormErrorKey =
  | "subject"
  | "minimumGrade"
  | "maximumGrade"
  | "gradeRange"
  | "groupHours"
  | "teacherHours"
  | "teacherCount";

export type GroupSubjectBulkFormResult =
  | { ok: true; request: GroupSubjectBulkRequestInput }
  | { ok: false; errors: Partial<Record<BulkFormErrorKey, string>> };

function optionalPositiveInteger(raw: string): number | null | "invalid" {
  if (!raw.trim()) return null;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : "invalid";
}

/**
 * Convert raw editor fields into the bulk request without collapsing blank
 * hours into zero. Blank hours are explicit `null` ("inherit the subject
 * default"), while a typed `0` becomes the canonical `"0.00"` string.
 */
export function buildGroupSubjectBulkRequest(
  values: BulkFormValues,
  dict: Dict
): GroupSubjectBulkFormResult {
  const errors: Partial<Record<BulkFormErrorKey, string>> = {};
  const minimumGrade = optionalPositiveInteger(values.minimumGrade);
  const maximumGrade = optionalPositiveInteger(values.maximumGrade);
  const teacherCount = optionalPositiveInteger(values.teacherCount);
  const groupHours = parseHoursField(values.groupHours);
  const teacherHours = parseHoursField(values.teacherHours);

  if (!values.subjectId) errors.subject = dict.error.required;
  if (minimumGrade === "invalid") {
    errors.minimumGrade = dict.groupSubjectBulk.gradeError;
  }
  if (maximumGrade === "invalid") {
    errors.maximumGrade = dict.groupSubjectBulk.gradeError;
  }
  if (
    typeof minimumGrade === "number" &&
    typeof maximumGrade === "number" &&
    minimumGrade > maximumGrade
  ) {
    errors.gradeRange = dict.groupSubjectBulk.gradeRangeError;
  }
  if (groupHours.state === "invalid") {
    errors.groupHours = dict.groupSubjectBulk.hoursError[groupHours.reason];
  }
  if (teacherHours.state === "invalid") {
    errors.teacherHours =
      dict.groupSubjectBulk.hoursError[teacherHours.reason];
  }
  if (teacherCount === "invalid") {
    errors.teacherCount = dict.groupSubjectBulk.teacherCountError;
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    request: {
      subject_id: values.subjectId,
      mode: values.mode,
      ...(values.stage.trim() ? { stage: values.stage.trim() } : {}),
      ...(typeof minimumGrade === "number"
        ? { minimum_grade: minimumGrade }
        : {}),
      ...(typeof maximumGrade === "number"
        ? { maximum_grade: maximumGrade }
        : {}),
      group_weekly_hours:
        groupHours.state === "valid" ? groupHours.hours : null,
      teacher_weekly_hours_per_position:
        teacherHours.state === "valid" ? teacherHours.hours : null,
      required_teacher_count:
        typeof teacherCount === "number" ? teacherCount : 1
    }
  };
}

export function isStaleGroupSubjectPreviewError(error: unknown): boolean {
  return error instanceof RepartoApiError && error.status === 409;
}

type PreviewRow = {
  action: "create" | "update" | "unchanged" | "conflict";
  teachingGroupId: string;
  groupHours: string | null;
  teacherHours: string | null;
  teacherCount: number | null;
  reason: string | null;
};

export function groupSubjectBulkPreviewRows(
  preview: GroupSubjectBulkPreview
): PreviewRow[] {
  const changes = (
    action: PreviewRow["action"],
    rows: GroupSubjectBulkPreview["to_create"]
  ): PreviewRow[] =>
    rows.map((row) => ({
      action,
      teachingGroupId: row.teaching_group_id,
      groupHours: row.group_weekly_hours,
      teacherHours: row.teacher_weekly_hours_per_position,
      teacherCount: row.required_teacher_count,
      reason: null
    }));

  return [
    ...changes("create", preview.to_create),
    ...changes("update", preview.to_update),
    ...changes("unchanged", preview.unchanged),
    ...preview.conflicts.map((conflict) => ({
      action: "conflict" as const,
      teachingGroupId: conflict.teaching_group_id,
      groupHours: null,
      teacherHours: null,
      teacherCount: null,
      reason: conflict.reason
    }))
  ];
}

/**
 * A validation message the form itself raised, before any request.
 *
 * Exported for the per-cell form so the two surfaces of the matrix report a
 * rejected field the same way; a mapped *server* error still goes through
 * `RepartoFieldError` / `RepartoFormError`.
 */
export function LocalError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <span
      className="text-xs text-destructive"
      data-reparto-slot="field-error"
      role="alert"
    >
      {message}
    </span>
  );
}

/** A two-decimal hour input: blank stays "inherit", it never becomes zero. */
export function HoursField({
  error,
  field,
  label,
  onChange,
  value
}: {
  error?: string;
  field: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <FieldLabel>
      {label}
      <input
        aria-invalid={error ? true : undefined}
        className={repartoInputClass}
        data-reparto-field={field}
        inputMode="decimal"
        onChange={(event: { target: { value: string } }) =>
          onChange(event.target.value)
        }
        value={value}
      />
      <LocalError message={error} />
    </FieldLabel>
  );
}

export function GroupSubjectBulkPreviewTable({
  dict,
  groups,
  preview
}: {
  dict: Dict;
  groups: TeachingGroupPublic[];
  preview: GroupSubjectBulkPreview;
}) {
  const groupLabels = new Map(groups.map((group) => [group.id, group.label]));
  const rows = groupSubjectBulkPreviewRows(preview);
  const inherited = "—";

  return (
    <section className="space-y-3" data-group-subject-bulk-preview="">
      <div>
        <h3 className="font-semibold">{dict.groupSubjectBulk.previewTitle}</h3>
        <p className={repartoFieldCaptionClass}>
          {formatRepartoMessage(dict.groupSubjectBulk.summary, {
            create: preview.to_create.length,
            update: preview.to_update.length,
            unchanged: preview.unchanged.length,
            conflicts: preview.conflicts.length
          })}
        </p>
      </div>
      {preview.validation_errors.length > 0 ? (
        <div
          className="rounded-md border border-destructive/40 p-3 text-sm text-destructive"
          data-group-subject-bulk-validation-errors=""
          role="alert"
        >
          <strong>{dict.groupSubjectBulk.validationTitle}</strong>
          <ul className="list-disc pl-5">
            {preview.validation_errors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {preview.matched_group_ids.length === 0 ? (
        <p data-group-subject-bulk-empty="matches">
          {dict.groupSubjectBulk.noMatches}
        </p>
      ) : null}
      {rows.length > 0 ? (
        <div className="overflow-x-auto rounded-md border">
          <table
            className="w-full border-collapse text-sm"
            data-reparto-table="group-subject-bulk-preview"
          >
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-3 py-2 text-left">
                  {dict.groupSubjectBulk.column.action}
                </th>
                <th className="px-3 py-2 text-left">
                  {dict.groupSubjectBulk.column.teachingGroup}
                </th>
                <th className="px-3 py-2 text-left">
                  {dict.groupSubjectBulk.column.groupHours}
                </th>
                <th className="px-3 py-2 text-left">
                  {dict.groupSubjectBulk.column.teacherHours}
                </th>
                <th className="px-3 py-2 text-left">
                  {dict.groupSubjectBulk.column.teacherCount}
                </th>
                <th className="px-3 py-2 text-left">
                  {dict.groupSubjectBulk.column.reason}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  className="border-b last:border-0"
                  data-group-subject-bulk-action={row.action}
                  key={`${row.action}:${row.teachingGroupId}`}
                >
                  <td className="px-3 py-2">
                    {dict.groupSubjectBulk.rowAction[row.action]}
                  </td>
                  <td className="px-3 py-2">
                    {groupLabels.get(row.teachingGroupId) ??
                      row.teachingGroupId}
                  </td>
                  <td className="px-3 py-2">
                    {row.groupHours ?? inherited}
                  </td>
                  <td className="px-3 py-2">
                    {row.teacherHours ?? inherited}
                  </td>
                  <td className="px-3 py-2">
                    {row.teacherCount ?? inherited}
                  </td>
                  <td className="px-3 py-2">{row.reason ?? inherited}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : preview.matched_group_ids.length > 0 ? (
        <p data-group-subject-bulk-empty="changes">
          {dict.groupSubjectBulk.noChanges}
        </p>
      ) : null}
    </section>
  );
}

export function GroupSubjectBulkConfirmation({
  count,
  dict,
  isPending,
  mapped,
  onCancel,
  onConfirm
}: {
  count: number;
  dict: Dict;
  isPending: boolean;
  mapped: ReturnType<typeof useMappedError>[0];
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const titleId = "group-subject-bulk-confirmation-title";
  return (
    <section
      aria-labelledby={titleId}
      className="space-y-3 rounded-lg border border-primary/40 bg-muted/30 p-4"
      data-reparto-dialog="group-subject-bulk-confirmation"
      role="alertdialog"
    >
      <h3 className="font-semibold" id={titleId}>
        {dict.groupSubjectBulk.confirmTitle}
      </h3>
      <p>
        {formatRepartoMessage(dict.groupSubjectBulk.confirmBody, { count })}
      </p>
      <RepartoFormError mapped={mapped} />
      <RowActions>
        <ActionButton
          action="confirm-group-subject-bulk"
          disabled={isPending}
          label={dict.groupSubjectBulk.confirmAction}
          onClick={onConfirm}
        />
        <ActionButton
          action="cancel"
          disabled={isPending}
          label={dict.action.cancel}
          onClick={onCancel}
        />
      </RowActions>
    </section>
  );
}

export type GroupSubjectBulkEditorProps = {
  processId: string;
  locale?: "en" | "fr" | "es";
  subjects?: SubjectPublic[];
  teachingGroups?: TeachingGroupPublic[];
  onApplied?: () => void;
};

export function GroupSubjectBulkEditor({
  locale,
  onApplied,
  processId,
  subjects,
  teachingGroups
}: GroupSubjectBulkEditorProps) {
  const dict = useDict(locale);
  const subjectsQuery = useRepartoSubjects(processId);
  const groupsQuery = useRepartoTeachingGroups(processId);
  const previewMutation = usePreviewRepartoGroupSubjects();
  const applyMutation = useApplyRepartoGroupSubjects();
  const [mapped, setError, clearError] = useMappedError();
  const [subjectId, setSubjectId] = useState("");
  const [mode, setMode] =
    useState<GroupSubjectBulkMode>("create_missing");
  const [stage, setStage] = useState("");
  const [minimumGrade, setMinimumGrade] = useState("");
  const [maximumGrade, setMaximumGrade] = useState("");
  const [groupHours, setGroupHours] = useState("");
  const [teacherHours, setTeacherHours] = useState("");
  const [teacherCount, setTeacherCount] = useState("1");
  const [localErrors, setLocalErrors] = useState<
    Partial<Record<BulkFormErrorKey, string>>
  >({});
  const [preview, setPreview] =
    useState<GroupSubjectBulkPreview | null>(null);
  const [previewRequest, setPreviewRequest] =
    useState<GroupSubjectBulkRequestInput | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [stale, setStale] = useState(false);
  const [appliedMessage, setAppliedMessage] = useState<string | null>(null);

  const activeSubjects = subjects ?? subjectsQuery.data?.data ?? [];
  const activeGroups = teachingGroups ?? groupsQuery.data?.data ?? [];
  const stages = useMemo(
    () =>
      [...new Set(activeGroups.map((group) => group.classroom_stage.stage))].sort(
        (left, right) => left.localeCompare(right)
      ),
    [activeGroups]
  );

  function invalidatePreview() {
    setPreview(null);
    setPreviewRequest(null);
    setConfirming(false);
    setStale(false);
    setAppliedMessage(null);
    clearError();
  }

  function updateString(
    setter: (value: string) => void,
    value: string
  ) {
    setter(value);
    setLocalErrors({});
    invalidatePreview();
  }

  function currentValues(): BulkFormValues {
    return {
      subjectId,
      mode,
      stage,
      minimumGrade,
      maximumGrade,
      groupHours,
      teacherHours,
      teacherCount
    };
  }

  function handlePreview() {
    clearError();
    setStale(false);
    setAppliedMessage(null);
    const built = buildGroupSubjectBulkRequest(currentValues(), dict);
    if (!built.ok) {
      setLocalErrors(built.errors);
      return;
    }
    setLocalErrors({});
    previewMutation.mutate(
      { processId, body: built.request },
      {
        onSuccess: (nextPreview) => {
          setPreview(nextPreview);
          setPreviewRequest(built.request);
        },
        onError: (error) => {
          setPreview(null);
          setPreviewRequest(null);
          setError(error);
          repartoToast.error(
            dict.groupSubjectBulk.previewError,
            error instanceof Error ? error.message : undefined
          );
        }
      }
    );
  }

  function handleApply() {
    if (!preview || !previewRequest) return;
    clearError();
    applyMutation.mutate(
      {
        processId,
        body: {
          ...previewRequest,
          expected_affected_count: preview.expected_affected_count
        }
      },
      {
        onSuccess: (result) => {
          const message = formatRepartoMessage(
            dict.groupSubjectBulk.applied,
            {
              created: result.created_count,
              updated: result.updated_count
            }
          );
          setAppliedMessage(message);
          setPreview(null);
          setPreviewRequest(null);
          setConfirming(false);
          repartoToast.success(message);
          onApplied?.();
        },
        onError: (error) => {
          const isStale = isStaleGroupSubjectPreviewError(error);
          setStale(isStale);
          if (isStale) {
            setPreview(null);
            setPreviewRequest(null);
          }
          setConfirming(false);
          setError(error);
          repartoToast.error(
            isStale
              ? dict.groupSubjectBulk.stale
              : dict.groupSubjectBulk.applyError,
            error instanceof Error ? error.message : undefined
          );
        }
      }
    );
  }

  const canApply =
    Boolean(preview && previewRequest) &&
    (preview?.validation_errors.length ?? 0) === 0 &&
    (preview?.expected_affected_count ?? 0) > 0;
  const isQueryLoading =
    (!subjects && subjectsQuery.isLoading) ||
    (!teachingGroups && groupsQuery.isLoading);
  const isQueryError =
    (!subjects && subjectsQuery.isError) ||
    (!teachingGroups && groupsQuery.isError);

  return (
    <section
      className={`${repartoPanelClass} space-y-4`}
      data-reparto-component="group-subject-bulk-editor"
    >
      <header>
        <h2 className="font-semibold">{dict.groupSubjectBulk.title}</h2>
        <p className={repartoFieldCaptionClass}>
          {dict.groupSubjectBulk.description}
        </p>
      </header>
      {isQueryLoading ? (
        <p data-reparto-state="loading">{dict.table.loading}</p>
      ) : null}
      {isQueryError ? (
        <p className="text-sm text-destructive" data-reparto-state="error">
          {dict.groupSubjectBulk.previewError}
        </p>
      ) : null}
      <FormGrid>
        <SelectField
          field="group-subject-subject"
          fieldErrorKey="subject"
          label={dict.field.subject}
          mapped={mapped}
          onChange={(value) => updateString(setSubjectId, value)}
          options={activeSubjects.map((subject) => ({
            value: subject.id,
            label: subject.name
          }))}
          value={subjectId}
        />
        <LocalError message={localErrors.subject} />
        <SelectField
          field="group-subject-mode"
          label={dict.groupSubjectBulk.modeLabel}
          onChange={(value) => {
            if (!value) return;
            setMode(value as GroupSubjectBulkMode);
            setLocalErrors({});
            invalidatePreview();
          }}
          options={(
            ["create_missing", "update_existing", "upsert"] as const
          ).map((value) => ({
            value,
            label: dict.groupSubjectBulk.mode[value]
          }))}
          value={mode}
        />
        <SelectField
          field="group-subject-stage"
          label={dict.field.stage}
          onChange={(value) => updateString(setStage, value)}
          options={stages.map((value) => ({ value, label: value }))}
          placeholder={dict.groupSubjectBulk.allStages}
          value={stage}
        />
        <div>
          <TextField
            field="group-subject-minimum-grade"
            label={dict.groupSubjectBulk.minimumGrade}
            onChange={(value) => updateString(setMinimumGrade, value)}
            type="number"
            value={minimumGrade}
          />
          <LocalError message={localErrors.minimumGrade} />
        </div>
        <div>
          <TextField
            field="group-subject-maximum-grade"
            label={dict.groupSubjectBulk.maximumGrade}
            onChange={(value) => updateString(setMaximumGrade, value)}
            type="number"
            value={maximumGrade}
          />
          <LocalError
            message={localErrors.maximumGrade ?? localErrors.gradeRange}
          />
        </div>
        <HoursField
          error={localErrors.groupHours}
          field="group-subject-group-hours"
          label={dict.groupSubjectBulk.groupHours}
          onChange={(value) => updateString(setGroupHours, value)}
          value={groupHours}
        />
        <HoursField
          error={localErrors.teacherHours}
          field="group-subject-teacher-hours"
          label={dict.groupSubjectBulk.teacherHours}
          onChange={(value) => updateString(setTeacherHours, value)}
          value={teacherHours}
        />
        <div>
          <TextField
            field="group-subject-teacher-count"
            label={dict.groupSubjectBulk.teacherCount}
            onChange={(value) => updateString(setTeacherCount, value)}
            type="number"
            value={teacherCount}
          />
          <LocalError message={localErrors.teacherCount} />
        </div>
      </FormGrid>
      <p className={repartoFieldCaptionClass}>
        {dict.groupSubjectBulk.inheritHint}
      </p>
      <RepartoFormError mapped={mapped} />
      {stale ? (
        <p
          className="rounded-md border border-destructive/40 p-3 text-sm text-destructive"
          data-group-subject-bulk-stale=""
          role="alert"
        >
          {dict.groupSubjectBulk.stale}
        </p>
      ) : null}
      {appliedMessage ? (
        <p data-group-subject-bulk-result="" role="status">
          {appliedMessage}
        </p>
      ) : null}
      <RowActions>
        <ActionButton
          action="group-subject-preview"
          disabled={
            isQueryLoading ||
            isQueryError ||
            previewMutation.isPending ||
            applyMutation.isPending
          }
          label={dict.groupSubjectBulk.previewAction}
          onClick={handlePreview}
        />
        <ActionButton
          action="group-subject-apply"
          disabled={!canApply || applyMutation.isPending}
          label={dict.groupSubjectBulk.confirmAction}
          onClick={() => setConfirming(true)}
        />
      </RowActions>
      {preview ? (
        <GroupSubjectBulkPreviewTable
          dict={dict}
          groups={activeGroups}
          preview={preview}
        />
      ) : null}
      {confirming && preview ? (
        <GroupSubjectBulkConfirmation
          count={preview.expected_affected_count}
          dict={dict}
          isPending={applyMutation.isPending}
          mapped={mapped}
          onCancel={() => setConfirming(false)}
          onConfirm={handleApply}
        />
      ) : null}
    </section>
  );
}

export type { BulkFormValues, BulkFormErrorKey };
