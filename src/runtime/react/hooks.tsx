import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { academicYears } from "../api/academicYears.js";
import { assignmentProcesses } from "../api/assignmentProcesses.js";
import { assignments } from "../api/assignments.js";
import { auditEvents } from "../api/auditEvents.js";
import { classroomStages } from "../api/classroomStages.js";
import { departments } from "../api/departments.js";
import { history } from "../api/history.js";
import { hourRequirements } from "../api/hourRequirements.js";
import { meetingSessions } from "../api/meetingSessions.js";
import { processTeachers } from "../api/processTeachers.js";
import { schools } from "../api/schools.js";
import { subjects } from "../api/subjects.js";
import { teacherProfiles } from "../api/teacherProfiles.js";
import { teachingGroups } from "../api/teachingGroups.js";
import type {
  AcademicYearCreate,
  AcademicYearUpdate,
  AssignmentCreate,
  AssignmentDirectChoice,
  AssignmentProcessCreate,
  AssignmentUpdate,
  ClassroomStageCreate,
  ClassroomStageUpdate,
  DepartmentCreate,
  DepartmentUpdate,
  HourRequirementCreateInput,
  HourRequirementUpdate,
  ProcessTeacherCreateInput,
  ProcessTeacherUpdate,
  SchoolCreate,
  SchoolUpdate,
  SubjectCreateInput,
  SubjectUpdate,
  TeacherProfileCreate,
  TeacherProfileLinkUser,
  TeacherProfileUpdate,
  TeachingGroupCreateInput,
  TeachingGroupBulkCreate,
  TeachingGroupUpdate
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
      void queryClient.invalidateQueries({ queryKey: repartoKeys.processes() });
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
      void queryClient.invalidateQueries({ queryKey: repartoKeys.schools() });
    }
  });
}

export function useUpdateRepartoSchool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ schoolId, body }: { schoolId: string; body: SchoolUpdate }) =>
      schools.update(schoolId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: repartoKeys.schools() });
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
      void queryClient.invalidateQueries({ queryKey: repartoKeys.academicYears() });
    }
  });
}

export function useUpdateRepartoAcademicYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ yearId, body }: { yearId: string; body: AcademicYearUpdate }) =>
      academicYears.update(yearId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: repartoKeys.academicYears() });
    }
  });
}

export function useArchiveRepartoAcademicYear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (yearId: string) => academicYears.archive(yearId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: repartoKeys.academicYears() });
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
      void queryClient.invalidateQueries({ queryKey: repartoKeys.departments() });
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
      void queryClient.invalidateQueries({ queryKey: repartoKeys.departments() });
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
      void queryClient.invalidateQueries({ queryKey: repartoKeys.teacherProfiles() });
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
      void queryClient.invalidateQueries({ queryKey: repartoKeys.teacherProfiles() });
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
      void queryClient.invalidateQueries({ queryKey: repartoKeys.teacherProfiles() });
    }
  });
}

export function useDeleteRepartoTeacherProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) => teacherProfiles.remove(profileId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: repartoKeys.teacherProfiles() });
    }
  });
}

export function useRepartoSubjects(processId?: string) {
  const resolvedProcessId = resolveProcessId(processId);
  return useQuery({
    queryKey: repartoKeys.subjects(processId),
    queryFn: () => subjects.list(requireProcessId(processId)),
    enabled: Boolean(resolvedProcessId)
  });
}

export function useCreateRepartoSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ processId, body }: { processId: string; body: SubjectCreateInput }) =>
      subjects.create(processId, body),
    onSuccess: (_data, { processId }) => {
      void queryClient.invalidateQueries({ queryKey: repartoKeys.subjects(processId) });
    }
  });
}

export function useUpdateRepartoSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      processId,
      subjectId,
      body
    }: {
      processId: string;
      subjectId: string;
      body: SubjectUpdate;
    }) => subjects.update(processId, subjectId, body),
    onSuccess: (_data, { processId }) => {
      void queryClient.invalidateQueries({ queryKey: repartoKeys.subjects(processId) });
    }
  });
}

export function useDeleteRepartoSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      processId,
      subjectId
    }: {
      processId: string;
      subjectId: string;
    }) => subjects.remove(processId, subjectId),
    onSuccess: (_data, { processId }) => {
      void queryClient.invalidateQueries({ queryKey: repartoKeys.subjects(processId) });
    }
  });
}

export function useRepartoClassroomStages() {
  return useQuery({
    queryKey: repartoKeys.classroomStages(),
    queryFn: classroomStages.list
  });
}

export function useCreateRepartoClassroomStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ClassroomStageCreate) => classroomStages.create(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: repartoKeys.classroomStages() })
  });
}

export function useUpdateRepartoClassroomStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ stageId, body }: { stageId: string; body: ClassroomStageUpdate }) => classroomStages.update(stageId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: repartoKeys.classroomStages() })
  });
}

export function useDeleteRepartoClassroomStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stageId: string) => classroomStages.remove(stageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: repartoKeys.classroomStages() })
  });
}

export function useRepartoTeachingGroups(processId?: string) {
  const resolvedProcessId = resolveProcessId(processId);
  return useQuery({
    queryKey: repartoKeys.teachingGroups(processId),
    queryFn: () => teachingGroups.list(requireProcessId(processId)),
    enabled: Boolean(resolvedProcessId)
  });
}

export function useCreateRepartoTeachingGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      processId,
      body
    }: {
      processId: string;
      body: TeachingGroupCreateInput;
    }) => teachingGroups.create(processId, body),
    onSuccess: (_data, { processId }) => {
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.teachingGroups(processId)
      });
    }
  });
}

export function useBulkCreateRepartoTeachingGroups() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ processId, body }: { processId: string; body: TeachingGroupBulkCreate }) => teachingGroups.bulkCreate(processId, body),
    onSuccess: (_data, { processId }) => queryClient.invalidateQueries({ queryKey: repartoKeys.teachingGroups(processId) })
  });
}

export function useUpdateRepartoTeachingGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      processId,
      groupId,
      body
    }: {
      processId: string;
      groupId: string;
      body: TeachingGroupUpdate;
    }) => teachingGroups.update(processId, groupId, body),
    onSuccess: (_data, { processId }) => {
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.teachingGroups(processId)
      });
    }
  });
}

export function useDeleteRepartoTeachingGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      processId,
      groupId
    }: {
      processId: string;
      groupId: string;
    }) => teachingGroups.remove(processId, groupId),
    onSuccess: (_data, { processId }) => {
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.teachingGroups(processId)
      });
    }
  });
}

export function useRepartoHourRequirements(processId?: string) {
  const resolvedProcessId = resolveProcessId(processId);
  return useQuery({
    queryKey: repartoKeys.hourRequirements(processId),
    queryFn: () => hourRequirements.list(requireProcessId(processId)),
    enabled: Boolean(resolvedProcessId)
  });
}

export function useCreateRepartoHourRequirement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      processId,
      body
    }: {
      processId: string;
      body: HourRequirementCreateInput;
    }) => hourRequirements.create(processId, body),
    onSuccess: (_data, { processId }) => {
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.hourRequirements(processId)
      });
    }
  });
}

export function useUpdateRepartoHourRequirement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      processId,
      requirementId,
      body
    }: {
      processId: string;
      requirementId: string;
      body: HourRequirementUpdate;
    }) => hourRequirements.update(processId, requirementId, body),
    onSuccess: (_data, { processId }) => {
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.hourRequirements(processId)
      });
    }
  });
}

export function useDeleteRepartoHourRequirement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      processId,
      requirementId
    }: {
      processId: string;
      requirementId: string;
    }) => hourRequirements.remove(processId, requirementId),
    onSuccess: (_data, { processId }) => {
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.hourRequirements(processId)
      });
    }
  });
}

export function useRepartoProcessTeachers(processId?: string) {
  const resolvedProcessId = resolveProcessId(processId);
  return useQuery({
    queryKey: repartoKeys.processTeachers(processId),
    queryFn: () => processTeachers.list(requireProcessId(processId)),
    enabled: Boolean(resolvedProcessId)
  });
}

export function useCreateRepartoProcessTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      processId,
      body
    }: {
      processId: string;
      body: ProcessTeacherCreateInput;
    }) => processTeachers.create(processId, body),
    onSuccess: (_data, { processId }) => {
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.processTeachers(processId)
      });
    }
  });
}

export function useUpdateRepartoProcessTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      processId,
      processTeacherId,
      body
    }: {
      processId: string;
      processTeacherId: string;
      body: ProcessTeacherUpdate;
    }) => processTeachers.update(processId, processTeacherId, body),
    onSuccess: (_data, { processId }) => {
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.processTeachers(processId)
      });
    }
  });
}

export function useDeleteRepartoProcessTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      processId,
      processTeacherId
    }: {
      processId: string;
      processTeacherId: string;
    }) => processTeachers.remove(processId, processTeacherId),
    onSuccess: (_data, { processId }) => {
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.processTeachers(processId)
      });
    }
  });
}

export function useRepartoAssignments(processId?: string) {
  const resolvedProcessId = resolveProcessId(processId);
  return useQuery({
    queryKey: repartoKeys.assignments(processId),
    queryFn: () => assignments.list(requireProcessId(processId)),
    enabled: Boolean(resolvedProcessId)
  });
}

export function useCreateRepartoAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ processId, body }: { processId: string; body: AssignmentCreate }) =>
      assignments.create(processId, body),
    onSuccess: (_data, { processId }) => {
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.assignments(processId)
      });
    }
  });
}

export function useUpdateRepartoAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      processId,
      assignmentId,
      body
    }: {
      processId: string;
      assignmentId: string;
      body: AssignmentUpdate;
    }) => assignments.update(processId, assignmentId, body),
    onSuccess: (_data, { processId }) => {
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.assignments(processId)
      });
    }
  });
}

export function useDeleteRepartoAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      processId,
      assignmentId
    }: {
      processId: string;
      assignmentId: string;
    }) => assignments.remove(processId, assignmentId),
    onSuccess: (_data, { processId }) => {
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.assignments(processId)
      });
    }
  });
}

export function useRepartoDirectChoiceAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ processId, body }: { processId: string; body: AssignmentDirectChoice }) =>
      assignments.directChoice(processId, body),
    onSuccess: (_data, { processId }) => {
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.assignments(processId)
      });
    }
  });
}

export function useRepartoAuditEvents(processId?: string) {
  const resolvedProcessId = resolveProcessId(processId);
  return useQuery({
    queryKey: repartoKeys.auditEvents(processId),
    queryFn: () => auditEvents.list(requireProcessId(processId)),
    enabled: Boolean(resolvedProcessId)
  });
}
