import { useState } from "react";
import {
  DepartmentHeadWorkspace,
  ExportCenterView,
  ProcessListView,
  VersionsView,
  type VersionComparisonSource
} from "../DepartmentHeadWorkspace.js";
import {
  SharedScreenWorkspace,
  TeacherLanWorkspace
} from "../LanWorkspace.js";
import { MeetingControlWorkspace } from "../MeetingWorkspace.js";
import {
  useCreateRepartoExportArtifact,
  useCreateRepartoPlanningExport,
  useImportRepartoPlanning,
  useRestoreRepartoDraft,
  useCreateRepartoVersion,
  useRepartoAssignmentValidations,
  useRepartoAssignments,
  useRepartoDashboard,
  useRepartoExports,
  useRepartoHourRequirements,
  useRepartoMeetingSessions,
  useRepartoPreviousYearComparison,
  useRepartoProcess,
  useRepartoProcesses,
  useRepartoSummary,
  useRepartoTeacherLan,
  useRepartoTeachingPlan,
  useRepartoTeachingPlanValidations,
  useRepartoVersionComparison,
  useRepartoVersions
} from "../hooks.js";
import { resolveProcessId, type RepartoListParams } from "../../queryKeys.js";
import {
  buildPlanningImportDraftState,
  buildVersionSelectionState,
  summarizeProcessDashboard
} from "../../ui/index.js";
import { repartoPanelClass } from "../styles.js";
import type { RepartoEventStreamState } from "../useRepartoEvents.js";
import {
  Shell,
  WithSelectedProcess,
  type ViewConfig
} from "./process-context.js";
import type {
  AssignmentProcessStatus,
  AssignmentPublic,
  ExportArtifactPublic,
  ExportArtifactType,
  FeasibilityStatus,
  HourRequirementPublic,
  MeetingSessionPublic,
  PlanReadiness,
  PlanningExportArtifact,
  PlanningExportMode,
  PlanningImportResult,
  ProcessDashboard,
  ProcessSummary,
  ProcessVersionPublic,
  TeacherLanSummary,
  TeachingPlanPublic,
  VersionComparison
} from "../../schemas.js";
import {
  formatRepartoMessage,
  getRepartoDictionary,
  normalizeRepartoLocale,
  type RepartoLocale
} from "../../i18n/index.js";
import { repartoToast } from "../ui/toast-notification.js";
import { RepartoLoadingState } from "./loading-state.js";
export { RepartoClassroomStagesView } from "./classroom-stages.js";
export {
  AllocationChangeReconciliation,
  AllocationRevisionHistory,
  MainSubjectMaterialization,
  MainSubjectMaterializationConfirmation,
  MainSubjectMaterializationTable,
  PlanLockAndRequirementGeneration,
  PlanLockConfirmation,
  PlanValidationSummary,
  PlanningBalanceHeader,
  ReconciliationStatusCard,
  RepartoPlanningView,
  RequirementGenerationPreviewCard,
  RequirementGenerationResultCard,
  RequirementReconciliationPreviewCard,
  RequirementReconciliationResultCard,
  SecondaryActivityEditor,
  SecondaryActivityForm,
  SecondaryActivityTable,
  buildMainSubjectMaterializationRows,
  buildAllocationRevisionRequest,
  buildReconciliationConflictRows,
  buildSecondaryActivityRequests,
  buildSecondaryActivityRows,
  secondaryActivityFormValues,
  isRequirementGenerationAvailable,
  isAllocationReconciliationAvailable,
  isStaleRequirementReconciliationError,
  type AllocationRevisionFormResult,
  type AllocationRevisionFormValues,
  type MainSubjectMaterializationRow,
  type ReconciliationConflictRow,
  type SecondaryActivityFormResult,
  type SecondaryActivityFormValues,
  type SecondaryActivityRow
} from "./planning/index.js";

