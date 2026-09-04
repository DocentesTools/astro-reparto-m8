import { sharedState } from "./moduleState.js";

export type RepartoRuntimeConfig = {
  apiBase: string;
  apiPrefix: string;
  csrfHeader: string;
  requestTimeoutMs: number;
};

const DEFAULT_CONFIG: RepartoRuntimeConfig = {
  apiBase: "/reparto",
  apiPrefix: "",
  csrfHeader: "X-Requested-With",
  requestTimeoutMs: 30_000
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

export function configureReparto(
  config: Partial<RepartoRuntimeConfig> = {}
): RepartoRuntimeConfig {
  const next = { ...runtimeConfig.get(), ...config };
  runtimeConfig.set(next);
  return next;
}

export function getRepartoConfig(): RepartoRuntimeConfig {
  return runtimeConfig.get();
}

export function resetRepartoConfig(): void {
  runtimeConfig.set({ ...DEFAULT_CONFIG });
}
