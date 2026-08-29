import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  useQuery: vi.fn((options: { enabled?: boolean; queryFn: () => unknown }) => {
    if (options.enabled !== false) {
      options.queryFn();
    }
    return options;
  }),
  useMutation: vi.fn(
    (options: {
      mutationFn: (vars: unknown) => unknown;
      onSuccess?: (data: unknown, vars: unknown) => unknown;
    }) => ({
      isPending: false,
      mutate: (vars: unknown) => {
        const result = options.mutationFn(vars);
        options.onSuccess?.(undefined, vars);
        return result;
      }
    })
  ),
  invalidateQueries: vi.fn(),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: mocks.invalidateQueries
  })),
  assignmentProcesses: {
    list: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    reopen: vi.fn(),
    dashboard: vi.fn(),
    summary: vi.fn(),
    myLanSummary: vi.fn()
  },
  history: {
    listVersions: vi.fn(),
    createVersion: vi.fn(),
    compareVersions: vi.fn(),
    comparePreviousYear: vi.fn(),
    listExports: vi.fn(),
    createExport: vi.fn(),
    restoreDraft: vi.fn()
  },
  planningExchange: {
    exportDraft: vi.fn(),
    exportProvisional: vi.fn(),
    exportFinal: vi.fn(),
    importPlanning: vi.fn()
  },
  meetingSessions: {
    list: vi.fn()
  },
  selectionTurns: {
    list: vi.fn(),
    initialize: vi.fn(),
    start: vi.fn(),
    complete: vi.fn(),
    skip: vi.fn(),
    override: vi.fn()
  },
  schools: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  },
  academicYears: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    archive: vi.fn()
  },
  allocationRevisions: {
    list: vi.fn(),
    current: vi.fn(),
    create: vi.fn()
  },
  departments: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  },
  teacherProfiles: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    linkUser: vi.fn(),
    remove: vi.fn()
  },
  subjects: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn()
  },
  groupSubjects: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    bulkPreview: vi.fn(),
    bulkApply: vi.fn()
  },
  teachingPlans: {
    get: vi.fn(),
    summary: vi.fn(),
    validations: vi.fn(),
    evaluateFeasibility: vi.fn(),
    feasibilityDiagnostics: vi.fn(),
    feasibilityWitness: vi.fn(),
    create: vi.fn(),
    lock: vi.fn(),
    unlock: vi.fn(),
    materializeMain: vi.fn()
  },
  teachingActivities: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    retire: vi.fn()
  },
  teachingGroups: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn()
  },
  hourRequirements: {
    list: vi.fn(),
    generationPreview: vi.fn(),
    generate: vi.fn(),
    reconciliationPreview: vi.fn(),
    reconcile: vi.fn()
  },
  processTeachers: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    extraHours: vi.fn(),
    remove: vi.fn()
  },
  assignments: {
    list: vi.fn(),
    validations: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    undo: vi.fn(),
    reassign: vi.fn(),
    directChoice: vi.fn()
  },
  auditEvents: {
    list: vi.fn()
  }
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: mocks.useQuery,
  useMutation: mocks.useMutation,
  useQueryClient: mocks.useQueryClient
}));

vi.mock("../src/runtime/api/assignmentProcesses.js", () => ({
  assignmentProcesses: mocks.assignmentProcesses
}));
vi.mock("../src/runtime/api/history.js", () => ({
  history: mocks.history
}));
vi.mock("../src/runtime/api/meetingSessions.js", () => ({
  meetingSessions: mocks.meetingSessions
}));
vi.mock("../src/runtime/api/selectionTurns.js", () => ({
  selectionTurns: mocks.selectionTurns
}));
vi.mock("../src/runtime/api/planningExchange.js", () => ({
  planningExchange: mocks.planningExchange,
  planningExportRequest: (mode: "draft" | "provisional" | "final") =>
    mode === "draft"
      ? mocks.planningExchange.exportDraft
      : mode === "provisional"
        ? mocks.planningExchange.exportProvisional
        : mocks.planningExchange.exportFinal
}));
vi.mock("../src/runtime/api/schools.js", () => ({
  schools: mocks.schools
}));
vi.mock("../src/runtime/api/academicYears.js", () => ({
  academicYears: mocks.academicYears
}));
vi.mock("../src/runtime/api/allocationRevisions.js", () => ({
  allocationRevisions: mocks.allocationRevisions
}));
vi.mock("../src/runtime/api/departments.js", () => ({
  departments: mocks.departments
}));
vi.mock("../src/runtime/api/teacherProfiles.js", () => ({
  teacherProfiles: mocks.teacherProfiles
}));
vi.mock("../src/runtime/api/subjects.js", () => ({
  subjects: mocks.subjects
}));
vi.mock("../src/runtime/api/groupSubjects.js", () => ({
  groupSubjects: mocks.groupSubjects
}));
vi.mock("../src/runtime/api/teachingPlans.js", () => ({
  teachingPlans: mocks.teachingPlans
}));
vi.mock("../src/runtime/api/teachingActivities.js", () => ({
  teachingActivities: mocks.teachingActivities
}));
vi.mock("../src/runtime/api/teachingGroups.js", () => ({
  teachingGroups: mocks.teachingGroups
}));
vi.mock("../src/runtime/api/hourRequirements.js", () => ({
  hourRequirements: mocks.hourRequirements
}));
vi.mock("../src/runtime/api/processTeachers.js", () => ({
  processTeachers: mocks.processTeachers
}));
vi.mock("../src/runtime/api/assignments.js", () => ({
  assignments: mocks.assignments
}));
vi.mock("../src/runtime/api/auditEvents.js", () => ({
  auditEvents: mocks.auditEvents
}));

