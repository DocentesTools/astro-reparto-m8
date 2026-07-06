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

function QueryState({
  error,
  isError,
  isLoading,
  label
}: {
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  label: string;
}) {
  if (isLoading) {
    return (
      <section className={repartoPanelClass} data-reparto-state="loading">
        {label} loading
      </section>
    );
  }
  if (!isError) return null;
  return (
    <section className={repartoPanelClass} data-reparto-state="error">
      {error instanceof Error ? error.message : `${label} unavailable`}
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
  processId,
  summary
}: {
  config?: ViewConfig;
  dashboard?: ProcessDashboard | null;
  processId?: string;
  summary?: ProcessSummary | null;
}) {
  return (
    <Shell config={config}>
      <WithSelectedProcess bypass={Boolean(dashboard || summary)} processId={processId}>
        {(resolvedProcessId) => (
          <RepartoDashboardContent
            dashboard={dashboard}
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
  processId,
  summary
}: {
  dashboard?: ProcessDashboard | null;
  processId?: string;
  summary?: ProcessSummary | null;
}) {
  const dashboardQuery = useRepartoDashboard(processId);
  const activeDashboard = dashboard ?? dashboardQuery.data ?? null;
  const activeSummary = summary ?? dashboardSummary(activeDashboard);
  return (
    <>
      <DepartmentHeadWorkspace dashboard={activeDashboard} summary={activeSummary} />
      <QueryState
        error={dashboardQuery.error}
        isError={dashboardQuery.isError}
        isLoading={
          dashboardQuery.isLoading &&
          Boolean(resolveProcessId(processId)) &&
          !dashboard &&
          !summary
        }
        label="Dashboard"
      />
    </>
  );
}

export function RepartoMeetingView({
  config,
  processId,
  summary
}: {
  config?: ViewConfig;
  processId?: string;
  summary?: ProcessSummary | null;
}) {
  return (
    <Shell config={config}>
      <WithSelectedProcess bypass={Boolean(summary)} processId={processId}>
        {(resolvedProcessId) => (
          <RepartoMeetingContent processId={resolvedProcessId} summary={summary} />
        )}
      </WithSelectedProcess>
    </Shell>
  );
}

function RepartoMeetingContent({
  processId,
  summary
}: {
  processId?: string;
  summary?: ProcessSummary | null;
}) {
  const summaryQuery = useRepartoSummary(processId);
  const activeSummary = summary ?? summaryQuery.data ?? null;
  return (
    <>
      <DepartmentHeadWorkspace summary={activeSummary} />
      <QueryState
        error={summaryQuery.error}
        isError={summaryQuery.isError}
        isLoading={
          summaryQuery.isLoading && Boolean(resolveProcessId(processId)) && !summary
        }
        label="Meeting"
      />
    </>
  );
}

export function RepartoProcessesView({
  config,
  params
}: {
  config?: ViewConfig;
  params?: RepartoListParams;
}) {
  return (
    <Shell config={config}>
      <RepartoProcessesContent params={params} />
    </Shell>
  );
}

function RepartoProcessesContent({ params }: { params?: RepartoListParams }) {
  const processesQuery = useRepartoProcesses(params);
  const processes = processesQuery.data?.data ?? [];
  return (
    <>
      <ProcessListView count={processesQuery.data?.count ?? 0} processes={processes} />
      <QueryState
        error={processesQuery.error}
        isError={processesQuery.isError}
        isLoading={processesQuery.isLoading}
        label="Processes"
      />
    </>
  );
}

export function RepartoMyView({
  config,
  meetingSession,
  processId,
  requirementAssignedHours,
  requirementRequiredHours,
  summary
}: {
  config?: ViewConfig;
  meetingSession?: MeetingSessionPublic | null;
  processId?: string;
  requirementAssignedHours?: number;
  requirementRequiredHours?: number;
  summary?: TeacherLanSummary | null;
}) {
  return (
    <Shell config={config}>
      <WithSelectedProcess bypass={Boolean(summary)} processId={processId}>
        {(resolvedProcessId) => (
          <RepartoMyContent
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
  meetingSession,
  processId,
  requirementAssignedHours,
  requirementRequiredHours,
  summary
}: {
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
  return (
    <>
      <TeacherLanWorkspace
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
        label="Teacher view"
      />
    </>
  );
}

export function RepartoSharedView({
  config,
  processId,
  summary
}: {
  config?: ViewConfig;
  processId?: string;
  summary?: ProcessSummary | null;
}) {
  return (
    <Shell config={config}>
      <WithSelectedProcess bypass={Boolean(summary)} processId={processId}>
        {(resolvedProcessId) => (
          <RepartoSharedContent processId={resolvedProcessId} summary={summary} />
        )}
      </WithSelectedProcess>
    </Shell>
  );
}

function RepartoSharedContent({
  processId,
  summary
}: {
  processId?: string;
  summary?: ProcessSummary | null;
}) {
  const summaryQuery = useRepartoSummary(processId);
  const activeSummary = summary ?? summaryQuery.data ?? null;
  return (
    <>
      <SharedScreenWorkspace processId={processId} summary={activeSummary} />
      <QueryState
        error={summaryQuery.error}
        isError={summaryQuery.isError}
        isLoading={
          summaryQuery.isLoading && Boolean(resolveProcessId(processId)) && !summary
        }
        label="Shared view"
      />
    </>
  );
}

export function RepartoVersionsView({
  comparison,
  config,
  processId,
  versions
}: {
  comparison?: VersionComparison;
  config?: ViewConfig;
  processId?: string;
  versions?: ProcessVersionPublic[];
}) {
  return (
    <Shell config={config}>
      <WithSelectedProcess bypass={Boolean(versions)} processId={processId}>
        {(resolvedProcessId) => (
          <RepartoVersionsContent
            comparison={comparison}
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
  processId,
  versions
}: {
  comparison?: VersionComparison;
  processId?: string;
  versions?: ProcessVersionPublic[];
}) {
  const versionsQuery = useRepartoVersions(processId);
  const activeVersions = versions ?? versionsQuery.data?.data ?? [];
  return (
    <>
      <VersionsView comparison={comparison} versions={activeVersions} />
      <QueryState
        error={versionsQuery.error}
        isError={versionsQuery.isError}
        isLoading={
          versionsQuery.isLoading && Boolean(resolveProcessId(processId)) && !versions
        }
        label="Versions"
      />
    </>
  );
}

export function RepartoExportsView({
  config,
  exports,
  processId,
  processStatus,
  summary
}: {
  config?: ViewConfig;
  exports?: ExportArtifactPublic[];
  processId?: string;
  processStatus?: AssignmentProcessStatus;
  summary?: ProcessSummary;
}) {
  return (
    <Shell config={config}>
      <WithSelectedProcess bypass={Boolean(exports || summary)} processId={processId}>
        {(resolvedProcessId) => (
          <RepartoExportsContent
            exports={exports}
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
  processId,
  processStatus,
  summary
}: {
  exports?: ExportArtifactPublic[];
  processId?: string;
  processStatus?: AssignmentProcessStatus;
  summary?: ProcessSummary;
}) {
  const exportsQuery = useRepartoExports(processId);
  const summaryQuery = useRepartoSummary(processId);
  const hasProcess = Boolean(resolveProcessId(processId));
  return (
    <>
      <ExportCenterView
        exports={exports ?? exportsQuery.data?.data ?? []}
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
        label="Exports"
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