import {
  getRepartoDictionary,
  normalizeRepartoLocale
} from "../../../i18n/index.js";
import {
  repartoHeaderClass,
  repartoPanelClass,
  repartoShellClass
} from "../../styles.js";
import {
  RepartoRouteGuard,
  Shell,
  useRepartoCanAct,
  WithSelectedProcess,
  type EntityViewProps
} from "../process-crud/shared.js";
import { useRepartoTeachingPlanSummary } from "../../hooks.js";
import { PlanningBalanceHeader } from "./balance-header.js";
import { TeachingPlanCreation } from "./plan-creation.js";
import { MainSubjectMaterialization } from "./main-materialization.js";
import { MainActivitySyncPanel } from "./activity-sync.js";
import { SecondaryActivityEditor } from "./secondary-activities.js";
import { PlanLockAndRequirementGeneration } from "./plan-generation.js";
import { FeasibilityDiagnosticsPanel } from "./feasibility-diagnostics.js";
import { AllocationChangeReconciliation } from "./allocation-reconciliation.js";

function PlanningContent({
  locale,
  processId
}: {
  locale: EntityViewProps["locale"];
  processId: EntityViewProps["processId"];
}) {
  const dict = getRepartoDictionary(locale ?? normalizeRepartoLocale());
  // Planning below `ADMIN` is the two balances and nothing else. That is not
  // only an affordance rule: every panel underneath either writes (materialize,
  // sync-apply, activity CRUD, lock, generate, reconcile) or reads
  // department-head-only data — the feasibility witness and diagnostics are
  // `CurrentAdmin` on the service — so rendering them for a `READER` would show
  // a surface whose every request comes back 403 (§21.5). The balance header
  // stays, because §8.3 requires both summaries to remain visible and the
  // plan-summary read is at the `READER` floor.
  //
  // Each panel now carries this same floor itself (`PlanningPanelGate`), so a
  // host composing its own planning page is gated too. The block below is kept
  // because it states the rule where the page is read, and because it is what
  // keeps the panels' own gates from mounting at all.
  const canAct = useRepartoCanAct("planning");
  const balanceQuery = useRepartoTeachingPlanSummary(processId);

  return (
    <main
      className={repartoShellClass}
      data-process-id={processId}
      data-reparto-group="process"
      data-reparto-route="planning"
    >
      <section className={repartoPanelClass} data-reparto-panel="planning">
        <header className={repartoHeaderClass}>
          <h1>{dict.planning.pageTitle}</h1>
          <p className="text-sm text-muted-foreground">
            {dict.planning.description}
          </p>
        </header>
      </section>
      <PlanningBalanceHeader
        balance={balanceQuery.data ?? null}
        dict={dict}
        error={balanceQuery.isError ? balanceQuery.error : null}
        isLoading={balanceQuery.isLoading}
      />
      {canAct ? (
        <>
          {/* First, because with no plan every panel below it is a 404. */}
          <TeachingPlanCreation locale={locale} processId={processId} />
          <MainSubjectMaterialization locale={locale} processId={processId} />
          <MainActivitySyncPanel locale={locale} processId={processId} />
          <SecondaryActivityEditor locale={locale} processId={processId} />
          <PlanLockAndRequirementGeneration locale={locale} processId={processId} />
          <FeasibilityDiagnosticsPanel locale={locale} processId={processId} />
          <AllocationChangeReconciliation locale={locale} processId={processId} />
        </>
      ) : null}
    </main>
  );
}

export function RepartoPlanningView({
  config,
  locale,
  processId
}: EntityViewProps) {
  return (
    <Shell config={config}>
      <RepartoRouteGuard locale={locale} processId={processId} route="planning">
        <WithSelectedProcess locale={locale} processId={processId}>
          {(resolvedProcessId) => (
            <PlanningContent locale={locale} processId={resolvedProcessId} />
          )}
        </WithSelectedProcess>
      </RepartoRouteGuard>
    </Shell>
  );
}

export {
  PlanningPanelGate,
  type PlanningPanelProps
} from "./panel-gate.js";
export { PlanningBalanceHeader } from "./balance-header.js";
export { TeachingPlanCreation } from "./plan-creation.js";
export {
  MainSubjectMaterialization,
  MainSubjectMaterializationConfirmation,
  MainSubjectMaterializationTable,
  buildMainSubjectMaterializationRows,
  type MainSubjectMaterializationRow
} from "./main-materialization.js";
export {
  ActivitySyncDifferences,
  ActivitySyncView,
  MainActivitySyncPanel,
  buildActivitySyncRows,
  type ActivitySyncRow
} from "./activity-sync.js";
export {
  SecondaryActivityEditor,
  SecondaryActivityForm,
  SecondaryActivityTable,
  buildSecondaryActivityRequests,
  buildSecondaryActivityRows,
  secondaryActivityFormValues,
  type SecondaryActivityFormResult,
  type SecondaryActivityFormValues,
  type SecondaryActivityRow
} from "./secondary-activities.js";
export {
  PlanLockAndRequirementGeneration,
  PlanLockConfirmation,
  PlanUnlockControl,
  PlanValidationSummary,
  RequirementGenerationPreviewCard,
  RequirementGenerationResultCard,
  isPlanLockAvailable,
  isRequirementGenerationAvailable
} from "./plan-generation.js";
export {
  buildFeasibilityDiagnosticsLookup,
  FeasibilityDiagnosticsPanel,
  FeasibilityDiagnosticsView
} from "./feasibility-diagnostics.js";
export {
  AllocationChangeReconciliation,
  LeadershipAllocationPanel,
  AllocationRevisionHistory,
  ReconciliationStatusCard,
  RequirementReconciliationPreviewCard,
  RequirementReconciliationResultCard,
  buildAllocationRevisionRequest,
  buildReconciliationConflictRows,
  isAllocationReconciliationAvailable,
  isStaleRequirementReconciliationError,
  type AllocationRevisionFormResult,
  type AllocationRevisionFormValues,
  type ReconciliationConflictRow
} from "./allocation-reconciliation.js";
