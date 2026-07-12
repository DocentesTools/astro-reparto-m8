import { ActionButton, mapRepartoError, RowActions } from "../shared.js";
import type { Dict } from "../shared.js";
import type { TeachingGroupPublic } from "../../../../schemas.js";
import { DataTable, type DataTableColumn } from "../../data-table.js";

export type ClassroomsListProps = {
  dict: Dict;
  rows: TeachingGroupPublic[];
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  hasActiveForm: boolean;
  createReason: string | null;
  onCreate: () => void;
  onEdit: (group: TeachingGroupPublic) => void;
  onDelete: (group: TeachingGroupPublic) => void;
};

export function ClassroomsList({
  dict, rows, error, isError, isLoading, hasActiveForm, createReason, onCreate, onEdit, onDelete
}: ClassroomsListProps) {
  const columns: DataTableColumn<TeachingGroupPublic>[] = [
    { id: "stage", label: dict.field.stage, value: (group) => group.stage },
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
  const stages = [...new Set(rows.map((group) => group.stage))].sort((a, b) => a.localeCompare(b));

  return (
    <>
      <h2 className="sr-only">{dict.entity.classroom.plural}</h2>
      <DataTable
        addButton={<ActionButton action="create" disabled={hasActiveForm} disabledReason={createReason ?? undefined} label={dict.action.create} onClick={onCreate} />}
        columns={columns}
        data={rows}
        emptyLabel={dict.table.noResults}
        filter={{ label: dict.field.stage, options: stages, value: (group) => group.stage }}
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
          "data-classroom-stage": group.stage,
          "data-classroom-grade": String(group.grade)
        })}
        rowKey={(group) => group.id}
        rowName="classroom"
        searchFields={[(group) => group.stage, (group) => group.group_code, (group) => group.label]}
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
