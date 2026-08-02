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
  useCreateRepartoVersion,
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
  useRepartoVersionComparison,
  useRepartoVersions
} from "../hooks.js";
import { resolveProcessId, type RepartoListParams } from "../../queryKeys.js";
import {
  buildVersionSelectionState,
  summarizeProcessDashboard
} from "../../ui/index.js";
import { repartoPanelClass } from "../styles.js";
import {
  Shell,
  WithSelectedProcess,
  type ViewConfig
} from "./process-context.js";
import type {
  AssignmentProcessStatus,
  AssignmentPublic,
  ExportArtifactPublic,
  HourRequirementPublic,
  MeetingSessionPublic,
  PlanReadiness,
  ProcessDashboard,
  ProcessSummary,
  ProcessVersionPublic,
  TeacherLanSummary,
  VersionComparison
} from "../../schemas.js";
import {
  formatRepartoMessage,
  getRepartoDictionary,
  normalizeRepartoLocale,
  type RepartoLocale
} from "../../i18n/index.js";
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
  locale,
  processId,
  summary
}: {
  config?: ViewConfig;
  dashboard?: ProcessDashboard | null;
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
  locale,
  processId,
  summary
}: {
  dashboard?: ProcessDashboard | null;
  locale?: "en" | "fr" | "es";
  processId?: string;
  summary?: ProcessSummary | null;
}) {
  const dashboardQuery = useRepartoDashboard(processId);
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
  locale,
  processId,
  summary
}: {
  config?: ViewConfig;
  dashboard?: ProcessDashboard | null;
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
  locale,
  processId,
  summary
}: {
  dashboard?: ProcessDashboard | null;
  locale?: "en" | "fr" | "es";
  processId?: string;
  summary?: ProcessSummary | null;
}) {
  const dashboardQuery = useRepartoDashboard(processId);
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
      >
        {(resolvedProcessId) => (
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
  summary
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
      >
        {(resolvedProcessId) => (
          <RepartoSharedContent
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
  locale,
  processId,
  summary
}: {
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
  config,
  exports,
  locale,
  processId,
  processStatus,
  summary
}: {
  config?: ViewConfig;
  exports?: ExportArtifactPublic[];
  locale?: "en" | "fr" | "es";
  processId?: string;
  processStatus?: AssignmentProcessStatus;
  summary?: ProcessSummary;
}) {
  return (
    <Shell config={config}>
      <WithSelectedProcess
        bypass={Boolean(exports || summary)}
        locale={locale}
        mode="admin"
        processId={processId}
      >
        {(resolvedProcessId) => (
          <RepartoExportsContent
            exports={exports}
            locale={locale}
            processId={resolvedProcessId}
            processStatus={processStatus}
            summary={summary}
          />
        )}
      </WithSelectedProcess>
    </Shell>
  );
}

function RepartoExportsContent({
  exports,
  locale,
  processId,
  processStatus,
  summary
}: {
  exports?: ExportArtifactPublic[];
  locale?: RepartoLocale;
  processId?: string;
  processStatus?: AssignmentProcessStatus;
  summary?: ProcessSummary;
}) {
  const exportsQuery = useRepartoExports(processId);
  const summaryQuery = useRepartoSummary(processId);
  const hasProcess = Boolean(resolveProcessId(processId));
  const isLoading =
    ((exportsQuery.isLoading && !exports) ||
      (summaryQuery.isLoading && !summary)) &&
    hasProcess;
  if (isLoading || exportsQuery.isError || summaryQuery.isError) {
    return (
      <QueryState
        error={exportsQuery.error ?? summaryQuery.error}
        isError={exportsQuery.isError || summaryQuery.isError}
        isLoading={isLoading}
        label={getRepartoDictionary(locale ?? normalizeRepartoLocale()).nav.item.exports}
        locale={locale}
      />
    );
  }
  return (
    <>
      <ExportCenterView
        exports={exports ?? exportsQuery.data?.data ?? []}
        locale={locale}
        processId={processId}
        processStatus={processStatus}
        summary={summary ?? summaryQuery.data}
      />
      <QueryState
        error={exportsQuery.error ?? summaryQuery.error}
        isError={exportsQuery.isError || summaryQuery.isError}
        isLoading={
          ((exportsQuery.isLoading && !exports) ||
            (summaryQuery.isLoading && !summary)) &&
          hasProcess
        }
        label={getRepartoDictionary(locale ?? normalizeRepartoLocale()).nav.item.exports}
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
