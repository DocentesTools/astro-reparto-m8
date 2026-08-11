import { useEffect, useState, type ReactNode } from "react";

type FormSubmitEvent = { preventDefault: () => void };
type InputChangeEvent = { target: { value: string } };
import { RepartoProvider } from "../RepartoProvider.js";
import { RepartoQueryProvider } from "../RepartoQueryProvider.js";
import { useRepartoCanAct, useRepartoViewMode } from "../useRepartoRole.js";
import {
  useCreateRepartoAcademicYear,
  useCreateRepartoDepartment,
  useCreateRepartoProcess,
  useCreateRepartoSchool,
  useRepartoAcademicYears,
  useRepartoDepartments,
  useRepartoProcesses,
  useRepartoSchools
} from "../hooks.js";
import {
  useRepartoEventStream,
  type RepartoEventStreamState
} from "../useRepartoEvents.js";
import {
  SetupChecklistProgress,
  SetupChecklistSteps
} from "../SetupChecklist.js";
import { buildSetupChecklist, type SetupChecklistStepKey } from "../../ui/index.js";
import { resolveProcessId } from "../../queryKeys.js";
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
import type { SseAudience } from "../../schemas.js";

export type ViewConfig = Partial<RepartoRuntimeConfig>;

const LAST_PROCESS_STORAGE_KEY = "reparto.lastProcessId";

export function Shell({
  children,
  config
}: {
  children: ReactNode;
  config?: ViewConfig;
}) {
  return (
    <RepartoQueryProvider>
      <RepartoProvider config={config}>{children}</RepartoProvider>
    </RepartoQueryProvider>
  );
}

export function ProcessPicker({
  locale,
  onSelect
}: {
  locale?: RepartoLocale;
  onSelect: (processId: string) => void;
}) {
  const dict = getRepartoDictionary(locale ?? normalizeRepartoLocale());
  // The picker is two things at once: a list to choose from, which any `READER`
  // may use, and a bootstrap that creates a process plus its school, year and
  // department inline — all department-head or platform-setup writes (§21.3).
  // Only the second half is withheld, so a `READER` with no process selected
  // still gets somewhere rather than an empty page.
  const canAct = useRepartoCanAct("processList");
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
  // The same derivation the dashboard uses (`S2-07`). The picker's copy used to
  // be a second list whose last five steps were hard-coded "not done"; they are
  // now genuinely untested here — no process is selected by construction — and
  // the checklist says so instead of asserting an operator has not done work
  // this screen never looked at.
  const checklist = buildSetupChecklist({
    academicYearCount: yearOptions.length,
    departmentCount: departmentOptions.length,
    processCount: processes.length,
    schoolCount: schoolOptions.length
  });
  const inlineCreateHandlers: Partial<
    Record<SetupChecklistStepKey, () => void>
  > = {
    school: () => setInlineCreate("school"),
    academicYear: () => setInlineCreate("academicYear"),
    department: () => setInlineCreate("department")
  };

  return (
    <main className={repartoShellClass} data-reparto-route="process-picker">
      {canAct ? (
      <section
        className={repartoPanelClass}
        data-reparto-panel="setup-checklist"
        data-reparto-slot="setup-checklist"
      >
        <div className={repartoPanelHeaderClass}>
          <div className="space-y-1">
            <h2>{dict.flow.bootstrap.title}</h2>
            <p className="text-sm text-muted-foreground">
              {dict.flow.bootstrap.subtitle}
            </p>
          </div>
          <SetupChecklistProgress checklist={checklist} />
        </div>
        <SetupChecklistSteps
          checklist={checklist}
          locale={locale}
          onOpenStep={(key) => inlineCreateHandlers[key] ?? null}
        />
      </section>
      ) : null}
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
                    {dict.entity.assignmentProcess.status[process.status]}
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
        {canAct ? (
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
        ) : null}
      </section>
    </main>
  );
}

/**
 * The process toolbar's mode badge reports the *session*, not the page.
 *
 * It used to be whatever literal the route passed in, so every caller declared
 * its own answer to a question only the signed-in user can settle (`RBAC-05`).
 * The prop is gone rather than defaulted: while a caller can still hand a mode
 * in, the badge is a convention rather than a statement about the session.
 */
