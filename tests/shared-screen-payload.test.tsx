// @vitest-environment jsdom
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetRepartoConfig } from "../src/runtime/config.js";
import {
  AssignmentSummarySchema,
  ProcessSummarySchema
} from "../src/runtime/schemas.js";
import {
  repartoUser,
  resetRepartoAuthAdapter,
  signInReparto
} from "./support/session.js";

/**
 * The second half of §21.9's frontend list: *the shared/projector screen's
 * network payload never contains per-teacher `display_name`/`has_override`.*
 *
 * `RBAC-07` was not that the screen displayed a name — it did not — but that it
 * fetched every participant's name and hours to a machine pointed at a room. A
 * redaction applied after arrival is one refactor away from not being applied,
 * so the claim is about the wire, and it is asserted on the wire: the requests
 * this view actually issues, and the bodies those requests actually carry.
 *
 * The event stream is mocked out. It is a separate role-tiered surface with its
 * own audience gate (`?audience=shared_screen`), proven in `react-sse.test.ts`;
 * leaving it live here would only add a long-lived fetch to the recording.
 */

const processId = "11111111-1111-4111-8111-111111111111";
const now = "2026-08-06T10:00:00Z";

const processBody = {
  id: processId,
  academic_year_id: "44444444-4444-4444-8444-444444444444",
  school_id: "55555555-5555-4555-8555-555555555555",
  department_id: "66666666-6666-4666-8666-666666666666",
  status: "meeting_open",
  default_teacher_hours_reference: null,
  selection_order_enabled: false,
  selection_order_mode: "none",
  direct_teacher_selection_enabled: true,
  lan_access_enabled: true,
  created_from_process_id: null,
  closed_at: null,
  closed_by_user_id: null,
  created_by_user_id: "77777777-7777-4777-8777-777777777777",
  created_at: now,
  updated_at: now
};

/** The aggregate the projector screen reads. It names nobody, by construction. */
const summaryBody = {
  process_id: processId,
  generated_at: now,
  readiness: "ready",
  plan_status: "locked",
  plan_balance: {
    teaching_plan_id: "99999999-9999-4999-8999-999999999999",
    assignment_process_id: processId,
    group: {
      total_group_load: "120.00",
      allocated_group_weekly_hours: "120.00",
      allocation_difference: "0.00",
      is_balanced: true
    },
    teacher: {
      total_teacher_load: "124.00",
      participant_target_total: "124.00",
      teacher_load_difference: "0.00",
      is_balanced: true
    },
    is_exact: true
  },
  total_slots: 10,
  assigned_slots: 4,
  available_slots: 6,
  current_turn: {
    meeting_session_id: "22222222-2222-4222-8222-222222222222",
    selection_turn_id: "33333333-3333-4333-8333-333333333333",
    process_teacher_id: "44444444-4444-4444-8444-4444444444aa",
    position: 2,
    status: "active",
    started_at: now
  },
  blocking_validation_count: 0
};

/** The name a regressed or dashboard-reading screen would have pulled down. */
const teacherName = "Ada Lovelace";

const requested: string[] = [];
const served: unknown[] = [];

function jsonResponse(body: unknown, status = 200): Response {
  served.push(body);
  return {
    ok: status < 400,
    status,
    clone() {
      return this;
    },
    async json() {
      return body;
    },
    async text() {
      return JSON.stringify(body);
    }
  } as unknown as Response;
}

const fetchMock = vi.fn(async (input: unknown) => {
  const url = String(input);
  requested.push(url);
  if (url.includes("/summary")) return jsonResponse(summaryBody);
  if (/\/assignment-processes(\?|$)/.test(url)) {
    return jsonResponse({ data: [processBody], count: 1 });
  }
  // Anything else is a request this screen should not be making; it is recorded
  // above and answered with a 404 rather than a throw, so the assertion that
  // fails is the one naming the unexpected URL.
  return jsonResponse({ detail: "not found" }, 404);
});

vi.mock("../src/runtime/react/useRepartoEvents.js", () => ({
  useRepartoEventStream: () => ({
    connectionState: "disconnected",
    error: null,
    lastEventAtMs: null,
    lastEventType: null
  })
}));

/** Every key appearing anywhere in a payload, however deeply nested. */
function deepKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const item of value) deepKeys(item, keys);
  } else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      keys.add(key);
      deepKeys(child, keys);
    }
  }
  return keys;
}

