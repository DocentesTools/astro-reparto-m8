export type RepartoMetaLike = {
  // ``contract`` accepts the GET /meta nested object ``{ name, version, range }``
  // — the shape auth-sdk-m8 ServiceMeta actually returns — or a flat string.
  // The flat ``*_contract_version`` keys below are the legacy shape and stay
  // accepted; reparto-docente-m8 itself serves neither of them.
  contract?: unknown;
  contract_version?: unknown;
  reparto_contract_version?: unknown;
  service_version?: unknown;
  // Extra GET /meta keys, accepted so the raw payload is assignable as-is.
  service?: unknown;
  version?: unknown;
  api_version?: unknown;
};

export const REPARTO_CONTRACT_ID = "reparto-docente-m8";
export const REPARTO_CONTRACT_VERSION_NUMBER = "2.0.0";
export const REPARTO_CONTRACT_VERSION =
  `${REPARTO_CONTRACT_ID}@${REPARTO_CONTRACT_VERSION_NUMBER}` as const;

export type RepartoContractMethod = "GET" | "POST" | "PATCH" | "DELETE";

export type RepartoContractOperation = {
  readonly method: RepartoContractMethod;
  readonly path: string;
  readonly response: string;
};

export const REPARTO_CONTRACT_OPERATIONS = {
  "schools.list": {
    method: "GET",
    path: "/schools/",
    response: "SchoolsPublic"
  },
  "schools.get": {
    method: "GET",
    path: "/schools/{school_id}",
    response: "SchoolPublic"
  },
  "schools.create": {
    method: "POST",
    path: "/schools/",
    response: "SchoolPublic"
  },
  "schools.update": {
    method: "PATCH",
    path: "/schools/{school_id}",
    response: "SchoolPublic"
  },
  "academicYears.list": {
    method: "GET",
    path: "/academic-years/",
    response: "AcademicYearsPublic"
  },
  "academicYears.get": {
    method: "GET",
    path: "/academic-years/{year_id}",
    response: "AcademicYearPublic"
  },
  "academicYears.create": {
    method: "POST",
    path: "/academic-years/",
    response: "AcademicYearPublic"
  },
  "academicYears.update": {
    method: "PATCH",
    path: "/academic-years/{year_id}",
    response: "AcademicYearPublic"
  },
  "academicYears.archive": {
    method: "POST",
    path: "/academic-years/{year_id}/archive",
    response: "AcademicYearPublic"
  },
  "departments.list": {
    method: "GET",
    path: "/departments/",
    response: "DepartmentsPublic"
  },
  "departments.get": {
    method: "GET",
    path: "/departments/{department_id}",
    response: "DepartmentPublic"
  },
  "departments.create": {
    method: "POST",
    path: "/departments/",
    response: "DepartmentPublic"
  },
  "departments.update": {
    method: "PATCH",
    path: "/departments/{department_id}",
    response: "DepartmentPublic"
  },
  "classroomStages.list": {
    method: "GET",
    path: "/classroom-stages/",
    response: "ClassroomStagesPublic"
  },
  "classroomStages.get": {
    method: "GET",
    path: "/classroom-stages/{stage_id}",
    response: "ClassroomStagePublic"
  },
  "classroomStages.create": {
    method: "POST",
    path: "/classroom-stages/",
    response: "ClassroomStagePublic"
  },
  "classroomStages.update": {
    method: "PATCH",
    path: "/classroom-stages/{stage_id}",
    response: "ClassroomStagePublic"
  },
  "classroomStages.remove": {
    method: "DELETE",
    path: "/classroom-stages/{stage_id}",
    response: "ClassroomStagePublic"
  },
  "teacherProfiles.list": {
    method: "GET",
    path: "/teacher-profiles/",
    response: "TeacherProfilesPublic"
  },
  "teacherProfiles.get": {
    method: "GET",
    path: "/teacher-profiles/{profile_id}",
    response: "TeacherProfilePublic"
  },
  "teacherProfiles.create": {
    method: "POST",
    path: "/teacher-profiles/",
    response: "TeacherProfilePublic"
  },
  "teacherProfiles.update": {
    method: "PATCH",
    path: "/teacher-profiles/{profile_id}",
    response: "TeacherProfilePublic"
  },
  "teacherProfiles.linkUser": {
    method: "POST",
    path: "/teacher-profiles/{profile_id}/link-user",
    response: "TeacherProfilePublic"
  },
  "teacherProfiles.issueClaimCode": {
    method: "POST",
    path: "/teacher-profiles/{profile_id}/claim-code",
    response: "TeacherProfileClaimCode"
  },
  "teacherProfiles.claim": {
    method: "POST",
    path: "/teacher-profiles/claim",
    response: "TeacherProfilePublic"
  },
  "teacherProfiles.remove": {
    method: "DELETE",
    path: "/teacher-profiles/{profile_id}",
    response: "TeacherProfilePublic"
  },
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
  "processTeachers.list": {
    method: "GET",
    path: "/assignment-processes/{process_id}/teachers/",
    response: "ProcessTeachersPublic"
  },
  "processTeachers.get": {
    method: "GET",
    path: "/assignment-processes/{process_id}/teachers/{process_teacher_id}",
    response: "ProcessTeacherPublic"
  },
  "processTeachers.create": {
    method: "POST",
    path: "/assignment-processes/{process_id}/teachers/",
    response: "ProcessTeacherPublic"
  },
  "processTeachers.update": {
    method: "PATCH",
    path: "/assignment-processes/{process_id}/teachers/{process_teacher_id}",
    response: "ProcessTeacherPublic"
  },
  "processTeachers.remove": {
    method: "DELETE",
    path: "/assignment-processes/{process_id}/teachers/{process_teacher_id}",
    response: "ProcessTeacherPublic"
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
  "auditEvents.list": {
    method: "GET",
    path: "/assignment-processes/{process_id}/audit-events/",
    response: "AuditEventsPublic"
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
  "subjects.list": {
    method: "GET",
    path: "/assignment-processes/{process_id}/subjects/",
    response: "SubjectsPublic"
  },
  "subjects.get": {
    method: "GET",
    path: "/assignment-processes/{process_id}/subjects/{subject_id}",
    response: "SubjectPublic"
  },
  "subjects.create": {
    method: "POST",
    path: "/assignment-processes/{process_id}/subjects/",
    response: "SubjectPublic"
  },
  "subjects.update": {
    method: "PATCH",
    path: "/assignment-processes/{process_id}/subjects/{subject_id}",
    response: "SubjectPublic"
  },
  "subjects.remove": {
    method: "DELETE",
    path: "/assignment-processes/{process_id}/subjects/{subject_id}",
    response: "SubjectPublic"
  },
  "teachingGroups.list": {
    method: "GET",
    path: "/assignment-processes/{process_id}/groups/",
    response: "TeachingGroupsPublic"
  },
  "teachingGroups.get": {
    method: "GET",
    path: "/assignment-processes/{process_id}/groups/{group_id}",
    response: "TeachingGroupPublic"
  },
  "teachingGroups.create": {
    method: "POST",
    path: "/assignment-processes/{process_id}/groups/",
    response: "TeachingGroupPublic"
  },
  "teachingGroups.bulkCreate": {
    method: "POST",
    path: "/assignment-processes/{process_id}/groups/bulk",
    response: "TeachingGroupsPublic"
  },
  "teachingGroups.update": {
    method: "PATCH",
    path: "/assignment-processes/{process_id}/groups/{group_id}",
    response: "TeachingGroupPublic"
  },
  "teachingGroups.remove": {
    method: "DELETE",
    path: "/assignment-processes/{process_id}/groups/{group_id}",
    response: "TeachingGroupPublic"
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
  "groupSubjects.retire": {
    method: "POST",
    path:
      "/assignment-processes/{process_id}/group-subjects/{group_subject_id}/retire",
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
  "groupSubjects.syncPreview": {
    method: "POST",
    path:
      "/assignment-processes/{process_id}/group-subjects/{group_subject_id}/sync-preview",
    response: "MainActivitySyncPreview"
  },
  "groupSubjects.syncApply": {
    method: "POST",
    path:
      "/assignment-processes/{process_id}/group-subjects/{group_subject_id}/sync-apply",
    response: "MainActivitySyncResult"
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
  "teachingPlans.unlock": {
    method: "POST",
    path: "/assignment-processes/{process_id}/teaching-plan/unlock",
    response: "TeachingPlanPublic"
  },
  "teachingPlans.feasibilityWitness": {
    method: "GET",
    path:
      "/assignment-processes/{process_id}/teaching-plan/feasibility/witness",
    response: "FeasibilityWitnessPublic"
  },
  "teachingPlans.evaluateFeasibility": {
    method: "POST",
    path: "/assignment-processes/{process_id}/teaching-plan/feasibility/evaluate",
    response: "FeasibilityEvaluationPublic"
  },
  "teachingPlans.feasibilityDiagnostics": {
    method: "GET",
    path:
      "/assignment-processes/{process_id}/teaching-plan/feasibility/diagnostics",
    response: "FeasibilityDiagnosticsPublic"
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
  "teachingActivities.retire": {
    method: "POST",
    path:
      "/assignment-processes/{process_id}/teaching-activities/{activity_id}/retire",
    response: "TeachingActivityPublic"
  },
  "hourRequirements.list": {
    method: "GET",
    path: "/assignment-processes/{process_id}/requirements/",
    response: "HourRequirementsPublic"
  },
  "hourRequirements.get": {
    method: "GET",
    path: "/assignment-processes/{process_id}/requirements/{requirement_id}",
    response: "HourRequirementPublic"
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

// Name-qualified only. A bare ``"2.0.0"`` used to sit in this set, and
// prompt-engine-m8 serves exactly ``contract.version == "2.0.0"`` — so any
// sibling's /meta read as a valid reparto contract. A bare version is now
// admitted only after ``contract.name`` has identified the service (see
// ``qualifyContract`` below).
const SUPPORTED_CONTRACTS = new Set<string>([REPARTO_CONTRACT_VERSION]);

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

// Read ``contract.version`` from the GET /meta nested contract object, matching
// the reader astro-auth-m8, astro-media-m8 and astro-prompt-m8 already carry
// rather than inventing a fourth dialect.
function contractObjectVersion(value: unknown): string | undefined {
  if (typeof value === "object" && value !== null) {
    return stringValue((value as { version?: unknown }).version);
  }
  return undefined;
}

// Read ``contract.name`` from the GET /meta nested contract object, matching the
// reader astro-auth-m8 already carries rather than inventing a second dialect.
//
// The flat contract forms carry the issuer id inline
// (``reparto-docente-m8@2.0.0``), but the nested object splits id and version
// apart. Without reading ``name`` the version check alone would bless any
// service whose contract happens to sit at the same version — and
// ``mount_service_meta`` is a shared auth-sdk-m8 helper, so every M8 service
// serves this same payload shape at ``{API_PREFIX}/meta``. A host pointed at the
// wrong sibling is exactly the misconfiguration this guard exists to name.
function contractObjectName(value: unknown): string | undefined {
  if (typeof value === "object" && value !== null) {
    return stringValue((value as { name?: unknown }).name);
  }
  return undefined;
}

// Qualify a bare version (``"2.0.0"``) with the issuer id, but only once the
// payload has named this service. An unnamed bare version stays unqualified and
// therefore unsupported: it could have come from any sibling.
function qualifyContract(contract: string, contractName: string | undefined): string {
  if (contract.includes("@") || contractName !== REPARTO_CONTRACT_ID) return contract;
  return `${REPARTO_CONTRACT_ID}@${contract}`;
}

/**
 * Assert the service metadata names a supported reparto-docente-m8 contract.
 *
 * Reads the nested ``contract: { name, version, range }`` object the service
 * actually serves at ``{API_PREFIX}/meta`` first, then falls back to the flat
 * legacy keys. Throws on anything else — this guard is binary and fail-closed.
 *
 * ``contract.name`` is checked *before* the version so a host pointed at the
 * wrong sibling is reported as a wrong service rather than as a version
 * mismatch.
 */
export function assertRepartoCompatibility(meta: RepartoMetaLike): void {
  const contractName = contractObjectName(meta.contract);
  if (contractName && contractName !== REPARTO_CONTRACT_ID) {
    throw new Error(
      `Expected the ${REPARTO_CONTRACT_ID} contract, received the ${contractName} contract` +
        " - check the configured reparto API base"
    );
  }

  const contract =
    stringValue(meta.reparto_contract_version) ??
    stringValue(meta.contract_version) ??
    contractObjectVersion(meta.contract) ??
    stringValue(meta.contract);
  if (!contract || !SUPPORTED_CONTRACTS.has(qualifyContract(contract, contractName))) {
    throw new Error(`Unsupported reparto-docente-m8 contract: ${contract ?? "unknown"}`);
  }
}
