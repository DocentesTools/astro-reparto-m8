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
import {
  useCreateRepartoHourRequirement,
  useCreateRepartoSubject,
  useCreateRepartoTeachingGroup,
  useRepartoClassroomStages,
  useRepartoSubjects,
  useRepartoTeachingGroups
} from "../../../hooks.js";
import type {
  HourRequirementCreateInput,
  RequirementType,
  SubjectPublic,
  TeachingGroupPublic
} from "../../../../schemas.js";

const REQUIREMENT_TYPES: RequirementType[] = [
  "ordinary",
  "reinforcement",
  "split_group",
  "optional",
  "bilingual",
  "other"
];

export type RequirementAddProps = {
  dict: Dict;
  processId: string;
  onDone: () => void;
};

export function RequirementAdd({ dict, processId, onDone }: RequirementAddProps) {
  const createMutation = useCreateRepartoHourRequirement();
  const classroomsQuery = useRepartoTeachingGroups(processId);
  const subjectsQuery = useRepartoSubjects(processId);
  const classrooms = classroomsQuery.data?.data ?? [];
  const subjects = subjectsQuery.data?.data ?? [];

  const [mapped, setError, clearError] = useMappedError();
  const [teachingGroupId, setTeachingGroupId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [requiredHours, setRequiredHours] = useState("");
  const [requirementType, setRequirementType] = useState<RequirementType>("ordinary");
  const [flags, setFlags] = useState("");
  const [notes, setNotes] = useState("");
  const [inlineCreate, setInlineCreate] = useState<"classroom" | "subject" | null>(null);

  const hoursNum = Number.parseFloat(requiredHours);
  const hoursValid = Number.isFinite(hoursNum) && hoursNum > 0;
  const canSave =
    teachingGroupId.trim() !== "" &&
    subjectId.trim() !== "" &&
    hoursValid &&
    !createMutation.isPending;

  function handleSubmit(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (!canSave) return;
    clearError();
    const body: HourRequirementCreateInput = {
      teaching_group_id: teachingGroupId,
      subject_id: subjectId,
      required_hours: hoursNum,
      requirement_type: requirementType,
      flags: flags.trim() || null,
      notes: notes.trim() || null
    };
    createMutation.mutate(
      { processId, body },
      { onSuccess: () => onDone(), onError: setError }
    );
  }

  return (
    <EntityDialogShell
      description={dict.entity.hourRequirement.plural}
      dialogId="requirement-create"
      onClose={onDone}
      title={`${dict.action.create} ${dict.entity.hourRequirement.singular.toLowerCase()}`}
    >
    <FormPanelShell formAttr="requirement" mode="create" onSubmit={handleSubmit}>
      <FormGrid>
        <SelectField
          field="teaching-group"
          fieldErrorKey="classroom"
          label={dict.field.classroom}
          value={teachingGroupId}
          placeholder={dict.field.classroom}
          options={classrooms.map((c) => ({ value: c.id, label: c.label }))}
          createNewLabel={dict.picker.createNew}
          onCreateNew={() => setInlineCreate("classroom")}
          onChange={setTeachingGroupId}
          mapped={mapped}
        />
        <SelectField
          field="subject"
          fieldErrorKey="subject"
          label={dict.field.subject}
          value={subjectId}
          placeholder={dict.field.subject}
          options={subjects.map((s) => ({ value: s.id, label: s.name }))}
          createNewLabel={dict.picker.createNew}
          onCreateNew={() => setInlineCreate("subject")}
          onChange={setSubjectId}
          mapped={mapped}
        />
        <TextField
          field="required-hours"
          id="requirement-add-hours"
          label={dict.field.requiredHours}
          onChange={setRequiredHours}
          value={requiredHours}
          type="number"
          mapped={mapped}
          fieldErrorKey="requiredHours"
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
          id="requirement-add-flags"
          label={dict.field.flags}
          maxLength={500}
          onChange={setFlags}
          value={flags}
        />
        <TextField
          field="notes"
          id="requirement-add-notes"
          label={dict.field.notes}
          maxLength={2000}
          onChange={setNotes}
          value={notes}
        />
        {inlineCreate === "classroom" ? (
          <InlineClassroomCreate
            dict={dict}
            processId={processId}
            onCancel={() => setInlineCreate(null)}
            onCreate={(group) => {
              setTeachingGroupId(group.id);
              setInlineCreate(null);
            }}
          />
        ) : null}
        {inlineCreate === "subject" ? (
          <InlineSubjectCreate
            dict={dict}
            processId={processId}
            onCancel={() => setInlineCreate(null)}
            onCreate={(subject) => {
              setSubjectId(subject.id);
              setInlineCreate(null);
            }}
          />
        ) : null}
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

function InlineSubjectCreate({
  dict,
  processId,
  onCancel,
  onCreate
}: {
  dict: Dict;
  processId: string;
  onCancel: () => void;
  onCreate: (subject: SubjectPublic) => void;
}) {
  const createSubject = useCreateRepartoSubject();
  const [name, setName] = useState("");
  const canCreate = name.trim() !== "" && !createSubject.isPending;
  return (
    <div
      className="rounded-lg border bg-muted/40 p-3"
      data-reparto-inline-create="subject"
    >
      <label className="grid gap-1.5 text-sm font-medium">
        {dict.entity.subject.singular}
        <input
          className="min-h-9 rounded-md border border-input bg-background px-3 py-2 text-sm"
          data-reparto-field="subject-name"
          maxLength={150}
          onChange={(event: { target: { value: string } }) => setName(event.target.value)}
          value={name}
        />
      </label>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          className="inline-flex min-h-8 items-center justify-center rounded-md border border-primary/40 bg-background px-3 py-1.5 text-sm font-medium capitalize text-primary disabled:cursor-not-allowed"
          data-reparto-action="save-inline-subject"
          disabled={!canCreate}
          onClick={(event: { preventDefault: () => void }) => {
            event.preventDefault();
            if (!canCreate) return;
            createSubject.mutate(
              { processId, body: { name: name.trim() } },
              { onSuccess: onCreate }
            );
          }}
          type="button"
        >
          {dict.action.save}
        </button>
        <button
          className="inline-flex min-h-8 items-center justify-center rounded-md border border-primary/40 bg-background px-3 py-1.5 text-sm font-medium capitalize text-primary"
          data-reparto-action="cancel-inline-subject"
          onClick={onCancel}
          type="button"
        >
          {dict.action.cancel}
        </button>
      </div>
    </div>
  );
}

function InlineClassroomCreate({
  dict,
  processId,
  onCancel,
  onCreate
}: {
  dict: Dict;
  processId: string;
  onCancel: () => void;
  onCreate: (group: TeachingGroupPublic) => void;
}) {
  const createClassroom = useCreateRepartoTeachingGroup();
  const stages = useRepartoClassroomStages().data?.data ?? [];
  const [stageId, setStageId] = useState("");
  const [grade, setGrade] = useState("");
  const [groupCode, setGroupCode] = useState("");
  const [label, setLabel] = useState("");
  const gradeNum = Number.parseInt(grade, 10);
  const selectedStage = stages.find((item) => item.id === stageId);
  const gradeValid = Boolean(selectedStage && gradeNum >= selectedStage.min_grade && gradeNum <= selectedStage.max_grade);
  const canCreate =
    stageId !== "" &&
    gradeValid &&
    groupCode.trim() !== "" &&
    label.trim() !== "" &&
    !createClassroom.isPending;
  return (
    <div
      className="rounded-lg border bg-muted/40 p-3"
      data-reparto-inline-create="classroom"
    >
      <div className="grid gap-2">
        <select
          className="min-h-9 rounded-md border border-input bg-background px-3 py-2 text-sm"
          data-reparto-field="classroom-stage"
          onChange={(event: { target: { value: string } }) => setStageId(event.target.value)}
          value={stageId}
        ><option value="">{dict.field.stage}</option>{stages.map((item) => <option key={item.id} value={item.id}>{item.stage} — {item.label}</option>)}</select>
        <input
          className="min-h-9 rounded-md border border-input bg-background px-3 py-2 text-sm"
          data-reparto-field="classroom-grade"
          onChange={(event: { target: { value: string } }) => setGrade(event.target.value)}
          placeholder={dict.field.grade}
          value={grade}
        />
        <input
          className="min-h-9 rounded-md border border-input bg-background px-3 py-2 text-sm"
          data-reparto-field="classroom-group-code"
          maxLength={10}
          onChange={(event: { target: { value: string } }) => setGroupCode(event.target.value)}
          placeholder={dict.field.groupCode}
          value={groupCode}
        />
        <input
          className="min-h-9 rounded-md border border-input bg-background px-3 py-2 text-sm"
          data-reparto-field="classroom-label"
          maxLength={100}
          onChange={(event: { target: { value: string } }) => setLabel(event.target.value)}
          placeholder={dict.field.label}
          value={label}
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          className="inline-flex min-h-8 items-center justify-center rounded-md border border-primary/40 bg-background px-3 py-1.5 text-sm font-medium capitalize text-primary disabled:cursor-not-allowed"
          data-reparto-action="save-inline-classroom"
          disabled={!canCreate}
          onClick={(event: { preventDefault: () => void }) => {
            event.preventDefault();
            if (!canCreate) return;
            createClassroom.mutate(
              {
                processId,
                body: {
                  classroom_stage_id: stageId,
                  grade: gradeNum,
                  group_code: groupCode.trim(),
                  label: label.trim()
                }
              },
              { onSuccess: onCreate }
            );
          }}
          type="button"
        >
          {dict.action.save}
        </button>
        <button
          className="inline-flex min-h-8 items-center justify-center rounded-md border border-primary/40 bg-background px-3 py-1.5 text-sm font-medium capitalize text-primary"
          data-reparto-action="cancel-inline-classroom"
          onClick={onCancel}
          type="button"
        >
          {dict.action.cancel}
        </button>
      </div>
    </div>
  );
}
