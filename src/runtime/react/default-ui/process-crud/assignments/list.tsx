import { ActionButton, mapRepartoError, QueryState, RepartoDisabledReason, RowActions } from "../shared.js";
import type { Dict } from "../shared.js";
import { formatRepartoMessage } from "../../../../i18n/index.js";
import type {
  AssignmentPublic,
  HourRequirementPublic,
  ProcessTeacherPublic,
  SubjectPublic,
  TeacherProfilePublic,
  TeachingGroupPublic
} from "../../../../schemas.js";
import { DataTable, type DataTableColumn } from "../../data-table.js";
import { repartoBulkDeleteButtonClass } from "../../../styles.js";

export type AssignmentsListProps = {
  dict: Dict;
  rows: AssignmentPublic[];
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  hasActiveForm: boolean;
  createReason: string | null;
  requirementLabel: (id: string) => string;
  participantName: (id: string) => string;
  onCreate: () => void;
  onDeleteSelected: () => void;
  onSelectedIdsChange: (selectedIds: Set<string>) => void;
  onEdit: (assignment: AssignmentPublic) => void;
  onDelete: (assignment: AssignmentPublic) => void;
  selectedIds: ReadonlySet<string>;
};

export function AssignmentsList({
  dict, rows, error, isError, isLoading, hasActiveForm, createReason,
  requirementLabel, participantName, onCreate, onDeleteSelected, onSelectedIdsChange,
  onEdit, onDelete, selectedIds
}: AssignmentsListProps) {
  if (isLoading || isError) {
    return <QueryState dict={dict} error={error} isError={isError} isLoading={isLoading} label={dict.entity.assignment.plural} />;
  }
  const statusLabel = (assignment: AssignmentPublic) =>
    assignment.status ? dict.entity.assignment.status[assignment.status] : "";
  const typeLabel = (assignment: AssignmentPublic) =>
    assignment.assignment_type ? dict.option.assignmentType[assignment.assignment_type] : "";
  const columns: DataTableColumn<AssignmentPublic>[] = [
    { id: "requirement", label: dict.field.hourRequirement, value: (assignment) => requirementLabel(assignment.hour_requirement_id) },
    {
      id: "actions",
      label: dict.table.actions,
      value: (assignment) => `${requirementLabel(assignment.hour_requirement_id)} ${dict.table.actions}`,
      hideable: false,
      sortable: false,
      cell: (assignment) => (
        <RowActions>
          <ActionButton action="edit" disabled={hasActiveForm} label={dict.action.edit} onClick={() => onEdit(assignment)} row />
          <ActionButton action="delete" disabled={hasActiveForm} label={dict.action.delete} onClick={() => onDelete(assignment)} row />
        </RowActions>
      )
    },
    { id: "participant", label: dict.field.processParticipant, value: (assignment) => participantName(assignment.process_teacher_id) },
    { id: "assigned_hours", label: dict.field.assignedHours, value: (assignment) => assignment.assigned_hours },
    { id: "assignment_type", label: dict.field.assignmentType, value: typeLabel },
    { id: "status", label: dict.field.status, value: statusLabel }
  ];
  const statuses = [...new Set(rows.map(statusLabel).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const selectedCount = selectedIds.size;
  const deleteSelectedAction = selectedCount > 0 ? (
    <button
      className={repartoBulkDeleteButtonClass}
      data-reparto-action="delete-selected"
      disabled={hasActiveForm}
      onClick={onDeleteSelected}
      type="button"
    >
      {formatRepartoMessage(dict.assignmentSelection.deleteSelected, { count: selectedCount })}
    </button>
  ) : undefined;

  return (
    <>
      <h2 className="sr-only">{dict.entity.assignment.plural}</h2>
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
          search: dict.table.searchAssignments
        }}
        rowAttributes={(assignment) => ({
          "data-assignment-id": assignment.id,
          "data-assignment-status": assignment.status ?? ""
        })}
        rowKey={(assignment) => assignment.id}
        rowName="assignment"
        searchFields={[
          (assignment) => requirementLabel(assignment.hour_requirement_id),
          (assignment) => participantName(assignment.process_teacher_id)
        ]}
        selection={{
          actions: deleteSelectedAction,
          onSelectedKeysChange: onSelectedIdsChange,
          selectedKeys: selectedIds,
          selectAllVisibleLabel: dict.assignmentSelection.selectAllVisible,
          selectRowLabel: (assignment) => formatRepartoMessage(dict.assignmentSelection.selectRow, {
            name: `${requirementLabel(assignment.hour_requirement_id)} · ${participantName(assignment.process_teacher_id)}`
          })
        }}
        tableName="assignments"
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

export type AssignmentLookup = {
  requirements: HourRequirementPublic[];
  participants: ProcessTeacherPublic[];
  classrooms: TeachingGroupPublic[];
  subjects: SubjectPublic[];
  teacherProfiles: TeacherProfilePublic[];
};
