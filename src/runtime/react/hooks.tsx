import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { academicYears } from "../api/academicYears.js";
import { allocationRevisions } from "../api/allocationRevisions.js";
import { assignmentProcesses } from "../api/assignmentProcesses.js";
import { assignments } from "../api/assignments.js";
import { auditEvents } from "../api/auditEvents.js";
import { classroomStages } from "../api/classroomStages.js";
import { departments } from "../api/departments.js";
import { groupSubjects } from "../api/groupSubjects.js";
import { history } from "../api/history.js";
import { hourRequirements } from "../api/hourRequirements.js";
import { meetingSessions } from "../api/meetingSessions.js";
import {
  planningExchange,
  planningExportRequest
} from "../api/planningExchange.js";
import { processTeachers } from "../api/processTeachers.js";
import { schools } from "../api/schools.js";
import { subjects } from "../api/subjects.js";
import { teacherProfiles } from "../api/teacherProfiles.js";
import { teachingActivities } from "../api/teachingActivities.js";
import { teachingGroups } from "../api/teachingGroups.js";
import { teachingPlans } from "../api/teachingPlans.js";
import type {
  AcademicYearCreate,
  AcademicYearUpdate,
  AssignmentCreate,
  AssignmentDirectChoice,
  AssignmentProcessCreate,
  AssignmentReassign,
  AssignmentUndo,
  AssignmentUpdate,
  ClassroomStageCreate,
  ClassroomStageUpdate,
  DepartmentCreate,
  DepartmentUpdate,
  DepartmentHourAllocationRevisionCreateInput,
  GroupSubjectBulkApplyRequestInput,
  GroupSubjectBulkRequestInput,
  ProcessTeacherCreateInput,
  ProcessTeacherExtraHoursInput,
  ProcessTeacherUpdateInput,
  ProcessVersionCreate,
  ExportArtifactCreate,
  PlanningExportMode,
  PlanningImportRequest,
  ExportBackupRestore,
  RequirementReconcileRequestInput,
  SchoolCreate,
  SchoolUpdate,
  SubjectCreateInput,
  SubjectUpdateInput,
  TeacherProfileCreate,
  TeacherProfileLinkUser,
  TeacherProfileUpdate,
  TeachingActivityCreateInput,
  TeachingActivityUpdateInput,
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

export function useRepartoProcess(processId?: string) {
  const resolvedProcessId = resolveProcessId(processId);
  return useQuery({
    queryKey: repartoKeys.process(processId),
    queryFn: () => assignmentProcesses.get(requireProcessId(processId)),
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

/**
 * Capture the current three-stage state as an immutable version (§10.2).
 *
 * Invalidates the version list only. A snapshot reads the process; it does not
 * change it, so nothing else in the cache went stale.
 */
export function useCreateRepartoVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      processId,
      body = {}
    }: {
      processId: string;
      body?: ProcessVersionCreate;
    }) => history.createVersion(processId, body),
    onSuccess: (_version, variables) => {
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.versions(variables.processId)
      });
    }
  });
}

/**
 * Diff two stored versions along the §10.3 dimensions.
 *
 * Disabled unless both ids are present and distinct: comparing a version with
 * itself answers "every flag false", which reads as "nothing changed" when the
 * truth is "nothing was compared". `buildVersionSelectionState` decides that
 * on the view side; this is the same rule at the query boundary.
 */
export function useRepartoVersionComparison(
  processId?: string,
  leftVersionId?: string | null,
  rightVersionId?: string | null
) {
  const resolvedProcessId = resolveProcessId(processId);
  const comparable =
    Boolean(resolvedProcessId) &&
    Boolean(leftVersionId) &&
    Boolean(rightVersionId) &&
    leftVersionId !== rightVersionId;
  return useQuery({
    queryKey: repartoKeys.versionComparison(
      processId,
      leftVersionId,
      rightVersionId
    ),
    queryFn: () =>
      history.compareVersions(
        requireProcessId(processId),
        String(leftVersionId),
        String(rightVersionId)
      ),
    enabled: comparable
  });
}

