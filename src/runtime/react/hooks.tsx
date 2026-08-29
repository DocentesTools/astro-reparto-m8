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
import { selectionTurns } from "../api/selectionTurns.js";
import { subjects } from "../api/subjects.js";
import { teacherProfiles } from "../api/teacherProfiles.js";
import { teachingActivities } from "../api/teachingActivities.js";
import { teachingGroups } from "../api/teachingGroups.js";
import { teachingPlans } from "../api/teachingPlans.js";
import type { SetupChecklistObservations } from "../ui/index.js";
import type {
  AcademicYearCreate,
  AcademicYearUpdate,
  AssignmentCreate,
  AssignmentDirectChoice,
  AssignmentProcessCreate,
  AssignmentProcessUpdate,
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
  GroupSubjectCreateInput,
  GroupSubjectUpdateInput,
  MainActivitySyncApplyRequestInput,
  MeetingSessionCreate,
  ProcessReopen,
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
  SelectionTurnAction,
  SelectionTurnComplete,
  SubjectCreateInput,
  SubjectUpdateInput,
  TeacherProfileClaim,
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

/**
 * Everything a process mutation makes stale, in one place.
 *
 * The settings and the reopen edge both change what the *whole* process
 * offers — whether a selection order applies, whether a teacher may choose
 * directly, whether the LAN surface answers, and whether any child resource
 * accepts a write at all — so the process prefix (its detail, dashboard,
 * summary and LAN projection) goes, and so does every page of the list, which
 * prints the status of a row that may sit on any page.
 */
function invalidateProcessProjections(
  queryClient: ReturnType<typeof useQueryClient>,
  processId: string
) {
  void queryClient.invalidateQueries({
    queryKey: repartoKeys.process(processId)
  });
  void queryClient.invalidateQueries({ queryKey: repartoKeys.processLists() });
}

/**
 * Save the §8.2 step 7 process settings (audit finding `S2-03`).
 *
 * The wrapper and `AssignmentProcessUpdateSchema` predate this hook by the
 * whole three-stage adaptation; with nothing calling them a process was
 * create-only and the Stage 3 LAN and direct-selection surfaces could never be
 * switched on. The body is built by `buildProcessSettingsRequest`, which sends
 * only changed fields and never `status` — the service reserves that for
 * `transition`.
 */
export function useUpdateRepartoProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      processId,
      body
    }: {
      processId: string;
      body: AssignmentProcessUpdate;
    }) => assignmentProcesses.update(processId, body),
    onSuccess: (_data, { processId }) => {
      invalidateProcessProjections(queryClient, processId);
    }
  });
}

/**
 * Apply the `final` → `reopened` edge with its recorded reason (`S2-05`).
 *
 * The service's `ensure_process_mutable` answers *"reopen it first"* on every
 * child write of a closed process, and until this hook existed there was no
 * way to comply. Reopening lifts that refusal for every child resource, so it
 * invalidates exactly what a settings save does.
 */
export function useReopenRepartoProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      processId,
      body
    }: {
      processId: string;
      body: ProcessReopen;
    }) => assignmentProcesses.reopen(processId, body),
    onSuccess: (_data, { processId }) => {
      invalidateProcessProjections(queryClient, processId);
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

/**
 * Opening a session can flip the process into `meeting_open` and adopts the
 * session's LAN/direct-selection/selection-mode flags onto the process
 * (`MeetingSessionController._sync_process_flags`), so a create invalidates
 * the whole process prefix — sessions, dashboard, summary and the process
 * detail/list rows that print the status — rather than the session list alone.
 */
export function useCreateRepartoMeetingSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      processId,
      body
    }: {
      processId: string;
      body: MeetingSessionCreate;
    }) => meetingSessions.create(processId, body),
    onSuccess: (_data, { processId }) => {
      invalidateProcessProjections(queryClient, processId);
    }
  });
}

/** Closing a session also disables the process's own LAN and direct-selection
 * flags (`MeetingSessionController.close_session`), so this invalidates the
 * same process prefix a create does. */
export function useCloseRepartoMeetingSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      processId,
      meetingSessionId
    }: {
      processId: string;
      meetingSessionId: string;
    }) => meetingSessions.close(processId, meetingSessionId),
    onSuccess: (_data, { processId }) => {
      invalidateProcessProjections(queryClient, processId);
    }
  });
}

/**
 * One meeting session's turn order (backend plan §9.3).
 *
 * Disabled without a session id rather than defaulted to one: the turns of "no
 * session" are not an empty order, they are an unanswerable question, and a
 * meeting screen must not read an empty list as "nobody is up next".
 */
