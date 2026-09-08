import { useState } from "react";

import {
  getRepartoDictionary,
  normalizeRepartoLocale,
  type RepartoDictionary,
  type RepartoLocale
} from "../../i18n/index.js";
import {
  useRepartoAcademicYears,
  useRepartoDepartments,
  useRepartoProcesses,
  useRepartoSchools,
  useRepartoSetupObservations,
  useRepartoSummary
} from "../hooks.js";
import { buildSetupChecklist } from "../../ui/index.js";
import { resolveProcessId } from "../../queryKeys.js";
import {
  SetupChecklistProgress,
  SetupChecklistSteps
} from "../SetupChecklist.js";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog.js";
import { readLastRepartoProcessId } from "./process-context.js";

/**
 * The setup checklist as an affordance rather than a preamble.
 *
 * It used to be printed at the top of every step: a fifteen-line list of what
 * the whole year still needs, stacked above the one form the reader actually
 * opened the page for. It is a *navigation* answer — "where am I in the
 * workflow" — and a reader who has already navigated has answered it. So every
 * step page carries this button, the list opens over the page when it is asked
 * for, and the dashboard — the one surface whose subject *is* the state of the
 * process — keeps it laid out in full.
 *
 * Nothing is fetched until it is opened: the queries live in the content
 * component, which is mounted only while the dialog is. A step page therefore
 * costs exactly what it cost before for a reader who never opens the checklist,
 * and the reads it does make are the same list reads the Stage 1 routes make,
 * so the shared query cache usually answers them without a request.
 *
 * The toggle is deliberately not a `data-reparto-action`: that attribute marks
 * the write affordances the role floors withhold (`tests/route-gating`), and
 * opening a read-only summary of what is done is offered to every role that may
 * see the route at all — the same rule the `?` help toggle follows.
 */
export function RepartoSetupChecklistButton({
  locale,
  processId
}: {
  locale?: RepartoLocale;
  /** The process the page is pinned to, when its route names one. */
  processId?: string;
}) {
  const dict = getRepartoDictionary(locale ?? normalizeRepartoLocale());
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        aria-haspopup="dialog"
        className="inline-flex min-h-8 items-center gap-2 rounded-md border border-primary/40 bg-background px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
        data-reparto-checklist-toggle=""
        onClick={() => setOpen(true)}
        type="button"
      >
        <span
          aria-hidden="true"
          className="inline-flex size-5 items-center justify-center rounded-full border border-primary/60 text-xs font-bold leading-none"
        >
          ✓
        </span>
        <span>{dict.flow.bootstrap.openChecklist}</span>
      </button>
      <Dialog onOpenChange={setOpen} open={open}>
        {open ? (
          <DialogContent closeLabel={dict.flow.bootstrap.closeChecklist}>
            <SetupChecklistDialogBody
              dict={dict}
              locale={locale}
              processId={processId}
            />
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  );
}

/**
 * The panel behind the button.
 *
 * Which reads answer the checklist depends on whether a process is selected, so
 * the two cases are two components rather than one component with disabled
 * queries: without a process the honest source is the four reference-data
 * lists, and with one it is the process's own summary and its Stage 1 counts —
 * a selected process already proves its school, year and department exist, so
 * those three lists are not fetched at all.
 *
 * The process id is the route's when the route names one, and otherwise the
 * selection this browser remembers — the same id `WithSelectedProcess` restores,
 * read from the same place, so the checklist reports on the process the rest of
 * the page is showing.
 */
function SetupChecklistDialogBody({
  dict,
  locale,
  processId
}: {
  dict: RepartoDictionary;
  locale?: RepartoLocale;
  processId?: string;
}) {
  // `current` is the route map's placeholder, not an id — `resolveProcessId`
  // reads it back as "no concrete process", which is exactly when the browser's
  // remembered selection is the right answer.
  const effectiveProcessId =
    resolveProcessId(processId) ?? readLastRepartoProcessId();
  return (
    <>
      <DialogHeader>
        <DialogTitle>{dict.flow.bootstrap.title}</DialogTitle>
        <DialogDescription>{dict.flow.bootstrap.subtitle}</DialogDescription>
      </DialogHeader>
      {effectiveProcessId ? (
        <ProcessChecklist locale={locale} processId={effectiveProcessId} />
      ) : (
        <ReferenceDataChecklist dict={dict} locale={locale} />
      )}
    </>
  );
}

function ProcessChecklist({
  locale,
  processId
}: {
  locale?: RepartoLocale;
  processId: string;
}) {
  const setup = useRepartoSetupObservations(processId);
  const summaryQuery = useRepartoSummary(processId);
  const checklist = buildSetupChecklist({
    ...setup,
    summary: summaryQuery.data ?? null
  });
  return (
    <ChecklistPanel
      checklist={checklist}
      locale={locale}
      processId={processId}
    />
  );
}

function ReferenceDataChecklist({
  dict,
  locale
}: {
  dict: RepartoDictionary;
  locale?: RepartoLocale;
}) {
  const schoolsQuery = useRepartoSchools({ limit: 1 });
  const yearsQuery = useRepartoAcademicYears({ limit: 1 });
  const departmentsQuery = useRepartoDepartments({ limit: 1 });
  const processesQuery = useRepartoProcesses();
  const loading =
    schoolsQuery.isLoading ||
    yearsQuery.isLoading ||
    departmentsQuery.isLoading ||
    processesQuery.isLoading;
  const checklist = buildSetupChecklist({
    academicYearCount: yearsQuery.data?.count ?? null,
    departmentCount: departmentsQuery.data?.count ?? null,
    processCount: processesQuery.data?.count ?? null,
    schoolCount: schoolsQuery.data?.count ?? null
  });
  return (
    <>
      {loading ? (
        <p
          aria-live="polite"
          className="text-sm text-muted-foreground"
          data-reparto-slot="checklist-checking"
          role="status"
        >
          {dict.flow.bootstrap.checking}
        </p>
      ) : null}
      <ChecklistPanel checklist={checklist} locale={locale} processId={null} />
    </>
  );
}

function ChecklistPanel({
  checklist,
  locale,
  processId
}: {
  checklist: ReturnType<typeof buildSetupChecklist>;
  locale?: RepartoLocale;
  processId: string | null;
}) {
  return (
    <section data-reparto-panel="setup-checklist" data-reparto-slot="setup-checklist">
      <SetupChecklistProgress checklist={checklist} />
      <SetupChecklistSteps
        checklist={checklist}
        locale={locale}
        processId={processId}
      />
    </section>
  );
}
