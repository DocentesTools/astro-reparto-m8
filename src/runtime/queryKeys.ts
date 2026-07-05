export type RepartoListParams = {
  skip?: number;
  limit?: number;
};

const CURRENT_PROCESS_PLACEHOLDER = "current";

export function resolveProcessId(processId?: string): string | undefined {
  const trimmed = processId?.trim();
  if (!trimmed || trimmed === CURRENT_PROCESS_PLACEHOLDER) return undefined;
  return trimmed;
}

export function requireProcessId(processId?: string): string {
  const resolved = resolveProcessId(processId);
  if (!resolved) throw new Error("A concrete reparto process id is required.");
  return resolved;
}

export function normalizeListParams(
  params: RepartoListParams = {}
): Required<RepartoListParams> {
  return {
    skip: params.skip ?? 0,
    limit: params.limit ?? 25
  };
}

export const repartoKeys = {
  all: ["reparto"] as const,
  processes: () => [...repartoKeys.all, "processes"] as const,
  processList: (params: RepartoListParams = {}) =>
    [...repartoKeys.processes(), "list", normalizeListParams(params)] as const,
  process: (processId?: string) =>
    [...repartoKeys.processes(), "detail", resolveProcessId(processId) ?? null] as const,
  dashboard: (processId?: string) =>
    [...repartoKeys.process(processId), "dashboard"] as const,
  summary: (processId?: string) =>
    [...repartoKeys.process(processId), "summary"] as const,
  meetingSessions: (processId?: string) =>
    [...repartoKeys.process(processId), "meeting-sessions"] as const,
  teacherLan: (processId?: string) =>
    [...repartoKeys.process(processId), "teacher-lan"] as const,
  versions: (processId?: string) =>
    [...repartoKeys.process(processId), "versions"] as const,
  exports: (processId?: string) =>
    [...repartoKeys.process(processId), "exports"] as const
} as const;
