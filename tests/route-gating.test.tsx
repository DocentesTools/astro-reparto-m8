import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getRepartoDictionary } from "../src/runtime/i18n/index.js";
import { REPARTO_ROUTE_ACCESS } from "../src/runtime/routeAccess.js";
import type { RepartoRouteName } from "../src/runtime/routes.js";
import { REPARTO_ROLE_ORDER, type RepartoRole } from "../src/runtime/authAdapter.js";
import { renderRepartoRoute, repartoActions } from "./support/routes.js";
import {
  repartoUser,
  resetRepartoAuthAdapter,
  signInReparto
} from "./support/session.js";

/**
 * Every route in the §8.1 route map, against every role in the §21.1 table.
 *
 * The rule this file holds is the one the §21.8 route-gating item states: a
 * `USER`-role session renders no reparto view; a `READER` renders every one of
 * them and is offered no write affordance anywhere; a `WRITER` gains exactly the
 * own-data affordances (their own direct selection and turn, their own profile)
 * and nothing else; and every department-head affordance appears only at
 * `ADMIN`.
 *
 * The renders are static on purpose. The gate resolves synchronously for a
 * synchronous adapter, so one pass per role per route proves the whole matrix
 * without a jsdom event loop — and the asynchronous adapter, whose first paint
 * is the waiting state, is proven separately at the bottom.
 */

const processId = "11111111-1111-4111-8111-111111111111";
const profileId = "22222222-2222-4222-8222-222222222222";
const dict = getRepartoDictionary("en");

/** Process-rooted query scopes whose payload is a page, not a single object. */
const LIST_SCOPES = new Set([
  "subjects",
  "groups",
  "group-subjects",
  "teaching-activities",
  "requirements",
  "teachers",
  "assignments",
  "audit-events",
  "versions",
  "exports",
  "meeting-sessions",
  "allocation-revisions"
]);

const queryState = vi.hoisted(() => ({
  processes: [] as { id: string; status: string }[],
  teacherProfiles: [] as unknown[]
}));

vi.mock("@tanstack/react-query", () => ({
  QueryClient: class QueryClient {},
  QueryClientProvider: ({ children }: { children: ReactNode }) => children,
  useQuery: ({ queryKey }: { queryKey: readonly unknown[] }) => {
    const answer = (data: unknown) => ({
      data,
      error: null,
      isError: false,
      isLoading: false
    });
    const list = (rows: unknown[]) => answer({ data: rows, count: rows.length });
    const scope = queryKey[1];
    if (scope === "processes") {
      if (queryKey[2] === "list") return list(queryState.processes);
      // Process-rooted detail queries: the collection scopes answer with a
      // page, and every singular payload (dashboard, summary, plan, LAN) is
      // absent, which is a state each view already renders.
      const entityScope = queryKey[4];
      // A sub-scope (`…/assignments/validations`) is a report, never a page.
      if (queryKey[5] === undefined && LIST_SCOPES.has(String(entityScope))) {
        return list([]);
      }
      return answer(undefined);
    }
    if (scope === "teacher-profiles") return list(queryState.teacherProfiles);
    if (
      scope === "schools" ||
      scope === "academic-years" ||
      scope === "departments" ||
      scope === "classroom-stages"
    ) {
      return list([]);
    }
    return answer(undefined);
  },
  useMutation: () => ({ isPending: false, isError: false, mutate: () => undefined }),
  useQueryClient: () => ({ invalidateQueries: () => undefined })
}));

vi.mock("../src/runtime/react/useRepartoEvents.js", () => ({
  useRepartoEventStream: () => ({
    connectionState: "disconnected",
    error: null,
    lastEventAtMs: null,
    lastEventType: null
  })
}));

vi.mock("sonner", () => ({
  Toaster: () => null,
  toast: { success: vi.fn(), error: vi.fn() }
}));

