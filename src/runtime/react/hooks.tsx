import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  academicYears,
  assignmentProcesses,
  departments,
  history,
  meetingSessions,
  schools,
  teacherProfiles
} from "../api/index.js";
import type {
  AcademicYearCreate,
  AcademicYearUpdate,
  AssignmentProcessCreate,
  DepartmentCreate,
  DepartmentUpdate,
  SchoolCreate,
  SchoolUpdate,
  TeacherProfileCreate,
  TeacherProfileLinkUser,
  TeacherProfileUpdate
} from "../schemas.js";
import {
  normalizeAcademicYearListParams,
  normalizeDepartmentListParams,
  normalizeListParams,
  normalizeSchoolListParams,
  normalizeTeacherProfileListParams,
  repartoKeys,
  requireProcessId,
  resolveProcessId,
  type RepartoAcademicYearListParams,
  type RepartoDepartmentListParams,
  type RepartoListParams,
  type RepartoSchoolListParams,
  type RepartoTeacherProfileListParams
} from "../queryKeys.js";

export function useRepartoProcesses(params: RepartoListParams = {}) {
  const listParams = normalizeListParams(params);
  return useQuery({
    queryKey: repartoKeys.processList(listParams),
    queryFn: () => assignmentProcesses.list(listParams)
  });
}

export function useCreateRepartoProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AssignmentProcessCreate) =>
      assignmentProcesses.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repartoKeys.processes() });
    }
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

export function useRepartoSchools(params: RepartoSchoolListParams = {}) {
  const listParams = normalizeSchoolListParams(params);
  return useQuery({
    queryKey: repartoKeys.schoolList(listParams),
    queryFn: () => schools.list(listParams)
  });
}

export function useCreateRepartoSchool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SchoolCreate) => schools.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repartoKeys.schools() });
    }
  });
}

export function useUpdateRepartoSchool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ schoolId, body }: { schoolId: string; body: SchoolUpdate }) =>
      schools.update(schoolId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repartoKeys.schools() });
    }
  });
}

export function useRepartoAcademicYears(
  params: RepartoAcademicYearListParams = {}
) {
  const listParams = normalizeAcademicYearListParams(params);
  return useQuery({
    queryKey: repartoKeys.academicYearList(listParams),
    queryFn: () => academicYears.list(listParams)
  });
}

export function useCreateRepartoAcademicYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AcademicYearCreate) => academicYears.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repartoKeys.academicYears() });
    }
  });
}

export function useUpdateRepartoAcademicYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ yearId, body }: { yearId: string; body: AcademicYearUpdate }) =>
      academicYears.update(yearId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repartoKeys.academicYears() });
    }
  });
}

export function useArchiveRepartoAcademicYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (yearId: string) => academicYears.archive(yearId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repartoKeys.academicYears() });
    }
  });
}

export function useRepartoDepartments(
  params: RepartoDepartmentListParams = {}
) {
  const listParams = normalizeDepartmentListParams(params);
  return useQuery({
    queryKey: repartoKeys.departmentList(listParams),
    queryFn: () => departments.list(listParams)
  });
}

export function useCreateRepartoDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: DepartmentCreate) => departments.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repartoKeys.departments() });
    }
  });
}

export function useUpdateRepartoDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      departmentId,
      body
    }: {
      departmentId: string;
      body: DepartmentUpdate;
    }) => departments.update(departmentId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repartoKeys.departments() });
    }
  });
}

export function useRepartoTeacherProfiles(
  params: RepartoTeacherProfileListParams = {}
) {
  const listParams = normalizeTeacherProfileListParams(params);
  return useQuery({
    queryKey: repartoKeys.teacherProfileList(listParams),
    queryFn: () => teacherProfiles.list(listParams)
  });
}

export function useCreateRepartoTeacherProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: TeacherProfileCreate) => teacherProfiles.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repartoKeys.teacherProfiles() });
    }
  });
}

export function useUpdateRepartoTeacherProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      profileId,
      body
    }: {
      profileId: string;
      body: TeacherProfileUpdate;
    }) => teacherProfiles.update(profileId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repartoKeys.teacherProfiles() });
    }
  });
}

export function useLinkRepartoTeacherProfileUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      profileId,
      body
    }: {
      profileId: string;
      body: TeacherProfileLinkUser;
    }) => teacherProfiles.linkUser(profileId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repartoKeys.teacherProfiles() });
    }
  });
}

export function useDeleteRepartoTeacherProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) => teacherProfiles.remove(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repartoKeys.teacherProfiles() });
    }
  });
}
