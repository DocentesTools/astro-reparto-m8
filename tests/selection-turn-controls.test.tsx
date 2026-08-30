// @vitest-environment jsdom
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  repartoUser,
  resetRepartoAuthAdapter,
  signInReparto
} from "./support/session.js";
import { getRepartoDictionary } from "../src/runtime/i18n/index.js";
import { RepartoApiError } from "../src/runtime/errors.js";
import { MeetingControlWorkspace } from "../src/runtime/react/MeetingWorkspace.js";
import { TeacherLanWorkspace } from "../src/runtime/react/LanWorkspace.js";
import type {
  HourRequirementPublic,
  MeetingSessionPublic,
  ProcessSummary,
  TeacherLanSummary
} from "../src/runtime/schemas.js";

/**
 * The five turn controls and the teacher's two, bound (`W1.1`).
 *
 * `meeting-control.test.tsx` proves what the controls are *offered*, which is
 * the state helper's job. What only a rendered, clicked control can prove is
 * the part that was missing: that pressing one reaches the caller at all, with
 * the action it names and the reason typed beside it; that the audited actions
 * stay shut until that reason exists; that every `data-disabled-reason` is
 * legible to the head rather than only to a selector; and that a refusal is
 * shown rather than swallowed into a silent no-op.
 */

const processId = "11111111-1111-4111-8111-111111111111";
const planId = "22222222-2222-4222-8222-222222222222";
const ownTeacherId = "33333333-3333-4333-8333-333333333333";
const sessionId = "44444444-4444-4444-8444-444444444444";
const turnId = "55555555-5555-4555-8555-555555555555";
const slotId = "66666666-6666-4666-8666-666666666666";
const activityId = "77777777-7777-4777-8777-777777777777";
const now = "2026-08-02T10:00:00Z";

const dict = getRepartoDictionary("en");

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
    total_teacher_load: "120.00",
    participant_target_total: "120.00",
    teacher_load_difference: "0.00",
    is_balanced: true
  },
  is_exact: true
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
  overloaded_participant_count: 0,
  current_turn: {
    meeting_session_id: sessionId,
    selection_turn_id: turnId,
    process_teacher_id: ownTeacherId,
    position: 2,
    status: "active",
    started_at: now
  },
  blocking_validation_count: 0
};

const meetingSession: MeetingSessionPublic = {
  id: sessionId,
  assignment_process_id: processId,
  status: "open",
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
};

const requirement: HourRequirementPublic = {
  id: slotId,
  assignment_process_id: processId,
  teaching_activity_id: activityId,
  position_index: 0,
  required_teacher_hours: "6.00",
  status: "available",
  created_generation: 1,
  last_validated_generation: 1,
  retired_generation: null,
  superseded_by_requirement_id: null,
  created_at: now,
  updated_at: now
};

const teacherSummary: TeacherLanSummary = {
  process_id: processId,
  teacher_profile_id: "88888888-8888-4888-8888-888888888888",
  process_teacher_id: ownTeacherId,
  generated_at: now,
  readiness: "ready",
  selection_blocked: false,
  plan_balance: planBalance,
  participant: {
    process_teacher_id: ownTeacherId,
    teacher_profile_id: "88888888-8888-4888-8888-888888888888",
    display_name: "Ada Lovelace",
    base_weekly_hours: "18.00",
    extra_weekly_hours: "0.00",
    target_weekly_hours: "18.00",
    assigned_weekly_hours: "0.00",
    remaining_weekly_hours: "18.00",
    is_overloaded: false,
    assignment_count: 0,
    state: "pending"
  },
  available_slots: 1,
  current_turn: summary.current_turn
};

function control(container: HTMLElement, action: string): HTMLButtonElement {
  const button = container.querySelector<HTMLButtonElement>(
    `button[data-reparto-action="${action}"]`
  );
  if (!button) throw new Error(`no control for ${action}`);
  return button;
}

afterEach(() => {
  cleanup();
  resetRepartoAuthAdapter();
});

