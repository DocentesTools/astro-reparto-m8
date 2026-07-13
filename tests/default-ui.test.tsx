import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RepartoProvider, useRepartoContext } from "../src/runtime/react/index.js";
import { ProcessListView } from "../src/runtime/react/DepartmentHeadWorkspace.js";
import {
  DepartmentHeadView,
  ProcessesView,
  RepartoDashboardView,
  RepartoExportsView,
  RepartoExportCenterView,
  RepartoMeetingView,
  RepartoMyView,
  RepartoProcessesView,
  RepartoSharedView,
  RepartoVersionsView,
  SharedScreenView,
  TeacherLanView
} from "../src/runtime/react/default-ui/index.js";
import type {
  ExportArtifactPublic,
  MeetingSessionPublic,
  ProcessDashboard,
  AssignmentProcessPublic,
  ProcessSummary,
  ProcessVersionPublic,
  TeacherLanSummary,
  VersionComparison
} from "../src/runtime/schemas.js";

function ContextReader() {
  const context = useRepartoContext();
  return <span data-api-base={context.config?.apiBase} data-has-adapter={Boolean(context.adapter)} />;
}

const processSummary: ProcessSummary = {
  process_id: "11111111-1111-4111-8111-111111111111",
  global_balance: {
    total_required_hours: 4,
    total_available_hours: 4,
    total_assigned_hours: 0,
    pending_required_hours: 4,
    availability_difference: 0,
    uncovered_requirements: 1,
    overloaded_teachers: 0,
    state: "pending"
  },
  validations: [],
  current_turn: {
    meeting_session_id: "22222222-2222-4222-8222-222222222222",
    selection_turn_id: "33333333-3333-4333-8333-333333333333",
    process_teacher_id: "44444444-4444-4444-8444-444444444444",
    position: 1,
    status: "active",
    started_at: "2026-07-04T10:00:00Z"
  },
  blocking_validation_count: 0
};

const dashboard = {
  process_id: processSummary.process_id,
  generated_at: "2026-07-04T10:00:00Z",
  global_balance: processSummary.global_balance,
  teacher_balances: [],
  requirement_balances: [],
  validations: [],
  current_turn: processSummary.current_turn,
  blocking_validation_count: 2
} satisfies ProcessDashboard;

const process = {
  id: processSummary.process_id,
  academic_year_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  school_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  department_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  status: "draft",
  default_teacher_hours_reference: null,
  selection_order_enabled: false,
  selection_order_mode: "none",
  direct_teacher_selection_enabled: true,
  lan_access_enabled: true,
  created_from_process_id: null,
  closed_at: null,
  closed_by_user_id: null,
  created_by_user_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  created_at: "2026-07-04T10:00:00Z",
  updated_at: "2026-07-04T10:00:00Z"
} satisfies AssignmentProcessPublic;

