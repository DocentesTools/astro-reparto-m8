import { request } from "../client.js";
import {
  AuditEventsPublicSchema,
  type AuditEventsPublic
} from "../schemas.js";

export const auditEvents = {
  list: (processId: string) =>
    request<AuditEventsPublic>({
      method: "GET",
      path: `/assignment-processes/${processId}/audit-events/`,
      schema: AuditEventsPublicSchema,
      auth: true
    })
} as const;