/**
 * Diff the live process against its previous-year source (§10.1, §10.3).
 *
 * `enabled` is the caller's, because the service answers 400 for a process
 * that was not copied from another one: the view asks only once it has read
 * `created_from_process_id` and knows there is a source to diff against.
 */
export function useRepartoPreviousYearComparison(
  processId?: string,
  enabled = true
) {
  const resolvedProcessId = resolveProcessId(processId);
  return useQuery({
    queryKey: repartoKeys.previousYearComparison(processId),
    queryFn: () => history.comparePreviousYear(requireProcessId(processId)),
    enabled: Boolean(resolvedProcessId) && enabled
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

/**
 * Produce one planning artifact (§7.8).
 *
 * A mutation rather than a query even though it changes nothing: the service
 * exposes it as `POST`, the artifact is generated on demand, and a head asks
 * for it deliberately — caching yesterday's draft under a query key would show
 * a plan that has since moved. Nothing is invalidated for the same reason.
 */
export function useCreateRepartoPlanningExport() {
  return useMutation({
    mutationFn: ({
      processId,
      mode
    }: {
      processId: string;
      mode: PlanningExportMode;
    }) => planningExportRequest(mode)(processId)
  });
}

/**
 * Store one process document (`POST /exports`).
 *
 * The `final` type archives the process on the service side, so the process
 * detail and both projections are invalidated with the artifact list rather
 * than only the list the new row lands in.
 */
export function useCreateRepartoExportArtifact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      processId,
      body
    }: {
      processId: string;
      body: ExportArtifactCreate;
    }) => history.createExport(processId, body),
    onSuccess: (_artifact, { processId, body }) => {
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.exports(processId)
      });
      if (body.export_type !== "final") return;
      for (const queryKey of [
        repartoKeys.process(processId),
        repartoKeys.processes(),
        repartoKeys.dashboard(processId),
        repartoKeys.summary(processId)
      ]) {
        void queryClient.invalidateQueries({ queryKey });
      }
    }
  });
}

/**
 * Import planning activities and refresh every projection derived from them.
 *
 * No plan-status or balance precondition lives here: draft/provisional import
 * is deliberately allowed to produce an inexact plan, and the result carries
 * the authoritative follow-up findings.
 */
export function useImportRepartoPlanning() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      processId,
      body
    }: {
      processId: string;
      body: PlanningImportRequest;
    }) => planningExchange.importPlanning(processId, body),
    onSuccess: (_result, { processId }) => {
      for (const queryKey of [
        repartoKeys.teachingActivities(processId),
        repartoKeys.teachingPlan(processId),
        repartoKeys.hourRequirements(processId),
        repartoKeys.assignments(processId),
        repartoKeys.dashboard(processId),
        repartoKeys.summary(processId),
        repartoKeys.auditEvents(processId)
      ]) {
        void queryClient.invalidateQueries({ queryKey });
      }
    }
  });
}

/** Restore a JSON backup into the selected empty draft process (§10.4). */
export function useRestoreRepartoDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      processId,
      body
    }: {
      processId: string;
      body: ExportBackupRestore;
    }) => history.restoreDraft(processId, body),
    onSuccess: (_process, { processId }) => {
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.process(processId)
      });
      void queryClient.invalidateQueries({ queryKey: repartoKeys.processes() });
    }
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
      body: SubjectUpdateInput;
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

export function useRepartoGroupSubjects(processId?: string) {
  const resolvedProcessId = resolveProcessId(processId);
  return useQuery({
    queryKey: repartoKeys.groupSubjects(processId),
    queryFn: () => groupSubjects.list(requireProcessId(processId)),
    enabled: Boolean(resolvedProcessId)
  });
}

