import { RepartoApiError, RepartoUnauthenticatedError } from "./errors.js";

export type RepartoFieldKey =
  | "name"
  | "label"
  | "startDate"
  | "endDate"
  | "displayName"
  | "school"
  | "department"
  | "userId"
  | "slug"
  | "active"
  | "notes"
  | "locality"
  | "province"
  | "region"
  | "address"
  | "stage"
  | "grade"
  | "groupCode"
  | "subject"
  | "teachingGroup"
  | "teacher"
  | "hourRequirement"
  | "processParticipant"
  | "source"
  | "reason"
  | "baseWeeklyHours"
  | "extraWeeklyHours"
  | "participatesInSelection"
  | "selectionPosition"
  | "selectionPoints"
  | "selectionCriteria"
  | "selectionNotes"
  | "orderLocked"
  | "allocationCategory"
  | "activityType"
  | "mode"
  | "minimumGrade"
  | "maximumGrade"
  | "groupWeeklyHours"
  | "teacherWeeklyHoursPerPosition"
  | "requiredTeacherCount"
  | "groupSubjects"
  | "previousAcademicYear";

export type RepartoErrorKey =
  | "required"
  | "duplicate"
  | "duplicateScoped"
  | "fkMissing"
  | "fkViolation"
  | "invalidDate"
  | "processState"
  | "permission"
  | "unauthorized"
  | "network"
  | "server"
  | "conflict";

export type RepartoFieldError = {
  field: RepartoFieldKey;
  message: string;
  errorKey?: RepartoErrorKey;
};

export type RepartoFormError = {
  message: string;
  errorKey?: RepartoErrorKey;
};

export type RepartoMappedError = {
  fieldErrors: RepartoFieldError[];
  formError: RepartoFormError | null;
};

export const EMPTY_REPARTO_MAPPED_ERROR: RepartoMappedError = {
  fieldErrors: [],
  formError: null
};

