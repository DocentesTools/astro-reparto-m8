import { useState } from "react";

import {
  EntityDialogShell,
  FormGrid,
  FormPanelShell,
  SaveCancelRow,
  SelectField,
  TextField,
  useMappedError,
  type Dict
} from "../shared.js";
import { useUpdateRepartoTeachingGroup } from "../../../hooks.js";
import type { ClassroomStagePublic, TeachingGroupPublic, TeachingGroupUpdate } from "../../../../schemas.js";
import { generateClassroomLabel, gradeInStageRange } from "../../../../ui/classrooms.js";

export type ClassroomEditProps = {
  dict: Dict;
  processId: string;
  group: TeachingGroupPublic;
  stages: ClassroomStagePublic[];
  onDone: () => void;
};

export function ClassroomEdit({ dict, processId, group, stages, onDone }: ClassroomEditProps) {
  const updateMutation = useUpdateRepartoTeachingGroup();
  const [mapped, setError, clearError] = useMappedError();
  const [stageId, setStageId] = useState(group.classroom_stage_id);
  const [grade, setGrade] = useState(String(group.grade));
  const [groupCode, setGroupCode] = useState(group.group_code);
  const [label, setLabel] = useState(group.label);
  const [notes, setNotes] = useState(group.notes ?? "");
  const initialGenerated = generateClassroomLabel({ grade: group.grade, stageLabel: group.classroom_stage.label, groupCode: group.group_code });
  const [manualLabel, setManualLabel] = useState(group.label !== initialGenerated);

  const gradeNum = Number.parseInt(grade, 10);
  const stage = stages.find((item) => item.id === stageId);
  const gradeValid = Boolean(stage && gradeInStageRange(gradeNum, stage));
  const generated = stage && gradeValid && groupCode.trim() ? generateClassroomLabel({ grade: gradeNum, stageLabel: stage.label, groupCode }) : "";
  const visibleLabel = manualLabel ? label : generated;
  const dirty =
    stageId !== group.classroom_stage_id ||
    gradeNum !== group.grade ||
    groupCode !== group.group_code ||
    label !== group.label ||
    notes !== (group.notes ?? "");
  const canSave = dirty && gradeValid && !updateMutation.isPending;

  function handleSubmit(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (!canSave) return;
    clearError();
    const body: TeachingGroupUpdate = {
      classroom_stage_id: stageId,
      grade: gradeNum,
      group_code: groupCode.trim(),
      label: visibleLabel.trim(),
      notes: notes.trim() || null
    };
    updateMutation.mutate(
      { processId, groupId: group.id, body },
      { onSuccess: () => onDone(), onError: setError }
    );
  }

  return (
    <EntityDialogShell
      description={group.label}
      dialogId="classroom-edit"
      onClose={onDone}
      title={`${dict.action.edit} ${dict.entity.classroom.singular.toLowerCase()}`}
    >
      <FormPanelShell formAttr="classroom" mode="edit" onSubmit={handleSubmit}>
        <FormGrid>
        <SelectField field="stage" label={dict.field.stage} onChange={setStageId} value={stageId} options={stages.map((item) => ({ label: `${item.stage} — ${item.label}`, value: item.id }))} mapped={mapped} fieldErrorKey="stage" />
        <TextField
          field="grade"
          id="classroom-edit-grade"
          label={dict.field.grade}
          onChange={setGrade}
          value={grade}
          type="number"
          mapped={mapped}
          fieldErrorKey="grade"
        />
        <TextField
          field="group-code"
          id="classroom-edit-group-code"
          label={dict.field.groupCode}
          maxLength={10}
          onChange={setGroupCode}
          value={groupCode}
          mapped={mapped}
          fieldErrorKey="groupCode"
        />
        <TextField
          field="label"
          id="classroom-edit-label"
          label={dict.field.label}
          maxLength={100}
          onChange={(value) => { setLabel(value); setManualLabel(value.trim() !== ""); }}
          value={visibleLabel}
          mapped={mapped}
          fieldErrorKey="label"
        />
        <TextField
          field="notes"
          id="classroom-edit-notes"
          label={dict.field.notes}
          maxLength={2000}
          onChange={setNotes}
          value={notes}
        />
        <SaveCancelRow
          canSave={canSave}
          isPending={updateMutation.isPending}
          saveLabel={dict.action.save}
          cancelLabel={dict.action.cancel}
          onSubmit={() => handleSubmit({ preventDefault: () => undefined })}
          onCancel={onDone}
          mapped={mapped}
        />
        </FormGrid>
      </FormPanelShell>
    </EntityDialogShell>
  );
}
