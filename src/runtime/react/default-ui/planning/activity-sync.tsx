"use client";

import { useMemo, useState } from "react";

import { RepartoApiError } from "../../../errors.js";
import {
  formatRepartoMessage,
  type RepartoDictionary
} from "../../../i18n/index.js";
import type {
  GroupSubjectPublic,
  MainActivitySyncPreview,
  SubjectPublic,
  TeachingActivityPublic,
  TeachingGroupPublic
} from "../../../schemas.js";
import {
  buildActivitySyncPreviewState,
  listOutOfSyncActivities,
  type ActivitySyncPreviewState
} from "../../../ui/activitySync.js";
import {
  useApplyRepartoActivitySync,
  usePreviewRepartoActivitySync,
  useRepartoGroupSubjects,
  useRepartoSubjects,
  useRepartoTeachingActivities,
  useRepartoTeachingGroups
} from "../../hooks.js";
import {
  repartoFieldCaptionClass,
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

/**
 * The OUT_OF_SYNC main-activity panel (backend plan §20.10, §20.20).
 *
 * Editing a source group-subject cell never rewrites the activity it
 * materialized. The service marks the activity `out_of_sync` and blocks plan
 * validation until a department head has *seen* what would change and applied
 * it explicitly. This panel is that step, and it is department-head-only: the
 * planning values, the assigned-slot impact and the affected slot count are
 * administration data, and no part of this vocabulary reaches the teacher or
 * shared-screen tiers.
 *
 * Two rules keep it honest. The sync state is the service's own `sync_state` —
 * the browser never compares values to decide whether something drifted. And
 * apply is only ever driven by a preview: the request echoes the preview's
 * fingerprint, so a plan that changed underneath the head is refused (409)
 * instead of silently applying against a state nobody reviewed.
 */

/** One out-of-sync activity, with the labels its row prints. */
export type ActivitySyncRow = {
  activityId: string;
  groupSubjectId: string;
  subject: string;
  teachingGroup: string;
};

/**
 * Build the row list from the already-loaded planning data.
 *
 * A cell or subject that cannot be resolved still yields a row — an activity
 * the service says is out of sync must never disappear from the panel because
 * a label lookup missed. It falls back to the dictionary's unknown labels, and
 * never to an identifier: a UUID is not a user-facing label.
 */
export function buildActivitySyncRows({
  activities,
  dict,
  groupSubjects,
  subjects,
  teachingGroups
}: {
  activities: readonly TeachingActivityPublic[];
  dict: RepartoDictionary;
  groupSubjects: readonly GroupSubjectPublic[];
  subjects: readonly SubjectPublic[];
  teachingGroups: readonly TeachingGroupPublic[];
}): ActivitySyncRow[] {
  const subjectById = new Map(
    subjects.map((subject) => [subject.id, subject.name])
  );
  const cellById = new Map(groupSubjects.map((cell) => [cell.id, cell]));
  const groupById = new Map(
    teachingGroups.map((group) => [group.id, group.label])
  );
  return listOutOfSyncActivities(activities)
    .map((activity) => {
      const cell = cellById.get(activity.groupSubjectId);
      return {
        activityId: activity.activityId,
        groupSubjectId: activity.groupSubjectId,
        subject:
          subjectById.get(activity.subjectId) ??
          dict.requirements.unknownSubject,
        teachingGroup:
          (cell ? groupById.get(cell.teaching_group_id) : undefined) ??
          dict.planning.sync.unknownTeachingGroup
      };
    })
    .sort(
      (left, right) =>
        left.subject.localeCompare(right.subject) ||
        left.teachingGroup.localeCompare(right.teachingGroup)
    );
}

/** The source-vs-current difference table for one preview. */
export function ActivitySyncDifferences({
  dict,
  state
}: {
  dict: RepartoDictionary;
  state: ActivitySyncPreviewState;
}) {
  const labels = dict.planning.sync;
  if (state.kind === "idle" || state.differences.length === 0) {
    return (
      <p data-reparto-state="no-differences">{labels.noValueDifferences}</p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-md border">
      <table
        className="w-full border-collapse text-sm"
        data-reparto-table="activity-sync-differences"
      >
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="px-3 py-2 text-left">{labels.column.field}</th>
            <th className="px-3 py-2 text-left">{labels.column.current}</th>
            <th className="px-3 py-2 text-left">{labels.column.source}</th>
          </tr>
        </thead>
        <tbody>
          {state.differences.map((difference) => (
            <tr
              className="border-b last:border-0"
              data-activity-sync-field={difference.field}
              key={difference.field}
            >
              <td className="px-3 py-2 font-medium">
                {labels.field[difference.field]}
              </td>
              <td className="px-3 py-2">{difference.currentValue}</td>
              <td className="px-3 py-2">{difference.sourceValue}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Pure presentational half: everything decided by the two view-state helpers. */
export function ActivitySyncView({
  applyPending = false,
  dict,
  error,
  isLoading = false,
  onApply,
  onCancel,
  onPreview,
  previewPending = false,
  rows,
  selectedRow,
  state
}: {
  applyPending?: boolean;
  dict: RepartoDictionary;
  error?: unknown;
  isLoading?: boolean;
  onApply?: () => void;
  onCancel?: () => void;
  onPreview?: (row: ActivitySyncRow) => void;
  previewPending?: boolean;
  rows: readonly ActivitySyncRow[];
  selectedRow: ActivitySyncRow | null;
  state: ActivitySyncPreviewState;
}) {
  const labels = dict.planning.sync;
  return (
    <section
      className={`${repartoPanelClass} space-y-4`}
      data-reparto-component="activity-sync"
      data-reparto-tier="department-head"
    >
      <header>
        <h2 className="font-semibold">{labels.title}</h2>
        <p className={repartoFieldCaptionClass}>{labels.description}</p>
      </header>
      {isLoading ? (
        <p data-reparto-state="loading" role="status">
          {labels.loading}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" data-reparto-state="error">
          {error instanceof Error ? error.message : labels.unavailable}
        </p>
      ) : null}
      {!isLoading && !error && rows.length === 0 ? (
        <p data-activity-sync-empty="" data-reparto-state="empty">
          {labels.empty}
        </p>
      ) : null}
      {rows.length > 0 ? (
        <ul className="space-y-2" data-reparto-list="activity-sync">
          {rows.map((row) => (
            <li
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/70 p-3"
              data-activity-sync-row={row.groupSubjectId}
              key={row.groupSubjectId}
            >
              <div>
                <p className="font-medium">
                  {formatRepartoMessage(labels.activityLabel, {
                    subject: row.subject,
                    teachingGroup: row.teachingGroup
                  })}
                </p>
                <span
                  className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900"
                  data-activity-sync-state="out_of_sync"
                >
                  {labels.state.out_of_sync}
                </span>
              </div>
              <ActionButton
                action="review-activity-sync"
                disabled={previewPending || applyPending}
                label={labels.reviewAction}
                onClick={() => onPreview?.(row)}
              />
            </li>
          ))}
        </ul>
      ) : null}
      {selectedRow && state.kind !== "idle" ? (
        <section
          aria-labelledby="activity-sync-preview-title"
          className="space-y-3 rounded-lg border border-primary/40 bg-muted/30 p-4"
          data-reparto-dialog="activity-sync-preview"
          role="alertdialog"
        >
          <h3 className="font-semibold" id="activity-sync-preview-title">
            {formatRepartoMessage(labels.previewTitle, {
              subject: selectedRow.subject,
              teachingGroup: selectedRow.teachingGroup
            })}
          </h3>
          <ActivitySyncDifferences dict={dict} state={state} />
          {state.requiresReconciliation ? (
            <p
              className="text-sm font-medium text-amber-900"
              data-activity-sync-impact="reconciliation-required"
            >
              {formatRepartoMessage(labels.reconciliationRequired, {
                count: state.affectedAssignmentCount
              })}
            </p>
          ) : (
            <p data-activity-sync-impact="none">{labels.noAssignmentImpact}</p>
          )}
          {state.kind === "blocked" ? (
            <p
              className="text-sm text-destructive"
              data-activity-sync-blocked={state.reason}
            >
              {labels.blocked[state.reason]}
            </p>
          ) : null}
          <RowActions>
            {state.kind === "applicable" ? (
              <ActionButton
                action="apply-activity-sync"
                disabled={applyPending}
                label={labels.applyAction}
                onClick={onApply}
              />
            ) : null}
            <ActionButton
              action="cancel"
              disabled={applyPending}
              label={dict.action.cancel}
              onClick={onCancel}
            />
          </RowActions>
        </section>
      ) : null}
    </section>
  );
}

/** The connected department-head panel: queries, preview and explicit apply. */
/** The connected department-head panel: queries, preview and explicit apply. */
export function MainActivitySyncPanel(props: PlanningPanelProps) {
  return (
    <PlanningPanelGate>
      <MainActivitySyncPanelBody {...props} />
    </PlanningPanelGate>
  );
}

function MainActivitySyncPanelBody({ locale, processId }: PlanningPanelProps) {
  const dict = useDict(locale);
  const activitiesQuery = useRepartoTeachingActivities(processId);
  const groupSubjectsQuery = useRepartoGroupSubjects(processId);
  const subjectsQuery = useRepartoSubjects(processId);
  const groupsQuery = useRepartoTeachingGroups(processId);
  const previewMutation = usePreviewRepartoActivitySync();
  const applyMutation = useApplyRepartoActivitySync();
  const [mapped, setError, clearError] = useMappedError();
  const [selectedRow, setSelectedRow] = useState<ActivitySyncRow | null>(null);
  const [preview, setPreview] = useState<MainActivitySyncPreview | null>(null);

  const rows = useMemo(
    () =>
      buildActivitySyncRows({
        activities: activitiesQuery.data?.data ?? [],
        dict,
        groupSubjects: groupSubjectsQuery.data?.data ?? [],
        subjects: subjectsQuery.data?.data ?? [],
        teachingGroups: groupsQuery.data?.data ?? []
      }),
    [
      activitiesQuery.data,
      dict,
      groupSubjectsQuery.data,
      groupsQuery.data,
      subjectsQuery.data
    ]
  );
  const state = buildActivitySyncPreviewState(preview);
  const isLoading =
    activitiesQuery.isLoading ||
    groupSubjectsQuery.isLoading ||
    subjectsQuery.isLoading ||
    groupsQuery.isLoading;
  const queryError =
    activitiesQuery.error ??
    groupSubjectsQuery.error ??
    subjectsQuery.error ??
    groupsQuery.error;

  function closePreview() {
    setSelectedRow(null);
    setPreview(null);
  }

  function handlePreview(row: ActivitySyncRow) {
    if (!processId || previewMutation.isPending) return;
    clearError();
    setSelectedRow(row);
    setPreview(null);
    previewMutation.mutate(
      { processId, groupSubjectId: row.groupSubjectId },
      {
        onSuccess: setPreview,
        onError: (error) => {
          setSelectedRow(null);
          setError(error);
          repartoToast.error(
            dict.planning.sync.previewError,
            error instanceof Error ? error.message : undefined
          );
        }
      }
    );
  }

  function handleApply() {
    if (
      !processId ||
      !selectedRow ||
      state.kind !== "applicable" ||
      applyMutation.isPending
    ) {
      return;
    }
    clearError();
    applyMutation.mutate(
      {
        processId,
        groupSubjectId: selectedRow.groupSubjectId,
        body: { expected_preview_fingerprint: state.fingerprint }
      },
      {
        onSuccess: (result) => {
          closePreview();
          repartoToast.success(
            formatRepartoMessage(dict.planning.sync.applySuccess, {
              count: result.applied_differences.length
            })
          );
        },
        onError: (error) => {
          setError(error);
          // The service owns staleness: a 409 means the inputs moved under this
          // preview, so the only correct next step is a fresh one.
          const stale = error instanceof RepartoApiError && error.status === 409;
          repartoToast.error(
            stale ? dict.planning.sync.staleError : dict.planning.sync.applyError,
            error instanceof Error ? error.message : undefined
          );
          if (stale) setPreview(null);
        }
      }
    );
  }

  return (
    <>
      <ActivitySyncView
        applyPending={applyMutation.isPending}
        dict={dict}
        error={queryError}
        isLoading={isLoading}
        onApply={handleApply}
        onCancel={closePreview}
        onPreview={handlePreview}
        previewPending={previewMutation.isPending}
        rows={rows}
        selectedRow={selectedRow}
        state={state}
      />
      <RepartoFormError mapped={mapped} />
    </>
  );
}
