import type { AstroIntegration } from "astro";
import {
  buildRepartoRoutes,
  type BuiltRepartoRoutes,
  type RepartoRouteFragments
} from "./runtime/routes.js";

export type FaRepartoNavEntry = {
  labelKey: string;
  route?: keyof BuiltRepartoRoutes;
  href?: string;
};

export type FaRepartoNavGroup = {
  labelKey: string;
  entries: FaRepartoNavEntry[];
};

export type FaRepartoNav = {
  configuration: FaRepartoNavGroup;
  planning: FaRepartoNavGroup;
  assignment: FaRepartoNavGroup;
};

export type FaRepartoAstroOptions = {
  apiBase?: string;
  apiPrefix?: string;
  mode?: "headless" | "starter";
  locales?: string[];
  defaultLocale?: string;
  auth?: {
    provider?: "fa-auth-astro" | "custom" | "none";
    /**
     * Login route path (without locale prefix) the fa-auth-astro guard sends
     * unauthenticated visitors to. Defaults to `/login`.
     */
    loginPath?: string;
  };
  routes?: RepartoRouteFragments;
  views?: {
    strategy?: "none" | "package" | "scaffolded";
  };
};

// Grouping follows the plan's target workflow (§4): Stage 1 configures the
// department, Stage 2 turns that configuration into a locked, generated plan,
// and Stage 3 is the existing assignment process run against the generated
// slots. `teachingGroups`/`subjects`/`processParticipants` are process-scoped
// resources but are configured once per process before planning starts, so
// they sit in Stage 1 alongside the school-wide setup entries.
//
// Within Stage 1 the order is §8.2's, once the school-wide entries are out of
// the way: `processList`/`dashboard` (select or create the process — the
// prerequisite for everything else), schools/years/departments (step 1), the
// school-wide reference data, then the process-scoped block in step order —
// `allocation` (2), `participants` (3), `subjects` (4), `teachingGroups` (5),
// `groupSubjects` (6), `processSettings` (7).
//
// Three placements the audit (`S2-10`, `S2-06`) asked for and why they are
// where they are:
//
// * `processList`/`dashboard` head Stage 1 rather than sitting in Stage 3.
//   They are domain-correct as assignment surfaces and workflow-backwards
//   there: nothing in Stage 1 can be opened before a process is selected. They
//   are **not** a fourth, ungrouped root group — `FaRepartoNav` names exactly
//   three groups and a host renders them one by one (`fa-ui-m8` does), so a new
//   group would be a nav entry nothing mounts, which is the shape of `S2-02`.
// * `allocation` is Stage 1, not Stage 2. Recording the *first* revision is
//   §8.2 step 2; the reconciliation panel on `/planning` keeps the same form
//   for the case it was written for — resolving a *change*.
// * `exports` appears in Stage 2 as well as Stage 3. The planning draft and
//   provisional exports (§7.8) are Stage 2 artifacts and the export centre
//   already implements them; the same route serves both readings.
export const DEFAULT_REPARTO_NAV: FaRepartoNav = {
  configuration: {
    labelKey: "nav.group.configuration",
    entries: [
      { labelKey: "nav.item.processes", route: "processList" },
      { labelKey: "nav.item.dashboard", route: "dashboard" },
      { labelKey: "nav.item.schools", route: "schools" },
      { labelKey: "nav.item.academicYears", route: "academicYears" },
      { labelKey: "nav.item.departments", route: "departments" },
      { labelKey: "nav.item.classroomStages", route: "classroomStages" },
      { labelKey: "nav.item.teacherRoster", route: "teacherRoster" },
      { labelKey: "nav.item.allocation", route: "allocation" },
      { labelKey: "nav.item.processParticipants", route: "participants" },
      { labelKey: "nav.item.subjects", route: "subjects" },
      { labelKey: "nav.item.teachingGroups", route: "teachingGroups" },
      { labelKey: "nav.item.groupSubjects", route: "groupSubjects" },
      { labelKey: "nav.item.processSettings", route: "processSettings" }
    ]
  },
  planning: {
    labelKey: "nav.group.planning",
    entries: [
      { labelKey: "nav.item.planning", route: "planning" },
      { labelKey: "nav.item.requirements", route: "requirements" },
      { labelKey: "nav.item.planningExports", route: "exports" }
    ]
  },
  assignment: {
    labelKey: "nav.group.assignment",
    entries: [
      { labelKey: "nav.item.assignments", route: "assignments" },
      { labelKey: "nav.item.meeting", route: "meeting" },
      { labelKey: "nav.item.myView", route: "teacherView" },
      { labelKey: "nav.item.shared", route: "sharedScreen" },
      { labelKey: "nav.item.versions", route: "versions" },
      { labelKey: "nav.item.exports", route: "exports" },
      { labelKey: "nav.item.audit", route: "audit" }
    ]
  }
};

