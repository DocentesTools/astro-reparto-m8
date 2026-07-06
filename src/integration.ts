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
  setup: FaRepartoNavGroup;
  process: FaRepartoNavGroup;
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

export const DEFAULT_REPARTO_NAV: FaRepartoNav = {
  setup: {
    labelKey: "nav.group.setup",
    entries: [
      { labelKey: "nav.item.schools", route: "schools" },
      { labelKey: "nav.item.academicYears", route: "academicYears" },
      { labelKey: "nav.item.departments", route: "departments" },
      { labelKey: "nav.item.teacherRoster", route: "teacherRoster" }
    ]
  },
  process: {
    labelKey: "nav.group.process",
    entries: [
      { labelKey: "nav.item.dashboard", route: "dashboard" },
      { labelKey: "nav.item.processes", route: "processList" },
      { labelKey: "nav.item.classrooms", route: "classrooms" },
      { labelKey: "nav.item.subjects", route: "subjects" },
      { labelKey: "nav.item.requirements", route: "requirements" },
      { labelKey: "nav.item.processParticipants", route: "participants" },
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
    setup: { ...nav.setup, entries: nav.setup.entries.map(resolveHref) },
    process: { ...nav.process, entries: nav.process.entries.map(resolveHref) }
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
  classrooms: "@mano8/astro-reparto-m8/routes/classrooms.astro",
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
