import { describe, expect, it } from "vitest";
import { generateClassroomLabel, generateGroupCodeRange, gradeInStageRange } from "../src/runtime/ui/classrooms.js";

describe("classroom utilities", () => {
  it("generates the canonical normalized label", () => {
    expect(generateClassroomLabel({ grade: 1, stageLabel: " ESO ", groupCode: " a " })).toBe("1° ESO A");
  });
  it("generates inclusive ranges and rejects invalid ranges", () => {
    expect(generateGroupCodeRange("a", "c")).toEqual(["A", "B", "C"]);
    expect(generateGroupCodeRange("C", "A")).toEqual([]);
    expect(generateGroupCodeRange("1", "A")).toEqual([]);
  });
  it("validates stage grade boundaries", () => {
    expect(gradeInStageRange(1, { min_grade: 1, max_grade: 4 })).toBe(true);
    expect(gradeInStageRange(4, { min_grade: 1, max_grade: 4 })).toBe(true);
    expect(gradeInStageRange(5, { min_grade: 1, max_grade: 4 })).toBe(false);
  });
});
