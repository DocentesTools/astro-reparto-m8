import {
  CrudHeader,
  EmptyRow,
  QueryState,
  RowHeader,
  RowShell,
  type Dict
} from "../shared.js";
import type { AuditEventPublic } from "../../../../schemas.js";
import { formatRepartoMessage } from "../../../../i18n/index.js";

function auditLabel(dict: Dict, event: AuditEventPublic) {
  const [eventEntity = "process", eventAction = "updated"] = event.event_type.split(".");
  const entities = dict.audit.entity as Record<string, string>;
  const actions = dict.audit.action as Record<string, string>;
  const roles = dict.audit.role as Record<string, string>;
  const entityKey = event.entity_type ?? eventEntity;
  return {
    captionEntity: entities[entityKey] ?? entityKey.replaceAll("_", " "),
    event: formatRepartoMessage(dict.audit.event, {
      action: actions[eventAction] ?? eventAction.replaceAll("_", " "),
      entity: entities[eventEntity] ?? eventEntity.replaceAll("_", " ")
    }),
    role: event.actor_role ? (roles[event.actor_role] ?? event.actor_role) : "—"
  };
}

export type AuditListProps = {
  dict: Dict;
  rows: AuditEventPublic[];
  error: unknown;
  isError: boolean;
  isLoading: boolean;
};

export function AuditList({
  dict,
  rows,
  error,
  isError,
  isLoading
}: AuditListProps) {
  if (isLoading || isError) {
    return <QueryState dict={dict} error={error} isError={isError} isLoading={isLoading} label={dict.entity.auditEvent.plural} />;
  }
  return (
    <>
      <CrudHeader
        createLabel=""
        canCreate={false}
        createReason={null}
        entityLabel={dict.entity.auditEvent.plural}
        onCreate={() => undefined}
        readOnly
      />
      <ul className="space-y-2 text-sm text-foreground" data-reparto-table="audit-events">
        {rows.length === 0 && !isLoading && !isError ? (
          <EmptyRow label={dict.table.noResults} />
        ) : (
          rows.map((event) => {
            const label = auditLabel(dict, event);
            return <RowShell
              rowAttr="audit-event"
              idAttr="data-audit-event-id"
              idValue={event.id}
              key={event.id}
              extras={{
                "data-audit-event-type": event.event_type,
                "data-audit-entity-type": event.entity_type ?? ""
              }}
            >
              <RowHeader
                label={label.event}
                labelAttr="audit-event-type"
                caption={`${label.role} · ${label.captionEntity}`}
              />
              {event.reason ? (
                <p className="text-xs text-muted-foreground" data-reparto-slot="audit-reason">
                  {event.reason}
                </p>
              ) : null}
            </RowShell>;
          })
        )}
      </ul>
      <QueryState
        dict={dict}
        error={error}
        isError={isError}
        isLoading={isLoading}
        label={dict.entity.auditEvent.plural}
      />
    </>
  );
}
