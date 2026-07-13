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
  return <RepartoContext.Provider value={value}>{children}</RepartoContext.Provider>;
}

export function useRepartoContext(): RepartoContextValue {
  const context = useContext(RepartoContext);
  if (!context) throw new Error("useRepartoContext must be used inside RepartoProvider");
  return context;
}
