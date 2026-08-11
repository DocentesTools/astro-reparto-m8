// @vitest-environment jsdom
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { en } from "../src/runtime/i18n/en.js";
import { DEFAULT_REPARTO_NAV } from "../src/integration.js";
import { REPARTO_ROUTE_ACCESS } from "../src/runtime/routeAccess.js";
import { buildRepartoRoutes } from "../src/runtime/routes.js";
import type {
  GroupSubjectPublic,
  SubjectPublic,
  TeachingGroupPublic
} from "../src/runtime/schemas.js";

/**
 * The group-subject matrix as a route an operator can actually reach (§13.2a
 * `S2-02`).
 *
 * `GroupSubjectBulkEditor` was built, localized and tested and then mounted
 * nowhere: its only callers were two test files, and the matrix it fills is the
 * input to main-subject materialization, so Stage 2 stayed empty whatever else
 * landed. The gap was invisible to every existing gate, because a component
 * that compiles and a component a signed-in head can open are different claims.
 *
 * What this file holds is the second claim: the route exists in all four maps,
 * the editor is on it, the per-cell form writes through the hooks, and the
 * §8.4 preview-before-apply rule survives the move.
 */

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");
const processId = "11111111-1111-4111-8111-111111111111";
const subjectId = "22222222-2222-4222-8222-222222222222";
const stageId = "33333333-3333-4333-8333-333333333333";
const groupId = "44444444-4444-4444-8444-444444444441";
const cellId = "55555555-5555-4555-8555-555555555551";
const now = "2026-08-10T10:00:00Z";
const dict = en;

const subject: SubjectPublic = {
  id: subjectId,
  assignment_process_id: processId,
  name: "Mathematics",
  allocation_category: "main",
  activity_type: "ordinary",
  default_group_weekly_hours: "4.00",
  default_teacher_weekly_hours_per_position: "4.00",
  default_required_teacher_count: 1,
  allows_multiple_groups: false,
  allows_zero_groups: false,
  notes: null,
  created_at: now,
  updated_at: now
};

const group: TeachingGroupPublic = {
  id: groupId,
  assignment_process_id: processId,
  classroom_stage_id: stageId,
  classroom_stage: {
    id: stageId,
    stage: "secondary",
    min_grade: 1,
    max_grade: 4,
    label: "Secondary",
    created_at: now,
    updated_at: now
  },
  grade: 1,
  group_code: "A",
  label: "1 Secondary A",
  notes: null,
  created_at: now,
  updated_at: now
};

const cell: GroupSubjectPublic = {
  id: cellId,
  assignment_process_id: processId,
  teaching_group_id: groupId,
  subject_id: subjectId,
  group_weekly_hours: "4.00",
  teacher_weekly_hours_per_position: null,
  required_teacher_count: 1,
  active: true,
  notes: null,
  created_at: now,
  updated_at: now
};

const state = vi.hoisted(() => ({
  canAct: true,
  cells: [] as unknown[]
}));

const hooks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  preview: vi.fn(),
  apply: vi.fn()
}));

const toasts = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock("../src/runtime/react/hooks.js", () => ({
  useRepartoGroupSubjects: () => ({
    data: { data: state.cells, count: state.cells.length },
    error: null,
    isError: false,
    isLoading: false
  }),
  useRepartoSubjects: () => ({
    data: { data: [subject], count: 1 },
    error: null,
    isError: false,
    isLoading: false
  }),
  useRepartoTeachingGroups: () => ({
    data: { data: [group], count: 1 },
    error: null,
    isError: false,
    isLoading: false
  }),
  useCreateRepartoGroupSubject: () => ({
    isPending: false,
    mutate: hooks.create
  }),
  useUpdateRepartoGroupSubject: () => ({
    isPending: false,
    mutate: hooks.update
  }),
  usePreviewRepartoGroupSubjects: () => ({
    isPending: false,
    mutate: hooks.preview
  }),
  useApplyRepartoGroupSubjects: () => ({ isPending: false, mutate: hooks.apply })
}));

vi.mock("../src/runtime/react/useRepartoRole.js", () => ({
  useRepartoCanAct: () => state.canAct,
  useRepartoViewMode: () => (state.canAct ? "admin" : "readonly")
}));

vi.mock("../src/runtime/react/ui/toast-notification.js", () => ({
  repartoToast: toasts,
  RepartoToastHost: () => null
}));

vi.mock("../src/runtime/react/default-ui/route-guard.js", () => ({
  RepartoRouteGuard: ({ children }: { children?: unknown }) => children
}));

vi.mock("../src/runtime/react/default-ui/process-context.js", async () => {
  const actual = await vi.importActual<
    typeof import("../src/runtime/react/default-ui/process-context.js")
  >("../src/runtime/react/default-ui/process-context.js");
  return {
    ...actual,
    Shell: ({ children }: { children?: unknown }) => children,
    WithSelectedProcess: ({
      children
    }: {
      children: (id: string) => unknown;
    }) => children(processId)
  };
});

