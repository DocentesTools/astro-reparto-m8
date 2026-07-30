import { describe, expect, it } from "vitest";
import {
  normalizeAcademicYearListParams,
  normalizeDepartmentListParams,
  normalizeListParams,
  normalizeSchoolListParams,
  normalizeTeacherProfileListParams,
  repartoKeys,
  requireProcessId,
  resolveProcessId
} from "../src/runtime/queryKeys.js";

describe("reparto query keys", () => {
  it("normalizes route process ids before fetching", () => {
    expect(resolveProcessId(undefined)).toBeUndefined();
    expect(resolveProcessId(" ")).toBeUndefined();
    expect(resolveProcessId("current")).toBeUndefined();
    expect(resolveProcessId(" 11111111-1111-4111-8111-111111111111 ")).toBe(
      "11111111-1111-4111-8111-111111111111"
    );
    expect(requireProcessId("p1")).toBe("p1");
    expect(() => requireProcessId("current")).toThrow(
      "A concrete reparto process id is required."
    );
  });

  it("builds stable keys for process-rooted views", () => {
    expect(normalizeListParams()).toEqual({ skip: 0, limit: 25 });
    expect(repartoKeys.processList({ limit: 10 })).toEqual([
      "reparto",
      "processes",
      "list",
      { skip: 0, limit: 10 }
    ]);
    expect(repartoKeys.dashboard("current")).toEqual([
      "reparto",
      "processes",
      "detail",
      null,
      "dashboard"
    ]);
    expect(repartoKeys.exports("p1")).toEqual([
      "reparto",
      "processes",
      "detail",
      "p1",
      "exports"
    ]);
  });

  it("builds stable keys for global entity lists (Phase 1)", () => {
    expect(normalizeSchoolListParams()).toEqual({ skip: 0, limit: 25 });
    expect(normalizeAcademicYearListParams({ skip: 1 })).toEqual({
      skip: 1,
      limit: 25
    });
    expect(normalizeDepartmentListParams({ schoolId: "  " })).toEqual({
      skip: 0,
      limit: 25,
      schoolId: null
    });
    expect(normalizeDepartmentListParams({ schoolId: " s1 " })).toEqual({
      skip: 0,
      limit: 25,
      schoolId: "s1"
    });
    expect(normalizeTeacherProfileListParams({ active: undefined })).toEqual({
      skip: 0,
      limit: 25,
      active: null
    });
    expect(normalizeTeacherProfileListParams({ active: false }).active).toBe(
      false
    );

    expect(repartoKeys.schoolList()).toEqual([
      "reparto",
      "schools",
      "list",
      { skip: 0, limit: 25 }
    ]);
    expect(repartoKeys.school("s1")).toEqual([
      "reparto",
      "schools",
      "detail",
      "s1"
    ]);
    expect(repartoKeys.school()).toEqual([
      "reparto",
      "schools",
      "detail",
      null
    ]);
    expect(repartoKeys.academicYearList()).toEqual([
      "reparto",
      "academic-years",
      "list",
      { skip: 0, limit: 25 }
    ]);
    expect(repartoKeys.academicYear("y1")).toEqual([
      "reparto",
      "academic-years",
      "detail",
      "y1"
    ]);
    expect(repartoKeys.academicYear()).toEqual([
      "reparto",
      "academic-years",
      "detail",
      null
    ]);
    expect(repartoKeys.departmentList({ schoolId: "s1" })).toEqual([
      "reparto",
      "departments",
      "list",
      { skip: 0, limit: 25, schoolId: "s1" }
    ]);
    expect(repartoKeys.department()).toEqual([
      "reparto",
      "departments",
      "detail",
      null
    ]);
    expect(repartoKeys.teacherProfileList({ active: true })).toEqual([
      "reparto",
      "teacher-profiles",
      "list",
      { skip: 0, limit: 25, active: true }
    ]);
    expect(repartoKeys.teacherProfile("p1")).toEqual([
      "reparto",
      "teacher-profiles",
      "detail",
      "p1"
    ]);
    expect(repartoKeys.teacherProfile()).toEqual([
      "reparto",
      "teacher-profiles",
      "detail",
      null
    ]);
  });

  it("builds stable keys for process-scoped entities (Phase 3 step 1)", () => {
    expect(repartoKeys.subjects("p1")).toEqual([
      "reparto",
      "processes",
      "detail",
      "p1",
      "subjects"
    ]);
    expect(repartoKeys.subjects("current")).toEqual([
      "reparto",
      "processes",
      "detail",
      null,
      "subjects"
    ]);
    expect(repartoKeys.teachingGroups("p1")).toEqual([
      "reparto",
      "processes",
      "detail",
      "p1",
      "groups"
    ]);
    expect(repartoKeys.hourRequirements("p1")).toEqual([
      "reparto",
      "processes",
      "detail",
      "p1",
      "requirements"
    ]);
    expect(repartoKeys.allocationRevisions("p1")).toEqual([
      "reparto",
      "processes",
      "detail",
      "p1",
      "allocation-revisions"
    ]);
    expect(repartoKeys.currentAllocationRevision("p1")).toEqual([
      "reparto",
      "processes",
      "detail",
      "p1",
      "allocation-revisions",
      "current"
    ]);
    expect(repartoKeys.processTeachers("p1")).toEqual([
      "reparto",
      "processes",
      "detail",
      "p1",
      "teachers"
    ]);
    expect(repartoKeys.assignments("p1")).toEqual([
      "reparto",
      "processes",
      "detail",
      "p1",
      "assignments"
    ]);
    expect(repartoKeys.auditEvents("p1")).toEqual([
      "reparto",
      "processes",
      "detail",
      "p1",
      "audit-events"
    ]);
    expect(repartoKeys.subjects()).toEqual([
      "reparto",
      "processes",
      "detail",
      null,
      "subjects"
    ]);
  });
});
