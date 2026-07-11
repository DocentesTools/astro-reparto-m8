import { useState } from "react";

import {
  FormGrid,
  FormPanelShell,
  SaveCancelRow,
  SelectField,
  TextField,
  useMappedError,
  type Dict
} from "../shared.js";
import {
  useCreateRepartoProcessTeacher,
  useCreateRepartoTeacherProfile,
  useRepartoTeacherProfiles
} from "../../../hooks.js";
import type {
  ProcessTeacherCreateInput,
  ProcessTeacherStatus,
  TeacherProfilePublic
} from "../../../../schemas.js";

export type ParticipantAddProps = {
  dict: Dict;
  processId: string;
  onDone: () => void;
};

export function ParticipantAdd({ dict, processId, onDone }: ParticipantAddProps) {
  const createMutation = useCreateRepartoProcessTeacher();
  const teacherProfilesQuery = useRepartoTeacherProfiles({ limit: 100 });
  const teacherProfiles = teacherProfilesQuery.data?.data ?? [];
  const [mapped, setError, clearError] = useMappedError();
  const [teacherProfileId, setTeacherProfileId] = useState("");
  const [availableHours, setAvailableHours] = useState("");
  const [participatesInSelection, setParticipatesInSelection] = useState(false);
  const [status, setStatus] = useState<ProcessTeacherStatus>("active");
  const [inlineCreateRoster, setInlineCreateRoster] = useState(false);

  const hoursNum = Number.parseFloat(availableHours);
  const hoursValid = Number.isFinite(hoursNum) && hoursNum >= 0;
  const canSave =
    teacherProfileId.trim() !== "" && hoursValid && !createMutation.isPending;

  function handleSubmit(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (!canSave) return;
    clearError();
    const body: ProcessTeacherCreateInput = {
      teacher_profile_id: teacherProfileId,
      available_hours: hoursNum,
      participates_in_selection: participatesInSelection,
      status
    };
    createMutation.mutate(
      { processId, body },
      { onSuccess: () => onDone(), onError: setError }
    );
  }

  return (
    <FormPanelShell formAttr="participant" mode="create" onSubmit={handleSubmit}>
      <FormGrid>
        <SelectField
          field="teacher-profile"
          fieldErrorKey="teacher"
          label={dict.field.teacher}
          value={teacherProfileId}
          placeholder={dict.field.teacher}
          options={teacherProfiles.map((t) => ({
            value: t.id,
            label: t.display_name
          }))}
          createNewLabel={dict.picker.createNew}
          onCreateNew={() => setInlineCreateRoster(true)}
          onChange={setTeacherProfileId}
          mapped={mapped}
        />
        <TextField
          field="available-hours"
          id="participant-add-hours"
          label={dict.field.availableHours}
          onChange={setAvailableHours}
          value={availableHours}
          type="number"
          mapped={mapped}
          fieldErrorKey="availableHours"
        />
        <label className="grid gap-1.5 text-sm font-medium">
          <span>{dict.field.participatesInSelection}</span>
          <input
            checked={participatesInSelection}
            data-reparto-field="participates-in-selection"
            onChange={(event: { target: { checked: boolean } }) =>
              setParticipatesInSelection(event.target.checked)
            }
            type="checkbox"
          />
        </label>
        <SelectField
          field="status"
          label={dict.field.status}
          value={status}
          options={[
            { value: "active", label: dict.entity.processParticipant.status.active },
            { value: "inactive", label: dict.entity.processParticipant.status.inactive }
          ]}
          onChange={(value) => setStatus(value as ProcessTeacherStatus)}
        />
        {inlineCreateRoster ? (
          <InlineTeacherRosterCreate
            dict={dict}
            onCancel={() => setInlineCreateRoster(false)}
            onCreate={(profile: TeacherProfilePublic) => {
              setTeacherProfileId(profile.id);
              setInlineCreateRoster(false);
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
  );
}

function InlineTeacherRosterCreate({
  dict,
  onCancel,
  onCreate
}: {
  dict: Dict;
  onCancel: () => void;
  onCreate: (profile: TeacherProfilePublic) => void;
}) {
  const createTeacherProfile = useCreateRepartoTeacherProfile();
  const [displayName, setDisplayName] = useState("");
  const canCreate = displayName.trim() !== "" && !createTeacherProfile.isPending;
  return (
    <div
      className="rounded-lg border bg-muted/40 p-3"
      data-reparto-inline-create="teacher-roster"
    >
      <label className="grid gap-1.5 text-sm font-medium">
        {dict.entity.teacherRoster.singular}
        <input
          className="min-h-9 rounded-md border border-input bg-background px-3 py-2 text-sm"
          data-reparto-field="teacher-display-name"
          maxLength={150}
          onChange={(event: { target: { value: string } }) => setDisplayName(event.target.value)}
          value={displayName}
        />
      </label>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          className="inline-flex min-h-8 items-center justify-center rounded-md border border-primary/40 bg-background px-3 py-1.5 text-sm font-medium capitalize text-primary disabled:cursor-not-allowed"
          data-reparto-action="save-inline-teacher"
          disabled={!canCreate}
          onClick={(event: { preventDefault: () => void }) => {
            event.preventDefault();
            if (!canCreate) return;
            createTeacherProfile.mutate(
              { display_name: displayName.trim(), active: true },
              { onSuccess: onCreate }
            );
          }}
          type="button"
        >
          {dict.action.save}
        </button>
        <button
          className="inline-flex min-h-8 items-center justify-center rounded-md border border-primary/40 bg-background px-3 py-1.5 text-sm font-medium capitalize text-primary"
          data-reparto-action="cancel-inline-teacher"
          onClick={onCancel}
          type="button"
        >
          {dict.action.cancel}
        </button>
      </div>
    </div>
  );
}