function field(name: string) {
  const element = document.querySelector(`[data-reparto-field="${name}"]`);
  if (element === null) throw new Error(`no field ${name}`);
  return element;
}

function action(name: string): HTMLButtonElement {
  const element = document.querySelector(`[data-reparto-action="${name}"]`);
  if (element === null) throw new Error(`no action ${name}`);
  return element as HTMLButtonElement;
}

async function renderView() {
  const { RepartoGroupSubjectsView } = await import(
    "../src/runtime/react/default-ui/process-crud/group-subjects/index.js"
  );
  render(
    <RepartoGroupSubjectsView
      config={{ apiBase: "/api", apiPrefix: "/reparto" }}
      locale="en"
      processId={processId}
    />
  );
}

beforeEach(() => {
  state.canAct = true;
  state.cells = [];
  vi.clearAllMocks();
});

afterEach(cleanup);

describe("the groupSubjects route is declared in all four maps", () => {
  it("has a default path, an access floor, an entrypoint and a nav entry", () => {
    expect(buildRepartoRoutes().groupSubjects).toBe(
      "/reparto/processes/[processId]/group-subjects"
    );
    // Read at `reader` like every route; write at `admin` like every other
    // department-head surface (§21.2).
    expect(REPARTO_ROUTE_ACCESS.groupSubjects).toEqual({
      view: "reader",
      act: "admin"
    });

    const integration = readFileSync(
      join(repoRoot, "src", "integration.ts"),
      "utf8"
    );
    expect(integration).toContain(
      'groupSubjects: "@mano8/astro-reparto-m8/routes/group-subjects.astro"'
    );

    const entry = DEFAULT_REPARTO_NAV.configuration.entries.find(
      (candidate) => candidate.route === "groupSubjects"
    );
    // Stage 1, and last of the entries that build the matrix: it is what Stage
    // 1 produces for Stage 2. Only `processSettings` (§8.2 step 7) follows it.
    expect(entry?.labelKey).toBe("nav.item.groupSubjects");
    const configurationRoutes = DEFAULT_REPARTO_NAV.configuration.entries.map(
      (candidate) => candidate.route
    );
    expect(configurationRoutes.indexOf("groupSubjects")).toBe(
      configurationRoutes.indexOf("processSettings") - 1
    );
    expect(
      DEFAULT_REPARTO_NAV.planning.entries.some(
        (candidate) => candidate.route === "groupSubjects"
      )
    ).toBe(false);
  });

  it("ships the starter page that mounts the view", () => {
    const route = readFileSync(
      join(repoRoot, "src", "routes", "group-subjects.astro"),
      "utf8"
    );
    expect(route).toContain("RepartoGroupSubjectsView");
    expect(route).toContain('client:only="react"');

    const manifest = JSON.parse(
      readFileSync(join(repoRoot, "package.json"), "utf8")
    ) as { exports: Record<string, string> };
    expect(manifest.exports["./routes/group-subjects.astro"]).toBe(
      "./src/routes/group-subjects.astro"
    );
  });
});

describe("the matrix route mounts the bulk editor", () => {
  it("puts the editor on the page rather than behind a control", async () => {
    await renderView();

    expect(
      document.querySelector('[data-reparto-route="group-subjects"]')
    ).not.toBeNull();
    // The blocker this route resolves is an *empty* matrix, so the tool that
    // fills it must be reachable without first finding a button.
    expect(
      document.querySelector(
        '[data-reparto-component="group-subject-bulk-editor"]'
      )
    ).not.toBeNull();
    expect(action("group-subject-preview")).not.toBeNull();
  });

  it("keeps preview-before-apply intact on the route (§8.4)", async () => {
    await renderView();

    expect(action("group-subject-apply").disabled).toBe(true);
    fireEvent.change(field("group-subject-subject"), {
      target: { value: subjectId }
    });
    fireEvent.click(action("group-subject-preview"));
    hooks.preview.mock.calls.at(-1)![1].onSuccess({
      mode: "create_missing",
      subject_id: subjectId,
      matched_group_ids: [groupId],
      to_create: [
        {
          teaching_group_id: groupId,
          group_subject_id: null,
          group_weekly_hours: "4.00",
          teacher_weekly_hours_per_position: "4.00",
          required_teacher_count: 1
        }
      ],
      to_update: [],
      unchanged: [],
      conflicts: [],
      validation_errors: [],
      expected_affected_count: 1
    });

    await waitFor(() => {
      expect(action("group-subject-apply").disabled).toBe(false);
    });
    expect(hooks.apply).not.toHaveBeenCalled();
  });

  it("says the matrix is empty and why that blocks Stage 2", async () => {
    await renderView();

    expect(
      document.querySelector('[data-reparto-state="empty-matrix"]')?.textContent
    ).toBe(dict.groupSubjectMatrix.emptyHint);
  });

  it("lists the cells that exist, inherited hours read as inherited", async () => {
    state.cells = [cell];
    await renderView();

    const row = document.querySelector(`[data-group-subject-id="${cellId}"]`);
    expect(row).not.toBeNull();
    expect(row?.textContent).toContain("1 Secondary A");
    expect(row?.textContent).toContain("Mathematics");
    // A null teacher-hours column is the subject default, not zero.
    expect(row?.textContent).toContain(dict.groupSubjectMatrix.inherited);
    expect(
      document.querySelector('[data-reparto-state="empty-matrix"]')
    ).toBeNull();
  });
});

