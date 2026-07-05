import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

const processId = "11111111-1111-4111-8111-111111111111";
const teacherId = "22222222-2222-4222-8222-222222222222";
const sessionId = "33333333-3333-4333-8333-333333333333";
const now = "2026-07-04T10:00:00Z";

const globalBalance = {
  total_required_hours: 4,
  total_available_hours: 4,
  total_assigned_hours: 1,
  pending_required_hours: 3,
  availability_difference: 0,
  uncovered_requirements: 1,
  overloaded_teachers: 0,
  state: "pending"
};

const currentTurn = {
  meeting_session_id: sessionId,
  selection_turn_id: "44444444-4444-4444-8444-444444444444",
  process_teacher_id: teacherId,
  position: 0,
  status: "active",
  started_at: now
};

const queryState = vi.hoisted(() => ({
  mode: "error" as "error" | "plain-error" | "loading" | "data"
}));

function dataForKey(queryKey: readonly unknown[]) {
  const last = queryKey.at(-1);
  if (last === "dashboard") {
    return {
      process_id: processId,
      generated_at: now,
      global_balance: globalBalance,
      teacher_balances: [],
      requirement_balances: [],
      validations: [],
      current_turn: currentTurn,
      blocking_validation_count: 1
    };
  }
  if (last === "summary") {
    return {
      process_id: processId,
      global_balance: globalBalance,
      validations: [],
      current_turn: currentTurn,
      blocking_validation_count: 1
    };
  }
  if (last === "meeting-sessions") {
    return {
      data: [
        {
          id: sessionId,
          assignment_process_id: processId,
          status: "selecting",
          lan_access_enabled: true,
          direct_teacher_selection_enabled: true,
          selection_mode: "strict",
          notes: null,
          started_at: now,
          started_by_user_id: null,
          paused_at: null,
          closed_at: null,
          created_at: now,
          updated_at: now
        }
      ],
      count: 1
    };
  }
  if (last === "teacher-lan") {
    return {
      process_id: processId,
      teacher_profile_id: "55555555-5555-4555-8555-555555555555",
      process_teacher_id: teacherId,
      generated_at: now,
      global_balance: globalBalance,
      teacher_balance: {
        process_teacher_id: teacherId,
        teacher_profile_id: "55555555-5555-4555-8555-555555555555",
        display_name: "Teacher",
        available_hours: 4,
        assigned_hours: 1,
        remaining_hours: 3,
        excess_hours: 0,
        assignment_count: 1,
        has_override: false,
        state: "pending"
      },
      current_turn: currentTurn,
      blocking_validation_count: 0
    };
  }
  if (last === "versions") {
    return {
      data: [
        {
          id: "66666666-6666-4666-8666-666666666666",
          assignment_process_id: processId,
          version_number: 1,
          status: "draft",
          reason: null,
          created_by_user_id: "77777777-7777-4777-8777-777777777777",
          snapshot_json: {},
          created_at: now,
          updated_at: now
        }
      ],
      count: 1
    };
  }
  if (last === "exports") {
    return {
      data: [
        {
          id: "88888888-8888-4888-8888-888888888888",
          assignment_process_id: processId,
          process_version_id: null,
          export_type: "backup",
          format: "json",
          file_path: "backup.json",
          created_by_user_id: "77777777-7777-4777-8777-777777777777",
          checksum: "a".repeat(64),
          content: "{}",
          created_at: now,
          updated_at: now
        }
      ],
      count: 1
    };
  }
  return {
    data: [
      {
        id: processId,
        academic_year_id: "99999999-9999-4999-8999-999999999999",
        school_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        department_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        status: "draft",
        default_teacher_hours_reference: null,
        selection_order_enabled: false,
        selection_order_mode: "none",
        direct_teacher_selection_enabled: true,
        lan_access_enabled: true,
        created_from_process_id: null,
        closed_at: null,
        closed_by_user_id: null,
        created_by_user_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        created_at: now,
        updated_at: now
      }
    ],
    count: 1
  };
}

