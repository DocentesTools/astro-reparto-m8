import { formatHoursField, parseHoursField, type HoursFieldError } from "../decimals.js";
import type {
  AssignmentProcessPublic,
  AssignmentProcessUpdate,
  SelectionOrderMode
} from "../schemas.js";

/**
 * Process settings and the reopen edge, decided once and without React
 * (audit findings `S2-03`, `S2-05`).
 *
 * `AssignmentProcessUpdateSchema` has always carried the selection and LAN
 * fields, and `assignmentProcesses.update` / `.reopen` have always existed as
 * wrappers — with no hook and no form behind either, a process was create-only
 * and §8.2 step 7 had no entry point at all. The two decisions a settings
 * surface has to make are *what changed* and *may this process be reopened*,
 * and both are pure functions of the process row; they live here so the form,
 * the reopen control and any headless host agree on them.
 */

/**
 * `status` is **deliberately not a settings field.**
 *
 * The schema mirrors the backend model and still lists it, but the served
 * `update_process` refuses it outright — *"Process status is owned by the
 * transition endpoint"*, HTTP 400. Offering a status select here would ship a
 * control whose every press fails, and `create_meeting_session` already sets
 * `MEETING_OPEN` itself, so a second mover would race the meeting path. Status
 * changes belong to `transition` (not surfaced) and to `reopen` (below).
 */
export const PROCESS_SETTINGS_FIELDS = [
  "default_teacher_hours_reference",
  "selection_order_enabled",
  "selection_order_mode",
  "direct_teacher_selection_enabled",
  "lan_access_enabled"
] as const;

export type ProcessSettingsField = (typeof PROCESS_SETTINGS_FIELDS)[number];

/** The form's own state: hours stay text so "unset" survives typing. */
export type ProcessSettingsValues = {
  defaultTeacherHoursReference: string;
  selectionOrderEnabled: boolean;
  selectionOrderMode: SelectionOrderMode;
  directTeacherSelectionEnabled: boolean;
  lanAccessEnabled: boolean;
};

export const EMPTY_PROCESS_SETTINGS_VALUES: ProcessSettingsValues = {
  defaultTeacherHoursReference: "",
  selectionOrderEnabled: false,
  selectionOrderMode: "none",
  directTeacherSelectionEnabled: false,
  lanAccessEnabled: false
};

/** Read a process row into the form. A `null` hours reference is a blank box. */
export function buildProcessSettingsValues(
  process: AssignmentProcessPublic | null | undefined
): ProcessSettingsValues {
  if (!process) return EMPTY_PROCESS_SETTINGS_VALUES;
  return {
    defaultTeacherHoursReference: formatHoursField(
      process.default_teacher_hours_reference
    ),
    selectionOrderEnabled: process.selection_order_enabled,
    selectionOrderMode: process.selection_order_mode,
    directTeacherSelectionEnabled: process.direct_teacher_selection_enabled,
    lanAccessEnabled: process.lan_access_enabled
  };
}

export type ProcessSettingsErrorKey = "defaultTeacherHoursReference";

export type ProcessSettingsRequestResult =
  | { ok: true; changed: false }
  | { ok: true; changed: true; request: AssignmentProcessUpdate }
  | {
      ok: false;
      errors: Partial<Record<ProcessSettingsErrorKey, HoursFieldError>>;
    };

/**
 * Turn the form into the `PATCH` body, carrying **only what changed**.
 *
 * `PATCH` is a partial update on the service, so sending every field would
 * rewrite values this operator never touched — and would make a concurrent
 * edit invisible instead of harmless. An unchanged form reports `changed:
 * false` rather than an empty request: a no-op round trip still writes an
 * audit event (`process.updated`) claiming a change that did not happen.
 *
 * `default_teacher_hours_reference` is the one hour value the backend types as
 * a float rather than a canonical decimal string, so it is validated through
 * `parseHoursField` (never a bare `Number()` of user text) and converted at
 * this single boundary. A blank field is an explicit `null` — "no reference" —
 * and is not the same as a typed `0`.
 */
