import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { REPARTO_ROUTE_ACCESS } from "../src/runtime/routeAccess.js";
import type { RepartoRouteName } from "../src/runtime/routes.js";
import {
  renderRepartoRoute,
  repartoRowActions,
  repartoRowActionsFor
} from "./support/routes.js";
import {
  repartoUser,
  resetRepartoAuthAdapter,
  signInReparto
} from "./support/session.js";

/**
 * The per-record half of §21.9's frontend list: *a `WRITER` session never
 * renders an edit or delete control for another user's record.*
 *
 * `route-gating.test.tsx` proves the two floors — who may see a route, and whose
 * tier may hold its write affordances. A floor is not ownership: `writer`
 * clears `teacherRoster`, which says the tier may hold such a control at all,
 * never that this particular row is theirs. That last step is what this file
 * holds, and it is asserted per *row* rather than per page, because counting
 * controls over a whole table cannot tell "the edit button is on their row" from
 * "the edit button is on someone's row".
 *
 * Every route is rendered with the same mixed-ownership data: one record linked
 * to the signed-in user and one linked to a different user. Each writer
 * assertion is paired with the `ADMIN` render of the same rows, so a passing
 * writer case is never the accident of a table that renders no controls at all.
 */

const processId = "11111111-1111-4111-8111-111111111111";
const ownUserId = "00000000-0000-4000-8000-0000000000aa";
const otherUserId = "00000000-0000-4000-8000-0000000000bb";
const ownProfileId = "22222222-2222-4222-8222-2222222222aa";
const otherProfileId = "22222222-2222-4222-8222-2222222222bb";
const ownParticipantId = "33333333-3333-4333-8333-3333333333aa";
const otherParticipantId = "33333333-3333-4333-8333-3333333333bb";
const ownSlotId = "44444444-4444-4444-8444-4444444444aa";
const otherSlotId = "44444444-4444-4444-8444-4444444444bb";
const activityId = "55555555-5555-4555-8555-555555555555";
const sessionId = "66666666-6666-4666-8666-666666666666";
const turnId = "77777777-7777-4777-8777-777777777777";
const now = "2026-08-06T10:00:00Z";

const teacherProfile = (id: string, displayName: string, userId: string | null) => ({
  id,
  display_name: displayName,
  active: true,
  notes: null,
  user_id: userId,
  created_at: now,
  updated_at: now
});

const participant = (id: string, teacherProfileId: string) => ({
  id,
  assignment_process_id: processId,
  teacher_profile_id: teacherProfileId,
  base_weekly_hours: "18.00",
  extra_weekly_hours: "0.00",
  target_weekly_hours: "18.00",
  is_overloaded: false,
  extra_hours_reason: null,
  extra_hours_updated_by_user_id: null,
  extra_hours_updated_at: null,
  participates_in_selection: true,
  selection_position: null,
  selection_points: null,
  selection_criteria_label: null,
  selection_notes: null,
  order_locked: false,
  status: "active",
  created_at: now,
  updated_at: now
});

const slot = (id: string, positionIndex: number, status: string) => ({
  id,
  assignment_process_id: processId,
  teaching_activity_id: activityId,
  position_index: positionIndex,
  required_teacher_hours: "4.00",
  status,
  created_generation: 1,
  last_validated_generation: 1,
  retired_generation: null,
  superseded_by_requirement_id: null,
  created_at: now,
  updated_at: now
});

const assignment = (id: string, slotId: string, processTeacherId: string) => ({
  id,
  assignment_process_id: processId,
  hour_requirement_id: slotId,
  teaching_activity_id: activityId,
  process_teacher_id: processTeacherId,
  source: "department_head",
  status: "active",
  chosen_by_user_id: null,
  confirmed_by_user_id: null,
  notes: null,
  created_at: now,
  updated_at: now
});