vi.mock("radix-ui", () => {
  const Passthrough = ({ children }: { children?: ReactNode }) => <>{children}</>;
  const Title = ({ children }: { children?: ReactNode }) => <h2>{children}</h2>;
  const Description = ({ children }: { children?: ReactNode }) => <p>{children}</p>;
  const Overlay = () => <div />;
  const Content = ({ children }: { children?: ReactNode }) => (
    <section role="dialog">{children}</section>
  );
  const AlertContent = ({ children }: { children?: ReactNode }) => (
    <section role="alertdialog">{children}</section>
  );
  return {
    Dialog: {
      Root: Passthrough,
      Portal: Passthrough,
      Close: Passthrough,
      Title,
      Description,
      Overlay,
      Content
    },
    AlertDialog: {
      Root: Passthrough,
      Portal: Passthrough,
      Cancel: Passthrough,
      Action: Passthrough,
      Title,
      Description,
      Overlay,
      Content: AlertContent
    }
  };
});

const renderRoute = (route: RepartoRouteName) =>
  renderRepartoRoute(route, processId);

const ROUTES = Object.keys(REPARTO_ROUTE_ACCESS) as RepartoRouteName[];

/**
 * The action keys a `READER` may legitimately keep.
 *
 * Each one is a *read* on the service, so withholding it would withhold data
 * rather than authority: comparing two captures and last year's process are
 * `GET`s on `history`, and the three §7.8 planning exports sit at the read floor
 * by §21.4 — "always allowed, never blocked by feasibility" governs feasibility
 * gating, not authentication, and the two are orthogonal.
 */
const READ_ACTIONS = new Set([
  "compare-versions",
  "compare-previous-year",
  "export-planning",
  "select-process"
]);

/** Every control the package renders that would write something. */
function writeActions(html: string): string[] {
  return repartoActions(html).filter((action) => !READ_ACTIONS.has(action));
}

function actionCount(html: string): number {
  return writeActions(html).length;
}

function isForbidden(html: string): boolean {
  return html.includes('data-reparto-state="forbidden"');
}

function signIn(role: RepartoRole, overrides: Parameters<typeof repartoUser>[1] = {}) {
  queryState.processes = [{ id: processId, status: "draft" }];
  queryState.teacherProfiles = [
    {
      id: profileId,
      display_name: "Ada Lovelace",
      active: true,
      notes: null,
      user_id: null,
      created_at: "2026-08-05T10:00:00Z",
      updated_at: "2026-08-05T10:00:00Z"
    }
  ];
  signInReparto(repartoUser(role, overrides));
}

afterEach(() => {
  resetRepartoAuthAdapter();
  vi.clearAllMocks();
});

describe("§8.1 route map — a USER-role session renders no reparto view", () => {
  it.each(ROUTES)("refuses %s", async (route) => {
    signIn("user");
    const html = await renderRoute(route);

    expect(isForbidden(html)).toBe(true);
    expect(html).toContain(dict.view.access.forbidden);
    expect(html).toContain(`data-reparto-required-role="reader"`);
    // Nothing of the route itself is rendered — no content, no control.
    expect(actionCount(html)).toBe(0);
  });

  it.each(ROUTES)("refuses %s to an anonymous session too", async (route) => {
    signIn("user");
    signInReparto(null);
    const html = await renderRoute(route);
    expect(isForbidden(html)).toBe(true);
  });
});

describe("§8.1 route map — a READER reads every route and acts on none", () => {
  it.each(ROUTES)("renders %s read-only", async (route) => {
    signIn("reader");
    const html = await renderRoute(route);

    expect(isForbidden(html)).toBe(false);
    // Hidden, not disabled: below the act floor the control is not rendered at
    // all, so counting the attribute is the whole assertion.
    expect(actionCount(html)).toBe(0);
  });
});

