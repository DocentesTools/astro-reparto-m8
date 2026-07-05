import { useQuery } from "@tanstack/react-query";
import {
  assignmentProcesses,
  history,
  meetingSessions
} from "../api/index.js";
import {
  normalizeListParams,
  repartoKeys,
  requireProcessId,
  resolveProcessId,
  type RepartoListParams
} from "../queryKeys.js";

export function useRepartoProcesses(params: RepartoListParams = {}) {
  const listParams = normalizeListParams(params);
  return useQuery({
    queryKey: repartoKeys.processList(listParams),
    queryFn: () => assignmentProcesses.list(listParams)
  });
}

export function useRepartoDashboard(processId?: string) {
  const resolvedProcessId = resolveProcessId(processId);
  return useQuery({
    queryKey: repartoKeys.dashboard(processId),
    queryFn: () => assignmentProcesses.dashboard(requireProcessId(processId)),
    enabled: Boolean(resolvedProcessId)
  });
}

export function useRepartoSummary(processId?: string) {
  const resolvedProcessId = resolveProcessId(processId);
  return useQuery({
    queryKey: repartoKeys.summary(processId),
    queryFn: () => assignmentProcesses.summary(requireProcessId(processId)),
    enabled: Boolean(resolvedProcessId)
  });
}

export function useRepartoMeetingSessions(processId?: string) {
  const resolvedProcessId = resolveProcessId(processId);
  return useQuery({
    queryKey: repartoKeys.meetingSessions(processId),
    queryFn: () => meetingSessions.list(requireProcessId(processId)),
    enabled: Boolean(resolvedProcessId)
  });
}

export function useRepartoTeacherLan(processId?: string) {
  const resolvedProcessId = resolveProcessId(processId);
  return useQuery({
    queryKey: repartoKeys.teacherLan(processId),
    queryFn: () => assignmentProcesses.myLanSummary(requireProcessId(processId)),
    enabled: Boolean(resolvedProcessId)
  });
}

export function useRepartoVersions(processId?: string) {
  const resolvedProcessId = resolveProcessId(processId);
  return useQuery({
    queryKey: repartoKeys.versions(processId),
    queryFn: () => history.listVersions(requireProcessId(processId)),
    enabled: Boolean(resolvedProcessId)
  });
}

export function useRepartoExports(processId?: string) {
  const resolvedProcessId = resolveProcessId(processId);
  return useQuery({
    queryKey: repartoKeys.exports(processId),
    queryFn: () => history.listExports(requireProcessId(processId)),
    enabled: Boolean(resolvedProcessId)
  });
}