export function useRepartoTeachingPlanSummary(processId?: string) {
  const resolvedProcessId = resolveProcessId(processId);
  return useQuery({
    queryKey: repartoKeys.teachingPlanSummary(processId),
    queryFn: () => teachingPlans.summary(requireProcessId(processId)),
    enabled: Boolean(resolvedProcessId)
  });
}

export function useRepartoTeachingPlan(processId?: string) {
  const resolvedProcessId = resolveProcessId(processId);
  return useQuery({
    queryKey: repartoKeys.teachingPlan(processId),
    queryFn: () => teachingPlans.get(requireProcessId(processId)),
    enabled: Boolean(resolvedProcessId)
  });
}

export function useRepartoTeachingPlanValidations(processId?: string) {
  const resolvedProcessId = resolveProcessId(processId);
  return useQuery({
    queryKey: repartoKeys.teachingPlanValidations(processId),
    queryFn: () => teachingPlans.validations(requireProcessId(processId)),
    enabled: Boolean(resolvedProcessId)
  });
}

export function useRepartoFeasibilityDiagnostics(
  processId?: string,
  enabled = true
) {
  const resolvedProcessId = resolveProcessId(processId);
  return useQuery({
    queryKey: repartoKeys.teachingPlanFeasibilityDiagnostics(processId),
    queryFn: () =>
      teachingPlans.feasibilityDiagnostics(requireProcessId(processId)),
    enabled: Boolean(resolvedProcessId) && enabled
  });
}

export function useEvaluateRepartoFeasibility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (processId: string) =>
      teachingPlans.evaluateFeasibility(processId),
    onSuccess: (_data, processId) => {
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.teachingPlan(processId)
      });
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.teachingPlanValidations(processId)
      });
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.teachingPlanFeasibilityDiagnostics(processId)
      });
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.dashboard(processId)
      });
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.summary(processId)
      });
    }
  });
}

export function useLockRepartoTeachingPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (processId: string) => teachingPlans.lock(processId),
    onSuccess: (_data, processId) => {
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.teachingPlan(processId)
      });
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.teachingPlanValidations(processId)
      });
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.dashboard(processId)
      });
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.summary(processId)
      });
    }
  });
}

export function useRepartoTeachingActivities(processId?: string) {
  const resolvedProcessId = resolveProcessId(processId);
  return useQuery({
    queryKey: repartoKeys.teachingActivities(processId),
    queryFn: () => teachingActivities.list(requireProcessId(processId)),
    enabled: Boolean(resolvedProcessId)
  });
}

function invalidateTeachingActivityProjections(
  queryClient: ReturnType<typeof useQueryClient>,
  processId: string
) {
  void queryClient.invalidateQueries({
    queryKey: repartoKeys.teachingActivities(processId)
  });
  void queryClient.invalidateQueries({
    queryKey: repartoKeys.teachingPlan(processId)
  });
  void queryClient.invalidateQueries({
    queryKey: repartoKeys.hourRequirements(processId)
  });
  void queryClient.invalidateQueries({
    queryKey: repartoKeys.dashboard(processId)
  });
  void queryClient.invalidateQueries({
    queryKey: repartoKeys.summary(processId)
  });
}

export function useCreateRepartoTeachingActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      processId,
      body
    }: {
      processId: string;
      body: TeachingActivityCreateInput;
    }) => teachingActivities.create(processId, body),
    onSuccess: (_data, { processId }) => {
      invalidateTeachingActivityProjections(queryClient, processId);
    }
  });
}

export function useUpdateRepartoTeachingActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      processId,
      activityId,
      body
    }: {
      processId: string;
      activityId: string;
      body: TeachingActivityUpdateInput;
    }) => teachingActivities.update(processId, activityId, body),
    onSuccess: (_data, { processId }) => {
      invalidateTeachingActivityProjections(queryClient, processId);
    }
  });
}

export function useDeleteRepartoTeachingActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      processId,
      activityId
    }: {
      processId: string;
      activityId: string;
    }) => teachingActivities.remove(processId, activityId),
    onSuccess: (_data, { processId }) => {
      invalidateTeachingActivityProjections(queryClient, processId);
    }
  });
}

export function useMaterializeRepartoMainActivities() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (processId: string) => teachingPlans.materializeMain(processId),
    onSuccess: (_data, processId) => {
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.teachingActivities(processId)
      });
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.teachingPlan(processId)
      });
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.hourRequirements(processId)
      });
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.dashboard(processId)
      });
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.summary(processId)
      });
    }
  });
}

export function usePreviewRepartoGroupSubjects() {
  return useMutation({
    mutationFn: ({
      processId,
      body
    }: {
      processId: string;
      body: GroupSubjectBulkRequestInput;
    }) => groupSubjects.bulkPreview(processId, body)
  });
}

export function useApplyRepartoGroupSubjects() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      processId,
      body
    }: {
      processId: string;
      body: GroupSubjectBulkApplyRequestInput;
    }) => groupSubjects.bulkApply(processId, body),
    onSuccess: (_data, { processId }) => {
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.groupSubjects(processId)
      });
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

export function useRepartoAllocationRevisions(processId?: string) {
  const resolvedProcessId = resolveProcessId(processId);
  return useQuery({
    queryKey: repartoKeys.allocationRevisions(processId),
    queryFn: () => allocationRevisions.list(requireProcessId(processId)),
    enabled: Boolean(resolvedProcessId)
  });
}

export function useRepartoCurrentAllocationRevision(processId?: string) {
  const resolvedProcessId = resolveProcessId(processId);
  return useQuery({
    queryKey: repartoKeys.currentAllocationRevision(processId),
    queryFn: () => allocationRevisions.current(requireProcessId(processId)),
    enabled: Boolean(resolvedProcessId)
  });
}

function invalidateAllocationChangeProjections(
  queryClient: ReturnType<typeof useQueryClient>,
  processId: string
) {
  void queryClient.invalidateQueries({
    queryKey: repartoKeys.allocationRevisions(processId)
  });
  void queryClient.invalidateQueries({
    queryKey: repartoKeys.teachingPlan(processId)
  });
  void queryClient.invalidateQueries({
    queryKey: repartoKeys.hourRequirements(processId)
  });
  void queryClient.invalidateQueries({
    queryKey: repartoKeys.dashboard(processId)
  });
  void queryClient.invalidateQueries({
    queryKey: repartoKeys.summary(processId)
  });
}

export function useCreateRepartoAllocationRevision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      processId,
      body
    }: {
      processId: string;
      body: DepartmentHourAllocationRevisionCreateInput;
    }) => allocationRevisions.create(processId, body),
    onSuccess: (_data, { processId }) => {
      invalidateAllocationChangeProjections(queryClient, processId);
    }
  });
}

export function usePreviewRepartoRequirementGeneration() {
  return useMutation({
    mutationFn: (processId: string) =>
      hourRequirements.generationPreview(processId)
  });
}

export function usePreviewRepartoRequirementReconciliation() {
  return useMutation({
    mutationFn: (processId: string) =>
      hourRequirements.reconciliationPreview(processId)
  });
}

export function useReconcileRepartoRequirements() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      processId,
      body
    }: {
      processId: string;
      body: RequirementReconcileRequestInput;
    }) => hourRequirements.reconcile(processId, body),
    onSuccess: (_data, { processId }) => {
      invalidateAllocationChangeProjections(queryClient, processId);
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.assignments(processId)
      });
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.auditEvents(processId)
      });
    }
  });
}

