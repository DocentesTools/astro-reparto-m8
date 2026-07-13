import { ActionButton, mapRepartoError, QueryState, RowActions } from "../shared.js";
import type { Dict } from "../shared.js";
import { formatRepartoMessage } from "../../../../i18n/index.js";
import type { TeachingGroupPublic } from "../../../../schemas.js";
import { DataTable, type DataTableColumn } from "../../data-table.js";
import { repartoBulkDeleteButtonClass } from "../../../styles.js";

export type ClassroomsListProps = {
  dict: Dict;
  rows: TeachingGroupPublic[];
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  hasActiveForm: boolean;
  onDeleteSelected: () => void;
  onSelectedIdsChange: (selectedIds: Set<string>) => void;
  onEdit: (group: TeachingGroupPublic) => void;
  onDelete: (group: TeachingGroupPublic) => void;
  selectedIds: ReadonlySet<string>;
};

export function ClassroomsList({
  dict, rows, error, isError, isLoading, hasActiveForm, onDeleteSelected, onSelectedIdsChange, onEdit, onDelete, selectedIds
}: ClassroomsListProps) {
  if (isLoading || isError) {
    return <QueryState dict={dict} error={error} isError={isError} isLoading={isLoading} label={dict.entity.classroom.plural} />;
  }
  const columns: DataTableColumn<TeachingGroupPublic>[] = [
    { id: "stage", label: dict.field.stage, value: (group) => group.classroom_stage.stage },
    {
      id: "actions",
      label: dict.table.actions,
      value: (group) => `${group.label} ${dict.table.actions}`,
      hideable: false,
      sortable: false,
      cell: (group) => (
        <RowActions>
          <ActionButton action="edit" disabled={hasActiveForm} label={dict.action.edit} onClick={() => onEdit(group)} row />
          <ActionButton action="delete" disabled={hasActiveForm} label={dict.action.delete} onClick={() => onDelete(group)} row />
        </RowActions>
      )
    },
    { id: "grade", label: dict.field.grade, value: (group) => group.grade },
    { id: "group_code", label: dict.field.groupCode, value: (group) => group.group_code },
    { id: "label", label: dict.field.label, value: (group) => group.label }
  ];
  const stages = [...new Set(rows.map((group) => group.classroom_stage.stage))].sort((a, b) => a.localeCompare(b));
  const selectedCount = selectedIds.size;
  const deleteSelectedAction = selectedCount > 0 ? (
    <button
      className={repartoBulkDeleteButtonClass}
      data-reparto-action="delete-selected"
      disabled={hasActiveForm}
      onClick={onDeleteSelected}
      type="button"
    >
      {formatRepartoMessage(dict.classroomSelection.deleteSelected, { count: selectedCount })}
    </button>
  ) : undefined;

  return (
    <>
      <h2 className="sr-only">{dict.entity.classroom.plural}</h2>
      <DataTable
        columns={columns}
        data={rows}
        emptyLabel={dict.table.noResults}
        filter={{ label: dict.field.stage, options: stages, value: (group) => group.classroom_stage.stage }}
        labels={{
          columns: dict.table.columns,
          filter: dict.table.all,
          firstPage: dict.table.firstPage,
          lastPage: dict.table.lastPage,
          nextPage: dict.table.nextPage,
          page: (current, total) => `${dict.table.page} ${current} / ${total}`,
          previousPage: dict.table.previousPage,
          rowsPerPage: dict.table.rowsPerPage,
          search: dict.table.searchClassrooms
        }}
        rowAttributes={(group) => ({
          "data-classroom-id": group.id,
          "data-classroom-stage": group.classroom_stage.stage,
          "data-classroom-grade": String(group.grade)
        })}
        rowKey={(group) => group.id}
        rowName="classroom"
        searchFields={[(group) => group.classroom_stage.stage, (group) => group.group_code, (group) => group.label]}
        selection={{
          actions: deleteSelectedAction,
          onSelectedKeysChange: onSelectedIdsChange,
          selectedKeys: selectedIds,
          selectAllVisibleLabel: dict.classroomSelection.selectAllVisible,
          selectRowLabel: (group) => formatRepartoMessage(dict.classroomSelection.selectRow, { name: group.label })
        }}
        tableName="classrooms"
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
