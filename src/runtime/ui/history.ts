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

export function buildVersionComparisonLabel(
  comparison: VersionComparison
): string {
  if (comparison.changed_sections.length === 0) return "No changes";
  return comparison.changed_sections.join(", ");
}

export function canCompareVersions(versions: ProcessVersionPublic[]): boolean {
  return versions.length >= 2;
}

export function nextLeadershipWorkflowAction(
  status: AssignmentProcessStatus
): LeadershipWorkflowAction {
  if (status === "sent_to_school_leadership") return "mark-returned";
  if (status === "returned_by_school_leadership") return "start-revision";
  if (status === "final") return "reopen-final";
  return null;
}
