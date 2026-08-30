// @vitest-environment jsdom
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getRepartoDictionary } from "../src/runtime/i18n/index.js";
import { RepartoApiError } from "../src/runtime/errors.js";
import {
  repartoUser,
  resetRepartoAuthAdapter,
  signInReparto
} from "./support/session.js";

/**
 * The connected OUT_OF_SYNC panel (§20.20 "OUT_OF_SYNC activity state and
 * role-safe SSE handling").
 *
 * `activity-sync.test.tsx` proves the state helpers and the pure view. What is
 * proven here is the wiring the contract actually depends on: an apply is only
 * ever driven by a preview and always echoes that preview's fingerprint, and a
 * 409 drops the preview so the head must look again rather than retrying a
 * decision the service has already refused.
 */

const processId = "11111111-1111-4111-8111-111111111111";
const planId = "22222222-2222-4222-8222-222222222222";
const subjectId = "33333333-3333-4333-8333-333333333333";
const groupId = "44444444-4444-4444-8444-444444444444";
const cellId = "55555555-5555-4555-8555-555555555555";
const activityId = "66666666-6666-4666-8666-666666666666";
const now = "2026-08-04T10:00:00Z";
const fingerprint = "b".repeat(64);
const dict = getRepartoDictionary("en");

const activityBody = {
  id: activityId,
  teaching_plan_id: planId,
  subject_id: subjectId,
  allocation_category: "main",
  activity_type: "ordinary",
  group_weekly_hours_per_group: "3.00",
  teacher_weekly_hours_per_position: "3.00",
  required_teacher_count: 1,
  notes: null,
  source: "main_generated",
  source_group_subject_id: cellId,
  sync_state: "out_of_sync",
  retired_at: null,
  group_subject_ids: [cellId],
  linked_group_count: 1,
  created_at: now,
  updated_at: now
};

const subjectBody = {
  id: subjectId,
  assignment_process_id: processId,
  name: "Mathematics",
  allocation_category: "main",
  activity_type: "ordinary",
  default_group_weekly_hours: "3.00",
  default_teacher_weekly_hours_per_position: "3.00",
  default_required_teacher_count: 1,
  allows_multiple_groups: false,
  allows_zero_groups: false,
  notes: null,
  created_at: now,
  updated_at: now
};

const groupBody = {
  id: groupId,
  assignment_process_id: processId,
  classroom_stage_id: "77777777-7777-4777-8777-777777777777",
  classroom_stage: {
    id: "77777777-7777-4777-8777-777777777777",
    stage: "Secondary",
    min_grade: 1,
    max_grade: 4,
    label: "Secondary",
    created_at: now,
    updated_at: now
  },
  grade: 1,
  group_code: "1A",
  label: "1A",
  notes: null,
  created_at: now,
  updated_at: now
};

const cellBody = {
  id: cellId,
  assignment_process_id: processId,
  teaching_group_id: groupId,
  subject_id: subjectId,
  group_weekly_hours: "4.00",
  teacher_weekly_hours_per_position: "4.00",
  required_teacher_count: 2,
  active: true,
  notes: null,
  created_at: now,
  updated_at: now
};

const previewBody = {
  group_subject_id: cellId,
  teaching_activity_id: activityId,
  sync_state: "out_of_sync" as const,
  source_active: true,
  source_values: {
    group_weekly_hours_per_group: "4.00",
    teacher_weekly_hours_per_position: "4.00",
    required_teacher_count: 2
  },
  current_values: {
    group_weekly_hours_per_group: "3.00",
    teacher_weekly_hours_per_position: "3.00",
    required_teacher_count: 1
  },
  differences: [
    {
      field: "group_weekly_hours_per_group" as const,
      current_value: "3.00",
      source_value: "4.00"
    }
  ],
  assignment_impact: {
    active_assignment_count: 0,
    affected_assignment_count: 0,
    affected_requirement_ids: [],
    requires_reconciliation: false
  },
  retirement_required: false,
  is_noop: false,
  preview_fingerprint: fingerprint
};

