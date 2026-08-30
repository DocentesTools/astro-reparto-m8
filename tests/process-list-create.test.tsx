// @vitest-environment jsdom
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  resetRepartoAuthAdapter,
  setRepartoAuthAdapter,
  type RepartoRole
} from "../src/runtime/authAdapter.js";

/**
 * The process list route has to reach a creation form.
 *
 * Its "create process" control was markup with no handler: it rendered for an
 * admin and did nothing when pressed, so the assignment stage offered a way to
 * open a process that could never open one. Creation lives in the picker,
 * whose cascading selects supply the academic year, school and department the
 * `POST` needs, and these tests hold the route to reaching it.
 */

const processId = "11111111-1111-4111-8111-111111111111";

const processQueryState = vi.hoisted(() => ({
  processes: [] as { id: string; status: string }[]
}));

vi.mock("../src/runtime/react/hooks.js", () => ({
  useRepartoProcesses: () => ({
    data: {
      data: processQueryState.processes,
      count: processQueryState.processes.length
    },
    isLoading: false,
    isError: false,
    error: null
  }),
  useCreateRepartoProcess: () => ({ mutate: vi.fn(), isPending: false, isError: false }),
  useCreateRepartoSchool: () => ({ mutate: vi.fn(), isPending: false }),
  useCreateRepartoAcademicYear: () => ({ mutate: vi.fn(), isPending: false }),
  useCreateRepartoDepartment: () => ({ mutate: vi.fn(), isPending: false }),
  useRepartoSchools: () => ({ data: { data: [], count: 0 } }),
  useRepartoAcademicYears: () => ({ data: { data: [], count: 0 } }),
  useRepartoDepartments: () => ({ data: { data: [], count: 0 } })
}));

vi.mock("../src/runtime/react/useRepartoEvents.js", () => ({
  useRepartoEventStream: () => ({
    connectionState: "disconnected",
    error: null,
    lastEventAtMs: null,
    lastEventType: null
  })
}));

function signIn(role: RepartoRole) {
  setRepartoAuthAdapter({
    getAccessToken: () => "token",
    getCurrentUser: async () => ({ id: "user-1", role, is_superuser: false })
  });
}

function createButton(): HTMLElement | null {
  return document.querySelector('[data-reparto-action="create-process"]');
}

async function renderProcessesRoute() {
  const { RepartoProcessesView } = await import(
    "../src/runtime/react/default-ui/index.js"
  );
  const result = render(<RepartoProcessesView locale="en" />);
  await waitFor(() => {
    expect(document.querySelector('[data-reparto-route="processes"]')).not.toBeNull();
  });
  return result;
}

beforeEach(() => {
  window.localStorage.clear();
  processQueryState.processes = [];
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  resetRepartoAuthAdapter();
});

describe("process list route — the create control reaches the creation form", () => {
  it("opens the picker's create-process form when the control is pressed", async () => {
    signIn("admin");
    await renderProcessesRoute();

    await waitFor(() => {
      expect(createButton()).not.toBeNull();
    });
    // Before the press there is a button and no form to submit.
    expect(document.querySelector('[data-reparto-form="create-process"]')).toBeNull();

    fireEvent.click(createButton() as HTMLElement);

    await waitFor(() => {
      expect(
        document.querySelector('[data-reparto-form="create-process"]')
      ).not.toBeNull();
    });
    // The three prerequisites are selects, per the picker's own contract.
    expect(document.querySelector('[data-reparto-fk="academic-year"]')).not.toBeNull();
    expect(document.querySelector('[data-reparto-fk="school"]')).not.toBeNull();
    expect(document.querySelector('[data-reparto-fk="department"]')).not.toBeNull();
  });

  it("works the same once processes already exist", async () => {
    signIn("admin");
    processQueryState.processes = [{ id: processId, status: "draft" }];
    await renderProcessesRoute();

    await waitFor(() => {
      expect(createButton()).not.toBeNull();
    });
    fireEvent.click(createButton() as HTMLElement);

    await waitFor(() => {
      expect(
        document.querySelector('[data-reparto-form="create-process"]')
      ).not.toBeNull();
    });
  });

  it("withholds the control from a session below the write floor", async () => {
    signIn("reader");
    await renderProcessesRoute();

    // The list is a reader's read and stays; only the write affordance goes.
    await waitFor(() => {
      expect(document.querySelector('[data-reparto-panel="process-list"]')).not.toBeNull();
    });
    expect(createButton()).toBeNull();
  });

  it("renders no create control when a standalone caller wires no handler", async () => {
    const { ProcessListView } = await import(
      "../src/runtime/react/DepartmentHeadWorkspace.js"
    );
    // An unwired button is a dead end rather than an affordance, so the view
    // withholds it instead of rendering one that cannot do anything.
    const html = renderToStaticMarkup(<ProcessListView count={0} locale="en" />);
    expect(html).toContain('data-reparto-panel="process-list"');
    expect(html).not.toContain('data-reparto-action="create-process"');
  });
});
