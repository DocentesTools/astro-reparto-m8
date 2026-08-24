// @vitest-environment jsdom
//
// `A-C3`: the island-root error boundary.
//
// The `island-error-boundary` gate in `scripts/verify-fleet-gates.mjs` proves
// all 22 island roots are *wrapped*; these tests prove the wrapper does
// something — that a render throw is caught rather than propagated, that the
// caught message never reaches the DOM, and that both recovery paths work.
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { RepartoErrorBoundary } from "../src/runtime/react/RepartoErrorBoundary.js";

afterEach(cleanup);

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  // React logs every caught render throw regardless of what the boundary does.
  consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  consoleError.mockRestore();
});

function Boom({ throws, message = "render exploded" }: { throws: boolean; message?: string }) {
  if (throws) throw new Error(message);
  return <p>healthy child</p>;
}

describe("RepartoErrorBoundary", () => {
  it("renders children while nothing throws", () => {
    render(
      <RepartoErrorBoundary>
        <Boom throws={false} />
      </RepartoErrorBoundary>
    );

    expect(screen.getByText("healthy child")).toBeTruthy();
    expect(document.querySelector("[data-reparto-error-boundary]")).toBeNull();
  });

  it("catches a render throw and renders the plugin error surface", () => {
    render(
      <RepartoErrorBoundary>
        <Boom throws />
      </RepartoErrorBoundary>
    );

    expect(document.querySelector('[data-reparto-error-boundary="fallback"]')).not.toBeNull();
    expect(document.querySelector('[data-reparto-route="error-boundary"]')).not.toBeNull();
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText("This view stopped responding")).toBeTruthy();
    expect(screen.queryByText("healthy child")).toBeNull();
  });

  it("never renders the caught message, which may carry a process id or a name", () => {
    render(
      <RepartoErrorBoundary>
        <Boom throws message="failed for process 9f2c teacher=Ada Lovelace" />
      </RepartoErrorBoundary>
    );

    expect(document.body.textContent).not.toContain("Ada Lovelace");
    expect(document.body.textContent).not.toContain("9f2c");
  });

  it("reports through onError and normalizes a non-Error throw", () => {
    const onError = vi.fn();

    function ThrowString() {
      throw "thrown as a string";
    }
    function ThrowObject() {
      throw { code: 500 };
    }

    render(
      <RepartoErrorBoundary onError={onError}>
        <ThrowString />
      </RepartoErrorBoundary>
    );
    render(
      <RepartoErrorBoundary onError={onError}>
        <ThrowObject />
      </RepartoErrorBoundary>
    );

    expect(onError).toHaveBeenCalledTimes(2);
    const [stringError, stringInfo] = onError.mock.calls[0] as [
      Error,
      { componentStack: string }
    ];
    const [objectError] = onError.mock.calls[1] as [Error];
    expect(stringError).toBeInstanceOf(Error);
    expect(stringError.message).toBe("thrown as a string");
    expect(typeof stringInfo.componentStack).toBe("string");
    expect(objectError.message).toBe("The view failed to render.");
  });

  it("tolerates a null componentStack from React", () => {
    // React types `componentStack` as nullable and the boundary defaults it to
    // "". Driving `componentDidCatch` directly is the only way to reach that
    // default: React itself always supplies a string.
    const onError = vi.fn();
    const boundary = new RepartoErrorBoundary({ children: null, onError });

    boundary.componentDidCatch?.(new Error("direct"), { componentStack: null });

    expect(onError).toHaveBeenCalledWith(expect.any(Error), { componentStack: "" });
  });

  it("accepts host label overrides and keeps unspecified defaults", () => {
    render(
      <RepartoErrorBoundary
        labels={{ title: "Reparto no disponible", retry: "Reintentar" }}
      >
        <Boom throws />
      </RepartoErrorBoundary>
    );

    expect(screen.getByText("Reparto no disponible")).toBeTruthy();
    expect(screen.getByText("Reintentar")).toBeTruthy();
    expect(
      screen.getByText("The page hit an unexpected error and could not finish rendering.")
    ).toBeTruthy();
  });

  it("renders a custom fallback with the error and a working reset", () => {
    function Harness() {
      const [throws, setThrows] = useState(true);
      return (
        <RepartoErrorBoundary
          fallback={({ error, reset }) => (
            <button
              type="button"
              onClick={() => {
                setThrows(false);
                reset();
              }}
            >
              custom: {error.message}
            </button>
          )}
        >
          <Boom throws={throws} message="custom path" />
        </RepartoErrorBoundary>
      );
    }

    render(<Harness />);
    fireEvent.click(screen.getByText("custom: custom path"));
    expect(screen.getByText("healthy child")).toBeTruthy();
  });

  it("recovers through the default retry button", () => {
    function Harness() {
      const [throws, setThrows] = useState(true);
      return (
        <>
          <button type="button" onClick={() => setThrows(false)}>
            fix the child
          </button>
          <RepartoErrorBoundary>
            <Boom throws={throws} />
          </RepartoErrorBoundary>
        </>
      );
    }

    render(<Harness />);
    fireEvent.click(screen.getByText("fix the child"));
    fireEvent.click(screen.getByText("Reload this view"));
    expect(screen.getByText("healthy child")).toBeTruthy();
  });

  it("clears when the selected process changes and holds while it does not", () => {
    // The real reset key for this plugin: every workspace view is scoped to a
    // process, and switching process is how an operator escapes a view that
    // broke on one process's data.
    function Harness() {
      const [processId, setProcessId] = useState("p1");
      return (
        <>
          <button type="button" onClick={() => setProcessId("p2")}>
            switch process
          </button>
          <button type="button" onClick={() => setProcessId("p1")}>
            same process
          </button>
          <RepartoErrorBoundary resetKeys={[processId]}>
            <Boom throws={processId === "p1"} />
          </RepartoErrorBoundary>
        </>
      );
    }

    render(<Harness />);
    expect(screen.getByText("This view stopped responding")).toBeTruthy();

    fireEvent.click(screen.getByText("same process"));
    expect(screen.getByText("This view stopped responding")).toBeTruthy();

    fireEvent.click(screen.getByText("switch process"));
    expect(screen.getByText("healthy child")).toBeTruthy();
  });

  it("treats a changed resetKeys length as a change", () => {
    function Harness() {
      const [keys, setKeys] = useState<string[]>(["a"]);
      const [throws, setThrows] = useState(true);
      return (
        <>
          <button
            type="button"
            onClick={() => {
              setThrows(false);
              setKeys(["a", "b"]);
            }}
          >
            grow keys
          </button>
          <RepartoErrorBoundary resetKeys={keys}>
            <Boom throws={throws} />
          </RepartoErrorBoundary>
        </>
      );
    }

    render(<Harness />);
    fireEvent.click(screen.getByText("grow keys"));
    expect(screen.getByText("healthy child")).toBeTruthy();
  });

  it("holds the fallback across a re-render when no resetKeys are given", () => {
    function Harness() {
      const [tick, setTick] = useState(0);
      return (
        <>
          <button type="button" onClick={() => setTick(tick + 1)}>
            re-render
          </button>
          <RepartoErrorBoundary>
            <Boom throws />
          </RepartoErrorBoundary>
        </>
      );
    }

    render(<Harness />);
    fireEvent.click(screen.getByText("re-render"));
    expect(screen.getByText("This view stopped responding")).toBeTruthy();
  });
});
