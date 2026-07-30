import { describe, expect, it } from "vitest";
import {
  addHours,
  CANONICAL_HOURS_PATTERN,
  CANONICAL_SIGNED_HOURS_PATTERN,
  CanonicalHoursSchema,
  CanonicalSignedHoursSchema,
  compareHours,
  formatHoursField,
  HOURS_DECIMAL_PLACES,
  HOURS_PRECISION,
  hoursEqual,
  HoursSchema,
  hoursSign,
  hoursToHundredths,
  HUNDREDTHS_PER_HOUR,
  hundredthsToHours,
  InvalidHoursError,
  MAX_HOURS_HUNDREDTHS,
  MAX_HOURS_WHOLE_PART,
  multiplyHours,
  normalizeHours,
  parseHoursField,
  roundToHundredths,
  SignedHoursSchema,
  subtractHours,
  sumHours,
  type HourValue
} from "../src/runtime/decimals.js";

/** Cast for the runtime type guard, which TypeScript alone cannot reach. */
function asHourValue(value: unknown): HourValue {
  return value as HourValue;
}

describe("decimal-hour contract constants", () => {
  it("mirrors the backend NUMERIC(8, 2) hour column", () => {
    expect(HOURS_DECIMAL_PLACES).toBe(2);
    expect(HUNDREDTHS_PER_HOUR).toBe(100);
    expect(HOURS_PRECISION).toBe(8);
    expect(MAX_HOURS_WHOLE_PART).toBe(999999);
    expect(MAX_HOURS_HUNDREDTHS).toBe(99999999);
    expect(`${String(MAX_HOURS_WHOLE_PART)}.99`).toMatch(CANONICAL_HOURS_PATTERN);
  });

  it("accepts canonical strings only", () => {
    expect(CANONICAL_HOURS_PATTERN.test("2.50")).toBe(true);
    expect(CANONICAL_HOURS_PATTERN.test("0.00")).toBe(true);
    expect(CANONICAL_HOURS_PATTERN.test("2.5")).toBe(false);
    expect(CANONICAL_HOURS_PATTERN.test("-2.50")).toBe(false);
    expect(CANONICAL_HOURS_PATTERN.test("1234567.50")).toBe(false);
    expect(CANONICAL_SIGNED_HOURS_PATTERN.test("-4.00")).toBe(true);
    expect(CANONICAL_SIGNED_HOURS_PATTERN.test("4.00")).toBe(true);
    expect(CANONICAL_SIGNED_HOURS_PATTERN.test("-4")).toBe(false);
  });
});