export function buildProcessSettingsRequest(
  values: ProcessSettingsValues,
  process: AssignmentProcessPublic | null | undefined
): ProcessSettingsRequestResult {
  const hours = parseHoursField(values.defaultTeacherHoursReference);
  if (hours.state === "invalid") {
    return { ok: false, errors: { defaultTeacherHoursReference: hours.reason } };
  }
  const nextHours = hours.state === "unset" ? null : Number(hours.hours);

  const request: AssignmentProcessUpdate = {};
  const current = process ?? null;
  if (!current || current.default_teacher_hours_reference !== nextHours) {
    request.default_teacher_hours_reference = nextHours;
  }
  if (!current || current.selection_order_enabled !== values.selectionOrderEnabled) {
    request.selection_order_enabled = values.selectionOrderEnabled;
  }
  if (!current || current.selection_order_mode !== values.selectionOrderMode) {
    request.selection_order_mode = values.selectionOrderMode;
  }
  if (
    !current ||
    current.direct_teacher_selection_enabled !== values.directTeacherSelectionEnabled
  ) {
    request.direct_teacher_selection_enabled = values.directTeacherSelectionEnabled;
  }
  if (!current || current.lan_access_enabled !== values.lanAccessEnabled) {
    request.lan_access_enabled = values.lanAccessEnabled;
  }

  if (Object.keys(request).length === 0) return { ok: true, changed: false };
  return { ok: true, changed: true, request };
}

/**
 * Whether the selection-order mode is doing anything.
 *
 * The two fields are independent columns on the row, so a `strict` mode with
 * `selection_order_enabled: false` is storable and inert. The form says so
 * rather than silently forcing one from the other: the operator's stored value
 * is theirs, and hiding the mode would make re-enabling the order look like it
 * lost the setting.
 */
export function isSelectionOrderModeEffective(
  values: ProcessSettingsValues
): boolean {
  return values.selectionOrderEnabled && values.selectionOrderMode !== "none";
}

/**
 * The two statuses in which the service refuses every child-resource write.
 *
 * Mirrors `_IMMUTABLE_PROCESS_STATUSES` on the service, whose
 * `ensure_process_mutable` answers *"Cannot mutate a process in status
 * {status}; reopen it first."* — the refusal `S2-05` reported an operator had
 * no way to comply with.
 */
const FROZEN_PROCESS_STATUSES = new Set(["final", "archived"]);

/** Why the reopen affordance is withheld, when it is. */
export type ProcessReopenBlockedReason =
  /** No process has been read, so there is nothing to say. */
  | "unknown"
  /** The process still accepts writes; nothing needs reopening. */
  | "mutable"
  /**
   * `archived` is terminal: the lifecycle service refuses every edge out of it
   * and `reopen` is the `final` → `reopened` edge alone, so the frozen state is
   * real and this surface cannot lift it.
   */
  | "terminal"
  /** The session is below the `admin` write floor for `processSettings`. */
  | "read-only";

export type ProcessReopenState = {
  /** Child resources are refused until the process leaves its status. */
  isFrozen: boolean;
  canReopen: boolean;
  blockedReason: ProcessReopenBlockedReason | null;
};

/**
 * Decide what the reopen surface says (audit finding `S2-05`).
 *
 * Two questions kept apart, as with the plan unlock: *is this process frozen?*
 * is what the operator is running into, and is true for `final` and `archived`
 * alike; *may it be reopened?* is what `POST …/reopen` will actually accept,
 * which is `final` alone. Collapsing them would either hide the explanation for
 * an archived process or offer a control that answers 400.
 */
export function buildProcessReopenState({
  canAct,
  process
}: {
  canAct: boolean;
  process: AssignmentProcessPublic | null | undefined;
}): ProcessReopenState {
  if (!process) {
    return { isFrozen: false, canReopen: false, blockedReason: "unknown" };
  }
  if (!FROZEN_PROCESS_STATUSES.has(process.status)) {
    return { isFrozen: false, canReopen: false, blockedReason: "mutable" };
  }
  if (process.status !== "final") {
    return { isFrozen: true, canReopen: false, blockedReason: "terminal" };
  }
  return {
    isFrozen: true,
    canReopen: canAct,
    blockedReason: canAct ? null : "read-only"
  };
}

/** The service requires a reason of 1–500 characters on every reopen. */
export const PROCESS_REOPEN_REASON_MAX_LENGTH = 500;

export type ProcessReopenReasonError = "required" | "too_long";

export type ProcessReopenRequestResult =
  | { ok: true; request: { reason: string } }
  | { ok: false; error: ProcessReopenReasonError };

/**
 * Validate the reopen reason before the request leaves.
 *
 * The reason is not decoration: `reopen_process` records it on the
 * `process.reopened` audit event, which is the only trace of why a closed
 * process was opened again.
 */
export function buildProcessReopenRequest(
  reason: string
): ProcessReopenRequestResult {
  const trimmed = reason.trim();
  if (!trimmed) return { ok: false, error: "required" };
  if (trimmed.length > PROCESS_REOPEN_REASON_MAX_LENGTH) {
    return { ok: false, error: "too_long" };
  }
  return { ok: true, request: { reason: trimmed } };
}
