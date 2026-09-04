import { sharedState } from "./moduleState.js";
import { DEFAULT_REPARTO_DOCS_BASE } from "./stepHelp.js";

export type RepartoRuntimeConfig = {
  apiBase: string;
  apiPrefix: string;
  csrfHeader: string;
  requestTimeoutMs: number;
  /**
   * Where the host mounts the Reparto Docente guide, for the link at the foot
   * of every step's help panel. An empty string means the host publishes no
   * guide, and the link is dropped rather than pointing nowhere.
   */
  docsBase: string;
};

const DEFAULT_CONFIG: RepartoRuntimeConfig = {
  apiBase: "/reparto",
  apiPrefix: "",
  csrfHeader: "X-Requested-With",
  requestTimeoutMs: 30_000,
  docsBase: DEFAULT_REPARTO_DOCS_BASE
};

/**
 * The runtime config, in the one slot every copy of this module shares.
 *
 * A host or a starter route configures the API base on whichever copy of this
 * file its own import resolved to, and `client.ts` reads it from whichever copy
 * *its* import resolved to. Under `astro dev` those are not always the same
 * file — see `moduleState.ts` — so the config lives beside the auth adapter in
 * shared storage rather than in a module-level `let`.
 */
const runtimeConfig = sharedState<RepartoRuntimeConfig>(
  "config.runtime",
  () => ({ ...DEFAULT_CONFIG })
);

/**
 * Merge `config` onto the current runtime configuration.
 *
 * A key whose value is `undefined` is *skipped*, not written: a starter route
 * passes `import.meta.env.PUBLIC_FA_REPARTO_*` straight through, and a host
 * that has not defined one of those would otherwise spread `undefined` over a
 * perfectly good default and take the setting away.
 */
export function configureReparto(
  config: Partial<RepartoRuntimeConfig> = {}
): RepartoRuntimeConfig {
  const next: Record<string, unknown> = { ...runtimeConfig.get() };
  for (const [key, value] of Object.entries(config)) {
    if (value !== undefined) next[key] = value;
  }
  const merged = next as RepartoRuntimeConfig;
  runtimeConfig.set(merged);
  return merged;
}

export function getRepartoConfig(): RepartoRuntimeConfig {
  return runtimeConfig.get();
}

export function resetRepartoConfig(): void {
  runtimeConfig.set({ ...DEFAULT_CONFIG });
}
