import { useState } from "react";

import {
  formatRepartoMessage,
  getRepartoDictionary,
  normalizeRepartoLocale,
  type RepartoLocale
} from "../../i18n/index.js";
import { REPARTO_ADMIN_MINIMUM_ROLE } from "../../authAdapter.js";
import { useRepartoMinimumRole } from "../useRepartoRole.js";
import type { ClassroomStagePublic } from "../../schemas.js";
import {
  useCreateRepartoClassroomStage,
  useDeleteRepartoClassroomStage,
  useRepartoClassroomStages,
  useUpdateRepartoClassroomStage
} from "../hooks.js";
import {
  repartoToast,
  RepartoToastHost
} from "../ui/toast-notification.js";
import { DataTable, type DataTableColumn } from "./data-table.js";
import {
  ActionButton,
  EntityDeleteDialog,
  EntityDialogShell,
  FormGrid,
  FormPanelShell,
  SaveCancelRow,
  TextField,
  useMappedError,
  type Dict
} from "./process-crud/shared.js";
import { Shell, type ViewConfig } from "./process-context.js";

function StageForm({
  dict,
  stage,
  onDone
}: {
  dict: Dict;
  stage?: ClassroomStagePublic;
  onDone: () => void;
}) {
  const create = useCreateRepartoClassroomStage();
  const update = useUpdateRepartoClassroomStage();
  const [mapped, setError, clear] = useMappedError();
  const [name, setName] = useState(stage?.stage ?? "");
  const [label, setLabel] = useState(stage?.label ?? "");
  const [minGrade, setMinGrade] = useState(String(stage?.min_grade ?? 1));
  const [maxGrade, setMaxGrade] = useState(String(stage?.max_grade ?? 1));
  const min = Number.parseInt(minGrade, 10);
  const max = Number.parseInt(maxGrade, 10);
  const valid =
    name.trim() !== "" && label.trim() !== "" && min > 0 && max >= min;
  const pending = create.isPending || update.isPending;

  const submit = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    if (!valid) return;
    clear();
    const body = {
      stage: name.trim(),
      label: label.trim(),
      min_grade: min,
      max_grade: max
    };
    const options = {
      onSuccess: () => {
        repartoToast.success(
          stage
            ? dict.classroomStages.toast.updated
            : dict.classroomStages.toast.created
        );
        onDone();
      },
      onError: (error: unknown) => {
        setError(error);
        repartoToast.error(
          dict.classroomStages.toast.saveError,
          error instanceof Error ? error.message : undefined
        );
      }
    };
    if (stage) update.mutate({ stageId: stage.id, body }, options);
    else create.mutate(body, options);
  };

  return (
    <EntityDialogShell
      description={dict.classroomStages.formDescription}
      dialogId="classroom-stage"
      onClose={onDone}
      title={
        stage
          ? dict.classroomStages.editTitle
          : dict.classroomStages.createTitle
      }
    >
      <FormPanelShell
        formAttr="classroom-stage"
        mode={stage ? "edit" : "create"}
        onSubmit={submit}
      >
        <FormGrid>
          <TextField
            field="stage"
            label={dict.classroomStages.field.stage}
            value={name}
            onChange={setName}
            maxLength={100}
          />
          <TextField
            field="label"
            label={dict.classroomStages.field.shortLabel}
            value={label}
            onChange={setLabel}
            maxLength={30}
          />
          <TextField
            field="min-grade"
            label={dict.classroomStages.field.minGrade}
            value={minGrade}
            onChange={setMinGrade}
            type="number"
          />
          <TextField
            field="max-grade"
            label={dict.classroomStages.field.maxGrade}
            value={maxGrade}
            onChange={setMaxGrade}
            type="number"
          />
          <SaveCancelRow
            canSave={valid}
            isPending={pending}
            saveLabel={dict.action.save}
            cancelLabel={dict.action.cancel}
            onSubmit={() => submit({ preventDefault: () => undefined })}
            onCancel={onDone}
            mapped={mapped}
          />
        </FormGrid>
      </FormPanelShell>
    </EntityDialogShell>
  );
}

