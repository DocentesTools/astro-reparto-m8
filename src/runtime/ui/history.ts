import { hoursSign } from "../decimals.js";
import type {
  AssignmentProcessStatus,
  AssignmentValidationReport,
  ExportArtifactPublic,
  ExportArtifactType,
  FeasibilityStatus,
  PlanningExportMode,
  PlanValidationReport,
  ProcessVersionPublic,
  TeachingPlanPublic,
  VersionComparison
} from "../schemas.js";

/**
 * Why one planning artifact cannot be produced right now, as a stable code.
 *
 * Only the `final` mode can carry one: plan §3.10 is explicit that a draft or a
 * provisional artifact "must never be blocked only because the plan is
 * inexact", so the two open modes have no blocked state to name at all.
 */
export type PlanningExportBlockedReason =
  | "plan_missing"
  | "blocking_validations";

/**
 * One planning-export offer as the export center renders it (plan §7.8).
 *
 * `printsFeasibility` marks the documents §20.25 requires to carry the
 * feasibility status label: a draft or provisional document must say
 * `NOT EVALUATED` / `INFEASIBLE` / `FEASIBLE` on its face rather than let a
 * reader assume the plan was validated. The strict final artifact is produced
 * only from a plan the service already accepted, so it makes no such claim.
 */
export type PlanningExportOffer = {
  readonly mode: PlanningExportMode;
  readonly blocked: boolean;
  readonly reason: PlanningExportBlockedReason | null;
  readonly printsFeasibility: boolean;
};

/**
 * Why the strict final *assignment* export is refused, as a stable code.
 *
 * The order is the order a head fixes them in: there is no plan, then the plan
 * has produced no slots, then the reparto is incomplete, then feasibility is
 * not confirmed on the current state.
 */
export type FinalExportBlockedReason =
  | "plan_missing"
  | "requirements_not_generated"
  | "findings_unavailable"
  | "assignment_blocking"
  | "feasibility_not_confirmed";

export type FinalExportState = {
  readonly allowed: boolean;
  readonly reasons: readonly FinalExportBlockedReason[];
  /** Producing it archives the process, so it needs its own confirmation. */
  readonly archivesProcess: true;
  readonly blockingCount: number | null;
};

export type ExportCenterState = {
  /**
   * The label a provisional document prints (§20.25); `null` while no plan
   * exists, which is *not* the same as `not_evaluated` — there is nothing to
   * evaluate yet.
   */
  readonly feasibilityStatus: FeasibilityStatus | null;
  readonly planStatus: TeachingPlanPublic["status"] | null;
  readonly planningExports: readonly PlanningExportOffer[];
  /**
   * Stored process documents that are never gated: an internal draft, a
   * leadership copy, a participant summary and the backup. `final` is
   * deliberately absent — it is the strict export below, not one option in a
   * row of buttons.
   */
  readonly documentExportTypes: readonly ExportArtifactType[];
  readonly finalExport: FinalExportState;
  readonly latestBackupId: string | null;
  readonly backupCount: number;
};

export type LeadershipWorkflowAction =
  | "mark-returned"
  | "start-revision"
  | "reopen-final"
  | null;

/** Plan statuses that mean requirement slots have been generated at least once. */
const GENERATED_PLAN_STATUSES = new Set<TeachingPlanPublic["status"]>([
  "requirements_generated",
  "stale",
  "reconciliation_required"
]);

/** Stored document types the export center offers unconditionally. */
const DOCUMENT_EXPORT_TYPES: readonly ExportArtifactType[] = [
  "internal_draft",
  "school_leadership",
  "teacher_summary",
  "backup"
];

export type ExportCenterInput = {
  /** The process's plan, or `null` while planning has not started. */
  readonly plan?: TeachingPlanPublic | null;
  /** Planning findings; gate the strict *planning* artifact only. */
  readonly planValidations?: PlanValidationReport | null;
  /** Assignment findings; gate the strict *assignment* export. */
  readonly assignmentValidations?: AssignmentValidationReport | null;
  readonly artifacts?: readonly ExportArtifactPublic[];
};

/**
 * Split the export center into the three families plan §3.10/§20.25 separates.
 *
 * The rule the retired state broke: it derived one `finalBlocked` boolean from
 * the dashboard's blocking count and then *removed* `final` from a list of
 * otherwise equal export types, so a planning draft and a final closure looked
 * like two entries in the same menu. They are not. A draft or provisional
 * planning artifact is always available — an unbalanced plan is exactly what it
 * exists to show — while the final assignment export sits behind a complete
 * reparto *and* confirmed feasibility, and archives the process when it runs.
 *
 * Every refusal is a stable code, never a sentence: the caller localizes it and
 * the tests assert on it.
 */
export function buildExportCenterState(
  input: ExportCenterInput = {}
): ExportCenterState {
  const plan = input.plan ?? null;
  const planValidations = input.planValidations ?? null;
  const assignmentValidations = input.assignmentValidations ?? null;
  const artifacts = input.artifacts ?? [];
  const backups = artifacts.filter(
    (item) => item.export_type === "backup" && item.format === "json"
  );
  return {
    feasibilityStatus: plan?.feasibility_status ?? null,
    planStatus: plan?.status ?? null,
    planningExports: buildPlanningExportOffers(plan, planValidations),
    documentExportTypes: DOCUMENT_EXPORT_TYPES,
    finalExport: buildFinalExportState(plan, assignmentValidations),
    latestBackupId: backups.at(-1)?.id ?? null,
    backupCount: backups.length
  };
}

function buildPlanningExportOffers(
  plan: TeachingPlanPublic | null,
  report: PlanValidationReport | null
): readonly PlanningExportOffer[] {
  // A missing plan is the one thing that stops even a draft: there is no plan
  // to describe, which is not the same as a plan that fails its balances.
  const planMissing = plan === null;
  const openReason: PlanningExportBlockedReason | null = planMissing
    ? "plan_missing"
    : null;
  const finalReason: PlanningExportBlockedReason | null = planMissing
    ? "plan_missing"
    : report !== null && report.blocking_count > 0
      ? "blocking_validations"
      : null;
  return [
    {
      mode: "draft",
      blocked: openReason !== null,
      reason: openReason,
      printsFeasibility: true
    },
    {
      mode: "provisional",
      blocked: openReason !== null,
      reason: openReason,
      printsFeasibility: true
    },
    {
      mode: "final",
      blocked: finalReason !== null,
      reason: finalReason,
      printsFeasibility: false
    }
  ];
}

function buildFinalExportState(
  plan: TeachingPlanPublic | null,
  report: AssignmentValidationReport | null
): FinalExportState {
  const reasons: FinalExportBlockedReason[] = [];
  if (plan === null) {
    reasons.push("plan_missing");
  } else if (!GENERATED_PLAN_STATUSES.has(plan.status)) {
    reasons.push("requirements_not_generated");
  }
  if (report === null) {
    // Fail closed: an unread report is not an empty one.
    reasons.push("findings_unavailable");
  } else if (!report.is_final_ready) {
    reasons.push("assignment_blocking");
  }
  // §20.25 puts the final export in the tier that needs a complete reparto *in
  // addition to* confirmed feasibility, so a complete reparto whose feasibility
  // was invalidated is still refused here.
  if (plan !== null && plan.feasibility_status !== "feasible") {
    reasons.push("feasibility_not_confirmed");
  }
  return {
    allowed: reasons.length === 0,
    reasons,
    archivesProcess: true,
    blockingCount: report?.blocking_count ?? null
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
