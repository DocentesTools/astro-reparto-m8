import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import { RepartoRouteGuard } from "../src/runtime/react/default-ui/route-guard.js";
import { RepartoStepHelp } from "../src/runtime/react/default-ui/step-help.js";
import { configureReparto, getRepartoConfig, resetRepartoConfig } from "../src/runtime/config.js";
import { getRepartoDictionary, REPARTO_LOCALES } from "../src/runtime/i18n/index.js";
import {
  buildRepartoRoutes,
  repartoRouteHref,
  type RepartoRouteName
} from "../src/runtime/routes.js";
import { REPARTO_ROUTE_ACCESS } from "../src/runtime/routeAccess.js";
import {
  DEFAULT_REPARTO_DOCS_BASE,
  REPARTO_STEP_DOC_SLUG,
  REPARTO_STEP_NAV_ITEM,
  REPARTO_STEP_STAGE,
  repartoDocsHref,
  repartoStageLabel,
  repartoStepGuidance
} from "../src/runtime/stepHelp.js";
import { repartoUser, resetRepartoAuthAdapter, signInReparto } from "./support/session.js";

const ROUTES = Object.keys(buildRepartoRoutes()) as RepartoRouteName[];

/**
 * The dictionary string as it appears in rendered markup.
 *
 * The copy is prose in three languages, so it carries apostrophes and accents
 * that React escapes on the way out. Comparing the raw dictionary value against
 * the HTML would fail on French for a reason that has nothing to do with what
 * is on screen.
 */
function asMarkup(text: string): string {
  return text
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split('"').join("&quot;")
    .split("'").join("&#x27;");
}

afterEach(() => {
  resetRepartoAuthAdapter();
  resetRepartoConfig();
});

describe("every step carries guidance", () => {
  it("covers all twenty-two routes in all three locales", () => {
    expect(ROUTES).toHaveLength(22);
    for (const locale of REPARTO_LOCALES) {
      const dict = getRepartoDictionary(locale);
      for (const route of ROUTES) {
        const guidance = repartoStepGuidance(dict, route);
        expect(guidance.title, `${locale} ${route} title`).toBeTruthy();
        expect(guidance.stage, `${locale} ${route} stage`).toBeTruthy();
        expect(guidance.what.length, `${locale} ${route} what`).toBeGreaterThan(40);
        expect(guidance.why.length, `${locale} ${route} why`).toBeGreaterThan(40);
        expect(guidance.how.length, `${locale} ${route} how`).toBeGreaterThanOrEqual(3);
        for (const instruction of guidance.how) {
          expect(instruction.length, `${locale} ${route} step`).toBeGreaterThan(20);
        }
      }
    }
  });

  it("borrows its heading and its stage from the menu, so the two cannot drift", () => {
    for (const locale of REPARTO_LOCALES) {
      const dict = getRepartoDictionary(locale);
      for (const route of ROUTES) {
        const guidance = repartoStepGuidance(dict, route);
        expect(guidance.title).toBe(dict.nav.item[REPARTO_STEP_NAV_ITEM[route]]);
        expect(guidance.stage).toBe(
          repartoStageLabel(dict, REPARTO_STEP_STAGE[route])
        );
      }
    }
  });

  /**
   * The dashboard and the process list report on the workflow; they do not
   * advance it. Labelling them *Stage 1 · Configuration* told a reader they were
   * standing on a step when nothing is done on either page. The sidebar still
   * groups them under Stage 1 — that is a menu-ordering fact, and it stops at
   * the menu.
   */
  it("calls the two reporting routes Overview, not Stage 1", () => {
    for (const locale of REPARTO_LOCALES) {
      const dict = getRepartoDictionary(locale);
      for (const route of ["dashboard", "processList"] as const) {
        expect(REPARTO_STEP_STAGE[route]).toBe("overview");
        expect(repartoStepGuidance(dict, route).stage).toBe(dict.help.overview);
        expect(repartoStepGuidance(dict, route).stage).not.toBe(
          dict.nav.group.configuration
        );
      }
      // And every route that *is* a step still names its stage.
      for (const route of ROUTES) {
        if (route === "dashboard" || route === "processList") continue;
        expect(REPARTO_STEP_STAGE[route], route).not.toBe("overview");
      }
    }
  });

  it("says something different in each locale", () => {
    const en = getRepartoDictionary("en");
    for (const locale of ["fr", "es"] as const) {
      const dict = getRepartoDictionary(locale);
      for (const route of ROUTES) {
        expect(dict.help.step[route].what, `${locale} ${route}`).not.toBe(
          en.help.step[route].what
        );
        expect(dict.help.step[route].how, `${locale} ${route}`).not.toEqual(
          en.help.step[route].how
        );
      }
    }
  });

  it("points every step at a guide page that exists in the host guide", () => {
    // The slugs are the host guide's own page names. Naming one the guide does
    // not ship would send a reader to a 404 from inside the help that was meant
    // to unstick them.
    const pages = new Set([
      "getting-started",
      "how-it-works",
      "roles",
      "hours-and-balances",
      "stage-1-configuration",
      "stage-2-planning",
      "stage-3-assignment",
      "meeting-and-lan",
      "versions-exports-audit",
      "reference",
      "limitations",
      "troubleshooting"
    ]);
    for (const route of ROUTES) {
      expect(pages, `${route} slug`).toContain(REPARTO_STEP_DOC_SLUG[route]);
    }
  });
});

