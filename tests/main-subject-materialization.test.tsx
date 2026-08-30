import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { getRepartoDictionary } from "../src/runtime/i18n/index.js";
import {
  MainSubjectMaterializationConfirmation,
  MainSubjectMaterializationTable,
  buildMainSubjectMaterializationRows
} from "../src/runtime/react/default-ui/planning/main-materialization.js";
import type {
  GroupSubjectPublic,
  SubjectPublic,
  TeachingActivityPublic,
  TeachingGroupPublic
} from "../src/runtime/schemas.js";

const processId = "11111111-1111-4111-8111-111111111111";
const subjectId = "22222222-2222-4222-8222-222222222222";
const secondarySubjectId = "33333333-3333-4333-8333-333333333333";
const groupAId = "44444444-4444-4444-8444-444444444444";
const groupBId = "55555555-5555-4555-8555-555555555555";
const groupSubjectAId = "66666666-6666-4666-8666-666666666666";
const groupSubjectBId = "77777777-7777-4777-8777-777777777777";
const timestamp = "2026-07-30T10:00:00Z";

const subjects: SubjectPublic[] = [
  {
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
    created_at: timestamp,
    updated_at: timestamp
  },
  {
    id: secondarySubjectId,
    assignment_process_id: processId,
    name: "Tutoring",
    allocation_category: "secondary",
    activity_type: "tutoring",
    default_group_weekly_hours: "1.00",
    default_teacher_weekly_hours_per_position: "1.00",
    default_required_teacher_count: 1,
    allows_multiple_groups: false,
    allows_zero_groups: false,
    notes: null,
    created_at: timestamp,
    updated_at: timestamp
  }
];

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
  targetSubjectId = subjectId
): GroupSubjectPublic {
  return {
    id,
    assignment_process_id: processId,
    teaching_group_id: teachingGroupId,
    subject_id: targetSubjectId,
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
  groupSubject(groupSubjectAId, groupAId),
  {
    ...groupSubject(groupSubjectBId, groupBId),
    group_weekly_hours: "4.00",
    teacher_weekly_hours_per_position: "4.00",
    required_teacher_count: 2
  },
  groupSubject(
    "99999999-9999-4999-8999-999999999999",
    groupAId,
    secondarySubjectId
  ),
  {
    ...groupSubject(
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      groupAId
    ),
    active: false
  }
] satisfies GroupSubjectPublic[];

const materializedActivity: TeachingActivityPublic = {
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  teaching_plan_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  subject_id: subjectId,
  allocation_category: "main",
  activity_type: "ordinary",
  group_weekly_hours_per_group: "4.00",
  teacher_weekly_hours_per_position: "4.00",
  required_teacher_count: 2,
  notes: null,
  source: "main_generated",
  source_group_subject_id: groupSubjectBId,
  sync_state: "in_sync",
  retired_at: null,
  group_subject_ids: [groupSubjectBId],
  linked_group_count: 1,
  created_at: timestamp,
  updated_at: timestamp
};

describe("main-subject materialization UI", () => {
  it("maps active main matrix rows to missing and live materialized states", () => {
    const rows = buildMainSubjectMaterializationRows({
      activities: [materializedActivity],
      groupSubjects,
      subjects,
      teachingGroups
    });

    expect(rows).toEqual([
      {
        groupSubjectId: groupSubjectAId,
        activityId: null,
        teachingGroup: "1A",
        subject: "Mathematics",
        groupHours: "3.00",
        teacherHours: "3.00",
        teacherCount: 1,
        state: "missing"
      },
      {
        groupSubjectId: groupSubjectBId,
        activityId: materializedActivity.id,
        teachingGroup: "1B",
        subject: "Mathematics",
        groupHours: "4.00",
        teacherHours: "4.00",
        teacherCount: 2,
        state: "materialized"
      }
    ]);
  });

  it("treats a retired generated activity as missing", () => {
    const rows = buildMainSubjectMaterializationRows({
      activities: [
        {
          ...materializedActivity,
          source_group_subject_id: groupSubjectAId,
          retired_at: timestamp
        }
      ],
      groupSubjects: [groupSubjects[0]],
      subjects,
      teachingGroups
    });

    expect(rows[0]?.state).toBe("missing");
  });

  it("renders both states and their materialization values", () => {
    const dict = getRepartoDictionary("en");
    const rows = buildMainSubjectMaterializationRows({
      activities: [materializedActivity],
      groupSubjects,
      subjects,
      teachingGroups
    });
    const html = renderToStaticMarkup(
      <MainSubjectMaterializationTable dict={dict} rows={rows} />
    );

    expect(html).toContain(
      'data-reparto-table="main-subject-materialization"'
    );
    expect(html).toContain('data-main-materialization-state="missing"');
    expect(html).toContain(
      'data-main-materialization-state="materialized"'
    );
    expect(html).toContain("Mathematics");
    expect(html).toContain("3.00 h");
    expect(html).toContain("4.00 h");
  });

  it("requires an explicit missing-only confirmation", () => {
    const dict = getRepartoDictionary("en");
    const html = renderToStaticMarkup(
      <MainSubjectMaterializationConfirmation
        dict={dict}
        isPending={false}
        materializedCount={3}
        missingCount={2}
        onCancel={() => undefined}
        onConfirm={() => undefined}
      />
    );

    expect(html).toContain('role="alertdialog"');
    expect(html).toContain("Create 2 missing activities.");
    expect(html).toContain(
      "3 activities already materialized are shown for review and will not be duplicated."
    );
    expect(html).toContain(
      'data-reparto-action="confirm-main-materialization"'
    );
    expect(html).not.toContain(
      'data-reparto-action="confirm-main-materialization" disabled=""'
    );
  });

  it("disables confirmation when no row remains missing", () => {
    const html = renderToStaticMarkup(
      <MainSubjectMaterializationConfirmation
        dict={getRepartoDictionary("en")}
        isPending={false}
        materializedCount={4}
        missingCount={0}
        onCancel={() => undefined}
        onConfirm={() => undefined}
      />
    );

    expect(html).toContain(
      'data-reparto-action="confirm-main-materialization" disabled=""'
    );
  });
});
