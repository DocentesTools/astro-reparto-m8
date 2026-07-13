import { useState } from "react";

import { formatRepartoMessage } from "../../../../i18n/index.js";
import type {
  ClassroomStagePublic,
  RequirementType,
  SubjectPublic,
  TeachingGroupPublic
} from "../../../../schemas.js";
import { useCreateRepartoHourRequirement } from "../../../hooks.js";
import { repartoToast } from "../../../ui/toast-notification.js";
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

const REQUIREMENT_TYPES: RequirementType[] = [
  "ordinary",
  "reinforcement",
  "split_group",
  "optional",
  "bilingual",
  "other"
];

export function RequirementBulk({
  dict,
  processId,
  subjects,
  stages,
  classrooms,
  onDone
}: {
  dict: Dict;
  processId: string;
  subjects: SubjectPublic[];
  stages: ClassroomStagePublic[];
  classrooms: TeachingGroupPublic[];
  onDone: () => void;
}) {
  const createMutation = useCreateRepartoHourRequirement();
  const [mapped, setError, clear] = useMappedError();
  const [subjectId, setSubjectId] = useState("");
  const [requiredHours, setRequiredHours] = useState("");
  const [stageId, setStageId] = useState("");
  const [gradeStart, setGradeStart] = useState("");
  const [gradeEnd, setGradeEnd] = useState("");
  const [requirementType, setRequirementType] = useState<RequirementType>("ordinary");
  const [flags, setFlags] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const hoursNum = Number.parseFloat(requiredHours);
  const hoursValid = Number.isFinite(hoursNum) && hoursNum > 0;
  const startNum = Number.parseInt(gradeStart, 10);
  const endNum = Number.parseInt(gradeEnd, 10);
  const rangeValid = Number.isInteger(startNum) && Number.isInteger(endNum) && startNum <= endNum;

  const matches = stageId && rangeValid
    ? classrooms.filter(
        (group) =>
          group.classroom_stage_id === stageId &&
          group.grade >= startNum &&
          group.grade <= endNum
      )
    : [];

  const valid = Boolean(
    subjectId &&
    hoursValid &&
    stageId &&
    rangeValid &&
    matches.length > 0 &&
    !submitting
  );

  async function submit(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (!valid) return;
    clear();
    setSubmitting(true);
    let created = 0;
    let failed = 0;
    let lastError: unknown = null;
    for (const group of matches) {
      try {
        await createMutation.mutateAsync({
          processId,
          body: {
            teaching_group_id: group.id,
            subject_id: subjectId,
            required_hours: hoursNum,
            requirement_type: requirementType,
            flags: flags.trim() || null,
            notes: notes.trim() || null
          }
        });
        created += 1;
      } catch (error) {
        failed += 1;
        lastError = error;
      }
    }
    setSubmitting(false);
    if (created > 0) {
      repartoToast.success(formatRepartoMessage(dict.requirementBulk.created, { count: created }));
    }
    if (failed > 0) {
      setError(lastError);
      repartoToast.error(
        dict.requirementBulk.createError,
        formatRepartoMessage(dict.requirementBulk.createErrorCount, { count: failed })
      );
      return;
    }
    onDone();
  }

  return (
    <EntityDialogShell
      description={dict.requirementBulk.description}
      dialogId="requirement-bulk"
      onClose={onDone}
      title={dict.requirementBulk.title}
    >
      <FormPanelShell formAttr="requirement-bulk" mode="create" onSubmit={submit}>
        <FormGrid>
          <SelectField
            field="subject"
            label={dict.field.subject}
            value={subjectId}
            placeholder={dict.field.subject}
            options={subjects.map((s) => ({ value: s.id, label: s.name }))}
            onChange={setSubjectId}
          />
          <TextField
            field="required-hours"
            label={dict.field.requiredHours}
            value={requiredHours}
            onChange={setRequiredHours}
            type="number"
          />
          <SelectField
            field="stage"
            label={dict.field.stage}
            value={stageId}
            placeholder={dict.field.stage}
            options={stages.map((item) => ({ value: item.id, label: `${item.stage} — ${item.label}` }))}
            onChange={setStageId}
          />
          <TextField
            field="grade-start"
            label={dict.requirementBulk.gradeStart}
            value={gradeStart}
            onChange={setGradeStart}
            type="number"
          />
          <TextField
            field="grade-end"
            label={dict.requirementBulk.gradeEnd}
            value={gradeEnd}
            onChange={setGradeEnd}
            type="number"
          />
          <SelectField
            field="requirement-type"
            label={dict.field.requirementType}
            value={requirementType}
            placeholder={dict.field.requirementType}
            options={REQUIREMENT_TYPES.map((value) => ({ value, label: dict.option.requirementType[value] }))}
            onChange={(value) => setRequirementType(value as RequirementType)}
          />
          <TextField
            field="flags"
            label={dict.field.flags}
            maxLength={500}
            value={flags}
            onChange={setFlags}
          />
          <TextField
            field="notes"
            label={dict.field.notes}
            maxLength={2000}
            value={notes}
            onChange={setNotes}
          />
          <ul data-reparto-bulk-preview="">
            {matches.length > 0
              ? matches.map((group) => <li key={group.id}>{group.label}</li>)
              : <li data-reparto-bulk-preview-empty="">{dict.requirementBulk.noMatches}</li>}
          </ul>
          <SaveCancelRow
            canSave={valid}
            isPending={submitting}
            saveLabel={dict.action.save}
            cancelLabel={dict.action.cancel}
            onSubmit={() => submit({ preventDefault: () => undefined })}
            onCancel={onDone}
            mapped={mapped}
          />
        </FormGrid>
      </FormPanelShell>
    </EntityDialogShell>
  );
}