describe("reparto React hooks", () => {
  beforeEach(() => {
    mocks.useQuery.mockClear();
    mocks.useMutation.mockClear();
    mocks.useQueryClient.mockClear();
    mocks.invalidateQueries.mockClear();
    mocks.assignmentProcesses.list.mockClear();
    mocks.assignmentProcesses.dashboard.mockClear();
    mocks.assignmentProcesses.summary.mockClear();
    mocks.assignmentProcesses.myLanSummary.mockClear();
    mocks.assignmentProcesses.get.mockClear();
    mocks.assignmentProcesses.update.mockClear();
    mocks.assignmentProcesses.reopen.mockClear();
    mocks.history.listVersions.mockClear();
    mocks.history.createVersion.mockClear();
    mocks.history.compareVersions.mockClear();
    mocks.history.comparePreviousYear.mockClear();
    mocks.history.listExports.mockClear();
    mocks.history.createExport.mockClear();
    mocks.history.restoreDraft.mockClear();
    mocks.planningExchange.exportDraft.mockClear();
    mocks.planningExchange.exportProvisional.mockClear();
    mocks.planningExchange.exportFinal.mockClear();
    mocks.planningExchange.importPlanning.mockClear();
    mocks.meetingSessions.list.mockClear();
    mocks.schools.list.mockClear();
    mocks.academicYears.list.mockClear();
    mocks.allocationRevisions.list.mockClear();
    mocks.allocationRevisions.current.mockClear();
    mocks.allocationRevisions.create.mockClear();
    mocks.departments.list.mockClear();
    mocks.teacherProfiles.list.mockClear();
    mocks.subjects.list.mockClear();
    mocks.subjects.create.mockClear();
    mocks.subjects.update.mockClear();
    mocks.subjects.remove.mockClear();
    mocks.groupSubjects.list.mockClear();
    mocks.groupSubjects.create.mockClear();
    mocks.groupSubjects.update.mockClear();
    mocks.groupSubjects.bulkPreview.mockClear();
    mocks.groupSubjects.bulkApply.mockClear();
    mocks.teachingPlans.summary.mockClear();
    mocks.teachingPlans.get.mockClear();
    mocks.teachingPlans.validations.mockClear();
    mocks.teachingPlans.evaluateFeasibility.mockClear();
    mocks.teachingPlans.feasibilityDiagnostics.mockClear();
    mocks.teachingPlans.feasibilityWitness.mockClear();
    mocks.teachingPlans.create.mockClear();
    mocks.teachingPlans.lock.mockClear();
    mocks.teachingPlans.unlock.mockClear();
    mocks.teachingPlans.materializeMain.mockClear();
    mocks.teachingActivities.list.mockClear();
    mocks.teachingActivities.create.mockClear();
    mocks.teachingActivities.update.mockClear();
    mocks.teachingActivities.retire.mockClear();
    mocks.teachingGroups.list.mockClear();
    mocks.teachingGroups.create.mockClear();
    mocks.teachingGroups.update.mockClear();
    mocks.teachingGroups.remove.mockClear();
    mocks.hourRequirements.list.mockClear();
    mocks.hourRequirements.generationPreview.mockClear();
    mocks.hourRequirements.generate.mockClear();
    mocks.hourRequirements.reconciliationPreview.mockClear();
    mocks.hourRequirements.reconcile.mockClear();
    mocks.processTeachers.list.mockClear();
    mocks.processTeachers.create.mockClear();
    mocks.processTeachers.update.mockClear();
    mocks.processTeachers.remove.mockClear();
    mocks.assignments.list.mockClear();
    mocks.assignments.validations.mockClear();
    mocks.assignments.create.mockClear();
    mocks.assignments.update.mockClear();
    mocks.assignments.undo.mockClear();
    mocks.assignments.reassign.mockClear();
    mocks.assignments.directChoice.mockClear();
    mocks.auditEvents.list.mockClear();
  });

  it("wires query keys to typed API wrappers", async () => {
    const {
      useRepartoDashboard,
      useRepartoExports,
      useRepartoMeetingSessions,
      useRepartoProcesses,
      useRepartoSummary,
      useRepartoTeacherLan,
      useRepartoVersions
    } = await import("../src/runtime/react/hooks.js");

    useRepartoProcesses({ skip: 5, limit: 10 });
    useRepartoDashboard("process-1");
    useRepartoSummary("process-1");
    useRepartoMeetingSessions("process-1");
    useRepartoTeacherLan("process-1");
    useRepartoVersions("process-1");
    useRepartoExports("process-1");

    expect(mocks.assignmentProcesses.list).toHaveBeenCalledWith({
      skip: 5,
      limit: 10
    });
    expect(mocks.assignmentProcesses.dashboard).toHaveBeenCalledWith("process-1");
    expect(mocks.assignmentProcesses.summary).toHaveBeenCalledWith("process-1");
    expect(mocks.meetingSessions.list).toHaveBeenCalledWith("process-1");
    expect(mocks.assignmentProcesses.myLanSummary).toHaveBeenCalledWith("process-1");
    expect(mocks.history.listVersions).toHaveBeenCalledWith("process-1");
    expect(mocks.history.listExports).toHaveBeenCalledWith("process-1");
    expect(mocks.useQuery).toHaveBeenCalledTimes(7);
  });

  it("disables process-rooted queries until a process is selected", async () => {
    const {
      useRepartoDashboard,
      useRepartoExports,
      useRepartoMeetingSessions,
      useRepartoSummary,
      useRepartoTeacherLan,
      useRepartoVersions
    } = await import("../src/runtime/react/hooks.js");

    useRepartoDashboard();
    useRepartoSummary();
    useRepartoMeetingSessions();
    useRepartoTeacherLan();
    useRepartoVersions();
    useRepartoExports();

    expect(mocks.assignmentProcesses.dashboard).not.toHaveBeenCalled();
    expect(mocks.assignmentProcesses.summary).not.toHaveBeenCalled();
    expect(mocks.assignmentProcesses.myLanSummary).not.toHaveBeenCalled();
    expect(mocks.meetingSessions.list).not.toHaveBeenCalled();
    expect(mocks.history.listVersions).not.toHaveBeenCalled();
    expect(mocks.history.listExports).not.toHaveBeenCalled();
    expect(mocks.useQuery.mock.calls.map(([options]) => options.enabled)).toEqual([
      false,
      false,
      false,
      false,
      false,
      false
    ]);
  });

  it("saves process settings and reopens a closed process (§13.2a S2-03, S2-05)", async () => {
    const { useReopenRepartoProcess, useUpdateRepartoProcess } = await import(
      "../src/runtime/react/hooks.js"
    );

    // The settings change what the whole process offers — its LAN surface, its
    // direct selection, its selection order — so the process prefix goes with
    // every page of the list, and nothing narrower would do.
    mocks.invalidateQueries.mockClear();
    useUpdateRepartoProcess().mutate({
      processId: "process-1",
      body: { lan_access_enabled: true }
    });
    expect(mocks.assignmentProcesses.update).toHaveBeenCalledWith("process-1", {
      lan_access_enabled: true
    });
    expect(
      mocks.invalidateQueries.mock.calls.map(([options]) => options.queryKey)
    ).toEqual([
      ["reparto", "processes", "detail", "process-1"],
      ["reparto", "processes", "list"]
    ]);

    // Reopening lifts `ensure_process_mutable` for every child resource, so it
    // moves exactly what a settings save does.
    mocks.invalidateQueries.mockClear();
    useReopenRepartoProcess().mutate({
      processId: "process-1",
      body: { reason: "leadership returned the proposal" }
    });
    expect(mocks.assignmentProcesses.reopen).toHaveBeenCalledWith("process-1", {
      reason: "leadership returned the proposal"
    });
    expect(
      mocks.invalidateQueries.mock.calls.map(([options]) => options.queryKey)
    ).toEqual([
      ["reparto", "processes", "detail", "process-1"],
      ["reparto", "processes", "list"]
    ]);
  });

  it("wires the version snapshot and comparison hooks (§10.2, §10.3)", async () => {
    const {
      useCreateRepartoVersion,
      useRepartoPreviousYearComparison,
      useRepartoProcess,
      useRepartoVersionComparison
    } = await import("../src/runtime/react/hooks.js");

    useRepartoProcess("process-1");
    expect(mocks.assignmentProcesses.get).toHaveBeenCalledWith("process-1");

    useCreateRepartoVersion().mutate({
      processId: "process-1",
      body: { reason: "before the meeting" }
    });
    expect(mocks.history.createVersion).toHaveBeenCalledWith("process-1", {
      reason: "before the meeting"
    });
    // A snapshot reads the process; only the version list went stale.
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({
      queryKey: [
        "reparto",
        "processes",
        "detail",
        "process-1",
        "versions"
      ]
    });
    mocks.history.createVersion.mockClear();
    useCreateRepartoVersion().mutate({ processId: "process-1" });
    expect(mocks.history.createVersion).toHaveBeenCalledWith("process-1", {});

    useRepartoVersionComparison("process-1", "v1", "v2");
    expect(mocks.history.compareVersions).toHaveBeenCalledWith(
      "process-1",
      "v1",
      "v2"
    );

    useRepartoPreviousYearComparison("process-1");
    expect(mocks.history.comparePreviousYear).toHaveBeenCalledWith("process-1");
  });

  it("wires the three planning exports and the stored documents (§7.8, §20.25)", async () => {
    const { useCreateRepartoExportArtifact, useCreateRepartoPlanningExport } =
      await import("../src/runtime/react/hooks.js");

    // One hook, three endpoints: the mode picks the wrapper rather than
    // becoming a request parameter the service does not have.
    for (const mode of ["draft", "provisional", "final"] as const) {
      useCreateRepartoPlanningExport().mutate({ processId: "process-1", mode });
    }
    expect(mocks.planningExchange.exportDraft).toHaveBeenCalledWith("process-1");
    expect(mocks.planningExchange.exportProvisional).toHaveBeenCalledWith(
      "process-1"
    );
    expect(mocks.planningExchange.exportFinal).toHaveBeenCalledWith("process-1");
    // A planning artifact changes nothing, so nothing is invalidated.
    expect(mocks.invalidateQueries).not.toHaveBeenCalled();

    useCreateRepartoExportArtifact().mutate({
      processId: "process-1",
      body: { export_type: "backup", format: "json" }
    });
    expect(mocks.history.createExport).toHaveBeenCalledWith("process-1", {
      export_type: "backup",
      format: "json"
    });
    expect(mocks.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["reparto", "processes", "detail", "process-1", "exports"]
    });

    // The final document archives the process on the service side, so the
    // process itself and both projections go with the artifact list.
    mocks.invalidateQueries.mockClear();
    useCreateRepartoExportArtifact().mutate({
      processId: "process-1",
      body: { export_type: "final", format: "pdf" }
    });
    expect(mocks.invalidateQueries).toHaveBeenCalledTimes(5);
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["reparto", "processes", "detail", "process-1", "summary"]
    });
  });

  it("refreshes plan projections after import and the restored process tree", async () => {
    const { useImportRepartoPlanning, useRestoreRepartoDraft } = await import(
      "../src/runtime/react/hooks.js"
    );
    const body = {
      activities: [
        {
          subject_id: "11111111-1111-4111-8111-111111111111",
          allocation_category: "secondary" as const,
          activity_type: "ordinary" as const,
          group_weekly_hours_per_group: "2.00",
          teacher_weekly_hours_per_position: "3.00",
          required_teacher_count: 1,
          group_subject_ids: []
        }
      ]
    };
    useImportRepartoPlanning().mutate({ processId: "process-1", body });
    expect(mocks.planningExchange.importPlanning).toHaveBeenCalledWith(
      "process-1",
      body
    );
    expect(mocks.invalidateQueries).toHaveBeenCalledTimes(7);
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["reparto", "processes", "detail", "process-1", "teaching-plan"]
    });

    mocks.invalidateQueries.mockClear();
    useRestoreRepartoDraft().mutate({
      processId: "process-1",
      body: { content: "{}", restore_assignments: false }
    });
    expect(mocks.history.restoreDraft).toHaveBeenCalledWith("process-1", {
      content: "{}",
      restore_assignments: false
    });
    expect(mocks.invalidateQueries).toHaveBeenCalledTimes(2);
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["reparto", "processes", "detail", "process-1"]
    });
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["reparto", "processes"]
    });
  });

  it("refuses a comparison that would answer nothing", async () => {
    const { useRepartoPreviousYearComparison, useRepartoVersionComparison } =
      await import("../src/runtime/react/hooks.js");

    // A version against itself answers "every flag false", which reads as
    // "nothing changed" when the truth is "nothing was compared".
    useRepartoVersionComparison("process-1", "v1", "v1");
    useRepartoVersionComparison("process-1", "v1");
    useRepartoVersionComparison("process-1");
    useRepartoVersionComparison(undefined, "v1", "v2");
    // The service answers 400 without a source process, so the caller gates it.
    useRepartoPreviousYearComparison("process-1", false);
    useRepartoPreviousYearComparison();

    expect(mocks.history.compareVersions).not.toHaveBeenCalled();
    expect(mocks.history.comparePreviousYear).not.toHaveBeenCalled();
    expect(mocks.useQuery.mock.calls.map(([options]) => options.enabled)).toEqual([
      false,
      false,
      false,
      false,
      false,
      false
    ]);
  });

  it("wires global entity list hooks and CRUD mutation hooks (Phase 1)", async () => {
    const {
      useArchiveRepartoAcademicYear,
      useCreateRepartoAcademicYear,
      useCreateRepartoDepartment,
      useCreateRepartoSchool,
      useCreateRepartoTeacherProfile,
      useDeleteRepartoTeacherProfile,
      useLinkRepartoTeacherProfileUser,
      useRepartoAcademicYears,
      useRepartoDepartments,
      useRepartoSchools,
      useRepartoTeacherProfiles,
      useUpdateRepartoAcademicYear,
      useUpdateRepartoDepartment,
      useUpdateRepartoSchool,
      useUpdateRepartoTeacherProfile
    } = await import("../src/runtime/react/hooks.js");

    useRepartoSchools();
    useRepartoAcademicYears({ skip: 1 });
    useRepartoDepartments({ schoolId: "s1" });
    useRepartoTeacherProfiles({ active: true });

    expect(mocks.schools.list).toHaveBeenCalledWith({ skip: 0, limit: 25 });
    expect(mocks.academicYears.list).toHaveBeenCalledWith({ skip: 1, limit: 25 });
    expect(mocks.departments.list).toHaveBeenCalledWith({
      skip: 0,
      limit: 25,
      schoolId: "s1"
    });
    expect(mocks.teacherProfiles.list).toHaveBeenCalledWith({
      skip: 0,
      limit: 25,
      active: true
    });

    const createSchool = useCreateRepartoSchool();
    createSchool.mutate({ name: "S" });
    const updateSchool = useUpdateRepartoSchool();
    updateSchool.mutate({ schoolId: "s1", body: { name: "S2" } });
    const createYear = useCreateRepartoAcademicYear();
    createYear.mutate({
      label: "2025-2026",
      start_date: "2025-09-01",
      end_date: "2026-06-30"
    });
    const updateYear = useUpdateRepartoAcademicYear();
    updateYear.mutate({ yearId: "y1", body: { status: "archived" } });
    const archiveYear = useArchiveRepartoAcademicYear();
    archiveYear.mutate("y1");
    const createDepartment = useCreateRepartoDepartment();
    createDepartment.mutate({ school_id: "s1", name: "Matemáticas" });
    const updateDepartment = useUpdateRepartoDepartment();
    updateDepartment.mutate({ departmentId: "d1", body: { name: "Lengua" } });
    const createProfile = useCreateRepartoTeacherProfile();
    createProfile.mutate({ display_name: "Ana" });
    const updateProfile = useUpdateRepartoTeacherProfile();
    updateProfile.mutate({ profileId: "p1", body: { active: false } });
    const linkUser = useLinkRepartoTeacherProfileUser();
    linkUser.mutate({ profileId: "p1", body: { user_id: "u1" } });
    const deleteProfile = useDeleteRepartoTeacherProfile();
    deleteProfile.mutate("p1");

    expect(mocks.useMutation).toHaveBeenCalledTimes(11);
    expect(mocks.useQueryClient).toHaveBeenCalled();
  });

  it("wires process-scoped entity queries and supported mutations", async () => {
    const {
      useRepartoSubjects,
      useCreateRepartoSubject,
      useUpdateRepartoSubject,
      useDeleteRepartoSubject,
      useRepartoGroupSubjects,
      useRepartoTeachingActivities,
      useCreateRepartoTeachingActivity,
      useUpdateRepartoTeachingActivity,
      useRetireRepartoTeachingActivity,
      useRepartoTeachingPlanSummary,
      useMaterializeRepartoMainActivities,
      usePreviewRepartoGroupSubjects,
      useApplyRepartoGroupSubjects,
      useRepartoTeachingGroups,
      useCreateRepartoTeachingGroup,
      useUpdateRepartoTeachingGroup,
      useDeleteRepartoTeachingGroup,
      useRepartoHourRequirements,
      useRepartoProcessTeachers,
      useCreateRepartoProcessTeacher,
      useUpdateRepartoProcessTeacher,
      useUpdateRepartoProcessTeacherExtraHours,
      useDeleteRepartoProcessTeacher,
      useRepartoAssignments,
      useRepartoAssignmentValidations,
      useCreateRepartoAssignment,
      useUpdateRepartoAssignment,
      useUndoRepartoAssignment,
      useReassignRepartoAssignment,
      useRepartoDirectChoiceAssignment,
      useRepartoAuditEvents
    } = await import("../src/runtime/react/hooks.js");

    useRepartoSubjects("p1");
    useRepartoGroupSubjects("p1");
    useRepartoTeachingActivities("p1");
    useRepartoTeachingPlanSummary("p1");
    useRepartoTeachingGroups("p1");
    useRepartoHourRequirements("p1");
    useRepartoProcessTeachers("p1");
    useRepartoAssignments("p1");
    useRepartoAssignmentValidations("p1");
    useRepartoAuditEvents("p1");

    expect(mocks.subjects.list).toHaveBeenCalledWith("p1");
    expect(mocks.groupSubjects.list).toHaveBeenCalledWith("p1");
    expect(mocks.teachingActivities.list).toHaveBeenCalledWith("p1");
    expect(mocks.teachingPlans.summary).toHaveBeenCalledWith("p1");
    expect(mocks.teachingGroups.list).toHaveBeenCalledWith("p1");
    expect(mocks.hourRequirements.list).toHaveBeenCalledWith("p1");
    expect(mocks.processTeachers.list).toHaveBeenCalledWith("p1");
    expect(mocks.assignments.list).toHaveBeenCalledWith("p1");
    expect(mocks.assignments.validations).toHaveBeenCalledWith("p1");
    expect(mocks.auditEvents.list).toHaveBeenCalledWith("p1");
    expect(mocks.useQuery).toHaveBeenCalledTimes(10);

    const createSubject = useCreateRepartoSubject();
    createSubject.mutate({ processId: "p1", body: { name: "Maths" } });
    const updateSubject = useUpdateRepartoSubject();
    updateSubject.mutate({ processId: "p1", subjectId: "s1", body: { name: "Math" } });
    const deleteSubject = useDeleteRepartoSubject();
    deleteSubject.mutate({ processId: "p1", subjectId: "s1" });
    const previewGroupSubjects = usePreviewRepartoGroupSubjects();
    previewGroupSubjects.mutate({
      processId: "p1",
      body: {
        subject_id: "s1",
        mode: "upsert",
        group_weekly_hours: "2.50",
        teacher_weekly_hours_per_position: null,
        required_teacher_count: 1
      }
    });
    const applyGroupSubjects = useApplyRepartoGroupSubjects();
    applyGroupSubjects.mutate({
      processId: "p1",
      body: {
        subject_id: "s1",
        mode: "upsert",
        group_weekly_hours: "2.50",
        teacher_weekly_hours_per_position: null,
        required_teacher_count: 1,
        expected_affected_count: 2
      }
    });
    const materializeMain = useMaterializeRepartoMainActivities();
    materializeMain.mutate("p1");
    mocks.invalidateQueries.mockClear();
    const createActivity = useCreateRepartoTeachingActivity();
    createActivity.mutate({
      processId: "p1",
      body: {
        subject_id: "s1",
        activity_type: "tutoring",
        group_weekly_hours_per_group: "1.00",
        teacher_weekly_hours_per_position: "2.00",
        required_teacher_count: 1,
        group_subject_ids: ["gs1"]
      }
    });
    const updateActivity = useUpdateRepartoTeachingActivity();
    updateActivity.mutate({
      processId: "p1",
      activityId: "ta1",
      body: {
        activity_type: "co_teaching",
        required_teacher_count: 2,
        group_subject_ids: ["gs1", "gs2"]
      }
    });
    const retireActivity = useRetireRepartoTeachingActivity();
    retireActivity.mutate({ processId: "p1", activityId: "ta1" });
    expect(
      mocks.invalidateQueries.mock.calls.map(([options]) => options.queryKey)
    ).toEqual(
      Array.from({ length: 3 }, () => [
        ["reparto", "processes", "detail", "p1", "teaching-activities"],
        ["reparto", "processes", "detail", "p1", "teaching-plan"],
        ["reparto", "processes", "detail", "p1", "requirements"],
        ["reparto", "processes", "detail", "p1", "dashboard"],
        ["reparto", "processes", "detail", "p1", "summary"]
      ]).flat()
    );

    const createGroup = useCreateRepartoTeachingGroup();
    createGroup.mutate({
      processId: "p1",
      body: { stage: "ESO", grade: 1, group_code: "A", label: "1 ESO A" }
    });
    const updateGroup = useUpdateRepartoTeachingGroup();
    updateGroup.mutate({ processId: "p1", groupId: "g1", body: { label: "X" } });
    const deleteGroup = useDeleteRepartoTeachingGroup();
    deleteGroup.mutate({ processId: "p1", groupId: "g1" });

    const createParticipant = useCreateRepartoProcessTeacher();
    createParticipant.mutate({
      processId: "p1",
      body: { teacher_profile_id: "t1", base_weekly_hours: 18 }
    });
    const updateParticipant = useUpdateRepartoProcessTeacher();
    updateParticipant.mutate({
      processId: "p1",
      processTeacherId: "pt1",
      body: { status: "inactive" }
    });
    const authorizeExtraHours = useUpdateRepartoProcessTeacherExtraHours();
    authorizeExtraHours.mutate({
      processId: "p1",
      processTeacherId: "pt1",
      body: { extra_weekly_hours: 2, reason: "Covering a vacancy" }
    });
    const deleteParticipant = useDeleteRepartoProcessTeacher();
    deleteParticipant.mutate({ processId: "p1", processTeacherId: "pt1" });

    const createAssignment = useCreateRepartoAssignment();
    createAssignment.mutate({
      processId: "p1",
      body: {
        hour_requirement_id: "r1",
        process_teacher_id: "pt1"
      }
    });
    const updateAssignment = useUpdateRepartoAssignment();
    updateAssignment.mutate({
      processId: "p1",
      assignmentId: "a1",
      body: { notes: "Agreed at the meeting" }
    });
    const undoAssignment = useUndoRepartoAssignment();
    undoAssignment.mutate({
      processId: "p1",
      assignmentId: "a1",
      body: { reason: "Wrong teacher" }
    });
    const reassignAssignment = useReassignRepartoAssignment();
    reassignAssignment.mutate({
      processId: "p1",
      assignmentId: "a1",
      body: { process_teacher_id: "pt2", reason: "Teacher unavailable" }
    });
    const directChoice = useRepartoDirectChoiceAssignment();
    directChoice.mutate({
      processId: "p1",
      body: {
        meeting_session_id: "ms1",
        hour_requirement_id: "r1"
      }
    });

    expect(mocks.subjects.create).toHaveBeenCalledWith("p1", { name: "Maths" });
    expect(mocks.subjects.update).toHaveBeenCalledWith("p1", "s1", { name: "Math" });
    expect(mocks.subjects.remove).toHaveBeenCalledWith("p1", "s1");
    expect(mocks.groupSubjects.bulkPreview).toHaveBeenCalledWith("p1", {
      subject_id: "s1",
      mode: "upsert",
      group_weekly_hours: "2.50",
      teacher_weekly_hours_per_position: null,
      required_teacher_count: 1
    });
    expect(mocks.groupSubjects.bulkApply).toHaveBeenCalledWith("p1", {
      subject_id: "s1",
      mode: "upsert",
      group_weekly_hours: "2.50",
      teacher_weekly_hours_per_position: null,
      required_teacher_count: 1,
      expected_affected_count: 2
    });
    expect(mocks.teachingPlans.materializeMain).toHaveBeenCalledWith("p1");
    expect(mocks.teachingGroups.create).toHaveBeenCalledWith("p1", {
      stage: "ESO",
      grade: 1,
      group_code: "A",
      label: "1 ESO A"
    });
    expect(mocks.teachingGroups.update).toHaveBeenCalledWith("p1", "g1", {
      label: "X"
    });
    expect(mocks.teachingGroups.remove).toHaveBeenCalledWith("p1", "g1");
    expect(mocks.processTeachers.create).toHaveBeenCalledWith("p1", {
      teacher_profile_id: "t1",
      base_weekly_hours: 18
    });
    expect(mocks.processTeachers.update).toHaveBeenCalledWith("p1", "pt1", {
      status: "inactive"
    });
    expect(mocks.processTeachers.extraHours).toHaveBeenCalledWith("p1", "pt1", {
      extra_weekly_hours: 2,
      reason: "Covering a vacancy"
    });
    expect(mocks.processTeachers.remove).toHaveBeenCalledWith("p1", "pt1");
    expect(mocks.assignments.create).toHaveBeenCalledWith("p1", {
      hour_requirement_id: "r1",
      process_teacher_id: "pt1"
    });
    expect(mocks.assignments.update).toHaveBeenCalledWith("p1", "a1", {
      notes: "Agreed at the meeting"
    });
    expect(mocks.assignments.undo).toHaveBeenCalledWith("p1", "a1", {
      reason: "Wrong teacher"
    });
    expect(mocks.assignments.reassign).toHaveBeenCalledWith("p1", "a1", {
      process_teacher_id: "pt2",
      reason: "Teacher unavailable"
    });
    expect(mocks.assignments.directChoice).toHaveBeenCalledWith("p1", {
      meeting_session_id: "ms1",
      hour_requirement_id: "r1"
    });
    expect(mocks.teachingActivities.create).toHaveBeenCalledWith("p1", {
      subject_id: "s1",
      activity_type: "tutoring",
      group_weekly_hours_per_group: "1.00",
      teacher_weekly_hours_per_position: "2.00",
      required_teacher_count: 1,
      group_subject_ids: ["gs1"]
    });
    expect(mocks.teachingActivities.update).toHaveBeenCalledWith("p1", "ta1", {
      activity_type: "co_teaching",
      required_teacher_count: 2,
      group_subject_ids: ["gs1", "gs2"]
    });
    expect(mocks.teachingActivities.retire).toHaveBeenCalledWith("p1", "ta1");
    expect(mocks.useMutation).toHaveBeenCalledTimes(21);
  });

  it("wires the per-cell group-subject hooks to the matrix read", async () => {
    const { useCreateRepartoGroupSubject, useUpdateRepartoGroupSubject } =
      await import("../src/runtime/react/hooks.js");

    mocks.invalidateQueries.mockClear();
    const create = useCreateRepartoGroupSubject();
    create.mutate({
      processId: "p1",
      body: {
        teaching_group_id: "g1",
        subject_id: "s1",
        group_weekly_hours: "2.50",
        teacher_weekly_hours_per_position: null,
        required_teacher_count: 1,
        notes: null
      }
    });
    expect(mocks.groupSubjects.create).toHaveBeenCalledWith("p1", {
      teaching_group_id: "g1",
      subject_id: "s1",
      group_weekly_hours: "2.50",
      teacher_weekly_hours_per_position: null,
      required_teacher_count: 1,
      notes: null
    });
    // Exactly the matrix prefix, as the bulk apply does: writing a cell changes
    // what materialization could produce, never what it already produced.
    expect(
      mocks.invalidateQueries.mock.calls.map(([options]) => options.queryKey)
    ).toEqual([["reparto", "processes", "detail", "p1", "group-subjects"]]);

    mocks.invalidateQueries.mockClear();
    const update = useUpdateRepartoGroupSubject();
    update.mutate({
      processId: "p1",
      groupSubjectId: "gs1",
      body: { group_weekly_hours: null, required_teacher_count: 2 }
    });
    // The cell's identity is not in the payload: a mis-targeted cell is
    // replaced, never re-pointed.
    expect(mocks.groupSubjects.update).toHaveBeenCalledWith("p1", "gs1", {
      group_weekly_hours: null,
      required_teacher_count: 2
    });
    expect(
      mocks.invalidateQueries.mock.calls.map(([options]) => options.queryKey)
    ).toEqual([["reparto", "processes", "detail", "p1", "group-subjects"]]);
  });

  it("wires plan validation and requirement-generation workflow hooks", async () => {
    const {
      useCreateRepartoTeachingPlan,
      useGenerateRepartoRequirements,
      useLockRepartoTeachingPlan,
      usePreviewRepartoRequirementGeneration,
      useRepartoTeachingPlan,
      useRepartoTeachingPlanValidations,
      useUnlockRepartoTeachingPlan
    } = await import("../src/runtime/react/hooks.js");

    useRepartoTeachingPlan("p1");
    useRepartoTeachingPlanValidations("p1");
    expect(mocks.teachingPlans.get).toHaveBeenCalledWith("p1");
    expect(mocks.teachingPlans.validations).toHaveBeenCalledWith("p1");

    // Creation is what makes every read above answer anything but 404, so it
    // invalidates the plan reads as well as the two `plan_status` projections.
    mocks.invalidateQueries.mockClear();
    const create = useCreateRepartoTeachingPlan();
    create.mutate("p1");
    expect(mocks.teachingPlans.create).toHaveBeenCalledWith("p1");
    expect(
      mocks.invalidateQueries.mock.calls.map(([options]) => options.queryKey)
    ).toEqual([
      ["reparto", "processes", "detail", "p1", "teaching-plan"],
      ["reparto", "processes", "detail", "p1", "teaching-plan", "summary"],
      ["reparto", "processes", "detail", "p1", "teaching-plan", "validations"],
      ["reparto", "processes", "detail", "p1", "dashboard"],
      ["reparto", "processes", "detail", "p1", "summary"]
    ]);

    mocks.invalidateQueries.mockClear();
    const lock = useLockRepartoTeachingPlan();
    lock.mutate("p1");
    expect(mocks.teachingPlans.lock).toHaveBeenCalledWith("p1");
    expect(
      mocks.invalidateQueries.mock.calls.map(([options]) => options.queryKey)
    ).toEqual([
      ["reparto", "processes", "detail", "p1", "teaching-plan"],
      ["reparto", "processes", "detail", "p1", "teaching-plan", "validations"],
      ["reparto", "processes", "detail", "p1", "dashboard"],
      ["reparto", "processes", "detail", "p1", "summary"]
    ]);

    // The unlock is the lock's inverse (audit `S2-04`), so it moves exactly the
    // same four keys: what may be edited changed, no slot or assignment did.
    mocks.invalidateQueries.mockClear();
    const unlock = useUnlockRepartoTeachingPlan();
    unlock.mutate("p1");
    expect(mocks.teachingPlans.unlock).toHaveBeenCalledWith("p1");
    expect(
      mocks.invalidateQueries.mock.calls.map(([options]) => options.queryKey)
    ).toEqual([
      ["reparto", "processes", "detail", "p1", "teaching-plan"],
      ["reparto", "processes", "detail", "p1", "teaching-plan", "validations"],
      ["reparto", "processes", "detail", "p1", "dashboard"],
      ["reparto", "processes", "detail", "p1", "summary"]
    ]);

    const preview = usePreviewRepartoRequirementGeneration();
    preview.mutate("p1");
    expect(mocks.hourRequirements.generationPreview).toHaveBeenCalledWith("p1");

    mocks.invalidateQueries.mockClear();
    const generate = useGenerateRepartoRequirements();
    generate.mutate("p1");
    expect(mocks.hourRequirements.generate).toHaveBeenCalledWith("p1");
    expect(
      mocks.invalidateQueries.mock.calls.map(([options]) => options.queryKey)
    ).toEqual([
      ["reparto", "processes", "detail", "p1", "teaching-plan"],
      ["reparto", "processes", "detail", "p1", "requirements"],
      ["reparto", "processes", "detail", "p1", "dashboard"],
      ["reparto", "processes", "detail", "p1", "summary"]
    ]);
  });

  it("wires restricted feasibility queries and the evaluate mutation", async () => {
    const {
      useEvaluateRepartoFeasibility,
      useRepartoFeasibilityDiagnostics,
      useRepartoFeasibilityWitness
    } = await import("../src/runtime/react/hooks.js");

    mocks.useQuery.mockClear();
    useRepartoFeasibilityDiagnostics("p1");
    expect(mocks.teachingPlans.feasibilityDiagnostics).toHaveBeenCalledWith(
      "p1"
    );
    const enabledCall = mocks.useQuery.mock.calls.at(-1)?.[0];
    expect(enabledCall.queryKey).toEqual([
      "reparto",
      "processes",
      "detail",
      "p1",
      "teaching-plan",
      "feasibility-diagnostics"
    ]);
    expect(enabledCall.enabled).toBe(true);

    // The caller's gate composes with the process-id gate: a panel that knows
    // the status is not negative never fires the department-head-only request.
    useRepartoFeasibilityDiagnostics("p1", false);
    const disabledCall = mocks.useQuery.mock.calls.at(-1)?.[0];
    expect(disabledCall.enabled).toBe(false);

    useRepartoFeasibilityWitness("p1");
    expect(mocks.teachingPlans.feasibilityWitness).toHaveBeenCalledWith("p1");
    const witnessCall = mocks.useQuery.mock.calls.at(-1)?.[0];
    expect(witnessCall.queryKey).toEqual([
      "reparto",
      "processes",
      "detail",
      "p1",
      "teaching-plan",
      "feasibility-witness"
    ]);
    expect(witnessCall.enabled).toBe(true);
    useRepartoFeasibilityWitness("p1", false);
    expect(mocks.useQuery.mock.calls.at(-1)?.[0].enabled).toBe(false);

    mocks.invalidateQueries.mockClear();
    const evaluate = useEvaluateRepartoFeasibility();
    evaluate.mutate("p1");
    expect(mocks.teachingPlans.evaluateFeasibility).toHaveBeenCalledWith("p1");
    expect(
      mocks.invalidateQueries.mock.calls.map(([options]) => options.queryKey)
    ).toEqual([
      ["reparto", "processes", "detail", "p1", "teaching-plan"],
      ["reparto", "processes", "detail", "p1", "teaching-plan", "validations"],
      [
        "reparto",
        "processes",
        "detail",
        "p1",
        "teaching-plan",
        "feasibility-diagnostics"
      ],
      ["reparto", "processes", "detail", "p1", "dashboard"],
      ["reparto", "processes", "detail", "p1", "summary"]
    ]);
  });

  it("refreshes witness, participant and recomputed-turn projections after undo/reassign", async () => {
    const {
      useReassignRepartoAssignment,
      useUndoRepartoAssignment
    } = await import("../src/runtime/react/hooks.js");
    const expected = [
      ["reparto", "processes", "detail", "p1", "assignments"],
      ["reparto", "processes", "detail", "p1", "requirements"],
      ["reparto", "processes", "detail", "p1", "teachers"],
      ["reparto", "processes", "detail", "p1", "teaching-plan"],
      ["reparto", "processes", "detail", "p1", "dashboard"],
      ["reparto", "processes", "detail", "p1", "summary"],
      ["reparto", "processes", "detail", "p1", "teacher-lan"],
      ["reparto", "processes", "detail", "p1", "meeting-sessions"],
      ["reparto", "processes", "detail", "p1", "audit-events"]
    ];

    const undo = useUndoRepartoAssignment();
    undo.mutate({
      processId: "p1",
      assignmentId: "a1",
      body: { reason: "Return the teacher to the queue" }
    });
    expect(
      mocks.invalidateQueries.mock.calls.map(([options]) => options.queryKey)
    ).toEqual(expected);

    mocks.invalidateQueries.mockClear();
    const reassign = useReassignRepartoAssignment();
    reassign.mutate({
      processId: "p1",
      assignmentId: "a1",
      body: { process_teacher_id: "pt2", reason: "Correct the allocation" }
    });
    expect(
      mocks.invalidateQueries.mock.calls.map(([options]) => options.queryKey)
    ).toEqual(expected);
  });

  it("wires allocation revisions and explicit reconciliation with broad invalidation", async () => {
    const {
      useCreateRepartoAllocationRevision,
      usePreviewRepartoRequirementReconciliation,
      useReconcileRepartoRequirements,
      useRepartoAllocationRevisions,
      useRepartoCurrentAllocationRevision
    } = await import("../src/runtime/react/hooks.js");

    useRepartoAllocationRevisions("p1");
    useRepartoCurrentAllocationRevision("p1");
    expect(mocks.allocationRevisions.list).toHaveBeenCalledWith("p1");
    expect(mocks.allocationRevisions.current).toHaveBeenCalledWith("p1");

    mocks.invalidateQueries.mockClear();
    const createRevision = useCreateRepartoAllocationRevision();
    createRevision.mutate({
      processId: "p1",
      body: {
        allocated_group_weekly_hours: "120.00",
        reason: "Leadership update"
      }
    });
    expect(mocks.allocationRevisions.create).toHaveBeenCalledWith("p1", {
      allocated_group_weekly_hours: "120.00",
      reason: "Leadership update"
    });
    expect(
      mocks.invalidateQueries.mock.calls.map(([options]) => options.queryKey)
    ).toEqual([
      ["reparto", "processes", "detail", "p1", "allocation-revisions"],
      ["reparto", "processes", "detail", "p1", "teaching-plan"],
      ["reparto", "processes", "detail", "p1", "requirements"],
      ["reparto", "processes", "detail", "p1", "dashboard"],
      ["reparto", "processes", "detail", "p1", "summary"]
    ]);

    const preview = usePreviewRepartoRequirementReconciliation();
    preview.mutate("p1");
    expect(mocks.hourRequirements.reconciliationPreview).toHaveBeenCalledWith(
      "p1"
    );

    mocks.invalidateQueries.mockClear();
    const reconcile = useReconcileRepartoRequirements();
    reconcile.mutate({
      processId: "p1",
      body: { reason: "Reviewed manually", expected_conflict_count: 2 }
    });
    expect(mocks.hourRequirements.reconcile).toHaveBeenCalledWith("p1", {
      reason: "Reviewed manually",
      expected_conflict_count: 2
    });
    expect(
      mocks.invalidateQueries.mock.calls.map(([options]) => options.queryKey)
    ).toEqual([
      ["reparto", "processes", "detail", "p1", "allocation-revisions"],
      ["reparto", "processes", "detail", "p1", "teaching-plan"],
      ["reparto", "processes", "detail", "p1", "requirements"],
      ["reparto", "processes", "detail", "p1", "dashboard"],
      ["reparto", "processes", "detail", "p1", "summary"],
      ["reparto", "processes", "detail", "p1", "assignments"],
      ["reparto", "processes", "detail", "p1", "audit-events"]
    ]);
  });

  it("disables process-scoped list queries when no process is selected", async () => {
    const {
      useRepartoSubjects,
      useRepartoGroupSubjects,
      useRepartoTeachingActivities,
      useRepartoTeachingPlanSummary,
      useRepartoTeachingGroups,
      useRepartoHourRequirements,
      useRepartoProcessTeachers,
      useRepartoAssignments,
      useRepartoAuditEvents
    } = await import("../src/runtime/react/hooks.js");

    useRepartoSubjects();
    useRepartoGroupSubjects();
    useRepartoTeachingActivities();
    useRepartoTeachingPlanSummary();
    useRepartoTeachingGroups();
    useRepartoHourRequirements();
    useRepartoProcessTeachers();
    useRepartoAssignments();
    useRepartoAuditEvents();

    expect(mocks.subjects.list).not.toHaveBeenCalled();
    expect(mocks.groupSubjects.list).not.toHaveBeenCalled();
    expect(mocks.teachingActivities.list).not.toHaveBeenCalled();
    expect(mocks.teachingPlans.summary).not.toHaveBeenCalled();
    expect(mocks.teachingGroups.list).not.toHaveBeenCalled();
    expect(mocks.hourRequirements.list).not.toHaveBeenCalled();
    expect(mocks.processTeachers.list).not.toHaveBeenCalled();
    expect(mocks.assignments.list).not.toHaveBeenCalled();
    expect(mocks.auditEvents.list).not.toHaveBeenCalled();
    expect(mocks.useQuery.mock.calls.map(([options]) => options.enabled)).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false
    ]);
  });
});

