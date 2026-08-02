import { request } from "../client.js";
import {
  HourRequirementPublicSchema,
  HourRequirementsPublicSchema,
  RequirementGenerationPreviewSchema,
  RequirementGenerationResultSchema,
  RequirementReconcileRequestSchema,
  RequirementReconciliationPreviewSchema,
  RequirementReconciliationResultSchema,
  type HourRequirementPublic,
  type HourRequirementsPublic,
  type RequirementGenerationPreview,
  type RequirementGenerationResult,
  type RequirementReconcileRequestInput,
  type RequirementReconciliationPreview,
  type RequirementReconciliationResult
} from "../schemas.js";

export const hourRequirements = {
  list: (processId: string) =>
    request<HourRequirementsPublic>({
      method: "GET",
      path: `/assignment-processes/${processId}/requirements/`,
      schema: HourRequirementsPublicSchema,
      auth: true
    }),
  get: (processId: string, requirementId: string) =>
    request<HourRequirementPublic>({
      method: "GET",
      path: `/assignment-processes/${processId}/requirements/${requirementId}`,
      schema: HourRequirementPublicSchema,
      auth: true
    }),
  /**
   * Dry-run the next deterministic slot generation. This is deliberately a
   * POST: it performs the same guarded planning computation as `generate` but
   * never mutates rows.
   */
  generationPreview: (processId: string) =>
    request<RequirementGenerationPreview>({
      method: "POST",
      path: `/assignment-processes/${processId}/requirements/generation-preview`,
      schema: RequirementGenerationPreviewSchema,
      auth: true
    }),
  /** Apply the previewed create/preserve/retire plan. */
  generate: (processId: string) =>
    request<RequirementGenerationResult>({
      method: "POST",
      path: `/assignment-processes/${processId}/requirements/generate`,
      schema: RequirementGenerationResultSchema,
      auth: true
    }),
  /** Preview every assigned slot that explicit reconciliation would release. */
  reconciliationPreview: (processId: string) =>
    request<RequirementReconciliationPreview>({
      method: "POST",
      path: `/assignment-processes/${processId}/requirements/reconciliation-preview`,
      schema: RequirementReconciliationPreviewSchema,
      auth: true
    }),
  /**
   * Apply an audited manual resolution. The confirmed conflict count guards
   * against applying a stale preview and the reason is recorded by the service.
   */
  reconcile: (processId: string, body: RequirementReconcileRequestInput) =>
    request<RequirementReconciliationResult>({
      method: "POST",
      path: `/assignment-processes/${processId}/requirements/reconcile`,
      body: RequirementReconcileRequestSchema.parse(body),
      schema: RequirementReconciliationResultSchema,
      auth: true
    })
} as const;