const teacherSummary: TeacherLanSummary = {
  process_id: processSummary.process_id,
  teacher_profile_id: "55555555-5555-4555-8555-555555555555",
  process_teacher_id: processSummary.current_turn?.process_teacher_id ?? "",
  generated_at: "2026-07-04T10:00:00Z",
  global_balance: processSummary.global_balance,
  teacher_balance: {
    process_teacher_id: processSummary.current_turn?.process_teacher_id ?? "",
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
  current_turn: processSummary.current_turn,
  blocking_validation_count: 0
};

const meetingSession: MeetingSessionPublic = {
  id: processSummary.current_turn?.meeting_session_id ?? "",
  assignment_process_id: processSummary.process_id,
  status: "selecting",
  lan_access_enabled: true,
  direct_teacher_selection_enabled: true,
  selection_mode: "strict",
  notes: null,
  started_at: "2026-07-04T10:00:00Z",
  started_by_user_id: null,
  paused_at: null,
  closed_at: null,
  created_at: "2026-07-04T10:00:00Z",
  updated_at: "2026-07-04T10:00:00Z"
};

const version = {
  id: "66666666-6666-4666-8666-666666666666",
  assignment_process_id: processSummary.process_id,
  version_number: 1,
  status: "draft",
  reason: "baseline",
  created_by_user_id: "77777777-7777-4777-8777-777777777777",
  snapshot_json: {},
  created_at: "2026-07-04T10:00:00Z",
  updated_at: "2026-07-04T10:00:00Z"
} satisfies ProcessVersionPublic;

const comparison: VersionComparison = {
  left_version_id: version.id,
  right_version_id: "88888888-8888-4888-8888-888888888888",
  changed_sections: ["teachers", "assignments"],
  required_hours_delta: 1,
  assigned_hours_delta: 2,
  teacher_count_delta: 0,
  requirement_count_delta: 1,
  assignment_count_delta: 2
};

const backupExport: ExportArtifactPublic = {
  id: "99999999-9999-4999-8999-999999999999",
  assignment_process_id: processSummary.process_id,
  process_version_id: null,
  export_type: "backup",
  format: "json",
  file_path: "backup.json",
  created_by_user_id: "77777777-7777-4777-8777-777777777777",
  checksum: "a".repeat(64),
  content: "{}",
  created_at: "2026-07-04T10:00:00Z",
  updated_at: "2026-07-04T10:00:00Z"
};

describe("default reparto UI", () => {
  it("renders the phase-4 dashboard panels", () => {
    const html = renderToStaticMarkup(
      <DepartmentHeadView
        config={{ apiBase: "/api", apiPrefix: "/reparto" }}
        summary={processSummary}
      />
    );

    expect(html).toContain('data-reparto-panel="current-turn"');
    expect(html).toContain("Turn 2");
    expect(html).toContain('data-reparto-action="start-turn"');
    expect(html).toContain('data-reparto-panel="overview-chart"');
    expect(html).toContain('data-reparto-panel="teacher-load-chart"');
    expect(html).toContain('data-reparto-panel="classroom-coverage-chart"');
    expect(html).toContain('data-reparto-panel="validation-summary"');
    expect(html).toContain('data-reparto-panel="setup-checklist"');
    expect(html).toContain('data-reparto-slot="balance-summary"');
    expect(html).toContain('data-reparto-chart-bar="required"');
  });

  it("renders Phase 2 LAN teacher and shared-screen views", () => {
    const teacherHtml = renderToStaticMarkup(
      <TeacherLanView
        config={{ apiBase: "/api", apiPrefix: "/reparto" }}
        meetingSession={meetingSession}
        processId="11111111-1111-4111-8111-111111111111"
        summary={teacherSummary}
      />
    );
    expect(teacherHtml).toContain('data-reparto-route="my-view"');
    expect(teacherHtml).toContain('data-reparto-events-url=');
    expect(teacherHtml).toContain('data-reparto-action="direct-choice"');
    expect(teacherHtml).toContain('data-reparto-action="pass-turn"');
    expect(teacherHtml).toContain('data-reparto-panel="direct-choice-workflow"');

    const sharedHtml = renderToStaticMarkup(
      <SharedScreenView
        config={{ apiBase: "/api", apiPrefix: "/reparto" }}
        processId="11111111-1111-4111-8111-111111111111"
        summary={processSummary}
      />
    );
    expect(sharedHtml).toContain('data-reparto-route="shared-screen"');
    expect(sharedHtml).toContain('data-reparto-panel="global-state"');
    expect(sharedHtml).toContain('data-reparto-slot="current-turn"');
    expect(sharedHtml).toContain("Teacher 44444444-4444-4444-8444-444444444444");
  });

  it("shows the process picker when no process is selected", () => {
    for (const view of [
      renderToStaticMarkup(<TeacherLanView />),
      renderToStaticMarkup(<DepartmentHeadView />),
      renderToStaticMarkup(<SharedScreenView />)
    ]) {
      expect(view).toContain('data-reparto-route="process-picker"');
      expect(view).toContain('data-reparto-form="create-process"');
      expect(view).toContain('data-reparto-action="create-process"');
    }
  });

  it("renders Phase 4 direct-choice readiness and confirmation UI", () => {
    const html = renderToStaticMarkup(
      <TeacherLanView
        meetingSession={meetingSession}
        processId={processSummary.process_id}
        requirementAssignedHours={1}
        requirementRequiredHours={4}
        summary={teacherSummary}
      />
    );

    expect(html).toContain('data-reparto-choice-state="ready"');
    expect(html).toContain('data-reparto-impact-hours="3"');
    expect(html).toContain("3 hours will be assigned to you.");
    expect(html).toContain('data-reparto-slot="choice-result"');
  });

  it("renders prompt-style starter views for process and version routes", () => {
    expect(renderToStaticMarkup(<ProcessesView />)).toContain(
      'data-reparto-state="loading"'
    );
    expect(renderToStaticMarkup(<RepartoProcessesView />)).toContain(
      'data-slot="skeleton"'
    );
    const versions = renderToStaticMarkup(<RepartoVersionsView versions={[]} />);
    expect(versions).toContain('data-reparto-action="create-version"');
    expect(versions).toContain('data-reparto-action="compare-versions"');
    expect(versions).toContain('data-reparto-panel="comparison"');
    expect(
      renderToStaticMarkup(<ProcessListView count={1} processes={[process]} />)
    ).toContain('data-process-status="draft"');
  });

  it("renders Phase 5 comparison, export and leadership workflow UI", () => {
    const versions = renderToStaticMarkup(
      <RepartoVersionsView
        comparison={comparison}
        versions={[version, { ...version, version_number: 2 }]}
      />
    );
    expect(versions).toContain("teachers, assignments");
    expect(versions).toContain('data-reparto-slot="required-hours-delta"');

    const exports = renderToStaticMarkup(
      <RepartoExportCenterView
        exports={[backupExport]}
        processId={processSummary.process_id}
        processStatus="final"
        summary={{ ...processSummary, blocking_validation_count: 1 }}
      />
    );
    expect(exports).toContain('data-reparto-route="exports"');
    expect(exports).toContain('data-reparto-panel="export-center"');
    expect(exports).toContain('data-reparto-action="create-final-export"');
    expect(exports).toContain('data-reparto-action="restore-draft"');
    expect(exports).toContain('data-reparto-action="reopen-final"');
    expect(exports).toContain('data-reparto-active="true"');

    const defaultExports = renderToStaticMarkup(<RepartoExportCenterView exports={[]} />);
    expect(defaultExports).toContain('data-reparto-workflow-action="none"');
    expect(defaultExports).toContain("Final ready");
    expect(defaultExports).toContain('data-reparto-backup-id=""');

    const returned = renderToStaticMarkup(
      <RepartoExportCenterView exports={[]} processStatus="sent_to_school_leadership" />
    );
    expect(returned).toContain('data-reparto-workflow-action="mark-returned"');

    const revision = renderToStaticMarkup(
      <RepartoExportCenterView exports={[]} processStatus="returned_by_school_leadership" />
    );
    expect(revision).toContain('data-reparto-workflow-action="start-revision"');
  });

  it("exports Phase 3 island-root names for full and headless consumers", () => {
    expect(renderToStaticMarkup(<RepartoDashboardView dashboard={dashboard} />)).toContain(
      'data-reparto-route="dashboard"'
    );
    expect(renderToStaticMarkup(<RepartoMeetingView summary={processSummary} />)).toContain(
      'data-reparto-panel="current-turn"'
    );
    expect(
      renderToStaticMarkup(
        <RepartoMyView
          meetingSession={meetingSession}
          processId={processSummary.process_id}
          requirementAssignedHours={1}
          requirementRequiredHours={4}
          summary={teacherSummary}
        />
      )
    ).toContain('data-reparto-choice-state="ready"');
    expect(
      renderToStaticMarkup(
        <RepartoSharedView processId={processSummary.process_id} summary={processSummary} />
      )
    ).toContain('data-reparto-route="shared-screen"');
    expect(
      renderToStaticMarkup(
        <RepartoExportsView
          exports={[backupExport]}
          processId={processSummary.process_id}
          summary={processSummary}
        />
      )
    ).toContain('data-export-artifact-type="backup"');
  });

  it("exposes reparto context inside the provider", () => {
    const html = renderToStaticMarkup(
      <RepartoProvider config={{ apiBase: "/custom" }}>
        <ContextReader />
      </RepartoProvider>
    );
    expect(html).toContain('data-api-base="/custom"');
    expect(html).toContain('data-has-adapter="true"');
    expect(() => renderToStaticMarkup(<ContextReader />)).toThrow(
      "useRepartoContext must be used inside RepartoProvider"
    );
  });
});
