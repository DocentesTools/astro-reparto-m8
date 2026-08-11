import { renderToStaticMarkup } from "react-dom/server";

import type { RepartoRouteName } from "../../src/runtime/routes.js";

/**
 * Render one §8.1 route exactly as its starter page mounts it.
 *
 * The route map is the package's own statement about what a session may see, so
 * a per-role suite has to render the *route*, not a component chosen to make a
 * point. This switch is the one place that says which island each route name
 * mounts, and both role sweeps — the view floors in `route-gating.test.tsx` and
 * the per-record affordances in `writer-ownership.test.tsx` — go through it, so
 * neither can silently test a different surface from the other.
 *
 * The import is dynamic on purpose: the caller's module mocks (`react-query`,
 * `radix-ui`, the event stream) must be installed before the default UI is
 * pulled in, and a static import here would run first.
 */
export async function renderRepartoRoute(
  route: RepartoRouteName,
  processId: string
): Promise<string> {
  const ui = await import("../../src/runtime/react/default-ui/index.js");
  const config = { apiBase: "/api", apiPrefix: "/reparto" };
  const scoped = { config, locale: "en" as const, processId };
  switch (route) {
    case "dashboard":
      return renderToStaticMarkup(<ui.RepartoDashboardView {...scoped} />);
    case "meeting":
      return renderToStaticMarkup(<ui.RepartoMeetingView {...scoped} />);
    case "processList":
      return renderToStaticMarkup(
        <ui.RepartoProcessesView config={config} locale="en" />
      );
    case "teacherView":
      return renderToStaticMarkup(<ui.RepartoMyView {...scoped} />);
    case "sharedScreen":
      return renderToStaticMarkup(<ui.RepartoSharedView {...scoped} />);
    case "versions":
      return renderToStaticMarkup(<ui.RepartoVersionsView {...scoped} />);
    case "exports":
      return renderToStaticMarkup(<ui.RepartoExportsView {...scoped} />);
    case "planning":
      return renderToStaticMarkup(<ui.RepartoPlanningView {...scoped} />);
    case "requirements":
      return renderToStaticMarkup(<ui.RepartoHourRequirementsView {...scoped} />);
    case "assignments":
      return renderToStaticMarkup(<ui.RepartoAssignmentsView {...scoped} />);
    case "participants":
      return renderToStaticMarkup(
        <ui.RepartoProcessParticipantsView {...scoped} />
      );
    case "subjects":
      return renderToStaticMarkup(<ui.RepartoSubjectsView {...scoped} />);
    case "classrooms":
      return renderToStaticMarkup(<ui.RepartoClassroomsView {...scoped} />);
    case "groupSubjects":
      return renderToStaticMarkup(<ui.RepartoGroupSubjectsView {...scoped} />);
    case "processSettings":
      return renderToStaticMarkup(<ui.RepartoProcessSettingsView {...scoped} />);
    case "audit":
      return renderToStaticMarkup(<ui.RepartoAuditView {...scoped} />);
    case "classroomStages":
      return renderToStaticMarkup(
        <ui.RepartoClassroomStagesView config={config} locale="en" />
      );
    case "schools":
      return renderToStaticMarkup(<ui.RepartoSchoolsView config={config} locale="en" />);
    case "academicYears":
      return renderToStaticMarkup(
        <ui.RepartoAcademicYearsView config={config} locale="en" />
      );
    case "departments":
      return renderToStaticMarkup(
        <ui.RepartoDepartmentsView config={config} locale="en" />
      );
    case "teacherRoster":
      return renderToStaticMarkup(
        <ui.RepartoTeacherRosterView config={config} locale="en" />
      );
  }
}

/** Every control the rendered markup offers, by its action name. */
export function repartoActions(html: string): string[] {
  return [...html.matchAll(/data-reparto-action="([^"]+)"/g)].map(
    (match) => match[1]
  );
}

/** Every *row-level* control — the ones that act on one identified record. */
export function repartoRowActions(html: string): string[] {
  return [...html.matchAll(/data-reparto-row-action="([^"]+)"/g)].map(
    (match) => match[1]
  );
}

/**
 * The row-level controls inside the one table row carrying `attribute="value"`.
 *
 * Ownership is a per-row claim, so counting controls over a whole table cannot
 * prove it: the question is always *which* row holds the edit control.
 */
export function repartoRowActionsFor(
  html: string,
  attribute: string,
  value: string
): string[] {
  const row = html
    .split("<tr")
    .find((segment) => segment.includes(`${attribute}="${value}"`));
  return row ? repartoRowActions(row) : [];
}