const state = vi.hoisted(() => ({
  activities: null as unknown,
  activitiesLoading: false,
  activitiesError: null as unknown,
  previewPending: false,
  applyPending: false
}));

const hooks = vi.hoisted(() => ({
  preview: vi.fn(),
  apply: vi.fn()
}));

const toasts = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock("../src/runtime/react/hooks.js", () => ({
  useRepartoTeachingActivities: () => ({
    data: state.activities ?? undefined,
    error: state.activitiesError,
    isError: state.activitiesError !== null,
    isLoading: state.activitiesLoading
  }),
  useRepartoGroupSubjects: () => ({
    data: { data: [cellBody], count: 1 },
    error: null,
    isLoading: false
  }),
  useRepartoSubjects: () => ({
    data: { data: [subjectBody], count: 1 },
    error: null,
    isLoading: false
  }),
  useRepartoTeachingGroups: () => ({
    data: { data: [groupBody], count: 1 },
    error: null,
    isLoading: false
  }),
  usePreviewRepartoActivitySync: () => ({
    mutate: hooks.preview,
    isPending: state.previewPending
  }),
  useApplyRepartoActivitySync: () => ({
    mutate: hooks.apply,
    isPending: state.applyPending
  })
}));

vi.mock("../src/runtime/react/ui/toast-notification.js", () => ({
  repartoToast: toasts,
  RepartoToastHost: () => null
}));

function action(name: string): HTMLButtonElement | null {
  return document.querySelector(`[data-reparto-action="${name}"]`);
}

async function renderPanel() {
  const { MainActivitySyncPanel } = await import(
    "../src/runtime/react/default-ui/planning/activity-sync.js"
  );
  return render(<MainActivitySyncPanel locale="en" processId={processId} />);
}

beforeEach(() => {
  // The panel owns its own `admin` write floor now, so every case below has to
  // say who is looking at it. `planning-panel-gates.test.tsx` proves the floor.
  signInReparto(repartoUser("admin"));
  state.activities = { data: [activityBody], count: 1 };
  state.activitiesLoading = false;
  state.activitiesError = null;
  state.previewPending = false;
  state.applyPending = false;
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
  resetRepartoAuthAdapter();
});

