"use client";

import { useMemo, useState } from "react";

import {
  formatRepartoMessage,
  type RepartoDictionary
} from "../../../i18n/index.js";
import type {
  GroupSubjectPublic,
  MainMaterializationResult,
  SubjectPublic,
  TeachingActivityPublic,
  TeachingGroupPublic
} from "../../../schemas.js";
import {
  useMaterializeRepartoMainActivities,
  useRepartoGroupSubjects,
  useRepartoSubjects,
  useRepartoTeachingActivities,
  useRepartoTeachingGroups
} from "../../hooks.js";
import {
  repartoFieldCaptionClass,
  repartoMetricLabelClass,
  repartoMetricValueLargeClass,
  repartoPanelClass
} from "../../styles.js";
import { repartoToast } from "../../ui/toast-notification.js";
import {
  ActionButton,
  RepartoFormError,
  RowActions,
  useDict,
  useMappedError
} from "../process-crud/shared.js";
import {
  PlanningPanelGate,
  type PlanningPanelProps
} from "./panel-gate.js";

export type MainSubjectMaterializationRow = {
  groupSubjectId: string;
  activityId: string | null;
  teachingGroup: string;
  subject: string;
  groupHours: string | null;
  teacherHours: string | null;
  teacherCount: number;
  /**
   * `out_of_sync` is the service's own `sync_state`, never a value comparison
   * made here (backend plan §20.10): the row shows the drift, and the sync
   * panel owns the preview and the explicit apply.
   */
  state: "missing" | "materialized" | "out_of_sync";
};

export function buildMainSubjectMaterializationRows({
  activities,
  groupSubjects,
  subjects,
  teachingGroups
}: {
  activities: TeachingActivityPublic[];
  groupSubjects: GroupSubjectPublic[];
  subjects: SubjectPublic[];
  teachingGroups: TeachingGroupPublic[];
}): MainSubjectMaterializationRow[] {
  const mainSubjects = new Map(
    subjects
      .filter((subject) => subject.allocation_category === "main")
      .map((subject) => [subject.id, subject])
  );
  const groups = new Map(
    teachingGroups.map((group) => [group.id, group.label])
  );
  const liveMaterializations = new Map(
    activities
      .filter(
        (activity) =>
          activity.source === "main_generated" &&
          activity.source_group_subject_id !== null &&
          activity.retired_at === null
      )
      .map((activity) => [activity.source_group_subject_id as string, activity])
  );

  return groupSubjects
    .filter(
      (groupSubject) =>
        groupSubject.active && mainSubjects.has(groupSubject.subject_id)
    )
    .map((groupSubject) => {
      const subject = mainSubjects.get(groupSubject.subject_id);
      if (!subject) {
        throw new Error("Main subject lookup became inconsistent.");
      }
      const activity = liveMaterializations.get(groupSubject.id) ?? null;
      return {
        groupSubjectId: groupSubject.id,
        activityId: activity?.id ?? null,
        teachingGroup:
          groups.get(groupSubject.teaching_group_id) ??
          groupSubject.teaching_group_id,
        subject: subject.name,
        groupHours:
          activity?.group_weekly_hours_per_group ??
          groupSubject.group_weekly_hours ??
          subject.default_group_weekly_hours,
        teacherHours:
          activity?.teacher_weekly_hours_per_position ??
          groupSubject.teacher_weekly_hours_per_position ??
          subject.default_teacher_weekly_hours_per_position,
        teacherCount:
          activity?.required_teacher_count ??
          groupSubject.required_teacher_count,
        state: !activity
          ? ("missing" as const)
          : activity.sync_state === "out_of_sync"
            ? ("out_of_sync" as const)
            : ("materialized" as const)
      };
    })
    .sort(
      (left, right) =>
        left.subject.localeCompare(right.subject) ||
        left.teachingGroup.localeCompare(right.teachingGroup)
    );
}

function displayHours(value: string | null, inherited: string): string {
  return value === null ? inherited : `${value} h`;
}

