import { ActionButton, mapRepartoError, QueryState, RepartoDisabledReason, RowActions } from "../shared.js";
import type { Dict } from "../shared.js";
import { formatRepartoMessage } from "../../../../i18n/index.js";
import type {
  HourRequirementPublic,
  SubjectPublic,
  TeachingGroupPublic
} from "../../../../schemas.js";
import { DataTable, type DataTableColumn } from "../../data-table.js";
import { repartoBulkDeleteButtonClass } from "../../../styles.js";

export type RequirementsListProps = {
  dict: Dict;
  rows: HourRequirementPublic[];
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  hasActiveForm: boolean;
  createReason: string | null;
  classroomLabel: (id: string) => string;
  subjectName: (id: string) => string;
  onCreate: () => void;
  onDeleteSelected: () => void;
  onSelectedIdsChange: (selectedIds: Set<string>) => void;
  onEdit: (requirement: HourRequirementPublic) => void;
  onDelete: (requirement: HourRequirementPublic) => void;
  selectedIds: ReadonlySet<string>;
};

export function RequirementsList({
  dict, rows, error, isError, isLoading, hasActiveForm, createReason,
  classroomLabel, subjectName, onCreate, onDeleteSelected, onSelectedIdsChange,
  onEdit, onDelete, selectedIds
}: RequirementsListProps) {
  if (isLoading || isError) {
    return <QueryState dict={dict} error={error} isError={isError} isLoading={isLoading} label={dict.entity.hourRequirement.plural} />;
  }
  const typeLabel = (requirement: HourRequirementPublic) =>
    dict.option.requirementType[requirement.requirement_type];
  const columns: DataTableColumn<HourRequirementPublic>[] = [
    { id: "classroom", label: dict.field.classroom, value: (requirement) => classroomLabel(requirement.teaching_group_id) },
    {
      id: "actions",
      label: dict.table.actions,
      value: (requirement) => `${classroomLabel(requirement.teaching_group_id)} ${dict.table.actions}`,
      hideable: false,
      sortable: false,
      cell: (requirement) => (
        <RowActions>
          <ActionButton action="edit" disabled={hasActiveForm} label={dict.action.edit} onClick={() => onEdit(requirement)} row />
          <ActionButton action="delete" disabled={hasActiveForm} label={dict.action.delete} onClick={() => onDelete(requirement)} row />
        </RowActions>
      )
    },
    { id: "subject", label: dict.field.subject, value: (requirement) => subjectName(requirement.subject_id) },
    { id: "required_hours", label: dict.field.requiredHours, value: (requirement) => requirement.required_hours },
    { id: "requirement_type", label: dict.field.requirementType, value: typeLabel }
  ];
  const types = [...new Set(rows.map(typeLabel))].sort((a, b) => a.localeCompare(b));
  const selectedCount = selectedIds.size;
  const deleteSelectedAction = selectedCount > 0 ? (
    <button
      className={repartoBulkDeleteButtonClass}
      data-reparto-action="delete-selected"
      disabled={hasActiveForm}
      onClick={onDeleteSelected}
      type="button"
    >
      {formatRepartoMessage(dict.requirementSelection.deleteSelected, { count: selectedCount })}
    </button>
  ) : undefined;

  return (
    <>
      <h2 className="sr-only">{dict.entity.hourRequirement.plural}</h2>
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
        filter={{ label: dict.field.requirementType, options: types, value: typeLabel }}
        labels={{
          columns: dict.table.columns,
          filter: dict.table.all,
          firstPage: dict.table.firstPage,
          lastPage: dict.table.lastPage,
          nextPage: dict.table.nextPage,
          page: (current, total) => `${dict.table.page} ${current} / ${total}`,
          previousPage: dict.table.previousPage,
          rowsPerPage: dict.table.rowsPerPage,
          search: dict.table.searchRequirements
        }}
        rowAttributes={(requirement) => ({
          "data-requirement-id": requirement.id,
          "data-requirement-type": requirement.requirement_type,
          "data-requirement-hours": String(requirement.required_hours)
        })}
        rowKey={(requirement) => requirement.id}
        rowName="requirement"
        searchFields={[
          (requirement) => classroomLabel(requirement.teaching_group_id),
          (requirement) => subjectName(requirement.subject_id)
        ]}
        selection={{
          actions: deleteSelectedAction,
          onSelectedKeysChange: onSelectedIdsChange,
          selectedKeys: selectedIds,
          selectAllVisibleLabel: dict.requirementSelection.selectAllVisible,
          selectRowLabel: (requirement) => formatRepartoMessage(dict.requirementSelection.selectRow, {
            name: `${classroomLabel(requirement.teaching_group_id)} · ${subjectName(requirement.subject_id)}`
          })
        }}
        tableName="requirements"
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

export type RequirementsFkData = {
  classrooms: TeachingGroupPublic[];
  subjects: SubjectPublic[];
};
