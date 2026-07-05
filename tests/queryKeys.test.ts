import { describe, expect, it } from "vitest";
import {
  normalizeListParams,
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
});
