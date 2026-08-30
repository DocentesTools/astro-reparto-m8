import {
  ActionButton,
  QueryState,
  RowActions,
  useRepartoCanAct,
  type Dict
} from "../shared.js";
import type {
  GroupSubjectPublic,
  SubjectPublic,
  TeachingGroupPublic
} from "../../../../schemas.js";
import { DataTable, type DataTableColumn } from "../../data-table.js";

export type GroupSubjectMatrixListProps = {
  dict: Dict;
  rows: GroupSubjectPublic[];
  subjects: SubjectPublic[];
  teachingGroups: TeachingGroupPublic[];
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  hasActiveForm: boolean;
  onEdit: (cell: GroupSubjectPublic) => void;
};

/**
 * The matrix as a flat cell list.
 *
 * A true two-dimensional grid would have to render every (group, subject) pair
 * whether or not a cell exists, and an absent cell is not a zero — it is the
 * statement that the subject is not taught to that group. Listing the cells
 * that exist says exactly what the service holds.
 */
export function GroupSubjectMatrixList({
  dict,
  rows,
  subjects,
  teachingGroups,
  error,
  isError,
  isLoading,
  hasActiveForm,
  onEdit
}: GroupSubjectMatrixListProps) {
  // Matrix writes are department-head-only (§21.3), so below `ADMIN` the row
  // action is absent rather than disabled; the cells themselves stay readable,
  // because a `READER` is entitled to the data (§21.4).
  const canAct = useRepartoCanAct("groupSubjects");
  if (isLoading || isError) {
    return (
      <QueryState
        dict={dict}
        error={error}
        isError={isError}
        isLoading={isLoading}
        label={dict.groupSubjectMatrix.pageTitle}
      />
    );
  }

  const groupLabels = new Map(
    teachingGroups.map((group) => [group.id, group.label])
  );
  const subjectNames = new Map(
    subjects.map((subject) => [subject.id, subject.name])
  );
  const inherited = dict.groupSubjectMatrix.inherited;
  const teachingGroupOf = (cell: GroupSubjectPublic) =>
    groupLabels.get(cell.teaching_group_id) ?? cell.teaching_group_id;
  const subjectOf = (cell: GroupSubjectPublic) =>
    subjectNames.get(cell.subject_id) ?? cell.subject_id;

  const columns: DataTableColumn<GroupSubjectPublic>[] = [
    { id: "teachingGroup", label: dict.field.teachingGroup, value: teachingGroupOf },
    { id: "subject", label: dict.field.subject, value: subjectOf },
    ...(canAct
      ? [
          {
            id: "actions",
            label: dict.table.actions,
            value: (cell: GroupSubjectPublic) =>
              `${teachingGroupOf(cell)} ${dict.table.actions}`,
            hideable: false,
            sortable: false,
            cell: (cell: GroupSubjectPublic) => (
              <RowActions>
                <ActionButton
                  action="edit"
                  disabled={hasActiveForm}
                  label={dict.action.edit}
                  onClick={() => onEdit(cell)}
                  row
                />
              </RowActions>
            )
          } satisfies DataTableColumn<GroupSubjectPublic>
        ]
      : []),
    {
      id: "group-hours",
      label: dict.groupSubjectBulk.groupHours,
      // An empty hour column is "inherit the subject default", never zero —
      // the two are different instructions to the planner (§20.10).
      value: (cell) => cell.group_weekly_hours ?? inherited
    },
    {
      id: "teacher-hours",
      label: dict.groupSubjectBulk.teacherHours,
      value: (cell) => cell.teacher_weekly_hours_per_position ?? inherited
    },
    {
      id: "teacher-count",
      label: dict.groupSubjectBulk.teacherCount,
      value: (cell) => cell.required_teacher_count
    }
  ];

  return (
    <>
      <h2 className="sr-only">{dict.groupSubjectMatrix.pageTitle}</h2>
      <DataTable
        columns={columns}
        data={rows}
        emptyLabel={dict.groupSubjectMatrix.empty}
        labels={{
          columns: dict.table.columns,
          filter: dict.table.all,
          firstPage: dict.table.firstPage,
          lastPage: dict.table.lastPage,
          nextPage: dict.table.nextPage,
          page: (current, total) => `${dict.table.page} ${current} / ${total}`,
          previousPage: dict.table.previousPage,
          rowsPerPage: dict.table.rowsPerPage,
          search: dict.groupSubjectMatrix.search
        }}
        rowAttributes={(cell) => ({
          "data-group-subject-id": cell.id,
          "data-group-subject-teaching-group-id": cell.teaching_group_id,
          "data-group-subject-subject-id": cell.subject_id
        })}
        rowKey={(cell) => cell.id}
        rowName="group-subject"
        searchFields={[teachingGroupOf, subjectOf]}
        tableName="group-subjects"
      />
    </>
  );
}
