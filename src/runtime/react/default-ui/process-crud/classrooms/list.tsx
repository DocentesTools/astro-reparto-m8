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
import type { TeachingGroupPublic } from "../../../../schemas.js";

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
}: ClassroomsListProps) {
  return (
    <>
      <CrudHeader
        createLabel={dict.action.create}
        canCreate={!hasActiveForm}
        createReason={createReason}
        entityLabel={dict.entity.classroom.plural}
        onCreate={onCreate}
      />
      <ul className="space-y-2 text-sm text-foreground" data-reparto-table="classrooms">
        {rows.length === 0 && !isLoading && !isError ? (
          <EmptyRow label={dict.table.noResults} />
        ) : (
          rows.map((group) => (
            <RowShell
              rowAttr="classroom"
              idAttr="data-classroom-id"
              idValue={group.id}
              key={group.id}
              extras={{
                "data-classroom-stage": group.stage,
                "data-classroom-grade": String(group.grade)
              }}
            >
              <RowHeader
                label={group.label}
                labelAttr="classroom-label"
                caption={`${group.stage} · ${group.group_code}`}
              />
              <RowActions>
                <ActionButton
                  action="edit"
                  disabled={hasActiveForm}
                  label={dict.action.edit}
                  onClick={() => onEdit(group)}
                  row
                />
                <ActionButton
                  action="delete"
                  disabled={hasActiveForm}
                  label={dict.action.delete}
                  onClick={() => onDelete(group)}
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
        label={dict.entity.classroom.plural}
      />
    </>
  );
}