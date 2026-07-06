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
  repartoActionRowClass,
  repartoButtonClass,
  repartoFieldCaptionClass,
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
  const mapped = mapRepartoError(error);
  const message = mapped.formError?.message ?? `${label} unavailable`;
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

  const error = mapped.formError?.message ?? null;

  return (
    <main
      className={repartoShellClass}
      data-reparto-route="schools"
      data-reparto-group="setup"
    >
      <section className={repartoPanelClass} data-reparto-panel="schools">
        <div className={repartoPanelHeaderClass}>
          <h2>{dict.entity.school.plural}</h2>
          <RowActions>
            <button
              className={repartoButtonClass}
              data-reparto-action="create"
              disabled={formOpen}
              onClick={openCreate}
              type="button"
            >
              {dict.action.create}
            </button>
          </RowActions>
        </div>
        <ul className={repartoListClass} data-reparto-table="schools">
          {rows.length === 0 && !query.isLoading ? (
            <li className={repartoListItemClass} data-reparto-state="empty">
              {dict.table.noResults}
            </li>
          ) : (
            rows.map((school) => (
              <li
                className={repartoListItemClass}
                data-reparto-row="school"
                data-school-id={school.id}
                key={school.id}
              >
                <div className={repartoPanelHeaderClass}>
                  <span data-reparto-slot="school-name">{school.name}</span>
                  <RowActions>
                    <button
                      className={repartoButtonClass}
                      data-reparto-action="edit"
                      data-reparto-row-action="edit"
                      onClick={() => openEdit(school)}
                      type="button"
                    >
                      {dict.action.edit}
                    </button>
                  </RowActions>
                </div>
                <p className={repartoFieldCaptionClass}>
                  {school.locality ?? "—"} · {school.province ?? "—"}
                </p>
              </li>
            ))
          )}
        </ul>
        <QueryState
          error={query.error}
          isError={query.isError}
          isLoading={query.isLoading}
          label={dict.entity.school.plural}
        />
        {formOpen ? (
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
            {error ? null : null}
            <RowActions>
              <button
                className={repartoButtonClass}
                data-reparto-action="save"
                disabled={!canSave}
                type="submit"
              >
                {dict.action.save}
              </button>
              <button
                className={repartoButtonClass}
                data-reparto-action="cancel"
                onClick={closeForm}
                type="button"
              >
                {dict.action.cancel}
              </button>
            </RowActions>
          </form>
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

  return (
    <main
      className={repartoShellClass}
      data-reparto-route="academic-years"
      data-reparto-group="setup"
    >
      <section className={repartoPanelClass} data-reparto-panel="academic-years">
        <div className={repartoPanelHeaderClass}>
          <h2>{dict.entity.academicYear.plural}</h2>
          <RowActions>
            <button
              className={repartoButtonClass}
              data-reparto-action="create"
              data-disabled-reason={createDisabledReason ?? undefined}
              disabled={formOpen || Boolean(createDisabledReason)}
              onClick={openCreate}
              type="button"
            >
              {dict.action.create}
            </button>
            <RepartoDisabledReason reason={createDisabledReason} />
          </RowActions>
        </div>
        {archiveMapped.formError ? (
          <p
            className="text-sm text-destructive"
            data-reparto-slot="archive-error"
            data-reparto-error-key={archiveMapped.formError.errorKey ?? "server"}
          >
            {archiveMapped.formError.message}
          </p>
        ) : null}
        <ul className={repartoListClass} data-reparto-table="academic-years">
          {rows.length === 0 && !query.isLoading ? (
            <li className={repartoListItemClass} data-reparto-state="empty">
              {dict.table.noResults}
            </li>
          ) : (
            rows.map((year) => {
              const isArchived = year.status === "archived";
              const archiveReason = isArchived
                ? dict.entity.academicYear.status.archived
                : null;
              return (
                <li
                  className={repartoListItemClass}
                  data-reparto-row="academic-year"
                  data-year-id={year.id}
                  data-year-status={year.status}
                  key={year.id}
                >
                  <div className={repartoPanelHeaderClass}>
                    <span data-reparto-slot="year-label">{year.label}</span>
                    <span
                      className={repartoFieldCaptionClass}
                      data-reparto-slot="year-status"
                    >
                      {dict.entity.academicYear.status[year.status]}
                    </span>
                  </div>
                  <p className={repartoFieldCaptionClass}>
                    {year.start_date} → {year.end_date}
                  </p>
                  <p className={repartoFieldCaptionClass}>
                    {dict.field.school}: {schoolName(year.school_id)}
                  </p>
                  <RowActions>
                    <button
                      className={repartoButtonClass}
                      data-reparto-action="edit"
                      data-reparto-row-action="edit"
                      onClick={() => openEdit(year)}
                      type="button"
                    >
                      {dict.action.edit}
                    </button>
                    <button
                      className={repartoButtonClass}
                      data-reparto-action="archive"
                      data-reparto-row-action="archive"
                      data-disabled-reason={archiveReason ?? undefined}
                      disabled={archiveMutation.isPending || isArchived}
                      onClick={() => handleArchive(year)}
                      type="button"
                    >
                      {dict.action.archive}
                    </button>
                    <RepartoDisabledReason reason={archiveReason} />
                  </RowActions>
                </li>
              );
            })
          )}
        </ul>
        <QueryState
          error={query.error}
          isError={query.isError}
          isLoading={query.isLoading}
          label={dict.entity.academicYear.plural}
        />
        {formOpen ? (
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
              <button
                className={repartoButtonClass}
                data-reparto-action="save"
                disabled={!canSave}
                type="submit"
              >
                {dict.action.save}
              </button>
              <button
                className={repartoButtonClass}
                data-reparto-action="cancel"
                onClick={closeForm}
                type="button"
              >
                {dict.action.cancel}
              </button>
            </RowActions>
          </form>
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

  return (
    <main
      className={repartoShellClass}
      data-reparto-route="departments"
      data-reparto-group="setup"
    >
      <section className={repartoPanelClass} data-reparto-panel="departments">
        <div className={repartoPanelHeaderClass}>
          <h2>{dict.entity.department.plural}</h2>
          <RowActions>
            <button
              className={repartoButtonClass}
              data-reparto-action="create"
              data-disabled-reason={createReason ?? undefined}
              disabled={formOpen || schoolsMissing}
              onClick={openCreate}
              type="button"
            >
              {dict.action.create}
            </button>
            <RepartoDisabledReason reason={createReason} />
          </RowActions>
        </div>
        <ul className={repartoListClass} data-reparto-table="departments">
          {rows.length === 0 && !query.isLoading ? (
            <li className={repartoListItemClass} data-reparto-state="empty">
              {dict.table.noResults}
            </li>
          ) : (
            rows.map((department) => (
              <li
                className={repartoListItemClass}
                data-reparto-row="department"
                data-department-id={department.id}
                key={department.id}
              >
                <div className={repartoPanelHeaderClass}>
                  <span data-reparto-slot="department-name">{department.name}</span>
                  <RowActions>
                    <button
                      className={repartoButtonClass}
                      data-reparto-action="edit"
                      data-reparto-row-action="edit"
                      onClick={() => openEdit(department)}
                      type="button"
                    >
                      {dict.action.edit}
                    </button>
                  </RowActions>
                </div>
                <p className={repartoFieldCaptionClass}>
                  {dict.field.school}: {schoolName(department.school_id)}
                </p>
              </li>
            ))
          )}
        </ul>
        <QueryState
          error={query.error}
          isError={query.isError}
          isLoading={query.isLoading}
          label={dict.entity.department.plural}
        />
        {formOpen ? (
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
              <button
                className={repartoButtonClass}
                data-reparto-action="save"
                disabled={!canSave}
                type="submit"
              >
                {dict.action.save}
              </button>
              <button
                className={repartoButtonClass}
                data-reparto-action="cancel"
                onClick={closeForm}
                type="button"
              >
                {dict.action.cancel}
              </button>
            </RowActions>
          </form>
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

  const linkReason =
    linkUserId.trim() === "" ? dict.error.required : null;

  return (
    <main
      className={repartoShellClass}
      data-reparto-route="teacher-roster"
      data-reparto-group="setup"
    >
      <section className={repartoPanelClass} data-reparto-panel="teacher-roster">
        <div className={repartoPanelHeaderClass}>
          <h2>{dict.entity.teacherRoster.plural}</h2>
          <RowActions>
            <button
              className={repartoButtonClass}
              data-reparto-action="create"
              disabled={formOpen}
              onClick={openCreate}
              type="button"
            >
              {dict.action.create}
            </button>
          </RowActions>
        </div>
        <ul className={repartoListClass} data-reparto-table="teacher-roster">
          {rows.length === 0 && !query.isLoading ? (
            <li className={repartoListItemClass} data-reparto-state="empty">
              {dict.table.noResults}
            </li>
          ) : (
            rows.map((profile) => (
              <li
                className={repartoListItemClass}
                data-reparto-row="teacher-roster"
                data-teacher-profile-id={profile.id}
                data-teacher-active={profile.active ? "true" : "false"}
                key={profile.id}
              >
                <div className={repartoPanelHeaderClass}>
                  <span data-reparto-slot="teacher-display-name">
                    {profile.display_name}
                  </span>
                  <span
                    className={repartoFieldCaptionClass}
                    data-reparto-slot="teacher-active"
                  >
                    {profile.active ? dict.field.active : "—"}
                  </span>
                </div>
                <RowActions>
                  <button
                    className={repartoButtonClass}
                    data-reparto-action="edit"
                    data-reparto-row-action="edit"
                    onClick={() => openEdit(profile)}
                    type="button"
                  >
                    {dict.action.edit}
                  </button>
                  <button
                    className={repartoButtonClass}
                    data-reparto-action="link-user"
                    data-reparto-row-action="link-user"
                    onClick={() => {
                      setLinkTarget(profile);
                      setLinkUserId(profile.user_id ?? "");
                    }}
                    type="button"
                  >
                    {dict.action.linkUser}
                  </button>
                  <button
                    className={repartoButtonClass}
                    data-reparto-action="delete"
                    data-reparto-row-action="delete"
                    disabled={deleteMutation.isPending}
                    onClick={() => setConfirmDelete(profile)}
                    type="button"
                  >
                    {dict.action.delete}
                  </button>
                </RowActions>
              </li>
            ))
          )}
        </ul>
        <QueryState
          error={query.error}
          isError={query.isError}
          isLoading={query.isLoading}
          label={dict.entity.teacherRoster.plural}
        />
        {formOpen ? (
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
              <button
                className={repartoButtonClass}
                data-reparto-action="save"
                disabled={!canSave}
                type="submit"
              >
                {dict.action.save}
              </button>
              <button
                className={repartoButtonClass}
                data-reparto-action="cancel"
                onClick={closeForm}
                type="button"
              >
                {dict.action.cancel}
              </button>
            </RowActions>
          </form>
        ) : null}
        {linkTarget ? (
          <form
            className={repartoFieldGridClass}
            data-reparto-form="teacher-link-user"
            onSubmit={handleLink}
          >
            <p className={repartoFieldCaptionClass}>
              {dict.entity.teacherRoster.singular}: {linkTarget.display_name}
            </p>
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
              <button
                className={repartoButtonClass}
                data-reparto-action="link-user"
                data-disabled-reason={linkReason ?? undefined}
                disabled={
                  linkUserId.trim() === "" || linkMutation.isPending
                }
                type="submit"
              >
                {dict.action.linkUser}
              </button>
              <RepartoDisabledReason reason={linkReason} />
              <button
                className={repartoButtonClass}
                data-reparto-action="cancel"
                onClick={() => {
                  setLinkTarget(null);
                  setLinkUserId("");
                  setLinkMapped(EMPTY_REPARTO_MAPPED_ERROR);
                }}
                type="button"
              >
                {dict.action.cancel}
              </button>
            </RowActions>
          </form>
        ) : null}
        {confirmDelete ? (
          <section
            className={repartoPanelClass}
            data-reparto-form="teacher-delete-confirm"
          >
            <h3>
              {dict.confirm.delete.title.replace(
                "{entity}",
                dict.entity.teacherRoster.singular.toLowerCase()
              )}
            </h3>
            <p data-reparto-slot="confirm-body">
              {dict.confirm.delete.body.replace("{name}", confirmDelete.display_name)}
            </p>
            <RepartoFormError mapped={deleteMapped} />
            <RowActions>
              <button
                className={repartoButtonClass}
                data-reparto-action="delete"
                disabled={deleteMutation.isPending}
                onClick={handleDelete}
                type="button"
              >
                {dict.confirm.delete.proceed}
              </button>
              <button
                className={repartoButtonClass}
                data-reparto-action="cancel"
                onClick={() => {
                  setConfirmDelete(null);
                  setDeleteMapped(EMPTY_REPARTO_MAPPED_ERROR);
                }}
                type="button"
              >
                {dict.confirm.cancel}
              </button>
            </RowActions>
          </section>
        ) : null}
      </section>
    </main>
  );
}
