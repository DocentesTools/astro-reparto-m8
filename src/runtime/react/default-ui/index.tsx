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
  useCreateRepartoAcademicYear,
  useCreateRepartoDepartment,
  useCreateRepartoProcess,
  useCreateRepartoSchool,
  useRepartoAcademicYears,
  useRepartoDashboard,
  useRepartoDepartments,
  useRepartoExports,
  useRepartoMeetingSessions,
  useRepartoProcesses,
  useRepartoSchools,
  useRepartoSummary,
  useRepartoTeacherLan,
  useRepartoVersions
} from "../hooks.js";
import { resolveProcessId, type RepartoListParams } from "../../queryKeys.js";
import {
  getRepartoDictionary,
  normalizeRepartoLocale,
  type RepartoLocale
} from "../../i18n/index.js";
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

function ProcessPicker({
  locale,
  onSelect
}: {
  locale?: RepartoLocale;
  onSelect: (processId: string) => void;
}) {
  const dict = getRepartoDictionary(locale ?? normalizeRepartoLocale());
  const processesQuery = useRepartoProcesses();
  const createProcess = useCreateRepartoProcess();
  const processes = processesQuery.data?.data ?? [];

  const schoolsQuery = useRepartoSchools({ limit: 100 });
  const academicYearsQuery = useRepartoAcademicYears({ limit: 100 });
  const departmentsQuery = useRepartoDepartments({ limit: 100 });

  const [academicYearId, setAcademicYearId] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const [inlineCreate, setInlineCreate] = useState<
    "school" | "academicYear" | "department" | null
  >(null);

  const createSchool = useCreateRepartoSchool();
  const createAcademicYear = useCreateRepartoAcademicYear();
  const createDepartment = useCreateRepartoDepartment();

  const canCreate =
    academicYearId.trim() !== "" &&
    schoolId.trim() !== "" &&
    departmentId.trim() !== "" &&
    !createProcess.isPending;

  const missingReason =
    academicYearId.trim() === "" || schoolId.trim() === "" || departmentId.trim() === ""
      ? dict.disabled.noProcess
      : null;

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

  function handleSelectChange(
    value: string,
    setter: (value: string) => void,
    entity: "school" | "academicYear" | "department"
  ) {
    if (value === "__create_new__") {
      setInlineCreate(entity);
      return;
    }
    setter(value);
  }

  function handleInlineSchool(name: string) {
    createSchool.mutate(
      { name },
      {
        onSuccess: (school) => {
          setSchoolId(school.id);
          setInlineCreate(null);
        }
      }
    );
  }

  function handleInlineAcademicYear(label: string, startDate: string, endDate: string) {
    createAcademicYear.mutate(
      { label, start_date: startDate, end_date: endDate },
      {
        onSuccess: (year) => {
          setAcademicYearId(year.id);
          setInlineCreate(null);
        }
      }
    );
  }

  function handleInlineDepartment(name: string) {
    if (!schoolId) return;
    createDepartment.mutate(
      { school_id: schoolId, name },
      {
        onSuccess: (department) => {
          setDepartmentId(department.id);
          setInlineCreate(null);
        }
      }
    );
  }

  const schoolOptions = (schoolsQuery.data?.data ?? []).map((school) => ({
    value: school.id,
    label: school.name
  }));
  const yearOptions = (academicYearsQuery.data?.data ?? []).map((year) => ({
    value: year.id,
    label: year.label
  }));
  const departmentOptions = (departmentsQuery.data?.data ?? []).map((department) => ({
    value: department.id,
    label: department.name
  }));

  return (
    <main className={repartoShellClass} data-reparto-route="process-picker">
      <section className={repartoPanelClass} data-reparto-panel="process-picker">
        <div className={repartoPanelHeaderClass}>
          <h2>{dict.picker.selectProcess}</h2>
          <span className="text-sm text-muted-foreground" data-reparto-slot="process-count">
            {processesQuery.data?.count ?? 0}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {processes.length > 0
            ? dict.picker.selectProcess
            : dict.picker.noProcesses}
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
              {dict.picker.noProcesses}
            </p>
          )}
        </div>
        <QueryState
          error={processesQuery.error}
          isError={processesQuery.isError}
          isLoading={processesQuery.isLoading}
          label={dict.entity.assignmentProcess.plural}
        />
        <form
          className={repartoFieldGridClass}
          data-reparto-form="create-process"
          onSubmit={handleCreate}
        >
          <label className={repartoFieldLabelClass} data-reparto-fk="academic-year">
            {dict.field.academicYear}
            <select
              className={repartoInputClass}
              data-reparto-field="academic-year"
              onChange={(event: InputChangeEvent) =>
                handleSelectChange(event.target.value, setAcademicYearId, "academicYear")
              }
              value={academicYearId}
            >
              <option value="">{dict.picker.selectProcess}</option>
              {yearOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
              <option value="__create_new__" data-reparto-fk-action="create-new">
                {dict.picker.createNew}
              </option>
            </select>
          </label>
          <label className={repartoFieldLabelClass} data-reparto-fk="school">
            {dict.field.school}
            <select
              className={repartoInputClass}
              data-reparto-field="school"
              onChange={(event: InputChangeEvent) =>
                handleSelectChange(event.target.value, setSchoolId, "school")
              }
              value={schoolId}
            >
              <option value="">{dict.field.school}</option>
              {schoolOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
              <option value="__create_new__" data-reparto-fk-action="create-new">
                {dict.picker.createNew}
              </option>
            </select>
          </label>
          <label className={repartoFieldLabelClass} data-reparto-fk="department">
            {dict.field.department}
            <select
              className={repartoInputClass}
              data-reparto-field="department"
              onChange={(event: InputChangeEvent) =>
                handleSelectChange(event.target.value, setDepartmentId, "department")
              }
              value={departmentId}
            >
              <option value="">{dict.field.department}</option>
              {departmentOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
              <option value="__create_new__" data-reparto-fk-action="create-new">
                {dict.picker.createNew}
              </option>
            </select>
          </label>

          {inlineCreate === "school" ? (
            <InlineSchoolCreate
              dict={dict}
              isPending={createSchool.isPending}
              onCancel={() => setInlineCreate(null)}
              onCreate={handleInlineSchool}
            />
          ) : null}
          {inlineCreate === "academicYear" ? (
            <InlineAcademicYearCreate
              dict={dict}
              isPending={createAcademicYear.isPending}
              onCancel={() => setInlineCreate(null)}
              onCreate={handleInlineAcademicYear}
            />
          ) : null}
          {inlineCreate === "department" ? (
            <InlineDepartmentCreate
              dict={dict}
              disabled={schoolId === ""}
              isPending={createDepartment.isPending}
              onCancel={() => setInlineCreate(null)}
              onCreate={handleInlineDepartment}
            />
          ) : null}

          <div className={repartoActionRowClass}>
            <button
              className={repartoButtonClass}
              data-reparto-action="create-process"
              data-disabled-reason={missingReason ?? undefined}
              disabled={!canCreate}
              type="submit"
            >
              {createProcess.isPending
                ? dict.action.create + "…"
                : dict.action.create}
            </button>
            {missingReason ? (
              <span className="text-xs text-muted-foreground" data-reparto-disabled-reason="">
                {missingReason}
              </span>
            ) : null}
          </div>
          {createProcess.isError ? (
            <p className="text-sm text-destructive" data-reparto-slot="create-error">
              {createProcess.error instanceof Error
                ? createProcess.error.message
                : dict.error.server}
            </p>
          ) : null}
        </form>
      </section>
    </main>
  );
}

function InlineSchoolCreate({
  dict,
  isPending,
  onCancel,
  onCreate
}: {
  dict: ReturnType<typeof getRepartoDictionary>;
  isPending: boolean;
  onCancel: () => void;
  onCreate: (name: string) => void;
}) {
  const [name, setName] = useState("");
  return (
    <div className={repartoPanelClass} data-reparto-inline-create="school">
      <label className={repartoFieldLabelClass}>
        {dict.entity.school.singular}
        <input
          className={repartoInputClass}
          data-reparto-field="school-name"
          onChange={(event: InputChangeEvent) => setName(event.target.value)}
          value={name}
        />
      </label>
      <div className={repartoActionRowClass}>
        <button
          className={repartoButtonClass}
          data-reparto-action="save-inline-school"
          disabled={name.trim() === "" || isPending}
          onClick={(event: FormSubmitEvent) => {
            event.preventDefault();
            if (name.trim()) onCreate(name.trim());
          }}
          type="button"
        >
          {dict.action.save}
        </button>
        <button
          className={repartoButtonClass}
          data-reparto-action="cancel-inline-school"
          onClick={onCancel}
          type="button"
        >
          {dict.action.cancel}
        </button>
      </div>
    </div>
  );
}

function InlineAcademicYearCreate({
  dict,
  isPending,
  onCancel,
  onCreate
}: {
  dict: ReturnType<typeof getRepartoDictionary>;
  isPending: boolean;
  onCancel: () => void;
  onCreate: (label: string, startDate: string, endDate: string) => void;
}) {
  const [label, setLabel] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const valid =
    label.trim() !== "" &&
    /^\d{4}-\d{2}-\d{2}$/.test(startDate) &&
    /^\d{4}-\d{2}-\d{2}$/.test(endDate) &&
    startDate <= endDate;
  return (
    <div className={repartoPanelClass} data-reparto-inline-create="academic-year">
      <label className={repartoFieldLabelClass}>
        {dict.field.label}
        <input
          className={repartoInputClass}
          data-reparto-field="year-label"
          maxLength={20}
          onChange={(event: InputChangeEvent) => setLabel(event.target.value)}
          value={label}
        />
      </label>
      <div className={repartoActionRowClass}>
        <label className={repartoFieldLabelClass}>
          {dict.field.startDate}
          <input
            className={repartoInputClass}
            data-reparto-field="year-start-date"
            type="date"
            onChange={(event: InputChangeEvent) => setStartDate(event.target.value)}
            value={startDate}
          />
        </label>
        <label className={repartoFieldLabelClass}>
          {dict.field.endDate}
          <input
            className={repartoInputClass}
            data-reparto-field="year-end-date"
            type="date"
            onChange={(event: InputChangeEvent) => setEndDate(event.target.value)}
            value={endDate}
          />
        </label>
      </div>
      <div className={repartoActionRowClass}>
        <button
          className={repartoButtonClass}
          data-reparto-action="save-inline-year"
          disabled={!valid || isPending}
          onClick={(event: FormSubmitEvent) => {
            event.preventDefault();
            if (valid) onCreate(label.trim(), startDate, endDate);
          }}
          type="button"
        >
          {dict.action.save}
        </button>
        <button
          className={repartoButtonClass}
          data-reparto-action="cancel-inline-year"
          onClick={onCancel}
          type="button"
        >
          {dict.action.cancel}
        </button>
      </div>
    </div>
  );
}

function InlineDepartmentCreate({
  dict,
  disabled,
  isPending,
  onCancel,
  onCreate
}: {
  dict: ReturnType<typeof getRepartoDictionary>;
  disabled: boolean;
  isPending: boolean;
  onCancel: () => void;
  onCreate: (name: string) => void;
}) {
  const [name, setName] = useState("");
  return (
    <div className={repartoPanelClass} data-reparto-inline-create="department">
      {disabled ? (
        <p className="text-sm text-muted-foreground" data-reparto-disabled-reason="">
          {dict.disabled.missingPrereq.replace("{prereq}", dict.field.school)}
        </p>
      ) : null}
      <label className={repartoFieldLabelClass}>
        {dict.entity.department.singular}
        <input
          className={repartoInputClass}
          data-reparto-field="department-name"
          onChange={(event: InputChangeEvent) => setName(event.target.value)}
          value={name}
        />
      </label>
      <div className={repartoActionRowClass}>
        <button
          className={repartoButtonClass}
          data-reparto-action="save-inline-department"
          disabled={disabled || name.trim() === "" || isPending}
          onClick={(event: FormSubmitEvent) => {
            event.preventDefault();
            if (name.trim()) onCreate(name.trim());
          }}
          type="button"
        >
          {dict.action.save}
        </button>
        <button
          className={repartoButtonClass}
          data-reparto-action="cancel-inline-department"
          onClick={onCancel}
          type="button"
        >
          {dict.action.cancel}
        </button>
      </div>
    </div>
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

export {
  RepartoAcademicYearsView,
  RepartoDepartmentsView,
  RepartoSchoolsView,
  RepartoTeacherRosterView
} from "./setup-crud.js";

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
