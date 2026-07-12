import { useState } from "react";
import { RepartoProvider } from "../RepartoProvider.js";
import { RepartoQueryProvider } from "../RepartoQueryProvider.js";
import {
  useArchiveRepartoAcademicYear,
  useCreateRepartoAcademicYear,
  useCreateRepartoDepartment,
  useCreateRepartoSchool,
  useCreateRepartoTeacherProfile,
  useDeleteRepartoTeacherProfile,
  useLinkRepartoTeacherProfileUser,
  useRepartoAcademicYears,
  useRepartoDepartments,
  useRepartoSchools,
  useRepartoTeacherProfiles,
  useUpdateRepartoAcademicYear,
  useUpdateRepartoDepartment,
  useUpdateRepartoSchool,
  useUpdateRepartoTeacherProfile
} from "../hooks.js";
import {
  formatRepartoMessage,
  getRepartoDictionary,
  normalizeRepartoLocale,
  type RepartoLocale
} from "../../i18n/index.js";
import {
  EMPTY_REPARTO_MAPPED_ERROR,
  findFieldError,
  mapRepartoError,
  type RepartoMappedError
} from "../../errorMapping.js";
import {
  RepartoDisabledReason,
  RepartoFieldError,
  RepartoFormError
} from "./feedback.js";
import {
  ActionButton,
  EntityDeleteDialog,
  EntityDialogShell
} from "./process-crud/shared.js";
import { DataTable, type DataTableColumn } from "./data-table.js";
import {
  repartoActionRowClass,
  repartoFieldGridClass,
  repartoFieldLabelClass,
  repartoInputClass,
  repartoPanelClass,
  repartoShellClass
} from "../styles.js";
import type { RepartoRuntimeConfig } from "../../config.js";
import type {
  AcademicYearPublic,
  DepartmentPublic,
  SchoolPublic,
  TeacherProfilePublic
} from "../../schemas.js";

type ViewConfig = Partial<RepartoRuntimeConfig>;
type InputChangeEvent = { target: { value: string } };
type CheckboxChangeEvent = { target: { checked: boolean } };
type FormEvent = { preventDefault: () => void };

function Shell({ children, config }: { children: React.ReactNode; config?: ViewConfig }) {
  return (
    <RepartoQueryProvider>
      <RepartoProvider config={config}>{children}</RepartoProvider>
    </RepartoQueryProvider>
  );
}

function QueryState({
  dict,
  error,
  isError,
  isLoading,
  label
}: {
  dict: ReturnType<typeof getRepartoDictionary>;
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  label: string;
}) {
  if (isLoading) {
    return (
      <section className={repartoPanelClass} data-reparto-state="loading">
        {formatRepartoMessage(dict.view.loading, { entity: label })}
      </section>
    );
  }
  if (!isError) return null;
  const mapped = mapRepartoError(error);
  const message = mapped.formError?.message ?? formatRepartoMessage(dict.view.unavailable, { entity: label });
  return (
    <section
      className={repartoPanelClass}
      data-reparto-state="error"
      data-reparto-error-key={mapped.formError?.errorKey ?? "server"}
    >
      {message}
    </section>
  );
}

function RowActions({ children }: { children: React.ReactNode }) {
  return <div className={repartoActionRowClass}>{children}</div>;
}

type TableLabels = ReturnType<typeof getRepartoDictionary>["table"];

function dataTableLabels(table: TableLabels, search: string) {
  return {
    columns: table.columns,
    filter: table.all,
    firstPage: table.firstPage,
    lastPage: table.lastPage,
    nextPage: table.nextPage,
    page: (current: number, total: number) => `${table.page} ${current} / ${total}`,
    previousPage: table.previousPage,
    rowsPerPage: table.rowsPerPage,
    search
  };
}

export function RepartoSchoolsView({
  config,
  locale
}: {
  config?: ViewConfig;
  locale?: RepartoLocale;
}) {
  return (
    <Shell config={config}>
      <RepartoSchoolsContent locale={locale} />
    </Shell>
  );
}

