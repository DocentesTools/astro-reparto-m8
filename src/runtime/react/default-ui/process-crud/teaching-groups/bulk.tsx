import { useState } from "react";
import { formatRepartoMessage } from "../../../../i18n/index.js";
import type { ClassroomStagePublic } from "../../../../schemas.js";
import { generateTeachingGroupLabel, generateGroupCodeRange, gradeInStageRange } from "../../../../ui/teachingGroups.js";
import { useBulkCreateRepartoTeachingGroups } from "../../../hooks.js";
import { repartoToast } from "../../../ui/toast-notification.js";
import { EntityDialogShell, FormGrid, FormPanelShell, SaveCancelRow, SelectField, TextField, useMappedError, type Dict } from "../shared.js";

export function TeachingGroupBulk({ dict, processId, stages, onDone }: { dict: Dict; processId: string; stages: ClassroomStagePublic[]; onDone: () => void }) {
  const mutation = useBulkCreateRepartoTeachingGroups();
  const [mapped, setError, clear] = useMappedError();
  const [stageId, setStageId] = useState("");
  const [grade, setGrade] = useState("");
  const [start, setStart] = useState("A");
  const [end, setEnd] = useState("A");
  const stage = stages.find((item) => item.id === stageId);
  const gradeNumber = Number.parseInt(grade, 10);
  const codes = generateGroupCodeRange(start, end);
  const valid = Boolean(stage && gradeInStageRange(gradeNumber, stage) && codes.length);
  const labels = stage ? codes.map((code) => generateTeachingGroupLabel({ grade: gradeNumber, stageLabel: stage.label, groupCode: code })) : [];
  const submit = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    if (!valid) return;
    clear();
    mutation.mutate({ processId, body: { classroom_stage_id: stageId, grade: gradeNumber, group_start: start, group_end: end } }, {
      onSuccess: (result) => { repartoToast.success(formatRepartoMessage(dict.teachingGroupBulk.created, { count: result.count })); onDone(); },
      onError: (error) => { setError(error); repartoToast.error(dict.teachingGroupBulk.createError, error instanceof Error ? error.message : undefined); }
    });
  };
  return <EntityDialogShell description={dict.teachingGroupBulk.description} dialogId="teaching-group-bulk" onClose={onDone} title={dict.teachingGroupBulk.title}>
    <FormPanelShell formAttr="teaching-group-bulk" mode="create" onSubmit={submit}><FormGrid>
      <SelectField field="stage" label={dict.field.stage} value={stageId} onChange={setStageId} options={stages.map((item) => ({ value: item.id, label: `${item.stage} — ${item.label}` }))} />
      <TextField field="grade" label={dict.field.grade} value={grade} onChange={setGrade} type="number" />
      <TextField field="group-start" label={dict.teachingGroupBulk.groupStart} value={start} onChange={setStart} maxLength={1} />
      <TextField field="group-end" label={dict.teachingGroupBulk.groupEnd} value={end} onChange={setEnd} maxLength={1} />
      <ul data-reparto-bulk-preview="">{labels.map((label) => <li key={label}>{label}</li>)}</ul>
      <SaveCancelRow canSave={valid} isPending={mutation.isPending} saveLabel={dict.action.save} cancelLabel={dict.action.cancel} onSubmit={() => submit({ preventDefault: () => undefined })} onCancel={onDone} mapped={mapped} />
    </FormGrid></FormPanelShell>
  </EntityDialogShell>;
}