function QueryState({
  error,
  isError,
  isLoading,
  label,
  locale
}: {
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  label: string;
  locale?: RepartoLocale;
}) {
  const dict = getRepartoDictionary(locale ?? normalizeRepartoLocale());
  if (isLoading) {
    return (
      <RepartoLoadingState
        description={formatRepartoMessage(dict.view.loading, { entity: label })}
        title={formatRepartoMessage(dict.view.loading, { entity: label })}
      />
    );
  }
  if (!isError) return null;
  return (
    <section className={repartoPanelClass} data-reparto-state="error">
      {error instanceof Error ? error.message : formatRepartoMessage(dict.view.unavailable, { entity: label })}
    </section>
  );
}

function dashboardSummary(dashboard?: ProcessDashboard | null): ProcessSummary | null {
  return dashboard ? summarizeProcessDashboard(dashboard) : null;
}

function latestMeetingSession(
  sessions?: { data: MeetingSessionPublic[] } | null
): MeetingSessionPublic | null {
  return sessions?.data[0] ?? null;
}

export function RepartoDashboardView({
  config,
  dashboard,
  feasibility,
  locale,
  processId,
  summary
}: {
  config?: ViewConfig;
  dashboard?: ProcessDashboard | null;
  feasibility?: FeasibilityStatus | null;
  locale?: "en" | "fr" | "es";
  processId?: string;
  summary?: ProcessSummary | null;
}) {
  return (
    <Shell config={config}>
      <WithSelectedProcess
        bypass={Boolean(dashboard || summary)}
        locale={locale}
        mode="admin"
        processId={processId}
      >
        {(resolvedProcessId) => (
          <RepartoDashboardContent
            dashboard={dashboard}
            feasibility={feasibility}
            locale={locale}
            processId={resolvedProcessId}
            summary={summary}
          />
        )}
      </WithSelectedProcess>
    </Shell>
  );
}

function RepartoDashboardContent({
  dashboard,
  feasibility,
  locale,
  processId,
  summary
}: {
  dashboard?: ProcessDashboard | null;
  feasibility?: FeasibilityStatus | null;
  locale?: "en" | "fr" | "es";
  processId?: string;
  summary?: ProcessSummary | null;
}) {
  const dashboardQuery = useRepartoDashboard(processId);
  // The plan carries the third invariant, and the dashboard payload does not:
  // `feasibility_status` is department-head-only (§20.20, §21.1), so it travels
  // on the plan resource this admin view is already entitled to read. The
  // request is supplementary — a process with no plan 404s here, and the row
  // then reports the readiness projection rather than blocking the dashboard.
  const planQuery = useRepartoTeachingPlan(processId);
  const activeDashboard = dashboard ?? dashboardQuery.data ?? null;
  const activeSummary = summary ?? dashboardSummary(activeDashboard);
  const isLoading =
    dashboardQuery.isLoading &&
    Boolean(resolveProcessId(processId)) &&
    !dashboard &&
    !summary;
  if (isLoading || dashboardQuery.isError) {
    return (
      <QueryState
        error={dashboardQuery.error}
        isError={dashboardQuery.isError}
        isLoading={isLoading}
        label={getRepartoDictionary(locale ?? normalizeRepartoLocale()).nav.item.dashboard}
        locale={locale}
      />
    );
  }
  return (
    <>
      <DepartmentHeadWorkspace
        dashboard={activeDashboard}
        feasibility={feasibility ?? planQuery.data?.feasibility_status ?? null}
        locale={locale}
        mode="admin"
        summary={activeSummary}
      />
      <QueryState
        error={dashboardQuery.error}
        isError={dashboardQuery.isError}
        isLoading={
          dashboardQuery.isLoading &&
          Boolean(resolveProcessId(processId)) &&
          !dashboard &&
          !summary
        }
        label={getRepartoDictionary(locale ?? normalizeRepartoLocale()).nav.item.dashboard}
        locale={locale}
      />
    </>
  );
}

export function RepartoMeetingView({
  config,
  dashboard,
  feasibility,
  locale,
  processId,
  summary
}: {
  config?: ViewConfig;
  dashboard?: ProcessDashboard | null;
  feasibility?: FeasibilityStatus | null;
  locale?: "en" | "fr" | "es";
  processId?: string;
  summary?: ProcessSummary | null;
}) {
  return (
    <Shell config={config}>
      <WithSelectedProcess
        bypass={Boolean(dashboard || summary)}
        locale={locale}
        mode="admin"
        processId={processId}
      >
        {(resolvedProcessId) => (
          <RepartoMeetingContent
            dashboard={dashboard}
            feasibility={feasibility}
            locale={locale}
            processId={resolvedProcessId}
            summary={summary}
          />
        )}
      </WithSelectedProcess>
    </Shell>
  );
}

