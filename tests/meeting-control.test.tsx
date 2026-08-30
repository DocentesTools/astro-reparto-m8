import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  repartoUser,
  resetRepartoAuthAdapter,
  signInReparto
} from "./support/session.js";
import { buildMeetingControlState } from "../src/runtime/ui/index.js";
import { MeetingControlWorkspace } from "../src/runtime/react/MeetingWorkspace.js";
import { SharedScreenWorkspace } from "../src/runtime/react/LanWorkspace.js";
import type {
  MeetingSessionPublic,
  ProcessDashboard,
  ProcessSummary
} from "../src/runtime/schemas.js";

// The control room's turn controls are department-head affordances (§8.1 route
// map, `meeting` → `act: admin`), so these renders sign an `ADMIN` in; the
// read-only direction is proven per route in `route-gating.test.tsx`.
beforeEach(() => {
  signInReparto(repartoUser("admin"));
});

afterEach(() => {
  resetRepartoAuthAdapter();
});

const processId = "11111111-1111-4111-8111-111111111111";
const planId = "22222222-2222-4222-8222-222222222222";
const teacherId = "33333333-3333-4333-8333-333333333333";
const now = "2026-08-02T10:00:00Z";

const planBalance = {
  teaching_plan_id: planId,
  assignment_process_id: processId,
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

const summary: ProcessSummary = {
  process_id: processId,
  generated_at: now,
  readiness: "ready",
  plan_status: "requirements_generated",
  plan_balance: planBalance,
  total_slots: 8,
  assigned_slots: 3,
  available_slots: 5,
  balanced_participant_count: 2,
  pending_participant_count: 1,
  overloaded_participant_count: 1,
  current_turn: {
    meeting_session_id: "44444444-4444-4444-8444-444444444444",
    selection_turn_id: "55555555-5555-4555-8555-555555555555",
    process_teacher_id: teacherId,
    position: 2,
    status: "active",
    started_at: now
  },
  blocking_validation_count: 0
};

const openSession: MeetingSessionPublic = {
  id: "44444444-4444-4444-8444-444444444444",
  assignment_process_id: processId,
  status: "open",
  lan_access_enabled: false,
  direct_teacher_selection_enabled: false,
  selection_mode: "strict",
  notes: null,
  started_at: now,
  started_by_user_id: null,
  paused_at: null,
  closed_at: null,
  created_at: now,
  updated_at: now
};

const dashboard: ProcessDashboard = {
  process_id: processId,
  generated_at: now,
  readiness: "ready",
  planning: {
    teaching_plan_id: planId,
    status: "requirements_generated",
    balance: planBalance,
    validations: {
      teaching_plan_id: planId,
      assignment_process_id: processId,
      is_assignment_ready: true,
      blocking_count: 0,
      warning_count: 0,
      messages: []
    }
  },
  assignment: {
    summary: {
      assignment_process_id: processId,
      total_target_hours: "40.00",
      total_assigned_hours: "12.00",
      total_remaining_hours: "28.00",
      total_slots: 8,
      assigned_slots: 3,
      available_slots: 5,
      participants: [
        {
          process_teacher_id: teacherId,
          teacher_profile_id: "66666666-6666-4666-8666-666666666666",
          display_name: "Ada Lovelace",
          base_weekly_hours: "18.00",
          extra_weekly_hours: "2.00",
          target_weekly_hours: "20.00",
          assigned_weekly_hours: "6.00",
          remaining_weekly_hours: "14.00",
          is_overloaded: true,
          assignment_count: 1,
          state: "overloaded_authorized"
        },
        {
          process_teacher_id: "77777777-7777-4777-8777-777777777777",
          teacher_profile_id: "88888888-8888-4888-8888-888888888888",
          display_name: "Grace Hopper",
          base_weekly_hours: "20.00",
          extra_weekly_hours: "0.00",
          target_weekly_hours: "20.00",
          assigned_weekly_hours: "6.00",
          remaining_weekly_hours: "14.00",
          is_overloaded: false,
          assignment_count: 1,
          state: "pending"
        }
      ]
    },
    validations: {
      assignment_process_id: processId,
      is_final_ready: false,
      blocking_count: 0,
      warning_count: 1,
      messages: []
    }
  },
  current_turn: summary.current_turn,
  blocking_validation_count: 0
};

describe("meeting control state", () => {
  it("fails closed with no payload at all", () => {
    const state = buildMeetingControlState(null);
    expect(state.selectionBlocked).toBe(true);
    expect(state.blockedReason).toBe("no_process_data");
    // A control room must never imply the meeting can proceed because a request
    // has not answered yet.
    expect(state.actions.every((action) => action.disabled)).toBe(true);
    expect(state.pendingSlots).toBe(0);
    expect(state.turnActive).toBe(false);
  });

  it("opens the turn controls only for a ready plan with a live turn", () => {
    const state = buildMeetingControlState(summary);
    expect(state.selectionBlocked).toBe(false);
    expect(state.blockedReason).toBeNull();
    expect(state.pendingSlots).toBe(5);
    expect(
      state.actions.find((action) => action.key === "complete-turn")?.disabled
    ).toBe(false);
    // Initializing is refused while a turn is live, and says which of the two
    // reasons applies.
    expect(state.actions.find((action) => action.key === "initialize-turns")).toEqual({
      key: "initialize-turns",
      disabled: true,
      reason: "turn_active"
    });

    const noTurn = buildMeetingControlState({ ...summary, current_turn: null });
    expect(noTurn.actions.find((action) => action.key === "complete-turn")).toEqual({
      key: "complete-turn",
      disabled: true,
      reason: "no_active_turn"
    });
    expect(
      noTurn.actions.find((action) => action.key === "initialize-turns")?.disabled
    ).toBe(false);
  });

  it("reads readiness and plan status independently, and neither from the other", () => {
    // Readiness alone blocks: the coarse projection is authoritative even when
    // the plan status looks settled.
    const recalculating = buildMeetingControlState({
      ...summary,
      readiness: "recalculation_required"
    });
    expect(recalculating.reconciliationRequired).toBe(true);
    expect(recalculating.blockedReason).toBe("reconciliation_required");

    // Plan status alone blocks too.
    const reconciling = buildMeetingControlState({
      ...summary,
      plan_status: "reconciliation_required"
    });
    expect(reconciling.reconciliationRequired).toBe(true);
    expect(reconciling.blockedReason).toBe("reconciliation_required");

    // A stale plan is reported as stale without being reported as needing
    // reconciliation — the service has not said that yet.
    const stale = buildMeetingControlState({ ...summary, plan_status: "stale" });
    expect(stale.planStale).toBe(true);
    expect(stale.reconciliationRequired).toBe(false);
    expect(stale.blockedReason).toBeNull();

    const notReady = buildMeetingControlState({ ...summary, readiness: "not_ready" });
    expect(notReady.blockedReason).toBe("plan_not_ready");
    expect(notReady.actions.every((action) => action.disabled)).toBe(true);
  });

  it("closes every turn control when no meeting session is open", () => {
    const noSession = buildMeetingControlState(summary, false);
    expect(noSession.selectionBlocked).toBe(true);
    expect(noSession.blockedReason).toBe("no_meeting_session");
    expect(
      noSession.actions.every(
        (action) => action.disabled && action.reason === "no_meeting_session"
      )
    ).toBe(true);

    // Not asking (the default) reads exactly as before: a caller with no
    // session concept of its own is unaffected.
    const noArgument = buildMeetingControlState(summary);
    expect(noArgument.blockedReason).toBeNull();

    // A plan-state reason still wins over the session question when both are
    // wrong at once — the caller sees one reason, not a list.
    const bothWrong = buildMeetingControlState(
      { ...summary, readiness: "not_ready" },
      false
    );
    expect(bothWrong.blockedReason).toBe("plan_not_ready");
  });
});

describe("meeting control view", () => {
  it("shows both balances, pending slots and the authorized overloads", () => {
    const html = renderToStaticMarkup(
      <MeetingControlWorkspace
        dashboard={dashboard}
        processId={processId}
        sessionControls={{ onClose: () => {}, onOpen: () => {}, session: openSession }}
      />
    );
    expect(html).toContain('data-reparto-route="meeting"');
    expect(html).toContain('data-reparto-panel="meeting-turn-control"');
    expect(html).toContain('data-reparto-balance-axis="group"');
    expect(html).toContain('data-reparto-balance-axis="teacher"');
    expect(html).toContain("120.00 h");
    expect(html).toContain("124.00 h");
    expect(html).toContain('data-reparto-slot="pending-slots"');
    expect(html).toContain('data-reparto-selection-blocked="false"');

    // Authorized overload is listed as the prior decision it is, with the
    // arithmetic that produced the target — and the participant who has none is
    // not listed at all.
    expect(html).toContain('data-reparto-slot="authorized-overloads"');
    expect(html).toContain("Ada Lovelace");
    expect(html).not.toContain("Grace Hopper");
    expect(html).toContain("18.00 h base + 2.00 h authorized = 20.00 h target");
  });

  it("takes the overload count from the shared field, not a local filter", () => {
    // `dashboard` carries one overloaded and one pending participant; the
    // projected `overloaded_participant_count` (computed from the same
    // `participants` rows by `summarizeProcessDashboard`) must be what the
    // count slot shows, not a second, locally-filtered opinion of the same
    // list.
    const html = renderToStaticMarkup(
      <MeetingControlWorkspace
        dashboard={dashboard}
        processId={processId}
        sessionControls={{ onClose: () => {}, onOpen: () => {}, session: openSession }}
      />
    );
    expect(html).toContain(
      '<span class="text-sm text-muted-foreground" data-reparto-slot="overload-count">1</span>'
    );
  });

  it("shows the head the stored feasibility status, not the readiness projection", () => {
    const html = renderToStaticMarkup(
      <MeetingControlWorkspace
        dashboard={dashboard}
        feasibility="infeasible"
        processId={processId}
        sessionControls={{ onClose: () => {}, onOpen: () => {}, session: openSession }}
      />
    );
    // A `ready` process whose partition is INFEASIBLE is exactly the case the
    // projection cannot express, and the control room is the head's own surface.
    expect(html).toContain('data-reparto-invariant="feasibility"');
    expect(html).toContain('data-reparto-invariant-source="plan"');
    expect(html).toContain('data-reparto-invariant-state="infeasible"');
    expect(html).toContain("Infeasible");
    expect(html).not.toContain('data-reparto-invariant-source="readiness"');
  });

  it("closes the turn controls and says why when reconciliation is required", () => {
    const html = renderToStaticMarkup(
      <MeetingControlWorkspace
        dashboard={{
          ...dashboard,
          readiness: "recalculation_required",
          planning: { ...dashboard.planning, status: "reconciliation_required" }
        }}
        processId={processId}
      />
    );
    expect(html).toContain('data-reparto-selection-blocked="true"');
    expect(html).toContain('data-reparto-lifecycle-state="reconciliation_required"');
    expect(html).toContain('data-reparto-reconciliation-required="true"');
    expect(html).toContain('data-disabled-reason="reconciliation_required"');
    expect(html).toContain("An allocation change must be reconciled");
  });

  it("reports a stale plan without claiming reconciliation is required", () => {
    const html = renderToStaticMarkup(
      <MeetingControlWorkspace
        dashboard={{
          ...dashboard,
          planning: { ...dashboard.planning, status: "stale" }
        }}
        processId={processId}
        sessionControls={{ onClose: () => {}, onOpen: () => {}, session: openSession }}
      />
    );
    expect(html).toContain('data-reparto-lifecycle-state="stale"');
    expect(html).toContain('data-reparto-plan-stale="true"');
    expect(html).toContain('data-reparto-reconciliation-required="false"');
    expect(html).toContain('data-reparto-selection-blocked="false"');
  });

  it("closes every control when it has no payload", () => {
    const html = renderToStaticMarkup(<MeetingControlWorkspace processId={processId} />);
    expect(html).toContain('data-reparto-selection-blocked="true"');
    expect(html).toContain('data-disabled-reason="no_process_data"');
    expect(html).toContain('data-reparto-slot="no-authorized-overloads"');
    expect(html).toContain('data-reparto-slot="planning-empty"');
  });

  it("closes every turn control when a ready plan has no meeting session open", () => {
    // Plan-state alone would open every control (see the first case in this
    // block, same dashboard); with no session it must not — an offered
    // control the service would refuse for want of a session is exactly the
    // "offered and then refused" failure this gate exists to prevent.
    const html = renderToStaticMarkup(
      <MeetingControlWorkspace dashboard={dashboard} processId={processId} />
    );
    expect(html).toContain('data-reparto-selection-blocked="true"');
    expect(html).toContain('data-disabled-reason="no_meeting_session"');
  });
});

describe("shared screen", () => {
  it("renders the aggregate and names no teacher", () => {
    const html = renderToStaticMarkup(
      <SharedScreenWorkspace processId={processId} summary={summary} />
    );
    expect(html).toContain('data-reparto-route="shared-screen"');
    expect(html).toContain('data-reparto-panel="shared-balance"');
    expect(html).toContain('data-reparto-invariant="group"');
    expect(html).toContain('data-reparto-invariant="teacher"');
    // The room gets the third invariant at readiness granularity and no finer
    // (§20.25): the projected screen is never handed the stored feasibility
    // status, so the slot reports its source as the projection.
    expect(html).toContain('data-reparto-invariant="feasibility"');
    expect(html).toContain('data-reparto-invariant-source="readiness"');
    expect(html).not.toContain('data-reparto-invariant-source="plan"');
    expect(html).toContain('data-reparto-slot="pending-slots"');
    expect(html).toContain('data-reparto-slot="current-turn"');

    // `RBAC-07`: the projected screen carries no participant name, and cannot,
    // because the payload it takes has none to carry.
    expect(html).not.toContain("Ada Lovelace");
    expect(html).not.toContain('data-reparto-slot="authorized-overloads"');
    expect(html).not.toContain('data-reparto-panel="participant-balances"');

    // The three participant-state counts are nameless aggregates, so the room
    // gets them directly from `summary` rather than never at all.
    expect(html).toContain('data-reparto-panel="shared-participants"');
    expect(html).toContain('data-reparto-slot="balanced-participants">2<');
    expect(html).toContain('data-reparto-slot="pending-participants">1<');
    expect(html).toContain('data-reparto-slot="overloaded-participants">1<');
  });

  it("shows the blocked lifecycle state to the room", () => {
    const html = renderToStaticMarkup(
      <SharedScreenWorkspace
        processId={processId}
        summary={{ ...summary, readiness: "recalculation_required" }}
      />
    );
    expect(html).toContain('data-reparto-lifecycle-state="reconciliation_required"');
    expect(html).toContain('data-reparto-selection-blocked="true"');
    expect(html).toContain("An allocation change must be reconciled");
  });

  it("says the plan is stale without blocking, and fails closed with no summary", () => {
    const stale = renderToStaticMarkup(
      <SharedScreenWorkspace processId={processId} summary={{ ...summary, plan_status: "stale" }} />
    );
    expect(stale).toContain('data-reparto-lifecycle-state="stale"');
    expect(stale).toContain('data-reparto-plan-stale="true"');
    expect(stale).toContain("The plan changed after generation");

    const empty = renderToStaticMarkup(<SharedScreenWorkspace processId={processId} />);
    expect(empty).toContain('data-reparto-selection-blocked="true"');
    expect(empty).toContain('data-reparto-lifecycle-state="blocked"');
    expect(empty).toContain('data-reparto-invariant-state="unknown"');
  });

  it("shows an allocation-free plan balance as such, not as zero", () => {
    const html = renderToStaticMarkup(
      <SharedScreenWorkspace
        processId={processId}
        summary={{
          ...summary,
          plan_balance: {
            ...planBalance,
            group: {
              total_group_load: "120.00",
              allocated_group_weekly_hours: null,
              allocation_difference: null,
              is_balanced: false
            }
          }
        }}
      />
    );
    expect(html).toContain("no allocation yet");
  });
});
