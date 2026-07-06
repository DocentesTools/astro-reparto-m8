import { useState } from "react";

import {
  FormGrid,
  FormPanelShell,
  SaveCancelRow,
  TextField,
  useMappedError,
  type Dict
} from "../shared.js";
import { useCreateRepartoTeachingGroup } from "../../../hooks.js";
import type { TeachingGroupCreate } from "../../../../schemas.js";

export type ClassroomAddProps = {
  dict: Dict;
  processId: string;
  onDone: () => void;
};

export function ClassroomAdd({ dict, processId, onDone }: ClassroomAddProps) {
  const createMutation = useCreateRepartoTeachingGroup();
  const [mapped, setError, clearError] = useMappedError();
  const [stage, setStage] = useState("");
  const [grade, setGrade] = useState("");
  const [groupCode, setGroupCode] = useState("");
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");

  const gradeNum = Number.parseInt(grade, 10);
  const gradeValid = Number.isInteger(gradeNum) && gradeNum >= 0 && gradeNum <= 20;
  const canSave =
    stage.trim() !== "" &&
    gradeValid &&
    groupCode.trim() !== "" &&
    label.trim() !== "" &&
    !createMutation.isPending;

  function handleSubmit(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (!canSave) return;
    clearError();
    const body: TeachingGroupCreate = {
      stage: stage.trim(),
      grade: gradeNum,
      group_code: groupCode.trim(),
      label: label.trim(),
      notes: notes.trim() || null
    };
    createMutation.mutate(
      { processId, body },
      { onSuccess: () => onDone(), onError: setError }
    );
  }

  return (
    <FormPanelShell formAttr="classroom" mode="create" onSubmit={handleSubmit}>
      <FormGrid>
        <TextField
          field="stage"
          id="classroom-add-stage"
          label={dict.field.stage}
          maxLength={50}
          onChange={setStage}
          value={stage}
          mapped={mapped}
          fieldErrorKey="stage"
        />
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
          onChange={setLabel}
          value={label}
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
  );
}