import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RepartoProvider, useRepartoContext } from "../src/runtime/react/index.js";
import {
  ProcessListView,
  VersionsView
} from "../src/runtime/react/DepartmentHeadWorkspace.js";
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

const planBalance = {
  teaching_plan_id: "aaaa1111-aaaa-4aaa-8aaa-aaaaaaaa1111",
  assignment_process_id: "11111111-1111-4111-8111-111111111111",
  group: {
    total_group_load: "120.00",
    allocated_group_weekly_hours: "120.00",
    allocation_difference: "0.00",
    is_balanced: true
  },
  teacher: {
    total_teacher_load: "124.00",
    participant_target_total: "120.00",
    teacher_load_difference: "4.00",
    is_balanced: false
  },
  is_exact: false
};

const processSummary: ProcessSummary = {
  process_id: "11111111-1111-4111-8111-111111111111",
  generated_at: "2026-07-04T10:00:00Z",
  readiness: "ready",
  plan_status: "requirements_generated",
  plan_balance: planBalance,
  total_slots: 4,
  assigned_slots: 1,
  available_slots: 3,
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

const dashboardParticipant = {
  process_teacher_id: "44444444-4444-4444-8444-444444444444",
  teacher_profile_id: "55555555-5555-4555-8555-555555555555",
  display_name: "Ada Lovelace",
  base_weekly_hours: "18.00",
  extra_weekly_hours: "2.00",
  target_weekly_hours: "20.00",
  assigned_weekly_hours: "6.00",
  remaining_weekly_hours: "14.00",
  is_overloaded: true,
  assignment_count: 1,
  state: "overloaded_authorized"
} as const;

const dashboard = {
  process_id: processSummary.process_id,
  generated_at: "2026-07-04T10:00:00Z",
  readiness: "recalculation_required",
  planning: {
    teaching_plan_id: planBalance.teaching_plan_id,
    status: "stale",
    balance: planBalance,
    validations: {
      teaching_plan_id: planBalance.teaching_plan_id,
      assignment_process_id: processSummary.process_id,
      is_assignment_ready: false,
      blocking_count: 1,
      warning_count: 0,
      messages: [
        {
          severity: "blocking",
          code: "plan.stale",
          message: "The plan changed after generation.",
          entity_type: "plan",
          entity_id: planBalance.teaching_plan_id
        }
      ]
    }
  },
  assignment: {
    summary: {
      assignment_process_id: processSummary.process_id,
      total_target_hours: "20.00",
      total_assigned_hours: "6.00",
      total_remaining_hours: "14.00",
      total_slots: 4,
      assigned_slots: 1,
      available_slots: 3,
      participants: [dashboardParticipant]
    },
    validations: {
      assignment_process_id: processSummary.process_id,
      is_final_ready: false,
      blocking_count: 1,
      warning_count: 0,
      messages: [
        {
          severity: "blocking",
          code: "requirement.unassigned",
          message: "Three positions are still unassigned.",
          entity_type: "assignment_process",
          entity_id: processSummary.process_id
        }
      ]
    }
  },
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
  readiness: "ready",
  selection_blocked: false,
  plan_balance: null,
  participant: {
    process_teacher_id: processSummary.current_turn?.process_teacher_id ?? "",
    teacher_profile_id: "55555555-5555-4555-8555-555555555555",
    display_name: "Teacher",
    base_weekly_hours: "4.00",
    extra_weekly_hours: "0.00",
    target_weekly_hours: "4.00",
    assigned_weekly_hours: "1.00",
    remaining_weekly_hours: "3.00",
    is_overloaded: false,
    assignment_count: 1,
    state: "pending"
  },
  available_slots: 2,
  current_turn: processSummary.current_turn
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
  changed_sections: ["teaching_activities", "teachers"],
  allocation_changed: true,
  group_hours_changed: true,
  teacher_load_changed: false,
  subject_category_changed: false,
  activity_added_or_removed: true,
  group_link_added_or_removed: true,
  teacher_position_count_changed: false,
  participant_target_changed: true,
  requirement_generation_changed: true,
  allocation_delta: "-4.00",
  group_load_delta: "12.50",
  teacher_load_delta: "0.00",
  participant_target_total_delta: "3.00",
  generation_number_delta: 1,
  teacher_count_delta: -1,
  activity_count_delta: 0,
  requirement_count_delta: 2
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
  it("renders the two-stage dashboard panels", () => {
    const html = renderToStaticMarkup(
      <DepartmentHeadView
        config={{ apiBase: "/api", apiPrefix: "/reparto" }}
        dashboard={dashboard}
      />
    );

    expect(html).toContain('data-reparto-panel="current-turn"');
    expect(html).toContain("Turn 2");
    expect(html).toContain('data-reparto-action="start-turn"');
    expect(html).toContain('data-reparto-panel="planning-balance"');
    expect(html).toContain('data-reparto-panel="assignment-progress"');
    expect(html).toContain('data-reparto-panel="participant-balances"');
    expect(html).toContain('data-reparto-panel="validation-summary"');
    expect(html).toContain('data-reparto-panel="setup-checklist"');

    // The three invariants are three slots, never one "ready" badge (§20.20).
    expect(html).toContain('data-reparto-invariant="group"');
    expect(html).toContain('data-reparto-invariant="teacher"');
    expect(html).toContain('data-reparto-invariant="readiness"');
    expect(html).toContain('data-reparto-invariant-state="unbalanced"');
    expect(html).toContain('data-reparto-invariant-state="recalculation_required"');

    // Both axes are shown and neither is summed into the other: 120 group hours
    // against 124 teacher-load hours, both correct.
    expect(html).toContain('data-reparto-balance-axis="group"');
    expect(html).toContain('data-reparto-balance-axis="teacher"');
    expect(html).toContain("120.00 h");
    expect(html).toContain("124.00 h");
    expect(html).not.toContain("244.00");

    // Findings come from the service, per stage, with the stable code on the DOM.
    expect(html).toContain('data-reparto-slot="planning-validations"');
    expect(html).toContain('data-reparto-slot="assignment-validations"');
    expect(html).toContain('data-reparto-validation-code="plan.stale"');
    expect(html).toContain('data-reparto-validation-code="requirement.unassigned"');
    expect(html).toContain("The plan changed after generation.");

    // Authorized overload is a flag decided in advance, not an inference from
    // assigned hours exceeding the target.
    expect(html).toContain('data-reparto-participant-state="overloaded_authorized"');
    expect(html).toContain('data-reparto-overloaded="true"');

    // Nothing from the retired single-balance dashboard survives.
    expect(html).not.toContain('data-reparto-panel="overview-chart"');
    expect(html).not.toContain('data-reparto-panel="classroom-coverage-chart"');
    expect(html).not.toContain('data-reparto-slot="overview-state"');
    expect(html).not.toContain('data-reparto-slot="pending-required-hours"');
  });

  it("states that a process without a teaching plan has no balance, rather than zero", () => {
    const html = renderToStaticMarkup(
      <DepartmentHeadView
        config={{ apiBase: "/api", apiPrefix: "/reparto" }}
        dashboard={{
          ...dashboard,
          readiness: "not_ready",
          planning: {
            teaching_plan_id: null,
            status: null,
            balance: null,
            validations: null
          }
        }}
      />
    );
    expect(html).toContain('data-reparto-slot="planning-empty"');
    expect(html).toContain('data-reparto-plan-status="none"');
    expect(html).toContain('data-reparto-invariant-state="unknown"');
    expect(html).not.toContain('data-reparto-balance-axis="group"');
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
    expect(sharedHtml).toContain('data-reparto-panel="shared-balance"');
    expect(sharedHtml).toContain('data-reparto-slot="current-turn"');
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

  it("shows the teacher's own target as base plus authorized extra, with the aggregate balance", async () => {
    const { TeacherLanWorkspace } = await import(
      "../src/runtime/react/LanWorkspace.js"
    );
    const html = renderToStaticMarkup(
      <TeacherLanWorkspace
        processId={processSummary.process_id}
        summary={{
          ...teacherSummary,
          participant: {
            ...teacherSummary.participant,
            extra_weekly_hours: "2.00",
            target_weekly_hours: "6.00",
            remaining_weekly_hours: "5.00",
            is_overloaded: true,
            state: "overloaded_authorized"
          },
          plan_balance: {
            teaching_plan_id: "77777777-7777-4777-8777-777777777777",
            assignment_process_id: processSummary.process_id,
            group: {
              total_group_load: "120.00",
              allocated_group_weekly_hours: "120.00",
              allocation_difference: "0.00",
              is_balanced: true
            },
            teacher: {
              total_teacher_load: "124.00",
              participant_target_total: "124.00",
              teacher_load_difference: "0.00",
              is_balanced: true
            },
            is_exact: true
          }
        }}
      />
    );
    // Five figures, and the target is shown as the service computed it.
    expect(html).toContain('data-reparto-slot="teacher-base-hours"');
    expect(html).toContain('data-reparto-slot="teacher-extra-hours"');
    expect(html).toContain('data-reparto-slot="teacher-target-hours"');
    expect(html).toContain('data-reparto-slot="teacher-assigned-hours"');
    expect(html).toContain('data-reparto-slot="teacher-remaining-hours"');
    // The retired capacity slot is gone, not renamed onto a new concept.
    expect(html).not.toContain('data-reparto-slot="teacher-available-hours"');
    expect(html).toContain('data-reparto-overloaded="true"');
    expect(html).toContain('data-reparto-participant-state="overloaded_authorized"');
    expect(html).toContain("2.00 extra hours have been authorized for you.");
    // Complete selectable positions, and the two aggregate balances that name
    // nobody — the only process-wide figures a LAN client may see.
    expect(html).toContain('data-reparto-available-slots="2"');
    expect(html).toContain("120.00");
    expect(html).toContain("124.00");

    // Without a plan the balance line says so rather than reading zero.
    const noPlan = renderToStaticMarkup(
      <TeacherLanWorkspace
        processId={processSummary.process_id}
        summary={teacherSummary}
      />
    );
    expect(noPlan).toContain("no teaching plan yet");
    expect(noPlan).toContain("No extra hours are authorized for you.");

    // An allocation the leadership has not communicated is stated, not zeroed.
    const noAllocation = renderToStaticMarkup(
      <TeacherLanWorkspace
        processId={processSummary.process_id}
        summary={{
          ...teacherSummary,
          plan_balance: {
            teaching_plan_id: "77777777-7777-4777-8777-777777777777",
            assignment_process_id: processSummary.process_id,
            group: {
              total_group_load: "120.00",
              allocated_group_weekly_hours: null,
              allocation_difference: null,
              is_balanced: false
            },
            teacher: {
              total_teacher_load: "124.00",
              participant_target_total: "120.00",
              teacher_load_difference: "4.00",
              is_balanced: false
            },
            is_exact: false
          }
        }}
      />
    );
    expect(noAllocation).toContain("no allocation yet");
  });

  it("renders direct-choice state per position and fails closed without plan readiness", async () => {
    const positions = [
      {
        id: "aaaaaaa1-1111-4111-8111-111111111111",
        assignment_process_id: processSummary.process_id,
        teaching_activity_id: "aaaaaaa2-2222-4222-8222-222222222222",
        position_index: 0,
        required_teacher_hours: "3.00",
        status: "available" as const,
        created_generation: 1,
        last_validated_generation: 1,
        retired_generation: null,
        superseded_by_requirement_id: null,
        created_at: "2026-07-04T10:00:00Z",
        updated_at: "2026-07-04T10:00:00Z"
      }
    ];
    const ready = renderToStaticMarkup(
      <TeacherLanView
        assignments={[]}
        meetingSession={meetingSession}
        processId={processSummary.process_id}
        readiness="ready"
        remainingTargetHours="3.00"
        requirements={positions}
        selectedSlotId={positions[0].id}
        selectionBlocked={false}
        summary={teacherSummary}
      />
    );
    expect(ready).toContain('data-reparto-choice-state="ready"');
    expect(ready).toContain('data-reparto-selectable-slots="1"');
    // The position's own hours, taken whole — never a required-minus-assigned
    // remainder.
    expect(ready).toContain("Taking this position assigns 3.00 teacher hours to you in full.");
    expect(ready).toContain('data-reparto-slot-choice="selectable"');
    expect(ready).toContain('data-reparto-slot="choice-result"');
    expect(ready).not.toContain("data-reparto-impact-hours");

    // The LAN payload is the authority on the gates, so the props may be
    // omitted entirely and the panel still opens for a ready service.
    const fromPayload = renderToStaticMarkup(
      <TeacherLanView
        assignments={[]}
        meetingSession={meetingSession}
        processId={processSummary.process_id}
        requirements={positions}
        selectedSlotId={positions[0].id}
        summary={teacherSummary}
      />
    );
    expect(fromPayload).toContain('data-reparto-choice-state="ready"');

    // ...and it closes them for the same reason the service would: a payload
    // that reports a blocked selection blocks, without any prop saying so.
    const blocked = renderToStaticMarkup(
      <TeacherLanView
        assignments={[]}
        meetingSession={meetingSession}
        processId={processSummary.process_id}
        requirements={positions}
        selectedSlotId={positions[0].id}
        summary={{ ...teacherSummary, selection_blocked: true }}
      />
    );
    expect(blocked).toContain('data-reparto-choice-state="blocked"');
    expect(blocked).toContain('data-reparto-choice-reason="selection_blocked"');

    const recalculating = renderToStaticMarkup(
      <TeacherLanView
        assignments={[]}
        meetingSession={meetingSession}
        processId={processSummary.process_id}
        requirements={positions}
        selectedSlotId={positions[0].id}
        summary={{ ...teacherSummary, readiness: "recalculation_required" }}
      />
    );
    expect(recalculating).toContain(
      'data-reparto-choice-reason="reconciliation_required"'
    );

    // With no payload at all the placeholder is closed, not empty-but-open: a
    // teacher client never implies the assignment stage is open.
    const { TeacherLanWorkspace } = await import(
      "../src/runtime/react/LanWorkspace.js"
    );
    const unknown = renderToStaticMarkup(
      <TeacherLanWorkspace
        meetingSession={meetingSession}
        processId={processSummary.process_id}
        requirements={positions}
        selectedSlotId={positions[0].id}
      />
    );
    expect(unknown).toContain('data-reparto-choice-state="blocked"');
    expect(unknown).toContain('data-reparto-choice-reason="plan_not_ready"');
    expect(unknown).toContain('data-reparto-slot="teacher-target-hours"');

    // A position the viewer's own live assignment already covers for that
    // activity is offered with the distinct-teacher reason attached.
    const duplicate = renderToStaticMarkup(
      <TeacherLanView
        assignments={[
          {
            id: "aaaaaaa3-3333-4333-8333-333333333333",
            assignment_process_id: processSummary.process_id,
            hour_requirement_id: "aaaaaaa4-4444-4444-8444-444444444444",
            teaching_activity_id: positions[0].teaching_activity_id,
            process_teacher_id: teacherSummary.process_teacher_id,
            source: "teacher_direct" as const,
            status: "active" as const,
            chosen_by_user_id: null,
            confirmed_by_user_id: null,
            notes: null,
            created_at: "2026-07-04T10:00:00Z",
            updated_at: "2026-07-04T10:00:00Z"
          }
        ]}
        meetingSession={meetingSession}
        processId={processSummary.process_id}
        readiness="ready"
        requirements={positions}
        selectedSlotId={positions[0].id}
        selectionBlocked={false}
        summary={teacherSummary}
      />
    );
    expect(duplicate).toContain(
      'data-slot-disabled-reason="duplicate_activity_position"'
    );
    expect(duplicate).toContain("You already hold a position of this activity.");
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
    // No capture yet is not "no changes": the panel says nothing was compared
    // and the compare control says why it cannot be pressed.
    expect(versions).toContain('data-reparto-comparison-state="none"');
    expect(versions).toContain('data-disabled-reason="not_enough_versions"');
    expect(versions).toContain("No version has been captured yet.");
    // A process with no source process cannot be diffed against last year.
    expect(versions).toContain('data-disabled-reason="no_previous_year"');
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
    // All nine §10.3 dimensions are listed, changed or not: "did the
    // allocation move?" needs an answer of "no", not an absent row.
    for (const dimension of [
      "allocation",
      "group_hours",
      "teacher_load",
      "subject_category",
      "activity",
      "group_link",
      "teacher_position_count",
      "participant_target",
      "requirement_generation"
    ]) {
      expect(versions).toContain(`data-reparto-dimension="${dimension}"`);
    }
    expect(versions).toContain('data-reparto-comparison-state="changed"');
    expect(versions).toContain("6 of 9 comparison dimensions changed.");
    // The service's own canonical strings, with only the positive sign added.
    expect(versions).toContain("-4.00 h");
    expect(versions).toContain("+12.50 h");
    expect(versions).toContain('data-reparto-delta-sign="negative"');
    expect(versions).toContain('data-reparto-delta-sign="zero"');
    // A set change with a zero count is still a change: the flag decides.
    expect(versions).toContain(
      '<li class="rounded-md border border-border/70 bg-muted/20 px-3 py-2" data-reparto-dimension="activity" data-reparto-dimension-changed="true"'
    );
    // The `teachers` snapshot section is process participants, never the
    // roster (freeze §5.4), and it is labelled as such.
    expect(versions).toContain('data-reparto-section="teachers"');
    expect(versions).toContain("Process participants");
    // The retired float axes are gone from the panel with their contract.
    expect(versions).not.toContain('data-reparto-slot="required-hours-delta"');
    expect(versions).not.toContain('data-reparto-slot="assigned-hours-delta"');

    // No allocation on one side is "not comparable", never a zero.
    const notComparable = renderToStaticMarkup(
      <RepartoVersionsView
        comparison={{ ...comparison, allocation_delta: null }}
        versions={[version, { ...version, version_number: 2 }]}
      />
    );
    expect(notComparable).toContain('data-reparto-delta-sign="none"');
    expect(notComparable).toContain("Not comparable");

    // Every dimension unchanged while sections still differ is its own state:
    // saying "No changes" there would be false.
    const sectionsOnly = renderToStaticMarkup(
      <RepartoVersionsView
        comparison={{
          ...comparison,
          allocation_changed: false,
          group_hours_changed: false,
          activity_added_or_removed: false,
          group_link_added_or_removed: false,
          participant_target_changed: false,
          requirement_generation_changed: false
        }}
        versions={[version, { ...version, version_number: 2 }]}
      />
    );
    expect(sectionsOnly).toContain('data-reparto-comparison-state="sections_only"');
    expect(sectionsOnly).toContain('data-reparto-slot="other-changes"');
    expect(sectionsOnly).not.toContain("No changes");

    const identical = renderToStaticMarkup(
      <RepartoVersionsView
        comparison={{
          ...comparison,
          changed_sections: [],
          allocation_changed: false,
          group_hours_changed: false,
          activity_added_or_removed: false,
          group_link_added_or_removed: false,
          participant_target_changed: false,
          requirement_generation_changed: false
        }}
        versions={[version, { ...version, version_number: 2 }]}
      />
    );
    expect(identical).toContain('data-reparto-comparison-state="identical"');
    expect(identical).toContain("No changes");

    // A section the service adds later is reported as its own code rather
    // than dropped from the list.
    const unknownSection = renderToStaticMarkup(
      <RepartoVersionsView
        comparison={{ ...comparison, changed_sections: ["something_new"] }}
        versions={[version, { ...version, version_number: 2 }]}
      />
    );
    expect(unknownSection).toContain('data-reparto-section="something_new"');
    expect(unknownSection).toContain("something_new");

    // The same panel renders the previous-year diff, and says which it is.
    // Rendered through the presentational view: the source and the
    // previous-year availability are the container's state, not props of the
    // island root.
    const previousYear = renderToStaticMarkup(
      <VersionsView
        comparison={comparison}
        comparisonSource="previous_year"
        previousYearAvailable
        versions={[version]}
      />
    );
    expect(previousYear).toContain('data-reparto-comparison-source="previous_year"');
    expect(previousYear).toContain("Previous academic year");
    expect(previousYear).toContain('data-reparto-action="compare-previous-year"');

    // Two versions selected, but the same one twice: refused here rather than
    // answered with "every flag false".
    const sameVersion = renderToStaticMarkup(
      <VersionsView
        selection={{ left: version.id, right: version.id }}
        versions={[version, { ...version, id: "12121212-1212-4121-8121-121212121212", version_number: 2 }]}
      />
    );
    expect(sameVersion).toContain('data-disabled-reason="same_version"');

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
      'data-reparto-panel="meeting-turn-control"'
    );
    expect(
      renderToStaticMarkup(
        <RepartoMyView
          meetingSession={meetingSession}
          processId={processSummary.process_id}
          readiness="ready"
          selectionBlocked={false}
          summary={teacherSummary}
        />
      )
    ).toContain('data-reparto-panel="direct-choice-workflow"');
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
