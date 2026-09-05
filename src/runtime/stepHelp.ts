import type { RepartoDictionary } from "./i18n/types.js";
import type { RepartoRouteName } from "./routes.js";

/**
 * The line each route prints above its title in the `?` panel.
 *
 * The three stage values are the sidebar's own grouping (`DEFAULT_REPARTO_NAV`),
 * restated here as data rather than read out of the nav: the nav is a
 * host-overridable *presentation* of the route map, and a host that reorders its
 * menu must not change which stage a step tells the reader it is in. `exports`
 * appears in two nav groups and is named for the later one, because that is the
 * stage a reader who has reached the export centre is actually in.
 *
 * `overview` is the fourth value and is **not** a stage. The dashboard and the
 * process list report on the workflow rather than advance it — nothing is done
 * on them, so labelling them *Stage 1 · Configuration* told a reader they were
 * standing on a step they were in fact only reading about. The sidebar still
 * groups them under Stage 1, and rightly: nothing else opens until a process is
 * selected. That is a menu-ordering fact, and it stops at the menu.
 */
export type RepartoStepStage =
  | keyof RepartoDictionary["nav"]["group"]
  /** A report on the workflow, not a step of it. */
  | "overview";

export const REPARTO_STEP_STAGE: Record<RepartoRouteName, RepartoStepStage> = {
  processList: "overview",
  dashboard: "overview",
  schools: "configuration",
  academicYears: "configuration",
  departments: "configuration",
  classroomStages: "configuration",
  teacherRoster: "configuration",
  allocation: "configuration",
  participants: "configuration",
  subjects: "configuration",
  teachingGroups: "configuration",
  groupSubjects: "configuration",
  processSettings: "configuration",
  planning: "planning",
  requirements: "planning",
  assignments: "assignment",
  meeting: "assignment",
  teacherView: "assignment",
  sharedScreen: "assignment",
  versions: "assignment",
  exports: "assignment",
  audit: "assignment"
};

/**
 * The `nav.item.*` entry each route is titled by.
 *
 * The help panel does not carry its own heading: it borrows the one the menu
 * already shows, so a reader who opened a step from the sidebar meets the same
 * words inside it. That also keeps one name per step across three locales
 * instead of two, which is one fewer place for the naming freeze to drift.
 */
export const REPARTO_STEP_NAV_ITEM: Record<
  RepartoRouteName,
  keyof RepartoDictionary["nav"]["item"]
> = {
  processList: "processes",
  dashboard: "dashboard",
  schools: "schools",
  academicYears: "academicYears",
  departments: "departments",
  classroomStages: "classroomStages",
  teacherRoster: "teacherRoster",
  allocation: "allocation",
  participants: "processParticipants",
  subjects: "subjects",
  teachingGroups: "teachingGroups",
  groupSubjects: "groupSubjects",
  processSettings: "processSettings",
  planning: "planning",
  requirements: "requirements",
  assignments: "assignments",
  meeting: "meeting",
  teacherView: "myView",
  sharedScreen: "shared",
  versions: "versions",
  exports: "exports",
  audit: "audit"
};

/**
 * The guide page each step's help links out to.
 *
 * These are the page names of the host-side Reparto Docente guide, which ships
 * the same file names in every locale — the locale lives in the URL prefix, not
 * in the slug. The package states the slug and lets the host state where the
 * guide is mounted (`docsBase`), so nothing here hard-codes one site's routing.
 */
export const REPARTO_STEP_DOC_SLUG: Record<RepartoRouteName, string> = {
  processList: "getting-started",
  dashboard: "getting-started",
  schools: "stage-1-configuration",
  academicYears: "stage-1-configuration",
  departments: "stage-1-configuration",
  classroomStages: "stage-1-configuration",
  teacherRoster: "stage-1-configuration",
  allocation: "stage-1-configuration",
  participants: "stage-1-configuration",
  subjects: "stage-1-configuration",
  teachingGroups: "stage-1-configuration",
  groupSubjects: "stage-1-configuration",
  processSettings: "stage-1-configuration",
  planning: "stage-2-planning",
  requirements: "stage-2-planning",
  assignments: "stage-3-assignment",
  meeting: "meeting-and-lan",
  teacherView: "meeting-and-lan",
  sharedScreen: "meeting-and-lan",
  versions: "versions-exports-audit",
  exports: "versions-exports-audit",
  audit: "versions-exports-audit"
};

/** Where the host mounts the Reparto Docente guide, unless it says otherwise. */
export const DEFAULT_REPARTO_DOCS_BASE = "/docs/reparto";

/**
 * The address of one guide page, or `null` when the host publishes no guide.
 *
 * A host that ships no guide sets `docsBase` to an empty string and the help
 * panel drops the link rather than offering a dead one. The locale segment is
 * added only when the current path already carries it, which is the same test
 * `faAuthBridge` applies to the login path: a localized host is recognised by
 * the URL the reader is on, so neither a single-locale host nor a host that
 * leaves its default locale unprefixed is given a prefix it does not use.
 */
export function repartoDocsHref(
  slug: string,
  options: { docsBase?: string; locale?: string; pathname?: string } = {}
): string | null {
  const base = (options.docsBase ?? DEFAULT_REPARTO_DOCS_BASE).trim();
  if (!base) return null;
  const locale = (options.locale ?? "").trim();
  const pathname = options.pathname ?? "";
  const prefix = locale && pathname.startsWith(`/${locale}/`) ? `/${locale}` : "";
  return `${prefix}${base}/${slug}/`;
}

/** One step's guidance, resolved against a dictionary and the current path. */
export type RepartoStepGuidance = {
  route: RepartoRouteName;
  /** The stage group this step sits in — or *Overview* — in the reader's language. */
  stage: string;
  /** The step's name, borrowed from the menu. */
  title: string;
  what: string;
  why: string;
  how: string[];
  docsHref: string | null;
};

/**
 * One stage value, in the reader's language.
 *
 * The three real stages borrow the sidebar's own `nav.group.*` label so the
 * panel and the menu cannot name a stage differently; `overview` has no menu
 * group to borrow from, because it is not one.
 */
export function repartoStageLabel(
  dict: RepartoDictionary,
  stage: RepartoStepStage
): string {
  return stage === "overview" ? dict.help.overview : dict.nav.group[stage];
}

/**
 * Everything the `?` panel shows for one step.
 *
 * Pure and framework-neutral so the copy can be asserted, and so a host
 * composing its own views can render the same guidance without mounting this
 * package's panel.
 */
export function repartoStepGuidance(
  dict: RepartoDictionary,
  route: RepartoRouteName,
  options: { docsBase?: string; pathname?: string } = {}
): RepartoStepGuidance {
  const step = dict.help.step[route];
  return {
    route,
    stage: repartoStageLabel(dict, REPARTO_STEP_STAGE[route]),
    title: dict.nav.item[REPARTO_STEP_NAV_ITEM[route]],
    what: step.what,
    why: step.why,
    how: step.how,
    docsHref: repartoDocsHref(REPARTO_STEP_DOC_SLUG[route], {
      docsBase: options.docsBase,
      locale: dict.locale,
      pathname: options.pathname
    })
  };
}
