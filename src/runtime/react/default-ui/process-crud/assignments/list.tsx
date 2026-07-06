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
  AssignmentPublic,
  HourRequirementPublic,
  ProcessTeacherPublic,
  SubjectPublic,
  TeacherProfilePublic,
  TeachingGroupPublic
} from "../../../../schemas.js";

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
  onEdit: (assignment: AssignmentPublic) => void;
  onDelete: (assignment: AssignmentPublic) => void;
};

export function AssignmentsList({
  dict,
  rows,
  error,
  isError,
  isLoading,
  hasActiveForm,
  createReason,
  requirementLabel,
  participantName,
  onCreate,
  onEdit,
  onDelete
}: AssignmentsListProps) {
  return (
    <>
      <CrudHeader
        createLabel={dict.action.create}
        canCreate={!hasActiveForm}
        createReason={createReason}
        entityLabel={dict.entity.assignment.plural}
        onCreate={onCreate}
      />
      <ul className="space-y-2 text-sm text-foreground" data-reparto-table="assignments">
        {rows.length === 0 && !isLoading && !isError ? (
          <EmptyRow label={dict.table.noResults} />
        ) : (
          rows.map((assignment) => (
            <RowShell
              rowAttr="assignment"
              idAttr="data-assignment-id"
              idValue={assignment.id}
              key={assignment.id}
              extras={{
                "data-assignment-status": assignment.status ?? ""
              }}
            >
              <RowHeader
                label={`${requirementLabel(assignment.hour_requirement_id)} · ${participantName(assignment.process_teacher_id)}`}
                labelAttr="assignment-title"
                caption={`${dict.field.assignedHours}: ${assignment.assigned_hours}`}
              />
              <RowActions>
                <ActionButton
                  action="edit"
                  disabled={hasActiveForm}
                  label={dict.action.edit}
                  onClick={() => onEdit(assignment)}
                  row
                />
                <ActionButton
                  action="delete"
                  disabled={hasActiveForm}
                  label={dict.action.delete}
                  onClick={() => onDelete(assignment)}
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
        label={dict.entity.assignment.plural}
      />
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