function RepartoSchoolsContent({ locale }: { locale?: RepartoLocale }) {
  const dict = getRepartoDictionary(locale ?? normalizeRepartoLocale());
  const query = useRepartoSchools({ limit: 100 });
  const rows = query.data?.data ?? [];
  const createMutation = useCreateRepartoSchool();
  const updateMutation = useUpdateRepartoSchool();

  const [editing, setEditing] = useState<SchoolPublic | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [locality, setLocality] = useState("");
  const [province, setProvince] = useState("");
  const [region, setRegion] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [mapped, setMapped] = useState<RepartoMappedError>(
    EMPTY_REPARTO_MAPPED_ERROR
  );

  const formOpen = creating || Boolean(editing);

  function openCreate() {
    setEditing(null);
    setCreating(true);
    setName("");
    setLocality("");
    setProvince("");
    setRegion("");
    setAddress("");
    setNotes("");
    setMapped(EMPTY_REPARTO_MAPPED_ERROR);
  }

  function openEdit(school: SchoolPublic) {
    setCreating(false);
    setEditing(school);
    setName(school.name);
    setLocality(school.locality ?? "");
    setProvince(school.province ?? "");
    setRegion(school.region ?? "");
    setAddress(school.address ?? "");
    setNotes(school.notes ?? "");
    setMapped(EMPTY_REPARTO_MAPPED_ERROR);
  }

  function closeForm() {
    setCreating(false);
    setEditing(null);
    setMapped(EMPTY_REPARTO_MAPPED_ERROR);
  }

  const canSave =
    name.trim().length > 0 &&
    !createMutation.isPending &&
    !updateMutation.isPending;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSave) return;
    setMapped(EMPTY_REPARTO_MAPPED_ERROR);
    const body = {
      name: name.trim(),
      locality: locality.trim() || null,
      province: province.trim() || null,
      address: address.trim() || null,
      notes: notes.trim() || null
    };
    const onErr = (err: unknown) => setMapped(mapRepartoError(err));
    if (editing) {
      updateMutation.mutate(
        {
          schoolId: editing.id,
          body: { ...body, region: region.trim() || null }
        },
        { onSuccess: () => closeForm(), onError: onErr }
      );
    } else {
      createMutation.mutate(
        {
          ...body,
          region: region.trim() || undefined
        },
        {
          onSuccess: () => closeForm(),
          onError: onErr
        }
      );
    }
  }

  const columns: DataTableColumn<SchoolPublic>[] = [
    { id: "name", label: dict.field.name, value: (school) => school.name },
    {
      id: "actions",
      label: dict.table.actions,
      value: (school) => `${school.name} ${dict.table.actions}`,
      hideable: false,
      sortable: false,
      cell: (school) => (
        <RowActions>
          <ActionButton action="edit" disabled={formOpen} label={dict.action.edit} onClick={() => openEdit(school)} row />
        </RowActions>
      )
    },
    { id: "locality", label: dict.field.locality, value: (school) => school.locality ?? "" },
    { id: "province", label: dict.field.province, value: (school) => school.province ?? "" }
  ];
  const provinces = [...new Set(rows.map((school) => school.province).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b));

  return (
    <main
      className={repartoShellClass}
      data-reparto-route="schools"
      data-reparto-group="setup"
    >
      <section className={repartoPanelClass} data-reparto-panel="schools">
        <h2 className="sr-only">{dict.entity.school.plural}</h2>
        <DataTable
          addButton={
            <ActionButton action="create" disabled={formOpen} label={dict.action.create} onClick={openCreate} />
          }
          columns={columns}
          data={rows}
          emptyLabel={dict.table.noResults}
          filter={{ label: dict.field.province, options: provinces, value: (school) => school.province ?? "" }}
          labels={dataTableLabels(dict.table, dict.table.searchSchools)}
          rowAttributes={(school) => ({ "data-school-id": school.id })}
          rowKey={(school) => school.id}
          rowName="school"
          searchFields={[
            (school) => school.name,
            (school) => school.locality ?? "",
            (school) => school.province ?? ""
          ]}
          tableName="schools"
        />
        <QueryState
          dict={dict}
          error={query.error}
          isError={query.isError}
          isLoading={query.isLoading}
          label={dict.entity.school.plural}
        />
        {formOpen ? (
          <EntityDialogShell
            description={dict.entity.school.plural}
            dialogId={editing ? "school-edit" : "school-create"}
            onClose={closeForm}
            title={`${editing ? dict.action.edit : dict.action.create} ${dict.entity.school.singular.toLowerCase()}`}
          >
            <form
              className={repartoFieldGridClass}
              data-reparto-form="school"
              data-reparto-mode={editing ? "edit" : "create"}
              onSubmit={handleSubmit}
            >
              <label className={repartoFieldLabelClass}>
                {dict.field.name}
                <input
                  aria-invalid={
                    findFieldError(mapped, "name") ? true : undefined
                  }
                  aria-describedby={
                    findFieldError(mapped, "name") ? "school-name-error" : undefined
                  }
                  className={repartoInputClass}
                  data-reparto-field="name"
                  id="school-name"
                  maxLength={100}
                  onChange={(e: InputChangeEvent) => setName(e.target.value)}
                  value={name}
                />
                <RepartoFieldError field="name" id="school-name-error" mapped={mapped} />
              </label>
              <label className={repartoFieldLabelClass}>
                {dict.field.locality}
                <input
                  className={repartoInputClass}
                  data-reparto-field="locality"
                  maxLength={100}
                  onChange={(e: InputChangeEvent) => setLocality(e.target.value)}
                  value={locality}
                />
              </label>
              <label className={repartoFieldLabelClass}>
                {dict.field.province}
                <input
                  className={repartoInputClass}
                  data-reparto-field="province"
                  maxLength={100}
                  onChange={(e: InputChangeEvent) => setProvince(e.target.value)}
                  value={province}
                />
              </label>
              <label className={repartoFieldLabelClass}>
                {dict.field.region}
                <input
                  className={repartoInputClass}
                  data-reparto-field="region"
                  maxLength={200}
                  onChange={(e: InputChangeEvent) => setRegion(e.target.value)}
                  value={region}
                />
              </label>
              <label className={repartoFieldLabelClass}>
                {dict.field.address}
                <input
                  className={repartoInputClass}
                  data-reparto-field="address"
                  maxLength={300}
                  onChange={(e: InputChangeEvent) => setAddress(e.target.value)}
                  value={address}
                />
              </label>
              <label className={repartoFieldLabelClass}>
                {dict.field.notes}
                <textarea
                  className={repartoInputClass}
                  data-reparto-field="notes"
                  maxLength={2000}
                  onChange={(e: InputChangeEvent) => setNotes(e.target.value)}
                  value={notes}
                />
              </label>
              <RepartoFormError mapped={mapped} />
              <RowActions>
                <ActionButton action="save" disabled={!canSave} label={dict.action.save} type="submit" />
                <ActionButton action="cancel" label={dict.action.cancel} onClick={closeForm} />
              </RowActions>
            </form>
          </EntityDialogShell>
        ) : null}
      </section>
    </main>
  );
}

