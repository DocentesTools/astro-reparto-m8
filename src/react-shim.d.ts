declare module "react" {
  export type ReactNode = unknown;
  /**
   * Second argument of `componentDidCatch`. React types `componentStack` as
   * nullable, and the boundary that consumes this relies on that being true.
   */
  export interface ErrorInfo {
    componentStack?: string | null;
  }
  /**
   * Declared for `RepartoErrorBoundary` (`A-C3`) and nothing else. An error
   * boundary is the one thing in this package that cannot be a function
   * component: `getDerivedStateFromError`/`componentDidCatch` still have no
   * hook equivalent. Only the members that boundary uses are declared, which
   * is the same rule the hooks above follow.
   */
  export class Component<P, S> {
    constructor(props: P);
    readonly props: Readonly<P>;
    state: Readonly<S>;
    setState(next: Partial<S>): void;
    componentDidCatch?(error: unknown, info: ErrorInfo): void;
    componentDidUpdate?(previousProps: Readonly<P>, previousState: Readonly<S>): void;
    render(): ReactNode;
  }
  export function createContext<T>(defaultValue: T): {
    Provider: (props: { value: T; children?: ReactNode }) => unknown;
  };
  export function useContext<T>(context: {
    Provider: (props: { value: T; children?: ReactNode }) => unknown;
  }): T;
  export function useEffect(
    effect: () => void | (() => void),
    deps?: readonly unknown[]
  ): void;
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
  export function useState<T>(
    initial: T | (() => T)
  ): [T, (value: T | ((current: T) => T)) => void];
}

declare module "react/jsx-runtime" {
  export function jsx(type: unknown, props: unknown, key?: unknown): unknown;
  export function jsxs(type: unknown, props: unknown, key?: unknown): unknown;
  export const Fragment: unknown;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elementName: string]: Record<string, unknown>;
  }
}