export function buildRepartoNav(
  routes: BuiltRepartoRoutes,
  nav: FaRepartoNav = DEFAULT_REPARTO_NAV
): FaRepartoNav {
  function resolvePatternHref(pattern: string): string {
    return pattern.replace(/\[([^\]]+)\]/g, "current");
  }

  function resolveHref(entry: FaRepartoNavEntry): FaRepartoNavEntry {
    if (entry.href) return entry;
    if (!entry.route) return { ...entry, href: "#" };
    const pattern = routes[entry.route];
    return {
      ...entry,
      href: pattern ? resolvePatternHref(String(pattern)) : "#"
    };
  }
  return {
    configuration: {
      ...nav.configuration,
      entries: nav.configuration.entries.map(resolveHref)
    },
    planning: { ...nav.planning, entries: nav.planning.entries.map(resolveHref) },
    assignment: {
      ...nav.assignment,
      entries: nav.assignment.entries.map(resolveHref)
    }
  };
}

const ROUTE_ENTRYPOINTS = {
  dashboard: "@mano8/astro-reparto-m8/routes/dashboard.astro",
  meeting: "@mano8/astro-reparto-m8/routes/meeting.astro",
  processList: "@mano8/astro-reparto-m8/routes/processes.astro",
  teacherView: "@mano8/astro-reparto-m8/routes/my-view.astro",
  sharedScreen: "@mano8/astro-reparto-m8/routes/shared.astro",
  versions: "@mano8/astro-reparto-m8/routes/versions.astro",
  exports: "@mano8/astro-reparto-m8/routes/exports.astro",
  schools: "@mano8/astro-reparto-m8/routes/schools.astro",
  academicYears: "@mano8/astro-reparto-m8/routes/academic-years.astro",
  departments: "@mano8/astro-reparto-m8/routes/departments.astro",
  teacherRoster: "@mano8/astro-reparto-m8/routes/teacher-roster.astro",
  subjects: "@mano8/astro-reparto-m8/routes/subjects.astro",
  teachingGroups: "@mano8/astro-reparto-m8/routes/teaching-groups.astro",
  classroomStages: "@mano8/astro-reparto-m8/routes/classroom-stages.astro",
  groupSubjects: "@mano8/astro-reparto-m8/routes/group-subjects.astro",
  processSettings: "@mano8/astro-reparto-m8/routes/settings.astro",
  allocation: "@mano8/astro-reparto-m8/routes/allocation.astro",
  planning: "@mano8/astro-reparto-m8/routes/planning.astro",
  requirements: "@mano8/astro-reparto-m8/routes/requirements.astro",
  participants: "@mano8/astro-reparto-m8/routes/participants.astro",
  assignments: "@mano8/astro-reparto-m8/routes/assignments.astro",
  audit: "@mano8/astro-reparto-m8/routes/audit.astro"
} as const;

const AUTH_INTEGRATION_NAME = "@mano8/astro-auth-m8";
const REPARTO_INTEGRATION_NAME = "@mano8/astro-reparto-m8";

function normalizeRoutePattern(pattern: string): string {
  return pattern.startsWith("/") ? pattern : `/${pattern}`;
}

