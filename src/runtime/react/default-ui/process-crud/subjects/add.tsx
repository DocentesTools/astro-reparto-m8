import { useState } from "react";

import {
  EMPTY_REPARTO_MAPPED_ERROR,
  EntityDialogShell,
  FormGrid,
  FormPanelShell,
  SaveCancelRow,
  SelectField,
  TextField,
  useMappedError,
  type Dict
} from "../shared.js";
import { useCreateRepartoSubject } from "../../../hooks.js";
import type {
  ActivityType,
  SubjectAllocationCategory,
  SubjectCreateInput
} from "../../../../schemas.js";
import {
  activityTypeOptions,
  allocationCategoryOptions
} from "./classification.js";

export type SubjectAddProps = {
  dict: Dict;
  processId: string;
  onDone: () => void;
};

export function SubjectAdd({ dict, processId, onDone }: SubjectAddProps) {
  const createMutation = useCreateRepartoSubject();
  const [mapped, setError, clearError] = useMappedError();
  const [name, setName] = useState("");
  const [allocationCategory, setAllocationCategory] =
    useState<SubjectAllocationCategory>("main");
  const [activityType, setActivityType] = useState<ActivityType>("ordinary");
  const [notes, setNotes] = useState("");

  const canSave = name.trim().length > 0 && !createMutation.isPending;

  function handleSubmit(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (!canSave) return;
    clearError();
    const body: SubjectCreateInput = {
      name: name.trim(),
      allocation_category: allocationCategory,
      activity_type: activityType,
      notes: notes.trim() || null
    };
    createMutation.mutate(
      { processId, body },
      { onSuccess: () => onDone(), onError: setError }
    );
  }

  return (
    <EntityDialogShell
      description={dict.entity.subject.plural}
      dialogId="subject-create"
      onClose={onDone}
      title={`${dict.action.create} ${dict.entity.subject.singular.toLowerCase()}`}
    >
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
        <SelectField
          field="allocation-category"
          label={dict.field.allocationCategory}
          onChange={(value) =>
            setAllocationCategory(value as SubjectAllocationCategory)
          }
          options={allocationCategoryOptions(dict)}
          value={allocationCategory}
          mapped={mapped}
          fieldErrorKey="allocationCategory"
        />
        <SelectField
          field="activity-type"
          label={dict.field.activityType}
          onChange={(value) => setActivityType(value as ActivityType)}
          options={activityTypeOptions(dict)}
          value={activityType}
          mapped={mapped}
          fieldErrorKey="activityType"
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
    </EntityDialogShell>
  );
}

export { EMPTY_REPARTO_MAPPED_ERROR };
