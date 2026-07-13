import { useState } from "react";

import { resolveProcessId, Shell, useDict, WithSelectedProcess, type EntityViewProps } from "../shared.js";
import { useRepartoSubjects } from "../../../hooks.js";
import type { SubjectPublic } from "../../../../schemas.js";

import { SubjectsList } from "./list.js";
import { SubjectAdd } from "./add.js";
import { SubjectEdit } from "./edit.js";
import { SubjectDelete } from "./delete.js";
import { SubjectBulkDelete } from "./bulk-delete.js";

export function RepartoSubjectsView({ config, locale, processId }: EntityViewProps) {
  return (
    <Shell config={config}>
      <WithSelectedProcess locale={locale} processId={processId}>
        {(resolvedId) => (
          <RepartoSubjectsContent
            locale={locale}
            processId={resolvedId}
          />
        )}
      </WithSelectedProcess>
    </Shell>
  );
}

function RepartoSubjectsContent({
  locale,
  processId
}: EntityViewProps) {
  const dict = useDict(locale);
  const query = useRepartoSubjects(processId);
  const rows = query.data?.data ?? [];
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<SubjectPublic | null>(null);
  const [deleting, setDeleting] = useState<SubjectPublic | null>(null);
  const [deletingSelected, setDeletingSelected] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const hasProcess = Boolean(resolveProcessId(processId));
  const createReason = !hasProcess ? dict.disabled.noProcess : null;
  const selectedSubjects = rows.filter((subject) => selectedIds.has(subject.id));
  const currentSelectedIds = new Set(selectedSubjects.map((subject) => subject.id));
  const hasActiveForm = adding || deletingSelected || Boolean(editing) || Boolean(deleting);

  return (
    <main
      className="not-content flex w-full max-w-none flex-col gap-4 text-foreground"
      data-reparto-route="subjects"
      data-reparto-group="process"
    >
      <section
        className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
        data-reparto-panel="subjects"
      >
        <SubjectsList
          dict={dict}
          rows={rows}
          error={query.error}
          isError={query.isError}
          isLoading={query.isLoading}
          hasActiveForm={hasActiveForm}
          createReason={createReason}
          onDeleteSelected={() => setDeletingSelected(true)}
          onSelectedIdsChange={setSelectedIds}
          selectedIds={currentSelectedIds}
          onCreate={() => {
            setEditing(null);
            setDeleting(null);
            setAdding(true);
          }}
          onEdit={(subject) => {
            setAdding(false);
            setDeleting(null);
            setEditing(subject);
          }}
          onDelete={(subject) => {
            setAdding(false);
            setEditing(null);
            setDeleting(subject);
          }}
        />
        {adding ? (
          <SubjectAdd dict={dict} processId={processId ?? ""} onDone={() => setAdding(false)} />
        ) : null}
        {editing ? (
          <SubjectEdit
            dict={dict}
            processId={processId ?? ""}
            subject={editing}
            onDone={() => setEditing(null)}
          />
        ) : null}
        {deletingSelected ? (
          <SubjectBulkDelete
            dict={dict}
            subjects={selectedSubjects}
            processId={processId ?? ""}
            onDone={() => {
              setDeletingSelected(false);
              setSelectedIds(new Set());
            }}
          />
        ) : null}
        {deleting ? (
          <SubjectDelete
            dict={dict}
            processId={processId ?? ""}
            subject={deleting}
            onDone={() => setDeleting(null)}
          />
        ) : null}
      </section>
    </main>
  );
}
