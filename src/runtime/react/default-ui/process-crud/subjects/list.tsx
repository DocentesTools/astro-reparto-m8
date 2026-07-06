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
import type { SubjectPublic } from "../../../../schemas.js";

export type SubjectsListProps = {
  dict: Dict;
  rows: SubjectPublic[];
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  hasActiveForm: boolean;
  createReason: string | null;
  onCreate: () => void;
  onEdit: (subject: SubjectPublic) => void;
  onDelete: (subject: SubjectPublic) => void;
};

export function SubjectsList({
  dict,
  rows,
  error,
  isError,
  isLoading,
  hasActiveForm,
  createReason,
  onCreate,
  onEdit,
  onDelete
}: SubjectsListProps) {
  return (
    <>
      <CrudHeader
        createLabel={dict.action.create}
        canCreate={!hasActiveForm}
        createReason={createReason}
        entityLabel={dict.entity.subject.plural}
        onCreate={onCreate}
      />
      <ul className="space-y-2 text-sm text-foreground" data-reparto-table="subjects">
        {rows.length === 0 && !isLoading && !isError ? (
          <EmptyRow label={dict.table.noResults} />
        ) : (
          rows.map((subject) => (
            <RowShell
              rowAttr="subject"
              idAttr="data-subject-id"
              idValue={subject.id}
              key={subject.id}
            >
              <RowHeader
                label={subject.name}
                labelAttr="subject-name"
                caption={subject.stage ?? undefined}
              />
              <RowActions>
                <ActionButton
                  action="edit"
                  disabled={hasActiveForm}
                  label={dict.action.edit}
                  onClick={() => onEdit(subject)}
                  row
                />
                <ActionButton
                  action="delete"
                  disabled={hasActiveForm}
                  label={dict.action.delete}
                  onClick={() => onDelete(subject)}
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
        label={dict.entity.subject.plural}
      />
    </>
  );
}