import {
  formatRepartoMessage,
  type RepartoDictionary,
  type RepartoMessageVars
} from "./i18n/index.js";
import type { PlanValidationMessage } from "./schemas.js";

export type ValidationParamKind = "integer" | "string";

/**
 * The exact substitution contract for every service-owned validation code.
 *
 * Decimal hours deliberately remain canonical strings so signed two-place
 * values cross the JSON boundary without binary-number rounding. Unknown
 * codes stay valid because PlanValidationMessage.code is an open vocabulary.
 */
export const VALIDATION_PARAM_CONTRACT = {
  "plan.missing_allocation": {},
  "plan.group_hours_imbalanced": {
    group_hours: "string",
    allocation_hours: "string",
    difference_hours: "string"
  },
  "plan.teacher_load_imbalanced": {
    teacher_hours: "string",
    target_hours: "string",
    difference_hours: "string"
  },
  "plan.main_subject_not_materialized": {
    group_label: "string",
    subject_label: "string"
  },
  "activity.missing_groups": { activity_label: "string" },
  "activity.multiple_groups_not_allowed": {
    activity_label: "string",
    group_count: "integer"
  },
  "activity.linked_subject_mismatch": { activity_label: "string" },
  "activity.out_of_sync": { activity_label: "string" },
  "plan.requirements_not_generated": {},
  "requirement.stale": { count: "integer" },
  "plan.stale": { status: "string" },
  "plan.feasibility_not_confirmed": { status: "string" },
  "teacher.overloaded_authorized": {
    teacher_label: "string",
    extra_hours: "string"
  },
  "plan.secondary_activities_available": { count: "integer" },
  "requirement.unassigned": { count: "integer" },
  "participant.over_target": {
    teacher_label: "string",
    assigned_hours: "string",
    target_hours: "string",
    difference_hours: "string"
  },
  "participant.below_target": {
    teacher_label: "string",
    assigned_hours: "string",
    target_hours: "string",
    difference_hours: "string"
  }
} as const satisfies Record<string, Record<string, ValidationParamKind>>;

export type KnownValidationCode = keyof typeof VALIDATION_PARAM_CONTRACT;
export type ValidationParamValue = string | number;
export type ValidationParams = Record<string, ValidationParamValue>;

type PluralTemplates = {
  zero: string;
  one: string;
  many: string;
};

type ValidationTemplate = string | PluralTemplates;

const COUNT_PARAM_BY_CODE: Partial<Record<KnownValidationCode, string>> = {
  "activity.multiple_groups_not_allowed": "group_count",
  "plan.secondary_activities_available": "count",
  "requirement.stale": "count",
  "requirement.unassigned": "count"
};

export function isKnownValidationCode(code: string): code is KnownValidationCode {
  return Object.hasOwn(VALIDATION_PARAM_CONTRACT, code);
}

/** Return whether supplied params match the exact known-code contract. */
export function hasValidValidationParams(
  code: string,
  params: ValidationParams | undefined
): boolean {
  if (!isKnownValidationCode(code)) return true;
  if (params === undefined) return true;

  const expected = VALIDATION_PARAM_CONTRACT[code];
  const expectedKeys = Object.keys(expected).sort();
  const actualKeys = Object.keys(params).sort();
  if (
    expectedKeys.length !== actualKeys.length ||
    expectedKeys.some((key, index) => key !== actualKeys[index])
  ) {
    return false;
  }

  return expectedKeys.every((key) => {
    const expectedKind = (expected as Record<string, ValidationParamKind>)[key];
    const value = params[key];
    return expectedKind === "integer"
      ? typeof value === "number" && Number.isInteger(value)
      : typeof value === "string";
  });
}

/**
 * Render a known finding from the selected locale; retain service prose for an
 * older response without required params or for an additive unknown code.
 */
export function formatValidationFinding(
  dict: RepartoDictionary,
  message: Pick<PlanValidationMessage, "code" | "message" | "params">
): string {
  if (!isKnownValidationCode(message.code)) return message.message;

  const expected = VALIDATION_PARAM_CONTRACT[message.code];
  if (Object.keys(expected).length > 0 && message.params === undefined) {
    return message.message;
  }
  if (!hasValidValidationParams(message.code, message.params)) {
    return message.message;
  }

  const templates = dict.validationFindings as Record<
    KnownValidationCode,
    ValidationTemplate
  >;
  const template = templates[message.code];
  const vars = localizedParams(dict, message.code, message.params ?? {});
  if (typeof template === "string") {
    return formatRepartoMessage(template, vars);
  }

  const countKey = COUNT_PARAM_BY_CODE[message.code];
  const count = vars[countKey as string] as number;
  const pluralTemplate = count === 0 ? template.zero : count === 1 ? template.one : template.many;
  return formatRepartoMessage(pluralTemplate, vars);
}

function localizedParams(
  dict: RepartoDictionary,
  code: KnownValidationCode,
  params: ValidationParams
): RepartoMessageVars {
  if (code === "plan.stale" && typeof params.status === "string") {
    const labels = dict.requirements.planStatus as Record<string, string>;
    return { ...params, status: labels[params.status] ?? params.status };
  }
  if (
    code === "plan.feasibility_not_confirmed" &&
    typeof params.status === "string"
  ) {
    const labels = dict.dashboard.feasibility as Record<string, string>;
    return { ...params, status: labels[params.status] ?? params.status };
  }
  return params;
}