function ClassroomStagesContent({
  dict,
  locale
}: {
  dict: Dict;
  locale: RepartoLocale;
}) {
  const query = useRepartoClassroomStages();
  // Classroom stages are platform setup, so the floor is the same `ADMIN` one
  // every department-head surface uses — read through the shared helper rather
  // than re-derived here (`RBAC-06`). `null` is "not answered yet".
  const allowed = useRepartoMinimumRole(REPARTO_ADMIN_MINIMUM_ROLE);
  const [editing, setEditing] = useState<ClassroomStagePublic | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<ClassroomStagePublic | null>(null);
  const remove = useDeleteRepartoClassroomStage();
  const [mapped, setError, clear] = useMappedError();

  const rows = query.data?.data ?? [];
  const columns: DataTableColumn<ClassroomStagePublic>[] = [
    {
      id: "stage",
      label: dict.classroomStages.field.stage,
      value: (row) => row.stage
    },
    {
      id: "min_grade",
      label: dict.classroomStages.field.minGrade,
      value: (row) => row.min_grade
    },
    {
      id: "max_grade",
      label: dict.classroomStages.field.maxGrade,
      value: (row) => row.max_grade
    },
    {
      id: "label",
      label: dict.classroomStages.field.shortLabel,
      value: (row) => row.label
    },
    {
      id: "created_at",
      label: dict.classroomStages.column.created,
      value: (row) => new Date(row.created_at).toLocaleDateString(locale)
    },
    {
      id: "updated_at",
      label: dict.classroomStages.column.updated,
      value: (row) => new Date(row.updated_at).toLocaleDateString(locale)
    },
    {
      id: "actions",
      label: dict.table.actions,
      sortable: false,
      hideable: false,
      value: (row) => row.stage,
      cell: (row) =>
        allowed ? (
          <span className="flex gap-2">
            <ActionButton
              action="edit"
              label={dict.action.edit}
              onClick={() => setEditing(row)}
              row
            />
            <ActionButton
              action="delete"
              label={dict.action.delete}
              onClick={() => setDeleting(row)}
              row
            />
          </span>
        ) : null
    }
  ];

  if (allowed === false) {
    return (
      <section data-reparto-state="forbidden">
        {dict.classroomStages.state.unauthorized}
      </section>
    );
  }

  return (
    <main
      className="not-content w-full max-w-none"
      data-reparto-route="classroom-stages"
    >
      <RepartoToastHost />
      {allowed ? (
        <div className="flex justify-end gap-2 pb-4" data-reparto-actions="classroom-stages">
          <ActionButton
            action="create"
            label={dict.action.create}
            onClick={() => setCreating(true)}
          />
        </div>
      ) : null}
      <DataTable
        columns={columns}
        data={rows}
        emptyLabel={dict.classroomStages.state.empty}
        labels={{
          columns: dict.table.columns,
          filter: dict.table.all,
          firstPage: dict.table.firstPage,
          lastPage: dict.table.lastPage,
          nextPage: dict.table.nextPage,
          page: (current, total) =>
            `${dict.table.page} ${current} / ${total}`,
          previousPage: dict.table.previousPage,
          rowsPerPage: dict.table.rowsPerPage,
          search: dict.classroomStages.search
        }}
        rowKey={(row) => row.id}
        rowName="classroom-stage"
        tableName="classroom-stages"
        searchFields={[(row) => row.stage, (row) => row.label]}
      />
      {query.isLoading ? (
        <p>{dict.classroomStages.state.loading}</p>
      ) : null}
      {query.isError ? (
        <p role="alert">{dict.classroomStages.state.unavailable}</p>
      ) : null}
      {creating ? (
        <StageForm dict={dict} onDone={() => setCreating(false)} />
      ) : null}
      {editing ? (
        <StageForm
          dict={dict}
          stage={editing}
          onDone={() => setEditing(null)}
        />
      ) : null}
      {deleting ? (
        <EntityDeleteDialog
          title={dict.classroomStages.deleteTitle}
          body={formatRepartoMessage(dict.classroomStages.deleteBody, {
            name: deleting.stage
          })}
          proceedLabel={dict.action.delete}
          cancelLabel={dict.action.cancel}
          isPending={remove.isPending}
          mapped={mapped}
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            clear();
            remove.mutate(deleting.id, {
              onSuccess: () => {
                repartoToast.success(dict.classroomStages.toast.deleted);
                setDeleting(null);
              },
              onError: (error) => {
                setError(error);
                repartoToast.error(dict.classroomStages.toast.deleteError);
              }
            });
          }}
        />
      ) : null}
    </main>
  );
}

export function RepartoClassroomStagesView({
  config,
  locale
}: {
  config?: ViewConfig;
  locale?: RepartoLocale;
}) {
  const resolvedLocale = locale ?? normalizeRepartoLocale();
  const dict = getRepartoDictionary(resolvedLocale);
  return (
    <Shell config={config}>
      <ClassroomStagesContent dict={dict} locale={resolvedLocale} />
    </Shell>
  );
}
