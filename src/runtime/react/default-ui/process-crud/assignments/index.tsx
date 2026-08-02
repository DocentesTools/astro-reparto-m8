import { useState } from "react";

import { formatRepartoMessage } from "../../../../i18n/index.js";
import {
  ActionButton,
  resolveProcessId,
  Shell,
  useDict,
  WithSelectedProcess,
  type EntityViewProps
} from "../shared.js";
import {
  useRepartoAssignments,
  useRepartoAssignmentValidations,
  useRepartoHourRequirements,
  useRepartoProcessTeachers,
  useRepartoSubjects,
  useRepartoTeacherProfiles,
  useRepartoTeachingActivities
} from "../../../hooks.js";
import {
  buildAssignmentSlotOptions,
  buildAssignmentTeacherOptions,
  buildReassignmentTeacherOptions
} from "../../../../ui/assignments.js";
import type {
  AssignmentPublic,
  HourRequirementPublic,
  ProcessTeacherPublic,
  SubjectPublic,
  TeacherProfilePublic,
  TeachingActivityPublic
} from "../../../../schemas.js";

import { AssignmentsList } from "./list.js";
import { AssignmentAdd } from "./add.js";
import { AssignmentEdit } from "./edit.js";
import { AssignmentUndoDialog } from "./undo.js";
import { AssignmentReassignDialog } from "./reassign.js";

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
  const subjectsQuery = useRepartoSubjects(processId);
  const activitiesQuery = useRepartoTeachingActivities(processId);
  const validationsQuery = useRepartoAssignmentValidations(processId);
  const teacherProfilesQuery = useRepartoTeacherProfiles({ limit: 100 });

  const rows = query.data?.data ?? [];
  const requirements = requirementsQuery.data?.data ?? [];
  const participants = participantsQuery.data?.data ?? [];
  const subjects = subjectsQuery.data?.data ?? [];
  const activities = activitiesQuery.data?.data ?? [];
  const teacherProfiles = teacherProfilesQuery.data?.data ?? [];
  const validations = validationsQuery.data;

  const subjectName = (id: string) =>
    subjects.find((s: SubjectPublic) => s.id === id)?.name ??
    dict.entity.subject.singular.toLowerCase();
  const requirementLabel = (id: string) => {
    const slot = requirements.find((r: HourRequirementPublic) => r.id === id);
    if (!slot) return dict.entity.hourRequirement.singular.toLowerCase();
    const activity = activities.find(
      (candidate: TeachingActivityPublic) =>
        candidate.id === slot.teaching_activity_id
    );
    const activityLabel = activity
      ? formatRepartoMessage(dict.requirements.activityLabel, {
          subject: subjectName(activity.subject_id),
          type: dict.option.activityType[activity.activity_type]
        })
      : dict.requirements.unknownActivity;
    return `${activityLabel} · ${formatRepartoMessage(dict.requirements.position, {
      position: slot.position_index + 1
    })}`;
  };
  const slotHours = (id: string) =>
    requirements.find((r: HourRequirementPublic) => r.id === id)
      ?.required_teacher_hours ?? null;
  const participantName = (id: string) => {
    const participant = participants.find((p: ProcessTeacherPublic) => p.id === id);
    if (!participant) return dict.entity.processParticipant.singular.toLowerCase();
    const profile = teacherProfiles.find(
      (t: TeacherProfilePublic) => t.id === participant.teacher_profile_id
    );
    return profile?.display_name ?? dict.entity.teacherRoster.singular.toLowerCase();
  };

  // The three-part eligibility rule lives in the framework-neutral helper, so
  // the board, the reassignment dialog and the teacher LAN panel all disable
  // the same choices for the same stated reason.
  const slots = buildAssignmentSlotOptions(requirements, rows);
  const teacherOptionsForSlot = (slotId: string) =>
    buildAssignmentTeacherOptions(participants, requirements, rows, {
      slot: slots.find((slot) => slot.slotId === slotId) ?? null
    });

  const requirementsHref = concreteProcessId
    ? `/reparto/processes/${concreteProcessId}/requirements`
    : "#";
  const participantsHref = concreteProcessId
    ? `/reparto/processes/${concreteProcessId}/participants`
    : "#";

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<AssignmentPublic | null>(null);
  const [undoing, setUndoing] = useState<AssignmentPublic | null>(null);
  const [reassigning, setReassigning] = useState<AssignmentPublic | null>(null);

  const hasProcess = Boolean(concreteProcessId);
  const assignableSlots = slots.filter((slot) => slot.canAssign);
  const createReason = !hasProcess
    ? dict.disabled.noProcess
    : assignableSlots.length === 0
      ? dict.assignments.noAssignableSlots
      : participants.length === 0
        ? dict.disabled.missingPrereq.replace(
            "{prereq}",
            dict.entity.processParticipant.singular.toLowerCase()
          )
        : null;
  const hasActiveForm =
    adding || Boolean(editing) || Boolean(undoing) || Boolean(reassigning);

  function closeDialogs() {
    setAdding(false);
    setEditing(null);
    setUndoing(null);
    setReassigning(null);
  }

  return (
    <main
      className="not-content flex w-full max-w-none flex-col gap-4 text-foreground"
      data-reparto-route="assignments"
      data-reparto-group="process"
    >
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {dict.assignments.pageTitle}
        </h1>
        <p className="text-sm text-muted-foreground">
          {dict.assignments.description}
        </p>
      </header>

      <section
        className="grid gap-4 rounded-lg border bg-card p-5 text-card-foreground shadow-sm"
        data-reparto-slot="assignment-occupancy"
      >
        <dl className="grid gap-3 sm:grid-cols-3">
          {[
            ["slots", dict.assignments.metric.slots, slots.length],
            [
              "assigned",
              dict.assignments.metric.assigned,
              slots.filter((slot) => slot.disabledReason === "slot_occupied").length
            ],
            ["available", dict.assignments.metric.available, assignableSlots.length]
          ].map(([key, label, value]) => (
            <div
              className="rounded-md border bg-muted/30 p-3"
              data-assignment-metric={key}
              key={key}
            >
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
        <div
          data-assignment-final-ready={validations ? String(validations.is_final_ready) : ""}
          data-reparto-slot="assignment-validations"
        >
          <h2 className="text-sm font-semibold">{dict.assignments.validationsTitle}</h2>
          {validations ? (
            <>
              <p className="text-sm text-muted-foreground">
                {formatRepartoMessage(dict.assignments.validationsSummary, {
                  blocking: validations.blocking_count,
                  warnings: validations.warning_count
                })}
              </p>
              <ul className="mt-2 grid gap-1 text-sm">
                {validations.messages.map((message) => (
                  <li
                    data-validation-code={message.code}
                    data-validation-severity={message.severity}
                    key={`${message.code}-${message.entity_id ?? "process"}`}
                  >
                    {message.message}
                  </li>
                ))}
              </ul>
              {validations.messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {dict.assignments.noValidations}
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {validationsQuery.isLoading
                ? dict.assignments.validationsLoading
                : dict.assignments.validationsUnavailable}
            </p>
          )}
        </div>
      </section>

      <div className="flex justify-end gap-2 pb-4" data-reparto-actions="assignments">
        <ActionButton
          action="create"
          disabled={hasActiveForm || createReason !== null}
          disabledReason={createReason ?? undefined}
          label={dict.assignments.assignAction}
          onClick={() => {
            closeDialogs();
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
          error={query.error}
          hasActiveForm={hasActiveForm}
          isError={query.isError}
          isLoading={query.isLoading}
          onEditNotes={(assignment) => {
            closeDialogs();
            setEditing(assignment);
          }}
          onReassign={(assignment) => {
            closeDialogs();
            setReassigning(assignment);
          }}
          onUndo={(assignment) => {
            closeDialogs();
            setUndoing(assignment);
          }}
          participantName={participantName}
          requirementLabel={requirementLabel}
          rows={rows}
          slotHours={slotHours}
        />
        {adding ? (
          <AssignmentAdd
            dict={dict}
            onDone={() => setAdding(false)}
            participantName={participantName}
            participantsHref={participantsHref}
            processId={processId ?? ""}
            requirementLabel={requirementLabel}
            requirementsHref={requirementsHref}
            slots={slots}
            teacherOptionsForSlot={teacherOptionsForSlot}
          />
        ) : null}
        {editing ? (
          <AssignmentEdit
            assignment={editing}
            dict={dict}
            onDone={() => setEditing(null)}
            participantName={participantName(editing.process_teacher_id)}
            processId={processId ?? ""}
            requirementLabel={requirementLabel(editing.hour_requirement_id)}
          />
        ) : null}
        {reassigning ? (
          <AssignmentReassignDialog
            assignment={reassigning}
            candidates={buildReassignmentTeacherOptions(
              reassigning,
              participants,
              requirements,
              rows
            )}
            dict={dict}
            onDone={() => setReassigning(null)}
            participantName={participantName}
            processId={processId ?? ""}
            requirementLabel={requirementLabel(reassigning.hour_requirement_id)}
          />
        ) : null}
        {undoing ? (
          <AssignmentUndoDialog
            assignment={undoing}
            dict={dict}
            onDone={() => setUndoing(null)}
            participantName={participantName(undoing.process_teacher_id)}
            processId={processId ?? ""}
            requirementLabel={requirementLabel(undoing.hour_requirement_id)}
          />
        ) : null}
      </section>
    </main>
  );
}
