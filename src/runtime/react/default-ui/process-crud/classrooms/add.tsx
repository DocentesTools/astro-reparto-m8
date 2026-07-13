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
import { useCreateRepartoTeachingGroup } from "../../../hooks.js";
import type { ClassroomStagePublic, TeachingGroupCreateInput } from "../../../../schemas.js";
import { generateClassroomLabel, gradeInStageRange } from "../../../../ui/classrooms.js";

export type ClassroomAddProps = {
  dict: Dict;
  processId: string;
  stages: ClassroomStagePublic[];
  onDone: () => void;
};

export function ClassroomAdd({ dict, processId, stages, onDone }: ClassroomAddProps) {
  const createMutation = useCreateRepartoTeachingGroup();
  const [mapped, setError, clearError] = useMappedError();
  const [stageId, setStageId] = useState("");
  const [grade, setGrade] = useState("");
  const [groupCode, setGroupCode] = useState("");
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [manualLabel, setManualLabel] = useState(false);

  const gradeNum = Number.parseInt(grade, 10);
  const stage = stages.find((item) => item.id === stageId);
  const gradeValid = Boolean(stage && gradeInStageRange(gradeNum, stage));
  const generated = stage && gradeValid && groupCode.trim() ? generateClassroomLabel({ grade: gradeNum, stageLabel: stage.label, groupCode }) : "";
  const visibleLabel = manualLabel ? label : generated;
  const canSave =
    stageId !== "" &&
    gradeValid &&
    groupCode.trim() !== "" &&
    !createMutation.isPending;

  function handleSubmit(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (!canSave) return;
    clearError();
    const body: TeachingGroupCreateInput = {
      classroom_stage_id: stageId,
      grade: gradeNum,
      group_code: groupCode.trim(),
      label: visibleLabel.trim() || null,
      notes: notes.trim() || null
    };
    createMutation.mutate(
      { processId, body },
      { onSuccess: () => onDone(), onError: setError }
    );
  }

  return (
    <EntityDialogShell
      description={dict.entity.classroom.plural}
      dialogId="classroom-create"
      onClose={onDone}
      title={`${dict.action.create} ${dict.entity.classroom.singular.toLowerCase()}`}
    >
      <FormPanelShell formAttr="classroom" mode="create" onSubmit={handleSubmit}>
        <FormGrid>
        <SelectField field="stage" label={dict.field.stage} onChange={setStageId} value={stageId} options={stages.map((item) => ({ label: `${item.stage} — ${item.label}`, value: item.id }))} mapped={mapped} fieldErrorKey="stage" />
        <TextField
          field="grade"
          id="classroom-add-grade"
          label={dict.field.grade}
          onChange={setGrade}
          value={grade}
          type="number"
          mapped={mapped}
          fieldErrorKey="grade"
        />
        <TextField
          field="group-code"
          id="classroom-add-group-code"
          label={dict.field.groupCode}
          maxLength={10}
          onChange={setGroupCode}
          value={groupCode}
          fieldErrorKey="groupCode"
          mapped={mapped}
        />
        <TextField
          field="label"
          id="classroom-add-label"
          label={dict.field.label}
          maxLength={100}
          onChange={(value) => { setLabel(value); setManualLabel(value.trim() !== ""); }}
          value={visibleLabel}
          mapped={mapped}
          fieldErrorKey="label"
        />
        <TextField
          field="notes"
          id="classroom-add-notes"
          label={dict.field.notes}
          maxLength={2000}
          onChange={setNotes}
          value={notes}
        />
        <SaveCancelRow
          canSave={canSave}
          isPending={createMutation.isPending}
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
