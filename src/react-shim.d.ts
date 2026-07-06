declare module "react" {
  export type ReactNode = unknown;
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
