import type {
  MainActivitySyncField,
  MainActivitySyncPreview,
  TeachingActivityPublic
} from "../schemas.js";

/**
 * Source-to-activity sync state for materialized main activities
 * (backend plan §20.10, §20.20).
 *
 * Editing a source `GroupSubject` never overwrites the activity it
 * materialized. The activity is marked `out_of_sync` instead, plan validation
 * is blocked, and the values only move across through an explicit apply that
 * echoes a preview fingerprint. This helper owns the two decisions that follow
 * from that and keeps them out of the rendering layer:
 *
 * 1. which live activities are currently out of sync — read from the service's
 *    own `sync_state`, never inferred by comparing values in the browser;
 * 2. what a fetched preview permits — apply, or a different flow entirely.
 *
 * Nothing here recomputes hours: §20.22 keeps arithmetic on the service, and
 * the preview already carries both sides of every difference.
 */

/** One live main activity whose source cell has drifted. */
export type OutOfSyncActivity = {
  activityId: string;
  /** The cell the activity was materialized from; the sync flow is keyed by it. */
  groupSubjectId: string;
  subjectId: string;
};

/**
 * List the live `main_generated` activities the service reports as out of sync.
 *
 * A retired activity is excluded: its drift is the guarded-retirement flow's
 * business, not sync's. An activity with no `source_group_subject_id` is
 * excluded too — without a source cell there is nothing to preview against,
 * and the sync endpoints are addressed by cell id.
 */
export function listOutOfSyncActivities(
  activities: readonly TeachingActivityPublic[]
): OutOfSyncActivity[] {
  return activities
    .filter(
      (activity) =>
        activity.source === "main_generated" &&
        activity.retired_at === null &&
        activity.sync_state === "out_of_sync" &&
        activity.source_group_subject_id !== null
    )
    .map((activity) => ({
      activityId: activity.id,
      groupSubjectId: activity.source_group_subject_id as string,
      subjectId: activity.subject_id
    }));
}

/** One rendered difference row: the field key plus both exact values. */
export type ActivitySyncDifferenceRow = {
  field: MainActivitySyncField;
  currentValue: string;
  sourceValue: string;
};

/** Why an otherwise-fetched preview cannot be applied. */
export type ActivitySyncBlockedReason =
  /** The source cell is retired; guarded activity retirement owns this case. */
  | "retirement_required"
  /** Source and activity already agree and the activity is already in sync. */
  | "no_changes";

/** What the department-head sync panel should show for one activity. */
export type ActivitySyncPreviewState =
  | { kind: "idle" }
  | {
      kind: "blocked";
      reason: ActivitySyncBlockedReason;
      differences: readonly ActivitySyncDifferenceRow[];
      requiresReconciliation: boolean;
      affectedAssignmentCount: number;
    }
  | {
      kind: "applicable";
      differences: readonly ActivitySyncDifferenceRow[];
      /** Applying will route assigned slots through reconciliation. */
      requiresReconciliation: boolean;
      affectedAssignmentCount: number;
      activeAssignmentCount: number;
      /** Echoed back on apply; the service 409s when it no longer matches. */
      fingerprint: string;
    };

/**
 * Reduce a fetched preview to what the panel may offer.
 *
 * Absent is not "nothing to do": no preview is `idle`, which renders the
 * request affordance rather than a false "already in sync". A retired source
 * blocks apply even when values differ, because the backend refuses it — the
 * UI must not offer an action it knows will 409.
 *
 * The reconciliation warning is passed through, never derived: whether an
 * apply disturbs assigned slots is a server-side question about live
 * occupancy, and the count printed next to it comes from the same payload.
 */
export function buildActivitySyncPreviewState(
  preview: MainActivitySyncPreview | null | undefined
): ActivitySyncPreviewState {
  if (!preview) return { kind: "idle" };
  const differences = preview.differences.map((difference) => ({
    field: difference.field,
    currentValue: difference.current_value,
    sourceValue: difference.source_value
  }));
  const impact = preview.assignment_impact;
  if (preview.retirement_required) {
    return {
      kind: "blocked",
      reason: "retirement_required",
      differences,
      requiresReconciliation: impact.requires_reconciliation,
      affectedAssignmentCount: impact.affected_assignment_count
    };
  }
  if (preview.is_noop && preview.sync_state === "in_sync") {
    return {
      kind: "blocked",
      reason: "no_changes",
      differences,
      requiresReconciliation: impact.requires_reconciliation,
      affectedAssignmentCount: impact.affected_assignment_count
    };
  }
  return {
    kind: "applicable",
    differences,
    requiresReconciliation: impact.requires_reconciliation,
    affectedAssignmentCount: impact.affected_assignment_count,
    activeAssignmentCount: impact.active_assignment_count,
    fingerprint: preview.preview_fingerprint
  };
}
