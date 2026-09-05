import { useState } from "react";

import { ActionButton, RepartoRouteGuard, resolveProcessId, Shell, useDict, useRepartoCanAct, WithSelectedProcess, type EntityViewProps } from "../shared.js";
import { useRepartoClassroomStages, useRepartoTeachingGroups } from "../../../hooks.js";
import type { TeachingGroupPublic } from "../../../../schemas.js";

import { TeachingGroupsList } from "./list.js";
import { TeachingGroupAdd } from "./add.js";
import { TeachingGroupEdit } from "./edit.js";
import { TeachingGroupDelete } from "./delete.js";
import { TeachingGroupBulk } from "./bulk.js";
import { TeachingGroupBulkDelete } from "./bulk-delete.js";
import { RepartoToastHost } from "../../../ui/toast-notification.js";

export function RepartoTeachingGroupsView({ config, locale, processId }: EntityViewProps) {
  return (
    <Shell config={config}>
      <RepartoRouteGuard locale={locale} processId={processId} route="teachingGroups">
        <WithSelectedProcess locale={locale} processId={processId}>
          {(resolvedId) => (
            <RepartoTeachingGroupsContent locale={locale} processId={resolvedId} />
          )}
        </WithSelectedProcess>
      </RepartoRouteGuard>
    </Shell>
  );
}

function RepartoTeachingGroupsContent({ locale, processId }: EntityViewProps) {
  const dict = useDict(locale);
  const canAct = useRepartoCanAct("teachingGroups");
  const query = useRepartoTeachingGroups(processId);
  const stagesQuery = useRepartoClassroomStages();
  const stages = stagesQuery.data?.data ?? [];
  const rows = query.data?.data ?? [];
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<TeachingGroupPublic | null>(null);
  const [deleting, setDeleting] = useState<TeachingGroupPublic | null>(null);
  const [bulk, setBulk] = useState(false);
  const [deletingSelected, setDeletingSelected] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const hasProcess = Boolean(resolveProcessId(processId));
  const createReason = !hasProcess ? dict.disabled.noProcess : null;
  const selectedGroups = rows.filter((group) => selectedIds.has(group.id));
  const currentSelectedIds = new Set(selectedGroups.map((group) => group.id));
  const hasActiveForm = adding || bulk || deletingSelected || Boolean(editing) || Boolean(deleting);

  return (
    <main
      className="not-content flex w-full max-w-none flex-col gap-4 text-foreground"
      data-reparto-route="teaching-groups"
      data-reparto-group="process"
    >
      <RepartoToastHost />
      {canAct ? (
        <div
          className="flex justify-end gap-2 pb-4"
          data-reparto-actions="teaching-groups"
        >
          <ActionButton
            action="bulk-create"
            disabled={hasActiveForm || stages.length === 0}
            label={dict.teachingGroupBulk.action}
            onClick={() => setBulk(true)}
          />
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
      ) : null}
      <section
        className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
        data-reparto-panel="teaching-groups"
      >
        <TeachingGroupsList
          dict={dict}
          rows={rows}
          error={query.error}
          isError={query.isError}
          isLoading={query.isLoading}
          hasActiveForm={hasActiveForm}
          onDeleteSelected={() => setDeletingSelected(true)}
          onSelectedIdsChange={setSelectedIds}
          selectedIds={currentSelectedIds}
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
          <TeachingGroupAdd dict={dict} processId={processId ?? ""} stages={stages} onDone={() => setAdding(false)} />
        ) : null}
        {editing ? (
          <TeachingGroupEdit
            dict={dict}
            processId={processId ?? ""}
            group={editing}
            stages={stages}
            onDone={() => setEditing(null)}
          />
        ) : null}
        {bulk ? <TeachingGroupBulk dict={dict} processId={processId ?? ""} stages={stages} onDone={() => setBulk(false)} /> : null}
        {deletingSelected ? (
          <TeachingGroupBulkDelete
            dict={dict}
            groups={selectedGroups}
            processId={processId ?? ""}
            onDone={() => {
              setDeletingSelected(false);
              setSelectedIds(new Set());
            }}
          />
        ) : null}
        {deleting ? (
          <TeachingGroupDelete
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