export function RepartoAcademicYearsView({
  config,
  locale
}: {
  config?: ViewConfig;
  locale?: RepartoLocale;
}) {
  return (
    <Shell config={config}>
      <RepartoAcademicYearsContent locale={locale} />
    </Shell>
  );
}

function RepartoAcademicYearsContent({ locale }: { locale?: RepartoLocale }) {
  const dict = getRepartoDictionary(locale ?? normalizeRepartoLocale());
  const query = useRepartoAcademicYears({ limit: 100 });
  const schoolsQuery = useRepartoSchools({ limit: 100 });
  const schools = schoolsQuery.data?.data ?? [];
  const rows = query.data?.data ?? [];
  const createMutation = useCreateRepartoAcademicYear();
  const updateMutation = useUpdateRepartoAcademicYear();
  const archiveMutation = useArchiveRepartoAcademicYear();

  const [editing, setEditing] = useState<AcademicYearPublic | null>(null);
  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [mapped, setMapped] = useState<RepartoMappedError>(
    EMPTY_REPARTO_MAPPED_ERROR
  );
  const [archiveMapped, setArchiveMapped] = useState<RepartoMappedError>(
    EMPTY_REPARTO_MAPPED_ERROR
  );

  const formOpen = creating || Boolean(editing);

  function openCreate() {
    setEditing(null);
    setCreating(true);
    setLabel("");
    setStartDate("");
    setEndDate("");
    setSchoolId(schools[0]?.id ?? "");
    setMapped(EMPTY_REPARTO_MAPPED_ERROR);
  }

  function openEdit(year: AcademicYearPublic) {
    setCreating(false);
    setEditing(year);
    setLabel(year.label);
    setStartDate(year.start_date);
    setEndDate(year.end_date);
    setSchoolId(year.school_id ?? schools[0]?.id ?? "");
    setMapped(EMPTY_REPARTO_MAPPED_ERROR);
  }

  function closeForm() {
    setCreating(false);
    setEditing(null);
    setMapped(EMPTY_REPARTO_MAPPED_ERROR);
  }

  const datesValid =
    /^\d{4}-\d{2}-\d{2}$/.test(startDate) &&
    /^\d{4}-\d{2}-\d{2}$/.test(endDate) &&
    startDate <= endDate;

  const canSave =
    label.trim().length > 0 &&
    schoolId.trim().length > 0 &&
    datesValid &&
    !createMutation.isPending &&
    !updateMutation.isPending;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSave) return;
    setMapped(EMPTY_REPARTO_MAPPED_ERROR);
    const body = {
      label: label.trim(),
      start_date: startDate,
      end_date: endDate,
      school_id: schoolId
    };
    const onErr = (err: unknown) => setMapped(mapRepartoError(err));
    if (editing) {
      updateMutation.mutate(
        { yearId: editing.id, body },
        { onSuccess: () => closeForm(), onError: onErr }
      );
    } else {
      createMutation.mutate(body, {
        onSuccess: () => closeForm(),
        onError: onErr
      });
    }
  }

  const createDisabledReason =
    schools.length === 0
      ? formatRepartoMessage(
          dict.disabled.missingPrereq,
          { prereq: dict.entity.school.singular.toLowerCase() }
        )
      : null;
  const schoolName = (id: string | null) =>
    id ? schools.find((school) => school.id === id)?.name ?? "-" : "-";

  function handleArchive(year: AcademicYearPublic) {
    setArchiveMapped(EMPTY_REPARTO_MAPPED_ERROR);
    archiveMutation.mutate(year.id, {
      onError: (err: unknown) => setArchiveMapped(mapRepartoError(err))
    });
  }

  const columns: DataTableColumn<AcademicYearPublic>[] = [
    { id: "label", label: dict.field.label, value: (year) => year.label },
    {
      id: "actions",
      label: dict.table.actions,
      value: (year) => `${year.label} ${dict.table.actions}`,
      hideable: false,
      sortable: false,
      cell: (year) => {
        const isArchived = year.status === "archived";
        const archiveReason = isArchived
          ? dict.entity.academicYear.status.archived
          : null;
        return (
          <RowActions>
            <ActionButton action="edit" disabled={formOpen} label={dict.action.edit} onClick={() => openEdit(year)} row />
            <ActionButton
              action="archive"
              disabled={archiveMutation.isPending || isArchived}
              disabledReason={archiveReason}
              label={dict.action.archive}
              onClick={() => handleArchive(year)}
              row
            />
            <RepartoDisabledReason reason={archiveReason} />
          </RowActions>
        );
      }
    },
    { id: "status", label: dict.field.status, value: (year) => dict.entity.academicYear.status[year.status] },
    { id: "school", label: dict.field.school, value: (year) => schoolName(year.school_id) },
    { id: "dates", label: dict.field.startDate, value: (year) => `${year.start_date} → ${year.end_date}` }
  ];
  const statuses = [...new Set(rows.map((year) => dict.entity.academicYear.status[year.status]))].sort((a, b) => a.localeCompare(b));

  return (
    <main
      className={repartoShellClass}
      data-reparto-route="academic-years"
      data-reparto-group="setup"
    >
      <section className={repartoPanelClass} data-reparto-panel="academic-years">
        <h2 className="sr-only">{dict.entity.academicYear.plural}</h2>
        {archiveMapped.formError ? (
          <p
            className="text-sm text-destructive"
            data-reparto-slot="archive-error"
            data-reparto-error-key={archiveMapped.formError.errorKey ?? "server"}
          >
            {archiveMapped.formError.message}
          </p>
        ) : null}
        <DataTable
          addButton={
            <>
              <ActionButton
                action="create"
                disabled={formOpen || Boolean(createDisabledReason)}
                disabledReason={createDisabledReason}
                label={dict.action.create}
                onClick={openCreate}
              />
              <RepartoDisabledReason reason={createDisabledReason} />
            </>
          }
          columns={columns}
          data={rows}
          emptyLabel={dict.table.noResults}
          filter={{ label: dict.field.status, options: statuses, value: (year) => dict.entity.academicYear.status[year.status] }}
          labels={dataTableLabels(dict.table, dict.table.searchAcademicYears)}
          rowAttributes={(year) => ({
            "data-year-id": year.id,
            "data-year-status": year.status
          })}
          rowKey={(year) => year.id}
          rowName="academic-year"
          searchFields={[
            (year) => year.label,
            (year) => schoolName(year.school_id)
          ]}
          tableName="academic-years"
        />
        <QueryState
          dict={dict}
          error={query.error}
          isError={query.isError}
          isLoading={query.isLoading}
          label={dict.entity.academicYear.plural}
        />
        {formOpen ? (
          <EntityDialogShell
            description={dict.entity.academicYear.plural}
            dialogId={editing ? "academic-year-edit" : "academic-year-create"}
            onClose={closeForm}
            title={`${editing ? dict.action.edit : dict.action.create} ${dict.entity.academicYear.singular.toLowerCase()}`}
          >
            <form
              className={repartoFieldGridClass}
              data-reparto-form="academic-year"
              data-reparto-mode={editing ? "edit" : "create"}
              onSubmit={handleSubmit}
            >
              <label className={repartoFieldLabelClass}>
                {dict.field.label}
                <input
                  className={repartoInputClass}
                  data-reparto-field="label"
                  id="year-label"
                  maxLength={20}
                  onChange={(e: InputChangeEvent) => setLabel(e.target.value)}
                  value={label}
                />
                <RepartoFieldError field="label" id="year-label-error" mapped={mapped} />
              </label>
              <label className={repartoFieldLabelClass}>
                {dict.field.school}
                <select
                  className={repartoInputClass}
                  data-reparto-field="school"
                  onChange={(e: InputChangeEvent) => setSchoolId(e.target.value)}
                  value={schoolId}
                >
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
                <RepartoFieldError field="school" mapped={mapped} />
              </label>
              <label className={repartoFieldLabelClass}>
                {dict.field.startDate}
                <input
                  className={repartoInputClass}
                  data-reparto-field="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e: InputChangeEvent) => setStartDate(e.target.value)}
                />
                <RepartoFieldError field="startDate" mapped={mapped} />
              </label>
              <label className={repartoFieldLabelClass}>
                {dict.field.endDate}
                <input
                  className={repartoInputClass}
                  data-reparto-field="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e: InputChangeEvent) => setEndDate(e.target.value)}
                />
                <RepartoFieldError field="endDate" mapped={mapped} />
              </label>
              <RepartoFormError mapped={mapped} />
              <RowActions>
                <ActionButton action="save" disabled={!canSave} label={dict.action.save} type="submit" />
                <ActionButton action="cancel" label={dict.action.cancel} onClick={closeForm} />
              </RowActions>
            </form>
          </EntityDialogShell>
        ) : null}
      </section>
    </main>
  );
}