const meetingSession = {
  id: sessionId,
  assignment_process_id: processId,
  status: "open",
  lan_access_enabled: true,
  direct_teacher_selection_enabled: true,
  selection_mode: "none",
  notes: null,
  started_at: now,
  started_by_user_id: ownUserId,
  closed_at: null,
  closed_by_user_id: null,
  created_at: now,
  updated_at: now
};

/** The LAN payload is always the caller's own; only the live turn varies. */
const teacherLanSummary = (turnHolderId: string | null) => ({
  process_id: processId,
  teacher_profile_id: ownProfileId,
  process_teacher_id: ownParticipantId,
  generated_at: now,
  readiness: "ready",
  selection_blocked: false,
  plan_balance: null,
  participant: {
    process_teacher_id: ownParticipantId,
    teacher_profile_id: ownProfileId,
    display_name: "Ada Lovelace",
    base_weekly_hours: "18.00",
    extra_weekly_hours: "0.00",
    target_weekly_hours: "18.00",
    assigned_weekly_hours: "4.00",
    remaining_weekly_hours: "14.00",
    is_overloaded: false,
    assignment_count: 1,
    state: "pending"
  },
  available_slots: 1,
  current_turn:
    turnHolderId === null
      ? null
      : {
          meeting_session_id: sessionId,
          selection_turn_id: turnId,
          process_teacher_id: turnHolderId,
          position: 0,
          status: "active",
          started_at: now
        }
});

const queryState = vi.hoisted(() => ({
  processes: [] as unknown[],
  teacherProfiles: [] as unknown[],
  participants: [] as unknown[],
  assignments: [] as unknown[],
  requirements: [] as unknown[],
  meetingSessions: [] as unknown[],
  teacherLan: null as unknown
}));

