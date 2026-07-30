import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { EMPTY_REPARTO_MAPPED_ERROR } from "../src/runtime/errorMapping.js";
import { getRepartoDictionary } from "../src/runtime/i18n/index.js";
import {
  SecondaryActivityForm,
  SecondaryActivityTable,
  buildSecondaryActivityRequests,
  buildSecondaryActivityRows,
  secondaryActivityFormValues
} from "../src/runtime/react/default-ui/planning/secondary-activities.js";
import type {
  GroupSubjectPublic,
  SubjectPublic,
  TeachingActivityPublic,
  TeachingGroupPublic
} from "../src/runtime/schemas.js";

const processId = "11111111-1111-4111-8111-111111111111";
const tutoringSubjectId = "22222222-2222-4222-8222-222222222222";
const coTeachingSubjectId = "33333333-3333-4333-8333-333333333333";
const groupAId = "44444444-4444-4444-8444-444444444444";
const groupBId = "55555555-5555-4555-8555-555555555555";
const cellAId = "66666666-6666-4666-8666-666666666666";
const cellBId = "77777777-7777-4777-8777-777777777777";
const timestamp = "2026-07-30T12:00:00Z";
const dict = getRepartoDictionary("en");

function subject(
  id: string,
  name: string,
  activityType: SubjectPublic["activity_type"],
  allowsMultipleGroups: boolean
): SubjectPublic {
  return {
    id,
    assignment_process_id: processId,
    name,
    allocation_category: "secondary",
    activity_type: activityType,
    default_group_weekly_hours: "1.00",
    default_teacher_weekly_hours_per_position:
      activityType === "tutoring" ? "2.00" : "1.00",
    default_required_teacher_count:
      activityType === "co_teaching" ? 2 : 1,
    allows_multiple_groups: allowsMultipleGroups,
    allows_zero_groups: false,
    notes: null,
    created_at: timestamp,
    updated_at: timestamp
  };
}

const tutoringSubject = subject(
  tutoringSubjectId,
  "Tutoring",
  "tutoring",
  false
);
const coTeachingSubject = subject(
  coTeachingSubjectId,
  "Co-teaching",
  "co_teaching",
  true
);

function teachingGroup(id: string, label: string): TeachingGroupPublic {
  return {
    id,
    assignment_process_id: processId,
    classroom_stage_id: "88888888-8888-4888-8888-888888888888",
    classroom_stage: {
      id: "88888888-8888-4888-8888-888888888888",
      stage: "Secondary",
      min_grade: 1,
      max_grade: 4,
      label: "Secondary",
      created_at: timestamp,
      updated_at: timestamp
    },
    grade: 1,
    group_code: label,
    label,
    notes: null,
    created_at: timestamp,
    updated_at: timestamp
  };
}

const teachingGroups = [
  teachingGroup(groupAId, "1A"),
  teachingGroup(groupBId, "1B")
];

function groupSubject(
  id: string,
  teachingGroupId: string,
  subjectId = coTeachingSubjectId
): GroupSubjectPublic {
  return {
    id,
    assignment_process_id: processId,
    teaching_group_id: teachingGroupId,
    subject_id: subjectId,
    group_weekly_hours: null,
    teacher_weekly_hours_per_position: null,
    required_teacher_count: 1,
    active: true,
    notes: null,
    created_at: timestamp,
    updated_at: timestamp
  };
}

const groupSubjects = [
  groupSubject(cellAId, groupAId),
  groupSubject(cellBId, groupBId)
];

const coTeachingActivity: TeachingActivityPublic = {
  id: "99999999-9999-4999-8999-999999999999",
  teaching_plan_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  subject_id: coTeachingSubjectId,
  allocation_category: "secondary",
  activity_type: "co_teaching",
  group_weekly_hours_per_group: "2.00",
  teacher_weekly_hours_per_position: "2.00",
  required_teacher_count: 2,
  notes: "Shared activity",
  source: "secondary_manual",
  source_group_subject_id: null,
  sync_state: "in_sync",
  retired_at: null,
  group_subject_ids: [cellAId, cellBId],
  linked_group_count: 2,
  created_at: timestamp,
  updated_at: timestamp
};

