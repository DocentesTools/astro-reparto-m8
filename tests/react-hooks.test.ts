import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  useQuery: vi.fn((options: { queryFn: () => unknown }) => {
    options.queryFn();
    return options;
  }),
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
  }
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: mocks.useQuery
}));

vi.mock("../src/runtime/api/index.js", () => ({
  assignmentProcesses: mocks.assignmentProcesses,
  history: mocks.history,
  meetingSessions: mocks.meetingSessions
}));

describe("reparto React hooks", () => {
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
});
