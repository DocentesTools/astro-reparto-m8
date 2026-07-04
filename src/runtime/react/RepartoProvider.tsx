import { createContext, useContext, useMemo, type ReactNode } from "react";
import { configureReparto, type RepartoRuntimeConfig } from "../config.js";

export type RepartoContextValue = {
  config?: Partial<RepartoRuntimeConfig>;
};

const RepartoContext = createContext<RepartoContextValue | null>(null);

export function RepartoProvider({
  children,
  config
}: {
  children: ReactNode;
  config?: Partial<RepartoRuntimeConfig>;
}) {
  if (config) configureReparto(config);
  const value = useMemo<RepartoContextValue>(() => ({ config }), [config]);
  return <RepartoContext.Provider value={value}>{children}</RepartoContext.Provider>;
}

export function useRepartoContext(): RepartoContextValue {
  const context = useContext(RepartoContext);
  if (!context) throw new Error("useRepartoContext must be used inside RepartoProvider");
  return context;
}
