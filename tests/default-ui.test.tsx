import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RepartoProvider, useRepartoContext } from "../src/runtime/react/index.js";
import {
  DepartmentHeadView,
  ProcessesView,
  RepartoVersionsView,
  SharedScreenView,
  TeacherLanView
} from "../src/runtime/react/default-ui/index.js";
import type { ProcessSummary } from "../src/runtime/schemas.js";

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

  it("renders prompt-style starter views for process and version routes", () => {
    expect(renderToStaticMarkup(<ProcessesView />)).toContain(
      'data-reparto-action="create-process"'
    );
    const versions = renderToStaticMarkup(<RepartoVersionsView />);
    expect(versions).toContain('data-reparto-action="create-version"');
    expect(versions).toContain('data-reparto-action="compare-versions"');
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
