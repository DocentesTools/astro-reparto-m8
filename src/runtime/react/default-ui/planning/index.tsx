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
  Shell,
  WithSelectedProcess,
  type EntityViewProps
} from "../process-crud/shared.js";
import { useRepartoTeachingPlanSummary } from "../../hooks.js";
import { PlanningBalanceHeader } from "./balance-header.js";
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
      <MainSubjectMaterialization locale={locale} processId={processId} />
      <MainActivitySyncPanel locale={locale} processId={processId} />
      <SecondaryActivityEditor locale={locale} processId={processId} />
      <PlanLockAndRequirementGeneration locale={locale} processId={processId} />
      <FeasibilityDiagnosticsPanel locale={locale} processId={processId} />
      <AllocationChangeReconciliation locale={locale} processId={processId} />
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
      <WithSelectedProcess locale={locale} processId={processId}>
        {(resolvedProcessId) => (
          <PlanningContent locale={locale} processId={resolvedProcessId} />
        )}
      </WithSelectedProcess>
    </Shell>
  );
}

export { PlanningBalanceHeader } from "./balance-header.js";
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