/** Process-rooted scopes whose payload is a page rather than a single object. */
const LIST_SCOPES = new Set([
  "subjects",
  "groups",
  "group-subjects",
  "teaching-activities",
  "audit-events",
  "versions",
  "exports",
  "allocation-revisions"
]);

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
      const entityScope = queryKey[4];
      if (queryKey[5] === undefined) {
        if (entityScope === "teachers") return list(queryState.participants);
        if (entityScope === "assignments") return list(queryState.assignments);
        if (entityScope === "requirements") return list(queryState.requirements);
        if (entityScope === "meeting-sessions") {
          return list(queryState.meetingSessions);
        }
        if (entityScope === "teacher-lan") return answer(queryState.teacherLan);
        if (LIST_SCOPES.has(String(entityScope))) return list([]);
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

const render = (route: RepartoRouteName) => renderRepartoRoute(route, processId);

function signIn(role: "reader" | "writer" | "admin", userId = ownUserId) {
  signInReparto(repartoUser(role, { id: userId }));
}

/**
 * The rendered `<button>` tag carrying `data-reparto-action="name"`.
 *
 * The class attribute is dropped before the tag is returned: the shared button
 * styles carry Tailwind's `disabled:` variants, which would make a substring
 * test for the `disabled` attribute true of every control on the page.
 */
function actionTag(html: string, name: string): string {
  const match = html.match(
    new RegExp(`<button[^>]*data-reparto-action="${name}"[^>]*>`)
  );
  return (match?.[0] ?? "").replace(/ class="[^"]*"/, "");
}

beforeEach(() => {
  queryState.processes = [{ id: processId, status: "meeting_open" }];
  queryState.teacherProfiles = [
    teacherProfile(ownProfileId, "Ada Lovelace", ownUserId),
    teacherProfile(otherProfileId, "Grace Hopper", otherUserId)
  ];
  queryState.participants = [
    participant(ownParticipantId, ownProfileId),
    participant(otherParticipantId, otherProfileId)
  ];
  queryState.requirements = [
    slot(ownSlotId, 0, "assigned"),
    slot(otherSlotId, 1, "assigned")
  ];
  queryState.assignments = [
    assignment("88888888-8888-4888-8888-8888888888aa", ownSlotId, ownParticipantId),
    assignment("88888888-8888-4888-8888-8888888888bb", otherSlotId, otherParticipantId)
  ];
  queryState.meetingSessions = [meetingSession];
  queryState.teacherLan = teacherLanSummary(otherParticipantId);
});

afterEach(() => {
  resetRepartoAuthAdapter();
  vi.clearAllMocks();
});

describe("teacher roster — the one own-record affordance in the package", () => {
  it("gives a writer the edit control on their own row and on no other", async () => {
    signIn("writer");
    const html = await render("teacherRoster");

    expect(repartoRowActionsFor(html, "data-teacher-profile-id", ownProfileId)).toEqual([
      "edit"
    ]);
    expect(
      repartoRowActionsFor(html, "data-teacher-profile-id", otherProfileId)
    ).toEqual([]);
    // Both rows are on the page; only one of them carries a control.
    expect(html).toContain("Ada Lovelace");
    expect(html).toContain("Grace Hopper");
    expect(repartoRowActions(html)).toEqual(["edit"]);
  });

  it("gives a writer nothing when no row is linked to them", async () => {
    // The same session, the same table — every profile now belongs to someone
    // else, or to nobody. An unlinked profile is not the caller's own record:
    // `user_id === null` must not read as "mine" just because it is not
    // demonstrably another's.
    signIn("writer");
    queryState.teacherProfiles = [
      teacherProfile(ownProfileId, "Ada Lovelace", null),
      teacherProfile(otherProfileId, "Grace Hopper", otherUserId)
    ];
    const html = await render("teacherRoster");

    expect(repartoRowActions(html)).toEqual([]);
  });

  it("gives a writer nothing when the session carries no user id", async () => {
    signInReparto({ id: "", is_superuser: false, role: "writer" });
    const html = await render("teacherRoster");

    expect(repartoRowActions(html)).toEqual([]);
  });

  it("gives an admin every row's controls, own row or not", async () => {
    signIn("admin");
    const html = await render("teacherRoster");

    // The department head edits and deletes any profile; the linkage controls
    // differ by row, and by the row's *linkage* rather than by whose it is. A
    // linked profile — theirs or a colleague's — can only be unlinked. The old
    // behaviour offered *Link user* on a colleague's linked row, which linked
    // the pressing head and took that colleague's participation away
    // (remediation `W1.4`).
    expect(
      repartoRowActionsFor(html, "data-teacher-profile-id", ownProfileId)
    ).toEqual(["edit", "unlink-user", "delete"]);
    expect(
      repartoRowActionsFor(html, "data-teacher-profile-id", otherProfileId)
    ).toEqual(["edit", "unlink-user", "delete"]);
  });

  it("offers a claim code, not a link, on a row that belongs to nobody yet", async () => {
    // The row the whole flow exists for. *Issue claim code* is what the head
    // hands the teacher; *Link to me* survives beside it under the name of the
    // only thing it ever did — link the head pressing it.
    signIn("admin");
    queryState.teacherProfiles = [
      teacherProfile(ownProfileId, "Ada Lovelace", null),
      teacherProfile(otherProfileId, "Grace Hopper", otherUserId)
    ];
    const html = await render("teacherRoster");

    expect(
      repartoRowActionsFor(html, "data-teacher-profile-id", ownProfileId)
    ).toEqual(["edit", "issue-claim-code", "link-user", "delete"]);
    expect(html).toContain("Issue claim code");
    expect(html).toContain("Link to me");
  });
});

describe("participants and assignments — a writer edits nobody's record, own included", () => {
  it("refuses a writer the participant roster outright, own row included", async () => {
    // `ProcessTeacher` is the caller's own participation, and it is still
    // department-head-only (§21.3): base hours, extra hours and selection order
    // are the head's decisions about a teacher, not the teacher's own data.
    // Since `W5.3` that holds for *reading* it too — the row carries every
    // participant's hours and the head's extra-hours reason, so the service
    // serves `GET …/teachers` to an administrator only and the route's view
    // floor follows it. A writer no longer reads the names read-only; they meet
    // the refusal, and their own figures are on *My view*.
    signIn("writer");
    const html = await render("participants");

    expect(html).toContain('data-reparto-state="forbidden"');
    expect(repartoRowActions(html)).toEqual([]);
    expect(html).not.toContain("Ada Lovelace");
    expect(html).not.toContain("Grace Hopper");
  });

  it("offers an admin the full participant row surface", async () => {
    signIn("admin");
    const html = await render("participants");

    expect(repartoRowActions(html)).toEqual([
      "edit",
      "extra-hours",
      "delete",
      "edit",
      "extra-hours",
      "delete"
    ]);
  });

  it("offers a writer no assignment control, including on the slot they hold", async () => {
    // A `WRITER` takes a slot through the teacher view's direct choice and never
    // edits, reassigns or undoes the record afterwards — the board is the head's.
    // Since `W5.3` the board is not theirs to read either: it composes the
    // participant roster, so it carries the same department-head tier.
    signIn("writer");
    const html = await render("assignments");

    expect(html).toContain('data-reparto-state="forbidden"');
    expect(repartoRowActions(html)).toEqual([]);
  });

  it("offers an admin the full assignment row surface", async () => {
    signIn("admin");
    const html = await render("assignments");

    expect(repartoRowActions(html)).toEqual([
      "edit",
      "reassign",
      "undo",
      "edit",
      "reassign",
      "undo"
    ]);
  });

  it("offers a reader no row control on any of the three", async () => {
    signIn("reader");
    const roster = await render("teacherRoster");
    const participants = await render("participants");
    const assignments = await render("assignments");

    // The roster is a scoped read a reader keeps (colleagues' names, no
    // figures); the other two are refused outright since `W5.3`, which is a
    // stronger answer than an empty control set.
    expect(repartoRowActions(roster)).toEqual([]);
    expect(roster).not.toContain('data-reparto-state="forbidden"');
    expect(participants).toContain('data-reparto-state="forbidden"');
    expect(assignments).toContain('data-reparto-state="forbidden"');
  });
});

describe("teacher view — the caller acts on their own turn and no other", () => {
  it("refuses both controls while another participant holds the turn", async () => {
    signIn("writer");
    const html = await render("teacherView");

    expect(html).toContain('data-reparto-choice-reason="not_your_turn"');
    expect(html).toContain('data-reparto-choice-state="blocked"');
    // The tier clears the route's floor, so the controls are rendered — and
    // both refuse, because the turn on the table is not this caller's record.
    expect(actionTag(html, "direct-choice")).toContain("disabled");
    expect(actionTag(html, "pass-turn")).toContain("disabled");
  });

  it("enables the caller's own turn when the turn is theirs", async () => {
    signIn("writer");
    queryState.teacherLan = teacherLanSummary(ownParticipantId);
    const html = await render("teacherView");

    expect(html).not.toContain('data-reparto-choice-reason="not_your_turn"');
    // Passing is the whole-turn action and it is now theirs to take; choosing
    // still waits on a position being picked, which is a selection state rather
    // than an ownership one.
    expect(actionTag(html, "pass-turn")).not.toContain("disabled");
    expect(html).toContain('data-reparto-choice-reason="no_slot_chosen"');
  });

  it("withholds both controls from a reader whoever holds the turn", async () => {
    signIn("reader");
    queryState.teacherLan = teacherLanSummary(ownParticipantId);
    const html = await render("teacherView");

    expect(actionTag(html, "direct-choice")).toBe("");
    expect(actionTag(html, "pass-turn")).toBe("");
  });
});

describe("§8.1 route map — a writer holds no row-level control anywhere else", () => {
  const ROUTES = Object.keys(REPARTO_ROUTE_ACCESS) as RepartoRouteName[];

  it.each(ROUTES)(
    "renders %s with no control over another user's record",
    async (route) => {
      signIn("writer");
      const html = await render(route);

      // The roster's own-profile edit is the single exception in the package,
      // and it is the one asserted row by row above.
      expect(repartoRowActions(html)).toEqual(
        route === "teacherRoster" ? ["edit"] : []
      );
    }
  );
});