/**
 * The meeting control reads the **dashboard**, not the summary.
 *
 * It is the head's own admin surface, and the two things it needs beyond the
 * aggregate — who is carrying authorized extra hours, and how far each
 * participant has got — are per-participant rows that only the dashboard
 * carries. The projected screen makes the opposite call for the opposite
 * reason.
 */
function RepartoMeetingContent({
  dashboard,
  feasibility,
  locale,
  processId,
  summary
}: {
  dashboard?: ProcessDashboard | null;
  feasibility?: FeasibilityStatus | null;
  locale?: "en" | "fr" | "es";
  processId?: string;
  summary?: ProcessSummary | null;
}) {
  const dashboardQuery = useRepartoDashboard(processId);
  // Same department-head-only source as the dashboard: the control room shows
  // the stored feasibility status, the projected screen next door does not.
  const planQuery = useRepartoTeachingPlan(processId);
  const activeDashboard = dashboard ?? dashboardQuery.data ?? null;
  const isLoading =
    dashboardQuery.isLoading &&
    Boolean(resolveProcessId(processId)) &&
    !dashboard &&
    !summary;
  if (isLoading || dashboardQuery.isError) {
    return (
      <QueryState
        error={dashboardQuery.error}
        isError={dashboardQuery.isError}
        isLoading={isLoading}
        label={getRepartoDictionary(locale ?? normalizeRepartoLocale()).nav.item.meeting}
        locale={locale}
      />
    );
  }
  return (
    <>
      <MeetingControlWorkspace
        dashboard={activeDashboard}
        feasibility={feasibility ?? planQuery.data?.feasibility_status ?? null}
        locale={locale}
        processId={processId}
        summary={summary}
      />
      <QueryState
        error={dashboardQuery.error}
        isError={dashboardQuery.isError}
        isLoading={
          dashboardQuery.isLoading &&
          Boolean(resolveProcessId(processId)) &&
          !dashboard &&
          !summary
        }
        label={getRepartoDictionary(locale ?? normalizeRepartoLocale()).nav.item.meeting}
        locale={locale}
      />
    </>
  );
}

export function RepartoProcessesView({
  config,
  locale,
  params
}: {
  config?: ViewConfig;
  locale?: RepartoLocale;
  params?: RepartoListParams;
}) {
  return (
    <Shell config={config}>
      <RepartoProcessesContent locale={locale} params={params} />
    </Shell>
  );
}

function RepartoProcessesContent({ locale, params }: { locale?: RepartoLocale; params?: RepartoListParams }) {
  const dict = getRepartoDictionary(locale ?? normalizeRepartoLocale());
  const processesQuery = useRepartoProcesses(params);
  const processes = processesQuery.data?.data ?? [];
  if (processesQuery.isLoading || processesQuery.isError) {
    return (
      <QueryState
        error={processesQuery.error}
        isError={processesQuery.isError}
        isLoading={processesQuery.isLoading}
        label={dict.nav.item.processes}
        locale={locale}
      />
    );
  }
  return (
    <>
      <ProcessListView count={processesQuery.data?.count ?? 0} locale={locale} processes={processes} />
      <QueryState
        error={processesQuery.error}
        isError={processesQuery.isError}
        isLoading={processesQuery.isLoading}
        label={dict.nav.item.processes}
        locale={locale}
      />
    </>
  );
}