export function localizedRoutePatterns(
  pattern: string,
  locales: string[] | undefined
): string[] {
  const normalized = normalizeRoutePattern(pattern);
  if (!locales?.length) return [normalized];

  return locales.map((locale) => `/${locale}${normalized}`);
}

/** Distinct top-level path prefixes (`/reparto`, …) the route set lives under. */
export function repartoRoutePrefixes(routes: BuiltRepartoRoutes): string[] {
  const prefixes = new Set<string>();
  for (const pattern of Object.values(routes)) {
    if (pattern) prefixes.add(`/${normalizeRoutePattern(pattern).split("/")[1]}`);
  }
  return prefixes.size ? [...prefixes] : ["/reparto"];
}

export function checkAuthOrder(
  integrations: { name?: string }[] | undefined,
  logger?: { warn: (message: string) => void }
): void {
  const names = (integrations ?? []).map((entry) => entry?.name);
  const authIndex = names.indexOf(AUTH_INTEGRATION_NAME);
  const repartoIndex = names.indexOf(REPARTO_INTEGRATION_NAME);
  if (authIndex === -1) {
    logger?.warn(`${AUTH_INTEGRATION_NAME} is required for official M8 usage`);
  } else if (repartoIndex !== -1 && authIndex > repartoIndex) {
    logger?.warn(`${AUTH_INTEGRATION_NAME} should be listed before ${REPARTO_INTEGRATION_NAME}`);
  }
}

export default function faReparto(
  options: FaRepartoAstroOptions = {}
): AstroIntegration {
  const mode = options.mode ?? "headless";
  const provider = options.auth?.provider ?? "fa-auth-astro";
  const routes = buildRepartoRoutes(options.routes);
  const apiBase = options.apiBase ?? "/reparto";
  const apiPrefix = options.apiPrefix ?? "";
  const loginPath = options.auth?.loginPath ?? "/login";

  return {
    name: REPARTO_INTEGRATION_NAME,
    hooks: {
      "astro:config:setup": ({ injectRoute, injectScript, updateConfig, config, logger }) => {
        updateConfig({
          vite: {
            define: {
              "import.meta.env.PUBLIC_FA_REPARTO_API_BASE": JSON.stringify(apiBase),
              "import.meta.env.PUBLIC_FA_REPARTO_API_PREFIX": JSON.stringify(apiPrefix)
            }
          }
        });

        const starter =
          mode === "starter" && (options.views?.strategy ?? "package") !== "none";
        if (starter && provider === "fa-auth-astro") {
          checkAuthOrder(config?.integrations, logger);
        } else if (starter && provider === "none") {
          logger?.warn("starter routes are enabled without an auth provider");
        }

        if (!starter) return;
        for (const [name, pattern] of Object.entries(routes)) {
          if (!pattern) continue;
          for (const routePattern of localizedRoutePatterns(pattern, options.locales)) {
            injectRoute({
              pattern: routePattern,
              entrypoint: ROUTE_ENTRYPOINTS[name as keyof typeof ROUTE_ENTRYPOINTS]
            });
          }
        }

        // Wire the fa-auth token into the reparto client and guard reparto
        // routes on the client. Injected only for the fa-auth-astro provider so
        // the `@mano8/astro-auth-m8` import never enters a custom/none build.
        if (provider === "fa-auth-astro") {
          const bridgeOptions = {
            loginPath,
            locales: options.locales ?? [],
            routePrefixes: repartoRoutePrefixes(routes)
          };
          injectScript(
            "page",
            `import { installRepartoFaAuthBridge } from "@mano8/astro-reparto-m8/fa-auth-bridge";` +
              `installRepartoFaAuthBridge(${JSON.stringify(bridgeOptions)});`
          );
        }
      }
    }
  };
}

export { buildRepartoRoutes } from "./runtime/routes.js";
export type {
  BuiltRepartoRoutes,
  RepartoRouteFragments
} from "./runtime/routes.js";
