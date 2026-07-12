import { ActionButton, mapRepartoError, RepartoDisabledReason, RowActions } from "../shared.js";
import type { Dict } from "../shared.js";
import type {
  HourRequirementPublic,
  SubjectPublic,
  TeachingGroupPublic
} from "../../../../schemas.js";
import { DataTable, type DataTableColumn } from "../../data-table.js";

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
  onEdit: (requirement: HourRequirementPublic) => void;
  onDelete: (requirement: HourRequirementPublic) => void;
};

export function RequirementsList({
  dict, rows, error, isError, isLoading, hasActiveForm, createReason,
  classroomLabel, subjectName, onCreate, onEdit, onDelete
}: RequirementsListProps) {
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
