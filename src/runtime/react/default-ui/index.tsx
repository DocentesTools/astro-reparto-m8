import {
  DepartmentHeadWorkspace,
  ExportCenterView,
  ProcessListView,
  VersionsView
} from "../DepartmentHeadWorkspace.js";
import {
  SharedScreenWorkspace,
  TeacherLanWorkspace
} from "../LanWorkspace.js";
import {
  useRepartoDashboard,
  useRepartoExports,
  useRepartoMeetingSessions,
  useRepartoProcesses,
  useRepartoSummary,
  useRepartoTeacherLan,
  useRepartoVersions
} from "../hooks.js";
import { resolveProcessId, type RepartoListParams } from "../../queryKeys.js";
import { repartoPanelClass } from "../styles.js";
import {
  Shell,
  WithSelectedProcess,
  type ViewConfig
} from "./process-context.js";
import type {
  AssignmentProcessStatus,
  ExportArtifactPublic,
  MeetingSessionPublic,
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
  PlanningBalanceHeader,
  RepartoPlanningView
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
  if (!dashboard) return null;
  return {
    process_id: dashboard.process_id,
    global_balance: dashboard.global_balance,
    validations: dashboard.validations,
    current_turn: dashboard.current_turn,
    blocking_validation_count: dashboard.blocking_validation_count
  };
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
        mode="admin"
        processId={processId}
      >
        {(resolvedProcessId) => (
          <RepartoMeetingContent
            locale={locale}
            processId={resolvedProcessId}
            summary={summary}
          />
        )}
      </WithSelectedProcess>
    </Shell>
  );
}

function RepartoMeetingContent({
  locale,
  processId,
  summary
}: {
  locale?: "en" | "fr" | "es";
  processId?: string;
  summary?: ProcessSummary | null;
}) {
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
        label={getRepartoDictionary(locale ?? normalizeRepartoLocale()).nav.item.meeting}
        locale={locale}
      />
    );
  }
  return (
    <>
      <DepartmentHeadWorkspace locale={locale} mode="admin" summary={activeSummary} />
      <QueryState
        error={summaryQuery.error}
        isError={summaryQuery.isError}
        isLoading={
          summaryQuery.isLoading && Boolean(resolveProcessId(processId)) && !summary
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
  config,
  locale,
  meetingSession,
  processId,
  requirementAssignedHours,
  requirementRequiredHours,
  summary
}: {
  config?: ViewConfig;
  locale?: "en" | "fr" | "es";
  meetingSession?: MeetingSessionPublic | null;
  processId?: string;
  requirementAssignedHours?: number;
  requirementRequiredHours?: number;
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
            locale={locale}
            meetingSession={meetingSession}
            processId={resolvedProcessId}
            requirementAssignedHours={requirementAssignedHours}
            requirementRequiredHours={requirementRequiredHours}
            summary={summary}
          />
        )}
      </WithSelectedProcess>
    </Shell>
  );
}

function RepartoMyContent({
  locale,
  meetingSession,
  processId,
  requirementAssignedHours,
  requirementRequiredHours,
  summary
}: {
  locale?: "en" | "fr" | "es";
  meetingSession?: MeetingSessionPublic | null;
  processId?: string;
  requirementAssignedHours?: number;
  requirementRequiredHours?: number;
  summary?: TeacherLanSummary | null;
}) {
  const summaryQuery = useRepartoTeacherLan(processId);
  const sessionsQuery = useRepartoMeetingSessions(processId);
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
        locale={locale}
        meetingSession={activeSession}
        processId={processId}
        requirementAssignedHours={requirementAssignedHours}
        requirementRequiredHours={requirementRequiredHours}
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
        mode="readonly"
        processId={processId}
      >
        {(resolvedProcessId) => (
          <RepartoSharedContent
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

function RepartoSharedContent({
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
  const dict = getRepartoDictionary(locale ?? normalizeRepartoLocale());
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
        label={dict.nav.item.shared}
        locale={locale}
      />
    );
  }
  return (
    <>
      <SharedScreenWorkspace
        dashboard={activeDashboard}
        locale={locale}
        processId={processId}
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
        label={getRepartoDictionary(locale ?? normalizeRepartoLocale()).nav.item.shared}
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
  comparison?: VersionComparison;
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

function RepartoVersionsContent({
  comparison,
  locale,
  processId,
  versions
}: {
  comparison?: VersionComparison;
  locale?: RepartoLocale;
  processId?: string;
  versions?: ProcessVersionPublic[];
}) {
  const versionsQuery = useRepartoVersions(processId);
  const activeVersions = versions ?? versionsQuery.data?.data ?? [];
  const isLoading =
    versionsQuery.isLoading && Boolean(resolveProcessId(processId)) && !versions;
  if (isLoading || versionsQuery.isError) {
    return (
      <QueryState
        error={versionsQuery.error}
        isError={versionsQuery.isError}
        isLoading={isLoading}
        label={getRepartoDictionary(locale ?? normalizeRepartoLocale()).nav.item.versions}
        locale={locale}
      />
    );
  }
  return (
    <>
      <VersionsView comparison={comparison} locale={locale} versions={activeVersions} />
      <QueryState
        error={versionsQuery.error}
        isError={versionsQuery.isError}
        isLoading={
          versionsQuery.isLoading && Boolean(resolveProcessId(processId)) && !versions
        }
        label={getRepartoDictionary(locale ?? normalizeRepartoLocale()).nav.item.versions}
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
