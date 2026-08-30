import {
  RepartoRouteGuard,
  Shell,
  useDict,
  WithSelectedProcess,
  type EntityViewProps
} from "../shared.js";
import { repartoFieldCaptionClass } from "../../../styles.js";
import { RepartoToastHost } from "../../../ui/toast-notification.js";
import { LeadershipAllocationPanel } from "../../planning/allocation-reconciliation.js";

/**
 * The leadership allocation on its own Stage 1 route (§8.2 step 2).
 *
 * The revision form always worked and was never gated on `canReconcile` — the
 * defect `S2-06` reported is discoverability and framing. It lived only inside
 * `AllocationChangeReconciliation` on `/planning`, described as reconciling a
 * *change*, so an operator finishing Stage 1 had no reason to open a Stage 2
 * page to enter the number Stage 2 balances against. This route is that reason;
 * the panel itself is the same component, mounted twice.
 */
export function RepartoAllocationView({
  config,
  locale,
  processId
}: EntityViewProps) {
  return (
    <Shell config={config}>
      <RepartoRouteGuard locale={locale} route="allocation">
        <WithSelectedProcess locale={locale} processId={processId}>
          {(resolvedId) => (
            <RepartoAllocationContent locale={locale} processId={resolvedId} />
          )}
        </WithSelectedProcess>
      </RepartoRouteGuard>
    </Shell>
  );
}

function RepartoAllocationContent({ locale, processId }: EntityViewProps) {
  const dict = useDict(locale);

  return (
    <main
      className="not-content flex w-full max-w-none flex-col gap-4 text-foreground"
      data-reparto-route="allocation"
      data-reparto-group="process"
    >
      <RepartoToastHost />
      <header>
        <h1 className="font-semibold">{dict.allocation.pageTitle}</h1>
        <p className={repartoFieldCaptionClass}>{dict.allocation.description}</p>
      </header>
      <LeadershipAllocationPanel locale={locale} processId={processId} />
    </main>
  );
}
