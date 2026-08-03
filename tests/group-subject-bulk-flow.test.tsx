// @vitest-environment jsdom
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { en } from "../src/runtime/i18n/en.js";
import { RepartoApiError } from "../src/runtime/errors.js";
import type {
  GroupSubjectBulkPreview,
  SubjectPublic,
  TeachingGroupPublic
} from "../src/runtime/schemas.js";

/**
 * The bulk preview cycle of the group-subject editor (§13.2 "bulk preview").
 *
 * `group-subject-bulk-editor.test.tsx` proves the request builder and the
 * rendered preview table on their own. What is proven here is the sequence the
 * user actually walks: nothing may be applied that was not previewed, the
 * preview must be discarded the moment its inputs change, and a preview the
 * service has outrun (409) must be withdrawn rather than retried.
 */

const processId = "11111111-1111-4111-8111-111111111111";
const subjectId = "22222222-2222-4222-8222-222222222222";
const stageId = "33333333-3333-4333-8333-333333333333";
const groupIds = [
  "44444444-4444-4444-8444-444444444441",
  "44444444-4444-4444-8444-444444444442"
];
const now = "2026-07-30T10:00:00Z";
const dict = en;

const subject: SubjectPublic = {
  id: subjectId,
  assignment_process_id: processId,
  name: "Mathematics",
  allocation_category: "main",
  activity_type: "ordinary",
  default_group_weekly_hours: "4.00",
  default_teacher_weekly_hours_per_position: "4.00",
  default_required_teacher_count: 1,
  allows_multiple_groups: false,
  allows_zero_groups: false,
  notes: null,
  created_at: now,
  updated_at: now
};

const groups: TeachingGroupPublic[] = groupIds.map((id, index) => ({
  id,
  assignment_process_id: processId,
  classroom_stage_id: stageId,
  classroom_stage: {
    id: stageId,
    stage: "secondary",
    min_grade: 1,
    max_grade: 4,
    label: "Secondary",
    created_at: now,
    updated_at: now
  },
  grade: index + 1,
  group_code: "A",
  label: `${index + 1} Secondary A`,
  notes: null,
  created_at: now,
  updated_at: now
}));

function previewFixture(
  overrides: Partial<GroupSubjectBulkPreview> = {}
): GroupSubjectBulkPreview {
  return {
    mode: "create_missing",
    subject_id: subjectId,
    matched_group_ids: groupIds,
    to_create: [
      {
        teaching_group_id: groupIds[0],
        group_subject_id: null,
        group_weekly_hours: "4.00",
        teacher_weekly_hours_per_position: "4.00",
        required_teacher_count: 1
      }
    ],
    to_update: [],
    unchanged: [],
    conflicts: [],
    validation_errors: [],
    expected_affected_count: 1,
    ...overrides
  };
}

const queryState = vi.hoisted(() => ({
  isLoading: false,
  isError: false
}));

const hooks = vi.hoisted(() => ({
  preview: vi.fn(),
  apply: vi.fn(),
  previewPending: false,
  applyPending: false
}));

const toasts = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock("../src/runtime/react/hooks.js", () => ({
  useRepartoSubjects: () => ({
    data: { data: [subject], count: 1 },
    error: null,
    isError: queryState.isError,
    isLoading: queryState.isLoading
  }),
  useRepartoTeachingGroups: () => ({
    data: { data: groups, count: groups.length },
    error: null,
    isError: queryState.isError,
    isLoading: queryState.isLoading
  }),
  usePreviewRepartoGroupSubjects: () => ({
    isPending: hooks.previewPending,
    mutate: hooks.preview
  }),
  useApplyRepartoGroupSubjects: () => ({
    isPending: hooks.applyPending,
    mutate: hooks.apply
  })
}));

vi.mock("../src/runtime/react/ui/toast-notification.js", () => ({
  repartoToast: toasts,
  RepartoToastHost: () => null
}));

function field(name: string) {
  const element = document.querySelector(`[data-reparto-field="${name}"]`);
  if (element === null) throw new Error(`no field ${name}`);
  return element;
}

function action(name: string): HTMLButtonElement {
  const element = document.querySelector(`[data-reparto-action="${name}"]`);
  if (element === null) throw new Error(`no action ${name}`);
  return element as HTMLButtonElement;
}

async function renderEditor(onApplied = vi.fn()) {
  const { GroupSubjectBulkEditor } = await import(
    "../src/runtime/react/default-ui/process-crud/group-subjects/bulk.js"
  );
  render(
    <GroupSubjectBulkEditor
      locale="en"
      onApplied={onApplied}
      processId={processId}
    />
  );
  return onApplied;
}

