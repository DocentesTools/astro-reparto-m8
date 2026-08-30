import { formatRepartoMessage } from "../../../../i18n/index.js";
import type {
  HourRequirementPublic,
  SubjectPublic,
  TeachingActivityPublic,
  TeachingPlanPublic
} from "../../../../schemas.js";

import { QueryState, type Dict } from "../shared.js";

export type RequirementActivityGroup = {
  activity: TeachingActivityPublic | null;
  activityId: string;
  label: string;
  slots: HourRequirementPublic[];
};

export function groupRequirementsByActivity(
  rows: readonly HourRequirementPublic[],
  activities: readonly TeachingActivityPublic[],
  subjects: readonly SubjectPublic[],
  dict: Dict
): RequirementActivityGroup[] {
  const activityById = new Map(activities.map((activity) => [activity.id, activity]));
  const subjectById = new Map(subjects.map((subject) => [subject.id, subject]));
  const groups = new Map<string, RequirementActivityGroup>();

  for (const slot of rows) {
    const activity = activityById.get(slot.teaching_activity_id) ?? null;
    const subject = activity ? subjectById.get(activity.subject_id) : undefined;
    const label = activity
      ? formatRepartoMessage(dict.requirements.activityLabel, {
          subject: subject?.name ?? dict.requirements.unknownSubject,
          type: dict.option.activityType[activity.activity_type]
        })
      : dict.requirements.unknownActivity;
    const existing = groups.get(slot.teaching_activity_id);

    if (existing) {
      existing.slots.push(slot);
    } else {
      groups.set(slot.teaching_activity_id, {
        activity,
        activityId: slot.teaching_activity_id,
        label,
        slots: [slot]
      });
    }
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      slots: [...group.slots].sort(
        (left, right) => left.position_index - right.position_index
      )
    }))
    .sort(
      (left, right) =>
        left.label.localeCompare(right.label) ||
        left.activityId.localeCompare(right.activityId)
    );
}

function requirementGenerationState(
  plan: TeachingPlanPublic | undefined,
  dict: Dict
) {
  if (!plan) return dict.requirements.generationState.unavailable;
  if (plan.status === "reconciliation_required") {
    return dict.requirements.generationState.reconciliationRequired;
  }
  if (plan.status === "stale") return dict.requirements.generationState.stale;
  if (plan.status === "requirements_generated") {
    return dict.requirements.generationState.current;
  }
  if (plan.status === "locked") return dict.requirements.generationState.ready;
  return dict.requirements.generationState.notGenerated;
}

export type RequirementsListProps = {
  activities: TeachingActivityPublic[];
  dict: Dict;
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  plan?: TeachingPlanPublic;
  rows: HourRequirementPublic[];
  subjects: SubjectPublic[];
};

export function RequirementsList({
  activities,
  dict,
  error,
  isError,
  isLoading,
  plan,
  rows,
  subjects
}: RequirementsListProps) {
  if (isLoading || isError) {
    return (
      <QueryState
        dict={dict}
        error={error}
        isError={isError}
        isLoading={isLoading}
        label={dict.entity.hourRequirement.plural}
      />
    );
  }

  const groups = groupRequirementsByActivity(rows, activities, subjects, dict);
  const statusCounts = {
    assigned: rows.filter((slot) => slot.status === "assigned").length,
    available: rows.filter((slot) => slot.status === "available").length,
    attention: rows.filter(
      (slot) => slot.status === "stale" || slot.status === "reconciliation_required"
    ).length
  };
  const planStatus = plan
    ? dict.requirements.planStatus[plan.status]
    : dict.requirements.planUnavailable;

  return (
    <>
      <section
        className="grid gap-4 rounded-lg border bg-card p-5 text-card-foreground shadow-sm"
        data-reparto-slot="requirements-generation-status"
        data-teaching-plan-status={plan?.status ?? "unavailable"}
      >
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{dict.requirements.statusTitle}</h2>
          <p className="text-sm text-muted-foreground">
            {requirementGenerationState(plan, dict)}
          </p>
          <p className="text-sm" data-current-generation={plan?.current_generation_number ?? 0}>
            {formatRepartoMessage(dict.requirements.planStatusSummary, {
              generation: plan?.current_generation_number ?? 0,
              status: planStatus
            })}
          </p>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["activities", dict.requirements.metric.activities, groups.length],
            ["slots", dict.requirements.metric.slots, rows.length],
            ["available", dict.requirements.metric.available, statusCounts.available],
            ["assigned", dict.requirements.metric.assigned, statusCounts.assigned],
            ["attention", dict.requirements.metric.attention, statusCounts.attention]
          ].map(([key, label, value]) => (
            <div
              className="rounded-md border bg-muted/30 p-3"
              data-requirement-metric={key}
              key={key}
            >
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="grid gap-4" data-reparto-list="requirements-by-activity">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{dict.requirements.slotsTitle}</h2>
          <p className="text-sm text-muted-foreground">{dict.requirements.slotsDescription}</p>
        </div>
        {groups.length === 0 ? (
          <div
            className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground"
            data-reparto-state="no-generated-requirements"
          >
            {dict.requirements.empty}
          </div>
        ) : (
          groups.map((group) => (
            <article
              className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm"
              data-reparto-requirement-activity=""
              data-teaching-activity-id={group.activityId}
              key={group.activityId}
            >
              <header className="flex flex-wrap items-start justify-between gap-3 border-b bg-muted/30 px-5 py-4">
                <div className="space-y-1">
                  <h3 className="font-semibold">{group.label}</h3>
                  {group.activity?.notes ? (
                    <p className="text-sm text-muted-foreground">{group.activity.notes}</p>
                  ) : null}
                </div>
                <span className="rounded-full border bg-background px-3 py-1 text-xs font-medium">
                  {formatRepartoMessage(dict.requirements.positionCount, {
                    count: group.slots.length
                  })}
                </span>
              </header>
              <ol className="divide-y">
                {group.slots.map((slot) => (
                  <li
                    className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
                    data-requirement-position={slot.position_index}
                    data-requirement-status={slot.status}
                    key={slot.id}
                  >
                    <div>
                      <p className="font-medium">
                        {formatRepartoMessage(dict.requirements.position, {
                          position: slot.position_index + 1
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRepartoMessage(dict.requirements.generationLineage, {
                          created: slot.created_generation,
                          validated: slot.last_validated_generation
                        })}
                      </p>
                      {slot.retired_generation !== null ? (
                        <p
                          className="text-xs text-muted-foreground"
                          data-retired-generation={slot.retired_generation}
                        >
                          {formatRepartoMessage(dict.requirements.retiredLineage, {
                            generation: slot.retired_generation
                          })}
                          {slot.superseded_by_requirement_id
                            ? ` ${dict.requirements.superseded}`
                            : ""}
                        </p>
                      ) : null}
                    </div>
                    <span className="text-sm font-medium tabular-nums">
                      {formatRepartoMessage(dict.requirements.teacherHours, {
                        hours: slot.required_teacher_hours
                      })}
                    </span>
                    <span
                      className="w-fit rounded-full border px-2.5 py-1 text-xs font-medium"
                      data-reparto-slot-status={slot.status}
                    >
                      {dict.entity.hourRequirement.status[slot.status]}
                    </span>
                  </li>
                ))}
              </ol>
            </article>
          ))
        )}
      </section>
    </>
  );
}