vi.mock("@tanstack/react-query", () => ({
  QueryClient: class QueryClient {},
  QueryClientProvider: ({ children }: { children: ReactNode }) => children,
  useQuery: ({ queryKey }: { queryKey: readonly unknown[] }) => {
    if (queryState.mode === "loading") {
      return {
        data: undefined,
        error: null,
        isError: false,
        isLoading: true
      };
    }
    if (queryState.mode === "data") {
      return {
        data: dataForKey(queryKey),
        error: null,
        isError: false,
        isLoading: false
      };
    }
    if (queryState.mode === "plain-error") {
      return {
        data: undefined,
        error: "offline",
        isError: true,
        isLoading: false
      };
    }
    return {
      data: undefined,
      error: new Error("offline"),
      isError: true,
      isLoading: false
    };
  }
}));

describe("default UI query states", () => {
  it("renders query errors from island roots", async () => {
    queryState.mode = "error";
    const { RepartoProcessesView } = await import(
      "../src/runtime/react/default-ui/index.js"
    );

    const html = renderToStaticMarkup(<RepartoProcessesView />);

    expect(html).toContain('data-reparto-state="error"');
    expect(html).toContain("offline");
  });

  it("renders a generic message for non-Error query failures", async () => {
    queryState.mode = "plain-error";
    const { RepartoProcessesView } = await import(
      "../src/runtime/react/default-ui/index.js"
    );

    expect(renderToStaticMarkup(<RepartoProcessesView />)).toContain(
      "Processes unavailable"
    );
  });

  it("renders loading states for process-rooted islands", async () => {
    queryState.mode = "loading";
    const {
      RepartoDashboardView,
      RepartoExportsView,
      RepartoMeetingView,
      RepartoMyView,
      RepartoVersionsView
    } = await import("../src/runtime/react/default-ui/index.js");

    expect(renderToStaticMarkup(<RepartoDashboardView processId={processId} />)).toContain(
      "Dashboard loading"
    );
    expect(renderToStaticMarkup(<RepartoMeetingView processId={processId} />)).toContain(
      "Meeting loading"
    );
    expect(renderToStaticMarkup(<RepartoMyView processId={processId} />)).toContain(
      "Teacher view loading"
    );
    expect(renderToStaticMarkup(<RepartoVersionsView processId={processId} />)).toContain(
      "Versions loading"
    );
    expect(renderToStaticMarkup(<RepartoExportsView processId={processId} />)).toContain(
      "Exports loading"
    );
  });

  it("renders query data in island roots", async () => {
    queryState.mode = "data";
    const {
      RepartoDashboardView,
      RepartoExportsView,
      RepartoMeetingView,
      RepartoMyView,
      RepartoProcessesView,
      RepartoSharedView,
      RepartoVersionsView
    } = await import("../src/runtime/react/default-ui/index.js");

    expect(renderToStaticMarkup(<RepartoProcessesView />)).toContain(
      'data-process-status="draft"'
    );
    expect(renderToStaticMarkup(<RepartoDashboardView processId={processId} />)).toContain(
      'data-reparto-slot="blocking-count"'
    );
    expect(renderToStaticMarkup(<RepartoMeetingView processId={processId} />)).toContain(
      "Turn 1"
    );
    expect(
      renderToStaticMarkup(
        <RepartoMyView
          processId={processId}
          requirementAssignedHours={1}
          requirementRequiredHours={4}
        />
      )
    ).toContain('data-reparto-choice-state="ready"');
    expect(renderToStaticMarkup(<RepartoSharedView processId={processId} />)).toContain(
      'data-reparto-route="shared-screen"'
    );
    expect(renderToStaticMarkup(<RepartoVersionsView processId={processId} />)).toContain(
      'data-process-version-status="draft"'
    );
    expect(renderToStaticMarkup(<RepartoExportsView processId={processId} />)).toContain(
      'data-export-artifact-type="backup"'
    );
  });
});
