// @vitest-environment jsdom
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getRepartoDictionary } from "../src/runtime/i18n/index.js";
import {
  resetRepartoAuthAdapter,
  setRepartoAuthAdapter,
  type RepartoCurrentUser
} from "../src/runtime/authAdapter.js";
import type { ClassroomStagePublic } from "../src/runtime/schemas.js";

/**
 * Role-tiered coverage for the classroom-stages view (§13.2 "permissions").
 *
 * The view now carries the §8.1 route map's two floors rather than one: the
 * service lists stages for any `READER`, and only `ADMIN` may create, edit or
 * delete one. So a `READER`/`WRITER` reads the table and is offered nothing,
 * and only a `USER`-role, anonymous or unidentifiable session is refused the
 * page outright. The gate is checked in both directions for every role in the
 * §21.1 table; the sweep over the rest of the route map lives in
 * `route-gating.test.tsx`.
 */

const dict = getRepartoDictionary("en");
const now = "2026-08-02T10:00:00Z";

const queryState = vi.hoisted(() => ({
  rows: [] as unknown[],
  isLoading: false,
  isError: false
}));

const mutations = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn()
}));

const toasts = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock("../src/runtime/react/hooks.js", () => ({
  useRepartoClassroomStages: () => ({
    data: { data: queryState.rows, count: queryState.rows.length },
    isLoading: queryState.isLoading,
    isError: queryState.isError,
    error: queryState.isError ? new Error("offline") : null
  }),
  useCreateRepartoClassroomStage: () => ({
    mutate: mutations.create,
    isPending: false
  }),
  useUpdateRepartoClassroomStage: () => ({
    mutate: mutations.update,
    isPending: false
  }),
  useDeleteRepartoClassroomStage: () => ({
    mutate: mutations.remove,
    isPending: false
  })
}));

vi.mock("../src/runtime/react/ui/toast-notification.js", () => ({
  repartoToast: toasts,
  RepartoToastHost: () => null
}));

function stage(
  id: string,
  overrides: Partial<ClassroomStagePublic> = {}
): ClassroomStagePublic {
  return {
    id,
    stage: "eso",
    label: "ESO",
    min_grade: 1,
    max_grade: 4,
    created_at: now,
    updated_at: now,
    ...overrides
  };
}

function signIn(user: RepartoCurrentUser | null) {
  setRepartoAuthAdapter({
    getAccessToken: () => "token",
    getCurrentUser: () => user
  });
}

function user(
  role: RepartoCurrentUser["role"],
  is_superuser = false
): RepartoCurrentUser {
  return { id: "user-1", role, is_superuser };
}

async function renderView() {
  const { RepartoClassroomStagesView } = await import(
    "../src/runtime/react/default-ui/classroom-stages.js"
  );
  const result = render(<RepartoClassroomStagesView locale="en" />);
  // The gate resolves through the adapter's promise, so every assertion has to
  // wait for the resolved decision rather than the first paint.
  await waitFor(() => {
    expect(
      document.querySelector(
        '[data-reparto-route="classroom-stages"], [data-reparto-state="forbidden"]'
      )
    ).not.toBeNull();
  });
  return result;
}

function writeAffordances() {
  return {
    create: document.querySelector('[data-reparto-action="create"]'),
    edit: document.querySelector('[data-reparto-row-action="edit"]'),
    remove: document.querySelector('[data-reparto-row-action="delete"]')
  };
}

beforeEach(() => {
  queryState.rows = [stage("stage-1")];
  queryState.isLoading = false;
  queryState.isError = false;
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
  resetRepartoAuthAdapter();
});

describe("classroom stages — role visibility", () => {
  it.each([
    ["admin", user("admin")],
    ["superadmin", user("superadmin")],
    // `is_superuser` is sufficient on its own, whatever the role name says.
    ["user with is_superuser", user("user", true)]
  ])("gives %s the create, edit and delete affordances", async (_label, who) => {
    signIn(who);
    await renderView();

    expect(
      document.querySelector('[data-reparto-route="classroom-stages"]')
    ).not.toBeNull();
    const affordances = writeAffordances();
    expect(affordances.create).not.toBeNull();
    expect(affordances.edit).not.toBeNull();
    expect(affordances.remove).not.toBeNull();
  });

  it.each([
    ["writer", user("writer")],
    ["reader", user("reader")]
  ])("gives %s the table and no write control", async (_label, who) => {
    signIn(who);
    await renderView();

    // The data is not withheld: a `READER` may list stages on the service, and
    // withholding an action is not withholding the read (§21.4).
    expect(
      document.querySelector('[data-reparto-route="classroom-stages"]')
    ).not.toBeNull();
    expect(
      document.querySelector('[data-reparto-state="forbidden"]')
    ).toBeNull();
    // Absent, not disabled: a denied role is never shown a button it cannot use.
    const affordances = writeAffordances();
    expect(affordances.create).toBeNull();
    expect(affordances.edit).toBeNull();
    expect(affordances.remove).toBeNull();
  });

  it("refuses a USER-role session the page itself", async () => {
    // `USER` is a valid platform identity with zero capability here (§21.1),
    // so it does not clear even the read floor.
    signIn(user("user"));
    await renderView();

    expect(
      document.querySelector('[data-reparto-state="forbidden"]')
    ).not.toBeNull();
    expect(document.body.textContent).toContain(dict.view.access.forbidden);
    expect(
      document.querySelector('[data-reparto-route="classroom-stages"]')
    ).toBeNull();
    expect(writeAffordances().create).toBeNull();
  });

  it("denies an anonymous session", async () => {
    signIn(null);
    await renderView();

    expect(
      document.querySelector('[data-reparto-state="forbidden"]')
    ).not.toBeNull();
    expect(writeAffordances().create).toBeNull();
  });

  it("fails closed when the adapter cannot answer at all", async () => {
    // No `getCurrentUser` implementation: the view must not assume permission.
    setRepartoAuthAdapter({ getAccessToken: () => "token" });
    await renderView();

    expect(
      document.querySelector('[data-reparto-state="forbidden"]')
    ).not.toBeNull();
  });
});

