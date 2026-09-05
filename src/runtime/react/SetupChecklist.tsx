import {
  formatRepartoMessage,
  getRepartoDictionary,
  normalizeRepartoLocale,
  type RepartoDictionary,
  type RepartoLocale
} from "../i18n/index.js";
import {
  SETUP_CHECKLIST_STEP_ROUTE,
  type SetupChecklist,
  type SetupChecklistStage,
  type SetupChecklistStep,
  type SetupChecklistStepKey
} from "../ui/index.js";
import { getRepartoConfig } from "../config.js";
import { repartoRouteHref } from "../routes.js";
import { repartoButtonClass } from "./styles.js";

/**
 * The one setup-checklist rendering, shared by the process picker and the
 * department-head dashboard (audit finding `S2-07`).
 *
 * `buildSetupChecklist` decides what is true; this decides how it reads. Both
 * surfaces used to own a copy of each, which is how they came to disagree about
 * the same nine steps. The steps are grouped by the three stages under the same
 * `nav.group.*` labels the sidebar uses, so "where am I in the checklist" and
 * "where am I in the menu" are the same question.
 *
 * Every line is a link to the page that step is done on
 * (`SETUP_CHECKLIST_STEP_ROUTE`). The checklist's whole job is to answer "what
 * is left"; a reader who has just been told they still owe the group-subject
 * matrix should not then have to find it in the menu. A route this host
 * disabled has no address, and that line stays plain text rather than becoming
 * a dead link.
 *
 * `onOpenStep` is the inline-create affordance on top of that link: a surface
 * that can satisfy a step without leaving the page returns a handler for it and
 * gets a button, and one that cannot passes nothing and gets a status word. An
 * unknown step never gets a button: the condition was not tested, so there is
 * nothing to say has not been done.
 */

const STAGE_ORDER: readonly SetupChecklistStage[] = [
  "configuration",
  "planning",
  "assignment"
];

function stepStatusLabel(step: SetupChecklistStep, dict: RepartoDictionary): string {
  if (step.status === "done") return dict.flow.bootstrap.done;
  if (step.status === "unknown") return dict.flow.bootstrap.unknown;
  return dict.flow.bootstrap.open;
}

export function SetupChecklistSteps({
  checklist,
  locale,
  onOpenStep,
  processId
}: {
  checklist: SetupChecklist;
  locale?: RepartoLocale;
  /** Return a handler to offer an Open button for that step, or null. */
  onOpenStep?: (key: SetupChecklistStepKey) => (() => void) | null;
  /** The process the reader is on, for the process-scoped step links. */
  processId?: string | null;
}) {
  const dict = getRepartoDictionary(locale ?? normalizeRepartoLocale());
  const { routes } = getRepartoConfig();
  const pathname = typeof window === "undefined" ? "" : window.location.pathname;
  function stepHref(key: SetupChecklistStepKey): string | null {
    return repartoRouteHref(routes, SETUP_CHECKLIST_STEP_ROUTE[key], {
      locale: dict.locale,
      pathname,
      processId
    });
  }
  return (
    <div data-reparto-checklist="">
      {STAGE_ORDER.map((stage) => {
        const steps = checklist.steps.filter((step) => step.stage === stage);
        if (steps.length === 0) return null;
        return (
          <div className="mt-3" data-reparto-checklist-group={stage} key={stage}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {dict.nav.group[stage]}
            </h3>
            <ol className="mt-2 grid gap-2">
              {steps.map((step) => {
                const reason = step.blockedReason
                  ? dict.flow.bootstrap.reason[step.blockedReason]
                  : null;
                const onOpen = step.status === "pending" ? onOpenStep?.(step.key) : null;
                const href = stepHref(step.key);
                const label = dict.flow.bootstrap.step[step.key];
                return (
                  <li
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/70 bg-muted/20 px-3 py-2 text-sm"
                    data-reparto-checklist-state={step.status}
                    data-reparto-checklist-step={step.key}
                    key={step.key}
                  >
                    <div className="min-w-0">
                      {href ? (
                        <a
                          className="block font-semibold text-foreground underline decoration-primary/40 underline-offset-4 hover:text-primary hover:decoration-primary"
                          data-reparto-checklist-link={step.key}
                          href={href}
                        >
                          {label}
                        </a>
                      ) : (
                        <strong className="block text-foreground">{label}</strong>
                      )}
                      {reason ? (
                        <span
                          className="text-xs text-muted-foreground"
                          data-reparto-checklist-blocked={step.blockedReason ?? undefined}
                          data-reparto-disabled-reason=""
                        >
                          {reason}
                        </span>
                      ) : null}
                    </div>
                    {onOpen ? (
                      <button
                        className={repartoButtonClass}
                        data-reparto-action={`open-${step.key}`}
                        onClick={onOpen}
                        type="button"
                      >
                        {dict.flow.bootstrap.open}
                      </button>
                    ) : (
                      <span
                        className="text-xs font-medium text-primary"
                        data-reparto-step-status={step.status}
                      >
                        {stepStatusLabel(step, dict)}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        );
      })}
    </div>
  );
}

/**
 * The progress line both surfaces print.
 *
 * Steps this surface could not test are counted separately and never folded
 * into "not done" — `3/15` with four unknown is a different statement from
 * `3/15` with none.
 */
export function SetupChecklistProgress({
  checklist
}: {
  checklist: SetupChecklist;
}) {
  return (
    <span className="text-sm text-muted-foreground" data-reparto-slot="setup-progress">
      {formatRepartoMessage("{done}/{total}", {
        done: checklist.doneCount,
        total: checklist.total
      })}
      {checklist.unknownCount > 0 ? (
        <span data-reparto-checklist-unknown={checklist.unknownCount} />
      ) : null}
    </span>
  );
}
