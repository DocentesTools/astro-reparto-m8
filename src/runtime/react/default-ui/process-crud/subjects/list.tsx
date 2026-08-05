import { ActionButton, mapRepartoError, QueryState, RowActions, useRepartoCanAct } from "../shared.js";
import type { Dict } from "../shared.js";
import { formatRepartoMessage } from "../../../../i18n/index.js";
import type { SubjectPublic } from "../../../../schemas.js";
import { DataTable, type DataTableColumn } from "../../data-table.js";
import { repartoBulkDeleteButtonClass } from "../../../styles.js";

export type SubjectsListProps = {
  dict: Dict;
  rows: SubjectPublic[];
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  hasActiveForm: boolean;
  onDeleteSelected: () => void;
  onSelectedIdsChange: (selectedIds: Set<string>) => void;
  onEdit: (subject: SubjectPublic) => void;
  onDelete: (subject: SubjectPublic) => void;
  selectedIds: ReadonlySet<string>;
};

export function SubjectsList({
  dict, rows, error, isError, isLoading, hasActiveForm, onDeleteSelected,
  onSelectedIdsChange, onEdit, onDelete, selectedIds
}: SubjectsListProps) {
  // Subject create/update/delete is department-head-only (§21.3), so below
  // `ADMIN` the row actions are absent rather than disabled — the list itself
  // stays readable, because a `READER` is entitled to the data (§21.4).
  const canAct = useRepartoCanAct("subjects");
  if (isLoading || isError) {
    return <QueryState dict={dict} error={error} isError={isError} isLoading={isLoading} label={dict.entity.subject.plural} />;
  }
  const columns: DataTableColumn<SubjectPublic>[] = [
    { id: "name", label: dict.field.name, value: (subject) => subject.name },
    ...(canAct
      ? [{
          id: "actions",
          label: dict.table.actions,
          value: (subject: SubjectPublic) => `${subject.name} ${dict.table.actions}`,
          hideable: false,
          sortable: false,
          cell: (subject: SubjectPublic) => (
            <RowActions>
              <ActionButton action="edit" disabled={hasActiveForm} label={dict.action.edit} onClick={() => onEdit(subject)} row />
              <ActionButton action="delete" disabled={hasActiveForm} label={dict.action.delete} onClick={() => onDelete(subject)} row />
            </RowActions>
          )
        } satisfies DataTableColumn<SubjectPublic>]
      : []),
    {
      id: "allocation-category",
      label: dict.field.allocationCategory,
      value: (subject) => dict.option.allocationCategory[subject.allocation_category]
    },
    {
      id: "activity-type",
      label: dict.field.activityType,
      value: (subject) => dict.option.activityType[subject.activity_type]
    }
  ];
  // MAIN vs SECONDARY is the §3.5 planning distinction, so it is the filter the
  // department head needs on this list — not the deleted two-stage `stage`.
  const categories = [
    ...new Set(
      rows.map((subject) => dict.option.allocationCategory[subject.allocation_category])
    )
  ].sort((a, b) => a.localeCompare(b));
  const selectedCount = selectedIds.size;
  const deleteSelectedAction = canAct && selectedCount > 0 ? (
    <button
      className={repartoBulkDeleteButtonClass}
      data-reparto-action="delete-selected"
      disabled={hasActiveForm}
      onClick={onDeleteSelected}
      type="button"
    >
      {formatRepartoMessage(dict.subjectSelection.deleteSelected, { count: selectedCount })}
    </button>
  ) : undefined;

  return (
    <>
      <h2 className="sr-only">{dict.entity.subject.plural}</h2>
      <DataTable
        columns={columns}
        data={rows}
        emptyLabel={dict.table.noResults}
        filter={{
          label: dict.field.allocationCategory,
          options: categories,
          value: (subject) => dict.option.allocationCategory[subject.allocation_category]
        }}
        labels={{
          columns: dict.table.columns,
          filter: dict.table.all,
          firstPage: dict.table.firstPage,
          lastPage: dict.table.lastPage,
          nextPage: dict.table.nextPage,
          page: (current, total) => `${dict.table.page} ${current} / ${total}`,
          previousPage: dict.table.previousPage,
          rowsPerPage: dict.table.rowsPerPage,
          search: dict.table.searchSubjects
        }}
        rowAttributes={(subject) => ({
          "data-subject-id": subject.id,
          "data-subject-allocation-category": subject.allocation_category,
          "data-subject-activity-type": subject.activity_type
        })}
        rowKey={(subject) => subject.id}
        rowName="subject"
        searchFields={[(subject) => subject.name]}
        selection={{
          actions: deleteSelectedAction,
          onSelectedKeysChange: onSelectedIdsChange,
          selectedKeys: selectedIds,
          selectAllVisibleLabel: dict.subjectSelection.selectAllVisible,
          selectRowLabel: (subject) => formatRepartoMessage(dict.subjectSelection.selectRow, { name: subject.name })
        }}
        tableName="subjects"
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