export function useRepartoSelectionTurns(
  processId?: string,
  meetingSessionId?: string
) {
  const resolvedProcessId = resolveProcessId(processId);
  const resolvedSessionId = meetingSessionId?.trim();
  return useQuery({
    queryKey: repartoKeys.selectionTurns(processId, resolvedSessionId),
    queryFn: () =>
      selectionTurns.list(
        requireProcessId(processId),
        requireMeetingSessionId(resolvedSessionId)
      ),
    enabled: Boolean(resolvedProcessId) && Boolean(resolvedSessionId)
  });
}

function requireMeetingSessionId(meetingSessionId?: string): string {
  const resolved = meetingSessionId?.trim();
  if (!resolved) throw new Error("A concrete meeting session id is required.");
  return resolved;
}

/**
 * Everything a turn action makes stale.
 *
 * A turn is not a private record of the meeting's bookkeeping: starting,
 * completing, skipping or overriding one moves whose turn it is on the head's
 * board, on the projected screen and in every teacher's LAN payload at once,
 * and completing one may create an assignment. So the turn list goes with the
 * assignment projections rather than on its own — a screen showing a finished
 * turn as live is the same defect as a slot shown free after it was taken.
 */
function invalidateSelectionTurnProjections(
  queryClient: ReturnType<typeof useQueryClient>,
  processId: string,
  meetingSessionId: string
) {
  invalidateAssignmentProjections(queryClient, processId);
  void queryClient.invalidateQueries({
    queryKey: repartoKeys.selectionTurns(processId, meetingSessionId)
  });
}

type SelectionTurnScope = {
  processId: string;
  meetingSessionId: string;
};

type SelectionTurnTarget = SelectionTurnScope & { turnId: string };

/** Lay down the whole turn order for an open session (§9.3). */
export function useInitializeRepartoTurns() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ processId, meetingSessionId }: SelectionTurnScope) =>
      selectionTurns.initialize(processId, meetingSessionId),
    onSuccess: (_data, { processId, meetingSessionId }) => {
      invalidateSelectionTurnProjections(queryClient, processId, meetingSessionId);
    }
  });
}

export function useStartRepartoTurn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ processId, meetingSessionId, turnId }: SelectionTurnTarget) =>
      selectionTurns.start(processId, meetingSessionId, turnId),
    onSuccess: (_data, { processId, meetingSessionId }) => {
      invalidateSelectionTurnProjections(queryClient, processId, meetingSessionId);
    }
  });
}

/**
 * Close the live turn, optionally recording the assignment it produced.
 *
 * The body is optional because the position may already have been handed out
 * through the assignment board; the service owns that decision and this hook
 * passes on whatever the caller has, never inventing an assignment.
 */
export function useCompleteRepartoTurn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      processId,
      meetingSessionId,
      turnId,
      body = {}
    }: SelectionTurnTarget & { body?: SelectionTurnComplete }) =>
      selectionTurns.complete(processId, meetingSessionId, turnId, body),
    onSuccess: (_data, { processId, meetingSessionId }) => {
      invalidateSelectionTurnProjections(queryClient, processId, meetingSessionId);
    }
  });
}

/** Pass a turn over. The reason is mandatory: every skip is audited. */
export function useSkipRepartoTurn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      processId,
      meetingSessionId,
      turnId,
      body
    }: SelectionTurnTarget & { body: SelectionTurnAction }) =>
      selectionTurns.skip(processId, meetingSessionId, turnId, body),
    onSuccess: (_data, { processId, meetingSessionId }) => {
      invalidateSelectionTurnProjections(queryClient, processId, meetingSessionId);
    }
  });
}

/** Take a turn out of the head's hands. Audited like a skip, and for the same
 * reason: an overridden turn is a decision somebody made about somebody else. */
export function useOverrideRepartoTurn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      processId,
      meetingSessionId,
      turnId,
      body
    }: SelectionTurnTarget & { body: SelectionTurnAction }) =>
      selectionTurns.override(processId, meetingSessionId, turnId, body),
    onSuccess: (_data, { processId, meetingSessionId }) => {
      invalidateSelectionTurnProjections(queryClient, processId, meetingSessionId);
    }
  });
}

/**
 * The whole selection-turn surface for one meeting session, in one call.
 *
 * The five turn controls are pressed from a single action row, so they are
 * wired from a single hook: a screen that had to assemble five mutations by
 * hand is a screen where one of them quietly stays unbound — which is exactly
 * the state the control room was in. `turns` is the order itself, needed to
 * answer *which* turn `start` starts when no turn is live yet.
 */
