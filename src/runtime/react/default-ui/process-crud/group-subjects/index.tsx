import { useState } from "react";

import {
  ActionButton,
  RepartoRouteGuard,
  resolveProcessId,
  Shell,
  useDict,
  useRepartoCanAct,
  WithSelectedProcess,
  type EntityViewProps
} from "../shared.js";
import {
  useRepartoGroupSubjects,
  useRepartoSubjects,
  useRepartoTeachingGroups
} from "../../../hooks.js";
import { formatRepartoMessage } from "../../../../i18n/index.js";
import type { GroupSubjectPublic } from "../../../../schemas.js";
import { repartoFieldCaptionClass } from "../../../styles.js";
import { RepartoToastHost } from "../../../ui/toast-notification.js";

import { GroupSubjectBulkEditor } from "./bulk.js";
import { GroupSubjectCellForm } from "./cell-form.js";
import { GroupSubjectMatrixList } from "./list.js";

/**
 * The group-subject matrix on its own route (§8.2 step 6).
 *
 * The matrix is the input to main-subject materialization (§20.10) and to
 * secondary-activity link validation: with no cell, Stage 2 has nothing to
 * work on even once the teaching plan exists. The bulk editor that fills it
 * was package-owned from the start but mounted nowhere, and `fa-ui-m8` mounts
 * package starter routes only — so the route is the package's job, not the
 * host's.
 */
export function RepartoGroupSubjectsView({
  config,
  locale,
  processId
}: EntityViewProps) {
  return (
    <Shell config={config}>
      <RepartoRouteGuard locale={locale} route="groupSubjects">
        <WithSelectedProcess locale={locale} processId={processId}>
          {(resolvedId) => (
            <RepartoGroupSubjectsContent locale={locale} processId={resolvedId} />
          )}
        </WithSelectedProcess>
      </RepartoRouteGuard>
    </Shell>
  );
}

function RepartoGroupSubjectsContent({ locale, processId }: EntityViewProps) {
  const dict = useDict(locale);
  const canAct = useRepartoCanAct("groupSubjects");
  const cellsQuery = useRepartoGroupSubjects(processId);
  const subjectsQuery = useRepartoSubjects(processId);
  const groupsQuery = useRepartoTeachingGroups(processId);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<GroupSubjectPublic | null>(null);

  const cells = cellsQuery.data?.data ?? [];
  const subjects = subjectsQuery.data?.data ?? [];
  const teachingGroups = groupsQuery.data?.data ?? [];
  const hasProcess = Boolean(resolveProcessId(processId));
  const hasActiveForm = adding || Boolean(editing);
  // A cell names one classroom and one subject, so neither list may be empty:
  // the refusal states which prerequisite is missing rather than offering a
  // select with nothing in it.
  const missingPrereq =
    teachingGroups.length === 0
      ? dict.entity.classroom.plural
      : subjects.length === 0
        ? dict.entity.subject.plural
        : null;
  const createReason = !hasProcess
    ? dict.disabled.noProcess
    : missingPrereq
      ? formatRepartoMessage(dict.disabled.missingPrereq, {
          prereq: missingPrereq.toLowerCase()
        })
      : null;

  return (
    <main
      className="not-content flex w-full max-w-none flex-col gap-4 text-foreground"
      data-reparto-route="group-subjects"
      data-reparto-group="process"
    >
      <RepartoToastHost />
      <header>
        <h1 className="font-semibold">{dict.groupSubjectMatrix.pageTitle}</h1>
        <p className={repartoFieldCaptionClass}>
          {dict.groupSubjectMatrix.description}
        </p>
      </header>
      {canAct ? (
        <div
          className="flex justify-end gap-2"
          data-reparto-actions="group-subjects"
        >
          <ActionButton
            action="create"
            disabled={hasActiveForm || Boolean(createReason)}
            disabledReason={createReason ?? undefined}
            label={dict.groupSubjectMatrix.addAction}
            onClick={() => {
              setEditing(null);
              setAdding(true);
            }}
          />
        </div>
      ) : (
        <p className={repartoFieldCaptionClass} data-reparto-state="read-only">
          {dict.groupSubjectMatrix.readOnly}
        </p>
      )}
      <section
        className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
        data-reparto-panel="group-subjects"
      >
        <GroupSubjectMatrixList
          dict={dict}
          error={cellsQuery.error}
          hasActiveForm={hasActiveForm}
          isError={cellsQuery.isError}
          isLoading={cellsQuery.isLoading}
          onEdit={(cell) => {
            setAdding(false);
            setEditing(cell);
          }}
          rows={cells}
          subjects={subjects}
          teachingGroups={teachingGroups}
        />
        {cells.length === 0 && !cellsQuery.isLoading && !cellsQuery.isError ? (
          <p
            className={repartoFieldCaptionClass}
            data-reparto-state="empty-matrix"
            role="status"
          >
            {dict.groupSubjectMatrix.emptyHint}
          </p>
        ) : null}
      </section>
      {/*
        The bulk editor is the tool that actually fills an empty matrix, and an
        empty matrix is the state this route exists to resolve — so it is
        mounted, not hidden behind a control. Below the write floor it is
        withheld entirely: it offers nothing but mutations.
      */}
      {canAct && hasProcess ? (
        <GroupSubjectBulkEditor
          locale={locale}
          processId={processId ?? ""}
          subjects={subjects}
          teachingGroups={teachingGroups}
        />
      ) : null}
      {adding ? (
        <GroupSubjectCellForm
          dict={dict}
          onDone={() => setAdding(false)}
          processId={processId ?? ""}
          subjects={subjects}
          teachingGroups={teachingGroups}
        />
      ) : null}
      {editing ? (
        <GroupSubjectCellForm
          cell={editing}
          dict={dict}
          onDone={() => setEditing(null)}
          processId={processId ?? ""}
          subjects={subjects}
          teachingGroups={teachingGroups}
        />
      ) : null}
    </main>
  );
}