describe("hoursToHundredths", () => {
  it("reads both API representations exactly", () => {
    expect(hoursToHundredths("2.50")).toBe(250);
    expect(hoursToHundredths("2.5")).toBe(250);
    expect(hoursToHundredths("2")).toBe(200);
    expect(hoursToHundredths(2.5)).toBe(250);
    expect(hoursToHundredths(2)).toBe(200);
    expect(hoursToHundredths("  2.50  ")).toBe(250);
    expect(hoursToHundredths("+2.50")).toBe(250);
    expect(hoursToHundredths("0.07")).toBe(7);
    expect(hoursToHundredths(0.07)).toBe(7);
  });

  it("keeps signed differences and never returns negative zero", () => {
    expect(hoursToHundredths("-4.00")).toBe(-400);
    expect(hoursToHundredths(-4)).toBe(-400);
    expect(Object.is(hoursToHundredths("-0.00"), 0)).toBe(true);
  });

  it("accepts the column range bounds", () => {
    expect(hoursToHundredths("999999.99")).toBe(MAX_HOURS_HUNDREDTHS);
    expect(hoursToHundredths("0.00")).toBe(0);
  });

  it("rejects a third decimal place instead of rounding it", () => {
    expect(() => hoursToHundredths("2.505")).toThrow(InvalidHoursError);
    expect(() => hoursToHundredths("2.505")).toThrow(/at most 2 decimal places/);
    expect(() => hoursToHundredths(2.505)).toThrow(InvalidHoursError);
  });

  it("rejects values outside the column range", () => {
    expect(() => hoursToHundredths("1000000.00")).toThrow(/out of range/);
    expect(() => hoursToHundredths(1e21)).toThrow(/out of range/);
    expect(() => hoursToHundredths(-1e21)).toThrow(/out of range/);
  });

  it("rejects non-decimal input", () => {
    expect(() => hoursToHundredths("")).toThrow(/Not a valid decimal hour value/);
    expect(() => hoursToHundredths("abc")).toThrow(/Not a valid decimal hour value/);
    expect(() => hoursToHundredths(".5")).toThrow(/Not a valid decimal hour value/);
    expect(() => hoursToHundredths("2.")).toThrow(/Not a valid decimal hour value/);
    expect(() => hoursToHundredths("1,50")).toThrow(/Not a valid decimal hour value/);
  });

  it("rejects non-finite numbers and non-numeric types", () => {
    expect(() => hoursToHundredths(Number.NaN)).toThrow(/must be finite/);
    expect(() => hoursToHundredths(Number.POSITIVE_INFINITY)).toThrow(/must be finite/);
    expect(() => hoursToHundredths(asHourValue(true))).toThrow(
      /decimal string or a number, received boolean/
    );
    expect(() => hoursToHundredths(asHourValue(null))).toThrow(
      /decimal string or a number, received object/
    );
  });

  it("exposes the offending value on the error", () => {
    try {
      hoursToHundredths("2.505");
      expect.unreachable("expected InvalidHoursError");
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidHoursError);
      expect((error as InvalidHoursError).name).toBe("InvalidHoursError");
      expect((error as InvalidHoursError).value).toBe("2.505");
    }
  });
});

describe("roundToHundredths", () => {
  it("rounds half-up away from zero", () => {
    expect(roundToHundredths("2.505")).toBe(251);
    expect(roundToHundredths("2.504")).toBe(250);
    expect(roundToHundredths("-2.505")).toBe(-251);
    expect(roundToHundredths("0.999")).toBe(100);
    expect(roundToHundredths("2.50")).toBe(250);
    expect(roundToHundredths("2")).toBe(200);
  });

  it("absorbs binary float artifacts from the backend's float hour columns", () => {
    expect(roundToHundredths(2.9000000000000004)).toBe(290);
    expect(roundToHundredths(-8.881784197001252e-16)).toBe(0);
    expect(roundToHundredths(1e-7)).toBe(0);
  });

  it("still rejects malformed and out-of-range input", () => {
    expect(() => roundToHundredths("abc")).toThrow(InvalidHoursError);
    expect(() => roundToHundredths("1000000.00")).toThrow(/out of range/);
    expect(() => roundToHundredths("999999.999")).toThrow(/out of range/);
  });
});

describe("hundredthsToHours", () => {
  it("renders the canonical decimal string", () => {
    expect(hundredthsToHours(250)).toBe("2.50");
    expect(hundredthsToHours(0)).toBe("0.00");
    expect(hundredthsToHours(7)).toBe("0.07");
    expect(hundredthsToHours(100)).toBe("1.00");
    expect(hundredthsToHours(-400)).toBe("-4.00");
    expect(hundredthsToHours(MAX_HOURS_HUNDREDTHS)).toBe("999999.99");
  });

  it("rejects anything that is not a safe integer count of hundredths", () => {
    expect(() => hundredthsToHours(2.5)).toThrow(/safe integer/);
    expect(() => hundredthsToHours(Number.NaN)).toThrow(/safe integer/);
    expect(() => hundredthsToHours(Number.MAX_SAFE_INTEGER + 2)).toThrow(/safe integer/);
  });
});

describe("normalizeHours", () => {
  it("produces the canonical string from either representation", () => {
    expect(normalizeHours("2.5")).toBe("2.50");
    expect(normalizeHours(2)).toBe("2.00");
    expect(normalizeHours("-0.00")).toBe("0.00");
    expect(normalizeHours("999999.99")).toBe("999999.99");
  });
});

