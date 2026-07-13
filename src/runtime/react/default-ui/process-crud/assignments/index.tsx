import { useState } from "react";

import { ActionButton, resolveProcessId, Shell, useDict, WithSelectedProcess, type EntityViewProps } from "../shared.js";
import {
  useRepartoAssignments,
  useRepartoHourRequirements,
  useRepartoProcessTeachers,
  useRepartoSubjects,
  useRepartoTeacherProfiles,
  useRepartoTeachingGroups
} from "../../../hooks.js";
import type {
  AssignmentPublic,
  HourRequirementPublic,
  ProcessTeacherPublic,
  SubjectPublic,
  TeacherProfilePublic,
  TeachingGroupPublic
} from "../../../../schemas.js";

import { AssignmentsList } from "./list.js";
import { AssignmentAdd } from "./add.js";
import { AssignmentEdit } from "./edit.js";
import { AssignmentDelete } from "./delete.js";
import { AssignmentBulkDelete } from "./bulk-delete.js";

export function RepartoAssignmentsView({ config, locale, processId }: EntityViewProps) {
  return (
    <Shell config={config}>
      <WithSelectedProcess locale={locale} processId={processId}>
        {(resolvedId) => (
          <RepartoAssignmentsContent locale={locale} processId={resolvedId} />
        )}
      </WithSelectedProcess>
    </Shell>
  );
}

function RepartoAssignmentsContent({ locale, processId }: EntityViewProps) {
  const dict = useDict(locale);
  const concreteProcessId = resolveProcessId(processId);
  const query = useRepartoAssignments(processId);
  const requirementsQuery = useRepartoHourRequirements(processId);
  const participantsQuery = useRepartoProcessTeachers(processId);
  const classroomsQuery = useRepartoTeachingGroups(processId);
  const subjectsQuery = useRepartoSubjects(processId);
  const teacherProfilesQuery = useRepartoTeacherProfiles({ limit: 100 });

  const rows = query.data?.data ?? [];
  const requirements = requirementsQuery.data?.data ?? [];
  const participants = participantsQuery.data?.data ?? [];
  const classrooms = classroomsQuery.data?.data ?? [];
  const subjects = subjectsQuery.data?.data ?? [];
  const teacherProfiles = teacherProfilesQuery.data?.data ?? [];

  const classroomLabel = (id: string) =>
    classrooms.find((c: TeachingGroupPublic) => c.id === id)?.label ?? dict.entity.classroom.singular.toLowerCase();
  const subjectName = (id: string) =>
    subjects.find((s: SubjectPublic) => s.id === id)?.name ?? dict.entity.subject.singular.toLowerCase();
  const requirementLabel = (id: string) => {
    const req = requirements.find((r: HourRequirementPublic) => r.id === id);
    if (!req) return dict.entity.hourRequirement.singular.toLowerCase();
    return `${classroomLabel(req.teaching_group_id)} · ${subjectName(req.subject_id)}`;
  };
  const participantName = (id: string) => {
    const participant = participants.find((p: ProcessTeacherPublic) => p.id === id);
    if (!participant) return dict.entity.processParticipant.singular.toLowerCase();
    const profile = teacherProfiles.find((t: TeacherProfilePublic) => t.id === participant.teacher_profile_id);
    return profile?.display_name ?? dict.entity.teacherRoster.singular.toLowerCase();
  };

  const requirementsHref = concreteProcessId
    ? `/reparto/processes/${concreteProcessId}/requirements`
    : "#";
  const participantsHref = concreteProcessId
    ? `/reparto/processes/${concreteProcessId}/participants`
    : "#";

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<AssignmentPublic | null>(null);
  const [deleting, setDeleting] = useState<AssignmentPublic | null>(null);
  const [deletingSelected, setDeletingSelected] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const hasProcess = Boolean(resolveProcessId(processId));
  const noReqs = requirements.length === 0;
  const noParticipants = participants.length === 0;
  const createReason = !hasProcess
    ? dict.disabled.noProcess
    : noReqs || noParticipants
      ? dict.disabled.missingPrereq.replace(
          "{prereq}",
          `${dict.entity.hourRequirement.singular.toLowerCase()} / ${dict.entity.processParticipant.singular.toLowerCase()}`
        )
      : null;
  const selectedAssignments = rows.filter((assignment) => selectedIds.has(assignment.id));
  const currentSelectedIds = new Set(selectedAssignments.map((assignment) => assignment.id));
  const hasActiveForm = adding || deletingSelected || Boolean(editing) || Boolean(deleting);

  return (
    <main
      className="not-content flex w-full max-w-none flex-col gap-4 text-foreground"
      data-reparto-route="assignments"
      data-reparto-group="process"
    >
      <div
        className="flex justify-end gap-2 pb-4"
        data-reparto-actions="assignments"
      >
        <ActionButton
          action="create"
          disabled={hasActiveForm}
          disabledReason={createReason ?? undefined}
          label={dict.action.create}
          onClick={() => {
            setEditing(null);
            setDeleting(null);
            setAdding(true);
          }}
        />
      </div>
      <section
        className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
        data-reparto-panel="assignments"
      >
        <AssignmentsList
          dict={dict}
          rows={rows}
          error={query.error}
          isError={query.isError}
          isLoading={query.isLoading}
          hasActiveForm={hasActiveForm}
          requirementLabel={requirementLabel}
          participantName={participantName}
          onDeleteSelected={() => setDeletingSelected(true)}
          onSelectedIdsChange={setSelectedIds}
          selectedIds={currentSelectedIds}
          onEdit={(assignment) => {
            setAdding(false);
            setDeleting(null);
            setEditing(assignment);
          }}
          onDelete={(assignment) => {
            setAdding(false);
            setEditing(null);
            setDeleting(assignment);
          }}
        />
        {adding ? (
          <AssignmentAdd
            dict={dict}
            processId={processId ?? ""}
            requirementsHref={requirementsHref}
            participantsHref={participantsHref}
            requirementLabel={requirementLabel}
            participantName={participantName}
            onDone={() => setAdding(false)}
          />
        ) : null}
        {editing ? (
          <AssignmentEdit
            dict={dict}
            processId={processId ?? ""}
            assignment={editing}
            requirementLabel={requirementLabel(editing.hour_requirement_id)}
            participantName={participantName(editing.process_teacher_id)}
            onDone={() => setEditing(null)}
          />
        ) : null}
        {deletingSelected ? (
          <AssignmentBulkDelete
            dict={dict}
            assignments={selectedAssignments}
            processId={processId ?? ""}
            onDone={() => {
              setDeletingSelected(false);
              setSelectedIds(new Set());
            }}
          />
        ) : null}
        {deleting ? (
          <AssignmentDelete
            dict={dict}
            processId={processId ?? ""}
            assignment={deleting}
            requirementLabel={requirementLabel(deleting.hour_requirement_id)}
            participantName={participantName(deleting.process_teacher_id)}
            onDone={() => setDeleting(null)}
          />
        ) : null}
      </section>
    </main>
  );
}