export function useSelectionTurns(
  processId?: string,
  meetingSessionId?: string
) {
  return {
    turns: useRepartoSelectionTurns(processId, meetingSessionId),
    initialize: useInitializeRepartoTurns(),
    start: useStartRepartoTurn(),
    complete: useCompleteRepartoTurn(),
    skip: useSkipRepartoTurn(),
    override: useOverrideRepartoTurn()
  } as const;
}

export type RepartoSelectionTurnControls = ReturnType<typeof useSelectionTurns>;

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

/**
 * Mint the single-use code a teacher redeems to claim a profile (`W1.4`).
 *
 * The department head cannot look a colleague's user id up — `fa-auth-m8` owns
 * the accounts directory and restricts it to superusers by its own design — so
 * the roster's old *Link user* button could only ever link the head to
 * themselves. This is the other half of the reversal: the head issues a code
 * and the teacher presents it with their own token.
 *
 * The response is the only time the code exists in readable form, so the caller
 * must show it rather than expect to fetch it back; the roster is invalidated
 * because the mint marks the row as having an outstanding code.
 */
export function useIssueRepartoTeacherProfileClaimCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) => teacherProfiles.issueClaimCode(profileId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: repartoKeys.teacherProfiles() });
    }
  });
}

/**
 * Redeem a claim code against the signed-in account (`W1.4`).
 *
 * Takes a code and nothing else: the account it binds is the caller's own, read
 * from the token by the service, so there is no argument here that could name
 * somebody else.
 *
 * Invalidating the roster is not enough. A successful claim is the moment the
 * caller *becomes* a participant, and every process-scoped teacher projection —
 * the LAN summary above all — was answering "no teacher profile is linked to
 * this auth user" until it happened. So the whole reparto prefix goes, and the
 * dead end the teacher was looking at resolves into their own view.
 */
export function useClaimRepartoTeacherProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: TeacherProfileClaim) => teacherProfiles.claim(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: repartoKeys.all });
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

/** Administrator-only current witness used by the assignment-board prefilter. */
export function useRepartoFeasibilityWitness(
  processId?: string,
  enabled = true
) {
  const resolvedProcessId = resolveProcessId(processId);
  return useQuery({
    queryKey: repartoKeys.teachingPlanFeasibilityWitness(processId),
    queryFn: () => teachingPlans.feasibilityWitness(requireProcessId(processId)),
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

/**
 * Create the process's single teaching plan (§8.3).
 *
 * Nothing creates the plan row with the process, so every Stage 2 read answers
 * 404 until this runs — the plan reads are therefore invalidated alongside the
 * two projections that carry `plan_status`. The backend answers 409 on a
 * second attempt; that is the caller's to present, not an error to swallow.
 */
export function useCreateRepartoTeachingPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (processId: string) => teachingPlans.create(processId),
    onSuccess: (_data, processId) => {
      for (const queryKey of [
        repartoKeys.teachingPlan(processId),
        repartoKeys.teachingPlanSummary(processId),
        repartoKeys.teachingPlanValidations(processId),
        repartoKeys.dashboard(processId),
        repartoKeys.summary(processId)
      ]) {
        void queryClient.invalidateQueries({ queryKey });
      }
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

/**
 * Return a locked pre-generation plan to balanced editing (§20.14, §20.15).
 *
 * The exact inverse of `useLockRepartoTeachingPlan`, so it invalidates exactly
 * what the lock does: the plan itself, its validations (whose blocking findings
 * are re-derived against an editable plan) and the two projections carrying
 * `plan_status`. Nothing else moves — an unlock changes what may be edited, not
 * any requirement slot or assignment, and invalidating those would claim a
 * change that did not happen.
 */
export function useUnlockRepartoTeachingPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (processId: string) => teachingPlans.unlock(processId),
    onSuccess: (_data, processId) => {
      for (const queryKey of [
        repartoKeys.teachingPlan(processId),
        repartoKeys.teachingPlanValidations(processId),
        repartoKeys.dashboard(processId),
        repartoKeys.summary(processId)
      ]) {
        void queryClient.invalidateQueries({ queryKey });
      }
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

/**
 * Guarded retirement (§20.12), not deletion: the activity keeps its row and
 * gains a `retired_at` stamp, and the plan may move to a state that requires
 * regeneration or reconciliation. That is why this invalidates the same five
 * projections a create or an update does — retiring an activity changes the
 * plan's balances and its generated slots, not just the activity list.
 */
export function useRetireRepartoTeachingActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      processId,
      activityId
    }: {
      processId: string;
      activityId: string;
    }) => teachingActivities.retire(processId, activityId),
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

/**
 * Add one matrix cell.
 *
 * The bulk pair fills the matrix a subject at a time across a filtered group
 * range; this is the single-cell exception the range cannot express. Both
 * invalidate exactly the matrix read: writing a cell changes what
 * materialization *could* produce, never what it already produced — the service
 * keeps an existing activity untouched until an explicit sync (§20.14), so
 * invalidating the plan projections here would claim a change that did not
 * happen.
 */
export function useCreateRepartoGroupSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      processId,
      body
    }: {
      processId: string;
      body: GroupSubjectCreateInput;
    }) => groupSubjects.create(processId, body),
    onSuccess: (_data, { processId }) => {
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.groupSubjects(processId)
      });
    }
  });
}