export function WithSelectedProcess({
  bypass = false,
  children,
  locale,
  processId,
  streamAudience = "department_head"
}: {
  bypass?: boolean;
  children: (
    processId: string | undefined,
    eventState: RepartoEventStreamState
  ) => ReactNode;
  locale?: RepartoLocale;
  processId?: string;
  streamAudience?: SseAudience;
}) {
  const mode = useRepartoViewMode();
  const routeProcessId = resolveProcessId(processId);
  const [selected, setSelected] = useState<string | undefined>(() => {
    if (routeProcessId || typeof window === "undefined") return undefined;
    return window.localStorage.getItem(LAST_PROCESS_STORAGE_KEY)?.trim() || undefined;
  });
  const effective = selected ?? resolveProcessId(processId);
  const eventState = useRepartoEventStream(effective, streamAudience);
  const dict = getRepartoDictionary(locale ?? normalizeRepartoLocale());
  const processesQuery = useRepartoProcesses();
  const processes = processesQuery.data?.data ?? [];

  useEffect(() => {
    if (routeProcessId || selected || typeof window === "undefined") return;
    const stored = window.localStorage.getItem(LAST_PROCESS_STORAGE_KEY)?.trim();
    if (stored) {
      setSelected(stored);
    }
  }, [routeProcessId, selected]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (effective) {
      window.localStorage.setItem(LAST_PROCESS_STORAGE_KEY, effective);
    }
  }, [effective]);

  // A restored id outlives the process it names. A reset database or a deleted
  // process leaves `reparto.lastProcessId` pointing at a row the service 404s
  // on, and because a non-empty `effective` suppresses the picker, the view has
  // no affordance left to choose another one — every child request just fails.
  // Forget the id once the list proves it is gone. The `count` guard keeps a
  // still-valid id sitting on a later page from being mistaken for a deleted
  // one, and only the *restored* id is dropped: an id pinned by the route is
  // the caller's statement, not ours to overrule.
  useEffect(() => {
    if (!selected || routeProcessId) return;
    const list = processesQuery.data;
    if (!list || list.count > list.data.length) return;
    if (list.data.some((process) => process.id === selected)) return;
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(LAST_PROCESS_STORAGE_KEY);
    }
    setSelected(undefined);
  }, [processesQuery.data, routeProcessId, selected]);

  if (!bypass && !effective) {
    return <ProcessPicker locale={locale} onSelect={setSelected} />;
  }
  return (
    <>
      {processes.length > 0 ? (
        <section className={repartoPanelClass} data-reparto-panel="process-toolbar">
          <div className={repartoPanelHeaderClass}>
            <div className="space-y-1">
              <h2>{dict.dashboard.pickerLabel}</h2>
              <p className="text-sm text-muted-foreground">
                {dict.dashboard.pickerHint}
              </p>
            </div>
            <span
              className="rounded-full border border-primary/30 bg-primary/5 px-2 py-1 text-xs font-medium text-primary"
              data-reparto-dashboard-mode={mode}
            >
              {dict.dashboard.mode[mode]}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <select
              className={repartoInputClass}
              data-reparto-field="selected-process"
              disabled={Boolean(routeProcessId)}
              onChange={(event: InputChangeEvent) => setSelected(event.target.value)}
              value={effective ?? routeProcessId ?? ""}
            >
              {processes.map((process) => (
                <option key={process.id} value={process.id}>
                  {dict.entity.assignmentProcess.status[process.status]}
                </option>
              ))}
            </select>
            {routeProcessId ? (
              <span
                className="text-xs text-muted-foreground"
                data-reparto-disabled-reason=""
              >
                {dict.dashboard.state.lockedToRoute}
              </span>
            ) : null}
          </div>
        </section>
      ) : null}
      {children(effective ?? processId, eventState)}
    </>
  );
}

type DictType = ReturnType<typeof getRepartoDictionary>;

function InlineSchoolCreate({
  dict,
  isPending,
  onCancel,
  onCreate
}: {
  dict: DictType;
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
  dict: DictType;
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
  dict: DictType;
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