const FIELD_ALIASES: Record<string, RepartoFieldKey> = {
  name: "name",
  display_name: "displayName",
  label: "label",
  start_date: "startDate",
  end_date: "endDate",
  school_id: "school",
  department_id: "department",
  user_id: "userId",
  slug: "slug",
  active: "active",
  notes: "notes",
  locality: "locality",
  province: "province",
  region: "region",
  address: "address",
  stage: "stage",
  grade: "grade",
  group_code: "groupCode",
  subject_id: "subject",
  teaching_group_id: "teachingGroup",
  hour_requirement_id: "hourRequirement",
  process_teacher_id: "processParticipant",
  teacher_profile_id: "teacher",
  source: "source",
  // Undo and reassignment are reason-required actions (backend plan §20.13),
  // so a rejected reason must land on its own field rather than the form.
  reason: "reason",
  base_weekly_hours: "baseWeeklyHours",
  extra_weekly_hours: "extraWeeklyHours",
  participates_in_selection: "participatesInSelection",
  selection_position: "selectionPosition",
  selection_points: "selectionPoints",
  selection_criteria_label: "selectionCriteria",
  selection_notes: "selectionNotes",
  order_locked: "orderLocked",
  allocation_category: "allocationCategory",
  activity_type: "activityType",
  mode: "mode",
  minimum_grade: "minimumGrade",
  maximum_grade: "maximumGrade",
  group_weekly_hours: "groupWeeklyHours",
  group_weekly_hours_per_group: "groupWeeklyHours",
  teacher_weekly_hours_per_position: "teacherWeeklyHoursPerPosition",
  required_teacher_count: "requiredTeacherCount",
  group_subject_ids: "groupSubjects",
  previous_academic_year_id: "previousAcademicYear"
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractDetailMessage(detail: unknown): string | undefined {
  if (typeof detail === "string") {
    const trimmed = detail.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (Array.isArray(detail)) {
    return detail
      .map((entry) => (isRecord(entry) ? entry.msg : undefined))
      .filter((value): value is string => typeof value === "string")
      .join("; ");
  }
  return undefined;
}

function classifyDetail(detail: unknown, status: number): RepartoErrorKey {
  if (status === 401) return "unauthorized";
  if (status === 403) return "permission";
  if (status === 404) return "fkMissing";
  if (status === 409) return "conflict";
  if (status === 422) return "required";
  if (status === 400) {
    const text = (extractDetailMessage(detail) ?? "").toLowerCase();
    if (text.includes("unique") || text.includes("duplicate") || text.includes("already")) {
      return "duplicate";
    }
    if (text.includes("not found") || text.includes("does not exist")) {
      return "fkMissing";
    }
    if (text.includes("date")) {
      return "invalidDate";
    }
    if (text.includes("permission") || text.includes("not allowed")) {
      return "permission";
    }
  }
  return "server";
}

function extractFieldFrom422(
  entry: Record<string, unknown>
): RepartoFieldKey | undefined {
  const loc = entry.loc;
  if (!Array.isArray(loc) || loc.length === 0) return undefined;
  for (let i = loc.length - 1; i >= 0; i -= 1) {
    const segment = loc[i];
    if (typeof segment === "string") {
      const alias = FIELD_ALIASES[segment];
      if (alias) return alias;
    }
  }
  return undefined;
}

export function mapRepartoError(
  error: unknown,
  options: { networkFallback?: string } = {}
): RepartoMappedError {
  if (error instanceof RepartoUnauthenticatedError) {
    return {
      fieldErrors: [],
      formError: { message: error.message, errorKey: "unauthorized" }
    };
  }

  if (error instanceof RepartoApiError) {
    const status = error.status;
    const detail = error.detail;
    const message = extractDetailMessage(detail) ?? error.message;
    const errorKey = classifyDetail(detail, status);

    if (status === 422 && Array.isArray(detail)) {
      const fieldErrors: RepartoFieldError[] = [];
      for (const entry of detail) {
        if (!isRecord(entry)) continue;
        const field = extractFieldFrom422(entry);
        const msg = typeof entry.msg === "string" ? entry.msg : undefined;
        if (!msg) continue;
        if (field) {
          fieldErrors.push({ field, message: msg, errorKey });
        } else {
          return {
            fieldErrors: [],
            formError: { message: msg, errorKey }
          };
        }
      }
      if (fieldErrors.length > 0) {
        return { fieldErrors, formError: null };
      }
    }

    return {
      fieldErrors: [],
      formError: { message, errorKey }
    };
  }

  if (error instanceof TypeError) {
    return {
      fieldErrors: [],
      formError: {
        message: options.networkFallback ?? "Network error",
        errorKey: "network"
      }
    };
  }

  if (error instanceof Error) {
    return {
      fieldErrors: [],
      formError: { message: error.message, errorKey: "server" }
    };
  }

  return {
    fieldErrors: [],
    formError: { message: "Unknown error", errorKey: "server" }
  };
}

export function findFieldError(
  mapped: RepartoMappedError,
  field: RepartoFieldKey
): RepartoFieldError | undefined {
  return mapped.fieldErrors.find((entry) => entry.field === field);
}

export function describeErrorKey(
  errorKey: RepartoErrorKey | undefined,
  translate: (key: string) => string
): string {
  if (!errorKey) return "";
  const map: Record<RepartoErrorKey, string> = {
    required: translate("error.required"),
    duplicate: translate("error.duplicate"),
    duplicateScoped: translate("error.duplicateScoped"),
    fkMissing: translate("error.fkMissing"),
    fkViolation: translate("error.fkViolation"),
    invalidDate: translate("error.invalidDate"),
    processState: translate("error.processState"),
    permission: translate("error.permission"),
    unauthorized: translate("error.unauthorized"),
    network: translate("error.network"),
    server: translate("error.server"),
    conflict: translate("error.conflict")
  };
  return map[errorKey] ?? "";
}
