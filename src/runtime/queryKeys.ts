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
  classroomStages: () => [...repartoKeys.all, "classroom-stages"] as const,
  processes: () => [...repartoKeys.all, "processes"] as const,
  // Every page of the process list, without its params. A settings change
  // rewrites a row that may sit on any page and there is no way to know which,
  // so the prefix — not one `processList(params)` key — is what a process
  // mutation invalidates.
  processLists: () => [...repartoKeys.processes(), "list"] as const,
  processList: (params: RepartoListParams = {}) =>
    [...repartoKeys.processLists(), normalizeListParams(params)] as const,
  process: (processId?: string) =>
    [...repartoKeys.processes(), "detail", resolveProcessId(processId) ?? null] as const,
  dashboard: (processId?: string) =>
    [...repartoKeys.process(processId), "dashboard"] as const,
  summary: (processId?: string) =>
    [...repartoKeys.process(processId), "summary"] as const,
  meetingSessions: (processId?: string) =>
    [...repartoKeys.process(processId), "meeting-sessions"] as const,
  // The turn order belongs to one meeting session, not to the process: a
  // reopened meeting is a second session with its own turns, and caching both
  // under the process key would serve the closed session's order to the open
  // one. Nested under `meetingSessions` so closing or reopening a session
  // invalidates its turns with the same prefix.
  selectionTurns: (processId?: string, meetingSessionId?: string) =>
    [
      ...repartoKeys.meetingSessions(processId),
      "turns",
      meetingSessionId ?? null
    ] as const,
  teacherLan: (processId?: string) =>
    [...repartoKeys.process(processId), "teacher-lan"] as const,
  versions: (processId?: string) =>
    [...repartoKeys.process(processId), "versions"] as const,
  // A comparison is keyed by the ordered pair it diffs: `right − left` is not
  // symmetric, so `(a, b)` and `(b, a)` are two different answers and must not
  // share a cache entry. Both sit under `versions` so capturing a new version
  // invalidates the list and every comparison drawn from it with one prefix.
  versionComparison: (
    processId?: string,
    leftVersionId?: string | null,
    rightVersionId?: string | null
  ) =>
    [
      ...repartoKeys.versions(processId),
      "comparison",
      leftVersionId ?? null,
      rightVersionId ?? null
    ] as const,
  previousYearComparison: (processId?: string) =>
    [...repartoKeys.versions(processId), "previous-year"] as const,
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
  // The group-subject matrix. A bulk apply touches many cells at once, so
  // invalidating this one prefix is the whole matrix — there is deliberately no
  // per-cell key to keep partially-stale rows from surviving a bulk operation.
  groupSubjects: (processId?: string) =>
    [...repartoKeys.process(processId), "group-subjects"] as const,
  teachingPlan: (processId?: string) =>
    [...repartoKeys.process(processId), "teaching-plan"] as const,
  teachingPlanSummary: (processId?: string) =>
    [...repartoKeys.teachingPlan(processId), "summary"] as const,
  teachingPlanValidations: (processId?: string) =>
    [...repartoKeys.teachingPlan(processId), "validations"] as const,
  // The latest evaluation's findings; nested under the plan so any plan
  // invalidation also drops a diagnostics projection the mutation just made
  // stale (the backend resets feasibility to NOT_EVALUATED on the same paths).
  teachingPlanFeasibilityDiagnostics: (processId?: string) =>
    [...repartoKeys.teachingPlan(processId), "feasibility-diagnostics"] as const,
  // Restricted administrator-only witness. It stays under the plan prefix so
  // every occupancy/plan mutation invalidates the provisional mapping.
  teachingPlanFeasibilityWitness: (processId?: string) =>
    [...repartoKeys.teachingPlan(processId), "feasibility-witness"] as const,
  teachingActivities: (processId?: string) =>
    [...repartoKeys.process(processId), "teaching-activities"] as const,
  teachingActivity: (processId?: string, activityId?: string) =>
    [
      ...repartoKeys.teachingActivities(processId),
      "detail",
      activityId ?? null
    ] as const,
  teachingGroups: (processId?: string) =>
    [...repartoKeys.process(processId), "groups"] as const,
  hourRequirements: (processId?: string) =>
    [...repartoKeys.process(processId), "requirements"] as const,
  // Allocation-revision history; the current revision is nested under it so
  // that recording a revision can invalidate both with one prefix.
  allocationRevisions: (processId?: string) =>
    [...repartoKeys.process(processId), "allocation-revisions"] as const,
  currentAllocationRevision: (processId?: string) =>
    [...repartoKeys.allocationRevisions(processId), "current"] as const,
  processTeachers: (processId?: string) =>
    [...repartoKeys.process(processId), "teachers"] as const,
  // Slot occupancy for the process. The assignment-stage validations are nested
  // underneath, so one prefix invalidates the board and the findings it reads
  // together — an occupancy change always changes both.
  assignments: (processId?: string) =>
    [...repartoKeys.process(processId), "assignments"] as const,
  assignmentValidations: (processId?: string) =>
    [...repartoKeys.assignments(processId), "validations"] as const,
  auditEvents: (processId?: string) =>
    [...repartoKeys.process(processId), "audit-events"] as const
} as const;
