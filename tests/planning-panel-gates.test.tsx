// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  repartoUser,
  resetRepartoAuthAdapter,
  signInReparto
} from "./support/session.js";

/**
 * Every connected planning panel carries the `planning` write floor itself.
 *
 * The floor used to live only in `RepartoPlanningView`, so a host composing its
 * own planning page out of these public exports got the whole department-head
 * mutation surface ungated. The service still refused a `WRITER` on all of
 * them, so this was misleading UI rather than an access hole — but §21.5 is
 * that an affordance the backend would refuse is worse than no affordance.
 *
 * What is proven per panel: below the floor it renders **nothing at all** — not
 * a disabled control, not an empty shell — and above it, it renders. The
 * "nothing at all" matters twice over, because the gate takes the panel as an
 * unrendered element: below the floor the body never mounts, so none of its
 * queries are issued either, and several of them are `CurrentAdmin`.
 */

// One idle value that satisfies both hook shapes, so a panel can be mounted
// without standing up a query client. It is never asserted on — these cases
// ask whether the panel rendered at all, not what it rendered.
const idle = vi.hoisted(() => ({
  data: undefined,
  error: null,
  isError: false,
  isLoading: false,
  isPending: false,
  mutate: () => undefined,
  mutateAsync: async () => undefined,
  refetch: () => undefined,
  reset: () => undefined
}));

vi.mock("../src/runtime/react/hooks.js", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return Object.fromEntries(
    Object.keys(actual).map((name) => [name, () => idle])
  );
});

const PANELS = [
  "MainSubjectMaterialization",
  "MainActivitySyncPanel",
  "SecondaryActivityEditor",
  "PlanLockAndRequirementGeneration",
  "FeasibilityDiagnosticsPanel",
  "AllocationChangeReconciliation"
] as const;

const processId = "11111111-1111-4111-8111-111111111111";

async function renderPanel(name: (typeof PANELS)[number]) {
  const planning = (await import(
    "../src/runtime/react/default-ui/planning/index.js"
  )) as Record<string, React.ComponentType<{ locale?: "en"; processId?: string }>>;
  const Panel = planning[name];
  return render(<Panel locale="en" processId={processId} />);
}

afterEach(() => {
  cleanup();
  resetRepartoAuthAdapter();
});

describe("planning panels carry their own write floor", () => {
  it.each(PANELS)("withholds %s from a reader entirely", async (name) => {
    signInReparto(repartoUser("reader"));
    const { container } = await renderPanel(name);
    expect(container.innerHTML).toBe("");
  });

  it.each(PANELS)("withholds %s from a writer entirely", async (name) => {
    // §21.3 gives a `WRITER` its own-data actions and nothing on planning.
    signInReparto(repartoUser("writer"));
    const { container } = await renderPanel(name);
    expect(container.innerHTML).toBe("");
  });

  it.each(PANELS)("withholds %s from an anonymous session", async (name) => {
    signInReparto(null);
    const { container } = await renderPanel(name);
    expect(container.innerHTML).toBe("");
  });

  it.each(PANELS)("renders %s for a department head", async (name) => {
    signInReparto(repartoUser("admin"));
    const { container } = await renderPanel(name);
    expect(container.innerHTML).not.toBe("");
  });

  it.each(PANELS)("renders %s for a superadmin", async (name) => {
    signInReparto(repartoUser("superadmin"));
    const { container } = await renderPanel(name);
    expect(container.innerHTML).not.toBe("");
  });
});
