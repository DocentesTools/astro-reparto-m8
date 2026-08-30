import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { EMPTY_REPARTO_MAPPED_ERROR } from "../src/runtime/errorMapping.js";
import { RepartoApiError } from "../src/runtime/errors.js";
import { en } from "../src/runtime/i18n/en.js";
import type {
  GroupSubjectBulkPreview,
  SubjectPublic,
  TeachingGroupPublic
} from "../src/runtime/schemas.js";

const processId = "11111111-1111-4111-8111-111111111111";
const subjectId = "22222222-2222-4222-8222-222222222222";
const stageId = "33333333-3333-4333-8333-333333333333";
const groupIds = [
  "44444444-4444-4444-8444-444444444441",
  "44444444-4444-4444-8444-444444444442",
  "44444444-4444-4444-8444-444444444443",
  "44444444-4444-4444-8444-444444444444"
];
const now = "2026-07-30T10:00:00Z";

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

const preview: GroupSubjectBulkPreview = {
  mode: "upsert",
  subject_id: subjectId,
  matched_group_ids: groupIds,
  to_create: [
    {
      teaching_group_id: groupIds[0],
      group_subject_id: null,
      group_weekly_hours: null,
      teacher_weekly_hours_per_position: "0.00",
      required_teacher_count: 1
    }
  ],
  to_update: [
    {
      teaching_group_id: groupIds[1],
      group_subject_id: "55555555-5555-4555-8555-555555555551",
      group_weekly_hours: "3.50",
      teacher_weekly_hours_per_position: "3.50",
      required_teacher_count: 2
    }
  ],
  unchanged: [
    {
      teaching_group_id: groupIds[2],
      group_subject_id: "55555555-5555-4555-8555-555555555552",
      group_weekly_hours: "4.00",
      teacher_weekly_hours_per_position: "4.00",
      required_teacher_count: 1
    }
  ],
  conflicts: [
    {
      teaching_group_id: groupIds[3],
      reason: "No existing row"
    }
  ],
  validation_errors: [],
  expected_affected_count: 2
};

const hookMocks = vi.hoisted(() => ({
  preview: vi.fn(),
  apply: vi.fn()
}));

vi.mock("../src/runtime/react/hooks.js", () => ({
  useRepartoSubjects: () => ({
    data: { data: [subject], count: 1 },
    error: null,
    isError: false,
    isLoading: false
  }),
  useRepartoTeachingGroups: () => ({
    data: { data: groups, count: groups.length },
    error: null,
    isError: false,
    isLoading: false
  }),
  usePreviewRepartoGroupSubjects: () => ({
    isPending: false,
    mutate: hookMocks.preview
  }),
  useApplyRepartoGroupSubjects: () => ({
    isPending: false,
    mutate: hookMocks.apply
  })
}));

