/**
 * Canonical decimal-hour handling for the reparto contract (backend plan §3.9).
 *
 * Every weekly hour value in the teaching-allocation domain is a non-negative
 * decimal with at most two places, exchanged over the API as a canonical
 * decimal string such as `"2.50"`, and normalized to two places before any
 * comparison. Differences between two such values (`planned − target`) are
 * signed but follow the same two-place rule.
 *
 * The backend is currently mid-way through that contract: computed/balance
 * schemas already serialize canonical strings, while entity `*Public` schemas
 * still serialize JSON numbers because the `NUMERIC(..., 2)` column sweep is
 * open. Both representations therefore have to be readable here, and the flip
 * from number to string must not ripple into component code. That is why every
 * public helper accepts `string | number`, normalizes to **integer hundredths**
 * internally, and returns a canonical string: no UI calculation ever runs on a
 * binary float.
 *
 * Two strictness levels, deliberately separated:
 *
 * * strict — {@link hoursToHundredths}, {@link normalizeHours}, the arithmetic
 *   helpers and {@link parseHoursField}: reject a third decimal place instead of
 *   silently rounding it. Use for anything the UI *sends* or computes.
 * * lenient — {@link roundToHundredths}, {@link HoursSchema} and
 *   {@link SignedHoursSchema}: round half-up (away from zero) to two places.
 *   Use for anything the backend *sends*, since a `float` column can hand back
 *   `2.9000000000000004` or a `-8.8e-16` difference artifact, and a hard failure
 *   there would break the view rather than the payload.
 */

import { z } from "zod";

/** Decimal places every hour value is normalized to. */
export const HOURS_DECIMAL_PLACES = 2;

/** Integer hundredths in one hour — the internal calculation unit. */
export const HUNDREDTHS_PER_HOUR = 100;

/** Total significant digits of the backend `NUMERIC(8, 2)` hour column. */
export const HOURS_PRECISION = 8;

/** Largest whole-hour part the backend column can store (`999999.99`). */
export const MAX_HOURS_WHOLE_PART = 999999;

/** `999999.99` expressed in hundredths — the input range bound. */
export const MAX_HOURS_HUNDREDTHS = 99999999;

/** Canonical non-negative hour string, e.g. `"0.00"` / `"2.50"`. */
export const CANONICAL_HOURS_PATTERN = /^\d{1,6}\.\d{2}$/;

/** Canonical signed hour difference, e.g. `"-4.00"` (never `"-0.00"`). */
export const CANONICAL_SIGNED_HOURS_PATTERN = /^-?\d{1,6}\.\d{2}$/;

/** Either API representation of an hour value: canonical string or JSON number. */
export type HourValue = string | number;

/**
 * An hour value as an integer number of hundredths (`"2.50"` → `250`).
 *
 * Alias of `number` for documentation only: hundredths and hours are both
 * numbers, so never pass one where the other is expected — the helper names
 * say which unit they take.
 */
export type HourHundredths = number;

/** Raised when a value cannot be a canonical two-place hour value. */
export class InvalidHoursError extends Error {
  readonly value: unknown;

  constructor(message: string, value: unknown) {
    super(message);
    this.name = "InvalidHoursError";
    this.value = value;
  }
}

// Optional-dot rather than an optional `(\.\d+)` group: a nested optional
// repetition trips the `security/detect-unsafe-regex` heuristic even though it
// cannot backtrack here. `matchDecimalText` rejects the trailing dot the looser
// shape would otherwise admit.
const DECIMAL_HOURS_PATTERN = /^([+-]?)(\d{1,25})\.?(\d{0,25})$/;

/** Smallest magnitude `Number.prototype.toFixed` cannot expand (it emits `1e+21`). */
const EXPONENT_EXPANSION_LIMIT = 1e21;

/** Decimal places `toFixed` expands an exponent-notation number to. */
const EXPONENT_EXPANSION_DIGITS = 20;

type DecimalParts = {
  readonly negative: boolean;
  readonly whole: number;
  readonly fraction: string;
};

