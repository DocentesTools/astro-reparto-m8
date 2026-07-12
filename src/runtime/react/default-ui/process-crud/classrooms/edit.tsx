import { useState } from "react";

import {
  FormGrid,
  FormPanelShell,
  SaveCancelRow,
  TextField,
  useMappedError,
  type Dict
} from "../shared.js";
import { useUpdateRepartoTeachingGroup } from "../../../hooks.js";
import type { TeachingGroupPublic, TeachingGroupUpdate } from "../../../../schemas.js";
import { ClassroomDialogShell } from "./dialog-shell.js";

export type ClassroomEditProps = {
  dict: Dict;
  processId: string;
  group: TeachingGroupPublic;
  onDone: () => void;
};

export function ClassroomEdit({ dict, processId, group, onDone }: ClassroomEditProps) {
  const updateMutation = useUpdateRepartoTeachingGroup();
  const [mapped, setError, clearError] = useMappedError();
  const [stage, setStage] = useState(group.stage);
  const [grade, setGrade] = useState(String(group.grade));
  const [groupCode, setGroupCode] = useState(group.group_code);
  const [label, setLabel] = useState(group.label);
  const [notes, setNotes] = useState(group.notes ?? "");

  const gradeNum = Number.parseInt(grade, 10);
  const gradeValid = Number.isInteger(gradeNum) && gradeNum >= 0 && gradeNum <= 20;
  const dirty =
    stage !== group.stage ||
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
      stage: stage.trim(),
      grade: gradeNum,
      group_code: groupCode.trim(),
      label: label.trim(),
      notes: notes.trim() || null
    };
    updateMutation.mutate(
      { processId, groupId: group.id, body },
      { onSuccess: () => onDone(), onError: setError }
    );
  }

  return (
    <ClassroomDialogShell
      description={group.label}
      dialogId="classroom-edit"
      onClose={onDone}
      title={`${dict.action.edit} ${dict.entity.classroom.singular.toLowerCase()}`}
    >
      <FormPanelShell formAttr="classroom" mode="edit" onSubmit={handleSubmit}>
        <FormGrid>
        <TextField
          field="stage"
          id="classroom-edit-stage"
          label={dict.field.stage}
          maxLength={50}
          onChange={setStage}
          value={stage}
          mapped={mapped}
          fieldErrorKey="stage"
        />
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
          onChange={setLabel}
          value={label}
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
    </ClassroomDialogShell>
  );
}