/**
 * Patch one matrix cell's planning values.
 *
 * `teaching_group_id` / `subject_id` are the cell's identity and are not part
 * of the payload: a mis-targeted cell is replaced, never re-pointed.
 */
export function useUpdateRepartoGroupSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      processId,
      groupSubjectId,
      body
    }: {
      processId: string;
      groupSubjectId: string;
      body: GroupSubjectUpdateInput;
    }) => groupSubjects.update(processId, groupSubjectId, body),
    onSuccess: (_data, { processId }) => {
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.groupSubjects(processId)
      });
    }
  });
}

/**
 * Fetch the source/current/diff/impact preview for one materialized activity.
 *
 * A mutation rather than a query even though it changes nothing: the preview
 * is fingerprinted against live state, so it must be requested deliberately at
 * the moment the head opens the panel and must never be served from cache —
 * a cached fingerprint is a stale one, and the apply would 409.
 */
export function usePreviewRepartoActivitySync() {
  return useMutation({
    mutationFn: ({
      processId,
      groupSubjectId
    }: {
      processId: string;
      groupSubjectId: string;
    }) => groupSubjects.syncPreview(processId, groupSubjectId)
  });
}

export function useApplyRepartoActivitySync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      processId,
      groupSubjectId,
      body
    }: {
      processId: string;
      groupSubjectId: string;
      body: MainActivitySyncApplyRequestInput;
    }) => groupSubjects.syncApply(processId, groupSubjectId, body),
    onSuccess: (_data, { processId }) => {
      // An apply rewrites the activity's planning values and may push assigned
      // slots into reconciliation, so the whole planning projection is stale —
      // including feasibility, which the service resets on this path.
      invalidateTeachingActivityProjections(queryClient, processId);
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.groupSubjects(processId)
      });
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.teachingPlanValidations(processId)
      });
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.assignments(processId)
      });
      void queryClient.invalidateQueries({
        queryKey: repartoKeys.auditEvents(processId)
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

/**
 * The Stage 1 counts the setup checklist tests (`S2-07`).
 *
 * The dashboard payload reports on a plan, not on the reference data behind it,
 * so a surface that wants honest *subjects / teaching groups / matrix / allocation*
 * steps has to read them. Five list reads, all of them the same reads the Stage
 * 1 routes make — the shared query cache answers most of them from a route the
 * operator has already visited.
 *
 * Without a process every query is disabled and every count is `null`, which is
 * exactly what `buildSetupChecklist` reads as *not observed* rather than as
 * zero.
 */
export function useRepartoSetupObservations(processId?: string) {
  const resolvedProcessId = resolveProcessId(processId) ?? null;
  const allocationQuery = useRepartoAllocationRevisions(processId);
  const participantsQuery = useRepartoProcessTeachers(processId);
  const subjectsQuery = useRepartoSubjects(processId);
  const teachingGroupsQuery = useRepartoTeachingGroups(processId);
  const groupSubjectsQuery = useRepartoGroupSubjects(processId);
  return {
    allocationRevisionCount: allocationQuery.data?.count ?? null,
    teachingGroupCount: teachingGroupsQuery.data?.count ?? null,
    groupSubjectCount: groupSubjectsQuery.data?.count ?? null,
    participantCount: participantsQuery.data?.count ?? null,
    processId: resolvedProcessId,
    subjectCount: subjectsQuery.data?.count ?? null
  } satisfies SetupChecklistObservations;
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
    repartoKeys.processTeachers(processId),
    repartoKeys.teachingPlan(processId),
    repartoKeys.dashboard(processId),
    repartoKeys.summary(processId),
    repartoKeys.teacherLan(processId),
    repartoKeys.meetingSessions(processId),
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