describe("meeting turn controls", () => {
  beforeEach(() => {
    signInReparto(repartoUser("admin"));
  });

  it("sends every open control to the bound action", () => {
    const onAction = vi.fn();
    const { container } = render(
      <MeetingControlWorkspace
        processId={processId}
        sessionControls={{ onClose: () => {}, onOpen: () => {}, session: meetingSession }}
        summary={summary}
        turnControls={{ onAction }}
      />
    );

    fireEvent.click(control(container, "start-turn"));
    fireEvent.click(control(container, "complete-turn"));

    expect(onAction.mock.calls).toEqual([
      ["start-turn", { reason: "" }],
      ["complete-turn", { reason: "" }]
    ]);
  });

  it("keeps the audited controls shut until a reason is given", () => {
    const onAction = vi.fn();
    const { container } = render(
      <MeetingControlWorkspace
        processId={processId}
        sessionControls={{ onClose: () => {}, onOpen: () => {}, session: meetingSession }}
        summary={summary}
        turnControls={{ onAction }}
      />
    );

    // Skipping and overriding a colleague's turn are audited, so neither is
    // offered before the reason exists — refused after the press is exactly
    // what the state helper exists to prevent.
    expect(control(container, "skip-turn").disabled).toBe(true);
    expect(control(container, "skip-turn").dataset.disabledReason).toBe(
      "reason_required"
    );
    expect(container.textContent).toContain(
      dict.meeting.actionDisabled.reason_required
    );

    fireEvent.change(
      container.querySelector('input[data-reparto-field="turn-reason"]')!,
      { target: { value: "  Absent from the room  " } }
    );

    expect(control(container, "skip-turn").disabled).toBe(false);
    fireEvent.click(control(container, "override-turn"));
    expect(onAction).toHaveBeenCalledWith("override-turn", {
      reason: "Absent from the room"
    });
  });

  it("says out loud why a control is closed, and does not crash unwired", () => {
    const { container } = render(
      <MeetingControlWorkspace processId={processId} />
    );

    // Every reason the state helper can produce is now a sentence beside the
    // button, not only an attribute a selector can read.
    expect(container.textContent).toContain(
      dict.meeting.actionDisabled.no_process_data
    );
    expect(
      container.querySelectorAll('[data-reparto-slot="turn-disabled-hint"]')
    ).toHaveLength(5);

    // An unwired room is the state this replaces; it must stay inert, not throw.
    const initialize = control(container, "initialize-turns");
    initialize.disabled = false;
    expect(() => fireEvent.click(initialize)).not.toThrow();
  });

  it("shows the refusal and waits out the request in flight", () => {
    const { container } = render(
      <MeetingControlWorkspace
        processId={processId}
        summary={summary}
        turnControls={{
          error: new RepartoApiError(409, "The turn has already been completed."),
          onAction: vi.fn(),
          pendingAction: "complete-turn"
        }}
      />
    );

    expect(
      container.querySelector('[data-reparto-slot="turn-error"]')?.textContent
    ).toBe("The turn has already been completed.");
    expect(control(container, "complete-turn").dataset.repartoPending).toBe("true");
    // One request at a time: a second press mid-flight is a second turn action.
    expect(control(container, "start-turn").disabled).toBe(true);
  });
});

