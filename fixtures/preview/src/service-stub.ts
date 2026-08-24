// An in-memory stand-in for `reparto-docente-m8`, for the dev-only gallery.
//
// The gallery mounts the plugin's *real* views, so it needs a real transport:
// the views call hooks, the hooks call the api wrappers, and those wrappers
// `fetch` and then `schema.parse()` the response. Stubbing `fetch` is therefore
// the only seam that leaves every layer above it genuine — mock the hooks
// instead and the gallery stops showing the plugin and starts showing the mock.
//
// Two things are stubbed rather than one. Every reparto view sits behind
// `RepartoRouteGuard`, which reads the signed-in role from the auth adapter,
// so a transport stub alone would render nothing but the "no access" surface.
// The role is therefore switchable, which is also the honest way to show a
// plugin whose whole design is role-gated (§21.3).
import {
  setRepartoAuthAdapter,
  type RepartoRole
} from "../../../src/runtime/authAdapter.js";

const NOW = "2026-08-24T09:00:00Z";
const TODAY = "2026-09-01";
const SCHOOL_ID = "11111111-1111-4111-8111-111111111111";
const YEAR_ID = "22222222-2222-4222-8222-222222222222";
const DEPARTMENT_ID = "33333333-3333-4333-8333-333333333333";
const PROCESS_ID = "44444444-4444-4444-8444-444444444444";
const USER_ID = "55555555-5555-4555-8555-555555555555";

const SCHOOLS = [
  {
    id: SCHOOL_ID,
    name: "IES Gallery",
    locality: "Sample City",
    province: "Sample Province",
    region: "Sample Region",
    address: null,
    notes: null,
    created_at: NOW,
    updated_at: NOW
  }
];

const ACADEMIC_YEARS = [
  {
    id: YEAR_ID,
    label: "2026-2027",
    start_date: TODAY,
    end_date: "2027-06-30",
    status: "active",
    previous_academic_year_id: null,
    school_id: SCHOOL_ID,
    created_by_user_id: USER_ID,
    created_at: NOW,
    updated_at: NOW
  }
];

const DEPARTMENTS = [
  {
    id: DEPARTMENT_ID,
    school_id: SCHOOL_ID,
    name: "Mathematics",
    slug: "mathematics",
    department_head_user_id: USER_ID,
    notes: null,
    created_at: NOW,
    updated_at: NOW
  }
];

const PROCESSES = [
  {
    id: PROCESS_ID,
    academic_year_id: YEAR_ID,
    school_id: SCHOOL_ID,
    department_id: DEPARTMENT_ID,
    status: "draft",
    default_teacher_hours_reference: 18,
    selection_order_enabled: true,
    selection_order_mode: "seniority",
    direct_teacher_selection_enabled: false,
    lan_access_enabled: false,
    created_from_process_id: null,
    closed_at: null,
    closed_by_user_id: null,
    created_at: NOW,
    updated_at: NOW
  }
];

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function list(rows: unknown[]): Response {
  return json({ data: rows, count: rows.length });
}

/** Installs an adapter reporting the given role, so the route guards resolve. */
export function setStubRole(role: RepartoRole): void {
  setRepartoAuthAdapter({
    getAccessToken: () => "gallery-token",
    // Answered synchronously on purpose: an adapter that resolves on the first
    // render is what lets a gated view render at all without an effect.
    getCurrentUser: () => ({
      id: USER_ID,
      role,
      is_superuser: role === "superadmin"
    })
  });
}

/**
 * Replaces `globalThis.fetch` for the lifetime of the gallery page. Returns the
 * original so a caller can restore it.
 */
export function installServiceStub(): typeof globalThis.fetch {
  const original = globalThis.fetch;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(
      typeof input === "string" ? input : input instanceof URL ? input.href : input.url,
      window.location.origin
    );
    const method = (init?.method ?? "GET").toUpperCase();
    const path = url.pathname;

    // Latency, so the loading states in the gallery are reachable rather than
    // theoretical.
    await new Promise((resolve) => setTimeout(resolve, 120));

    if (path.endsWith("/meta")) {
      return json({
        contract_name: "reparto-docente-m8",
        contract_version: "2.0.0",
        service_version: "2.0.0",
        service_name: "reparto-docente-m8"
      });
    }
    if (path.endsWith("/ping")) return json({ success: true, msg: "pong" });

    if (path.includes("/schools/")) return list(SCHOOLS);
    if (path.includes("/academic-years/")) return list(ACADEMIC_YEARS);
    if (path.includes("/departments/")) return list(DEPARTMENTS);
    if (path.includes("/assignment-processes/")) return list(PROCESSES);
    if (path.includes("/teacher-profiles/")) return list([]);
    if (path.includes("/classroom-stages/")) return list([]);

    // Anything unrecognised answers 404 rather than hanging, so a gap in the
    // stub shows up as the plugin's own error surface instead of a spinner.
    return json({ detail: `No gallery stub for ${method} ${path}` }, 404);
  }) as typeof globalThis.fetch;

  return original;
}
