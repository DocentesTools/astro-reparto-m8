import { useState } from "react";

import { resolveProcessId, Shell, useDict, WithSelectedProcess, type EntityViewProps } from "../shared.js";
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
import { ParticipantDelete } from "./delete.js";
import { ParticipantBulkDelete } from "./bulk-delete.js";

export function RepartoProcessParticipantsView({ config, locale, processId }: EntityViewProps) {
  return (
    <Shell config={config}>
      <WithSelectedProcess locale={locale} processId={processId}>
        {(resolvedId) => (
          <RepartoParticipantsContent locale={locale} processId={resolvedId} />
        )}
      </WithSelectedProcess>
    </Shell>
  );
}

function RepartoParticipantsContent({ locale, processId }: EntityViewProps) {
  const dict = useDict(locale);
  const query = useRepartoProcessTeachers(processId);
  const teacherProfilesQuery = useRepartoTeacherProfiles({ limit: 100 });
  const rows = query.data?.data ?? [];
  const teacherProfiles = teacherProfilesQuery.data?.data ?? [];

  const teacherName = (id: string) =>
    teacherProfiles.find((t: TeacherProfilePublic) => t.id === id)?.display_name ??
    dict.entity.teacherRoster.singular.toLowerCase();

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<ProcessTeacherPublic | null>(null);
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
  const hasActiveForm = adding || deletingSelected || Boolean(editing) || Boolean(deleting);

  return (
    <main
      className="not-content flex w-full max-w-none flex-col gap-4 text-foreground"
      data-reparto-route="participants"
      data-reparto-group="process"
    >
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
          createReason={createReason}
          teacherName={teacherName}
          onDeleteSelected={() => setDeletingSelected(true)}
          onSelectedIdsChange={setSelectedIds}
          selectedIds={currentSelectedIds}
          onCreate={() => {
            setEditing(null);
            setDeleting(null);
            setAdding(true);
          }}
          onEdit={(participant) => {
            setAdding(false);
            setDeleting(null);
            setEditing(participant);
          }}
          onDelete={(participant) => {
            setAdding(false);
            setEditing(null);
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
