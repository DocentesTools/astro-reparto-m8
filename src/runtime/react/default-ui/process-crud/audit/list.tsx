import {
  CrudHeader,
  EmptyRow,
  QueryState,
  RowHeader,
  RowShell,
  type Dict
} from "../shared.js";
import type { AuditEventPublic } from "../../../../schemas.js";

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
          rows.map((event) => (
            <RowShell
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
                label={event.event_type}
                labelAttr="audit-event-type"
                caption={`${event.actor_role ?? "—"} · ${event.entity_type ?? "—"}`}
              />
              {event.reason ? (
                <p className="text-xs text-muted-foreground" data-reparto-slot="audit-reason">
                  {event.reason}
                </p>
              ) : null}
            </RowShell>
          ))
        )}
      </ul>
      <QueryState
        error={error}
        isError={isError}
        isLoading={isLoading}
        label={dict.entity.auditEvent.plural}
      />
    </>
  );
}