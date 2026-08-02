import { useState } from "react";

import { formatRepartoMessage } from "../../../../i18n/index.js";
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
import { useCreateRepartoAssignment } from "../../../hooks.js";
import type { AssignmentCreate } from "../../../../schemas.js";
import type {
  AssignmentSlotOption,
  AssignmentTeacherOption
} from "../../../../ui/assignments.js";

export type AssignmentAddProps = {
  dict: Dict;
  processId: string;
  requirementsHref: string;
  participantsHref: string;
  slots: AssignmentSlotOption[];
  teacherOptionsForSlot: (slotId: string) => AssignmentTeacherOption[];
  requirementLabel: (id: string) => string;
  participantName: (id: string) => string;
  onDone: () => void;
};

/**
 * Assign one complete slot to one participant.
 *
 * The form carries exactly the two ids the service accepts. Both pickers are
 * pre-filtered rather than validated after the fact: only free live slots are
 * offered, and only participants who may take the *selected* slot — an inactive
 * participant, one who already holds a sibling position of the same activity,
 * or one the slot would push past their target is listed with the reason it
 * cannot be chosen instead of being silently dropped, so the board explains the
 * rule rather than hiding it.
 */
export function AssignmentAdd({
  dict,
  processId,
  requirementsHref,
  participantsHref,
  slots,
  teacherOptionsForSlot,
  requirementLabel,
  participantName,
  onDone
}: AssignmentAddProps) {
  const createMutation = useCreateRepartoAssignment();
  const assignableSlots = slots.filter((slot) => slot.canAssign);
  const [mapped, setError, clearError] = useMappedError();
  // A single free slot is not a choice: preselect it so the eligible
  // participants — the decision that is actually being made — are visible at
  // once, as they are on the last position of an activity.
  const [hourRequirementId, setHourRequirementId] = useState(
    assignableSlots.length === 1 ? assignableSlots[0].slotId : ""
  );
  const [processTeacherId, setProcessTeacherId] = useState("");
  const [notes, setNotes] = useState("");

  const teacherOptions = hourRequirementId
    ? teacherOptionsForSlot(hourRequirementId)
    : [];
  const eligibleTeachers = teacherOptions.filter((option) => option.canAssign);
  const blockedTeachers = teacherOptions.filter((option) => !option.canAssign);
  const slotsEmpty = assignableSlots.length === 0;
  const teachersEmpty = hourRequirementId !== "" && eligibleTeachers.length === 0;
  const canSave =
    hourRequirementId !== "" &&
    processTeacherId !== "" &&
    !createMutation.isPending;

  function handleSubmit(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (!canSave) return;
    clearError();
    const body: AssignmentCreate = {
      hour_requirement_id: hourRequirementId,
      process_teacher_id: processTeacherId,
      notes: notes.trim() || null
    };
    createMutation.mutate(
      { processId, body },
      { onSuccess: () => onDone(), onError: setError }
    );
  }

  return (
    <EntityDialogShell
      description={dict.assignments.assignDescription}
      dialogId="assignment-create"
      onClose={onDone}
      title={dict.assignments.assignTitle}
    >
      <FormPanelShell formAttr="assignment" mode="create" onSubmit={handleSubmit}>
        <FormGrid>
          <SelectField
            disabled={slotsEmpty}
            disabledReason={slotsEmpty ? dict.assignments.noAssignableSlots : null}
            field="hour-requirement"
            fieldErrorKey="hourRequirement"
            label={dict.field.hourRequirement}
            mapped={mapped}
            missingPrereqHref={slotsEmpty ? requirementsHref : undefined}
            missingPrereqLabel={
              slotsEmpty ? dict.picker.createMissingPrerequisite : undefined
            }
            onChange={(value) => {
              setHourRequirementId(value);
              setProcessTeacherId("");
            }}
            options={assignableSlots.map((slot) => ({
              value: slot.slotId,
              label: `${requirementLabel(slot.slotId)} · ${formatRepartoMessage(
                dict.assignments.teacherHours,
                { hours: slot.teacherHours }
              )}`
            }))}
            placeholder={dict.field.hourRequirement}
            value={hourRequirementId}
          />
          <SelectField
            disabled={hourRequirementId === "" || teachersEmpty}
            disabledReason={
              hourRequirementId === ""
                ? dict.assignments.selectSlotFirst
                : teachersEmpty
                  ? dict.assignments.noEligibleTeachers
                  : null
            }
            field="process-teacher"
            fieldErrorKey="processParticipant"
            label={dict.field.processParticipant}
            mapped={mapped}
            missingPrereqHref={teachersEmpty ? participantsHref : undefined}
            missingPrereqLabel={
              teachersEmpty ? dict.picker.createMissingPrerequisite : undefined
            }
            onChange={setProcessTeacherId}
            options={eligibleTeachers.map((option) => ({
              value: option.processTeacherId,
              label: participantName(option.processTeacherId)
            }))}
            placeholder={dict.field.processParticipant}
            value={processTeacherId}
          />
          <TextField
            field="notes"
            id="assignment-add-notes"
            label={dict.field.notes}
            maxLength={1000}
            onChange={setNotes}
            value={notes}
          />
          <SaveCancelRow
            canSave={canSave}
            cancelLabel={dict.action.cancel}
            isPending={createMutation.isPending}
            mapped={mapped}
            onCancel={onDone}
            onSubmit={() => handleSubmit({ preventDefault: () => undefined })}
            saveLabel={dict.assignments.assignAction}
          />
        </FormGrid>
      </FormPanelShell>
      {blockedTeachers.length > 0 ? (
        <ul data-reparto-slot="ineligible-participants">
          {blockedTeachers.map((option) => (
            <li
              data-participant-disabled-reason={option.disabledReason ?? ""}
              data-process-teacher-id={option.processTeacherId}
              key={option.processTeacherId}
            >
              {`${participantName(option.processTeacherId)} — ${
                dict.assignments.teacherDisabled[
                  option.disabledReason ?? "participant_inactive"
                ]
              }`}
            </li>
          ))}
        </ul>
      ) : null}
    </EntityDialogShell>
  );
}