/**
 * Split exponent-free decimal text into sign, whole part and fraction digits,
 * or `null` when the text is not a decimal number at all. The range of the
 * whole part is the caller's decision, because a rejected value is an exception
 * on the contract path and a reason code on the form path.
 */
function matchDecimalText(text: string): DecimalParts | null {
  const match = DECIMAL_HOURS_PATTERN.exec(text);
  // A trailing dot with no fraction digits (`"2."`) matches the pattern above
  // but is not a decimal number.
  if (!match || text.endsWith(".")) return null;
  const [, sign, wholeText, fraction] = match;
  return { negative: sign === "-", whole: Number(wholeText), fraction };
}

function signedHundredths(negative: boolean, magnitude: number): HourHundredths {
  // Never return `-0`: the canonical string of a zero difference is `"0.00"`.
  if (magnitude === 0) return 0;
  return negative ? -magnitude : magnitude;
}

/** How much rounding the conversion is allowed to do. */
type HoursConversionMode = "exact" | "rounded";

/**
 * Outcome of converting an hour value, so the same pipeline can back both the
 * throwing helpers and the Zod schemas (which report issues instead).
 */
type HoursOutcome =
  | { readonly ok: true; readonly hundredths: HourHundredths }
  | { readonly ok: false; readonly message: string };

function outOfRange(text: string): HoursOutcome {
  return {
    ok: false,
    message: `Hour value is out of range (max ${MAX_HOURS_WHOLE_PART}.99): ${text}.`
  };
}

/**
 * The single validation pipeline: sign/whole/fraction from either accepted
 * representation, then integer hundredths.
 *
 * A `float` from the backend may stringify as `1e-7`, which carries no decimal
 * point to parse; `toFixed` expands it far enough for a value that can only
 * round to `0.00`. Magnitudes at or above `1e21` are out of range for the hour
 * column anyway and are rejected rather than expanded.
 */
function hundredthsOutcome(value: HourValue, mode: HoursConversionMode): HoursOutcome {
  let text: string;
  if (typeof value === "string") {
    text = value.trim();
  } else if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return { ok: false, message: `Hour value must be finite: ${String(value)}.` };
    }
    const rendered = String(value);
    if (!rendered.includes("e") && !rendered.includes("E")) {
      text = rendered;
    } else if (Math.abs(value) >= EXPONENT_EXPANSION_LIMIT) {
      return outOfRange(rendered);
    } else {
      text = value.toFixed(EXPONENT_EXPANSION_DIGITS);
    }
  } else {
    return {
      ok: false,
      message: `Hour value must be a decimal string or a number, received ${typeof value}.`
    };
  }

  const parts = matchDecimalText(text);
  if (!parts) {
    return { ok: false, message: `Not a valid decimal hour value: ${text}.` };
  }
  if (parts.whole > MAX_HOURS_WHOLE_PART) return outOfRange(text);

  if (mode === "exact") {
    if (parts.fraction.length > HOURS_DECIMAL_PLACES) {
      return {
        ok: false,
        message:
          `Hour value must have at most ${HOURS_DECIMAL_PLACES} decimal places: ` +
          `${text}. Round it explicitly to keep the calculation exact.`
      };
    }
    const magnitude =
      parts.whole * HUNDREDTHS_PER_HOUR +
      Number(parts.fraction.padEnd(HOURS_DECIMAL_PLACES, "0"));
    return { ok: true, hundredths: signedHundredths(parts.negative, magnitude) };
  }

  const kept = parts.fraction
    .slice(0, HOURS_DECIMAL_PLACES)
    .padEnd(HOURS_DECIMAL_PLACES, "0");
  let magnitude = parts.whole * HUNDREDTHS_PER_HOUR + Number(kept);
  // ROUND_HALF_UP: the third place decides, ties round away from zero.
  if (parts.fraction.charAt(HOURS_DECIMAL_PLACES) >= "5") magnitude += 1;
  if (magnitude > MAX_HOURS_HUNDREDTHS) return outOfRange(text);
  return { ok: true, hundredths: signedHundredths(parts.negative, magnitude) };
}