describe("hour arithmetic through integer hundredths", () => {
  it("adds and subtracts without binary error", () => {
    expect(addHours("0.10", "0.20")).toBe("0.30");
    expect(addHours(0.1, 0.2)).toBe("0.30");
    expect(subtractHours("116.00", "120.00")).toBe("-4.00");
    expect(subtractHours("120.00", "120.00")).toBe("0.00");
  });

  it("sums a list, with an empty list totalling zero", () => {
    expect(sumHours([])).toBe("0.00");
    expect(sumHours(["0.07", "0.07", "0.07"])).toBe("0.21");
    expect(sumHours([116, "2.00", "2.00"])).toBe("120.00");
  });

  it("multiplies an hour value by a whole count (§3.1 balance formulas)", () => {
    // Co-teaching: 2 activities × 2 hours × 2 teachers = 8 teacher-load hours.
    expect(multiplyHours("2.00", 2)).toBe("4.00");
    expect(sumHours([multiplyHours("2.00", 2), multiplyHours("2.00", 2)])).toBe("8.00");
    expect(multiplyHours("2.50", 0)).toBe("0.00");
    expect(multiplyHours("0.07", 3)).toBe("0.21");
  });

  it("rejects a non-integer or negative multiplier", () => {
    expect(() => multiplyHours("2.00", 1.5)).toThrow(/non-negative integer count/);
    expect(() => multiplyHours("2.00", -1)).toThrow(/non-negative integer count/);
    expect(() => multiplyHours("2.00", Number.NaN)).toThrow(/non-negative integer count/);
  });

  it("reproduces the plan's 120/124 dual-balance example", () => {
    const groupHours = sumHours(["116.00", multiplyHours("2.00", 1), multiplyHours("2.00", 1)]);
    const teacherLoad = sumHours(["116.00", multiplyHours("2.00", 2), multiplyHours("2.00", 2)]);
    expect(groupHours).toBe("120.00");
    expect(teacherLoad).toBe("124.00");
    expect(subtractHours(groupHours, "120.00")).toBe("0.00");
    expect(subtractHours(teacherLoad, "120.00")).toBe("4.00");
  });

  it("compares at two-place precision", () => {
    expect(compareHours("2.50", "2.5")).toBe(0);
    expect(compareHours("2.50", "2.51")).toBe(-1);
    expect(compareHours("2.51", "2.50")).toBe(1);
    expect(hoursEqual(2.5, "2.50")).toBe(true);
    expect(hoursEqual("2.50", "2.51")).toBe(false);
    expect(hoursSign("-4.00")).toBe(-1);
    expect(hoursSign("0.00")).toBe(0);
    expect(hoursSign("0.01")).toBe(1);
  });

  it("throws rather than silently rounding inside a calculation", () => {
    expect(() => addHours("2.505", "1.00")).toThrow(InvalidHoursError);
    expect(() => sumHours(["1.00", "2.505"])).toThrow(InvalidHoursError);
  });
});

describe("parseHoursField", () => {
  it("treats a blank field as unset, never as zero", () => {
    expect(parseHoursField("")).toEqual({ state: "unset" });
    expect(parseHoursField("   ")).toEqual({ state: "unset" });
    expect(parseHoursField("0")).toEqual({
      state: "valid",
      hours: "0.00",
      hundredths: 0
    });
  });

  it("returns canonical hours and hundredths for a valid entry", () => {
    expect(parseHoursField(" 2.5 ")).toEqual({
      state: "valid",
      hours: "2.50",
      hundredths: 250
    });
    expect(parseHoursField("999999.99")).toEqual({
      state: "valid",
      hours: "999999.99",
      hundredths: MAX_HOURS_HUNDREDTHS
    });
    expect(parseHoursField("-0.00")).toEqual({
      state: "valid",
      hours: "0.00",
      hundredths: 0
    });
  });

  it("reports why an entry is not acceptable without throwing", () => {
    expect(parseHoursField("abc")).toEqual({
      state: "invalid",
      reason: "not_a_number"
    });
    expect(parseHoursField("1,5")).toEqual({
      state: "invalid",
      reason: "not_a_number"
    });
    expect(parseHoursField("2.505")).toEqual({
      state: "invalid",
      reason: "too_many_decimals"
    });
    expect(parseHoursField("-2.50")).toEqual({
      state: "invalid",
      reason: "negative"
    });
    expect(parseHoursField("1000000.00")).toEqual({
      state: "invalid",
      reason: "out_of_range"
    });
  });
});