describe("secondary activity editor", () => {
  it("seeds tutoring defaults and keeps its two planning axes independent", () => {
    const values = secondaryActivityFormValues(tutoringSubject);

    expect(values).toMatchObject({
      subjectId: tutoringSubjectId,
      activityType: "tutoring",
      groupHours: "1.00",
      teacherHours: "2.00",
      teacherCount: "1"
    });

    const result = buildSecondaryActivityRequests({
      availableGroupSubjectIds: [cellAId],
      dict,
      subject: tutoringSubject,
      values: { ...values, groupSubjectIds: [cellAId] }
    });

    expect(result).toEqual({
      ok: true,
      create: {
        subject_id: tutoringSubjectId,
        allocation_category: "secondary",
        activity_type: "tutoring",
        group_weekly_hours_per_group: "1.00",
        teacher_weekly_hours_per_position: "2.00",
        required_teacher_count: 1,
        notes: null,
        source: "secondary_manual",
        group_subject_ids: [cellAId]
      },
      update: {
        allocation_category: "secondary",
        activity_type: "tutoring",
        group_weekly_hours_per_group: "1.00",
        teacher_weekly_hours_per_position: "2.00",
        required_teacher_count: 1,
        notes: null,
        group_subject_ids: [cellAId]
      }
    });
  });

  it("builds a canonical co-teaching payload with multiple groups and positions", () => {
    const result = buildSecondaryActivityRequests({
      availableGroupSubjectIds: [cellAId, cellBId],
      dict,
      subject: coTeachingSubject,
      values: {
        subjectId: coTeachingSubjectId,
        activityType: "co_teaching",
        groupHours: "2",
        teacherHours: "2.0",
        teacherCount: "2",
        groupSubjectIds: [cellAId, cellBId],
        notes: "  Two teachers  "
      }
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.create).toMatchObject({
      group_weekly_hours_per_group: "2.00",
      teacher_weekly_hours_per_position: "2.00",
      required_teacher_count: 2,
      group_subject_ids: [cellAId, cellBId],
      notes: "Two teachers"
    });
  });

  it("rejects invalid decimal, teacher-count and linked-group states", () => {
    const invalid = buildSecondaryActivityRequests({
      availableGroupSubjectIds: [cellAId],
      dict,
      subject: tutoringSubject,
      values: {
        subjectId: tutoringSubjectId,
        activityType: "",
        groupHours: "",
        teacherHours: "1.001",
        teacherCount: "0",
        groupSubjectIds: [cellAId, cellAId],
        notes: "x".repeat(2001)
      }
    });

    expect(invalid).toMatchObject({
      ok: false,
      errors: {
        activityType: dict.error.required,
        groupHours: dict.error.required,
        teacherHours: dict.planning.secondary.hoursError.too_many_decimals,
        teacherCount: dict.planning.secondary.teacherCountError,
        groupSubjects: dict.planning.secondary.duplicateGroupsError,
        notes: dict.planning.secondary.notesError
      }
    });

    const multiple = buildSecondaryActivityRequests({
      availableGroupSubjectIds: [cellAId, cellBId],
      dict,
      subject: tutoringSubject,
      values: {
        ...secondaryActivityFormValues(tutoringSubject),
        groupSubjectIds: [cellAId, cellBId]
      }
    });
    expect(multiple).toMatchObject({
      ok: false,
      errors: { groupSubjects: dict.planning.secondary.multipleGroupsError }
    });

    const unknown = buildSecondaryActivityRequests({
      availableGroupSubjectIds: [cellAId],
      dict,
      subject: coTeachingSubject,
      values: {
        ...secondaryActivityFormValues(coTeachingSubject),
        groupSubjectIds: [cellBId]
      }
    });
    expect(unknown).toMatchObject({
      ok: false,
      errors: { groupSubjects: dict.planning.secondary.invalidGroupsError }
    });
  });

  it("derives live secondary rows, labels groups and computes both impacts exactly", () => {
    const rows = buildSecondaryActivityRows({
      activities: [
        coTeachingActivity,
        {
          ...coTeachingActivity,
          id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          allocation_category: "main"
        },
        {
          ...coTeachingActivity,
          id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
          retired_at: timestamp
        }
      ],
      groupSubjects,
      subjects: [tutoringSubject, coTeachingSubject],
      teachingGroups
    });

    expect(rows).toEqual([
      {
        activity: coTeachingActivity,
        subjectName: "Co-teaching",
        groupLabels: ["1A", "1B"],
        groupImpact: "4.00",
        teacherImpact: "4.00"
      }
    ]);
  });

  it("renders the editable activity list with groups, balances and row actions", () => {
    const rows = buildSecondaryActivityRows({
      activities: [coTeachingActivity],
      groupSubjects,
      subjects: [coTeachingSubject],
      teachingGroups
    });
    const html = renderToStaticMarkup(
      <SecondaryActivityTable
        dict={dict}
        onDelete={() => undefined}
        onEdit={() => undefined}
        rows={rows}
      />
    );

    expect(html).toContain('data-reparto-table="secondary-activities"');
    expect(html).toContain('data-activity-type="co_teaching"');
    expect(html).toContain("1A, 1B");
    expect(html.match(/2.00 h × 2 = 4.00 h/g)).toHaveLength(2);
    expect(html).toContain('data-reparto-row-action="edit"');
    expect(html).toContain('data-reparto-row-action="delete"');
  });

  it("renders all activity controls including multi-group selection", () => {
    const values = {
      ...secondaryActivityFormValues(coTeachingSubject),
      groupSubjectIds: [cellAId, cellBId]
    };
    const html = renderToStaticMarkup(
      <SecondaryActivityForm
        availableGroupSubjects={groupSubjects}
        dict={dict}
        errors={{}}
        isPending={false}
        mapped={EMPTY_REPARTO_MAPPED_ERROR}
        mode="create"
        onCancel={() => undefined}
        onChange={() => undefined}
        onSubmit={() => undefined}
        selectedSubject={coTeachingSubject}
        subjects={[tutoringSubject, coTeachingSubject]}
        teachingGroups={teachingGroups}
        values={values}
      />
    );

    expect(html).toContain('data-reparto-field="secondary-activity-subject"');
    expect(html).toContain('data-reparto-field="secondary-activity-type"');
    expect(html).toContain(
      'data-reparto-field="secondary-activity-group-hours"'
    );
    expect(html).toContain(
      'data-reparto-field="secondary-activity-teacher-hours"'
    );
    expect(html).toContain(
      'data-reparto-field="secondary-activity-teacher-count"'
    );
    expect(html).toContain('data-reparto-field="secondary-activity-groups"');
    expect(html.match(/type="checkbox" checked=""/g)).toHaveLength(2);
    expect(html).toContain("Tutoring");
    expect(html).toContain("Co-teaching");
  });
});
