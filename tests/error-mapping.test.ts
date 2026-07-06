import { describe, expect, it } from "vitest";
import {
  EMPTY_REPARTO_MAPPED_ERROR,
  describeErrorKey,
  findFieldError,
  mapRepartoError
} from "../src/runtime/errorMapping.js";
import {
  RepartoApiError,
  RepartoUnauthenticatedError
} from "../src/runtime/errors.js";

const translate = (key: string) => `[${key}]`;

describe("mapRepartoError", () => {
  it("returns the unauthenticated branch with errorKey=unauthorized", () => {
    const mapped = mapRepartoError(new RepartoUnauthenticatedError("expired"));
    expect(mapped.fieldErrors).toEqual([]);
    expect(mapped.formError?.errorKey).toBe("unauthorized");
    expect(mapped.formError?.message).toBe("expired");
  });

  it("maps a 422 validation list with loc tuples to per-field errors", () => {
    const err = new RepartoApiError(422, [
      { loc: ["body", "name"], msg: "field required", type: "value_error" },
      { loc: ["body", "start_date"], msg: "invalid date", type: "value_error" }
    ]);
    const mapped = mapRepartoError(err);
    expect(mapped.formError).toBeNull();
    expect(mapped.fieldErrors).toHaveLength(2);
    expect(mapped.fieldErrors[0]).toEqual({
      field: "name",
      message: "field required",
      errorKey: "required"
    });
    expect(mapped.fieldErrors[1].field).toBe("startDate");
    expect(findFieldError(mapped, "name")?.message).toBe("field required");
  });

  it("falls back to a form-level error when a 422 entry's loc has no alias match", () => {
    const err = new RepartoApiError(422, [
      { loc: ["body", "mystery_field"], msg: "invalid", type: "value_error" }
    ]);
    const mapped = mapRepartoError(err);
    expect(mapped.fieldErrors).toEqual([]);
    expect(mapped.formError?.message).toBe("invalid");
  });

  it("ignores non-string loc segments and falls back to a form-level error", () => {
    const err = new RepartoApiError(422, [
      { loc: [0, 1], msg: "boom", type: "value_error" }
    ]);
    const mapped = mapRepartoError(err);
    expect(mapped.fieldErrors).toEqual([]);
    expect(mapped.formError?.message).toBe("boom");
  });

  it("skips 422 entries that are not records or have no msg and falls through to a generic form error", () => {
    const err = new RepartoApiError(422, [
      "string-entry",
      { loc: ["body", "name"] },
      { loc: ["body", "display_name"], msg: "display_name required" }
    ]);
    const mapped = mapRepartoError(err);
    expect(mapped.fieldErrors).toEqual([
      {
        field: "displayName",
        message: "display_name required",
        errorKey: "required"
      }
    ]);
  });

  it("returns a generic form error when 422 entries produce no field errors", () => {
    const err = new RepartoApiError(422, [
      { loc: ["body", "name"], msg: "x" },
      { loc: ["body", "name"], msg: "y" }
    ]);
    const mapped = mapRepartoError(err);
    expect(mapped.fieldErrors).toEqual([
      { field: "name", message: "x", errorKey: "required" },
      { field: "name", message: "y", errorKey: "required" }
    ]);
  });

  it("returns the fallback detail message when an ApiError has no mappable detail", () => {
    const err = new RepartoApiError(400, null);
    const mapped = mapRepartoError(err);
    expect(mapped.formError?.errorKey).toBe("server");
    expect(mapped.formError?.message).toBe("Reparto API request failed");
  });

  it("classifies detail arrays (422) without loc keys as the generic required error", () => {
    const err = new RepartoApiError(422, [{ msg: "missing", type: "value_error" }]);
    const mapped = mapRepartoError(err);
    expect(mapped.formError?.message).toBe("missing");
    expect(mapped.formError?.errorKey).toBe("required");
  });

  it("returns the unauthenticated error when detail string is empty (no message)", () => {
    const err = new RepartoApiError(400, "");
    const mapped = mapRepartoError(err);
    expect(mapped.formError?.errorKey).toBe("server");
    expect(mapped.formError?.message).toBe("Reparto API request failed");
  });

  it("returns the generic server error for an ApiError with non-string non-array detail", () => {
    const err = new RepartoApiError(500, { unexpected: true });
    const mapped = mapRepartoError(err);
    expect(mapped.formError?.errorKey).toBe("server");
  });

  it("returns the empty form error message for a 422 with no entries", () => {
    const err = new RepartoApiError(422, []);
    const mapped = mapRepartoError(err);
    expect(mapped.fieldErrors).toEqual([]);
    expect(mapped.formError?.errorKey).toBe("required");
  });

  it("returns the first matching message when a 422 list has only entries without loc", () => {
    const err = new RepartoApiError(422, [
      { msg: "first" },
      { msg: "second" }
    ]);
    const mapped = mapRepartoError(err);
    expect(mapped.formError?.message).toBe("first");
  });

  it("falls back to a form-level error when a 422 entry has no mappable loc", () => {
    const err = new RepartoApiError(422, [
      { loc: [], msg: "global failure", type: "value_error" }
    ]);
    const mapped = mapRepartoError(err);
    expect(mapped.fieldErrors).toEqual([]);
    expect(mapped.formError?.message).toBe("global failure");
  });

  it("classifies 409 as conflict", () => {
    const err = new RepartoApiError(409, "Auth user is already linked");
    const mapped = mapRepartoError(err);
    expect(mapped.formError?.errorKey).toBe("conflict");
  });

  it("classifies 404 as fkMissing", () => {
    const err = new RepartoApiError(404, "School not found");
    const mapped = mapRepartoError(err);
    expect(mapped.formError?.errorKey).toBe("fkMissing");
  });

  it("classifies 401 as unauthorized", () => {
    const err = new RepartoApiError(401, "Session expired");
    const mapped = mapRepartoError(err);
    expect(mapped.formError?.errorKey).toBe("unauthorized");
  });

  it("classifies 403 as permission", () => {
    const err = new RepartoApiError(403, { detail: "forbidden" });
    const mapped = mapRepartoError(err);
    expect(mapped.formError?.errorKey).toBe("permission");
  });

  it("classifies 400 with a date-related detail as invalidDate", () => {
    const err = new RepartoApiError(400, "end_date must be after start_date");
    const mapped = mapRepartoError(err);
    expect(mapped.formError?.errorKey).toBe("invalidDate");
  });

  it("classifies 400 with a unique-slug detail as duplicate", () => {
    const err = new RepartoApiError(400, "Could not create department: slug is not unique");
    const mapped = mapRepartoError(err);
    expect(mapped.formError?.errorKey).toBe("duplicate");
  });

  it("classifies 400 with a not-found detail as fkMissing", () => {
    const err = new RepartoApiError(400, "School does not exist");
    const mapped = mapRepartoError(err);
    expect(mapped.formError?.errorKey).toBe("fkMissing");
  });

  it("classifies 400 with a permission detail as permission", () => {
    const err = new RepartoApiError(400, "Action not allowed for this role");
    const mapped = mapRepartoError(err);
    expect(mapped.formError?.errorKey).toBe("permission");
  });

  it("falls through to server when a 400 detail matches no specific pattern", () => {
    const err = new RepartoApiError(400, "Something unclassified happened");
    const mapped = mapRepartoError(err);
    expect(mapped.formError?.errorKey).toBe("server");
  });

  it("classifies an unknown 500 as server", () => {
    const err = new RepartoApiError(500, "boom");
    const mapped = mapRepartoError(err);
    expect(mapped.formError?.errorKey).toBe("server");
  });

  it("falls back to network on a TypeError (fetch failure)", () => {
    const mapped = mapRepartoError(new TypeError("fetch failed"));
    expect(mapped.formError?.errorKey).toBe("network");
  });

  it("uses the networkFallback string when provided", () => {
    const mapped = mapRepartoError(new TypeError("x"), {
      networkFallback: "fallback"
    });
    expect(mapped.formError?.message).toBe("fallback");
  });

  it("falls back to server on a plain Error", () => {
    const mapped = mapRepartoError(new Error("bad"));
    expect(mapped.formError?.errorKey).toBe("server");
    expect(mapped.formError?.message).toBe("bad");
  });

  it("handles a non-error unknown value as a generic server error", () => {
    const mapped = mapRepartoError("nope");
    expect(mapped.formError?.errorKey).toBe("server");
    expect(mapped.formError?.message).toBe("Unknown error");
  });

  it("returns the EMPTY_REPARTO_MAPPED_ERROR shape for mapped.fieldErrors and formError", () => {
    expect(EMPTY_REPARTO_MAPPED_ERROR).toEqual({
      fieldErrors: [],
      formError: null
    });
  });
});

describe("describeErrorKey", () => {
  it("translates every known error key through the i18n dictionary", () => {
    const keys = [
      "required",
      "duplicate",
      "duplicateScoped",
      "fkMissing",
      "fkViolation",
      "invalidDate",
      "processState",
      "permission",
      "unauthorized",
      "network",
      "server",
      "conflict"
    ] as const;
    for (const key of keys) {
      expect(describeErrorKey(key, translate)).toBe(`[error.${key}]`);
    }
  });

  it("returns an empty string for an undefined key", () => {
    expect(describeErrorKey(undefined, translate)).toBe("");
  });

  it("returns the empty fallback when the key is not in the dictionary", () => {
    expect(describeErrorKey("mystery" as never, translate)).toBe("");
  });
});