export function useGenerateRepartoRequirements() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (processId: string) => hourRequirements.generate(processId),
    onSuccess: (_data, processId) => {
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.teachingPlan(processId)
      });
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.hourRequirements(processId)
      });
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.dashboard(processId)
      });
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.summary(processId)
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
      body: ProcessTeacherUpdateInput;
    }) => processTeachers.update(processId, processTeacherId, body),
    onSuccess: (_data, { processId }) => {
      invalidateParticipantProjections(queryClient, processId);
    }
  });
}

/**
 * Authorize extra weekly hours for one participant.
 *
 * Changing the authorized overload moves the participant target, which moves
 * the teacher-load balance, the plan validations and every teacher's own LAN
 * payload — so this invalidates the planning projections too, not only the
 * participant list.
 */
export function useUpdateRepartoProcessTeacherExtraHours() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      processId,
      processTeacherId,
      body
    }: {
      processId: string;
      processTeacherId: string;
      body: ProcessTeacherExtraHoursInput;
    }) => processTeachers.extraHours(processId, processTeacherId, body),
    onSuccess: (_data, { processId }) => {
      invalidateParticipantProjections(queryClient, processId);
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.teachingPlan(processId)
      });
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.auditEvents(processId)
      });
    }
  });
}

/**
 * A participant's target feeds the dashboard, the summary and the teacher's own
 * LAN view, so none of them may keep showing the previous figure.
 */
function invalidateParticipantProjections(
  queryClient: ReturnType<typeof useQueryClient>,
  processId: string
) {
  for (const queryKey of [
    repartoKeys.processTeachers(processId),
    repartoKeys.dashboard(processId),
    repartoKeys.summary(processId),
    repartoKeys.teacherLan(processId)
  ]) {
    void queryClient.invalidateQueries({ queryKey });
  }
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

export function useRepartoAssignmentValidations(processId?: string) {
  const resolvedProcessId = resolveProcessId(processId);
  return useQuery({
    queryKey: repartoKeys.assignmentValidations(processId),
    queryFn: () => assignments.validations(requireProcessId(processId)),
    enabled: Boolean(resolvedProcessId)
  });
}

/**
 * Every occupancy change moves more than the assignment list: the slot's own
 * status flips between available and assigned, the assignment-stage findings
 * change with it, and both process projections plus the audit trail follow. One
 * shared invalidation keeps a board from showing a slot as free while its row
 * already has a teacher.
 */
function invalidateAssignmentProjections(
  queryClient: ReturnType<typeof useQueryClient>,
  processId: string
) {
  for (const queryKey of [
    repartoKeys.assignments(processId),
    repartoKeys.hourRequirements(processId),
    repartoKeys.dashboard(processId),
    repartoKeys.summary(processId),
    repartoKeys.auditEvents(processId)
  ]) {
    void queryClient.invalidateQueries({ queryKey });
  }
}

export function useCreateRepartoAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ processId, body }: { processId: string; body: AssignmentCreate }) =>
      assignments.create(processId, body),
    onSuccess: (_data, { processId }) => {
      invalidateAssignmentProjections(queryClient, processId);
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
      // Notes only: no slot, teacher or lifecycle state can change here.
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.assignments(processId)
      });
    }
  });
}

export function useUndoRepartoAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      processId,
      assignmentId,
      body
    }: {
      processId: string;
      assignmentId: string;
      body: AssignmentUndo;
    }) => assignments.undo(processId, assignmentId, body),
    onSuccess: (_data, { processId }) => {
      invalidateAssignmentProjections(queryClient, processId);
      // An undo re-enters the completed meeting turn of the released teacher.
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.meetingSessions(processId)
      });
    }
  });
}

export function useReassignRepartoAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      processId,
      assignmentId,
      body
    }: {
      processId: string;
      assignmentId: string;
      body: AssignmentReassign;
    }) => assignments.reassign(processId, assignmentId, body),
    onSuccess: (_data, { processId }) => {
      invalidateAssignmentProjections(queryClient, processId);
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.meetingSessions(processId)
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
      invalidateAssignmentProjections(queryClient, processId);
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.teacherLan(processId)
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
