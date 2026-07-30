import {
  ActivityTypeSchema,
  SubjectAllocationCategorySchema
} from "../../../../schemas.js";
import type { Dict } from "../shared.js";

export type ClassificationOption = { value: string; label: string };

/**
 * Localized select options for a subject's classification (backend plan §5.3).
 *
 * Both lists are derived from the contract enums rather than hardcoded, so a
 * value added backend-side surfaces as a missing dictionary entry (which the
 * i18n suite catches) instead of silently disappearing from the form.
 */
export function allocationCategoryOptions(dict: Dict): ClassificationOption[] {
  return SubjectAllocationCategorySchema.options.map((value) => ({
    value,
    label: dict.option.allocationCategory[value]
  }));
}

export function activityTypeOptions(dict: Dict): ClassificationOption[] {
  return ActivityTypeSchema.options.map((value) => ({
    value,
    label: dict.option.activityType[value]
  }));
}
