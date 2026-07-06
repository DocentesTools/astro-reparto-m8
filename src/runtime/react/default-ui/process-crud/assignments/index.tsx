import { useState } from "react";

import { resolveProcessId, Shell, useDict, WithSelectedProcess, type EntityViewProps } from "../shared.js";
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
  const hasActiveForm = adding || Boolean(editing) || Boolean(deleting);

  return (
    <main
      className="not-content mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 text-foreground"
      data-reparto-route="assignments"
      data-reparto-group="process"
    >
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
          createReason={createReason}
          requirementLabel={requirementLabel}
          participantName={participantName}
          onCreate={() => {
            setEditing(null);
            setDeleting(null);
            setAdding(true);
          }}
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