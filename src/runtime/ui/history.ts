import { hoursSign } from "../decimals.js";
import type {
  AssignmentProcessStatus,
  ExportArtifactPublic,
  ProcessSummary,
  ProcessVersionPublic,
  VersionComparison
} from "../schemas.js";

export type ExportCenterState = {
  finalBlocked: boolean;
  availableExportTypes: string[];
  latestBackupId: string | null;
  restoreDraftEnabled: boolean;
};

export type LeadershipWorkflowAction =
  | "mark-returned"
  | "start-revision"
  | "reopen-final"
  | null;

export function buildExportCenterState(
  summary: ProcessSummary,
  exports: ExportArtifactPublic[]
): ExportCenterState {
  const latestBackup = [...exports]
    .filter((item) => item.export_type === "backup" && item.format === "json")
    .at(-1);
  const finalBlocked = summary.blocking_validation_count > 0;
  return {
    finalBlocked,
    availableExportTypes: finalBlocked
      ? ["internal_draft", "school_leadership", "teacher_summary", "backup"]
      : ["internal_draft", "school_leadership", "final", "teacher_summary", "backup"],
    latestBackupId: latestBackup?.id ?? null,
    restoreDraftEnabled: latestBackup !== undefined
  };
}

/** The plan §10.3 comparison dimensions, in reading order. */
export type VersionComparisonDimensionKey =
  | "allocation"
  | "group_hours"
  | "teacher_load"
  | "subject_category"
  | "activity"
  | "group_link"
  | "teacher_position_count"
  | "participant_target"
  | "requirement_generation";

/** A signed delta the service publishes, named exactly as the contract does. */
export type VersionComparisonDeltaKey =
  | "allocation_delta"
  | "group_load_delta"
  | "teacher_load_delta"
  | "participant_target_total_delta"
  | "generation_number_delta"
  | "teacher_count_delta"
  | "activity_count_delta"
  | "requirement_count_delta";

/**
 * One signed delta ready to render.
 *
 * `value` is the service's own canonical string for an hour delta and its
 * integer for a count; the view never reformats either. `sign` is derived
 * through the decimal helpers, so no comparison runs in binary floating point.
 * A `null` value is *not comparable* — the only case is `allocation_delta`
 * when one side has no allocation at all — and carries a `null` sign with it.
 */
export type VersionComparisonDelta = {
  readonly key: VersionComparisonDeltaKey;
  readonly unit: "hours" | "count";
  readonly value: string | number | null;
  readonly sign: -1 | 0 | 1 | null;
};

export type VersionComparisonDimension = {
  readonly key: VersionComparisonDimensionKey;
  readonly changed: boolean;
  readonly deltas: readonly VersionComparisonDelta[];
};

export type VersionComparisonView = {
  /** Nothing differs: no dimension flag and no changed section. */
  readonly identical: boolean;
  readonly changedDimensionCount: number;
  readonly changedSections: readonly string[];
  /**
   * Sections differ while every §10.3 dimension is unchanged — a real state
   * (a plan status, a stored reason), reported as itself rather than as "no
   * changes" or as a change the comparison cannot name.
   */
  readonly otherChangesOnly: boolean;
  readonly dimensions: readonly VersionComparisonDimension[];
};

function hoursDelta(
  key: VersionComparisonDeltaKey,
  value: string | null
): VersionComparisonDelta {
  return {
    key,
    unit: "hours",
    value,
    sign: value === null ? null : hoursSign(value)
  };
}

function countDelta(
  key: VersionComparisonDeltaKey,
  value: number
): VersionComparisonDelta {
  return {
    key,
    unit: "count",
    value,
    sign: value < 0 ? -1 : value > 0 ? 1 : 0
  };
}

/**
 * Reduce a service comparison to the nine §10.3 dimensions the view renders.
 *
 * A dimension's `changed` flag comes from the service and is never inferred
 * from its delta: a flag is a set comparison (which activity ids, which
 * group links, which per-participant targets) and a delta is arithmetic on
 * totals, so "one added, one removed" is a genuine change with a zero delta.
 * Three dimensions — subject category, group link and teacher-position count —
 * have no delta at all, and that is reported as an empty list rather than
 * padded with a zero the service never sent.
 *
 * The two unpaired counts are placed where the service's own definition puts
 * them: `teacher_count_delta` under the participant target (the target map is
 * keyed by participant, so adding or removing one changes it) and
 * `requirement_count_delta` under requirement generation (the generation
 * fingerprint is the generation number plus the live slot ids).
 */
