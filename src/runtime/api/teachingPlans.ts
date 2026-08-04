import { request } from "../client.js";
import {
  FeasibilityDiagnosticsReportSchema,
  FeasibilityEvaluationSchema,
  FeasibilityWitnessReportSchema,
  MainMaterializationResultSchema,
  PlanBalanceSchema,
  PlanValidationReportSchema,
  TeachingPlanPublicSchema,
  type FeasibilityDiagnosticsReport,
  type FeasibilityEvaluation,
  type FeasibilityWitnessReport,
  type MainMaterializationResult,
  type PlanBalance,
  type PlanValidationReport,
  type TeachingPlanPublic
} from "../schemas.js";

/**
 * The single intermediate teaching plan owned by an assignment process.
 *
 * `summary` returns the group and teacher-load balances on independent axes.
 * `validations` returns stable machine codes plus entity references; consumers
 * must not infer readiness from display text. Plan creation and main-activity
 * materialization are process-writer operations enforced by the backend.
 */
export const teachingPlans = {
  /** The process's single plan; 404 while none has been created. */
  get: (processId: string) =>
    request<TeachingPlanPublic>({
      method: "GET",
      path: `/assignment-processes/${processId}/teaching-plan`,
      schema: TeachingPlanPublicSchema,
      auth: true
    }),
  /** Create the process's plan; 409 when it already exists. */
  create: (processId: string) =>
    request<TeachingPlanPublic>({
      method: "POST",
      path: `/assignment-processes/${processId}/teaching-plan`,
      schema: TeachingPlanPublicSchema,
      auth: true
    }),
  /** Read both independent planning balances. */
  summary: (processId: string) =>
    request<PlanBalance>({
      method: "GET",
      path: `/assignment-processes/${processId}/teaching-plan/summary`,
      schema: PlanBalanceSchema,
      auth: true
    }),
  /** Read blocking and warning findings without triggering a feasibility solve. */
  validations: (processId: string) =>
    request<PlanValidationReport>({
      method: "GET",
      path: `/assignment-processes/${processId}/teaching-plan/validations`,
      schema: PlanValidationReportSchema,
      auth: true
    }),
  /** Lock a balanced plan after the backend verifies current feasibility. */
  lock: (processId: string) =>
    request<TeachingPlanPublic>({
      method: "POST",
      path: `/assignment-processes/${processId}/teaching-plan/lock`,
      schema: TeachingPlanPublicSchema,
      auth: true
    }),
  /**
   * Run or reuse the serialized bounded solver for the exact current
   * fingerprint (department-head/admin only). Teachers can never trigger a
   * full evaluation; the endpoint reuses a matching cached result instead of
   * re-solving.
   */
  evaluateFeasibility: (processId: string) =>
    request<FeasibilityEvaluation>({
      method: "POST",
      path: `/assignment-processes/${processId}/teaching-plan/feasibility/evaluate`,
      schema: FeasibilityEvaluationSchema,
      auth: true
    }),
  /**
   * Read the latest current evaluation's findings (department-head/admin
   * only). The backend fails closed with 409 when no fingerprint- and
   * generation-matching evaluation exists, so callers must treat an error as
   * "a fresh evaluation is required", never as "no findings".
   */
  feasibilityDiagnostics: (processId: string) =>
    request<FeasibilityDiagnosticsReport>({
      method: "GET",
      path: `/assignment-processes/${processId}/teaching-plan/feasibility/diagnostics`,
      schema: FeasibilityDiagnosticsReportSchema,
      auth: true
    }),
  /**
   * Read the current deterministic mapping for department-head safe-choice
   * filtering. This endpoint is administrator-only; teacher and shared-screen
   * clients must use their coarse readiness projection and never call it.
   */
  feasibilityWitness: (processId: string) =>
    request<FeasibilityWitnessReport>({
      method: "GET",
      path: `/assignment-processes/${processId}/teaching-plan/feasibility/witness`,
      schema: FeasibilityWitnessReportSchema,
      auth: true
    }),
  /**
   * Idempotently create one main activity for each active main matrix cell that
   * does not already have a live materialization.
   */
  materializeMain: (processId: string) =>
    request<MainMaterializationResult>({
      method: "POST",
      path: `/assignment-processes/${processId}/teaching-plan/materialize-main`,
      schema: MainMaterializationResultSchema,
      auth: true
    })
} as const;
