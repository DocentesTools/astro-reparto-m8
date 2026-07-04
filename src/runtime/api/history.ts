import { request } from "../client.js";
import {
  ExportArtifactCreateSchema,
  ExportArtifactPublicSchema,
  ExportArtifactsPublicSchema,
  ProcessVersionCreateSchema,
  ProcessVersionPublicSchema,
  ProcessVersionsPublicSchema,
  VersionComparisonSchema,
  type ExportArtifactCreate,
  type ExportArtifactPublic,
  type ExportArtifactsPublic,
  type ProcessVersionCreate,
  type ProcessVersionPublic,
  type ProcessVersionsPublic,
  type VersionComparison
} from "../schemas.js";

export const history = {
  listVersions: (processId: string) =>
    request<ProcessVersionsPublic>({
      method: "GET",
      path: `/assignment-processes/${processId}/versions`,
      schema: ProcessVersionsPublicSchema,
      auth: true
    }),
  createVersion: (processId: string, body: ProcessVersionCreate = {}) =>
    request<ProcessVersionPublic>({
      method: "POST",
      path: `/assignment-processes/${processId}/versions`,
      body: ProcessVersionCreateSchema.parse(body),
      schema: ProcessVersionPublicSchema,
      auth: true
    }),
  compareVersions: (
    processId: string,
    leftVersionId: string,
    rightVersionId: string
  ) =>
    request<VersionComparison>({
      method: "GET",
      path:
        `/assignment-processes/${processId}/versions/` +
        `${leftVersionId}/compare/${rightVersionId}`,
      schema: VersionComparisonSchema,
      auth: true
    }),
  comparePreviousYear: (processId: string) =>
    request<VersionComparison>({
      method: "GET",
      path: `/assignment-processes/${processId}/compare-previous-year`,
      schema: VersionComparisonSchema,
      auth: true
    }),
  listExports: (processId: string) =>
    request<ExportArtifactsPublic>({
      method: "GET",
      path: `/assignment-processes/${processId}/exports`,
      schema: ExportArtifactsPublicSchema,
      auth: true
    }),
  createExport: (processId: string, body: ExportArtifactCreate) =>
    request<ExportArtifactPublic>({
      method: "POST",
      path: `/assignment-processes/${processId}/exports`,
      body: ExportArtifactCreateSchema.parse(body),
      schema: ExportArtifactPublicSchema,
      auth: true
    })
} as const;
