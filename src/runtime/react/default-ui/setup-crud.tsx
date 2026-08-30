import { useState } from "react";
import { RepartoProvider } from "../RepartoProvider.js";
import { RepartoQueryProvider } from "../RepartoQueryProvider.js";
import { REPARTO_ADMIN_MINIMUM_ROLE } from "../../authAdapter.js";
import {
  useRepartoCanAct,
  useRepartoCurrentUser,
  useRepartoMinimumRole
} from "../useRepartoRole.js";
import {
  useArchiveRepartoAcademicYear,
  useCreateRepartoAcademicYear,
  useCreateRepartoDepartment,
  useCreateRepartoSchool,
  useCreateRepartoTeacherProfile,
  useDeleteRepartoTeacherProfile,
  useIssueRepartoTeacherProfileClaimCode,
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
import { RepartoRouteGuard } from "./route-guard.js";
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
  TeacherProfileClaimCode,
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
      <RepartoRouteGuard locale={locale} route="schools">
        <RepartoSchoolsContent locale={locale} />
      </RepartoRouteGuard>
    </Shell>
  );
}

function RepartoSchoolsContent({ locale }: { locale?: RepartoLocale }) {
  const dict = getRepartoDictionary(locale ?? normalizeRepartoLocale());
  // `School` create/update is platform setup, so `ADMIN` and above (§21.3).
  const canAct = useRepartoCanAct("schools");
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
    ...(canAct
      ? [{
          id: "actions",
          label: dict.table.actions,
          value: (school: SchoolPublic) => `${school.name} ${dict.table.actions}`,
          hideable: false,
          sortable: false,
          cell: (school: SchoolPublic) => (
            <RowActions>
              <ActionButton action="edit" disabled={formOpen} label={dict.action.edit} onClick={() => openEdit(school)} row />
            </RowActions>
          )
        } satisfies DataTableColumn<SchoolPublic>]
      : []),
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
      {canAct ? (
        <div className="flex justify-end gap-2 pb-4" data-reparto-actions="schools">
          <ActionButton action="create" disabled={formOpen} label={dict.action.create} onClick={openCreate} />
        </div>
      ) : null}
      <section className={repartoPanelClass} data-reparto-panel="schools">
        <h2 className="sr-only">{dict.entity.school.plural}</h2>
        <DataTable
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
      <RepartoRouteGuard locale={locale} route="academicYears">
        <RepartoAcademicYearsContent locale={locale} />
      </RepartoRouteGuard>
    </Shell>
  );
}

function RepartoAcademicYearsContent({ locale }: { locale?: RepartoLocale }) {
  const dict = getRepartoDictionary(locale ?? normalizeRepartoLocale());
  // `AcademicYear` create/update/archive is platform setup (§21.3).
  const canAct = useRepartoCanAct("academicYears");
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
      value: (year: AcademicYearPublic) => `${year.label} ${dict.table.actions}`,
      hideable: false,
      sortable: false,
      cell: (year: AcademicYearPublic) => {
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
      {canAct ? (
        <div className="flex justify-end gap-2 pb-4" data-reparto-actions="academic-years">
          <ActionButton
            action="create"
            disabled={formOpen || Boolean(createDisabledReason)}
            disabledReason={createDisabledReason}
            label={dict.action.create}
            onClick={openCreate}
          />
          <RepartoDisabledReason reason={createDisabledReason} />
        </div>
      ) : null}
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
      <RepartoRouteGuard locale={locale} route="departments">
        <RepartoDepartmentsContent locale={locale} />
      </RepartoRouteGuard>
    </Shell>
  );
}