describe("meeting session panel", () => {
  beforeEach(() => {
    signInReparto(repartoUser("admin"));
  });

  it("offers Open with no session and reaches the bound action", () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();
    const { container } = render(
      <MeetingControlWorkspace
        processId={processId}
        sessionControls={{ onClose, onOpen, session: null }}
        summary={summary}
      />
    );

    expect(
      container.querySelector('[data-reparto-slot="session-status"]')?.textContent
    ).toBe(dict.meeting.session.none);
    expect(control(container, "close-session").disabled).toBe(true);

    fireEvent.click(control(container, "open-session"));
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("shuts Open and asks for confirmation before closing an open session", () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();
    const { container } = render(
      <MeetingControlWorkspace
        processId={processId}
        sessionControls={{ onClose, onOpen, session: meetingSession }}
        summary={summary}
      />
    );

    expect(
      container.querySelector('[data-reparto-slot="session-status"]')?.textContent
    ).toBe(dict.entity.meetingSession.status.open);
    expect(control(container, "open-session").disabled).toBe(true);
    expect(
      container.querySelector('[data-reparto-dialog="close-session-confirmation"]')
    ).toBeNull();

    // The close press itself never reaches the caller — it only opens the
    // confirmation, the same "ask first" rule a delete or a final export uses.
    fireEvent.click(control(container, "close-session"));
    expect(onClose).not.toHaveBeenCalled();
    expect(
      container.querySelector('[data-reparto-dialog="close-session-confirmation"]')
    ).not.toBeNull();

    fireEvent.click(control(container, "cancel"));
    expect(onClose).not.toHaveBeenCalled();
    expect(
      container.querySelector('[data-reparto-dialog="close-session-confirmation"]')
    ).toBeNull();

    fireEvent.click(control(container, "close-session"));
    fireEvent.click(control(container, "confirm-close-session"));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("shows the refusal and does not crash unwired", () => {
    const { container } = render(
      <MeetingControlWorkspace
        processId={processId}
        sessionControls={{
          error: new RepartoApiError(400, "An active meeting session already exists for this process."),
          onClose: vi.fn(),
          onOpen: vi.fn(),
          pendingAction: "open",
          session: null
        }}
        summary={summary}
      />
    );

    expect(
      container.querySelector('[data-reparto-slot="session-error"]')?.textContent
    ).toBe("An active meeting session already exists for this process.");
    expect(control(container, "open-session").disabled).toBe(true);

    // An unwired panel is the state this replaces; it must stay inert.
    const { container: unwired } = render(
      <MeetingControlWorkspace processId={processId} summary={summary} />
    );
    expect(() => fireEvent.click(control(unwired, "open-session"))).not.toThrow();
  });
});

describe("teacher choice controls", () => {
  beforeEach(() => {
    signInReparto(repartoUser("writer"));
  });

  it("picks a position, takes it, and passes the turn with a reason", () => {
    const onChoose = vi.fn();
    const onPassTurn = vi.fn();
    const onSelectSlot = vi.fn();
    const { container, rerender } = render(
      <TeacherLanWorkspace
        choiceControls={{ onChoose, onPassTurn, onSelectSlot }}
        meetingSession={meetingSession}
        processId={processId}
        requirements={[requirement]}
        summary={teacherSummary}
      />
    );

    // The list was read-only, so *Take this position* sat above a selection
    // nothing could make.
    fireEvent.click(control(container, "select-slot"));
    expect(onSelectSlot).toHaveBeenCalledWith(slotId);
    expect(control(container, "direct-choice").disabled).toBe(true);

    rerender(
      <TeacherLanWorkspace
        choiceControls={{ onChoose, onPassTurn, onSelectSlot }}
        meetingSession={meetingSession}
        processId={processId}
        requirements={[requirement]}
        selectedSlotId={slotId}
        summary={teacherSummary}
      />
    );

    fireEvent.click(control(container, "direct-choice"));
    expect(onChoose).toHaveBeenCalledWith({ slotId });

    fireEvent.change(
      container.querySelector('input[data-reparto-field="pass-reason"]')!,
      { target: { value: "Taking nothing this round" } }
    );
    fireEvent.click(control(container, "pass-turn"));
    expect(onPassTurn).toHaveBeenCalledWith({
      reason: "Taking nothing this round"
    });
  });

  it("records the default reason rather than closing the teacher's own turn", () => {
    const onPassTurn = vi.fn();
    const { container } = render(
      <TeacherLanWorkspace
        choiceControls={{ onChoose: vi.fn(), onPassTurn }}
        meetingSession={meetingSession}
        processId={processId}
        requirements={[requirement]}
        summary={teacherSummary}
      />
    );

    // The service audits every skip and refuses a blank reason, but the turn is
    // theirs: the control stays open and the default is what gets recorded.
    expect(control(container, "pass-turn").disabled).toBe(false);
    fireEvent.click(control(container, "pass-turn"));
    expect(onPassTurn).toHaveBeenCalledWith({
      reason: dict.view.choice.passReasonDefault
    });
  });

  it("leaves the list read-only when the host binds no selection", () => {
    const { container } = render(
      <TeacherLanWorkspace
        meetingSession={meetingSession}
        processId={processId}
        requirements={[requirement]}
        summary={teacherSummary}
      />
    );

    expect(
      container.querySelector('button[data-reparto-action="select-slot"]')
    ).toBeNull();
    expect(() => fireEvent.click(control(container, "pass-turn"))).not.toThrow();
  });
});
