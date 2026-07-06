import { useState } from "react";

import { resolveProcessId, Shell, useDict, WithSelectedProcess, type EntityViewProps } from "../shared.js";
import { useRepartoTeachingGroups } from "../../../hooks.js";
import type { TeachingGroupPublic } from "../../../../schemas.js";

import { ClassroomsList } from "./list.js";
import { ClassroomAdd } from "./add.js";
import { ClassroomEdit } from "./edit.js";
import { ClassroomDelete } from "./delete.js";

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
  const rows = query.data?.data ?? [];
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<TeachingGroupPublic | null>(null);
  const [deleting, setDeleting] = useState<TeachingGroupPublic | null>(null);

  const hasProcess = Boolean(resolveProcessId(processId));
  const createReason = !hasProcess ? dict.disabled.noProcess : null;
  const hasActiveForm = adding || Boolean(editing) || Boolean(deleting);

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
          <ClassroomAdd dict={dict} processId={processId ?? ""} onDone={() => setAdding(false)} />
        ) : null}
        {editing ? (
          <ClassroomEdit
            dict={dict}
            processId={processId ?? ""}
            group={editing}
            onDone={() => setEditing(null)}
          />
        ) : null}
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