export function RepartoMyView({
  assignments,
  config,
  locale,
  meetingSession,
  processId,
  readiness,
  remainingTargetHours,
  requirements,
  selectedSlotId,
  selectionBlocked,
  summary
}: {
  assignments?: AssignmentPublic[];
  config?: ViewConfig;
  locale?: "en" | "fr" | "es";
  meetingSession?: MeetingSessionPublic | null;
  processId?: string;
  readiness?: PlanReadiness | null;
  remainingTargetHours?: string | number | null;
  requirements?: HourRequirementPublic[];
  selectedSlotId?: string | null;
  selectionBlocked?: boolean | null;
  summary?: TeacherLanSummary | null;
}) {
  return (
    <Shell config={config}>
      <WithSelectedProcess
        bypass={Boolean(summary)}
        locale={locale}
        mode="readonly"
        processId={processId}
        streamAudience="teacher"
      >
        {(resolvedProcessId, eventState) => (
          <RepartoMyContent
            assignments={assignments}
            locale={locale}
            meetingSession={meetingSession}
            processId={resolvedProcessId}
            readiness={readiness}
            remainingTargetHours={remainingTargetHours}
            requirements={requirements}
            selectedSlotId={selectedSlotId}
            selectionBlocked={selectionBlocked}
            summary={summary}
            eventState={eventState}
          />
        )}
      </WithSelectedProcess>
    </Shell>
  );
}

function RepartoMyContent({
  assignments,
  locale,
  meetingSession,
  processId,
  readiness,
  remainingTargetHours,
  requirements,
  selectedSlotId,
  selectionBlocked,
  summary,
  eventState
}: {
  assignments?: AssignmentPublic[];
  locale?: "en" | "fr" | "es";
  meetingSession?: MeetingSessionPublic | null;
  processId?: string;
  readiness?: PlanReadiness | null;
  remainingTargetHours?: string | number | null;
  requirements?: HourRequirementPublic[];
  selectedSlotId?: string | null;
  selectionBlocked?: boolean | null;
  summary?: TeacherLanSummary | null;
  eventState: RepartoEventStreamState;
}) {
  const summaryQuery = useRepartoTeacherLan(processId);
  const sessionsQuery = useRepartoMeetingSessions(processId);
  // The positions a teacher may take, and who already holds one. Neither is a
  // blocking query: without them the panel simply offers nothing and says so,
  // which is the right answer for a client that cannot see the live slots.
  const requirementsQuery = useRepartoHourRequirements(processId);
  const assignmentsQuery = useRepartoAssignments(processId);
  const activeSummary = summary ?? summaryQuery.data ?? null;
  const activeSession = meetingSession ?? latestMeetingSession(sessionsQuery.data);
  const hasProcess = Boolean(resolveProcessId(processId));
  const isLoading =
    ((summaryQuery.isLoading && !summary) ||
      (sessionsQuery.isLoading && meetingSession === undefined)) &&
    hasProcess;
  if (isLoading || summaryQuery.isError || sessionsQuery.isError) {
    return (
      <QueryState
        error={summaryQuery.error ?? sessionsQuery.error}
        isError={summaryQuery.isError || sessionsQuery.isError}
        isLoading={isLoading}
        label={getRepartoDictionary(locale ?? normalizeRepartoLocale()).view.teacherTitle}
        locale={locale}
      />
    );
  }
  return (
    <>
      <TeacherLanWorkspace
        assignments={assignments ?? assignmentsQuery.data?.data ?? []}
        locale={locale}
        meetingSession={activeSession}
        processId={processId}
        readiness={readiness}
        remainingTargetHours={remainingTargetHours}
        requirements={requirements ?? requirementsQuery.data?.data ?? []}
        selectedSlotId={selectedSlotId}
        selectionBlocked={selectionBlocked}
        summary={activeSummary}
        connectionState={eventState.connectionState}
        lastEventType={eventState.lastEventType}
      />
      <QueryState
        error={summaryQuery.error ?? sessionsQuery.error}
        isError={summaryQuery.isError || sessionsQuery.isError}
        isLoading={
          ((summaryQuery.isLoading && !summary) ||
            (sessionsQuery.isLoading && meetingSession === undefined)) &&
          hasProcess
        }
        label={getRepartoDictionary(locale ?? normalizeRepartoLocale()).view.teacherTitle}
        locale={locale}
      />
    </>
  );
}

