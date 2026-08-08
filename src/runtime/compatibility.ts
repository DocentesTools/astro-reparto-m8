export type RepartoMetaLike = {
  contract_version?: string;
  reparto_contract_version?: string;
  service_version?: string;
};

export const REPARTO_CONTRACT_VERSION = "reparto-docente-m8@2.0.0";

export type RepartoContractMethod = "GET" | "POST" | "PATCH" | "DELETE";

export type RepartoContractOperation = {
  readonly method: RepartoContractMethod;
  readonly path: string;
  readonly response: string;
};

export const REPARTO_CONTRACT_OPERATIONS = {
  "assignmentProcesses.list": {
    method: "GET",
    path: "/assignment-processes/",
    response: "AssignmentProcessesPublic"
  },
  "assignmentProcesses.get": {
    method: "GET",
    path: "/assignment-processes/{process_id}",
    response: "AssignmentProcessPublic"
  },
  "assignmentProcesses.create": {
    method: "POST",
    path: "/assignment-processes/",
    response: "AssignmentProcessPublic"
  },
  "assignmentProcesses.update": {
    method: "PATCH",
    path: "/assignment-processes/{process_id}",
    response: "AssignmentProcessPublic"
  },
  "assignmentProcesses.transition": {
    method: "POST",
    path: "/assignment-processes/{process_id}/transition",
    response: "AssignmentProcessPublic"
  },
  "assignmentProcesses.reopen": {
    method: "POST",
    path: "/assignment-processes/{process_id}/reopen",
    response: "AssignmentProcessPublic"
  },
  "assignmentProcesses.summary": {
    method: "GET",
    path: "/assignment-processes/{process_id}/summary",
    response: "ProcessSummary"
  },
  "assignmentProcesses.dashboard": {
    method: "GET",
    path: "/assignment-processes/{process_id}/dashboard",
    response: "ProcessDashboard"
  },
  "assignmentProcesses.myLanSummary": {
    method: "GET",
    path: "/assignment-processes/{process_id}/lan/me",
    response: "TeacherLanSummary"
  },
  "assignmentProcesses.events": {
    method: "GET",
    path: "/assignment-processes/{process_id}/events",
    response: "text/event-stream"
  },
  "meetingSessions.list": {
    method: "GET",
    path: "/assignment-processes/{process_id}/meeting-sessions/",
    response: "MeetingSessionsPublic"
  },
  "meetingSessions.create": {
    method: "POST",
    path: "/assignment-processes/{process_id}/meeting-sessions/",
    response: "MeetingSessionPublic"
  },
  "meetingSessions.update": {
    method: "PATCH",
    path: "/assignment-processes/{process_id}/meeting-sessions/{meeting_session_id}",
    response: "MeetingSessionPublic"
  },
  "meetingSessions.close": {
    method: "POST",
    path:
      "/assignment-processes/{process_id}/meeting-sessions/{meeting_session_id}/close",
    response: "MeetingSessionPublic"
  },
  "processTeachers.extraHours": {
    method: "POST",
    path:
      "/assignment-processes/{process_id}/teachers/{process_teacher_id}/extra-hours",
    response: "ProcessTeacherPublic"
  },
  "selectionTurns.list": {
    method: "GET",
    path:
      "/assignment-processes/{process_id}/meeting-sessions/{meeting_session_id}/turns/",
    response: "SelectionTurnsPublic"
  },
  "selectionTurns.initialize": {
    method: "POST",
    path:
      "/assignment-processes/{process_id}/meeting-sessions/{meeting_session_id}/turns/initialize",
    response: "SelectionTurnsPublic"
  },
  "selectionTurns.start": {
    method: "POST",
    path:
      "/assignment-processes/{process_id}/meeting-sessions/{meeting_session_id}/turns/{turn_id}/start",
    response: "SelectionTurnPublic"
  },
  "selectionTurns.complete": {
    method: "POST",
    path:
      "/assignment-processes/{process_id}/meeting-sessions/{meeting_session_id}/turns/{turn_id}/complete",
    response: "SelectionTurnPublic"
  },
  "selectionTurns.skip": {
    method: "POST",
    path:
      "/assignment-processes/{process_id}/meeting-sessions/{meeting_session_id}/turns/{turn_id}/skip",
    response: "SelectionTurnPublic"
  },
  "selectionTurns.override": {
    method: "POST",
    path:
      "/assignment-processes/{process_id}/meeting-sessions/{meeting_session_id}/turns/{turn_id}/override",
    response: "SelectionTurnPublic"
  },
  "assignments.list": {
    method: "GET",
    path: "/assignment-processes/{process_id}/assignments/",
    response: "AssignmentsPublic"
  },
  "assignments.get": {
    method: "GET",
    path: "/assignment-processes/{process_id}/assignments/{assignment_id}",
    response: "AssignmentPublic"
  },
  "assignments.validations": {
    method: "GET",
    path: "/assignment-processes/{process_id}/assignments/validations",
    response: "AssignmentValidationReport"
  },
  "assignments.create": {
    method: "POST",
    path: "/assignment-processes/{process_id}/assignments/",
    response: "AssignmentPublic"
  },
  "assignments.update": {
    method: "PATCH",
    path: "/assignment-processes/{process_id}/assignments/{assignment_id}",
    response: "AssignmentPublic"
  },
  "assignments.undo": {
    method: "POST",
    path: "/assignment-processes/{process_id}/assignments/{assignment_id}/undo",
    response: "AssignmentPublic"
  },
  "assignments.reassign": {
    method: "POST",
    path:
      "/assignment-processes/{process_id}/assignments/{assignment_id}/reassign",
    response: "AssignmentPublic"
  },
  "assignments.directChoice": {
    method: "POST",
    path: "/assignment-processes/{process_id}/assignments/direct-choice",
    response: "AssignmentPublic"
  },
  "history.listVersions": {
    method: "GET",
    path: "/assignment-processes/{process_id}/versions",
    response: "ProcessVersionsPublic"
  },
  "history.createVersion": {
    method: "POST",
    path: "/assignment-processes/{process_id}/versions",
    response: "ProcessVersionPublic"
  },
  "history.compareVersions": {
    method: "GET",
    path:
      "/assignment-processes/{process_id}/versions/{left_version_id}/compare/{right_version_id}",
    response: "VersionComparison"
  },
  "history.comparePreviousYear": {
    method: "GET",
    path: "/assignment-processes/{process_id}/compare-previous-year",
    response: "VersionComparison"
  },
  "history.listExports": {
    method: "GET",
    path: "/assignment-processes/{process_id}/exports",
    response: "ExportArtifactsPublic"
  },
  "history.createExport": {
    method: "POST",
    path: "/assignment-processes/{process_id}/exports",
    response: "ExportArtifactPublic"
  },
  "planningExchange.exportDraft": {
    method: "POST",
    path: "/assignment-processes/{process_id}/exports/planning-draft",
    response: "PlanningExportArtifact"
  },
  "planningExchange.exportProvisional": {
    method: "POST",
    path: "/assignment-processes/{process_id}/exports/planning-provisional",
    response: "PlanningExportArtifact"
  },
  "planningExchange.exportFinal": {
    method: "POST",
    path: "/assignment-processes/{process_id}/exports/planning-final",
    response: "PlanningExportArtifact"
  },
  "planningExchange.importPlanning": {
    method: "POST",
    path: "/assignment-processes/{process_id}/imports/planning",
    response: "PlanningImportResult"
  },
  "history.restoreDraft": {
    method: "POST",
    path: "/assignment-processes/{process_id}/restore-draft",
    response: "AssignmentProcessPublic"
  },
  "allocationRevisions.list": {
    method: "GET",
    path: "/assignment-processes/{process_id}/allocation-revisions/",
    response: "DepartmentHourAllocationRevisionsPublic"
  },
  "allocationRevisions.current": {
    method: "GET",
    path: "/assignment-processes/{process_id}/allocation-revisions/current",
    response: "DepartmentHourAllocationRevisionPublic"
  },
  "allocationRevisions.create": {
    method: "POST",
    path: "/assignment-processes/{process_id}/allocation-revisions/",
    response: "DepartmentHourAllocationRevisionPublic"
  },
  "groupSubjects.list": {
    method: "GET",
    path: "/assignment-processes/{process_id}/group-subjects/",
    response: "GroupSubjectsPublic"
  },
  "groupSubjects.get": {
    method: "GET",
    path: "/assignment-processes/{process_id}/group-subjects/{group_subject_id}",
    response: "GroupSubjectPublic"
  },
  "groupSubjects.create": {
    method: "POST",
    path: "/assignment-processes/{process_id}/group-subjects/",
    response: "GroupSubjectPublic"
  },
  "groupSubjects.update": {
    method: "PATCH",
    path: "/assignment-processes/{process_id}/group-subjects/{group_subject_id}",
    response: "GroupSubjectPublic"
  },
  "groupSubjects.remove": {
    method: "DELETE",
    path: "/assignment-processes/{process_id}/group-subjects/{group_subject_id}",
    response: "GroupSubjectPublic"
  },
  "groupSubjects.bulkPreview": {
    method: "POST",
    path: "/assignment-processes/{process_id}/group-subjects/bulk-preview",
    response: "GroupSubjectBulkPreview"
  },
  "groupSubjects.bulkApply": {
    method: "POST",
    path: "/assignment-processes/{process_id}/group-subjects/bulk-apply",
    response: "GroupSubjectBulkResult"
  },
  "teachingPlans.get": {
    method: "GET",
    path: "/assignment-processes/{process_id}/teaching-plan",
    response: "TeachingPlanPublic"
  },
  "teachingPlans.create": {
    method: "POST",
    path: "/assignment-processes/{process_id}/teaching-plan",
    response: "TeachingPlanPublic"
  },
  "teachingPlans.summary": {
    method: "GET",
    path: "/assignment-processes/{process_id}/teaching-plan/summary",
    response: "PlanBalance"
  },
  "teachingPlans.validations": {
    method: "GET",
    path: "/assignment-processes/{process_id}/teaching-plan/validations",
    response: "PlanValidationReport"
  },
  "teachingPlans.lock": {
    method: "POST",
    path: "/assignment-processes/{process_id}/teaching-plan/lock",
    response: "TeachingPlanPublic"
  },
  "teachingPlans.feasibilityWitness": {
    method: "GET",
    path:
      "/assignment-processes/{process_id}/teaching-plan/feasibility/witness",
    response: "FeasibilityWitnessPublic"
  },
  "teachingPlans.materializeMain": {
    method: "POST",
    path: "/assignment-processes/{process_id}/teaching-plan/materialize-main",
    response: "MainMaterializationResult"
  },
  "teachingActivities.list": {
    method: "GET",
    path: "/assignment-processes/{process_id}/teaching-activities/",
    response: "TeachingActivitiesPublic"
  },
  "teachingActivities.get": {
    method: "GET",
    path: "/assignment-processes/{process_id}/teaching-activities/{activity_id}",
    response: "TeachingActivityPublic"
  },
  "teachingActivities.create": {
    method: "POST",
    path: "/assignment-processes/{process_id}/teaching-activities/",
    response: "TeachingActivityPublic"
  },
  "teachingActivities.update": {
    method: "PATCH",
    path: "/assignment-processes/{process_id}/teaching-activities/{activity_id}",
    response: "TeachingActivityPublic"
  },
  "teachingActivities.remove": {
    method: "DELETE",
    path: "/assignment-processes/{process_id}/teaching-activities/{activity_id}",
    response: "TeachingActivityPublic"
  },
  "hourRequirements.generationPreview": {
    method: "POST",
    path: "/assignment-processes/{process_id}/requirements/generation-preview",
    response: "RequirementGenerationPreview"
  },
  "hourRequirements.generate": {
    method: "POST",
    path: "/assignment-processes/{process_id}/requirements/generate",
    response: "RequirementGenerationResult"
  },
  "hourRequirements.reconciliationPreview": {
    method: "POST",
    path:
      "/assignment-processes/{process_id}/requirements/reconciliation-preview",
    response: "RequirementReconciliationPreview"
  },
  "hourRequirements.reconcile": {
    method: "POST",
    path: "/assignment-processes/{process_id}/requirements/reconcile",
    response: "RequirementReconciliationResult"
  }
} as const satisfies Record<string, RepartoContractOperation>;

const SUPPORTED_CONTRACTS = new Set([REPARTO_CONTRACT_VERSION, "2.0.0"]);

export function assertRepartoCompatibility(meta: RepartoMetaLike): void {
  const contract = meta.reparto_contract_version ?? meta.contract_version;
  if (!contract || !SUPPORTED_CONTRACTS.has(contract)) {
    throw new Error(`Unsupported reparto-docente-m8 contract: ${contract ?? "unknown"}`);
  }
}
