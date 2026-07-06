import { useState } from "react";

import {
  FormGrid,
  FormPanelShell,
  SaveCancelRow,
  TextField,
  useMappedError,
  type Dict
} from "../shared.js";
import { useUpdateRepartoSubject } from "../../../hooks.js";
import type { SubjectPublic, SubjectUpdate } from "../../../../schemas.js";

export type SubjectEditProps = {
  dict: Dict;
  processId: string;
  subject: SubjectPublic;
  onDone: () => void;
};

export function SubjectEdit({ dict, processId, subject, onDone }: SubjectEditProps) {
  const updateMutation = useUpdateRepartoSubject();
  const [mapped, setError, clearError] = useMappedError();
  const [name, setName] = useState(subject.name);
  const [stage, setStage] = useState(subject.stage ?? "");
  const [notes, setNotes] = useState(subject.notes ?? "");

  const dirty =
    name !== subject.name ||
    stage !== (subject.stage ?? "") ||
    notes !== (subject.notes ?? "");
  const canSave = name.trim().length > 0 && dirty && !updateMutation.isPending;

  function handleSubmit(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (!canSave) return;
    clearError();
    const body: SubjectUpdate = {
      name: name.trim(),
      stage: stage.trim() || null,
      notes: notes.trim() || null
    };
    updateMutation.mutate(
      { processId, subjectId: subject.id, body },
      { onSuccess: () => onDone(), onError: setError }
    );
  }

  return (
    <FormPanelShell formAttr="subject" mode="edit" onSubmit={handleSubmit}>
      <FormGrid>
        <TextField
          field="name"
          id="subject-edit-name"
          label={dict.field.name}
          maxLength={150}
          onChange={setName}
          value={name}
          mapped={mapped}
          fieldErrorKey="name"
        />
        <TextField
          field="stage"
          id="subject-edit-stage"
          label={dict.field.stage}
          maxLength={50}
          value={stage}
          onChange={setStage}
        />
        <TextField
          field="notes"
          id="subject-edit-notes"
          label={dict.field.notes}
          maxLength={2000}
          value={notes}
          onChange={setNotes}
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
  );
}