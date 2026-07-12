import { ActionButton, mapRepartoError, RepartoDisabledReason, RowActions } from "../shared.js";
import type { Dict } from "../shared.js";
import type { ProcessTeacherPublic, TeacherProfilePublic } from "../../../../schemas.js";
import { DataTable, type DataTableColumn } from "../../data-table.js";

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
  dict, rows, error, isError, isLoading, hasActiveForm, createReason,
  teacherName, onCreate, onEdit, onDelete
}: ParticipantsListProps) {
  const statusLabel = (participant: ProcessTeacherPublic) =>
    dict.entity.processParticipant.status[participant.status];
  const columns: DataTableColumn<ProcessTeacherPublic>[] = [
    { id: "teacher", label: dict.field.teacher, value: (participant) => teacherName(participant.teacher_profile_id) },
    {
      id: "actions",
      label: dict.table.actions,
      value: (participant) => `${teacherName(participant.teacher_profile_id)} ${dict.table.actions}`,
      hideable: false,
      sortable: false,
      cell: (participant) => (
        <RowActions>
          <ActionButton action="edit" disabled={hasActiveForm} label={dict.action.edit} onClick={() => onEdit(participant)} row />
          <ActionButton action="delete" disabled={hasActiveForm} label={dict.action.delete} onClick={() => onDelete(participant)} row />
        </RowActions>
      )
    },
    { id: "available_hours", label: dict.field.availableHours, value: (participant) => participant.available_hours },
    { id: "status", label: dict.field.status, value: statusLabel }
  ];
  const statuses = [...new Set(rows.map(statusLabel))].sort((a, b) => a.localeCompare(b));

  return (
    <>
      <h2 className="sr-only">{dict.entity.processParticipant.plural}</h2>
      <DataTable
        addButton={
          <>
            <ActionButton action="create" disabled={hasActiveForm} disabledReason={createReason ?? undefined} label={dict.action.create} onClick={onCreate} />
            <RepartoDisabledReason reason={createReason} />
          </>
        }
        columns={columns}
        data={rows}
        emptyLabel={dict.table.noResults}
        filter={{ label: dict.field.status, options: statuses, value: statusLabel }}
        labels={{
          columns: dict.table.columns,
          filter: dict.table.all,
          firstPage: dict.table.firstPage,
          lastPage: dict.table.lastPage,
          nextPage: dict.table.nextPage,
          page: (current, total) => `${dict.table.page} ${current} / ${total}`,
          previousPage: dict.table.previousPage,
          rowsPerPage: dict.table.rowsPerPage,
          search: dict.table.searchParticipants
        }}
        rowAttributes={(participant) => ({
          "data-participant-id": participant.id,
          "data-participant-status": participant.status,
          "data-teacher-profile-id": participant.teacher_profile_id
        })}
        rowKey={(participant) => participant.id}
        rowName="participant"
        searchFields={[(participant) => teacherName(participant.teacher_profile_id)]}
        tableName="participants"
      />
      {isLoading ? (
        <section data-reparto-state="loading">{dict.table.loading}</section>
      ) : null}
      {isError ? (
        <section data-reparto-state="error">
          {mapRepartoError(error).formError?.message ?? dict.table.noResults}
        </section>
      ) : null}
    </>
  );
}

export type TeacherRosterLookup = (id: string) => string;
export type TeacherProfileList = TeacherProfilePublic[];
