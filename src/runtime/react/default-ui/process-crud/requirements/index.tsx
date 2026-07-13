import { useState } from "react";

import { resolveProcessId, Shell, useDict, WithSelectedProcess, type EntityViewProps } from "../shared.js";
import {
  useRepartoHourRequirements,
  useRepartoSubjects,
  useRepartoTeachingGroups
} from "../../../hooks.js";
import type {
  HourRequirementPublic,
  SubjectPublic,
  TeachingGroupPublic
} from "../../../../schemas.js";

import { RequirementsList } from "./list.js";
import { RequirementAdd } from "./add.js";
import { RequirementEdit } from "./edit.js";
import { RequirementDelete } from "./delete.js";
import { RequirementBulkDelete } from "./bulk-delete.js";

export function RepartoHourRequirementsView({ config, locale, processId }: EntityViewProps) {
  return (
    <Shell config={config}>
      <WithSelectedProcess locale={locale} processId={processId}>
        {(resolvedId) => (
          <RepartoRequirementsContent locale={locale} processId={resolvedId} />
        )}
      </WithSelectedProcess>
    </Shell>
  );
}

function RepartoRequirementsContent({ locale, processId }: EntityViewProps) {
  const dict = useDict(locale);
  const query = useRepartoHourRequirements(processId);
  const classroomsQuery = useRepartoTeachingGroups(processId);
  const subjectsQuery = useRepartoSubjects(processId);
  const rows = query.data?.data ?? [];
  const classrooms = classroomsQuery.data?.data ?? [];
  const subjects = subjectsQuery.data?.data ?? [];

  const classroomLabel = (id: string) =>
    classrooms.find((c: TeachingGroupPublic) => c.id === id)?.label ?? dict.entity.classroom.singular.toLowerCase();
  const subjectName = (id: string) =>
    subjects.find((s: SubjectPublic) => s.id === id)?.name ?? dict.entity.subject.singular.toLowerCase();

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<HourRequirementPublic | null>(null);
  const [deleting, setDeleting] = useState<HourRequirementPublic | null>(null);
  const [deletingSelected, setDeletingSelected] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const hasProcess = Boolean(resolveProcessId(processId));
  const noClassrooms = classrooms.length === 0 && subjects.length === 0;
  const createReason = !hasProcess
    ? dict.disabled.noProcess
    : noClassrooms
      ? dict.disabled.missingPrereq.replace(
          "{prereq}",
          `${dict.entity.classroom.singular.toLowerCase()} / ${dict.entity.subject.singular.toLowerCase()}`
        )
      : null;
  const selectedRequirements = rows.filter((requirement) => selectedIds.has(requirement.id));
  const currentSelectedIds = new Set(selectedRequirements.map((requirement) => requirement.id));
  const hasActiveForm = adding || deletingSelected || Boolean(editing) || Boolean(deleting);

  return (
    <main
      className="not-content flex w-full max-w-none flex-col gap-4 text-foreground"
      data-reparto-route="requirements"
      data-reparto-group="process"
    >
      <section
        className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
        data-reparto-panel="requirements"
      >
        <RequirementsList
          dict={dict}
          rows={rows}
          error={query.error}
          isError={query.isError}
          isLoading={query.isLoading}
          hasActiveForm={hasActiveForm}
          createReason={createReason}
          classroomLabel={classroomLabel}
          subjectName={subjectName}
          onDeleteSelected={() => setDeletingSelected(true)}
          onSelectedIdsChange={setSelectedIds}
          selectedIds={currentSelectedIds}
          onCreate={() => {
            setEditing(null);
            setDeleting(null);
            setAdding(true);
          }}
          onEdit={(requirement) => {
            setAdding(false);
            setDeleting(null);
            setEditing(requirement);
          }}
          onDelete={(requirement) => {
            setAdding(false);
            setEditing(null);
            setDeleting(requirement);
          }}
        />
        {adding ? (
          <RequirementAdd dict={dict} processId={processId ?? ""} onDone={() => setAdding(false)} />
        ) : null}
        {editing ? (
          <RequirementEdit
            dict={dict}
            processId={processId ?? ""}
            requirement={editing}
            classroomLabel={classroomLabel(editing.teaching_group_id)}
            subjectName={subjectName(editing.subject_id)}
            onDone={() => setEditing(null)}
          />
        ) : null}
        {deletingSelected ? (
          <RequirementBulkDelete
            dict={dict}
            requirements={selectedRequirements}
            processId={processId ?? ""}
            onDone={() => {
              setDeletingSelected(false);
              setSelectedIds(new Set());
            }}
          />
        ) : null}
        {deleting ? (
          <RequirementDelete
            dict={dict}
            processId={processId ?? ""}
            requirement={deleting}
            classroomLabel={classroomLabel(deleting.teaching_group_id)}
            subjectName={subjectName(deleting.subject_id)}
            onDone={() => setDeleting(null)}
          />
        ) : null}
      </section>
    </main>
  );
}
