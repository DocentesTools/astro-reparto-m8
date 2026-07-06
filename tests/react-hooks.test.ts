import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  useQuery: vi.fn((options: { enabled?: boolean; queryFn: () => unknown }) => {
    if (options.enabled !== false) {
      options.queryFn();
    }
    return options;
  }),
  useMutation: vi.fn(() => ({ isPending: false, mutate: () => undefined })),
  useQueryClient: vi.fn(() => ({ invalidateQueries: () => undefined })),
  assignmentProcesses: {
    list: vi.fn(),
    dashboard: vi.fn(),
    summary: vi.fn(),
    myLanSummary: vi.fn()
  },
  history: {
    listVersions: vi.fn(),
    listExports: vi.fn()
  },
  meetingSessions: {
    list: vi.fn()
  },
  schools: {
    list: vi.fn()
  },
  academicYears: {
    list: vi.fn()
  },
  departments: {
    list: vi.fn()
  },
  teacherProfiles: {
    list: vi.fn()
  }
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: mocks.useQuery,
  useMutation: mocks.useMutation,
  useQueryClient: mocks.useQueryClient
}));

vi.mock("../src/runtime/api/index.js", () => ({
  assignmentProcesses: mocks.assignmentProcesses,
  history: mocks.history,
  meetingSessions: mocks.meetingSessions,
  schools: mocks.schools,
  academicYears: mocks.academicYears,
  departments: mocks.departments,
  teacherProfiles: mocks.teacherProfiles
}));

describe("reparto React hooks", () => {
  beforeEach(() => {
    mocks.useQuery.mockClear();
    mocks.useMutation.mockClear();
    mocks.useQueryClient.mockClear();
    mocks.assignmentProcesses.list.mockClear();
    mocks.assignmentProcesses.dashboard.mockClear();
    mocks.assignmentProcesses.summary.mockClear();
    mocks.assignmentProcesses.myLanSummary.mockClear();
    mocks.history.listVersions.mockClear();
    mocks.history.listExports.mockClear();
    mocks.meetingSessions.list.mockClear();
    mocks.schools.list.mockClear();
    mocks.academicYears.list.mockClear();
    mocks.departments.list.mockClear();
    mocks.teacherProfiles.list.mockClear();
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
});