export function RepartoSharedView({
  config,
  locale,
  processId,
  summary
}: {
  config?: ViewConfig;
  locale?: "en" | "fr" | "es";
  processId?: string;
  summary?: ProcessSummary | null;
}) {
  return (
    <Shell config={config}>
      <WithSelectedProcess
        bypass={Boolean(summary)}
        locale={locale}
        mode="readonly"
        processId={processId}
        streamAudience="shared_screen"
      >
        {(resolvedProcessId, eventState) => (
          <RepartoSharedContent
            eventState={eventState}
            locale={locale}
            processId={resolvedProcessId}
            summary={summary}
          />
        )}
      </WithSelectedProcess>
    </Shell>
  );
}

/**
 * The projected screen reads `/summary`, and the `dashboard` prop is gone.
 *
 * `RBAC-07`: this view used to call `useRepartoDashboard` — every participant's
 * name and hours — for a screen pointed at a room. The aggregate endpoint it
 * should have used already existed and was already wrapped. Removing the prop as
 * well as the query is deliberate: as long as a caller can hand the identifying
 * payload in, the redaction is a convention rather than a boundary.
 */
function RepartoSharedContent({
  eventState,
  locale,
  processId,
  summary
}: {
  eventState: RepartoEventStreamState;
  locale?: "en" | "fr" | "es";
  processId?: string;
  summary?: ProcessSummary | null;
}) {
  const dict = getRepartoDictionary(locale ?? normalizeRepartoLocale());
  const summaryQuery = useRepartoSummary(processId);
  const activeSummary = summary ?? summaryQuery.data ?? null;
  const isLoading =
    summaryQuery.isLoading && Boolean(resolveProcessId(processId)) && !summary;
  if (isLoading || summaryQuery.isError) {
    return (
      <QueryState
        error={summaryQuery.error}
        isError={summaryQuery.isError}
        isLoading={isLoading}
        label={dict.nav.item.shared}
        locale={locale}
      />
    );
  }
  return (
    <>
      <SharedScreenWorkspace
        connectionState={eventState.connectionState}
        lastEventType={eventState.lastEventType}
        locale={locale}
        processId={processId}
        summary={activeSummary}
      />
      <QueryState
        error={summaryQuery.error}
        isError={summaryQuery.isError}
        isLoading={
          summaryQuery.isLoading && Boolean(resolveProcessId(processId)) && !summary
        }
        label={dict.nav.item.shared}
        locale={locale}
      />
    </>
  );
}

export function RepartoVersionsView({
  comparison,
  config,
  locale,
  processId,
  versions
}: {
  comparison?: VersionComparison | null;
  config?: ViewConfig;
  locale?: "en" | "fr" | "es";
  processId?: string;
  versions?: ProcessVersionPublic[];
}) {
  return (
    <Shell config={config}>
      <WithSelectedProcess
        bypass={Boolean(versions)}
        locale={locale}
        mode="admin"
        processId={processId}
      >
        {(resolvedProcessId) => (
          <RepartoVersionsContent
            comparison={comparison}
            locale={locale}
            processId={resolvedProcessId}
            versions={versions}
          />
        )}
      </WithSelectedProcess>
    </Shell>
  );
}

/**
 * The versions route: capture a snapshot, pick two, read the difference.
 *
 * Two comparison sources share one panel and are kept apart by an explicit
 * switch rather than by whichever query answered last. Selecting a version
 * moves the *draft* pair; pressing compare applies it. That is deliberate —
 * a diff is a request against the service, and firing one on every keystroke
 * of a select would leave the panel showing an answer to a question the head
 * has already moved on from.
 *
 * The previous-year action is offered only when the process records a source
 * process: the service answers 400 otherwise, and a button whose refusal is
 * already known should not be pressable (the same rule the meeting controls
 * follow).
 */
