import { useEffect, useState, type ReactNode } from "react";

type FormSubmitEvent = { preventDefault: () => void };
type InputChangeEvent = { target: { value: string } };
import { RepartoProvider } from "../RepartoProvider.js";
import { RepartoQueryProvider } from "../RepartoQueryProvider.js";
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
import { resolveProcessId } from "../../queryKeys.js";
import {
  formatRepartoMessage,
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
  const checklistSteps: Array<{
    key: keyof typeof dict.flow.bootstrap.step;
    done: boolean;
    disabledReason?: string;
    onOpen?: () => void;
  }> = [
    {
      key: "school",
      done: schoolOptions.length > 0,
      onOpen: () => setInlineCreate("school")
    },
    {
      key: "academicYear",
      done: yearOptions.length > 0,
      onOpen: () => setInlineCreate("academicYear")
    },
    {
      key: "department",
      done: departmentOptions.length > 0,
      onOpen: () => setInlineCreate("department")
    },
    {
      key: "process",
      done: processes.length > 0,
      onOpen: () => undefined
    },
    {
      key: "subjects",
      done: false,
      disabledReason: dict.disabled.noProcess
    },
    {
      key: "classrooms",
      done: false,
      disabledReason: dict.disabled.noProcess
    },
    {
      key: "teacherRoster",
      done: false,
      disabledReason: dict.disabled.noProcess
    },
    {
      key: "requirements",
      done: false,
      disabledReason: dict.disabled.noProcess
    },
    {
      key: "participants",
      done: false,
      disabledReason: dict.disabled.noProcess
    }
  ];
  const checklistDoneCount = checklistSteps.filter((step) => step.done).length;

  return (
    <main className={repartoShellClass} data-reparto-route="process-picker">
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
          <span
            className="text-sm text-muted-foreground"
            data-reparto-slot="setup-progress"
          >
            {formatRepartoMessage("{done}/9", { done: checklistDoneCount })}
          </span>
        </div>
        <ol className="mt-3 grid gap-2" data-reparto-checklist="">
          {checklistSteps.map((step) => (
            <li
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/70 bg-muted/20 px-3 py-2 text-sm"
              data-reparto-checklist-step={step.key}
              data-reparto-checklist-state={step.done ? "done" : "pending"}
              key={step.key}
            >
              <div className="min-w-0">
                <strong className="block text-foreground">
                  {dict.flow.bootstrap.step[step.key]}
                </strong>
                {step.disabledReason ? (
                  <span
                    className="text-xs text-muted-foreground"
                    data-reparto-disabled-reason=""
                  >
                    {step.disabledReason}
                  </span>
                ) : null}
              </div>
              {step.done ? (
                <span
                  className="text-xs font-medium text-primary"
                  data-reparto-step-status="done"
                >
                  {dict.flow.bootstrap.done}
                </span>
              ) : (
                <button
                  className={repartoButtonClass}
                  data-reparto-action={`open-${step.key}`}
                  data-disabled-reason={step.disabledReason ?? undefined}
                  disabled={Boolean(step.disabledReason)}
                  onClick={step.onOpen ?? (() => undefined)}
                  type="button"
                >
                  {dict.flow.bootstrap.open}
                </button>
              )}
            </li>
          ))}
        </ol>
      </section>
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

export function WithSelectedProcess({
  bypass = false,
  children,
  locale,
  mode = "admin",
  processId
}: {
  bypass?: boolean;
  children: (processId: string | undefined) => ReactNode;
  locale?: RepartoLocale;
  mode?: "admin" | "readonly";
  processId?: string;
}) {
  const routeProcessId = resolveProcessId(processId);
  const [selected, setSelected] = useState<string | undefined>(() => {
    if (routeProcessId || typeof window === "undefined") return undefined;
    return window.localStorage.getItem(LAST_PROCESS_STORAGE_KEY)?.trim() || undefined;
  });
  const effective = selected ?? resolveProcessId(processId);
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
      {children(effective ?? processId)}
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
