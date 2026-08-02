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
    createExport: vi.fn()
  },
  planningExchange: {
    exportDraft: vi.fn(),
    exportProvisional: vi.fn(),
    exportFinal: vi.fn()
  },
  meetingSessions: {
    list: vi.fn()
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
    bulkPreview: vi.fn(),
    bulkApply: vi.fn()
  },
  teachingPlans: {
    get: vi.fn(),
    summary: vi.fn(),
    validations: vi.fn(),
    lock: vi.fn(),
    materializeMain: vi.fn()
  },
  teachingActivities: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn()
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
    mocks.history.listVersions.mockClear();
    mocks.history.createVersion.mockClear();
    mocks.history.compareVersions.mockClear();
    mocks.history.comparePreviousYear.mockClear();
    mocks.history.listExports.mockClear();
    mocks.history.createExport.mockClear();
    mocks.planningExchange.exportDraft.mockClear();
    mocks.planningExchange.exportProvisional.mockClear();
    mocks.planningExchange.exportFinal.mockClear();
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
    mocks.groupSubjects.bulkPreview.mockClear();
    mocks.groupSubjects.bulkApply.mockClear();
    mocks.teachingPlans.summary.mockClear();
    mocks.teachingPlans.get.mockClear();
    mocks.teachingPlans.validations.mockClear();
    mocks.teachingPlans.lock.mockClear();
    mocks.teachingPlans.materializeMain.mockClear();
    mocks.teachingActivities.list.mockClear();
    mocks.teachingActivities.create.mockClear();
    mocks.teachingActivities.update.mockClear();
    mocks.teachingActivities.remove.mockClear();
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
      useDeleteRepartoTeachingActivity,
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
    const deleteActivity = useDeleteRepartoTeachingActivity();
    deleteActivity.mutate({ processId: "p1", activityId: "ta1" });
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
    expect(mocks.teachingActivities.remove).toHaveBeenCalledWith("p1", "ta1");
    expect(mocks.useMutation).toHaveBeenCalledTimes(21);
  });

  it("wires plan validation and requirement-generation workflow hooks", async () => {
    const {
      useGenerateRepartoRequirements,
      useLockRepartoTeachingPlan,
      usePreviewRepartoRequirementGeneration,
      useRepartoTeachingPlan,
      useRepartoTeachingPlanValidations
    } = await import("../src/runtime/react/hooks.js");

    useRepartoTeachingPlan("p1");
    useRepartoTeachingPlanValidations("p1");
    expect(mocks.teachingPlans.get).toHaveBeenCalledWith("p1");
    expect(mocks.teachingPlans.validations).toHaveBeenCalledWith("p1");

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
