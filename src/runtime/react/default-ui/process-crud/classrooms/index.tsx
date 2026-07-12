import { useState } from "react";

import { ActionButton, resolveProcessId, Shell, useDict, WithSelectedProcess, type EntityViewProps } from "../shared.js";
import { useRepartoClassroomStages, useRepartoTeachingGroups } from "../../../hooks.js";
import type { TeachingGroupPublic } from "../../../../schemas.js";

import { ClassroomsList } from "./list.js";
import { ClassroomAdd } from "./add.js";
import { ClassroomEdit } from "./edit.js";
import { ClassroomDelete } from "./delete.js";
import { ClassroomBulk } from "./bulk.js";
import { RepartoToastHost } from "../../../ui/toast-notification.js";

export function RepartoClassroomsView({ config, locale, processId }: EntityViewProps) {
  return (
    <Shell config={config}>
      <WithSelectedProcess locale={locale} processId={processId}>
        {(resolvedId) => (
          <RepartoClassroomsContent locale={locale} processId={resolvedId} />
        )}
      </WithSelectedProcess>
    </Shell>
  );
}

function RepartoClassroomsContent({ locale, processId }: EntityViewProps) {
  const dict = useDict(locale);
  const query = useRepartoTeachingGroups(processId);
  const stagesQuery = useRepartoClassroomStages();
  const stages = stagesQuery.data?.data ?? [];
  const rows = query.data?.data ?? [];
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<TeachingGroupPublic | null>(null);
  const [deleting, setDeleting] = useState<TeachingGroupPublic | null>(null);
  const [bulk, setBulk] = useState(false);

  const hasProcess = Boolean(resolveProcessId(processId));
  const createReason = !hasProcess ? dict.disabled.noProcess : null;
  const hasActiveForm = adding || bulk || Boolean(editing) || Boolean(deleting);

  return (
    <main
      className="not-content mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 text-foreground"
      data-reparto-route="classrooms"
      data-reparto-group="process"
    >
      <section
        className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
        data-reparto-panel="classrooms"
      >
        <RepartoToastHost />
        <ActionButton action="bulk-create" disabled={hasActiveForm || stages.length === 0} label={dict.classroomBulk.action} onClick={() => setBulk(true)} />
        <ClassroomsList
          dict={dict}
          rows={rows}
          error={query.error}
          isError={query.isError}
          isLoading={query.isLoading}
          hasActiveForm={hasActiveForm}
          createReason={createReason}
          onCreate={() => {
            setEditing(null);
            setDeleting(null);
            setAdding(true);
          }}
          onEdit={(group) => {
            setAdding(false);
            setDeleting(null);
            setEditing(group);
          }}
          onDelete={(group) => {
            setAdding(false);
            setEditing(null);
            setDeleting(group);
          }}
        />
        {adding ? (
          <ClassroomAdd dict={dict} processId={processId ?? ""} stages={stages} onDone={() => setAdding(false)} />
        ) : null}
        {editing ? (
          <ClassroomEdit
            dict={dict}
            processId={processId ?? ""}
            group={editing}
            stages={stages}
            onDone={() => setEditing(null)}
          />
        ) : null}
        {bulk ? <ClassroomBulk dict={dict} processId={processId ?? ""} stages={stages} onDone={() => setBulk(false)} /> : null}
        {deleting ? (
          <ClassroomDelete
            dict={dict}
            processId={processId ?? ""}
            group={deleting}
            onDone={() => setDeleting(null)}
          />
        ) : null}
      </section>
    </main>
  );
}
