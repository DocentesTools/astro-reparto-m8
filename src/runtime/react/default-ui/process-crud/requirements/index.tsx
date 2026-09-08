import {
  useRepartoHourRequirements,
  useRepartoSubjects,
  useRepartoTeachingActivities,
  useRepartoTeachingPlan
} from "../../../hooks.js";

import {
  RepartoRouteGuard,
  Shell,
  useDict,
  WithSelectedProcess,
  type EntityViewProps
} from "../shared.js";
import { RequirementsList } from "./list.js";

export function RepartoHourRequirementsView({
  config,
  locale,
  processId
}: EntityViewProps) {
  return (
    <Shell config={config}>
      <RepartoRouteGuard locale={locale} processId={processId} route="requirements">
        <WithSelectedProcess locale={locale} processId={processId}>
          {(resolvedId) => (
            <RepartoRequirementsContent locale={locale} processId={resolvedId} />
          )}
        </WithSelectedProcess>
      </RepartoRouteGuard>
    </Shell>
  );
}

function RepartoRequirementsContent({ locale, processId }: EntityViewProps) {
  const dict = useDict(locale);
  const requirementsQuery = useRepartoHourRequirements(processId);
  const activitiesQuery = useRepartoTeachingActivities(processId);
  const subjectsQuery = useRepartoSubjects(processId);
  const planQuery = useRepartoTeachingPlan(processId);
  const queries = [requirementsQuery, activitiesQuery, subjectsQuery, planQuery];
  const failedQuery = queries.find((query) => query.isError);

  return (
    <main
      className="not-content flex w-full max-w-none flex-col gap-4 text-foreground"
      data-reparto-group="process"
      data-reparto-route="requirements"
    >
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {dict.requirements.pageTitle}
        </h1>
        <p className="text-sm text-muted-foreground">{dict.requirements.description}</p>
      </header>
      <RequirementsList
        activities={activitiesQuery.data?.data ?? []}
        dict={dict}
        error={failedQuery?.error}
        isError={Boolean(failedQuery)}
        isLoading={queries.some((query) => query.isLoading)}
        plan={planQuery.data}
        rows={requirementsQuery.data?.data ?? []}
        subjects={subjectsQuery.data?.data ?? []}
      />
    </main>
  );
}