describe("classroom stages — permitted actions", () => {
  beforeEach(() => signIn(user("admin")));

  it("creates a stage with trimmed values and parsed grades", async () => {
    await renderView();
    fireEvent.click(document.querySelector('[data-reparto-action="create"]')!);

    const field = (name: string) =>
      document.querySelector(`[data-reparto-field="${name}"]`)!;
    fireEvent.change(field("stage"), { target: { value: "  bachillerato  " } });
    fireEvent.change(field("label"), { target: { value: "  BACH  " } });
    fireEvent.change(field("min-grade"), { target: { value: "1" } });
    fireEvent.change(field("max-grade"), { target: { value: "2" } });
    fireEvent.click(document.querySelector('[data-reparto-action="save"]')!);

    expect(mutations.create.mock.calls[0][0]).toEqual({
      stage: "bachillerato",
      label: "BACH",
      min_grade: 1,
      max_grade: 2
    });
  });

  it("refuses an inverted or non-positive grade range", async () => {
    await renderView();
    fireEvent.click(document.querySelector('[data-reparto-action="create"]')!);

    const field = (name: string) =>
      document.querySelector(`[data-reparto-field="${name}"]`)!;
    const save = () =>
      document.querySelector(
        '[data-reparto-action="save"]'
      ) as HTMLButtonElement;

    fireEvent.change(field("stage"), { target: { value: "eso" } });
    fireEvent.change(field("label"), { target: { value: "ESO" } });
    fireEvent.change(field("min-grade"), { target: { value: "4" } });
    fireEvent.change(field("max-grade"), { target: { value: "1" } });
    expect(save().disabled).toBe(true);

    fireEvent.change(field("min-grade"), { target: { value: "0" } });
    fireEvent.change(field("max-grade"), { target: { value: "4" } });
    expect(save().disabled).toBe(true);

    // A single-grade stage is legitimate: the guard is `max >= min`.
    fireEvent.change(field("min-grade"), { target: { value: "3" } });
    fireEvent.change(field("max-grade"), { target: { value: "3" } });
    expect(save().disabled).toBe(false);
  });

  it("edits an existing stage through the update mutation", async () => {
    await renderView();
    fireEvent.click(document.querySelector('[data-reparto-row-action="edit"]')!);

    const label = document.querySelector('[data-reparto-field="label"]')!;
    expect((label as HTMLInputElement).value).toBe("ESO");
    fireEvent.change(label, { target: { value: "ESO-2" } });
    fireEvent.click(document.querySelector('[data-reparto-action="save"]')!);

    expect(mutations.update.mock.calls[0][0]).toEqual({
      stageId: "stage-1",
      body: { stage: "eso", label: "ESO-2", min_grade: 1, max_grade: 4 }
    });
    mutations.update.mock.calls[0][1].onSuccess();
    expect(toasts.success).toHaveBeenCalledWith(
      dict.classroomStages.toast.updated
    );
  });

  it("deletes only after the focused confirmation", async () => {
    await renderView();
    expect(mutations.remove).not.toHaveBeenCalled();

    fireEvent.click(
      document.querySelector('[data-reparto-row-action="delete"]')!
    );
    // The row name is repeated in the confirmation body.
    await waitFor(() => {
      expect(document.body.textContent).toContain("eso");
    });

    // The confirmation lives in an alert dialog, so the proceed control is
    // found by its role and label rather than by a board data attribute.
    const confirm = [
      ...document.querySelectorAll('[role="alertdialog"] button')
    ].find((button) => button.textContent === dict.action.delete)!;
    fireEvent.click(confirm);
    expect(mutations.remove).toHaveBeenCalledWith("stage-1", expect.anything());

    mutations.remove.mock.calls[0][1].onError(new Error("still referenced"));
    expect(toasts.error).toHaveBeenCalledWith(
      dict.classroomStages.toast.deleteError
    );
  });

  it("reports loading and unavailable states", async () => {
    queryState.rows = [];
    queryState.isLoading = true;
    await renderView();
    expect(document.body.textContent).toContain(
      dict.classroomStages.state.loading
    );

    cleanup();
    queryState.isLoading = false;
    queryState.isError = true;
    await renderView();
    expect(document.querySelector('[role="alert"]')?.textContent).toBe(
      dict.classroomStages.state.unavailable
    );
  });
});
