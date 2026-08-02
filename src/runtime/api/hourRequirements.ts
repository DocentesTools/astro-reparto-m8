import { request } from "../client.js";
import {
  HourRequirementCreateSchema,
  HourRequirementPublicSchema,
  HourRequirementsPublicSchema,
  HourRequirementUpdateSchema,
  RequirementGenerationPreviewSchema,
  RequirementGenerationResultSchema,
  RequirementReconcileRequestSchema,
  RequirementReconciliationPreviewSchema,
  RequirementReconciliationResultSchema,
  type HourRequirementCreateInput,
  type HourRequirementPublic,
  type HourRequirementsPublic,
  type HourRequirementUpdate,
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
  reconcile: (
    processId: string,
    body: RequirementReconcileRequestInput
  ) =>
    request<RequirementReconciliationResult>({
      method: "POST",
      path: `/assignment-processes/${processId}/requirements/reconcile`,
      body: RequirementReconcileRequestSchema.parse(body),
      schema: RequirementReconciliationResultSchema,
      auth: true
    }),
  create: (processId: string, body: HourRequirementCreateInput) =>
    request<HourRequirementPublic>({
      method: "POST",
      path: `/assignment-processes/${processId}/requirements/`,
      body: HourRequirementCreateSchema.parse({
        ...body,
        assignment_process_id: processId
      }),
      schema: HourRequirementPublicSchema,
      auth: true
    }),
  update: (
    processId: string,
    requirementId: string,
    body: HourRequirementUpdate
  ) =>
    request<HourRequirementPublic>({
      method: "PATCH",
      path: `/assignment-processes/${processId}/requirements/${requirementId}`,
      body: HourRequirementUpdateSchema.parse(body),
      schema: HourRequirementPublicSchema,
      auth: true
    }),
  remove: (processId: string, requirementId: string) =>
    request<HourRequirementPublic>({
      method: "DELETE",
      path: `/assignment-processes/${processId}/requirements/${requirementId}`,
      schema: HourRequirementPublicSchema,
      auth: true
    })
} as const;
