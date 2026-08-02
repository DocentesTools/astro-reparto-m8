import { request } from "../client.js";
import {
  PlanningExportArtifactSchema,
  PlanningImportRequestSchema,
  PlanningImportResultSchema,
  type PlanningExportArtifact,
  type PlanningExportMode,
  type PlanningImportRequest,
  type PlanningImportResult
} from "../schemas.js";

/**
 * Planning-stage import and export (backend plan §3.10, §7.8, §20.25).
 *
 * Three separate endpoints rather than one endpoint with a mode parameter,
 * because the three modes are three different promises:
 *
 * * `draft` and `provisional` are **never refused** for an inexact, unbalanced
 *   or stale plan — the imbalance travels *inside* the artifact, in the two
 *   balances and the finding list, and the caller decides what to do with it;
 * * `final` retains blocking validation and answers 400 when any blocking
 *   finding is present.
 *
 * Every artifact is computed on demand and returned in the response body; none
 * of them is stored, which is what separates them from the checksummed
 * `ExportArtifact` documents in `./history.ts`.
 */
export const planningExchange = {
  /** Working copy of the plan; never blocked by an inexact plan (§3.10). */
  exportDraft: (processId: string) =>
    request<PlanningExportArtifact>({
      method: "POST",
      path: `/assignment-processes/${processId}/exports/planning-draft`,
      schema: PlanningExportArtifactSchema,
      auth: true
    }),
  /**
   * Shareable in-progress plan; never blocked either (§3.10).
   *
   * A provisional document must print the plan's feasibility status beside it
   * (§20.25) so it cannot be mistaken for a validated one.
   */
  exportProvisional: (processId: string) =>
    request<PlanningExportArtifact>({
      method: "POST",
      path: `/assignment-processes/${processId}/exports/planning-provisional`,
      schema: PlanningExportArtifactSchema,
      auth: true
    }),
  /** Strict planning artifact; refused while any blocking finding stands (§7.8). */
  exportFinal: (processId: string) =>
    request<PlanningExportArtifact>({
      method: "POST",
      path: `/assignment-processes/${processId}/exports/planning-final`,
      schema: PlanningExportArtifactSchema,
      auth: true
    }),
  /**
   * Ingest imported activities without requiring an exact plan (§3.10, §7.8).
   *
   * The returned balance and findings are the service's post-import answer;
   * they inform the follow-up reconciliation and never become a client-side
   * precondition for sending the import.
   */
  importPlanning: (processId: string, body: PlanningImportRequest) =>
    request<PlanningImportResult>({
      method: "POST",
      path: `/assignment-processes/${processId}/imports/planning`,
      body: PlanningImportRequestSchema.parse(body),
      schema: PlanningImportResultSchema,
      auth: true
    })
} as const;

/** The wrapper that produces one planning artifact, by mode. */
export function planningExportRequest(
  mode: PlanningExportMode
): (processId: string) => Promise<PlanningExportArtifact> {
  if (mode === "draft") return planningExchange.exportDraft;
  if (mode === "provisional") return planningExchange.exportProvisional;
  return planningExchange.exportFinal;
}