describe("formatHoursField", () => {
  it("maps unset to an empty field and a value to its canonical string", () => {
    expect(formatHoursField(null)).toBe("");
    expect(formatHoursField(undefined)).toBe("");
    expect(formatHoursField(0)).toBe("0.00");
    expect(formatHoursField("2.5")).toBe("2.50");
  });
});

describe("HoursSchema", () => {
  it("normalizes both backend representations to a canonical string", () => {
    expect(HoursSchema.parse("2.50")).toBe("2.50");
    expect(HoursSchema.parse(2.5)).toBe("2.50");
    expect(HoursSchema.parse(2)).toBe("2.00");
    expect(HoursSchema.parse(2.9000000000000004)).toBe("2.90");
    expect(HoursSchema.parse("2.505")).toBe("2.51");
  });

  it("rejects negative quantities and unusable values", () => {
    const negative = HoursSchema.safeParse("-2.50");
    expect(negative.success).toBe(false);
    expect(negative.error?.issues[0]?.message).toMatch(/must be non-negative: -2.50/);

    const malformed = HoursSchema.safeParse("abc");
    expect(malformed.success).toBe(false);
    expect(malformed.error?.issues[0]?.message).toMatch(/Not a valid decimal hour value/);

    expect(HoursSchema.safeParse(true).success).toBe(false);
    expect(HoursSchema.safeParse(null).success).toBe(false);
  });

  it("supports nullable hour fields for inherit-the-default columns", () => {
    const schema = HoursSchema.nullable();
    expect(schema.parse(null)).toBeNull();
    expect(schema.parse("1.00")).toBe("1.00");
  });
});

describe("SignedHoursSchema", () => {
  it("keeps signed differences and collapses negative zero", () => {
    expect(SignedHoursSchema.parse("-4.00")).toBe("-4.00");
    expect(SignedHoursSchema.parse(-4)).toBe("-4.00");
    expect(SignedHoursSchema.parse("-0.00")).toBe("0.00");
    expect(SignedHoursSchema.parse(-8.881784197001252e-16)).toBe("0.00");
  });

  it("still rejects unusable values", () => {
    const result = SignedHoursSchema.safeParse("--4.00");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/Not a valid decimal hour value/);
  });
});

describe("canonical string schemas", () => {
  it("accepts only the canonical two-decimal form", () => {
    expect(CanonicalHoursSchema.parse("2.50")).toBe("2.50");
    expect(CanonicalHoursSchema.safeParse("2.5").success).toBe(false);
    expect(CanonicalHoursSchema.safeParse(2.5).success).toBe(false);
    expect(CanonicalHoursSchema.safeParse("-2.50").success).toBe(false);
    expect(CanonicalHoursSchema.safeParse("1000000.00").success).toBe(false);
  });

  it("accepts a signed canonical difference but never negative zero", () => {
    expect(CanonicalSignedHoursSchema.parse("-4.00")).toBe("-4.00");
    expect(CanonicalSignedHoursSchema.parse("0.00")).toBe("0.00");
    const negativeZero = CanonicalSignedHoursSchema.safeParse("-0.00");
    expect(negativeZero.success).toBe(false);
    expect(negativeZero.error?.issues[0]?.message).toMatch(/must be "0.00"/);
  });
});