export function RepartoDepartmentsView({
  config,
  locale
}: {
  config?: ViewConfig;
  locale?: RepartoLocale;
}) {
  return (
    <Shell config={config}>
      <RepartoDepartmentsContent locale={locale} />
    </Shell>
  );
}

function RepartoDepartmentsContent({ locale }: { locale?: RepartoLocale }) {
  const dict = getRepartoDictionary(locale ?? normalizeRepartoLocale());
  const schoolsQuery = useRepartoSchools({ limit: 100 });
  const query = useRepartoDepartments({ limit: 100 });
  const rows = query.data?.data ?? [];
  const schools = schoolsQuery.data?.data ?? [];
  const createMutation = useCreateRepartoDepartment();
  const updateMutation = useUpdateRepartoDepartment();

  const [editing, setEditing] = useState<DepartmentPublic | null>(null);
  const [creating, setCreating] = useState(false);
  const [schoolId, setSchoolId] = useState("");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [mapped, setMapped] = useState<RepartoMappedError>(
    EMPTY_REPARTO_MAPPED_ERROR
  );

  const formOpen = creating || Boolean(editing);

  function openCreate() {
    setEditing(null);
    setCreating(true);
    setSchoolId(schools[0]?.id ?? "");
    setName("");
    setNotes("");
    setMapped(EMPTY_REPARTO_MAPPED_ERROR);
  }

  function openEdit(department: DepartmentPublic) {
    setCreating(false);
    setEditing(department);
    setSchoolId(department.school_id);
    setName(department.name);
    setNotes(department.notes ?? "");
    setMapped(EMPTY_REPARTO_MAPPED_ERROR);
  }

  function closeForm() {
    setCreating(false);
    setEditing(null);
    setMapped(EMPTY_REPARTO_MAPPED_ERROR);
  }

  const schoolsMissing = schools.length === 0;
  const createReason = schoolsMissing
    ? dict.disabled.missingPrereq.replace(
        "{prereq}",
        dict.entity.school.singular.toLowerCase()
      )
    : null;
  const canSave =
    schoolId.trim() !== "" &&
    name.trim().length > 0 &&
    !createMutation.isPending &&
    !updateMutation.isPending;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSave) return;
    setMapped(EMPTY_REPARTO_MAPPED_ERROR);
    const body = {
      school_id: schoolId,
      name: name.trim(),
      notes: notes.trim() || null
    };
    const onErr = (err: unknown) => setMapped(mapRepartoError(err));
    if (editing) {
      updateMutation.mutate(
        {
          departmentId: editing.id,
          body: { name: body.name, notes: body.notes }
        },
        { onSuccess: () => closeForm(), onError: onErr }
      );
    } else {
      createMutation.mutate(body, {
        onSuccess: () => closeForm(),
        onError: onErr
      });
    }
  }

  const schoolName = (id: string) =>
    schools.find((school) => school.id === id)?.name ?? "—";

  const columns: DataTableColumn<DepartmentPublic>[] = [
    { id: "name", label: dict.field.name, value: (department) => department.name },
    {
      id: "actions",
      label: dict.table.actions,
      value: (department) => `${department.name} ${dict.table.actions}`,
      hideable: false,
      sortable: false,
      cell: (department) => (
        <RowActions>
          <ActionButton action="edit" disabled={formOpen} label={dict.action.edit} onClick={() => openEdit(department)} row />
        </RowActions>
      )
    },
    { id: "school", label: dict.field.school, value: (department) => schoolName(department.school_id) }
  ];
  const schoolOptions = [...new Set(rows.map((department) => schoolName(department.school_id)))].sort((a, b) => a.localeCompare(b));

  return (
    <main
      className={repartoShellClass}
      data-reparto-route="departments"
      data-reparto-group="setup"
    >
      <section className={repartoPanelClass} data-reparto-panel="departments">
        <h2 className="sr-only">{dict.entity.department.plural}</h2>
        <DataTable
          addButton={
            <>
              <ActionButton
                action="create"
                disabled={formOpen || schoolsMissing}
                disabledReason={createReason}
                label={dict.action.create}
                onClick={openCreate}
              />
              <RepartoDisabledReason reason={createReason} />
            </>
          }
          columns={columns}
          data={rows}
          emptyLabel={dict.table.noResults}
          filter={{ label: dict.field.school, options: schoolOptions, value: (department) => schoolName(department.school_id) }}
          labels={dataTableLabels(dict.table, dict.table.searchDepartments)}
          rowAttributes={(department) => ({ "data-department-id": department.id })}
          rowKey={(department) => department.id}
          rowName="department"
          searchFields={[
            (department) => department.name,
            (department) => schoolName(department.school_id)
          ]}
          tableName="departments"
        />
        <QueryState
          dict={dict}
          error={query.error}
          isError={query.isError}
          isLoading={query.isLoading}
          label={dict.entity.department.plural}
        />
        {formOpen ? (
          <EntityDialogShell
            description={dict.entity.department.plural}
            dialogId={editing ? "department-edit" : "department-create"}
            onClose={closeForm}
            title={`${editing ? dict.action.edit : dict.action.create} ${dict.entity.department.singular.toLowerCase()}`}
          >
            <form
              className={repartoFieldGridClass}
              data-reparto-form="department"
              data-reparto-mode={editing ? "edit" : "create"}
              onSubmit={handleSubmit}
            >
              <label className={repartoFieldLabelClass}>
                {dict.field.school}
                <select
                  className={repartoInputClass}
                  data-reparto-field="school"
                  disabled={Boolean(editing)}
                  onChange={(e: InputChangeEvent) => setSchoolId(e.target.value)}
                  value={schoolId}
                >
                  <option value="">{dict.field.school}</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
                <RepartoFieldError field="school" mapped={mapped} />
              </label>
              <label className={repartoFieldLabelClass}>
                {dict.field.name}
                <input
                  className={repartoInputClass}
                  data-reparto-field="name"
                  id="department-name"
                  maxLength={150}
                  onChange={(e: InputChangeEvent) => setName(e.target.value)}
                  value={name}
                />
                <RepartoFieldError field="name" id="department-name-error" mapped={mapped} />
              </label>
              <label className={repartoFieldLabelClass}>
                {dict.field.notes}
                <textarea
                  className={repartoInputClass}
                  data-reparto-field="notes"
                  maxLength={2000}
                  onChange={(e: InputChangeEvent) => setNotes(e.target.value)}
                  value={notes}
                />
              </label>
              <RepartoFormError mapped={mapped} />
              <RowActions>
                <ActionButton action="save" disabled={!canSave} label={dict.action.save} type="submit" />
                <ActionButton action="cancel" label={dict.action.cancel} onClick={closeForm} />
              </RowActions>
            </form>
          </EntityDialogShell>
        ) : null}
      </section>
    </main>
  );
}