describe("repartoDocsHref", () => {
  it("adds the locale segment only when the current path already carries it", () => {
    expect(
      repartoDocsHref("stage-1-configuration", { locale: "en", pathname: "/en/reparto" })
    ).toBe("/en/docs/reparto/stage-1-configuration/");
    expect(
      repartoDocsHref("stage-1-configuration", {
        locale: "en",
        pathname: "/reparto/setup/schools"
      })
    ).toBe("/docs/reparto/stage-1-configuration/");
    expect(repartoDocsHref("getting-started", { pathname: "/en/reparto" })).toBe(
      "/docs/reparto/getting-started/"
    );
    expect(repartoDocsHref("getting-started")).toBe("/docs/reparto/getting-started/");
  });

  it("honours a host that mounts its guide somewhere else", () => {
    expect(
      repartoDocsHref("stage-2-planning", {
        docsBase: "/help/reparto",
        locale: "fr",
        pathname: "/fr/reparto/processes/current/planning"
      })
    ).toBe("/fr/help/reparto/stage-2-planning/");
  });

  it("drops the link on a host that publishes no guide", () => {
    expect(repartoDocsHref("getting-started", { docsBase: "" })).toBeNull();
    expect(repartoDocsHref("getting-started", { docsBase: "   " })).toBeNull();
  });

  it("defaults to the guide base the integration also defaults to", () => {
    expect(getRepartoConfig().docsBase).toBe(DEFAULT_REPARTO_DOCS_BASE);
  });
});

describe("repartoRouteHref", () => {
  const routes = buildRepartoRoutes();

  it("fills the process placeholder with the reader's process, or the sentinel", () => {
    expect(repartoRouteHref(routes, "subjects", { processId: "p-1" })).toBe(
      "/reparto/processes/p-1/subjects"
    );
    expect(repartoRouteHref(routes, "subjects")).toBe(
      "/reparto/processes/current/subjects"
    );
    // Whitespace is not an id: it falls back rather than building `//subjects`.
    expect(repartoRouteHref(routes, "subjects", { processId: "  " })).toBe(
      "/reparto/processes/current/subjects"
    );
    expect(repartoRouteHref(routes, "schools")).toBe("/reparto/setup/schools");
  });

  it("adds the locale segment only when the current path already carries it", () => {
    expect(
      repartoRouteHref(routes, "schools", { locale: "fr", pathname: "/fr/reparto" })
    ).toBe("/fr/reparto/setup/schools");
    expect(
      repartoRouteHref(routes, "schools", {
        locale: "fr",
        pathname: "/reparto/setup/departments"
      })
    ).toBe("/reparto/setup/schools");
    expect(repartoRouteHref(routes, "schools", { pathname: "/fr/reparto" })).toBe(
      "/reparto/setup/schools"
    );
  });

  it("normalizes a host pattern written without its leading slash", () => {
    expect(
      repartoRouteHref(buildRepartoRoutes({ schools: "setup/schools" }), "schools")
    ).toBe("/setup/schools");
  });

  it("has no address for a route the host disabled", () => {
    expect(
      repartoRouteHref(buildRepartoRoutes({ meeting: false }), "meeting")
    ).toBeNull();
  });
});