function RepartoVersionsContent({
  comparison,
  locale,
  processId,
  versions
}: {
  comparison?: VersionComparison | null;
  locale?: RepartoLocale;
  processId?: string;
  versions?: ProcessVersionPublic[];
}) {
  const dict = getRepartoDictionary(locale ?? normalizeRepartoLocale());
  const versionsQuery = useRepartoVersions(processId);
  const processQuery = useRepartoProcess(processId);
  const createVersion = useCreateRepartoVersion();
  const [draft, setDraft] = useState<{ left?: string | null; right?: string | null }>({});
  const [applied, setApplied] = useState<{ left: string; right: string } | null>(null);
  const [source, setSource] = useState<VersionComparisonSource>("versions");
  const [reason, setReason] = useState("");

  const activeVersions = versions ?? versionsQuery.data?.data ?? [];
  const selection = buildVersionSelectionState(activeVersions, draft);
  const previousYearAvailable = Boolean(
    processQuery.data?.created_from_process_id
  );
  const comparisonQuery = useRepartoVersionComparison(
    processId,
    applied?.left,
    applied?.right
  );
  const previousYearQuery = useRepartoPreviousYearComparison(
    processId,
    previousYearAvailable && source === "previous_year"
  );
  // A comparison is shown only for the pair that was actually asked for: with
  // no applied selection there is no question on screen, and a cached answer to
  // an earlier one would be read as an answer to this one.
  const activeComparison =
    comparison ??
    (source === "previous_year"
      ? (previousYearQuery.data ?? null)
      : applied
        ? (comparisonQuery.data ?? null)
        : null);

  const isLoading =
    versionsQuery.isLoading && Boolean(resolveProcessId(processId)) && !versions;
  if (isLoading || versionsQuery.isError) {
    return (
      <QueryState
        error={versionsQuery.error}
        isError={versionsQuery.isError}
        isLoading={isLoading}
        label={dict.nav.item.versions}
        locale={locale}
      />
    );
  }
  return (
    <>
      <VersionsView
        comparison={activeComparison}
        comparisonSource={source}
        createPending={createVersion.isPending}
        createReason={reason}
        locale={locale}
        onCompare={() => {
          if (!selection.canCompare) return;
          setApplied({
            left: String(selection.leftVersionId),
            right: String(selection.rightVersionId)
          });
          setSource("versions");
        }}
        onCreateVersion={() => {
          const processIdentifier = resolveProcessId(processId);
          if (!processIdentifier || createVersion.isPending) return;
          createVersion.mutate(
            {
              processId: processIdentifier,
              body: { reason: reason.trim() === "" ? null : reason.trim() }
            },
            { onSuccess: () => setReason("") }
          );
        }}
        onPreviousYear={() => setSource("previous_year")}
        onReasonChange={setReason}
        onSelectVersion={(side, versionId) =>
          setDraft((current) => ({ ...current, [side]: versionId }))
        }
        previousYearAvailable={previousYearAvailable}
        selection={draft}
        versions={activeVersions}
      />
      <QueryState
        error={createVersion.error}
        isError={createVersion.isError}
        isLoading={false}
        label={dict.view.versions.createError}
        locale={locale}
      />
      <QueryState
        error={source === "previous_year" ? previousYearQuery.error : comparisonQuery.error}
        isError={
          source === "previous_year"
            ? previousYearQuery.isError
            : comparisonQuery.isError
        }
        isLoading={
          source === "previous_year"
            ? previousYearQuery.isLoading && previousYearAvailable
            : comparisonQuery.isFetching && applied !== null
        }
        label={dict.view.versions.comparison}
        locale={locale}
      />
    </>
  );
}

export function RepartoExportsView({
  artifacts,
  config,
  locale,
  plan,
  processId,
  processStatus
}: {
  artifacts?: ExportArtifactPublic[];
  config?: ViewConfig;
  locale?: "en" | "fr" | "es";
  plan?: TeachingPlanPublic | null;
  processId?: string;
  processStatus?: AssignmentProcessStatus;
}) {
  return (
    <Shell config={config}>
      <WithSelectedProcess
        bypass={Boolean(artifacts || plan)}
        locale={locale}
        mode="admin"
        processId={processId}
      >
        {(resolvedProcessId) => (
          <RepartoExportsContent
            artifacts={artifacts}
            locale={locale}
            plan={plan}
            processId={resolvedProcessId}
            processStatus={processStatus}
          />
        )}
      </WithSelectedProcess>
    </Shell>
  );
}

/**
 * Wire the export center to the four reads and two writes it needs.
 *
 * The plan and the assignment findings are read here rather than derived from
 * the dashboard's single blocking count: the two families gate different
 * exports — planning findings decide the strict *planning* artifact, assignment
 * findings and feasibility decide the final *assignment* export — and a summed
 * count cannot tell them apart.
 */
