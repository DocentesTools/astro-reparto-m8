export type RepartoListParams = {
  skip?: number;
  limit?: number;
};

export type RepartoSchoolListParams = RepartoListParams;

export type RepartoAcademicYearListParams = RepartoListParams;

export type RepartoDepartmentListParams = RepartoListParams & {
  schoolId?: string | null;
};

export type RepartoTeacherProfileListParams = RepartoListParams & {
  active?: boolean | null;
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

export function normalizeSchoolListParams(
  params: RepartoSchoolListParams = {}
): Required<RepartoSchoolListParams> {
  return normalizeListParams(params);
}

export function normalizeAcademicYearListParams(
  params: RepartoAcademicYearListParams = {}
): Required<RepartoAcademicYearListParams> {
  return normalizeListParams(params);
}

export function normalizeDepartmentListParams(
  params: RepartoDepartmentListParams = {}
): Required<Omit<RepartoDepartmentListParams, "schoolId">> & {
  schoolId: string | null;
} {
  const { schoolId, ...rest } = params;
  return {
    ...normalizeListParams(rest),
    schoolId: schoolId?.trim() ? schoolId.trim() : null
  };
}

export function normalizeTeacherProfileListParams(
  params: RepartoTeacherProfileListParams = {}
): Required<Omit<RepartoTeacherProfileListParams, "active">> & {
  active: boolean | null;
} {
  const { active, ...rest } = params;
  return {
    ...normalizeListParams(rest),
    active: active === undefined ? null : active
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
    [...repartoKeys.process(processId), "exports"] as const,
  schools: () => [...repartoKeys.all, "schools"] as const,
  schoolList: (params: RepartoSchoolListParams = {}) =>
    [...repartoKeys.schools(), "list", normalizeSchoolListParams(params)] as const,
  school: (schoolId?: string) =>
    [...repartoKeys.schools(), "detail", schoolId ?? null] as const,
  academicYears: () => [...repartoKeys.all, "academic-years"] as const,
  academicYearList: (params: RepartoAcademicYearListParams = {}) =>
    [
      ...repartoKeys.academicYears(),
      "list",
      normalizeAcademicYearListParams(params)
    ] as const,
  academicYear: (yearId?: string) =>
    [...repartoKeys.academicYears(), "detail", yearId ?? null] as const,
  departments: () => [...repartoKeys.all, "departments"] as const,
  departmentList: (params: RepartoDepartmentListParams = {}) =>
    [
      ...repartoKeys.departments(),
      "list",
      normalizeDepartmentListParams(params)
    ] as const,
  department: (departmentId?: string) =>
    [...repartoKeys.departments(), "detail", departmentId ?? null] as const,
  teacherProfiles: () => [...repartoKeys.all, "teacher-profiles"] as const,
  teacherProfileList: (params: RepartoTeacherProfileListParams = {}) =>
    [
      ...repartoKeys.teacherProfiles(),
      "list",
      normalizeTeacherProfileListParams(params)
    ] as const,
  teacherProfile: (profileId?: string) =>
    [...repartoKeys.teacherProfiles(), "detail", profileId ?? null] as const,
  subjects: (processId?: string) =>
    [...repartoKeys.process(processId), "subjects"] as const,
  teachingGroups: (processId?: string) =>
    [...repartoKeys.process(processId), "groups"] as const,
  hourRequirements: (processId?: string) =>
    [...repartoKeys.process(processId), "requirements"] as const,
  processTeachers: (processId?: string) =>
    [...repartoKeys.process(processId), "teachers"] as const,
  assignments: (processId?: string) =>
    [...repartoKeys.process(processId), "assignments"] as const,
  auditEvents: (processId?: string) =>
    [...repartoKeys.process(processId), "audit-events"] as const
} as const;
