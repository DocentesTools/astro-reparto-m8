import { isMutablePlanStatus } from "./teachingPlan.js";
import type { ProcessSummary } from "../schemas.js";

/**
 * The one setup-checklist derivation (backend plan §8.2, audit finding `S2-07`).
 *
 * Two surfaces show this checklist — the process picker before a process is
 * selected, and the department-head dashboard after — and they used to derive it
 * twice, from different data, under labels that named neither derivation. The
 * dashboard tested *"a teaching plan exists"* under the label **Add subjects**
 * and *"a plan balance exists"* under **Add classrooms**, and tested
 * `participants.length > 0` twice under two labels; the picker hard-coded its
 * last five steps to "not done". An operator who had added subjects was told to
 * add subjects.
 *
 * So there is exactly one derivation here, its steps are the §8.2 setup workflow
 * grouped by the three stages, and **each step's label states the condition this
 * function actually tests** — the freeze table in `docs/ui-naming-freeze.md` §8
 * carries both columns side by side so the pair cannot drift again.
 *
 * A surface passes only what it has read. A count it did not read is `null`, not
 * `0`: the step is then reported `unknown`, never `pending`, because "we did not
 * look" and "there is nothing there" are different statements and only the
 * second one asks the operator to act.
 */

/** The three stages, matching the `nav.group.*` sidebar groups. */
export type SetupChecklistStage = "configuration" | "planning" | "assignment";

/** One step of the setup workflow; the key is its dictionary key and DOM slot. */
export type SetupChecklistStepKey =
  | "school"
  | "academicYear"
  | "department"
  | "process"
  | "allocation"
  | "participants"
  | "subjects"
  | "classrooms"
  | "groupSubjects"
  | "configurationReview"
  | "teachingPlan"
  | "planBalance"
  | "planLock"
  | "requirements"
  | "meeting";

export type SetupChecklistStepStatus =
  /** The condition holds. */
  | "done"
  /** The condition was tested and does not hold — the operator's next move. */
  | "pending"
  /** The condition could not be tested from what this surface read. */
  | "unknown";

/** Why a step could not be tested, when it could not. */
export type SetupChecklistBlockedReason =
  /** No process is selected, and this step is process-scoped. */
  | "no-process"
  /** This surface did not read the source the condition needs. */
  | "not-observed";

export type SetupChecklistStep = {
  key: SetupChecklistStepKey;
  stage: SetupChecklistStage;
  status: SetupChecklistStepStatus;
  blockedReason: SetupChecklistBlockedReason | null;
};

export type SetupChecklist = {
  steps: readonly SetupChecklistStep[];
  doneCount: number;
  pendingCount: number;
  unknownCount: number;
  /** Total step count — printed rather than a literal, so the two surfaces agree. */
  total: number;
};

/**
 * What a surface has observed.
 *
 * Every field is optional and every count is nullable. `null` means *not read
 * here*; `0` means *read, and empty*.
 */
export type SetupChecklistObservations = {
  schoolCount?: number | null;
  academicYearCount?: number | null;
  departmentCount?: number | null;
  processCount?: number | null;
  /** The process this surface reports on, when one is selected. */
  processId?: string | null;
  /** The process summary or the summarized dashboard — the Stage 2/3 source. */
  summary?: ProcessSummary | null;
  allocationRevisionCount?: number | null;
  participantCount?: number | null;
  subjectCount?: number | null;
  classroomCount?: number | null;
  groupSubjectCount?: number | null;
};

/** The configuration steps `configurationReview` reviews (§8.2 step 8). */
const REVIEWED_STEPS: readonly SetupChecklistStepKey[] = [
  "school",
  "academicYear",
  "department",
  "process",
  "allocation",
  "participants",
  "subjects",
  "classrooms",
  "groupSubjects"
];

/** A step's outcome, before its key and stage are attached. */
type StepOutcome = Pick<SetupChecklistStep, "status" | "blockedReason">;

function fromCount(
  count: number | null | undefined,
  fallback: SetupChecklistBlockedReason
): StepOutcome {
  if (count === null || count === undefined) {
    return { status: "unknown", blockedReason: fallback };
  }
  return { status: count > 0 ? "done" : "pending", blockedReason: null };
}

function settled(done: boolean): StepOutcome {
  return { status: done ? "done" : "pending", blockedReason: null };
}

function unknown(reason: SetupChecklistBlockedReason): StepOutcome {
  return { status: "unknown", blockedReason: reason };
}

