import { ActionButton, mapRepartoError, QueryState, RowActions } from "../shared.js";
import type { Dict } from "../shared.js";
import { formatRepartoMessage } from "../../../../i18n/index.js";
import type { ProcessTeacherPublic, TeacherProfilePublic } from "../../../../schemas.js";
import { DataTable, type DataTableColumn } from "../../data-table.js";
import { repartoBulkDeleteButtonClass } from "../../../styles.js";

export type ParticipantsListProps = {
  dict: Dict;
  rows: ProcessTeacherPublic[];
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  hasActiveForm: boolean;
  teacherName: (id: string) => string;
  onDeleteSelected: () => void;
  onSelectedIdsChange: (selectedIds: Set<string>) => void;
  onEdit: (participant: ProcessTeacherPublic) => void;
  onExtraHours: (participant: ProcessTeacherPublic) => void;
  onDelete: (participant: ProcessTeacherPublic) => void;
  selectedIds: ReadonlySet<string>;
};

export function ParticipantsList({
  dict, rows, error, isError, isLoading, hasActiveForm,
  teacherName, onDeleteSelected, onSelectedIdsChange, onEdit, onExtraHours, onDelete, selectedIds
}: ParticipantsListProps) {
  if (isLoading || isError) {
    return <QueryState dict={dict} error={error} isError={isError} isLoading={isLoading} label={dict.entity.processParticipant.plural} />;
  }
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
          <ActionButton action="extra-hours" disabled={hasActiveForm} label={dict.participants.extraHoursAction} onClick={() => onExtraHours(participant)} row />
          <ActionButton action="delete" disabled={hasActiveForm} label={dict.action.delete} onClick={() => onDelete(participant)} row />
        </RowActions>
      )
    },
    // Base and extra are shown next to the target rather than in place of it:
    // the target is the figure the assignment stage measures against, and it is
    // only trustworthy when the reader can see the two parts it came from.
    { id: "base_weekly_hours", label: dict.field.baseWeeklyHours, value: (participant) => participant.base_weekly_hours },
    { id: "extra_weekly_hours", label: dict.field.extraWeeklyHours, value: (participant) => participant.extra_weekly_hours },
    { id: "target_weekly_hours", label: dict.field.targetWeeklyHours, value: (participant) => participant.target_weekly_hours },
    {
      id: "overloaded",
      label: dict.field.overloaded,
      value: (participant) =>
        participant.is_overloaded
          ? dict.participants.overloadedYes
          : dict.participants.overloadedNo
    },
    { id: "status", label: dict.field.status, value: statusLabel }
  ];
  const statuses = [...new Set(rows.map(statusLabel))].sort((a, b) => a.localeCompare(b));
  const selectedCount = selectedIds.size;
  const deleteSelectedAction = selectedCount > 0 ? (
    <button
      className={repartoBulkDeleteButtonClass}
      data-reparto-action="delete-selected"
      disabled={hasActiveForm}
      onClick={onDeleteSelected}
      type="button"
    >
      {formatRepartoMessage(dict.participantSelection.deleteSelected, { count: selectedCount })}
    </button>
  ) : undefined;

  return (
    <>
      <h2 className="sr-only">{dict.entity.processParticipant.plural}</h2>
      <DataTable
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
          "data-participant-overloaded": participant.is_overloaded ? "true" : "false",
          "data-participant-status": participant.status,
          "data-teacher-profile-id": participant.teacher_profile_id
        })}
        rowKey={(participant) => participant.id}
        rowName="participant"
        searchFields={[(participant) => teacherName(participant.teacher_profile_id)]}
        selection={{
          actions: deleteSelectedAction,
          onSelectedKeysChange: onSelectedIdsChange,
          selectedKeys: selectedIds,
          selectAllVisibleLabel: dict.participantSelection.selectAllVisible,
          selectRowLabel: (participant) => formatRepartoMessage(dict.participantSelection.selectRow, { name: teacherName(participant.teacher_profile_id) })
        }}
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
