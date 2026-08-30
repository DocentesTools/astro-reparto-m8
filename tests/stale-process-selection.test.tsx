// @vitest-environment jsdom
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  resetRepartoAuthAdapter,
  setRepartoAuthAdapter
} from "../src/runtime/authAdapter.js";

/**
 * A remembered process id outlives the process it names.
 *
 * `reparto.lastProcessId` survives a reset database and a deleted process, and
 * a non-empty selection suppresses the picker — so a stale id used to leave the
 * view with no way to choose another one while every process-scoped request
 * answered `AssignmentProcess <id> not found.` These tests hold the recovery
 * and, just as importantly, the three cases where the id must be kept.
 */

const STORAGE_KEY = "reparto.lastProcessId";
const staleProcessId = "f8b02c82-d7cb-4576-9c18-efa911db040c";
const liveProcessId = "11111111-1111-4111-8111-111111111111";

const processQueryState = vi.hoisted(() => ({
  processes: [] as { id: string; status: string }[],
  count: 0
}));

vi.mock("../src/runtime/react/hooks.js", () => ({
  useRepartoProcesses: () => ({
    data: { data: processQueryState.processes, count: processQueryState.count },
    isLoading: false,
    isError: false,
    error: null
  }),
  useCreateRepartoProcess: () => ({ mutate: vi.fn(), isPending: false }),
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

function setProcesses(
  processes: { id: string; status: string }[],
  count = processes.length
) {
  processQueryState.processes = processes;
  processQueryState.count = count;
}

async function renderSelection(processId?: string) {
  const { WithSelectedProcess } = await import(
    "../src/runtime/react/default-ui/process-context.js"
  );
  return render(
    <WithSelectedProcess locale="en" processId={processId}>
      {(resolvedProcessId) => (
        <span data-reparto-child="" data-resolved-process-id={resolvedProcessId} />
      )}
    </WithSelectedProcess>
  );
}

function resolvedProcessId(): string | null | undefined {
  return document
    .querySelector("[data-reparto-child]")
    ?.getAttribute("data-resolved-process-id");
}

beforeEach(() => {
  window.localStorage.clear();
  setProcesses([]);
  setRepartoAuthAdapter({
    getAccessToken: () => "token",
    getCurrentUser: async () => ({ id: "user-1", role: "admin", is_superuser: false })
  });
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  resetRepartoAuthAdapter();
});

describe("remembered process id — recovery from a process that no longer exists", () => {
  it("forgets the stored id and falls back to the picker when the process is gone", async () => {
    window.localStorage.setItem(STORAGE_KEY, staleProcessId);
    setProcesses([]);

    await renderSelection();

    await waitFor(() => {
      expect(
        document.querySelector('[data-reparto-route="process-picker"]')
      ).not.toBeNull();
    });
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("forgets the stored id when other processes exist but that one was deleted", async () => {
    window.localStorage.setItem(STORAGE_KEY, staleProcessId);
    setProcesses([{ id: liveProcessId, status: "draft" }]);

    await renderSelection();

    await waitFor(() => {
      expect(
        document.querySelector('[data-reparto-route="process-picker"]')
      ).not.toBeNull();
    });
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("keeps a stored id the list still contains", async () => {
    window.localStorage.setItem(STORAGE_KEY, liveProcessId);
    setProcesses([{ id: liveProcessId, status: "draft" }]);

    await renderSelection();

    await waitFor(() => {
      expect(resolvedProcessId()).toBe(liveProcessId);
    });
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(liveProcessId);
    expect(
      document.querySelector('[data-reparto-route="process-picker"]')
    ).toBeNull();
  });

  it("keeps a stored id absent from a partial page — a later page may still hold it", async () => {
    window.localStorage.setItem(STORAGE_KEY, staleProcessId);
    // One row returned out of a reported 40: the id could be on page 2, so its
    // absence here proves nothing and must not be read as a deletion.
    setProcesses([{ id: liveProcessId, status: "draft" }], 40);

    await renderSelection();

    await waitFor(() => {
      expect(resolvedProcessId()).toBe(staleProcessId);
    });
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(staleProcessId);
  });

  it("never overrules an id pinned by the route", async () => {
    window.localStorage.setItem(STORAGE_KEY, liveProcessId);
    setProcesses([]);

    await renderSelection(staleProcessId);

    await waitFor(() => {
      expect(resolvedProcessId()).toBe(staleProcessId);
    });
    // The route's id is the caller's statement; the stored one is untouched.
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(staleProcessId);
  });
});
