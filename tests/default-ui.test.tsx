import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RepartoProvider, useRepartoContext } from "../src/runtime/react/index.js";
import {
  DepartmentHeadView,
  ProcessesView,
  RepartoExportCenterView,
  RepartoVersionsView,
  SharedScreenView,
  TeacherLanView
} from "../src/runtime/react/default-ui/index.js";
import type {
  ExportArtifactPublic,
  MeetingSessionPublic,
  ProcessSummary,
  ProcessVersionPublic,
  TeacherLanSummary,
  VersionComparison
} from "../src/runtime/schemas.js";

function ContextReader() {
  const context = useRepartoContext();
  return <span data-api-base={context.config?.apiBase} />;
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
  it("renders the department-head MVP workflow panels", () => {
    const html = renderToStaticMarkup(
      <DepartmentHeadView
        config={{ apiBase: "/api", apiPrefix: "/reparto" }}
        summary={processSummary}
      />
    );

    expect(html).toContain('data-reparto-panel="current-turn"');
    expect(html).toContain("Turn 2");
    expect(html).toContain('data-reparto-action="start-turn"');
    expect(html).toContain('data-reparto-panel="setup-wizard"');
    expect(html).toContain('data-reparto-panel="teachers-view"');
    expect(html).toContain('data-reparto-panel="required-hours"');
    expect(html).toContain('data-reparto-panel="manual-assignment-board"');
    expect(html).toContain('data-reparto-panel="validation-summary"');
    expect(html).toContain('data-reparto-panel="lan-meeting-settings"');
    expect(html).toContain('data-reparto-action="create-session"');
    expect(html).toContain('data-reparto-action="record-override"');
  });

  it("renders Phase 2 LAN teacher and shared-screen views", () => {
    const teacherHtml = renderToStaticMarkup(
      <TeacherLanView
        config={{ apiBase: "/api", apiPrefix: "/reparto" }}
        processId="11111111-1111-4111-8111-111111111111"
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

  it("renders LAN views before a process is selected", () => {
    expect(renderToStaticMarkup(<TeacherLanView />)).toContain(
      'data-reparto-route="my-view"'
    );
    expect(renderToStaticMarkup(<DepartmentHeadView />)).toContain(
      "No active turn"
    );
    expect(renderToStaticMarkup(<SharedScreenView />)).toContain(
      "No active turn"
    );
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
      'data-reparto-action="create-process"'
    );
    const versions = renderToStaticMarkup(<RepartoVersionsView />);
    expect(versions).toContain('data-reparto-action="create-version"');
    expect(versions).toContain('data-reparto-action="compare-versions"');
    expect(versions).toContain('data-reparto-panel="comparison"');
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

    const defaultExports = renderToStaticMarkup(<RepartoExportCenterView />);
    expect(defaultExports).toContain('data-reparto-workflow-action="none"');
    expect(defaultExports).toContain("Final ready");
    expect(defaultExports).toContain('data-reparto-backup-id=""');

    const returned = renderToStaticMarkup(
      <RepartoExportCenterView processStatus="sent_to_school_leadership" />
    );
    expect(returned).toContain('data-reparto-workflow-action="mark-returned"');

    const revision = renderToStaticMarkup(
      <RepartoExportCenterView processStatus="returned_by_school_leadership" />
    );
    expect(revision).toContain('data-reparto-workflow-action="start-revision"');
  });

  it("exposes reparto context inside the provider", () => {
    const html = renderToStaticMarkup(
      <RepartoProvider config={{ apiBase: "/custom" }}>
        <ContextReader />
      </RepartoProvider>
    );
    expect(html).toContain('data-api-base="/custom"');
    expect(() => renderToStaticMarkup(<ContextReader />)).toThrow(
      "useRepartoContext must be used inside RepartoProvider"
    );
  });
});
