import { useState } from "react";

import { ActionButton, RepartoRouteGuard, resolveProcessId, Shell, useDict, useRepartoCanAct, WithSelectedProcess, type EntityViewProps } from "../shared.js";
import {
  useRepartoProcessTeachers,
  useRepartoTeacherProfiles
} from "../../../hooks.js";
import type {
  ProcessTeacherPublic,
  TeacherProfilePublic
} from "../../../../schemas.js";

import { ParticipantsList } from "./list.js";
import { ParticipantAdd } from "./add.js";
import { ParticipantEdit } from "./edit.js";
import { ParticipantExtraHours } from "./extra-hours.js";
import { ParticipantDelete } from "./delete.js";
import { ParticipantBulkDelete } from "./bulk-delete.js";

export function RepartoProcessParticipantsView({ config, locale, processId }: EntityViewProps) {
  return (
    <Shell config={config}>
      <RepartoRouteGuard locale={locale} route="participants">
        <WithSelectedProcess locale={locale} processId={processId}>
          {(resolvedId) => (
            <RepartoParticipantsContent locale={locale} processId={resolvedId} />
          )}
        </WithSelectedProcess>
      </RepartoRouteGuard>
    </Shell>
  );
}

function RepartoParticipantsContent({ locale, processId }: EntityViewProps) {
  const dict = useDict(locale);
  const canAct = useRepartoCanAct("participants");
  const query = useRepartoProcessTeachers(processId);
  const teacherProfilesQuery = useRepartoTeacherProfiles({ limit: 100 });
  const rows = query.data?.data ?? [];
  const teacherProfiles = teacherProfilesQuery.data?.data ?? [];

  const teacherName = (id: string) =>
    teacherProfiles.find((t: TeacherProfilePublic) => t.id === id)?.display_name ??
    dict.entity.teacherRoster.singular.toLowerCase();

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<ProcessTeacherPublic | null>(null);
  const [authorizing, setAuthorizing] = useState<ProcessTeacherPublic | null>(null);
  const [deleting, setDeleting] = useState<ProcessTeacherPublic | null>(null);
  const [deletingSelected, setDeletingSelected] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const hasProcess = Boolean(resolveProcessId(processId));
  const noRoster = teacherProfiles.length === 0;
  const createReason = !hasProcess
    ? dict.disabled.noProcess
    : noRoster
      ? dict.disabled.missingPrereq.replace(
          "{prereq}",
          dict.entity.teacherRoster.singular.toLowerCase()
        )
      : null;
  const selectedParticipants = rows.filter((participant) => selectedIds.has(participant.id));
  const currentSelectedIds = new Set(selectedParticipants.map((participant) => participant.id));
  const hasActiveForm =
    adding || deletingSelected || Boolean(editing) || Boolean(authorizing) || Boolean(deleting);

  return (
    <main
      className="not-content flex w-full max-w-none flex-col gap-4 text-foreground"
      data-reparto-route="participants"
      data-reparto-group="process"
    >
      {canAct ? (
        <div
          className="flex justify-end gap-2 pb-4"
          data-reparto-actions="participants"
        >
          <ActionButton
            action="create"
            disabled={hasActiveForm}
            disabledReason={createReason ?? undefined}
            label={dict.action.create}
            onClick={() => {
              setEditing(null);
              setAuthorizing(null);
              setDeleting(null);
              setAdding(true);
            }}
          />
        </div>
      ) : null}
      <section
        className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
        data-reparto-panel="participants"
      >
        <ParticipantsList
          dict={dict}
          rows={rows}
          error={query.error}
          isError={query.isError}
          isLoading={query.isLoading}
          hasActiveForm={hasActiveForm}
          teacherName={teacherName}
          onDeleteSelected={() => setDeletingSelected(true)}
          onSelectedIdsChange={setSelectedIds}
          selectedIds={currentSelectedIds}
          onEdit={(participant) => {
            setAdding(false);
            setAuthorizing(null);
            setDeleting(null);
            setEditing(participant);
          }}
          onExtraHours={(participant) => {
            setAdding(false);
            setEditing(null);
            setDeleting(null);
            setAuthorizing(participant);
          }}
          onDelete={(participant) => {
            setAdding(false);
            setEditing(null);
            setAuthorizing(null);
            setDeleting(participant);
          }}
        />
        {adding ? (
          <ParticipantAdd dict={dict} processId={processId ?? ""} onDone={() => setAdding(false)} />
        ) : null}
        {editing ? (
          <ParticipantEdit
            dict={dict}
            processId={processId ?? ""}
            participant={editing}
            teacherName={teacherName(editing.teacher_profile_id)}
            onDone={() => setEditing(null)}
          />
        ) : null}
        {authorizing ? (
          <ParticipantExtraHours
            dict={dict}
            processId={processId ?? ""}
            participant={authorizing}
            teacherName={teacherName(authorizing.teacher_profile_id)}
            onDone={() => setAuthorizing(null)}
          />
        ) : null}
        {deletingSelected ? (
          <ParticipantBulkDelete
            dict={dict}
            participants={selectedParticipants}
            processId={processId ?? ""}
            onDone={() => {
              setDeletingSelected(false);
              setSelectedIds(new Set());
            }}
          />
        ) : null}
        {deleting ? (
          <ParticipantDelete
            dict={dict}
            processId={processId ?? ""}
            participant={deleting}
            teacherName={teacherName(deleting.teacher_profile_id)}
            onDone={() => setDeleting(null)}
          />
        ) : null}
      </section>
    </main>
  );
}