describe("per-cell writes", () => {
  it("creates one cell with its identity and its explicit inherits", async () => {
    await renderView();
    fireEvent.click(action("create"));

    fireEvent.change(field("group-subject-cell-classroom"), {
      target: { value: groupId }
    });
    fireEvent.change(field("group-subject-cell-subject"), {
      target: { value: subjectId }
    });
    fireEvent.change(field("group-subject-cell-group-hours"), {
      target: { value: "3.5" }
    });
    fireEvent.click(action("save"));

    expect(hooks.create).toHaveBeenCalledTimes(1);
    const sent = hooks.create.mock.calls[0][0];
    expect(sent.processId).toBe(processId);
    expect(sent.body.teaching_group_id).toBe(groupId);
    expect(sent.body.subject_id).toBe(subjectId);
    expect(sent.body.group_weekly_hours).toBe("3.50");
    // Blank is "inherit the subject default" — an explicit null, never zero.
    expect(sent.body.teacher_weekly_hours_per_position).toBeNull();
    // Blank count is omitted so the backend default applies.
    expect("required_teacher_count" in sent.body).toBe(false);
  });

  it("refuses to create a cell that names no classroom or subject", async () => {
    await renderView();
    fireEvent.click(action("create"));
    fireEvent.click(action("save"));

    expect(hooks.create).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(document.body.textContent).toContain(dict.error.required);
    });
  });

  it("patches a cell's values and never its identity", async () => {
    state.cells = [cell];
    await renderView();
    fireEvent.click(
      document.querySelector(
        '[data-reparto-row-action="edit"]'
      ) as HTMLButtonElement
    );

    // The classroom and the subject are shown, not offered.
    expect(
      document.querySelector('[data-reparto-field="group-subject-cell-classroom"]')
    ).toBeNull();
    expect(document.body.textContent).toContain(
      dict.groupSubjectMatrix.identityHint
    );

    fireEvent.change(field("group-subject-cell-teacher-count"), {
      target: { value: "2" }
    });
    fireEvent.click(action("save"));

    expect(hooks.update).toHaveBeenCalledTimes(1);
    const sent = hooks.update.mock.calls[0][0];
    expect(sent.groupSubjectId).toBe(cellId);
    expect(sent.body.required_teacher_count).toBe(2);
    expect("teaching_group_id" in sent.body).toBe(false);
    expect("subject_id" in sent.body).toBe(false);
  });

  it("rejects an hour value the decimal contract forbids", async () => {
    await renderView();
    fireEvent.click(action("create"));
    fireEvent.change(field("group-subject-cell-classroom"), {
      target: { value: groupId }
    });
    fireEvent.change(field("group-subject-cell-subject"), {
      target: { value: subjectId }
    });
    fireEvent.change(field("group-subject-cell-group-hours"), {
      target: { value: "3.456" }
    });
    fireEvent.click(action("save"));

    expect(hooks.create).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(document.body.textContent).toContain(
        dict.groupSubjectBulk.hoursError.too_many_decimals
      );
    });
  });

  it("reports a refused write with the service's own words", async () => {
    await renderView();
    fireEvent.click(action("create"));
    fireEvent.change(field("group-subject-cell-classroom"), {
      target: { value: groupId }
    });
    fireEvent.change(field("group-subject-cell-subject"), {
      target: { value: subjectId }
    });
    fireEvent.click(action("save"));

    const { RepartoApiError } = await import("../src/runtime/errors.js");
    hooks.create.mock.calls[0][1].onError(
      new RepartoApiError(409, "This group already carries this subject.")
    );

    await waitFor(() => {
      expect(toasts.error).toHaveBeenCalledWith(
        dict.groupSubjectMatrix.createError,
        "This group already carries this subject."
      );
    });
  });
});

describe("the write floor", () => {
  it("withholds every matrix affordance below ADMIN and says so", async () => {
    state.canAct = false;
    state.cells = [cell];
    await renderView();

    // Hidden, not disabled: an affordance the service would refuse is worse
    // than no affordance at all.
    expect(document.querySelectorAll("[data-reparto-action]")).toHaveLength(0);
    expect(
      document.querySelector(
        '[data-reparto-component="group-subject-bulk-editor"]'
      )
    ).toBeNull();
    expect(
      document.querySelector('[data-reparto-state="read-only"]')?.textContent
    ).toBe(dict.groupSubjectMatrix.readOnly);
    // The reader still reads: the cells are data they are entitled to (§21.4).
    expect(
      document.querySelector(`[data-group-subject-id="${cellId}"]`)
    ).not.toBeNull();
  });
});