function RepartoExportsContent({
  artifacts,
  locale,
  plan,
  processId,
  processStatus
}: {
  artifacts?: ExportArtifactPublic[];
  locale?: RepartoLocale;
  plan?: TeachingPlanPublic | null;
  processId?: string;
  processStatus?: AssignmentProcessStatus;
}) {
  const dict = getRepartoDictionary(locale ?? normalizeRepartoLocale());
  const exportsQuery = useRepartoExports(processId);
  const planQuery = useRepartoTeachingPlan(processId);
  const planValidationsQuery = useRepartoTeachingPlanValidations(processId);
  const assignmentValidationsQuery = useRepartoAssignmentValidations(processId);
  const processQuery = useRepartoProcess(processId);
  const planningExport = useCreateRepartoPlanningExport();
  const documentExport = useCreateRepartoExportArtifact();
  const planningImport = useImportRepartoPlanning();
  const restoreDraft = useRestoreRepartoDraft();
  const [planningArtifact, setPlanningArtifact] =
    useState<PlanningExportArtifact | null>(null);
  const [pendingPlanningMode, setPendingPlanningMode] =
    useState<PlanningExportMode | null>(null);
  const [pendingDocumentType, setPendingDocumentType] =
    useState<ExportArtifactType | null>(null);
  const [planningImportContent, setPlanningImportContent] = useState("");
  const [planningImportResult, setPlanningImportResult] =
    useState<PlanningImportResult | null>(null);
  const [finalConfirming, setFinalConfirming] = useState(false);
  const [restoreConfirming, setRestoreConfirming] = useState(false);
  const [restoreAssignments, setRestoreAssignments] = useState(true);
  const hasProcess = Boolean(resolveProcessId(processId));
  const isLoading = exportsQuery.isLoading && !artifacts && hasProcess;
  if (isLoading || exportsQuery.isError) {
    return (
      <QueryState
        error={exportsQuery.error}
        isError={exportsQuery.isError}
        isLoading={isLoading}
        label={dict.nav.item.exports}
        locale={locale}
      />
    );
  }

  function runPlanningExport(mode: PlanningExportMode) {
    if (!processId || pendingPlanningMode !== null) return;
    setPendingPlanningMode(mode);
    planningExport.mutate(
      { processId, mode },
      {
        onSuccess: (artifact) => setPlanningArtifact(artifact),
        onError: (error) =>
          repartoToast.error(
            dict.view.exports.planning.error,
            error instanceof Error ? error.message : undefined
          ),
        onSettled: () => setPendingPlanningMode(null)
      }
    );
  }

  function runDocumentExport(exportType: ExportArtifactType) {
    if (!processId || pendingDocumentType !== null) return;
    setPendingDocumentType(exportType);
    documentExport.mutate(
      {
        processId,
        body: { export_type: exportType, format: exportType === "backup" ? "json" : "pdf" }
      },
      {
        onSuccess: () => {
          setFinalConfirming(false);
          repartoToast.success(
            exportType === "final"
              ? dict.view.exports.final.success
              : formatRepartoMessage(dict.view.exports.documents.success, {
                  document: dict.view.exports.type[exportType]
                })
          );
        },
        onError: (error) =>
          repartoToast.error(
            exportType === "final"
              ? dict.view.exports.final.error
              : dict.view.exports.documents.error,
            error instanceof Error ? error.message : undefined
          ),
        onSettled: () => setPendingDocumentType(null)
      }
    );
  }

  function runPlanningImport() {
    if (!processId || planningImport.isPending) return;
    const draft = buildPlanningImportDraftState(planningImportContent);
    if (!draft.request) return;
    planningImport.mutate(
      { processId, body: draft.request },
      {
        onSuccess: (result) => {
          setPlanningImportResult(result);
          repartoToast.success(dict.view.exports.importPlanning.success);
        },
        onError: (error) =>
          repartoToast.error(
            dict.view.exports.importPlanning.requestError,
            error instanceof Error ? error.message : undefined
          )
      }
    );
  }

  function runRestoreDraft() {
    if (!processId || restoreDraft.isPending) return;
    const backup = [...(artifacts ?? exportsQuery.data?.data ?? [])]
      .filter((item) => item.export_type === "backup" && item.format === "json")
      .sort((left, right) => left.created_at.localeCompare(right.created_at))
      .at(-1);
    if (!backup) return;
    restoreDraft.mutate(
      {
        processId,
        body: { content: backup.content, restore_assignments: restoreAssignments }
      },
      {
        onSuccess: () => {
          setRestoreConfirming(false);
          repartoToast.success(dict.view.exports.restore.success);
        },
        onError: (error) =>
          repartoToast.error(
            dict.view.exports.restore.error,
            error instanceof Error ? error.message : undefined
          )
      }
    );
  }

  return (
    <>
      <ExportCenterView
        artifacts={artifacts ?? exportsQuery.data?.data ?? []}
        assignmentValidations={assignmentValidationsQuery.data ?? null}
        finalConfirming={finalConfirming}
        locale={locale}
        onCancelFinalExport={() => setFinalConfirming(false)}
        onCreateDocumentExport={runDocumentExport}
        onCreateFinalExport={() => runDocumentExport("final")}
        onCreatePlanningExport={runPlanningExport}
        onImportPlanning={runPlanningImport}
        onPlanningImportContentChange={setPlanningImportContent}
        onCancelRestore={() => setRestoreConfirming(false)}
        onConfirmRestore={runRestoreDraft}
        onRestoreAssignmentsChange={setRestoreAssignments}
        onReviewRestore={() => setRestoreConfirming(true)}
        onReviewFinalExport={() => setFinalConfirming(true)}
        pendingDocumentType={pendingDocumentType}
        pendingPlanningMode={pendingPlanningMode}
        pendingPlanningImport={planningImport.isPending}
        pendingRestore={restoreDraft.isPending}
        plan={plan ?? planQuery.data ?? null}
        planValidations={planValidationsQuery.data ?? null}
        planningArtifact={planningArtifact}
        planningImportContent={planningImportContent}
        planningImportResult={planningImportResult}
        processId={processId}
        processStatus={processStatus ?? processQuery.data?.status}
        restoreAssignments={restoreAssignments}
        restoreConfirming={restoreConfirming}
      />
      <QueryState
        error={exportsQuery.error}
        isError={exportsQuery.isError}
        isLoading={exportsQuery.isLoading && !artifacts && hasProcess}
        label={dict.nav.item.exports}
        locale={locale}
      />
    </>
  );
}

