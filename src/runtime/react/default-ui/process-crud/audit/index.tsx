import { Shell, useDict, WithSelectedProcess, type EntityViewProps } from "../shared.js";
import { resolveProcessId } from "../shared.js";
import { useRepartoAuditEvents } from "../../../hooks.js";

import { AuditList } from "./list.js";

export function RepartoAuditView({ config, locale, processId }: EntityViewProps) {
  return (
    <Shell config={config}>
      <WithSelectedProcess locale={locale} processId={processId}>
        {(resolvedId) => (
          <RepartoAuditContent locale={locale} processId={resolvedId} />
        )}
      </WithSelectedProcess>
    </Shell>
  );
}

function RepartoAuditContent({ locale, processId }: EntityViewProps) {
  const dict = useDict(locale);
  const query = useRepartoAuditEvents(processId);
  const rows = query.data?.data ?? [];

  return (
    <main
      className="not-content mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 text-foreground"
      data-reparto-route="audit"
      data-reparto-group="process"
    >
      <section
        className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
        data-reparto-panel="audit"
      >
        <AuditList
          dict={dict}
          rows={rows}
          error={query.error}
          isError={query.isError}
          isLoading={query.isLoading || !resolveProcessId(processId)}
        />
      </section>
    </main>
  );
}