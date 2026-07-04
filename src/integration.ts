import type { AstroIntegration } from "astro";
import {
  buildRepartoRoutes,
  type RepartoRouteFragments
} from "./runtime/routes.js";

export type FaRepartoAstroOptions = {
  apiBase?: string;
  apiPrefix?: string;
  mode?: "headless" | "starter";
  auth?: {
    provider?: "fa-auth-astro" | "custom" | "none";
  };
  routes?: RepartoRouteFragments;
  views?: {
    strategy?: "none" | "package" | "scaffolded";
  };
};

const ROUTE_ENTRYPOINTS = {
  dashboard: "@mano8/astro-reparto-m8/routes/dashboard.astro",
  meeting: "@mano8/astro-reparto-m8/routes/meeting.astro"
} as const;

const AUTH_INTEGRATION_NAME = "@mano8/astro-auth-m8";
const REPARTO_INTEGRATION_NAME = "@mano8/astro-reparto-m8";

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

  return {
    name: REPARTO_INTEGRATION_NAME,
    hooks: {
      "astro:config:setup": ({ injectRoute, updateConfig, config, logger }) => {
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
          injectRoute({
            pattern,
            entrypoint: ROUTE_ENTRYPOINTS[name as keyof typeof ROUTE_ENTRYPOINTS]
          });
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
