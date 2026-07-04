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

let runtimeConfig: RepartoRuntimeConfig = { ...DEFAULT_CONFIG };

export function configureReparto(
  config: Partial<RepartoRuntimeConfig> = {}
): RepartoRuntimeConfig {
  runtimeConfig = { ...runtimeConfig, ...config };
  return runtimeConfig;
}

export function getRepartoConfig(): RepartoRuntimeConfig {
  return runtimeConfig;
}

export function resetRepartoConfig(): void {
  runtimeConfig = { ...DEFAULT_CONFIG };
}