export {
  RepartoAcademicYearsView,
  RepartoDepartmentsView,
  RepartoSchoolsView,
  RepartoTeacherRosterView
} from "./setup-crud.js";

export {
  GroupSubjectBulkConfirmation,
  GroupSubjectBulkEditor,
  GroupSubjectBulkPreviewTable,
  buildGroupSubjectBulkRequest,
  groupSubjectBulkPreviewRows,
  isStaleGroupSubjectPreviewError,
  type GroupSubjectBulkEditorProps,
  type GroupSubjectBulkFormResult
} from "./process-crud/group-subjects/bulk.js";

export {
  RepartoAssignmentsView,
  RepartoAuditView,
  RepartoClassroomsView,
  RepartoHourRequirementsView,
  RepartoProcessParticipantsView,
  RepartoSubjectsView
} from "./process-crud/exports.js";

export {
  RepartoDisabledReason,
  RepartoFieldError,
  RepartoFormError
} from "./feedback.js";

export { RepartoLoadingState } from "./loading-state.js";

export {
  ProcessPicker,
  WithSelectedProcess
} from "./process-context.js";

export function DepartmentHeadView(props: Parameters<typeof RepartoDashboardView>[0]) {
  return <RepartoDashboardView {...props} />;
}

export function ProcessesView(props: Parameters<typeof RepartoProcessesView>[0]) {
  return <RepartoProcessesView {...props} />;
}

export function TeacherLanView(props: Parameters<typeof RepartoMyView>[0]) {
  return <RepartoMyView {...props} />;
}

export function SharedScreenView(props: Parameters<typeof RepartoSharedView>[0]) {
  return <RepartoSharedView {...props} />;
}

export function RepartoExportCenterView(
  props: Parameters<typeof RepartoExportsView>[0]
) {
  return <RepartoExportsView {...props} />;
}
