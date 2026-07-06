import { useState, type ReactNode } from "react";

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
  processId
}: {
  bypass?: boolean;
  children: (processId: string | undefined) => ReactNode;
  locale?: RepartoLocale;
  processId?: string;
}) {
  const [selected, setSelected] = useState<string | undefined>(undefined);
  const effective = resolveProcessId(processId) ?? selected;
  if (!bypass && !effective) {
    return <ProcessPicker locale={locale} onSelect={setSelected} />;
  }
  return <>{children(effective ?? processId)}</>;
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