import type { PlanBalance } from "../../../schemas.js";
import type { RepartoDictionary } from "../../../i18n/index.js";
import { isMissingTeachingPlanError } from "../../../ui/teachingPlan.js";
import { repartoMetricLabelClass, repartoMetricValueLargeClass } from "../../styles.js";

type BalanceMetric = {
  label: string;
  value: string | null | undefined;
};

function displayHours(value: string | null | undefined): string {
  return value === null || value === undefined ? "—" : `${value} h`;
}

function BalanceAxis({
  label,
  metrics,
  name
}: {
  label: string;
  metrics: readonly BalanceMetric[];
  name: "group" | "teacher";
}) {
  return (
    <section
      aria-label={label}
      className="rounded-md border border-border/70 bg-background/80 p-3"
      data-reparto-balance-axis={name}
    >
      <h3 className="text-sm font-semibold text-foreground">{label}</h3>
      <dl className="mt-2 grid grid-cols-3 gap-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="min-w-0">
            <dt className={repartoMetricLabelClass}>{metric.label}</dt>
            <dd className={repartoMetricValueLargeClass}>
              {displayHours(metric.value)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function PlanningBalanceHeader({
  balance,
  dict,
  error,
  isLoading
}: {
  balance: PlanBalance | null;
  dict: RepartoDictionary;
  error: unknown;
  isLoading: boolean;
}) {
  const groupMetrics = [
    {
      label: dict.planning.target,
      value: balance?.group.allocated_group_weekly_hours
    },
    {
      label: dict.planning.planned,
      value: balance?.group.total_group_load
    },
    {
      label: dict.planning.difference,
      value: balance?.group.allocation_difference
    }
  ] as const;
  const teacherMetrics = [
    {
      label: dict.planning.target,
      value: balance?.teacher.participant_target_total
    },
    {
      label: dict.planning.planned,
      value: balance?.teacher.total_teacher_load
    },
    {
      label: dict.planning.difference,
      value: balance?.teacher.teacher_load_difference
    }
  ] as const;

  return (
    <aside
      aria-busy={isLoading}
      aria-labelledby="reparto-planning-balance-title"
      className="sticky top-3 z-20 rounded-lg border bg-card/95 p-4 text-card-foreground shadow-sm backdrop-blur"
      data-reparto-slot="planning-balance-header"
    >
      <h2 id="reparto-planning-balance-title" className="text-base font-semibold">
        {dict.planning.balanceTitle}
      </h2>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <BalanceAxis
          label={dict.planning.group}
          metrics={groupMetrics}
          name="group"
        />
        <BalanceAxis
          label={dict.planning.teacher}
          metrics={teacherMetrics}
          name="teacher"
        />
      </div>
      {isLoading ? (
        <p className="mt-2 text-xs text-muted-foreground" role="status">
          {dict.planning.loading}
        </p>
      ) : null}
      {/*
        The balance is 404 until the plan exists, which is the documented empty
        state of a process that has just finished Stage 1 — not a failed read.
        Announcing the service's "No teaching plan for process …" as a red
        alert told the operator something was broken when the only thing
        missing was the plan the creation panel now offers.
      */}
      {error && isMissingTeachingPlanError(error) ? (
        <p
          className="mt-2 text-xs text-muted-foreground"
          data-reparto-state="no-plan"
          role="status"
        >
          {dict.planning.noPlanYet}
        </p>
      ) : error ? (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {error instanceof Error ? error.message : dict.planning.unavailable}
        </p>
      ) : null}
    </aside>
  );
}
