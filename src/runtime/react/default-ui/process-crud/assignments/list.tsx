import { formatRepartoMessage } from "../../../../i18n/index.js";
import type { AssignmentPublic } from "../../../../schemas.js";
import { ActionButton, mapRepartoError, QueryState, RowActions } from "../shared.js";
import type { Dict } from "../shared.js";
import { DataTable, type DataTableColumn } from "../../data-table.js";
import { repartoBulkDeleteButtonClass } from "../../../styles.js";

export type AssignmentsListProps = {
  dict: Dict;
  rows: AssignmentPublic[];
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  hasActiveForm: boolean;
  requirementLabel: (id: string) => string;
  slotHours: (id: string) => string | null;
  participantName: (id: string) => string;
  onEditNotes: (assignment: AssignmentPublic) => void;
  onReassign: (assignment: AssignmentPublic) => void;
  onUndo: (assignment: AssignmentPublic) => void;
  onUndoSelected: () => void;
  onSelectedIdsChange: (selectedIds: Set<string>) => void;
  selectedIds: ReadonlySet<string>;
};

/**
 * The live occupancy table.
 *
 * There are no hour, share or override columns: a row *is* the statement that
 * one teacher covers one slot in full, so the hours shown come from the
 * generated slot and are never editable here. Cancelled rows stay visible as
 * history and carry no actions — undoing or reassigning a row that is already
 * historical is refused by the service, so the board does not offer it.
 */
export function AssignmentsList({
  dict,
  rows,
  error,
  isError,
  isLoading,
  hasActiveForm,
  requirementLabel,
  slotHours,
  participantName,
  onEditNotes,
  onReassign,
  onUndo,
  onUndoSelected,
  onSelectedIdsChange,
  selectedIds
}: AssignmentsListProps) {
  if (isLoading || isError) {
    return (
      <QueryState
        dict={dict}
        error={error}
        isError={isError}
        isLoading={isLoading}
        label={dict.entity.assignment.plural}
      />
    );
  }

  const statusLabel = (assignment: AssignmentPublic) =>
    dict.entity.assignment.status[assignment.status];
  const sourceLabel = (assignment: AssignmentPublic) =>
    dict.assignments.source[assignment.source];
  const hoursLabel = (assignment: AssignmentPublic) => {
    const hours = slotHours(assignment.hour_requirement_id);
    return hours === null
      ? dict.assignments.unknownSlotHours
      : formatRepartoMessage(dict.assignments.teacherHours, { hours });
  };
  const columns: DataTableColumn<AssignmentPublic>[] = [
    {
      id: "requirement",
      label: dict.field.hourRequirement,
      value: (assignment) => requirementLabel(assignment.hour_requirement_id)
    },
    {
      id: "actions",
      label: dict.table.actions,
      value: (assignment) =>
        `${requirementLabel(assignment.hour_requirement_id)} ${dict.table.actions}`,
      hideable: false,
      sortable: false,
      cell: (assignment) =>
        assignment.status === "active" ? (
          <RowActions>
            <ActionButton
              action="edit"
              disabled={hasActiveForm}
              label={dict.assignments.notesAction}
              onClick={() => onEditNotes(assignment)}
              row
            />
            <ActionButton
              action="reassign"
              disabled={hasActiveForm}
              label={dict.assignments.reassignAction}
              onClick={() => onReassign(assignment)}
              row
            />
            <ActionButton
              action="undo"
              disabled={hasActiveForm}
              label={dict.assignments.undoAction}
              onClick={() => onUndo(assignment)}
              row
            />
          </RowActions>
        ) : (
          <span data-reparto-slot="assignment-history">
            {dict.assignments.historyRow}
          </span>
        )
    },
    {
      id: "participant",
      label: dict.field.processParticipant,
      value: (assignment) => participantName(assignment.process_teacher_id)
    },
    { id: "teacher_hours", label: dict.assignments.hoursColumn, value: hoursLabel },
    { id: "source", label: dict.field.source, value: sourceLabel },
    { id: "status", label: dict.field.status, value: statusLabel }
  ];
  const statuses = [...new Set(rows.map(statusLabel))].sort((a, b) =>
    a.localeCompare(b)
  );
  // Only live rows can be undone, so only live rows are selectable: a
  // selection that includes history would promise an action the service
  // refuses.
  const selectedCount = selectedIds.size;
  const undoSelectedAction =
    selectedCount > 0 ? (
      <button
        className={repartoBulkDeleteButtonClass}
        data-reparto-action="undo-selected"
        disabled={hasActiveForm}
        onClick={onUndoSelected}
        type="button"
      >
        {formatRepartoMessage(dict.assignments.undoSelected, {
          count: selectedCount
        })}
      </button>
    ) : undefined;

  return (
    <>
      <h2 className="sr-only">{dict.entity.assignment.plural}</h2>
      <DataTable
        columns={columns}
        data={rows}
        emptyLabel={dict.assignments.empty}
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
          search: dict.table.searchAssignments
        }}
        rowAttributes={(assignment) => ({
          "data-assignment-id": assignment.id,
          "data-assignment-status": assignment.status,
          "data-assignment-source": assignment.source,
          "data-teaching-activity-id": assignment.teaching_activity_id
        })}
        rowKey={(assignment) => assignment.id}
        rowName="assignment"
        searchFields={[
          (assignment) => requirementLabel(assignment.hour_requirement_id),
          (assignment) => participantName(assignment.process_teacher_id)
        ]}
        selection={{
          actions: undoSelectedAction,
          onSelectedKeysChange: onSelectedIdsChange,
          selectedKeys: selectedIds,
          selectAllVisibleLabel: dict.assignments.selectAllVisible,
          selectRowLabel: (assignment) =>
            formatRepartoMessage(dict.assignments.selectRow, {
              name: `${requirementLabel(assignment.hour_requirement_id)} · ${participantName(assignment.process_teacher_id)}`
            })
        }}
        tableName="assignments"
      />
      {isError ? (
        <section data-reparto-state="error">
          {mapRepartoError(error).formError?.message ?? dict.table.noResults}
        </section>
      ) : null}
    </>
  );
}
