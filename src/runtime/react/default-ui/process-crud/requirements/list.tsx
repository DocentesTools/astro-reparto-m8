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
import type {
  HourRequirementPublic,
  SubjectPublic,
  TeachingGroupPublic
} from "../../../../schemas.js";

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
  dict,
  rows,
  error,
  isError,
  isLoading,
  hasActiveForm,
  createReason,
  classroomLabel,
  subjectName,
  onCreate,
  onEdit,
  onDelete
}: RequirementsListProps) {
  return (
    <>
      <CrudHeader
        createLabel={dict.action.create}
        canCreate={!hasActiveForm}
        createReason={createReason}
        entityLabel={dict.entity.hourRequirement.plural}
        onCreate={onCreate}
      />
      <ul className="space-y-2 text-sm text-foreground" data-reparto-table="requirements">
        {rows.length === 0 && !isLoading && !isError ? (
          <EmptyRow label={dict.table.noResults} />
        ) : (
          rows.map((requirement) => (
            <RowShell
              rowAttr="requirement"
              idAttr="data-requirement-id"
              idValue={requirement.id}
              key={requirement.id}
              extras={{
                "data-requirement-type": requirement.requirement_type,
                "data-requirement-hours": String(requirement.required_hours)
              }}
            >
              <RowHeader
                label={`${classroomLabel(requirement.teaching_group_id)} · ${subjectName(requirement.subject_id)}`}
                labelAttr="requirement-title"
                caption={`${dict.field.requiredHours}: ${requirement.required_hours}`}
              />
              <RowActions>
                <ActionButton
                  action="edit"
                  disabled={hasActiveForm}
                  label={dict.action.edit}
                  onClick={() => onEdit(requirement)}
                  row
                />
                <ActionButton
                  action="delete"
                  disabled={hasActiveForm}
                  label={dict.action.delete}
                  onClick={() => onDelete(requirement)}
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
        label={dict.entity.hourRequirement.plural}
      />
    </>
  );
}

export type RequirementsFkData = {
  classrooms: TeachingGroupPublic[];
  subjects: SubjectPublic[];
};