function unwrapHundredths(value: HourValue, mode: HoursConversionMode): HourHundredths {
  const outcome = hundredthsOutcome(value, mode);
  if (!outcome.ok) throw new InvalidHoursError(outcome.message, value);
  return outcome.hundredths;
}

/**
 * Convert an hour value to integer hundredths, rejecting anything the contract
 * does not allow (a third decimal place, a non-finite number, out-of-range).
 *
 * Signed input is accepted so the same helper can read a difference field; the
 * non-negativity rule belongs to the schema or form validating that field.
 */
export function hoursToHundredths(value: HourValue): HourHundredths {
  return unwrapHundredths(value, "exact");
}

/**
 * Convert an hour value to integer hundredths, rounding extra places half-up
 * (away from zero, matching the backend's `ROUND_HALF_UP` quantization).
 */
export function roundToHundredths(value: HourValue): HourHundredths {
  return unwrapHundredths(value, "rounded");
}

/** Render integer hundredths as the canonical decimal string (`250` → `"2.50"`). */
export function hundredthsToHours(hundredths: HourHundredths): string {
  if (!Number.isSafeInteger(hundredths)) {
    throw new InvalidHoursError(
      `Hundredths must be a safe integer: ${String(hundredths)}.`,
      hundredths
    );
  }
  const magnitude = Math.abs(hundredths);
  const whole = Math.trunc(magnitude / HUNDREDTHS_PER_HOUR);
  const fraction = magnitude % HUNDREDTHS_PER_HOUR;
  const sign = hundredths < 0 ? "-" : "";
  return `${sign}${whole}.${String(fraction).padStart(HOURS_DECIMAL_PLACES, "0")}`;
}

/** Normalize an hour value to its canonical decimal string, strictly. */
export function normalizeHours(value: HourValue): string {
  return hundredthsToHours(hoursToHundredths(value));
}

/** Add two hour values exactly; returns a canonical decimal string. */
export function addHours(left: HourValue, right: HourValue): string {
  return hundredthsToHours(hoursToHundredths(left) + hoursToHundredths(right));
}

/**
 * Subtract `right` from `left` exactly; the result may be a signed difference
 * such as `"-4.00"`.
 */
export function subtractHours(left: HourValue, right: HourValue): string {
  return hundredthsToHours(hoursToHundredths(left) - hoursToHundredths(right));
}

/** Sum hour values exactly; an empty list totals `"0.00"`. */
export function sumHours(values: readonly HourValue[]): string {
  const total = values.reduce<HourHundredths>(
    (accumulator, value) => accumulator + hoursToHundredths(value),
    0
  );
  return hundredthsToHours(total);
}

/**
 * Multiply an hour value by a whole count — the §3.1 balance formulas
 * (`group hours × linked groups`, `teacher hours × required teachers`).
 */
export function multiplyHours(value: HourValue, count: number): string {
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new InvalidHoursError(
      `Hour multiplier must be a non-negative integer count: ${String(count)}.`,
      count
    );
  }
  return hundredthsToHours(hoursToHundredths(value) * count);
}

/** Compare two hour values at two-place precision: `-1`, `0` or `1`. */
export function compareHours(left: HourValue, right: HourValue): -1 | 0 | 1 {
  const difference = hoursToHundredths(left) - hoursToHundredths(right);
  if (difference < 0) return -1;
  if (difference > 0) return 1;
  return 0;
}

/** True when both values are the same hour quantity at two-place precision. */
export function hoursEqual(left: HourValue, right: HourValue): boolean {
  return compareHours(left, right) === 0;
}

/** Sign of an hour value: `-1` below zero, `0` at zero, `1` above. */
export function hoursSign(value: HourValue): -1 | 0 | 1 {
  return compareHours(value, 0);
}

/** Why a typed hour field is not acceptable; maps to an i18n message key. */
export type HoursFieldError =
  | "not_a_number"
  | "too_many_decimals"
  | "negative"
  | "out_of_range";