describe("group-subject bulk editor", () => {
  it("builds filters and preserves blank-versus-zero hour semantics", async () => {
    const { buildGroupSubjectBulkRequest } = await import(
      "../src/runtime/react/default-ui/process-crud/group-subjects/bulk.js"
    );

    expect(
      buildGroupSubjectBulkRequest(
        {
          subjectId,
          mode: "upsert",
          stage: " secondary ",
          minimumGrade: "1",
          maximumGrade: "4",
          groupHours: "",
          teacherHours: "0",
          teacherCount: ""
        },
        en
      )
    ).toEqual({
      ok: true,
      request: {
        subject_id: subjectId,
        mode: "upsert",
        stage: "secondary",
        minimum_grade: 1,
        maximum_grade: 4,
        group_weekly_hours: null,
        teacher_weekly_hours_per_position: "0.00",
        required_teacher_count: 1
      }
    });
  });

  it("rejects invalid filters, hour fields, teacher counts, and inverted ranges", async () => {
    const { buildGroupSubjectBulkRequest } = await import(
      "../src/runtime/react/default-ui/process-crud/group-subjects/bulk.js"
    );

    const invalid = buildGroupSubjectBulkRequest(
      {
        subjectId: "",
        mode: "create_missing",
        stage: "",
        minimumGrade: "first",
        maximumGrade: "0",
        groupHours: "2.345",
        teacherHours: "-1",
        teacherCount: "1.5"
      },
      en
    );
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) {
      expect(invalid.errors).toMatchObject({
        subject: en.error.required,
        minimumGrade: en.groupSubjectBulk.gradeError,
        maximumGrade: en.groupSubjectBulk.gradeError,
        groupHours: en.groupSubjectBulk.hoursError.too_many_decimals,
        teacherHours: en.groupSubjectBulk.hoursError.negative,
        teacherCount: en.groupSubjectBulk.teacherCountError
      });
    }

    const inverted = buildGroupSubjectBulkRequest(
      {
        subjectId,
        mode: "update_existing",
        stage: "",
        minimumGrade: "4",
        maximumGrade: "2",
        groupHours: "not-hours",
        teacherHours: "1000000",
        teacherCount: "1"
      },
      en
    );
    expect(inverted.ok).toBe(false);
    if (!inverted.ok) {
      expect(inverted.errors).toMatchObject({
        gradeRange: en.groupSubjectBulk.gradeRangeError,
        groupHours: en.groupSubjectBulk.hoursError.not_a_number,
        teacherHours: en.groupSubjectBulk.hoursError.out_of_range
      });
    }
  });

  it("renders create, update, unchanged, and conflict rows in the preview table", async () => {
    const { GroupSubjectBulkPreviewTable, groupSubjectBulkPreviewRows } =
      await import(
        "../src/runtime/react/default-ui/process-crud/group-subjects/bulk.js"
      );

    expect(groupSubjectBulkPreviewRows(preview).map((row) => row.action)).toEqual([
      "create",
      "update",
      "unchanged",
      "conflict"
    ]);
    const html = renderToStaticMarkup(
      <GroupSubjectBulkPreviewTable
        dict={en}
        groups={groups}
        preview={preview}
      />
    );
    expect(html).toContain('data-reparto-table="group-subject-bulk-preview"');
    expect(html).toContain('data-group-subject-bulk-action="create"');
    expect(html).toContain('data-group-subject-bulk-action="update"');
    expect(html).toContain('data-group-subject-bulk-action="unchanged"');
    expect(html).toContain('data-group-subject-bulk-action="conflict"');
    expect(html).toContain("1 Secondary A");
    expect(html).toContain("No existing row");
    expect(html).toContain("0.00");
  });

  it("renders preview validation and empty states", async () => {
    const { GroupSubjectBulkPreviewTable } = await import(
      "../src/runtime/react/default-ui/process-crud/group-subjects/bulk.js"
    );
    const invalidPreview: GroupSubjectBulkPreview = {
      ...preview,
      matched_group_ids: [],
      to_create: [],
      to_update: [],
      unchanged: [],
      conflicts: [],
      validation_errors: ["Minimum grade exceeds maximum grade"],
      expected_affected_count: 0
    };
    const html = renderToStaticMarkup(
      <GroupSubjectBulkPreviewTable
        dict={en}
        groups={groups}
        preview={invalidPreview}
      />
    );
    expect(html).toContain("Preview validation errors");
    expect(html).toContain("Minimum grade exceeds maximum grade");
    expect(html).toContain('data-group-subject-bulk-empty="matches"');

    const noChangesHtml = renderToStaticMarkup(
      <GroupSubjectBulkPreviewTable
        dict={en}
        groups={groups}
        preview={{
          ...invalidPreview,
          matched_group_ids: [groupIds[0]],
          validation_errors: []
        }}
      />
    );
    expect(noChangesHtml).toContain('data-group-subject-bulk-empty="changes"');
  });

  it("keeps apply disabled before preview and exposes every filter and mode", async () => {
    const { GroupSubjectBulkEditor } = await import(
      "../src/runtime/react/default-ui/process-crud/group-subjects/bulk.js"
    );
    const html = renderToStaticMarkup(
      <GroupSubjectBulkEditor
        processId={processId}
        subjects={[subject]}
        teachingGroups={groups}
      />
    );
    const apply = html.match(
      /<button[^>]*data-reparto-action="group-subject-apply"[^>]*>/
    )?.[0];
    expect(apply).toContain("disabled");
    expect(html).toContain('data-reparto-field="group-subject-stage"');
    expect(html).toContain('data-reparto-field="group-subject-minimum-grade"');
    expect(html).toContain('data-reparto-field="group-subject-maximum-grade"');
    expect(html).toContain('value="create_missing"');
    expect(html).toContain('value="update_existing"');
    expect(html).toContain('value="upsert"');
    expect(html).toContain("Enter 0 for a real zero");
  });

  it("requires a dedicated confirmation before apply", async () => {
    const { GroupSubjectBulkConfirmation } = await import(
      "../src/runtime/react/default-ui/process-crud/group-subjects/bulk.js"
    );
    const html = renderToStaticMarkup(
      <GroupSubjectBulkConfirmation
        count={2}
        dict={en}
        isPending={false}
        mapped={EMPTY_REPARTO_MAPPED_ERROR}
        onCancel={() => undefined}
        onConfirm={() => undefined}
      />
    );
    expect(html).toContain("Apply group-subject changes?");
    expect(html).toContain("Apply 2 change(s)");
    expect(html).toContain('data-reparto-action="confirm-group-subject-bulk"');
  });

  it("recognizes only a 409 API response as a stale preview", async () => {
    const { isStaleGroupSubjectPreviewError } = await import(
      "../src/runtime/react/default-ui/process-crud/group-subjects/bulk.js"
    );
    expect(
      isStaleGroupSubjectPreviewError(
        new RepartoApiError(409, "Selection changed")
      )
    ).toBe(true);
    expect(
      isStaleGroupSubjectPreviewError(new RepartoApiError(400, "Invalid"))
    ).toBe(false);
    expect(isStaleGroupSubjectPreviewError(new Error("offline"))).toBe(false);
  });
});