export function RepartoTeacherRosterView({
  config,
  locale
}: {
  config?: ViewConfig;
  locale?: RepartoLocale;
}) {
  return (
    <Shell config={config}>
      <RepartoTeacherRosterContent locale={locale} />
    </Shell>
  );
}

function RepartoTeacherRosterContent({ locale }: { locale?: RepartoLocale }) {
  const dict = getRepartoDictionary(locale ?? normalizeRepartoLocale());
  const query = useRepartoTeacherProfiles({ limit: 100 });
  const rows = query.data?.data ?? [];
  const createMutation = useCreateRepartoTeacherProfile();
  const updateMutation = useUpdateRepartoTeacherProfile();
  const deleteMutation = useDeleteRepartoTeacherProfile();
  const linkMutation = useLinkRepartoTeacherProfileUser();

  const [editing, setEditing] = useState<TeacherProfilePublic | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<TeacherProfilePublic | null>(null);
  const [linkTarget, setLinkTarget] = useState<TeacherProfilePublic | null>(null);
  const [linkUserId, setLinkUserId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [active, setActive] = useState(true);
  const [notes, setNotes] = useState("");
  const [mapped, setMapped] = useState<RepartoMappedError>(
    EMPTY_REPARTO_MAPPED_ERROR
  );
  const [linkMapped, setLinkMapped] = useState<RepartoMappedError>(
    EMPTY_REPARTO_MAPPED_ERROR
  );
  const [deleteMapped, setDeleteMapped] = useState<RepartoMappedError>(
    EMPTY_REPARTO_MAPPED_ERROR
  );

  const formOpen = creating || Boolean(editing);

  function openCreate() {
    setEditing(null);
    setCreating(true);
    setDisplayName("");
    setActive(true);
    setNotes("");
    setMapped(EMPTY_REPARTO_MAPPED_ERROR);
  }

  function openEdit(profile: TeacherProfilePublic) {
    setCreating(false);
    setEditing(profile);
    setDisplayName(profile.display_name);
    setActive(profile.active);
    setNotes(profile.notes ?? "");
    setMapped(EMPTY_REPARTO_MAPPED_ERROR);
  }

  function closeForm() {
    setCreating(false);
    setEditing(null);
    setMapped(EMPTY_REPARTO_MAPPED_ERROR);
  }

  const canSave =
    displayName.trim().length > 0 &&
    !createMutation.isPending &&
    !updateMutation.isPending;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSave) return;
    setMapped(EMPTY_REPARTO_MAPPED_ERROR);
    const body = {
      display_name: displayName.trim(),
      active,
      notes: notes.trim() || null
    };
    const onErr = (err: unknown) => setMapped(mapRepartoError(err));
    if (editing) {
      updateMutation.mutate(
        { profileId: editing.id, body },
        { onSuccess: () => closeForm(), onError: onErr }
      );
    } else {
      createMutation.mutate(body, {
        onSuccess: () => closeForm(),
        onError: onErr
      });
    }
  }

  function handleDelete() {
    if (!confirmDelete) return;
    setDeleteMapped(EMPTY_REPARTO_MAPPED_ERROR);
    deleteMutation.mutate(confirmDelete.id, {
      onSuccess: () => setConfirmDelete(null),
      onError: (err: unknown) => setDeleteMapped(mapRepartoError(err))
    });
  }

  function handleLink(event: FormEvent) {
    event.preventDefault();
    if (!linkTarget || linkUserId.trim() === "") return;
    setLinkMapped(EMPTY_REPARTO_MAPPED_ERROR);
    linkMutation.mutate(
      { profileId: linkTarget.id, body: { user_id: linkUserId.trim() } },
      {
        onSuccess: () => {
          setLinkTarget(null);
          setLinkUserId("");
        },
        onError: (err: unknown) => setLinkMapped(mapRepartoError(err))
      }
    );
  }

  function closeLink() {
    setLinkTarget(null);
    setLinkUserId("");
    setLinkMapped(EMPTY_REPARTO_MAPPED_ERROR);
  }

  const linkReason =
    linkUserId.trim() === "" ? dict.error.required : null;
  const anyFormOpen = formOpen || Boolean(linkTarget) || Boolean(confirmDelete);

  const columns: DataTableColumn<TeacherProfilePublic>[] = [
    { id: "display_name", label: dict.field.displayName, value: (profile) => profile.display_name },
    {
      id: "actions",
      label: dict.table.actions,
      value: (profile) => `${profile.display_name} ${dict.table.actions}`,
      hideable: false,
      sortable: false,
      cell: (profile) => (
        <RowActions>
          <ActionButton action="edit" disabled={anyFormOpen} label={dict.action.edit} onClick={() => openEdit(profile)} row />
          <ActionButton
            action="link-user"
            disabled={anyFormOpen}
            label={dict.action.linkUser}
            onClick={() => {
              setLinkTarget(profile);
              setLinkUserId(profile.user_id ?? "");
            }}
            row
          />
          <ActionButton
            action="delete"
            disabled={anyFormOpen || deleteMutation.isPending}
            label={dict.action.delete}
            onClick={() => setConfirmDelete(profile)}
            row
          />
        </RowActions>
      )
    },
    { id: "active", label: dict.field.active, value: (profile) => (profile.active ? dict.field.active : "—") }
  ];
  const activeOptions = [...new Set(rows.map((profile) => (profile.active ? dict.field.active : "—")))].sort((a, b) => a.localeCompare(b));

  return (
    <main
      className={repartoShellClass}
      data-reparto-route="teacher-roster"
      data-reparto-group="setup"
    >
      <section className={repartoPanelClass} data-reparto-panel="teacher-roster">
        <h2 className="sr-only">{dict.entity.teacherRoster.plural}</h2>
        <DataTable
          addButton={
            <ActionButton action="create" disabled={formOpen} label={dict.action.create} onClick={openCreate} />
          }
          columns={columns}
          data={rows}
          emptyLabel={dict.table.noResults}
          filter={{ label: dict.field.active, options: activeOptions, value: (profile) => (profile.active ? dict.field.active : "—") }}
          labels={dataTableLabels(dict.table, dict.table.searchTeacherRoster)}
          rowAttributes={(profile) => ({
            "data-teacher-profile-id": profile.id,
            "data-teacher-active": profile.active ? "true" : "false"
          })}
          rowKey={(profile) => profile.id}
          rowName="teacher-roster"
          searchFields={[(profile) => profile.display_name]}
          tableName="teacher-roster"
        />
        <QueryState
          dict={dict}
          error={query.error}
          isError={query.isError}
          isLoading={query.isLoading}
          label={dict.entity.teacherRoster.plural}
        />
        {formOpen ? (
          <EntityDialogShell
            description={dict.entity.teacherRoster.plural}
            dialogId={editing ? "teacher-roster-edit" : "teacher-roster-create"}
            onClose={closeForm}
            title={`${editing ? dict.action.edit : dict.action.create} ${dict.entity.teacherRoster.singular.toLowerCase()}`}
          >
            <form
              className={repartoFieldGridClass}
              data-reparto-form="teacher-roster"
              data-reparto-mode={editing ? "edit" : "create"}
              onSubmit={handleSubmit}
            >
              <label className={repartoFieldLabelClass}>
                {dict.field.displayName}
                <input
                  className={repartoInputClass}
                  data-reparto-field="display-name"
                  id="teacher-display-name"
                  maxLength={150}
                  onChange={(e: InputChangeEvent) => setDisplayName(e.target.value)}
                  value={displayName}
                />
                <RepartoFieldError
                  field="displayName"
                  id="teacher-display-name-error"
                  mapped={mapped}
                />
              </label>
              <label className={repartoFieldLabelClass}>
                <span>{dict.field.active}</span>
                <input
                  checked={active}
                  data-reparto-field="active"
                  onChange={(e: CheckboxChangeEvent) => setActive(e.target.checked)}
                  type="checkbox"
                />
              </label>
              <label className={repartoFieldLabelClass}>
                {dict.field.notes}
                <textarea
                  className={repartoInputClass}
                  data-reparto-field="notes"
                  maxLength={2000}
                  onChange={(e: InputChangeEvent) => setNotes(e.target.value)}
                  value={notes}
                />
              </label>
              <RepartoFormError mapped={mapped} />
              <RowActions>
                <ActionButton action="save" disabled={!canSave} label={dict.action.save} type="submit" />
                <ActionButton action="cancel" label={dict.action.cancel} onClick={closeForm} />
              </RowActions>
            </form>
          </EntityDialogShell>
        ) : null}
        {linkTarget ? (
          <EntityDialogShell
            description={linkTarget.display_name}
            dialogId="teacher-link-user"
            onClose={closeLink}
            title={dict.action.linkUser}
          >
            <form
              className={repartoFieldGridClass}
              data-reparto-form="teacher-link-user"
              onSubmit={handleLink}
            >
              <label className={repartoFieldLabelClass}>
                {dict.field.linkedUser}
                <input
                  aria-invalid={linkReason ? true : undefined}
                  className={repartoInputClass}
                  data-reparto-field="user-id"
                  id="teacher-link-user"
                  onChange={(e: InputChangeEvent) => setLinkUserId(e.target.value)}
                  placeholder={dict.field.linkedUser}
                  value={linkUserId}
                />
                <RepartoFieldError
                  field="userId"
                  id="teacher-link-user-error"
                  mapped={linkMapped}
                />
              </label>
              <RepartoFormError mapped={linkMapped} />
              <RowActions>
                <ActionButton
                  action="link-user"
                  disabled={linkUserId.trim() === "" || linkMutation.isPending}
                  disabledReason={linkReason}
                  label={dict.action.linkUser}
                  type="submit"
                />
                <RepartoDisabledReason reason={linkReason} />
                <ActionButton action="cancel" label={dict.action.cancel} onClick={closeLink} />
              </RowActions>
            </form>
          </EntityDialogShell>
        ) : null}
        {confirmDelete ? (
          <EntityDeleteDialog
            title={formatRepartoMessage(dict.confirm.delete.title, {
              entity: dict.entity.teacherRoster.singular.toLowerCase()
            })}
            body={formatRepartoMessage(dict.confirm.delete.body, {
              name: confirmDelete.display_name
            })}
            proceedLabel={dict.confirm.delete.proceed}
            cancelLabel={dict.confirm.cancel}
            isPending={deleteMutation.isPending}
            mapped={deleteMapped}
            onConfirm={handleDelete}
            onClose={() => {
              setConfirmDelete(null);
              setDeleteMapped(EMPTY_REPARTO_MAPPED_ERROR);
            }}
          />
        ) : null}
      </section>
    </main>
  );
}