export function buildVersionComparisonView(
  comparison: VersionComparison
): VersionComparisonView {
  const dimensions: readonly VersionComparisonDimension[] = [
    {
      key: "allocation",
      changed: comparison.allocation_changed,
      deltas: [hoursDelta("allocation_delta", comparison.allocation_delta)]
    },
    {
      key: "group_hours",
      changed: comparison.group_hours_changed,
      deltas: [hoursDelta("group_load_delta", comparison.group_load_delta)]
    },
    {
      key: "teacher_load",
      changed: comparison.teacher_load_changed,
      deltas: [hoursDelta("teacher_load_delta", comparison.teacher_load_delta)]
    },
    {
      key: "subject_category",
      changed: comparison.subject_category_changed,
      deltas: []
    },
    {
      key: "activity",
      changed: comparison.activity_added_or_removed,
      deltas: [countDelta("activity_count_delta", comparison.activity_count_delta)]
    },
    {
      key: "group_link",
      changed: comparison.group_link_added_or_removed,
      deltas: []
    },
    {
      key: "teacher_position_count",
      changed: comparison.teacher_position_count_changed,
      deltas: []
    },
    {
      key: "participant_target",
      changed: comparison.participant_target_changed,
      deltas: [
        hoursDelta(
          "participant_target_total_delta",
          comparison.participant_target_total_delta
        ),
        countDelta("teacher_count_delta", comparison.teacher_count_delta)
      ]
    },
    {
      key: "requirement_generation",
      changed: comparison.requirement_generation_changed,
      deltas: [
        countDelta("generation_number_delta", comparison.generation_number_delta),
        countDelta("requirement_count_delta", comparison.requirement_count_delta)
      ]
    }
  ];
  const changedDimensionCount = dimensions.filter(
    (dimension) => dimension.changed
  ).length;
  const changedSections = comparison.changed_sections;
  return {
    identical: changedDimensionCount === 0 && changedSections.length === 0,
    changedDimensionCount,
    changedSections,
    otherChangesOnly: changedDimensionCount === 0 && changedSections.length > 0,
    dimensions
  };
}

/**
 * Dictionary key for each snapshot section the service may report.
 *
 * The service's section names are its own storage vocabulary, and one of them
 * collides with the freeze §5.4 rule that nothing but `entity.*` may be called
 * "teachers": the `teachers` section holds process participants, not the
 * teacher roster, so it is labelled as what it is. A section missing from this
 * map is rendered as its raw code — an unknown section is reported, not hidden.
 */
export const VERSION_SECTION_LABEL_KEYS = {
  allocation_revisions: "allocationRevisions",
  teaching_plan: "teachingPlan",
  subjects: "subjects",
  group_subjects: "groupSubjects",
  teaching_activities: "teachingActivities",
  requirements: "requirements",
  teachers: "processParticipants"
} as const;

export type VersionSectionLabelKey =
  (typeof VERSION_SECTION_LABEL_KEYS)[keyof typeof VERSION_SECTION_LABEL_KEYS];

/** The dictionary key for a section name, or `null` when the service added one. */
export function versionSectionLabelKey(
  section: string
): VersionSectionLabelKey | null {
  return (
    VERSION_SECTION_LABEL_KEYS[
      section as keyof typeof VERSION_SECTION_LABEL_KEYS
    ] ?? null
  );
}

/** Why two versions cannot be compared, as a stable code. */
export type VersionComparisonBlockedReason = "not_enough_versions" | "same_version";

export type VersionSelectionState = {
  readonly leftVersionId: string | null;
  readonly rightVersionId: string | null;
  readonly canCompare: boolean;
  readonly reason: VersionComparisonBlockedReason | null;
};

export function canCompareVersions(
  versions: readonly ProcessVersionPublic[]
): boolean {
  return versions.length >= 2;
}

/**
 * Which two versions the comparison panel is pointed at.
 *
 * The default is the last two — the service lists versions oldest-first, so
 * "what changed since the previous capture" is the question a head asks first.
 * A requested id that is not in the list is dropped back to that default
 * rather than sent: a comparison against a version this process does not own
 * is a 404 the UI can see coming.
 *
 * Comparing a version with itself is refused here rather than by the service,
 * because its answer — every flag false — reads as "nothing changed" when the
 * truth is "nothing was compared".
 */
export function buildVersionSelectionState(
  versions: readonly ProcessVersionPublic[],
  selection: { left?: string | null; right?: string | null } = {}
): VersionSelectionState {
  const known = new Set(versions.map((version) => version.id));
  const last = versions.length - 1;
  const defaultRight = last >= 0 ? versions[last].id : null;
  const defaultLeft = last >= 1 ? versions[last - 1].id : null;
  const left =
    selection.left && known.has(selection.left) ? selection.left : defaultLeft;
  const right =
    selection.right && known.has(selection.right) ? selection.right : defaultRight;
  const reason: VersionComparisonBlockedReason | null = !canCompareVersions(versions)
    ? "not_enough_versions"
    : left === right
      ? "same_version"
      : null;
  return {
    leftVersionId: left,
    rightVersionId: right,
    canCompare: reason === null,
    reason
  };
}

export function nextLeadershipWorkflowAction(
  status: AssignmentProcessStatus
): LeadershipWorkflowAction {
  if (status === "sent_to_school_leadership") return "mark-returned";
  if (status === "returned_by_school_leadership") return "start-revision";
  if (status === "final") return "reopen-final";
  return null;
}
