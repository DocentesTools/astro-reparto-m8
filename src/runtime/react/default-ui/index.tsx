import { useState, type ReactNode } from "react";

type FormSubmitEvent = { preventDefault: () => void };
type InputChangeEvent = { target: { value: string } };
import { RepartoProvider } from "../RepartoProvider.js";
import { RepartoQueryProvider } from "../RepartoQueryProvider.js";
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
  useCreateRepartoProcess,
  useRepartoDashboard,
  useRepartoExports,
  useRepartoMeetingSessions,
  useRepartoProcesses,
  useRepartoSummary,
  useRepartoTeacherLan,
  useRepartoVersions
} from "../hooks.js";
import { resolveProcessId, type RepartoListParams } from "../../queryKeys.js";
import {
  repartoActionRowClass,
  repartoButtonClass,
  repartoFieldGridClass,
  repartoFieldLabelClass,
  repartoInputClass,
  repartoListClass,
  repartoListItemClass,
  repartoPanelClass,
  repartoPanelHeaderClass,
  repartoShellClass
} from "../styles.js";
import type { RepartoRuntimeConfig } from "../../config.js";
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

type ViewConfig = Partial<RepartoRuntimeConfig>;

function Shell({ children, config }: { children: ReactNode; config?: ViewConfig }) {
  return (
    <RepartoQueryProvider>
      <RepartoProvider config={config}>{children}</RepartoProvider>
    </RepartoQueryProvider>
  );
}

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

function ProcessPicker({ onSelect }: { onSelect: (processId: string) => void }) {
  const processesQuery = useRepartoProcesses();
  const createProcess = useCreateRepartoProcess();
  const processes = processesQuery.data?.data ?? [];
  const [academicYearId, setAcademicYearId] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const canCreate =
    academicYearId.trim() !== "" &&
    schoolId.trim() !== "" &&
    departmentId.trim() !== "" &&
    !createProcess.isPending;

  function handleCreate(event: FormSubmitEvent) {
    event.preventDefault();
    if (!canCreate) return;
    createProcess.mutate(
      {
        academic_year_id: academicYearId.trim(),
        school_id: schoolId.trim(),
        department_id: departmentId.trim()
      },
      { onSuccess: (process) => onSelect(process.id) }
    );
  }

  return (
    <main className={repartoShellClass} data-reparto-route="process-picker">
      <section className={repartoPanelClass} data-reparto-panel="process-picker">
        <div className={repartoPanelHeaderClass}>
          <h2>Select a process</h2>
          <span className="text-sm text-muted-foreground" data-reparto-slot="process-count">
            {processesQuery.data?.count ?? 0}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Choose an assignment process to continue, or create a new one.
        </p>
        <div data-reparto-slot="process-picker-list">
          {processes.length > 0 ? (
            <ul className={repartoListClass}>
              {processes.map((process) => (
                <li
                  className={repartoListItemClass}
                  data-process-id={process.id}
                  data-process-status={process.status}
                  key={process.id}
                >
                  <button
                    className={repartoButtonClass}
                    data-reparto-action="select-process"
                    onClick={() => onSelect(process.id)}
                    type="button"
                  >
                    {process.status}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground" data-reparto-slot="process-empty">
              No processes yet. Create the first one below.
            </p>
          )}
        </div>
        <QueryState
          error={processesQuery.error}
          isError={processesQuery.isError}
          isLoading={processesQuery.isLoading}
          label="Processes"
        />
        <form
          className={repartoFieldGridClass}
          data-reparto-form="create-process"
          onSubmit={handleCreate}
        >
          <label className={repartoFieldLabelClass}>
            Academic year id
            <input
              className={repartoInputClass}
              data-reparto-field="academic-year"
              onChange={(event: InputChangeEvent) => setAcademicYearId(event.target.value)}
              value={academicYearId}
            />
          </label>
          <label className={repartoFieldLabelClass}>
            School id
            <input
              className={repartoInputClass}
              data-reparto-field="school"
              onChange={(event: InputChangeEvent) => setSchoolId(event.target.value)}
              value={schoolId}
            />
          </label>
          <label className={repartoFieldLabelClass}>
            Department id
            <input
              className={repartoInputClass}
              data-reparto-field="department"
              onChange={(event: InputChangeEvent) => setDepartmentId(event.target.value)}
              value={departmentId}
            />
          </label>
          <div className={repartoActionRowClass}>
            <button
              className={repartoButtonClass}
              data-reparto-action="create-process"
              disabled={!canCreate}
              type="submit"
            >
              {createProcess.isPending ? "creating…" : "create process"}
            </button>
          </div>
          {createProcess.isError ? (
            <p className="text-sm text-destructive" data-reparto-slot="create-error">
              {createProcess.error instanceof Error
                ? createProcess.error.message
                : "Could not create process."}
            </p>
          ) : null}
        </form>
      </section>
    </main>
  );
}

function WithSelectedProcess({
  bypass = false,
  children,
  processId
}: {
  bypass?: boolean;
  children: (processId: string | undefined) => ReactNode;
  processId?: string;
}) {
  const [selected, setSelected] = useState<string | undefined>(undefined);
  const effective = resolveProcessId(processId) ?? selected;
  if (!bypass && !effective) {
    return <ProcessPicker onSelect={setSelected} />;
  }
  return <>{children(effective ?? processId)}</>;
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
