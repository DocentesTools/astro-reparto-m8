import { useEffect, useState } from "react";
import { canManageClassroomStages, getRepartoAuthAdapter } from "../../authAdapter.js";
import type { ClassroomStagePublic } from "../../schemas.js";
import { useCreateRepartoClassroomStage, useDeleteRepartoClassroomStage, useRepartoClassroomStages, useUpdateRepartoClassroomStage } from "../hooks.js";
import { repartoToast, RepartoToastHost } from "../ui/toast-notification.js";
import { DataTable, type DataTableColumn } from "./data-table.js";
import { ActionButton, EntityDeleteDialog, EntityDialogShell, FormGrid, FormPanelShell, SaveCancelRow, TextField, useMappedError } from "./process-crud/shared.js";
import { Shell, type ViewConfig } from "./process-context.js";

function StageForm({ stage, onDone }: { stage?: ClassroomStagePublic; onDone: () => void }) {
  const create = useCreateRepartoClassroomStage();
  const update = useUpdateRepartoClassroomStage();
  const [mapped, setError, clear] = useMappedError();
  const [name, setName] = useState(stage?.stage ?? "");
  const [label, setLabel] = useState(stage?.label ?? "");
  const [minGrade, setMinGrade] = useState(String(stage?.min_grade ?? 1));
  const [maxGrade, setMaxGrade] = useState(String(stage?.max_grade ?? 1));
  const min = Number.parseInt(minGrade, 10);
  const max = Number.parseInt(maxGrade, 10);
  const valid = name.trim() !== "" && label.trim() !== "" && min > 0 && max >= min;
  const pending = create.isPending || update.isPending;
  const submit = (event: { preventDefault: () => void }) => {
    event.preventDefault(); if (!valid) return; clear();
    const body = { stage: name.trim(), label: label.trim(), min_grade: min, max_grade: max };
    const options = { onSuccess: () => { repartoToast.success(stage ? "Classroom stage updated" : "Classroom stage created"); onDone(); }, onError: (error: unknown) => { setError(error); repartoToast.error("Classroom stage could not be saved", error instanceof Error ? error.message : undefined); } };
    if (stage) update.mutate({ stageId: stage.id, body }, options); else create.mutate(body, options);
  };
  return <EntityDialogShell description="Global classroom reference data" dialogId="classroom-stage" onClose={onDone} title={stage ? "Edit classroom stage" : "Create classroom stage"}>
    <FormPanelShell formAttr="classroom-stage" mode={stage ? "edit" : "create"} onSubmit={submit}><FormGrid>
      <TextField field="stage" label="Stage" value={name} onChange={setName} maxLength={100} />
      <TextField field="label" label="Short label" value={label} onChange={setLabel} maxLength={30} />
      <TextField field="min-grade" label="Minimum grade" value={minGrade} onChange={setMinGrade} type="number" />
      <TextField field="max-grade" label="Maximum grade" value={maxGrade} onChange={setMaxGrade} type="number" />
      <SaveCancelRow canSave={valid} isPending={pending} saveLabel="Save" cancelLabel="Cancel" onSubmit={() => submit({ preventDefault: () => undefined })} onCancel={onDone} mapped={mapped} />
    </FormGrid></FormPanelShell>
  </EntityDialogShell>;
}

function ClassroomStagesContent() {
  const query = useRepartoClassroomStages();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [editing, setEditing] = useState<ClassroomStagePublic | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<ClassroomStagePublic | null>(null);
  const remove = useDeleteRepartoClassroomStage();
  const [mapped, setError, clear] = useMappedError();
  useEffect(() => { void Promise.resolve(getRepartoAuthAdapter().getCurrentUser?.() ?? null).then((user) => setAllowed(canManageClassroomStages(user))); }, []);
  const rows = query.data?.data ?? [];
  const columns: DataTableColumn<ClassroomStagePublic>[] = [
    { id: "stage", label: "Stage", value: (row) => row.stage },
    { id: "min_grade", label: "Minimum grade", value: (row) => row.min_grade },
    { id: "max_grade", label: "Maximum grade", value: (row) => row.max_grade },
    { id: "label", label: "Short label", value: (row) => row.label },
    { id: "created_at", label: "Created", value: (row) => new Date(row.created_at).toLocaleDateString() },
    { id: "updated_at", label: "Updated", value: (row) => new Date(row.updated_at).toLocaleDateString() },
    { id: "actions", label: "Actions", sortable: false, hideable: false, value: (row) => row.stage, cell: (row) => allowed ? <span className="flex gap-2"><ActionButton action="edit" label="Edit" onClick={() => setEditing(row)} row /><ActionButton action="delete" label="Delete" onClick={() => setDeleting(row)} row /></span> : null }
  ];
  if (allowed === false) return <section data-reparto-state="forbidden">Administrator access required.</section>;
  return <main className="not-content mx-auto max-w-6xl p-4" data-reparto-route="classroom-stages"><RepartoToastHost /><DataTable addButton={allowed ? <ActionButton action="create" label="Create" onClick={() => setCreating(true)} /> : undefined} columns={columns} data={rows} emptyLabel="No classroom stages found." labels={{ columns: "Columns", filter: "All", firstPage: "First", lastPage: "Last", nextPage: "Next", page: (current, total) => `Page ${current} / ${total}`, previousPage: "Previous", rowsPerPage: "Rows per page", search: "Search classroom stages" }} rowKey={(row) => row.id} rowName="classroom-stage" tableName="classroom-stages" searchFields={[(row) => row.stage, (row) => row.label]} />
    {query.isLoading ? <p>Loading classroom stages…</p> : null}{query.isError ? <p role="alert">Classroom stages unavailable.</p> : null}
    {creating ? <StageForm onDone={() => setCreating(false)} /> : null}{editing ? <StageForm stage={editing} onDone={() => setEditing(null)} /> : null}
    {deleting ? <EntityDeleteDialog title="Delete classroom stage" body={`Delete ${deleting.stage}?`} proceedLabel="Delete" cancelLabel="Cancel" isPending={remove.isPending} mapped={mapped} onClose={() => setDeleting(null)} onConfirm={() => { clear(); remove.mutate(deleting.id, { onSuccess: () => { repartoToast.success("Classroom stage deleted"); setDeleting(null); }, onError: (error) => { setError(error); repartoToast.error("Classroom stage could not be deleted"); } }); }} /> : null}
  </main>;
}

export function RepartoClassroomStagesView({ config }: { config?: ViewConfig }) {
  return <Shell config={config}><ClassroomStagesContent /></Shell>;
}
