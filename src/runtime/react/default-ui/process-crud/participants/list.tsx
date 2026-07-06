import {
  ActionButton,
  CrudHeader,
  EmptyRow,
  QueryState,
  RowActions,
  RowHeader,
  RowShell
} from "../shared.js";
import type { Dict } from "../shared.js";
import type { ProcessTeacherPublic, TeacherProfilePublic } from "../../../../schemas.js";

export type ParticipantsListProps = {
  dict: Dict;
  rows: ProcessTeacherPublic[];
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  hasActiveForm: boolean;
  createReason: string | null;
  teacherName: (id: string) => string;
  onCreate: () => void;
  onEdit: (participant: ProcessTeacherPublic) => void;
  onDelete: (participant: ProcessTeacherPublic) => void;
};

export function ParticipantsList({
  dict,
  rows,
  error,
  isError,
  isLoading,
  hasActiveForm,
  createReason,
  teacherName,
  onCreate,
  onEdit,
  onDelete
}: ParticipantsListProps) {
  return (
    <>
      <CrudHeader
        createLabel={dict.action.create}
        canCreate={!hasActiveForm}
        createReason={createReason}
        entityLabel={dict.entity.processParticipant.plural}
        onCreate={onCreate}
      />
      <ul className="space-y-2 text-sm text-foreground" data-reparto-table="participants">
        {rows.length === 0 && !isLoading && !isError ? (
          <EmptyRow label={dict.table.noResults} />
        ) : (
          rows.map((participant) => (
            <RowShell
              rowAttr="participant"
              idAttr="data-participant-id"
              idValue={participant.id}
              key={participant.id}
              extras={{
                "data-participant-status": participant.status,
                "data-teacher-profile-id": participant.teacher_profile_id
              }}
            >
              <RowHeader
                label={teacherName(participant.teacher_profile_id)}
                labelAttr="participant-name"
                caption={`${dict.field.availableHours}: ${participant.available_hours}`}
              />
              <RowActions>
                <ActionButton
                  action="edit"
                  disabled={hasActiveForm}
                  label={dict.action.edit}
                  onClick={() => onEdit(participant)}
                  row
                />
                <ActionButton
                  action="delete"
                  disabled={hasActiveForm}
                  label={dict.action.delete}
                  onClick={() => onDelete(participant)}
                  row
                />
              </RowActions>
            </RowShell>
          ))
        )}
      </ul>
      <QueryState
        error={error}
        isError={isError}
        isLoading={isLoading}
        label={dict.entity.processParticipant.plural}
      />
    </>
  );
}

export type TeacherRosterLookup = (id: string) => string;
export type TeacherProfileList = TeacherProfilePublic[];