/** Fill the minimum valid form and take a preview that the service accepts. */
function takePreview(result = previewFixture()) {
  fireEvent.change(field("group-subject-subject"), {
    target: { value: subjectId }
  });
  fireEvent.click(action("group-subject-preview"));
  const onSuccess = hooks.preview.mock.calls.at(-1)![1].onSuccess;
  onSuccess(result);
}

beforeEach(() => {
  queryState.isLoading = false;
  queryState.isError = false;
  hooks.previewPending = false;
  hooks.applyPending = false;
  vi.clearAllMocks();
});

afterEach(cleanup);

describe("group-subject bulk preview cycle", () => {
  it("cannot apply anything that has not been previewed", async () => {
    await renderEditor();

    expect(action("group-subject-apply").disabled).toBe(true);
    fireEvent.change(field("group-subject-subject"), {
      target: { value: subjectId }
    });
    // Choosing a subject is not a preview: the affected count is the service's
    // to state, not the form's to guess.
    expect(action("group-subject-apply").disabled).toBe(true);
    expect(hooks.apply).not.toHaveBeenCalled();
  });

  it("enables apply once the service returns an actionable preview", async () => {
    await renderEditor();
    takePreview();

    await waitFor(() => {
      expect(action("group-subject-apply").disabled).toBe(false);
    });
    expect(
      document.querySelector('[data-reparto-table="group-subject-bulk-preview"]')
    ).not.toBeNull();
  });

  it("keeps apply disabled for a preview that changes nothing", async () => {
    await renderEditor();
    takePreview(
      previewFixture({ to_create: [], expected_affected_count: 0 })
    );

    await waitFor(() => {
      expect(action("group-subject-apply").disabled).toBe(true);
    });
  });

  it("keeps apply disabled while the preview carries validation errors", async () => {
    await renderEditor();
    takePreview(
      previewFixture({
        validation_errors: ["Group 1 Secondary A has no allocation"]
      })
    );

    await waitFor(() => {
      expect(action("group-subject-apply").disabled).toBe(true);
    });
    expect(document.body.textContent).toContain(
      "Group 1 Secondary A has no allocation"
    );
  });

  it.each([
    ["group-subject-stage", "secondary"],
    ["group-subject-minimum-grade", "2"],
    ["group-subject-maximum-grade", "3"],
    ["group-subject-group-hours", "5"],
    ["group-subject-teacher-hours", "5"],
    ["group-subject-teacher-count", "2"],
    ["group-subject-mode", "upsert"]
  ])("discards the preview when %s changes", async (name, value) => {
    await renderEditor();
    takePreview();
    await waitFor(() => {
      expect(action("group-subject-apply").disabled).toBe(false);
    });

    fireEvent.change(field(name), { target: { value } });

    // A preview describes one exact filter; editing the filter makes it a
    // description of something else.
    await waitFor(() => {
      expect(action("group-subject-apply").disabled).toBe(true);
    });
    expect(
      document.querySelector('[data-reparto-table="group-subject-bulk-preview"]')
    ).toBeNull();
  });

  it("requires the confirmation before the apply mutation runs", async () => {
    await renderEditor();
    takePreview();
    await waitFor(() => {
      expect(action("group-subject-apply").disabled).toBe(false);
    });

    fireEvent.click(action("group-subject-apply"));
    // Opening the confirmation is not applying.
    expect(hooks.apply).not.toHaveBeenCalled();
    expect(
      document.querySelector('[data-reparto-dialog="group-subject-bulk-confirmation"]')
    ).not.toBeNull();

    fireEvent.click(action("confirm-group-subject-bulk"));
    expect(hooks.apply).toHaveBeenCalledTimes(1);
  });

  it("sends the previewed request together with its exact affected count", async () => {
    await renderEditor();
    takePreview(previewFixture({ expected_affected_count: 7 }));
    await waitFor(() => {
      expect(action("group-subject-apply").disabled).toBe(false);
    });
    fireEvent.click(action("group-subject-apply"));
    fireEvent.click(action("confirm-group-subject-bulk"));

    const sent = hooks.apply.mock.calls[0][0];
    expect(sent.processId).toBe(processId);
    // The count is the service's own from the preview, so the apply is refused
    // outright if the world moved between the two calls.
    expect(sent.body.expected_affected_count).toBe(7);
    expect(sent.body.subject_id).toBe(subjectId);
    expect(sent.body.mode).toBe("create_missing");
  });

  it("reports the applied counts and clears the preview", async () => {
    const onApplied = await renderEditor();
    takePreview();
    await waitFor(() => {
      expect(action("group-subject-apply").disabled).toBe(false);
    });
    fireEvent.click(action("group-subject-apply"));
    fireEvent.click(action("confirm-group-subject-bulk"));

    hooks.apply.mock.calls[0][1].onSuccess({
      created_count: 3,
      updated_count: 1
    });

    await waitFor(() => {
      expect(
        document.querySelector("[data-group-subject-bulk-result]")?.textContent
      ).toContain("3");
    });
    expect(toasts.success).toHaveBeenCalledTimes(1);
    expect(onApplied).toHaveBeenCalledTimes(1);
    // The applied preview is spent; re-applying it would double the change.
    expect(action("group-subject-apply").disabled).toBe(true);
  });

  it("withdraws a preview the service has outrun", async () => {
    await renderEditor();
    takePreview();
    await waitFor(() => {
      expect(action("group-subject-apply").disabled).toBe(false);
    });
    fireEvent.click(action("group-subject-apply"));
    fireEvent.click(action("confirm-group-subject-bulk"));

    hooks.apply.mock.calls[0][1].onError(
      new RepartoApiError(409, "The affected group set changed.")
    );

    await waitFor(() => {
      expect(document.querySelector("[data-group-subject-bulk-stale]")).not.toBeNull();
    });
    expect(document.body.textContent).toContain(dict.groupSubjectBulk.stale);
    // Withdrawn, not retryable: the user must preview again.
    expect(action("group-subject-apply").disabled).toBe(true);
    expect(
      document.querySelector('[data-reparto-table="group-subject-bulk-preview"]')
    ).toBeNull();
    expect(toasts.error).toHaveBeenCalledWith(
      dict.groupSubjectBulk.stale,
      "The affected group set changed."
    );
  });

  it("keeps a still-valid preview when the apply fails for another reason", async () => {
    await renderEditor();
    takePreview();
    await waitFor(() => {
      expect(action("group-subject-apply").disabled).toBe(false);
    });
    fireEvent.click(action("group-subject-apply"));
    fireEvent.click(action("confirm-group-subject-bulk"));

    hooks.apply.mock.calls[0][1].onError(
      new RepartoApiError(500, "Upstream unavailable.")
    );

    await waitFor(() => {
      expect(toasts.error).toHaveBeenCalledWith(
        dict.groupSubjectBulk.applyError,
        "Upstream unavailable."
      );
    });
    expect(document.querySelector("[data-group-subject-bulk-stale]")).toBeNull();
    // The preview still describes the world, so the user may simply retry.
    expect(action("group-subject-apply").disabled).toBe(false);
  });

  it("drops a preview the service refused", async () => {
    await renderEditor();
    fireEvent.change(field("group-subject-subject"), {
      target: { value: subjectId }
    });
    fireEvent.click(action("group-subject-preview"));
    hooks.preview.mock.calls[0][1].onError(
      new RepartoApiError(422, "Unknown subject.")
    );

    await waitFor(() => {
      expect(toasts.error).toHaveBeenCalledWith(
        dict.groupSubjectBulk.previewError,
        "Unknown subject."
      );
    });
    expect(action("group-subject-apply").disabled).toBe(true);
  });

  it("never previews a form the builder rejects", async () => {
    await renderEditor();
    // No subject chosen at all.
    fireEvent.click(action("group-subject-preview"));

    expect(hooks.preview).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(document.body.textContent).toContain(dict.error.required);
    });
  });

  it("suspends both actions while the queries are still loading", async () => {
    queryState.isLoading = true;
    await renderEditor();

    expect(document.querySelector('[data-reparto-state="loading"]')).not.toBeNull();
    expect(action("group-subject-preview").disabled).toBe(true);
  });

  it("suspends both actions when the queries failed", async () => {
    queryState.isError = true;
    await renderEditor();

    expect(document.querySelector('[data-reparto-state="error"]')).not.toBeNull();
    expect(action("group-subject-preview").disabled).toBe(true);
  });

  it("cancels the confirmation without applying", async () => {
    await renderEditor();
    takePreview();
    await waitFor(() => {
      expect(action("group-subject-apply").disabled).toBe(false);
    });
    fireEvent.click(action("group-subject-apply"));
    fireEvent.click(action("cancel"));

    expect(hooks.apply).not.toHaveBeenCalled();
    expect(
      document.querySelector('[data-reparto-dialog="group-subject-bulk-confirmation"]')
    ).toBeNull();
    // Cancelling the confirmation does not throw the preview away.
    expect(action("group-subject-apply").disabled).toBe(false);
  });
});
