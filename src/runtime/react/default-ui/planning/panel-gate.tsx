import type { ReactNode } from "react";

import type { RepartoLocale } from "../../../i18n/index.js";
import { useRepartoCanAct } from "../process-crud/shared.js";

/** What every connected planning panel takes, and nothing more. */
export type PlanningPanelProps = {
  locale?: RepartoLocale;
  processId?: string;
};

/**
 * The `planning` write floor, carried by the panel instead of by its mount.
 *
 * Each connected planning panel is a public export and a host may compose its
 * own planning page from them. While the gate lived only in
 * `RepartoPlanningView`, such a host got the entire department-head mutation
 * surface with no floor at all — misleading UI rather than an access hole,
 * since the service still refuses a `WRITER` on every one of these routes, but
 * §21.5 is that an affordance the backend would refuse is worse than none.
 *
 * The gate takes the panel as an element rather than calling it, so below the
 * floor React never renders the child and none of its queries are issued —
 * which matters here because several of them (the feasibility witness, the
 * diagnostics) are `CurrentAdmin` on the service and would answer 403.
 *
 * `RepartoPlanningView` keeps its own `canAct` block. That repeats the
 * decision, not the implementation: both sides ask this one hook, so there is
 * still exactly one comparison behind them (`RBAC-06`).
 */
export function PlanningPanelGate({ children }: { children: ReactNode }) {
  return useRepartoCanAct("planning") ? <>{children}</> : null;
}
