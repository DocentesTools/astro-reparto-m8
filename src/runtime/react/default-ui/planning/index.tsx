import {
  getRepartoDictionary,
  normalizeRepartoLocale
} from "../../../i18n/index.js";
import {
  repartoHeaderClass,
  repartoPanelClass,
  repartoShellClass
} from "../../styles.js";
import {
  Shell,
  WithSelectedProcess,
  type EntityViewProps
} from "../process-crud/shared.js";

export function RepartoPlanningView({
  config,
  locale,
  processId
}: EntityViewProps) {
  const dict = getRepartoDictionary(locale ?? normalizeRepartoLocale());

  return (
    <Shell config={config}>
      <WithSelectedProcess locale={locale} mode="admin" processId={processId}>
        {(resolvedProcessId) => (
          <main
            className={repartoShellClass}
            data-process-id={resolvedProcessId}
            data-reparto-group="process"
            data-reparto-route="planning"
          >
            <section
              className={repartoPanelClass}
              data-reparto-panel="planning"
            >
              <header className={repartoHeaderClass}>
                <h1>{dict.planning.pageTitle}</h1>
                <p className="text-sm text-muted-foreground">
                  {dict.planning.description}
                </p>
              </header>
            </section>
          </main>
        )}
      </WithSelectedProcess>
    </Shell>
  );
}
