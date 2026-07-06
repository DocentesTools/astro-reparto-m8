import { useState } from "react";

import {
  EMPTY_REPARTO_MAPPED_ERROR,
  FormGrid,
  FormPanelShell,
  SaveCancelRow,
  TextField,
  useMappedError,
  type Dict
} from "../shared.js";
import { useCreateRepartoSubject } from "../../../hooks.js";
import type { SubjectCreate } from "../../../../schemas.js";

export type SubjectAddProps = {
  dict: Dict;
  processId: string;
  onDone: () => void;
};

export function SubjectAdd({ dict, processId, onDone }: SubjectAddProps) {
  const createMutation = useCreateRepartoSubject();
  const [mapped, setError, clearError] = useMappedError();
  const [name, setName] = useState("");
  const [stage, setStage] = useState("");
  const [notes, setNotes] = useState("");

  const canSave = name.trim().length > 0 && !createMutation.isPending;

  function handleSubmit(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (!canSave) return;
    clearError();
    const body: SubjectCreate = {
      name: name.trim(),
      stage: stage.trim() || null,
      notes: notes.trim() || null
    };
    createMutation.mutate(
      { processId, body },
      { onSuccess: () => onDone(), onError: setError }
    );
  }

  return (
    <FormPanelShell formAttr="subject" mode="create" onSubmit={handleSubmit}>
      <FormGrid>
        <TextField
          field="name"
          id="subject-add-name"
          label={dict.field.name}
          maxLength={150}
          onChange={setName}
          value={name}
          mapped={mapped}
          fieldErrorKey="name"
        />
        <TextField
          field="stage"
          id="subject-add-stage"
          label={dict.field.stage}
          maxLength={50}
          onChange={setStage}
          value={stage}
        />
        <TextField
          field="notes"
          id="subject-add-notes"
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

export { EMPTY_REPARTO_MAPPED_ERROR };