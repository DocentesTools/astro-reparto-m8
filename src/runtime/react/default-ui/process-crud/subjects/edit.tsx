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
import { useUpdateRepartoSubject } from "../../../hooks.js";
import type {
  ActivityType,
  SubjectAllocationCategory,
  SubjectPublic,
  SubjectUpdateInput
} from "../../../../schemas.js";
import {
  activityTypeOptions,
  allocationCategoryOptions
} from "./classification.js";

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
  const [allocationCategory, setAllocationCategory] =
    useState<SubjectAllocationCategory>(subject.allocation_category);
  const [activityType, setActivityType] = useState<ActivityType>(
    subject.activity_type
  );
  const [notes, setNotes] = useState(subject.notes ?? "");

  const dirty =
    name !== subject.name ||
    allocationCategory !== subject.allocation_category ||
    activityType !== subject.activity_type ||
    notes !== (subject.notes ?? "");
  const canSave = name.trim().length > 0 && dirty && !updateMutation.isPending;

  function handleSubmit(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (!canSave) return;
    clearError();
    // The planning defaults are deliberately absent: the backend applies only
    // the fields present, so leaving them out preserves whatever is stored.
    const body: SubjectUpdateInput = {
      name: name.trim(),
      allocation_category: allocationCategory,
      activity_type: activityType,
      notes: notes.trim() || null
    };
    updateMutation.mutate(
      { processId, subjectId: subject.id, body },
      { onSuccess: () => onDone(), onError: setError }
    );
  }

  return (
    <EntityDialogShell
      description={subject.name}
      dialogId="subject-edit"
      onClose={onDone}
      title={`${dict.action.edit} ${dict.entity.subject.singular.toLowerCase()}`}
    >
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
    </EntityDialogShell>
  );
}