function RepartoDepartmentsContent({ locale }: { locale?: RepartoLocale }) {
  const dict = getRepartoDictionary(locale ?? normalizeRepartoLocale());
  // `Department` create/update — including naming a `department_head_user_id`,
  // which authorizes nothing either way (§21.2) — is platform setup.
  const canAct = useRepartoCanAct("departments");
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
    ...(canAct
      ? [{
          id: "actions",
          label: dict.table.actions,
          value: (department: DepartmentPublic) => `${department.name} ${dict.table.actions}`,
          hideable: false,
          sortable: false,
          cell: (department: DepartmentPublic) => (
            <RowActions>
              <ActionButton action="edit" disabled={formOpen} label={dict.action.edit} onClick={() => openEdit(department)} row />
            </RowActions>
          )
        } satisfies DataTableColumn<DepartmentPublic>]
      : []),
    { id: "school", label: dict.field.school, value: (department) => schoolName(department.school_id) }
  ];
  const schoolOptions = [...new Set(rows.map((department) => schoolName(department.school_id)))].sort((a, b) => a.localeCompare(b));

  return (
    <main
      className={repartoShellClass}
      data-reparto-route="departments"
      data-reparto-group="setup"
    >
      {canAct ? (
        <div className="flex justify-end gap-2 pb-4" data-reparto-actions="departments">
          <ActionButton
            action="create"
            disabled={formOpen || schoolsMissing}
            disabledReason={createReason}
            label={dict.action.create}
            onClick={openCreate}
          />
          <RepartoDisabledReason reason={createReason} />
        </div>
      ) : null}
      <section className={repartoPanelClass} data-reparto-panel="departments">
        <h2 className="sr-only">{dict.entity.department.plural}</h2>
        <DataTable
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
      <RepartoRouteGuard locale={locale} route="teacherRoster">
        <RepartoTeacherRosterContent locale={locale} />
      </RepartoRouteGuard>
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
  const unlinkMutation = useUpdateRepartoTeacherProfile();
  const claimCodeMutation = useIssueRepartoTeacherProfileClaimCode();

  const [editing, setEditing] = useState<TeacherProfilePublic | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<TeacherProfilePublic | null>(null);
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
  // Held in state because the service will not serve it twice: the code is
  // stored hashed, so this response is the only readable copy that will ever
  // exist. Losing it costs a reissue, not a lookup.
  const [issued, setIssued] = useState<TeacherProfileClaimCode | null>(null);
  const [copied, setCopied] = useState(false);

  // The roster is the one setup route with an own-record action: a `WRITER` may
  // update the profile whose linked user is them and nothing else (§21.3), while
  // creating, linking and deleting a profile stay `ADMIN`. Both the identity and
  // the role come from the one session read (`RBAC-06`), so the ownership test
  // below is the same `user.id` the link action already used.
  const { user } = useRepartoCurrentUser();
  const canAct = useRepartoCanAct("teacherRoster");
  const isAdmin = useRepartoMinimumRole(REPARTO_ADMIN_MINIMUM_ROLE) === true;
  const currentUserId = user?.id ?? null;
  const ownsProfile = (profile: TeacherProfilePublic) =>
    Boolean(currentUserId) && profile.user_id === currentUserId;

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

  function handleLinkToMe(profile: TeacherProfilePublic) {
    if (!currentUserId || profile.user_id === currentUserId) return;
    setLinkMapped(EMPTY_REPARTO_MAPPED_ERROR);
    const onErr = (err: unknown) => setLinkMapped(mapRepartoError(err));
    const linkToProfile = () =>
      linkMutation.mutate(
        { profileId: profile.id, body: { user_id: currentUserId } },
        { onError: onErr }
      );
    const previouslyLinked = rows.find(
      (row) => row.user_id === currentUserId && row.id !== profile.id
    );
    if (previouslyLinked) {
      unlinkMutation.mutate(
        { profileId: previouslyLinked.id, body: { user_id: null } },
        { onSuccess: linkToProfile, onError: onErr }
      );
    } else {
      linkToProfile();
    }
  }

  /**
   * Mint the code that lets *this teacher* bind the profile to their account.
   *
   * The replacement for the old *Link user*, which linked `currentUserId` — so
   * a head pressing it on a colleague's row linked **themselves**. The backend
   * was never the problem: `link-user` accepts any `user_id`. What was missing
   * was a way for the head to learn a colleague's id, and per `C1` that
   * directory belongs to the identity service and stays superuser-only. The
   * teacher's own token already carries their id, so nobody needs to look
   * anyone up — the head hands over a code instead.
   */
  function handleIssueClaimCode(profile: TeacherProfilePublic) {
    setLinkMapped(EMPTY_REPARTO_MAPPED_ERROR);
    setCopied(false);
    claimCodeMutation.mutate(profile.id, {
      onSuccess: (code) => setIssued(code),
      onError: (err: unknown) => setLinkMapped(mapRepartoError(err))
    });
  }

  function handleCopyCode() {
    if (!issued) return;
    // Not every host exposes an async clipboard (an insecure origin, or a
    // browser that has not granted it). The code is on screen and selectable
    // either way, so a missing clipboard is a missing convenience, not a dead
    // end — and never an unhandled rejection.
    void Promise.resolve(
      globalThis.navigator?.clipboard?.writeText?.(issued.claim_code)
    )
      .then(() => setCopied(true))
      .catch(() => setCopied(false));
  }

  function handleUnlink(profile: TeacherProfilePublic) {
    setLinkMapped(EMPTY_REPARTO_MAPPED_ERROR);
    unlinkMutation.mutate(
      { profileId: profile.id, body: { user_id: null } },
      { onError: (err: unknown) => setLinkMapped(mapRepartoError(err)) }
    );
  }

  const linking =
    linkMutation.isPending ||
    unlinkMutation.isPending ||
    claimCodeMutation.isPending;
  const anyFormOpen = formOpen || Boolean(confirmDelete);

  const columns: DataTableColumn<TeacherProfilePublic>[] = [
    { id: "display_name", label: dict.field.displayName, value: (profile) => profile.display_name },
    ...(canAct
      ? [{
          id: "actions",
          label: dict.table.actions,
          value: (profile: TeacherProfilePublic) =>
            `${profile.display_name} ${dict.table.actions}`,
          hideable: false,
          sortable: false,
          cell: (profile: TeacherProfilePublic) => (
            <RowActions>
              {isAdmin || ownsProfile(profile) ? (
                <ActionButton action="edit" disabled={anyFormOpen} label={dict.action.edit} onClick={() => openEdit(profile)} row />
              ) : null}
              {/*
                Three row actions, and which one is offered follows the
                linkage rather than who is looking. A linked profile offers
                *Unlink* — including one linked to somebody else, because the
                service refuses to mint a code over a live linkage and a head
                who cannot unlink could never recover a mis-claim. An unlinked
                profile offers *Issue claim code*, the action the teacher
                needs, and keeps *Link to me* beside it under its true name:
                it links the pressing head, which is the only thing it ever
                did.
              */}
              {isAdmin ? (
                profile.user_id ? (
                  <ActionButton
                    action="unlink-user"
                    disabled={anyFormOpen || linking}
                    label={dict.action.unlinkUser}
                    onClick={() => handleUnlink(profile)}
                    row
                  />
                ) : (
                  <>
                    <ActionButton
                      action="issue-claim-code"
                      disabled={anyFormOpen || linking}
                      label={dict.action.issueClaimCode}
                      onClick={() => handleIssueClaimCode(profile)}
                      row
                    />
                    <ActionButton
                      action="link-user"
                      disabled={anyFormOpen || linking || !currentUserId}
                      label={dict.action.linkUser}
                      onClick={() => handleLinkToMe(profile)}
                      row
                    />
                  </>
                )
              ) : null}
              {isAdmin ? (
                <ActionButton
                  action="delete"
                  disabled={anyFormOpen || deleteMutation.isPending}
                  label={dict.action.delete}
                  onClick={() => setConfirmDelete(profile)}
                  row
                />
              ) : null}
            </RowActions>
          )
        } satisfies DataTableColumn<TeacherProfilePublic>]
      : []),
    { id: "active", label: dict.field.active, value: (profile) => (profile.active ? dict.field.active : "—") }
  ];
  const activeOptions = [...new Set(rows.map((profile) => (profile.active ? dict.field.active : "—")))].sort((a, b) => a.localeCompare(b));

  return (
    <main
      className={repartoShellClass}
      data-reparto-route="teacher-roster"
      data-reparto-group="setup"
    >
      {isAdmin ? (
        <div className="flex justify-end gap-2 pb-4" data-reparto-actions="teacher-roster">
          <ActionButton action="create" disabled={formOpen} label={dict.action.create} onClick={openCreate} />
        </div>
      ) : null}
      <section className={repartoPanelClass} data-reparto-panel="teacher-roster">
        <h2 className="sr-only">{dict.entity.teacherRoster.plural}</h2>
        <DataTable
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
        <RepartoFormError mapped={linkMapped} />
        {issued ? (
          <EntityDialogShell
            description={dict.entity.teacherRoster.singular}
            dialogId="teacher-roster-claim-code"
            onClose={() => setIssued(null)}
            title={formatRepartoMessage(dict.flow.claimCode.title, {
              name: issued.display_name
            })}
          >
            <div className={repartoFieldGridClass} data-reparto-panel="claim-code">
              <p className="text-sm">
                {formatRepartoMessage(dict.flow.claimCode.body, {
                  name: issued.display_name,
                  expires: new Date(issued.expires_at).toLocaleString(
                    locale ?? normalizeRepartoLocale()
                  )
                })}
              </p>
              <output
                className="font-mono text-lg tracking-widest"
                data-reparto-slot="claim-code"
              >
                {issued.claim_code}
              </output>
              {copied ? (
                <p className="text-sm" data-reparto-slot="claim-code-copied">
                  {dict.flow.claimCode.copied}
                </p>
              ) : null}
              <RowActions>
                <ActionButton
                  action="copy-claim-code"
                  label={dict.action.copyCode}
                  onClick={handleCopyCode}
                />
                <ActionButton
                  action="dismiss-claim-code"
                  label={dict.flow.claimCode.dismiss}
                  onClick={() => setIssued(null)}
                />
              </RowActions>
            </div>
          </EntityDialogShell>
        ) : null}
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