describe("the ? button on a rendered step", () => {
  function renderStep(route: RepartoRouteName): string {
    return renderToStaticMarkup(
      <RepartoRouteGuard locale="en" route={route}>
        <p>route content</p>
      </RepartoRouteGuard>
    );
  }

  it("appears on every route a viewer may open, with the panel collapsed", () => {
    for (const route of ROUTES) {
      signInReparto(repartoUser(REPARTO_ROUTE_ACCESS[route].view));
      const html = renderStep(route);
      const dict = getRepartoDictionary("en");
      expect(html, route).toContain(`data-reparto-help="${route}"`);
      expect(html, route).toContain(`aria-controls="reparto-help-${route}"`);
      expect(html, route).toContain('aria-expanded="false"');
      expect(html, route).toContain(asMarkup(dict.help.open));
      // Collapsed, not absent: the words are on the page for a browser search
      // and for assistive technology that reads past a closed disclosure.
      expect(html, route).toContain(`data-reparto-help-panel="${route}"`);
      expect(html, route).toContain("hidden=");
      expect(html, route).toContain(asMarkup(dict.help.step[route].what));
      expect(html, route).toContain("route content");
    }
  });

  it("answers what, why and how, in that order, and offers the guide", () => {
    signInReparto(repartoUser("admin"));
    const dict = getRepartoDictionary("en");
    const html = renderStep("planning");
    const what = html.indexOf(asMarkup(dict.help.what));
    const why = html.indexOf(asMarkup(dict.help.why));
    const how = html.indexOf(asMarkup(dict.help.how));
    expect(what).toBeGreaterThan(-1);
    expect(why).toBeGreaterThan(what);
    expect(how).toBeGreaterThan(why);
    for (const instruction of dict.help.step.planning.how) {
      expect(html).toContain(asMarkup(instruction));
    }
    expect(html).toContain('href="/docs/reparto/stage-2-planning/"');
    expect(html).toContain(asMarkup(dict.help.docs));
  });

  it("renders the reader's own language", () => {
    signInReparto(repartoUser("reader"));
    for (const locale of REPARTO_LOCALES) {
      const dict = getRepartoDictionary(locale);
      const html = renderToStaticMarkup(
        <RepartoStepHelp locale={locale} route="schools" />
      );
      expect(html, locale).toContain(asMarkup(dict.help.open));
      expect(html, locale).toContain(asMarkup(dict.help.step.schools.why));
      expect(html, locale).toContain(asMarkup(dict.nav.item.schools));
    }
  });

  it("drops the guide link when the host publishes no guide", () => {
    signInReparto(repartoUser("reader"));
    configureReparto({ docsBase: "" });
    const html = renderToStaticMarkup(<RepartoStepHelp route="schools" />);
    expect(html).not.toContain("/docs/reparto/");
    expect(html).not.toContain(asMarkup(getRepartoDictionary("en").help.docs));
    expect(html).toContain(asMarkup(getRepartoDictionary("en").help.step.schools.what));
  });

  // §21.1: a session below the route's view floor is not shown the route, and
  // is not told how to work it either.
  it("is withheld from a session that may not see the route", () => {
    signInReparto(repartoUser("user"));
    const html = renderStep("schools");
    expect(html).not.toContain('data-reparto-help="schools"');
    expect(html).not.toContain("route content");
  });

  it("is withheld while the session is still unresolved", () => {
    signInReparto(null);
    const html = renderToStaticMarkup(
      <RepartoRouteGuard locale="en" route="schools">
        <p>route content</p>
      </RepartoRouteGuard>
    );
    expect(html).not.toContain('data-reparto-help="schools"');
  });
});

/**
 * The setup checklist as a button, not a preamble.
 *
 * It used to be printed above the form on every step a reader opened, which is
 * the complaint this suite freezes the answer to: the whole-workflow list is
 * one press away on every step, and laid out in full on the one surface whose
 * subject it is.
 */
describe("the setup-checklist button on a rendered step", () => {
  function renderStep(route: RepartoRouteName): string {
    return renderToStaticMarkup(
      <RepartoRouteGuard locale="en" route={route}>
        <p>route content</p>
      </RepartoRouteGuard>
    );
  }

  it("appears on every step page, closed, beside the ? toggle", () => {
    const dict = getRepartoDictionary("en");
    for (const route of ROUTES.filter((name) => name !== "dashboard")) {
      signInReparto(repartoUser(REPARTO_ROUTE_ACCESS[route].view));
      const html = renderStep(route);
      expect(html, route).toContain("data-reparto-checklist-toggle=");
      expect(html, route).toContain(`data-reparto-step-toolbar="${route}"`);
      expect(html, route).toContain(asMarkup(dict.flow.bootstrap.openChecklist));
      // Closed: the panel and everything it would fetch are unmounted.
      expect(html, route).not.toContain("data-reparto-checklist=");
    }
  });

  // The dashboard lays the same checklist out in full, so a button there would
  // open a second copy of what the reader is already looking at.
  it("is withheld from the dashboard, which shows the checklist in full", () => {
    signInReparto(repartoUser(REPARTO_ROUTE_ACCESS.dashboard.view));
    const html = renderStep("dashboard");
    expect(html).toContain('data-reparto-help="dashboard"');
    expect(html).not.toContain("data-reparto-checklist-toggle=");
  });

  it("is withheld with the rest of the route below the view floor", () => {
    signInReparto(repartoUser("user"));
    expect(renderStep("schools")).not.toContain("data-reparto-checklist-toggle=");
  });
});
