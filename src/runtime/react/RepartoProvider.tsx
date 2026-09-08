import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  getRepartoAuthAdapter,
  type RepartoAuthAdapter
} from "../authAdapter.js";
import { configureReparto, type RepartoRuntimeConfig } from "../config.js";

export type RepartoContextValue = {
  adapter: RepartoAuthAdapter;
  config?: Partial<RepartoRuntimeConfig>;
};

const RepartoContext = createContext<RepartoContextValue | null>(null);

export function RepartoProvider({
  children,
  config,
  adapter
}: {
  children: ReactNode;
  config?: Partial<RepartoRuntimeConfig>;
  adapter?: RepartoAuthAdapter;
}) {
  if (config) configureReparto(config);
  const resolved = adapter ?? getRepartoAuthAdapter();
  const value = useMemo<RepartoContextValue>(
    () => ({ adapter: resolved, config }),
    [config, resolved]
  );
  // `<RepartoContext>` as the provider, and `use()` in place of `useContext()`
  // below, are React 19-only spellings. This package's `react` peer range is
  // `^18.0.0 || ^19.0.0`, so adopting either would drop React 18 support to
  // buy nothing a consumer can observe. Both suggestions are declined here
  // rather than left to re-surface as noise on every lint run; the day the
  // peer floor moves to 19 is the day to take them.
  // eslint-disable-next-line @eslint-react/no-context-provider
  return <RepartoContext.Provider value={value}>{children}</RepartoContext.Provider>;
}

export function useRepartoContext(): RepartoContextValue {
  // eslint-disable-next-line @eslint-react/no-use-context -- React 18 peer, see above
  const context = useContext(RepartoContext);
  if (!context) throw new Error("useRepartoContext must be used inside RepartoProvider");
  return context;
}
