export function normalizeGroupCode(value: string): string {
  return value.trim().toUpperCase();
}

export function generateTeachingGroupLabel(input: {
  grade: number;
  stageLabel: string;
  groupCode: string;
}): string {
  return `${input.grade}° ${input.stageLabel.trim().replace(/\s+/g, " ")} ${normalizeGroupCode(input.groupCode)}`;
}

export function generateGroupCodeRange(start: string, end: string): string[] {
  const first = normalizeGroupCode(start);
  const last = normalizeGroupCode(end);
  if (!/^[A-Z]$/.test(first) || !/^[A-Z]$/.test(last) || first > last) return [];
  return Array.from(
    { length: last.charCodeAt(0) - first.charCodeAt(0) + 1 },
    (_, index) => String.fromCharCode(first.charCodeAt(0) + index)
  );
}

export function gradeInStageRange(
  grade: number,
  stage: { min_grade: number; max_grade: number }
): boolean {
  return Number.isInteger(grade) && grade >= stage.min_grade && grade <= stage.max_grade;
}