async function renderSharedScreen() {
  const { RepartoSharedView } = await import(
    "../src/runtime/react/default-ui/index.js"
  );
  const result = render(
    <RepartoSharedView
      config={{ apiBase: "/api", apiPrefix: "/reparto" }}
      locale="en"
      processId={processId}
    />
  );
  await waitFor(() =>
    expect(
      document.querySelector('[data-reparto-route="shared-screen"]')
    ).not.toBeNull()
  );
  return result;
}

beforeEach(() => {
  requested.length = 0;
  served.length = 0;
  resetRepartoConfig();
  fetchMock.mockClear();
  vi.stubGlobal("fetch", fetchMock);
  // The most privileged session there is: the redaction under test is a
  // property of the screen, not of the role looking at it. A projector is
  // usually signed in as whoever set the room up.
  signInReparto(repartoUser("admin"));
});

afterEach(() => {
  cleanup();
  resetRepartoAuthAdapter();
  resetRepartoConfig();
  vi.unstubAllGlobals();
});

describe("shared screen — what the projector actually fetches", () => {
  it("asks for the aggregate summary and never for the dashboard", async () => {
    await renderSharedScreen();

    expect(requested.some((url) => url.includes(`/${processId}/summary`))).toBe(true);
    expect(requested.some((url) => url.includes("/dashboard"))).toBe(false);
  });

  it("asks for no per-teacher collection at all", async () => {
    await renderSharedScreen();

    // The four endpoints that carry an identified teacher. None of them is the
    // screen's to call: the aggregate answers every question a room asks.
    for (const forbidden of [
      "/dashboard",
      "/teachers",
      "/teacher-profiles",
      "/lan/"
    ]) {
      expect(
        requested.filter((url) => url.includes(forbidden)),
        forbidden
      ).toEqual([]);
    }
  });

  it("receives no per-teacher field on any response it does get", async () => {
    await renderSharedScreen();

    expect(served.length).toBeGreaterThan(0);
    const keys = deepKeys(served);
    expect(keys.has("display_name")).toBe(false);
    expect(keys.has("has_override")).toBe(false);
    // The identifying hour fields travel with the name on the dashboard's
    // participant rows; none of them arrives here either.
    expect(keys.has("assigned_weekly_hours")).toBe(false);
    expect(keys.has("remaining_weekly_hours")).toBe(false);
  });

  it("renders the meeting state without a name anywhere in the document", async () => {
    await renderSharedScreen();

    expect(document.body.textContent).not.toContain(teacherName);
    // The turn is shown by position, because the aggregate carries no name to
    // show and this screen must not learn one.
    expect(
      document.querySelector('[data-reparto-panel="turn-state"]')
    ).not.toBeNull();
  });
});

describe("shared screen — the aggregate endpoint is the boundary, not the client", () => {
  it("admits no identifying field into the summary schema", () => {
    // `.strict()` is what makes "aggregate at the endpoint" enforceable: a
    // service that started returning participant rows on `/summary` would fail
    // the parse rather than quietly hand them to a screen in a staff room.
    expect(Object.keys(ProcessSummarySchema.shape)).not.toContain("participants");
    expect(
      ProcessSummarySchema.safeParse({
        ...summaryBody,
        participants: [{ display_name: teacherName }]
      }).success
    ).toBe(false);
    expect(
      ProcessSummarySchema.safeParse({ ...summaryBody, has_override: true }).success
    ).toBe(false);
  });

  it("keeps the identified rows on the dashboard's own section", () => {
    // The contrast is the point: the identifying rows still exist, on the
    // department-head payload, which is why the screen calls the other endpoint.
    expect(Object.keys(AssignmentSummarySchema.shape)).toContain("participants");
    const parsed = ProcessSummarySchema.parse(summaryBody);
    expect(deepKeys(parsed).has("display_name")).toBe(false);
  });

  it("carries no `has_override` anywhere in the client contract", () => {
    // The field was removed with the three-stage rewrite (§21.8 shared-screen
    // item); this pins that it stays removed rather than returning as a
    // per-participant flag the screen would have to remember to drop.
    expect(deepKeys(ProcessSummarySchema.parse(summaryBody)).has("has_override")).toBe(
      false
    );
  });
});