export function MainSubjectMaterializationConfirmation({
  dict,
  isPending,
  materializedCount,
  missingCount,
  onCancel,
  onConfirm
}: {
  dict: RepartoDictionary;
  isPending: boolean;
  materializedCount: number;
  missingCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <section
      aria-labelledby="main-materialization-confirmation-title"
      className="space-y-3 rounded-lg border border-primary/40 bg-muted/30 p-4"
      data-reparto-dialog="main-materialization-confirmation"
      role="alertdialog"
    >
      <h3
        className="font-semibold"
        id="main-materialization-confirmation-title"
      >
        {dict.planning.materialization.confirmTitle}
      </h3>
      <p>
        {formatRepartoMessage(dict.planning.materialization.confirmBody, {
          missing: missingCount,
          materialized: materializedCount
        })}
      </p>
      <RowActions>
        <ActionButton
          action="confirm-main-materialization"
          disabled={isPending || missingCount === 0}
          label={dict.planning.materialization.confirmAction}
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

export function MainSubjectMaterializationTable({
  dict,
  rows
}: {
  dict: RepartoDictionary;
  rows: MainSubjectMaterializationRow[];
}) {
  if (rows.length === 0) {
    return (
      <p data-main-materialization-empty="" data-reparto-state="empty">
        {dict.planning.materialization.empty}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table
        className="w-full border-collapse text-sm"
        data-reparto-table="main-subject-materialization"
      >
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="px-3 py-2 text-left">
              {dict.planning.materialization.column.subject}
            </th>
            <th className="px-3 py-2 text-left">
              {dict.planning.materialization.column.teachingGroup}
            </th>
            <th className="px-3 py-2 text-left">
              {dict.planning.materialization.column.groupHours}
            </th>
            <th className="px-3 py-2 text-left">
              {dict.planning.materialization.column.teacherHours}
            </th>
            <th className="px-3 py-2 text-left">
              {dict.planning.materialization.column.teacherCount}
            </th>
            <th className="px-3 py-2 text-left">
              {dict.planning.materialization.column.state}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              className="border-b last:border-0"
              data-main-materialization-state={row.state}
              data-group-subject-id={row.groupSubjectId}
              key={row.groupSubjectId}
            >
              <td className="px-3 py-2 font-medium">{row.subject}</td>
              <td className="px-3 py-2">{row.teachingGroup}</td>
              <td className="px-3 py-2">
                {displayHours(
                  row.groupHours,
                  dict.planning.materialization.inherited
                )}
              </td>
              <td className="px-3 py-2">
                {displayHours(
                  row.teacherHours,
                  dict.planning.materialization.inherited
                )}
              </td>
              <td className="px-3 py-2">{row.teacherCount}</td>
              <td className="px-3 py-2">
                <span
                  className={
                    row.state === "materialized"
                      ? "rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800"
                      : row.state === "out_of_sync"
                        ? "rounded-full bg-rose-100 px-2 py-1 text-xs font-medium text-rose-900"
                        : "rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900"
                  }
                >
                  {dict.planning.materialization.state[row.state]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Materialize the main `GroupSubject` rows into teaching activities. */
export function MainSubjectMaterialization(props: PlanningPanelProps) {
  return (
    <PlanningPanelGate>
      <MainSubjectMaterializationBody {...props} />
    </PlanningPanelGate>
  );
}

function MainSubjectMaterializationBody({ locale, processId }: PlanningPanelProps) {
  const dict = useDict(locale);
  const subjectsQuery = useRepartoSubjects(processId);
  const groupsQuery = useRepartoTeachingGroups(processId);
  const groupSubjectsQuery = useRepartoGroupSubjects(processId);
  const activitiesQuery = useRepartoTeachingActivities(processId);
  const materializeMutation = useMaterializeRepartoMainActivities();
  const [mapped, setError, clearError] = useMappedError();
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<MainMaterializationResult | null>(null);

  const rows = useMemo(
    () =>
      buildMainSubjectMaterializationRows({
        activities: activitiesQuery.data?.data ?? [],
        groupSubjects: groupSubjectsQuery.data?.data ?? [],
        subjects: subjectsQuery.data?.data ?? [],
        teachingGroups: groupsQuery.data?.data ?? []
      }),
    [
      activitiesQuery.data,
      groupSubjectsQuery.data,
      groupsQuery.data,
      subjectsQuery.data
    ]
  );
  const missingCount = rows.filter((row) => row.state === "missing").length;
  const materializedCount = rows.length - missingCount;
  const isLoading =
    subjectsQuery.isLoading ||
    groupsQuery.isLoading ||
    groupSubjectsQuery.isLoading ||
    activitiesQuery.isLoading;
  const queryError =
    subjectsQuery.error ??
    groupsQuery.error ??
    groupSubjectsQuery.error ??
    activitiesQuery.error;

  function handleMaterialize() {
    if (!processId || missingCount === 0 || materializeMutation.isPending) {
      return;
    }
    clearError();
    materializeMutation.mutate(processId, {
      onSuccess: (nextResult) => {
        setResult(nextResult);
        setConfirming(false);
        repartoToast.success(
          formatRepartoMessage(dict.planning.materialization.success, {
            created: nextResult.created_count,
            skipped: nextResult.skipped_count
          })
        );
      },
      onError: (error) => {
        setError(error);
        repartoToast.error(
          dict.planning.materialization.error,
          error instanceof Error ? error.message : undefined
        );
      }
    });
  }

  return (
    <section
      className={`${repartoPanelClass} space-y-4`}
      data-reparto-component="main-subject-materialization"
    >
      <header>
        <h2 className="font-semibold">
          {dict.planning.materialization.title}
        </h2>
        <p className={repartoFieldCaptionClass}>
          {dict.planning.materialization.description}
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-border/70 p-3">
          <p className={repartoMetricLabelClass}>
            {dict.planning.materialization.missing}
          </p>
          <p
            className={repartoMetricValueLargeClass}
            data-main-materialization-count="missing"
          >
            {missingCount}
          </p>
        </div>
        <div className="rounded-md border border-border/70 p-3">
          <p className={repartoMetricLabelClass}>
            {dict.planning.materialization.materialized}
          </p>
          <p
            className={repartoMetricValueLargeClass}
            data-main-materialization-count="materialized"
          >
            {materializedCount}
          </p>
        </div>
      </div>
      {isLoading ? (
        <p data-reparto-state="loading" role="status">
          {dict.planning.materialization.loading}
        </p>
      ) : null}
      {queryError ? (
        <p className="text-sm text-destructive" data-reparto-state="error">
          {queryError instanceof Error
            ? queryError.message
            : dict.planning.materialization.unavailable}
        </p>
      ) : null}
      {!isLoading && !queryError ? (
        <MainSubjectMaterializationTable dict={dict} rows={rows} />
      ) : null}
      <RepartoFormError mapped={mapped} />
      {result ? (
        <p data-main-materialization-result="" role="status">
          {formatRepartoMessage(dict.planning.materialization.success, {
            created: result.created_count,
            skipped: result.skipped_count
          })}
        </p>
      ) : null}
      <RowActions>
        <ActionButton
          action="review-main-materialization"
          disabled={
            isLoading ||
            Boolean(queryError) ||
            materializeMutation.isPending ||
            missingCount === 0
          }
          disabledReason={
            missingCount === 0
              ? dict.planning.materialization.complete
              : null
          }
          label={
            missingCount === 0
              ? dict.planning.materialization.complete
              : formatRepartoMessage(
                  dict.planning.materialization.reviewAction,
                  { count: missingCount }
                )
          }
          onClick={() => {
            setResult(null);
            clearError();
            setConfirming(true);
          }}
        />
      </RowActions>
      {confirming ? (
        <MainSubjectMaterializationConfirmation
          dict={dict}
          isPending={materializeMutation.isPending}
          materializedCount={materializedCount}
          missingCount={missingCount}
          onCancel={() => setConfirming(false)}
          onConfirm={handleMaterialize}
        />
      ) : null}
    </section>
  );
}