describe("connected out-of-sync activity panel", () => {
  it("previews the selected cell and applies its exact fingerprint", async () => {
    hooks.preview.mockImplementation((_vars, options) => {
      options?.onSuccess?.(previewBody);
    });
    hooks.apply.mockImplementation((_vars, options) => {
      options?.onSuccess?.({
        activity: { ...activityBody, sync_state: "in_sync" },
        applied_differences: previewBody.differences,
        assignment_impact: previewBody.assignment_impact,
        teaching_plan_status: "draft",
        was_noop: false
      });
    });
    await renderPanel();

    fireEvent.click(action("review-activity-sync") as HTMLButtonElement);

    expect(hooks.preview).toHaveBeenCalledWith(
      { processId, groupSubjectId: cellId },
      expect.anything()
    );
    await waitFor(() =>
      expect(
        document.querySelector('[data-reparto-dialog="activity-sync-preview"]')
      ).not.toBeNull()
    );

    fireEvent.click(action("apply-activity-sync") as HTMLButtonElement);

    expect(hooks.apply).toHaveBeenCalledWith(
      {
        processId,
        groupSubjectId: cellId,
        body: { expected_preview_fingerprint: fingerprint }
      },
      expect.anything()
    );
    expect(toasts.success).toHaveBeenCalled();
    // The applied preview is closed: the next apply needs a fresh one.
    await waitFor(() =>
      expect(
        document.querySelector('[data-reparto-dialog="activity-sync-preview"]')
      ).toBeNull()
    );
  });

  it("drops the preview on the service's staleness conflict", async () => {
    hooks.preview.mockImplementation((_vars, options) => {
      options?.onSuccess?.(previewBody);
    });
    hooks.apply.mockImplementation((_vars, options) => {
      options?.onError?.(
        new RepartoApiError(409, "The sync inputs changed since preview.")
      );
    });
    await renderPanel();
    fireEvent.click(action("review-activity-sync") as HTMLButtonElement);
    await waitFor(() => expect(action("apply-activity-sync")).not.toBeNull());

    fireEvent.click(action("apply-activity-sync") as HTMLButtonElement);

    expect(toasts.error).toHaveBeenCalledWith(
      dict.planning.sync.staleError,
      expect.any(String)
    );
    await waitFor(() =>
      expect(
        document.querySelector('[data-reparto-dialog="activity-sync-preview"]')
      ).toBeNull()
    );
  });

  it("reports a non-conflict apply failure without dropping the preview", async () => {
    hooks.preview.mockImplementation((_vars, options) => {
      options?.onSuccess?.(previewBody);
    });
    hooks.apply.mockImplementation((_vars, options) => {
      options?.onError?.(new RepartoApiError(500, "boom"));
    });
    await renderPanel();
    fireEvent.click(action("review-activity-sync") as HTMLButtonElement);
    await waitFor(() => expect(action("apply-activity-sync")).not.toBeNull());

    fireEvent.click(action("apply-activity-sync") as HTMLButtonElement);

    expect(toasts.error).toHaveBeenCalledWith(
      dict.planning.sync.applyError,
      expect.any(String)
    );
    expect(
      document.querySelector('[data-reparto-dialog="activity-sync-preview"]')
    ).not.toBeNull();
  });

  it("closes the panel when the preview itself fails", async () => {
    hooks.preview.mockImplementation((_vars, options) => {
      options?.onError?.(new RepartoApiError(409, "No live main activity."));
    });
    await renderPanel();

    fireEvent.click(action("review-activity-sync") as HTMLButtonElement);

    expect(toasts.error).toHaveBeenCalledWith(
      dict.planning.sync.previewError,
      expect.any(String)
    );
    expect(
      document.querySelector('[data-reparto-dialog="activity-sync-preview"]')
    ).toBeNull();
  });

  it("cancels a preview without applying anything", async () => {
    hooks.preview.mockImplementation((_vars, options) => {
      options?.onSuccess?.(previewBody);
    });
    await renderPanel();
    fireEvent.click(action("review-activity-sync") as HTMLButtonElement);
    await waitFor(() => expect(action("apply-activity-sync")).not.toBeNull());

    fireEvent.click(action("cancel") as HTMLButtonElement);

    expect(hooks.apply).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(
        document.querySelector('[data-reparto-dialog="activity-sync-preview"]')
      ).toBeNull()
    );
  });

  it("guards a double fire while a request is in flight", async () => {
    state.previewPending = true;
    await renderPanel();
    expect((action("review-activity-sync") as HTMLButtonElement).disabled).toBe(
      true
    );

    cleanup();
    state.previewPending = false;
    hooks.preview.mockImplementation((_vars, options) => {
      options?.onSuccess?.(previewBody);
    });
    await renderPanel();
    fireEvent.click(action("review-activity-sync") as HTMLButtonElement);
    await waitFor(() => expect(action("apply-activity-sync")).not.toBeNull());
    cleanup();

    // A pending apply keeps the confirmed action from firing twice.
    state.applyPending = true;
    await renderPanel();
    expect((action("review-activity-sync") as HTMLButtonElement).disabled).toBe(
      true
    );
  });

  it("shows the loading and error states of the planning queries", async () => {
    state.activities = null;
    state.activitiesLoading = true;
    await renderPanel();
    expect(
      document.querySelector('[data-reparto-state="loading"]')?.textContent
    ).toBe(dict.planning.sync.loading);

    cleanup();
    state.activitiesLoading = false;
    state.activitiesError = new Error("activities are down");
    await renderPanel();
    expect(
      document.querySelector('[data-reparto-state="error"]')?.textContent
    ).toContain("activities are down");
  });

  it("says nothing has drifted when every activity is in sync", async () => {
    state.activities = {
      data: [{ ...activityBody, sync_state: "in_sync" }],
      count: 1
    };
    await renderPanel();

    expect(
      document.querySelector("[data-activity-sync-empty]")?.textContent
    ).toBe(dict.planning.sync.empty);
    expect(action("review-activity-sync")).toBeNull();
  });
});