/**
 * Outcome of reading an hour form field.
 *
 * `unset` is a first-class state, distinct from `"0.00"`: a blank group-subject
 * hour means "inherit the subject default" (the backend stores `NULL`), while a
 * typed `0` is a real zero. No form may collapse the two.
 */
export type HoursFieldParseResult =
  | { readonly state: "unset" }
  | { readonly state: "valid"; readonly hours: string; readonly hundredths: HourHundredths }
  | { readonly state: "invalid"; readonly reason: HoursFieldError };

/**
 * Read a raw hour input string without throwing, keeping "unset" distinct from
 * zero and never parsing through a binary float.
 */
export function parseHoursField(raw: string): HoursFieldParseResult {
  const text = raw.trim();
  if (text.length === 0) return { state: "unset" };

  const parts = matchDecimalText(text);
  if (!parts) return { state: "invalid", reason: "not_a_number" };
  if (parts.fraction.length > HOURS_DECIMAL_PLACES) {
    return { state: "invalid", reason: "too_many_decimals" };
  }
  if (parts.whole > MAX_HOURS_WHOLE_PART) {
    return { state: "invalid", reason: "out_of_range" };
  }
  const hundredths =
    parts.whole * HUNDREDTHS_PER_HOUR +
    Number(parts.fraction.padEnd(HOURS_DECIMAL_PLACES, "0"));
  if (parts.negative && hundredths > 0) {
    return { state: "invalid", reason: "negative" };
  }
  return { state: "valid", hours: hundredthsToHours(hundredths), hundredths };
}

/**
 * Render a stored hour value for an hour input, mapping "unset" (`null` /
 * `undefined`) to an empty field rather than to `"0.00"`.
 */
export function formatHoursField(value: HourValue | null | undefined): string {
  if (value == null) return "";
  return normalizeHours(value);
}

const hourValueSchema = z.union([z.string(), z.number()]);

function tolerantHoursSchema(allowNegative: boolean) {
  return hourValueSchema.transform((value, ctx) => {
    const outcome = hundredthsOutcome(value, "rounded");
    if (!outcome.ok) {
      ctx.addIssue(outcome.message);
      return z.NEVER;
    }
    if (!allowNegative && outcome.hundredths < 0) {
      ctx.addIssue(
        `Hour value must be non-negative: ${hundredthsToHours(outcome.hundredths)}.`
      );
      return z.NEVER;
    }
    return hundredthsToHours(outcome.hundredths);
  });
}

/**
 * A non-negative hour quantity as the backend sends it — canonical string today
 * on computed schemas, JSON number today on entity schemas — normalized to a
 * canonical string. Compose with `.nullable()` for an optional hour field.
 */
export const HoursSchema = tolerantHoursSchema(false);
export type Hours = z.infer<typeof HoursSchema>;

/** A signed hour difference (`planned − target`), normalized to a canonical string. */
export const SignedHoursSchema = tolerantHoursSchema(true);
export type SignedHours = z.infer<typeof SignedHoursSchema>;

/**
 * Strict canonical non-negative hour string — exactly two decimal places and
 * within the backend column range. Use where the canonical form itself is the
 * contract: request payloads the UI builds, and assertions that a response is
 * already canonical.
 */
export const CanonicalHoursSchema = z
  .string()
  .regex(
    CANONICAL_HOURS_PATTERN,
    `Hours must be a canonical two-decimal string such as "2.50".`
  );
export type CanonicalHours = z.infer<typeof CanonicalHoursSchema>;

/** Strict canonical signed hour difference; `"-0.00"` is not canonical. */
export const CanonicalSignedHoursSchema = z
  .string()
  .regex(
    CANONICAL_SIGNED_HOURS_PATTERN,
    `Hour differences must be a canonical two-decimal string such as "-4.00".`
  )
  .refine((value) => value !== "-0.00", {
    message: `A zero difference must be "0.00", not "-0.00".`
  });
export type CanonicalSignedHours = z.infer<typeof CanonicalSignedHoursSchema>;