describe("§8.1 route map — a WRITER gains only its own-data affordances", () => {
  it.each(ROUTES.filter((route) => REPARTO_ROUTE_ACCESS[route].act === "admin"))(
    "still offers a writer nothing on %s",
    async (route) => {
      signIn("writer");
      const html = await renderRoute(route);

      expect(isForbidden(html)).toBe(false);
      expect(actionCount(html)).toBe(0);
    }
  );

  it("offers a writer their own direct selection and turn on my-view", async () => {
    signIn("writer");
    const html = await renderRoute("teacherView");

    expect(html).toContain('data-reparto-action="direct-choice"');
    expect(html).toContain('data-reparto-action="pass-turn"');
    // And nothing beyond the two own-data actions.
    expect(actionCount(html)).toBe(2);
  });

  it("withholds the same two controls from a reader on my-view", async () => {
    signIn("reader");
    const html = await renderRoute("teacherView");

    expect(html).not.toContain('data-reparto-action="direct-choice"');
    expect(html).not.toContain('data-reparto-action="pass-turn"');
    // The reader still reads the page: their hours panel is there.
    expect(html).toContain('data-reparto-panel="teacher-summary"');
  });

  it("offers a writer the roster edit only on their own linked profile", async () => {
    signIn("writer", { id: "linked-user" });
    queryState.teacherProfiles = [
      {
        id: profileId,
        display_name: "Ada Lovelace",
        active: true,
        notes: null,
        user_id: "someone-else",
        created_at: "2026-08-05T10:00:00Z",
        updated_at: "2026-08-05T10:00:00Z"
      }
    ];
    const others = await renderRoute("teacherRoster");
    expect(others).not.toContain('data-reparto-row-action="edit"');

    queryState.teacherProfiles = [
      {
        id: profileId,
        display_name: "Ada Lovelace",
        active: true,
        notes: null,
        user_id: "linked-user",
        created_at: "2026-08-05T10:00:00Z",
        updated_at: "2026-08-05T10:00:00Z"
      }
    ];
    const own = await renderRoute("teacherRoster");
    expect(own).toContain('data-reparto-row-action="edit"');
    // Creating, linking and deleting a profile stay department-head actions.
    expect(own).not.toContain('data-reparto-row-action="delete"');
    expect(own).not.toContain('data-reparto-row-action="link-user"');
    expect(own).not.toContain('data-reparto-action="create"');
  });
});

describe("§8.1 route map — ADMIN and SUPERADMIN get the department-head surface", () => {
  const headed: RepartoRouteName[] = [
    "dashboard",
    "meeting",
    "planning",
    "assignments",
    "participants",
    "subjects",
    "teachingGroups",
    "classroomStages",
    "schools",
    "academicYears",
    "departments",
    "teacherRoster",
    "versions",
    "exports"
  ];

  it.each(headed)("gives an admin at least one control on %s", async (route) => {
    signIn("admin");
    const html = await renderRoute(route);

    expect(isForbidden(html)).toBe(false);
    expect(actionCount(html)).toBeGreaterThan(0);
  });

  it.each(headed)("gives a superadmin the same surface on %s", async (route) => {
    signIn("superadmin");
    const html = await renderRoute(route);
    expect(actionCount(html)).toBeGreaterThan(0);
  });

  it("treats is_superuser as superadmin, whatever the role name says", async () => {
    signIn("user", { is_superuser: true });
    const html = await renderRoute("planning");

    expect(isForbidden(html)).toBe(false);
    expect(actionCount(html)).toBeGreaterThan(0);
  });

  it("keeps the projector screen action-free for every role", async () => {
    // The shared screen has no affordance at any tier: it is a display.
    for (const role of REPARTO_ROLE_ORDER) {
      if (role === "user") continue;
      signIn(role);
      expect(actionCount(await renderRoute("sharedScreen")), role).toBe(0);
    }
  });
});

describe("§8.1 route map — an unresolved session shows neither content nor refusal", () => {
  it("renders the waiting state while an async adapter is still answering", async () => {
    const { setRepartoAuthAdapter } = await import("../src/runtime/authAdapter.js");
    setRepartoAuthAdapter({
      getAccessToken: () => "token",
      getCurrentUser: async () => repartoUser("admin")
    });
    const html = await renderRoute("dashboard");

    expect(html).toContain('data-reparto-state="checking"');
    expect(html).toContain(dict.view.access.checking);
    // "Not yet" is not "not allowed": no refusal is claimed, and no control is
    // offered on the strength of a session that has not been read.
    expect(isForbidden(html)).toBe(false);
    expect(actionCount(html)).toBe(0);
  });
});
