import type { ReactNode } from "react";

import {
  formatRepartoMessage,
  getRepartoDictionary,
  normalizeRepartoLocale,
  type RepartoLocale
} from "../../i18n/index.js";
import type { RepartoRouteName } from "../../routes.js";
import { useRepartoRouteAccess } from "../useRepartoRole.js";
import { repartoPanelClass } from "../styles.js";
import { RepartoSetupChecklistButton } from "./setup-checklist-dialog.js";
import { RepartoStepHelp } from "./step-help.js";

/**
 * The §8.1 route map's gate: one route, one minimum role, three outcomes.
 *
 * Until the adapter has answered, the route renders neither its content nor a
 * refusal — "not yet" is not "not allowed", and a page that flashed a denial and
 * then took it back would teach a reader to reload past it. Below the route's
 * `view` floor the content is absent rather than empty: a `USER`-role session is
 * a valid platform identity with no capability in this application (§21.1), so
 * there is no reparto view for it to render. Above the floor the route renders
 * in full, and its write affordances are decided separately by the `act` floor —
 * withholding an action is not withholding the data a `READER` is entitled to
 * (§21.4).
 *
 * The guard is a client-side statement about what to show, never the boundary
 * itself: every request behind it is gated again by the service, which is where
 * authorization actually lives.
 *
 * It is also the one place that sees every step: all twenty-two routes pass
 * through it, exactly once each, with the route's own name in hand. That is why
 * the `?` help sits here rather than being repeated in twenty-two views — a
 * step cannot be added without a guard, so a step cannot be added without its
 * help. It is rendered only above the `view` floor: a session that may not see
 * the route is not told how to work it.
 *
 * The setup-checklist button rides in the same toolbar, for the same reason and
 * with one exception: the dashboard's subject *is* the state of the process, so
 * it lays the checklist out in full and is not offered a button that would open
 * a second copy of what is already on the page.
 */
export function RepartoRouteGuard({
  children,
  locale,
  processId,
  route
}: {
  children: ReactNode;
  locale?: RepartoLocale;
  /** The process the route pins the page to, when it names one. */
  processId?: string;
  route: RepartoRouteName;
}) {
  const dict = getRepartoDictionary(locale ?? normalizeRepartoLocale());
  const { access, canView, resolved } = useRepartoRouteAccess(route);

  if (!resolved) {
    return (
      <section
        aria-live="polite"
        className={repartoPanelClass}
        data-reparto-route={route}
        data-reparto-state="checking"
        role="status"
      >
        <p className="text-sm text-muted-foreground">{dict.view.access.checking}</p>
      </section>
    );
  }

  if (!canView) {
    return (
      <section
        className={repartoPanelClass}
        data-reparto-required-role={access.view}
        data-reparto-route={route}
        data-reparto-state="forbidden"
        role="alert"
      >
        <p className="text-sm font-medium">{dict.view.access.forbidden}</p>
        <p className="text-sm text-muted-foreground">
          {formatRepartoMessage(dict.view.access.forbiddenDetail, {
            role: dict.view.access.role[access.view]
          })}
        </p>
      </section>
    );
  }

  return (
    <>
      <RepartoStepHelp
        actions={
          route === "dashboard" ? null : (
            <RepartoSetupChecklistButton locale={locale} processId={processId} />
          )
        }
        locale={locale}
        route={route}
      />
      {children}
    </>
  );
}