/**
 * The selection-turn surface behind the five meeting controls (`W1.1`).
 *
 * The API wrappers were complete and nothing called them, so what these prove
 * is the wiring itself: each control reaches its own endpoint with the ids in
 * the right order, the audited actions carry their reason, and every one of
 * them invalidates the projections a turn moves — because a screen still
 * showing a finished turn as live is the defect the binding exists to end.
 */
describe("selection-turn hooks", () => {
  const processId = "process-1";
  const sessionId = "session-1";
  const turnId = "turn-1";

  beforeEach(() => {
    mocks.useQuery.mockClear();
    mocks.invalidateQueries.mockClear();
    for (const call of Object.values(mocks.selectionTurns)) {
      call.mockClear();
    }
  });

  it("reads one session's turn order and asks nothing without a session", async () => {
    const { useRepartoSelectionTurns } = await import(
      "../src/runtime/react/hooks.js"
    );

    useRepartoSelectionTurns(processId, sessionId);
    expect(mocks.selectionTurns.list).toHaveBeenCalledWith(processId, sessionId);

    // No session is not an empty order, it is an unanswerable question.
    mocks.selectionTurns.list.mockClear();
    useRepartoSelectionTurns(processId);
    useRepartoSelectionTurns(undefined, sessionId);
    expect(mocks.selectionTurns.list).not.toHaveBeenCalled();
  });

  it("sends each control to its own endpoint, reasons included", async () => {
    const { useSelectionTurns } = await import("../src/runtime/react/hooks.js");
    const turns = useSelectionTurns(processId, sessionId);
    const scope = { processId, meetingSessionId: sessionId };

    turns.initialize.mutate(scope);
    turns.start.mutate({ ...scope, turnId });
    turns.complete.mutate({ ...scope, turnId });
    turns.skip.mutate({ ...scope, turnId, body: { reason: "Absent" } });
    turns.override.mutate({ ...scope, turnId, body: { reason: "Chair ruling" } });

    expect(mocks.selectionTurns.initialize).toHaveBeenCalledWith(processId, sessionId);
    expect(mocks.selectionTurns.start).toHaveBeenCalledWith(
      processId,
      sessionId,
      turnId
    );
    // Completing carries no assignment unless the caller has one: the service
    // owns whether the position was handed out, and the hook invents nothing.
    expect(mocks.selectionTurns.complete).toHaveBeenCalledWith(
      processId,
      sessionId,
      turnId,
      {}
    );
    expect(mocks.selectionTurns.skip).toHaveBeenCalledWith(
      processId,
      sessionId,
      turnId,
      { reason: "Absent" }
    );
    expect(mocks.selectionTurns.override).toHaveBeenCalledWith(
      processId,
      sessionId,
      turnId,
      { reason: "Chair ruling" }
    );
  });

  it("invalidates the turn order and every projection a turn moves", async () => {
    const { useSkipRepartoTurn } = await import("../src/runtime/react/hooks.js");
    const { repartoKeys } = await import("../src/runtime/queryKeys.js");

    useSkipRepartoTurn().mutate({
      processId,
      meetingSessionId: sessionId,
      turnId,
      body: { reason: "Absent" }
    });

    const invalidated = mocks.invalidateQueries.mock.calls.map(
      ([call]) => (call as { queryKey: readonly unknown[] }).queryKey
    );
    for (const queryKey of [
      repartoKeys.selectionTurns(processId, sessionId),
      repartoKeys.summary(processId),
      repartoKeys.dashboard(processId),
      repartoKeys.teacherLan(processId),
      repartoKeys.assignments(processId),
      repartoKeys.auditEvents(processId)
    ]) {
      expect(invalidated).toContainEqual(queryKey);
    }
  });
});
