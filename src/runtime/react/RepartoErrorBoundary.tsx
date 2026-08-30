// Named imports rather than a `import * as React` namespace: under this
// package's NodeNext resolution the namespace object does not carry
// `Component`, so the class base has to be imported directly.
import { Component, type ErrorInfo, type ReactNode } from "react";
import {
  repartoActionRowClass,
  repartoButtonClass,
  repartoPanelClass,
  repartoPanelHeaderClass,
  repartoShellClass
} from "./styles.js";

/**
 * Island-root error boundary for the reparto plugin (`A-C3`).
 *
 * Every reparto view is mounted as an Astro island, and with `client:only` the
 * server renders nothing at all — so a render throw leaves the route not merely
 * degraded but permanently empty, with no server-rendered markup underneath to
 * fall back to. This boundary catches the throw and renders the plugin's error
 * surface in place of the view.
 *
 * A class on purpose: `getDerivedStateFromError`/`componentDidCatch` still have
 * no hook equivalent.
 *
 * The prop contract mirrors `@mano8/astro-ui-m8`'s canonical `error-boundary`
 * registry block deliberately, so the two can be collapsed onto one
 * implementation once that block is reachable from this package. It is not
 * reachable today: the block ships in an unpublished `astro-ui-m8`, and copied
 * registry items are consumer-side artifacts rather than package runtime.
 */
export interface RepartoErrorBoundaryFallbackProps {
  error: Error;
  reset: () => void;
}

export interface RepartoErrorBoundaryLabels {
  title: string;
  description: string;
  retry: string;
}

const DEFAULT_LABELS: RepartoErrorBoundaryLabels = {
  title: "This view stopped responding",
  description: "The page hit an unexpected error and could not finish rendering.",
  retry: "Reload this view"
};

export interface RepartoErrorBoundaryProps {
  children: ReactNode;
  /** Replaces the default surface. Receives the error and a `reset`. */
  fallback?: (props: RepartoErrorBoundaryFallbackProps) => ReactNode;
  /** Reporting hook. The boundary never logs on its own. */
  onError?: (error: Error, info: { componentStack: string }) => void;
  /** Clears the boundary when any member changes, compared by `Object.is`. */
  resetKeys?: readonly unknown[];
  /**
   * Copy overrides. Deliberately a prop rather than a lookup in the reparto
   * dictionary: a boundary that reached for `getRepartoDictionary` would run
   * i18n resolution on the one code path that is already known to be broken.
   */
  labels?: Partial<RepartoErrorBoundaryLabels>;
}

interface RepartoErrorBoundaryState {
  error: Error | null;
}

/** `throw "boom"` is legal, so normalize before handing anything on. */
function toError(thrown: unknown): Error {
  if (thrown instanceof Error) return thrown;
  if (typeof thrown === "string") return new Error(thrown);
  return new Error("The view failed to render.");
}

function resetKeysChanged(
  previous: readonly unknown[] | undefined,
  next: readonly unknown[] | undefined
): boolean {
  if (previous === undefined || next === undefined) return false;
  if (previous.length !== next.length) return true;
  return previous.some((value, index) => !Object.is(value, next[index]));
}

export class RepartoErrorBoundary extends Component<
  RepartoErrorBoundaryProps,
  RepartoErrorBoundaryState
> {
  override state: RepartoErrorBoundaryState = { error: null };

  static getDerivedStateFromError(thrown: unknown): RepartoErrorBoundaryState {
    return { error: toError(thrown) };
  }

  override componentDidCatch(thrown: unknown, info: ErrorInfo): void {
    this.props.onError?.(toError(thrown), {
      componentStack: info.componentStack ?? ""
    });
  }

  override componentDidUpdate(previous: RepartoErrorBoundaryProps): void {
    if (this.state.error === null) return;
    if (!resetKeysChanged(previous.resetKeys, this.props.resetKeys)) return;
    this.reset();
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  override render(): ReactNode {
    const { error } = this.state;
    if (error === null) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback({ error, reset: this.reset });
    }

    const labels = { ...DEFAULT_LABELS, ...this.props.labels };

    // The caught message is deliberately not rendered: a render throw here can
    // carry a process id, a teacher name or an API URL, and this is a
    // user-facing surface. A host that wants the detail reads it from
    // `onError` or passes its own `fallback`.
    return (
      <main className={repartoShellClass} data-reparto-route="error-boundary">
        <section className={repartoPanelClass} data-reparto-error-boundary="fallback">
          <div className={repartoPanelHeaderClass}>
            <h2>{labels.title}</h2>
          </div>
          <p className="text-sm text-destructive" role="alert">
            {labels.description}
          </p>
          <div className={repartoActionRowClass}>
            <button
              className={repartoButtonClass}
              data-reparto-action="reset-error-boundary"
              onClick={this.reset}
              type="button"
            >
              {labels.retry}
            </button>
          </div>
        </section>
      </main>
    );
  }
}