/**
 * Build the checklist from what the calling surface has read.
 *
 * The three reference-data steps have a second, cheaper proof: an assignment
 * process carries a school, an academic year and a department as required
 * foreign keys, so a selected process *is* the evidence that all three exist.
 * That is why the dashboard — which never lists them — still reports them done
 * rather than unknown.
 */
export function buildSetupChecklist(
  observations: SetupChecklistObservations = {}
): SetupChecklist {
  const {
    allocationRevisionCount = null,
    academicYearCount = null,
    classroomCount = null,
    departmentCount = null,
    groupSubjectCount = null,
    participantCount = null,
    processCount = null,
    processId = null,
    schoolCount = null,
    subjectCount = null,
    summary = null
  } = observations;

  const hasProcess = processId !== null || summary !== null;
  const processScoped: SetupChecklistBlockedReason = hasProcess
    ? "not-observed"
    : "no-process";

  function referenceData(count: number | null) {
    if (count !== null) return settled(count > 0);
    // A process exists ⇒ its school, year and department exist.
    if (hasProcess) return settled(true);
    return unknown("not-observed");
  }

  const balance = summary?.plan_balance ?? null;
  const planStatus = summary?.plan_status ?? null;

  const steps: SetupChecklistStep[] = [
    { key: "school", stage: "configuration", ...referenceData(schoolCount) },
    {
      key: "academicYear",
      stage: "configuration",
      ...referenceData(academicYearCount)
    },
    {
      key: "department",
      stage: "configuration",
      ...referenceData(departmentCount)
    },
    {
      key: "process",
      stage: "configuration",
      ...(hasProcess
        ? settled(true)
        : fromCount(processCount, "not-observed"))
    },
    {
      key: "allocation",
      stage: "configuration",
      // The revision list is the direct evidence. Without it, a plan balance
      // still answers the question: the allocated group hours are null until
      // leadership has communicated an allocation (§8.3).
      ...(allocationRevisionCount !== null
        ? settled(allocationRevisionCount > 0)
        : balance !== null
          ? settled(balance.group.allocated_group_weekly_hours !== null)
          : unknown(processScoped))
    },
    {
      key: "participants",
      stage: "configuration",
      ...fromCount(participantCount, processScoped)
    },
    {
      key: "subjects",
      stage: "configuration",
      ...fromCount(subjectCount, processScoped)
    },
    {
      key: "classrooms",
      stage: "configuration",
      ...fromCount(classroomCount, processScoped)
    },
    {
      key: "groupSubjects",
      stage: "configuration",
      ...fromCount(groupSubjectCount, processScoped)
    }
  ];

  // §8.2 step 8. Selection and LAN settings (step 7) ship with defaults, so they
  // have no "not done" state of their own to report; this step is where the
  // operator is told to look at them, and it is done once every configuration
  // step above it is.
  const reviewed = steps.filter((step) => REVIEWED_STEPS.includes(step.key));
  steps.push({
    key: "configurationReview",
    stage: "configuration",
    ...(reviewed.some((step) => step.status === "unknown")
      ? unknown(processScoped)
      : settled(reviewed.every((step) => step.status === "done")))
  });

  // Stage 2. §8.2 step 9 ("continue to planning") is this group's first step:
  // creating the teaching plan is what continuing to planning does.
  steps.push(
    {
      key: "teachingPlan",
      stage: "planning",
      ...(summary === null ? unknown(processScoped) : settled(planStatus !== null))
    },
    {
      key: "planBalance",
      stage: "planning",
      ...(summary === null
        ? unknown(processScoped)
        : settled(
            balance !== null && balance.group.is_balanced && balance.teacher.is_balanced
          ))
    },
    {
      key: "planLock",
      stage: "planning",
      ...(summary === null
        ? unknown(processScoped)
        : settled(planStatus !== null && !isMutablePlanStatus(planStatus)))
    },
    {
      key: "requirements",
      stage: "planning",
      ...(summary === null ? unknown(processScoped) : settled(summary.total_slots > 0))
    },
    {
      key: "meeting",
      stage: "assignment",
      ...(summary === null
        ? unknown(processScoped)
        : settled(summary.current_turn !== null || summary.assigned_slots > 0))
    }
  );

  return {
    steps,
    doneCount: steps.filter((step) => step.status === "done").length,
    pendingCount: steps.filter((step) => step.status === "pending").length,
    unknownCount: steps.filter((step) => step.status === "unknown").length,
    total: steps.length
  };
}
