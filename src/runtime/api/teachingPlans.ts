import { request } from "../client.js";
import {
  MainMaterializationResultSchema,
  PlanBalanceSchema,
  PlanValidationReportSchema,
  TeachingPlanPublicSchema,
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
